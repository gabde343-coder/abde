import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { initSupabase, isMissingTableError, type SupabaseRuntimeConfig } from '../lib/supabase';
import type { Profile, UserRole } from '../types/app';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  config: SupabaseRuntimeConfig;
  schemaMissing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [config, setConfig] = useState<SupabaseRuntimeConfig>({
    configured: false,
    adminConfigured: false,
    supabaseUrl: '',
    supabaseAnonKey: '',
  });

  const loadUserProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    const { client } = await initSupabase();
    if (!client) {
      setProfile(null);
      return;
    }

    const { data, error } = await client
      .from('profiles')
      .select('id, email, full_name, nip, role, created_at, updated_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        setSchemaMissing(true);
      }
      // Fallback profile from auth metadata if profiles query fails
      const metaRole = authUser.user_metadata?.role;
      const validRole: UserRole =
        metaRole === 'admin' || metaRole === 'guru' || metaRole === 'tenaga_kependidikan'
          ? metaRole
          : 'tenaga_kependidikan';
      setProfile({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.email || 'Pengguna',
        nip: authUser.user_metadata?.nip || '',
        role: validRole,
        created_at: authUser.created_at,
      });
      return;
    }

    setSchemaMissing(false);
    if (data) {
      setProfile(data as Profile);
    } else {
      const metaRole = authUser.user_metadata?.role;
      const validRole: UserRole =
        metaRole === 'admin' || metaRole === 'guru' || metaRole === 'tenaga_kependidikan'
          ? metaRole
          : 'tenaga_kependidikan';
      setProfile({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.email || 'Pengguna',
        nip: authUser.user_metadata?.nip || '',
        role: validRole,
        created_at: authUser.created_at,
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    (async () => {
      const { client, config: loadedConfig } = await initSupabase();
      if (!mounted) return;
      setConfig(loadedConfig);

      if (!client) {
        setLoading(false);
        return;
      }

      const {
        data: { session: initialSession },
      } = await client.auth.getSession();

      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      await loadUserProfile(initialSession?.user ?? null);
      if (mounted) {
        setLoading(false);
      }

      const { data: listener } = client.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        await loadUserProfile(nextSession?.user ?? null);
      });
      subscription = listener.subscription;
    })();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { client } = await initSupabase();
    if (!client) {
      return { error: 'Koneksi Supabase belum dikonfigurasi.' };
    }
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const { client } = await initSupabase();
    if (client) {
      await client.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadUserProfile(user);
  }, [loadUserProfile, user]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        config,
        schemaMissing,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
