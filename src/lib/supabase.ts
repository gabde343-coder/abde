import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseRuntimeConfig {
  configured: boolean;
  adminConfigured: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

let cachedClient: SupabaseClient | null = null;
let cachedConfig: SupabaseRuntimeConfig | null = null;
let initPromise: Promise<{ client: SupabaseClient | null; config: SupabaseRuntimeConfig }> | null = null;

export async function initSupabase(): Promise<{
  client: SupabaseClient | null;
  config: SupabaseRuntimeConfig;
}> {
  if (cachedConfig) {
    return { client: cachedClient, config: cachedConfig };
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
    const envAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

    let config: SupabaseRuntimeConfig = {
      configured: Boolean(envUrl && envAnon),
      adminConfigured: false,
      supabaseUrl: envUrl,
      supabaseAnonKey: envAnon,
    };

    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = (await res.json()) as SupabaseRuntimeConfig;
        config = {
          configured: Boolean(data.supabaseUrl && data.supabaseAnonKey),
          adminConfigured: Boolean(data.adminConfigured),
          supabaseUrl: data.supabaseUrl || envUrl,
          supabaseAnonKey: data.supabaseAnonKey || envAnon,
        };
      }
    } catch {
      // Fallback to Vite env vars if backend config endpoint unreachable
    }

    cachedConfig = config;
    if (config.configured && config.supabaseUrl && config.supabaseAnonKey) {
      cachedClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }

    return { client: cachedClient, config };
  })();

  return initPromise;
}

export function getSupabaseClient(): SupabaseClient | null {
  return cachedClient;
}

export function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (typeof error.message === 'string' &&
      (error.message.includes('does not exist') || error.message.includes('Could not find the table')))
  );
}
