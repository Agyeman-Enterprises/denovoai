import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const DESIGN_SCHEMA = 'design';

function createDesignClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Service role key for write operations (trawl ingestion)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

let client: SupabaseClient | null = null;

export function getDesignSupabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (!client) client = createDesignClient();
  return client;
}
