import { NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, appId, outputType } = await request.json();

  if (!sessionId || !appId || !outputType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check credits
  const serviceClient = createServiceClient();
  const { data: sub } = await serviceClient
    .from("subscriptions")
    .select("credits_remaining")
    .eq("user_id", user.id)
    .single();

  if (!sub || sub.credits_remaining < 1) {
    return NextResponse.json({ error: "No credits remaining. Please upgrade or purchase credits." }, { status: 402 });
  }

  // Deduct credit
  await serviceClient
    .from("subscriptions")
    .update({ credits_remaining: sub.credits_remaining - 1, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  // Update app status
  await serviceClient
    .from("apps")
    .update({ status: "assembling", output_type: outputType, updated_at: new Date().toISOString() })
    .eq("id", appId);

  // Create assemble job
  const { data: job, error: jobError } = await serviceClient
    .from("assemble_jobs")
    .insert({
      app_id: appId,
      stage: "cloning",
      progress: 0,
      log: ["Assembly started..."],
    })
    .select()
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Run assembly pipeline in background (non-blocking)
  runAssemblyPipeline(job.id, appId, outputType).catch(console.error);

  return NextResponse.json({
    jobId: job.id,
    estimatedSeconds: outputType === "deploy" ? 30 : 10,
  });
}

async function runAssemblyPipeline(jobId: string, appId: string, outputType: string) {
  const supabase = createServiceClient();

  const updateJob = async (stage: string, progress: number, logMsg: string) => {
    const { data: current } = await supabase
      .from("assemble_jobs")
      .select("log")
      .eq("id", jobId)
      .single();
    const logs = [...((current?.log as string[]) || []), logMsg];
    await supabase
      .from("assemble_jobs")
      .update({ stage, progress, log: logs, updated_at: new Date().toISOString() })
      .eq("id", jobId);
  };

  try {
    // Step 1: Clone template
    await updateJob("cloning", 10, "Cloning template repository...");
    // Stub — Gitea API call would go here
    await new Promise((r) => setTimeout(r, 1000));
    await updateJob("cloning", 20, "Template cloned successfully");

    // Step 2: Token substitution
    await updateJob("substituting", 30, "Applying slot map tokens...");
    await new Promise((r) => setTimeout(r, 1000));
    await updateJob("substituting", 45, "Tokens substituted across all files");

    // Step 3: Snippet injection
    await updateJob("injecting", 50, "Injecting feature snippets...");
    await new Promise((r) => setTimeout(r, 1000));
    await updateJob("injecting", 60, "Snippets injected and registered");

    // Step 4: Schema generation
    await updateJob("schema", 70, "Generating database schema extras...");
    await new Promise((r) => setTimeout(r, 500));
    await updateJob("schema", 75, "Schema migration updated");

    // Step 5-6: Output
    await updateJob("outputting", 80, `Preparing ${outputType} output...`);
    await new Promise((r) => setTimeout(r, 1500));

    if (outputType === "deploy") {
      // Stub — Gitea + Coolify API calls would go here
      await updateJob("done", 100, "App deployed successfully!");
      await supabase
        .from("assemble_jobs")
        .update({
          stage: "done",
          progress: 100,
          result: {
            type: "deploy",
            giteaUrl: "https://gitea.example.com/denovo-apps/stub-repo",
            coolifyAppId: "stub-coolify-id",
            domain: "https://app.example.com",
          },
        })
        .eq("id", jobId);

      await supabase
        .from("apps")
        .update({
          status: "live",
          gitea_repo_url: "https://gitea.example.com/denovo-apps/stub-repo",
          coolify_app_id: "stub-coolify-id",
          coolify_domain: "https://app.example.com",
          updated_at: new Date().toISOString(),
        })
        .eq("id", appId);
    } else {
      // Stub — zip + upload to Supabase Storage would go here
      await updateJob("done", 100, "Download package ready!");
      await supabase
        .from("assemble_jobs")
        .update({
          stage: "done",
          progress: 100,
          result: {
            type: "download",
            downloadUrl: "https://example.com/stub-download.zip",
          },
        })
        .eq("id", jobId);

      await supabase
        .from("apps")
        .update({
          status: "downloaded",
          download_url: "https://example.com/stub-download.zip",
          download_expires_at: new Date(Date.now() + 3600000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", appId);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("assemble_jobs")
      .update({ stage: "error", error: errorMsg, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    await supabase
      .from("apps")
      .update({ status: "failed", error_message: errorMsg, updated_at: new Date().toISOString() })
      .eq("id", appId);
  }
}
