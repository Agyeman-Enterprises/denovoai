import { NextResponse } from 'next/server';
import { sessions } from '@/lib/db';
import { requireUserId, UnauthorizedError, unauthorizedResponse } from '@/lib/session';
import { generateInventory } from '@/lib/generation/inventory';

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

  const session = await sessions.getForUser(sessionId, userId);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const slotMap = (session.slot_map as Record<string, unknown>) ?? {};
  const messages = (session.messages as Array<{ role: string; content: string }>) ?? [];
  const appDesc = [slotMap['APP_NAME'], slotMap['TAGLINE'], `Template: ${slotMap['TEMPLATE']}`]
    .filter(Boolean).join(' — ');
  const userMsgs = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content).join('\n');

  const screens = await generateInventory(appDesc, userMsgs);
  return NextResponse.json({ screens });
}
