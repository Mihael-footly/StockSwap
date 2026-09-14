import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { storageUnavailable } from './errors';

type SupabaseEnv = { url: string; key: string };

function env(): SupabaseEnv | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export function isSupabaseConfigured() {
  return env() !== null;
}

let client: SupabaseClient | undefined;
let clientKey: string | undefined;

export function supabaseAdmin(): SupabaseClient {
  const values = env();
  if (!values) throw storageUnavailable();
  const cacheKey = `${values.url}:${values.key}`;
  if (!client || clientKey !== cacheKey) {
    client = createClient(values.url, values.key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    clientKey = cacheKey;
  }
  return client;
}
