import { NextResponse } from "next/server";
import { assembleJobs } from "@/lib/db";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  // Ownership flows through the parent app (join in the repo).
  const job = await assembleJobs.getForUser(jobId, userId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    stage: job.stage,
    progress: job.progress,
    log: job.log || [],
    result: job.result,
    error: job.error,
  });
}
