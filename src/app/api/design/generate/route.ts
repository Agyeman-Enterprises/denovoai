import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generateAllScreens } from '@/lib/generation/generate-all';

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  // Verify session belongs to user
  const { data: session } = await supabase.from('sessions').select('id').eq('id', sessionId).single();
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const progress = await generateAllScreens(sessionId);
  return NextResponse.json(progress);
}
