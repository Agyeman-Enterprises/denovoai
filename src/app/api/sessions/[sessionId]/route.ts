import { NextResponse } from "next/server";
import { sessions } from "@/lib/db";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const session = await sessions.getForUser(sessionId, userId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json(session);
}
