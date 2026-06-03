import { NextResponse } from 'next/server';
import { sessions } from '@/lib/db';
import { requireUserId, UnauthorizedError, unauthorizedResponse } from '@/lib/session';
import { generateAllScreens } from '@/lib/generation/generate-all';

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  // Verify session belongs to user
  const session = await sessions.getForUser(sessionId, userId);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const progress = await generateAllScreens(sessionId);
  return NextResponse.json(progress);
}
