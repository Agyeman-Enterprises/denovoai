import { NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { runAssembly } from "@/lib/assembler";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, appId, outputType } = await request.json();

  if (!appId || !outputType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Fetch slot_map from session — not passed directly in request
  const { data: session } = await serviceClient
    .from("sessions")
    .select("slot_map")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session?.slot_map) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Check credits
  const { data: sub } = await serviceClient
    .from("subscriptions")
    .select("credits_remaining")
    .eq("user_id", user.id)
    .single();

  if (!sub || sub.credits_remaining < 1) {
    return NextResponse.json(
      { error: "No credits remaining. Please upgrade or purchase credits." },
      { status: 402 }
    );
  }

  // Deduct credit
  await serviceClient
    .from("subscriptions")
    .update({
      credits_remaining: sub.credits_remaining - 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  // Update app status
  await serviceClient
    .from("apps")
    .update({
      status: "assembling",
      output_type: outputType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appId);

  // Create job — assemble_jobs has no user_id, output_type, or started_at columns
  // stage must be a valid JobStage — 'queued' does not exist, use 'cloning'
  const { data: job, error: jobError } = await serviceClient
    .from("assemble_jobs")
    .insert({
      app_id: appId,
      stage: "cloning",
      progress: 0,
      log: ["Assembly queued..."],
    })
    .select()
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Fire and forget — pipeline runs in background
  runAssembly(job.id, appId, session.slot_map as Parameters<typeof runAssembly>[2], outputType).catch(
    console.error
  );

  return NextResponse.json({
    jobId: job.id,
    estimatedSeconds: outputType === "deploy" ? 45 : 15,
  });
}
