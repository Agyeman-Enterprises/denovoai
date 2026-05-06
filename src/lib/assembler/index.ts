import { randomUUID } from "crypto";
import fs from "fs/promises";
import { createServiceClient } from "@/lib/supabase/server";
import type { JobStage } from "@/types/database";
import type { SlotMap } from "@/types/denovo";
import { cloneTemplate } from "./clone";
import { substituteTokens } from "./substitute";
import { injectSnippets } from "./inject";
import { generateSchemaExtras } from "./schema";
import { generateEnvFile } from "./env";
import { deployToGitea } from "./deploy";
import { packageDownload } from "./download";

// Safe log append — reads current array, appends, writes back
// No RPC used (append_job_log does not exist in this schema)
async function appendLog(jobId: string, entry: string): Promise<void> {
  const db = createServiceClient();
  const { data } = await db
    .from("assemble_jobs")
    .select("log")
    .eq("id", jobId)
    .single();

  const current = data?.log ?? [];
  await db
    .from("assemble_jobs")
    .update({ log: [...current, entry], updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function setStage(
  jobId: string,
  stage: JobStage,
  progress: number,
  logEntry?: string
): Promise<void> {
  const db = createServiceClient();
  await db
    .from("assemble_jobs")
    .update({ stage, progress, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (logEntry) await appendLog(jobId, logEntry);
}

export async function runAssembly(
  jobId: string,
  appId: string,
  slots: SlotMap,
  outputType: "deploy" | "download"
): Promise<void> {
  // workdir is built from randomUUID() — not a user parameter — safe for path ops
  const uuid = randomUUID();
  const workdir = `/tmp/denovo/${uuid}`;
  const db = createServiceClient();

  try {
    // Step 1: Clone
    await setStage(jobId, "cloning", 10, "→ Cloning template...");
    await cloneTemplate(slots.TEMPLATE, workdir);
    await appendLog(jobId, `✓ Template cloned: ${slots.TEMPLATE}`);

    // Step 2: Token substitution
    await setStage(jobId, "substituting", 25, "→ Substituting tokens...");
    const fileCount = await substituteTokens(workdir, slots);
    await appendLog(jobId, `✓ Substituted tokens across ${fileCount} files`);

    // Step 3: Snippet injection
    await setStage(jobId, "injecting", 45, "→ Injecting snippets...");
    await injectSnippets(workdir, slots.SNIPPETS);
    await appendLog(jobId, `✓ Injected snippets: [${slots.SNIPPETS.join(", ")}]`);

    // Step 4: Schema extras
    await setStage(jobId, "schema", 60, "→ Generating schema extras...");
    await generateSchemaExtras(workdir, slots.SCHEMA_EXTRAS);
    await appendLog(jobId, "✓ Schema extras applied");

    // Step 5: Env file (runs during outputting stage)
    await generateEnvFile(workdir, slots);

    // Step 6: Output
    await setStage(
      jobId,
      "outputting",
      80,
      outputType === "deploy" ? "→ Deploying to infrastructure..." : "→ Packaging zip..."
    );

    let result;
    if (outputType === "deploy") {
      result = await deployToGitea(workdir, slots, appId);
      await appendLog(jobId, `✓ Deployed → ${result.domain}`);
    } else {
      result = await packageDownload(workdir, slots);
      await appendLog(jobId, "✓ Download package ready");
    }

    // Mark job done
    await db
      .from("assemble_jobs")
      .update({
        stage: "done",
        progress: 100,
        result,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // Update app record
    await db
      .from("apps")
      .update({
        status: outputType === "deploy" ? "deploying" : "downloaded",
        ...(result.type === "deploy"
          ? {
              gitea_repo_url: result.giteaUrl ?? null,
              coolify_app_id: result.coolifyAppId ?? null,
              coolify_domain: result.domain ?? null,
            }
          : {
              download_url: result.downloadUrl ?? null,
              download_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", appId);
  } catch (error) {
    await db
      .from("assemble_jobs")
      .update({
        stage: "error",
        error: String(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await db
      .from("apps")
      .update({ status: "failed", error_message: String(error) })
      .eq("id", appId);
  } finally {
    await fs.rm(workdir, { recursive: true, force: true });
  }
}
