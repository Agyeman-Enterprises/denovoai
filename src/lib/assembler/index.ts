import { randomUUID } from "crypto";
import fs from "fs/promises";
import { sql } from "@/lib/db";
import type { AssembleStage } from "@/types/db";
import type { SlotMap } from "@/types/denovo";
import { cloneTemplate } from "./clone";
import { substituteTokens } from "./substitute";
import { injectSnippets } from "./inject";
import { generateSchemaExtras } from "./schema";
import { generateEnvFile } from "./env";
import { deployToGitea } from "./deploy";
import { packageDownload } from "./download";

// Atomic log append (array_append — no read-modify-write race).
async function appendLog(jobId: string, entry: string): Promise<void> {
  await sql`
    UPDATE assemble_jobs SET log = array_append(log, ${entry}), updated_at = now()
    WHERE id = ${jobId}`;
}

async function setStage(
  jobId: string,
  stage: AssembleStage,
  progress: number,
  logEntry?: string,
): Promise<void> {
  await sql`UPDATE assemble_jobs SET stage = ${stage}, progress = ${progress}, updated_at = now() WHERE id = ${jobId}`;
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
    await sql`
      UPDATE assemble_jobs SET stage = 'done', progress = 100, result = ${sql.json(result as never)}, updated_at = now()
      WHERE id = ${jobId}`;

    // Update app record
    const appPatch: Record<string, unknown> =
      result.type === "deploy"
        ? {
            status: "deploying",
            gitea_repo_url: result.giteaUrl ?? null,
            coolify_app_id: result.coolifyAppId ?? null,
            coolify_domain: result.domain ?? null,
          }
        : {
            status: "downloaded",
            download_url: result.downloadUrl ?? null,
            download_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          };
    await sql`UPDATE apps SET ${sql(appPatch)}, updated_at = now() WHERE id = ${appId}`;
  } catch (error) {
    await sql`UPDATE assemble_jobs SET stage = 'error', error = ${String(error)}, updated_at = now() WHERE id = ${jobId}`;
    await sql`UPDATE apps SET status = 'failed', error_message = ${String(error)}, updated_at = now() WHERE id = ${appId}`;
  } finally {
    await fs.rm(workdir, { recursive: true, force: true });
  }
}
