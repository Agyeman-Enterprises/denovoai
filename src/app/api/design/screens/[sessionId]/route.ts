import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireUserId, UnauthorizedError, unauthorizedResponse } from '@/lib/session';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { sessionId } = await params;

  // Screens for this session, with their variants nested — scoped to the
  // session's owner (join through public.sessions; there is no RLS now).
  const screens = await sql`
    SELECT s.*,
           COALESCE(json_agg(v.* ORDER BY v.created_at DESC) FILTER (WHERE v.id IS NOT NULL), '[]') AS variants
    FROM design.screens s
    JOIN public.sessions ss ON ss.id = s.session_id
    LEFT JOIN design.variants v ON v.screen_id = s.id
    WHERE s.session_id = ${sessionId} AND ss.user_id = ${userId}
    GROUP BY s.id
    ORDER BY s.position`;

  return NextResponse.json({ screens });
}
