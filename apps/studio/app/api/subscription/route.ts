import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ plan: 'free', runCount: 0, runLimit: 3 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ plan: 'free', runCount: 0, runLimit: 3 })
  }

  const month = new Date().toISOString().slice(0, 7)

  const [subResult, countResult] = await Promise.all([
    supabase
      .schema('denovo')
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single(),
    supabase
      .schema('denovo')
      .from('run_counts')
      .select('count')
      .eq('user_id', user.id)
      .eq('month', month)
      .single(),
  ])

  const plan = subResult.data?.plan ?? 'free'
  const runCount = countResult.data?.count ?? 0
  const runLimit = plan === 'pro' ? Infinity : 3

  return NextResponse.json({ plan, runCount, runLimit, month })
}
