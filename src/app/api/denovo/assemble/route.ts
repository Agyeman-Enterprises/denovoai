import { NextResponse } from "next/server";
import { sessions, subscriptions, apps, assembleJobs } from "@/lib/db";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { runAssembly } from "@/lib/assembler";
import { enqueueAssembly } from "@/lib/queue";
import type { SlotMap } from "@/types/denovo";

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { sessionId, appId, outputType } = await request.json();
  if (!appId || !outputType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the app belongs to this user before doing anything chargeable.
  const app = await apps.getForUser(appId, userId);
  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Pull slot_map from the user's session.
  const session = await sessions.getForUser(sessionId, userId);
  if (!session?.slot_map) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Atomic credit consume — fails if none remaining.
  const consumed = await subscriptions.tryConsumeCredit(userId);
  if (!consumed) {
    return NextResponse.json(
      { error: "No credits remaining. Please upgrade or purchase credits." },
      { status: 402 },
    );
  }

  await apps._serviceUpdateStatus(appId, { status: "assembling", output_type: outputType });

  const job = await assembleJobs.create(appId);
  const slotMap = session.slot_map as unknown as SlotMap;

  // Durable offload to ae-queue; the worker calls back /api/internal/assemble/run.
  // Falls back to inline execution when ae-queue isn't configured (local dev) or
  // the enqueue fails, so assembly still happens.
  let queueJobId: string | null = null;
  try {
    queueJobId = await enqueueAssembly({ jobId: job.id, appId, slotMap, outputType });
  } catch (e) {
    console.error("ae-queue enqueue failed; running assembly inline", e);
  }

  if (queueJobId) {
    await assembleJobs.setQueueJobId(job.id, queueJobId);
  } else {
    runAssembly(job.id, appId, slotMap, outputType).catch(console.error);
  }

  return NextResponse.json({
    jobId: job.id,
    estimatedSeconds: outputType === "deploy" ? 45 : 15,
  });
}
