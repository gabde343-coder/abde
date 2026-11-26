import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getSupabaseEnv() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

function createAdminClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseEnv();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface AuthenticatedRequest extends Request {
  adminUserId?: string;
}

const VALID_ROLES = new Set(['admin', 'guru', 'tenaga_kependidikan']);

async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) {
    res.status(503).json({
      error: 'Konfigurasi Supabase Service Role belum tersedia di server.',
    });
    return;
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token otorisasi tidak ditemukan.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Token otorisasi kosong.' });
    return;
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir.' });
    return;
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', userData.user.id)
    .single();

  if (profErr || !profile || profile.role !== 'admin') {
    res.status(403).json({ error: 'Akses ditolak. Hanya Administrator yang diizinkan.' });
    return;
  }

  req.adminUserId = userData.user.id;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Public Supabase client configuration (never exposes service role key)
  app.get('/api/config', (_req: Request, res: Response) => {
    const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = getSupabaseEnv();
    res.json({
      configured: Boolean(supabaseUrl && supabaseAnonKey),
      adminConfigured: Boolean(supabaseUrl && supabaseServiceRoleKey),
      supabaseUrl,
      supabaseAnonKey,
    });
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Expose SQL schema so admin/deployer can inspect or copy it cleanly
  app.get('/api/schema-sql', (_req: Request, res: Response) => {
    const schemaPath = path.resolve(__dirname, 'supabase', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      res.status(404).json({ error: 'File schema.sql tidak ditemukan.' });
      return;
    }
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    res.json({ sql });
  });

  // Check if the Supabase project has 0 users so the first user can register as Admin
  app.get('/api/auth/bootstrap-status', async (_req: Request, res: Response) => {
    const supabaseAdmin = createAdminClient();
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

    if (!supabaseUrl || !supabaseAnonKey) {
      res.json({ configured: false, adminConfigured: false, needsFirstAdmin: false });
      return;
    }

    if (!supabaseAdmin) {
      res.json({ configured: true, adminConfigured: false, needsFirstAdmin: false });
      return;
    }

    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json({
        configured: true,
        adminConfigured: true,
        needsFirstAdmin: (data?.users?.length ?? 0) === 0,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Gagal memeriksa status pengguna awal.',
      });
    }
  });

  // One-time registration of the very first user (automatically assigned role 'admin')
  app.post('/api/auth/register-first-admin', async (req: Request, res: Response) => {
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      res.status(503).json({
        error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.',
      });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
    const nip = typeof req.body?.nip === 'string' ? req.body.nip.trim() : '';

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Format email tidak valid.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      return;
    }
    if (!fullName) {
      res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
      return;
    }

    try {
      const { data: existing, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      if (listErr) {
        res.status(500).json({ error: listErr.message });
        return;
      }
      if ((existing?.users?.length ?? 0) > 0) {
        res.status(403).json({
          error: 'Akun Administrator pertama sudah terdaftar. Silakan login atau hubungi Admin.',
        });
        return;
      }

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          nip,
          role: 'admin',
        },
      });

      if (createErr || !created?.user) {
        res.status(400).json({ error: createErr?.message || 'Gagal membuat akun admin.' });
        return;
      }

      // Ensure profiles row exists even if SQL trigger wasn't run yet (best effort)
      const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
        id: created.user.id,
        email,
        full_name: fullName,
        nip,
        role: 'admin',
      });

      if (profErr) {
        res.status(201).json({
          user: { id: created.user.id, email, full_name: fullName, role: 'admin' },
          warning: 'Akun dibuat di Supabase Auth, namun tabel profiles belum siap. Pastikan schema.sql sudah dijalankan.',
        });
        return;
      }

      res.status(201).json({
        user: { id: created.user.id, email, full_name: fullName, role: 'admin' },
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftarkan admin pertama.',
      });
    }
  });

  // Admin User Management: List all users synced with Supabase Authentication
  app.get('/api/admin/users', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Supabase Admin belum terkonfigurasi.' });
      return;
    }

    try {
      const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (authErr) {
        res.status(500).json({ error: authErr.message });
        return;
      }

      const { data: profiles, error: profErr } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, nip, role, created_at, updated_at')
        .order('created_at', { ascending: true });

      if (profErr) {
        res.status(500).json({ error: profErr.message });
        return;
      }

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const merged = (authList?.users || []).map((u) => {
        const prof = profileMap.get(u.id);
        const metaRole = typeof u.user_metadata?.role === 'string' ? u.user_metadata.role : 'tenaga_kependidikan';
        const resolvedRole = prof?.role || (VALID_ROLES.has(metaRole) ? metaRole : 'tenaga_kependidikan');
        return {
          id: u.id,
          email: u.email || prof?.email || '',
          full_name: prof?.full_name || u.user_metadata?.full_name || u.email || 'Pengguna',
          nip: prof?.nip || u.user_metadata?.nip || '',
          role: resolvedRole,
          created_at: prof?.created_at || u.created_at,
          last_sign_in_at: u.last_sign_in_at || null,
          email_confirmed_at: u.email_confirmed_at || null,
        };
      });

      res.json({ users: merged });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Gagal memuat daftar pengguna.',
      });
    }
  });

  // Admin User Management: Create user & sync to Supabase Auth + profiles
  app.post('/api/admin/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Supabase Admin belum terkonfigurasi.' });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
    const nip = typeof req.body?.nip === 'string' ? req.body.nip.trim() : '';
    const role = typeof req.body?.role === 'string' ? req.body.role.trim() : '';

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Format email tidak valid.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      return;
    }
    if (!fullName) {
      res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
      return;
    }
    if (!VALID_ROLES.has(role)) {
      res.status(400).json({ error: 'Role tidak valid.' });
      return;
    }

    try {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          nip,
          role,
        },
      });

      if (createErr || !created?.user) {
        res.status(400).json({ error: createErr?.message || 'Gagal menambahkan pengguna di Supabase Auth.' });
        return;
      }

      const { data: profileData, error: profErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: created.user.id,
          email,
          full_name: fullName,
          nip,
          role,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profErr) {
        // Rollback auth user to maintain strict synchronization
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        res.status(500).json({ error: `Gagal menyinkronkan profil pengguna: ${profErr.message}` });
        return;
      }

      res.status(201).json({
        user: {
          ...profileData,
          last_sign_in_at: created.user.last_sign_in_at || null,
          email_confirmed_at: created.user.email_confirmed_at || null,
        },
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Gagal membuat pengguna baru.',
      });
    }
  });

  // Admin User Management: Update user & sync to Supabase Auth + profiles
  app.patch('/api/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Supabase Admin belum terkonfigurasi.' });
      return;
    }

    const userId = String(req.params.id || '').trim();
    if (!userId) {
      res.status(400).json({ error: 'ID pengguna wajib disertakan.' });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
    const nip = typeof req.body?.nip === 'string' ? req.body.nip.trim() : '';
    const role = typeof req.body?.role === 'string' ? req.body.role.trim() : '';

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Format email tidak valid.' });
      return;
    }
    if (!fullName) {
      res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
      return;
    }
    if (!VALID_ROLES.has(role)) {
      res.status(400).json({ error: 'Role tidak valid.' });
      return;
    }
    if (password && password.length < 6) {
      res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    try {
      const updatePayload: {
        email: string;
        email_confirm: boolean;
        password?: string;
        user_metadata: { full_name: string; nip: string; role: string };
      } = {
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          nip,
          role,
        },
      };

      if (password) {
        updatePayload.password = password;
      }

      const { data: updatedAuth, error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        updatePayload
      );

      if (authErr || !updatedAuth?.user) {
        res.status(400).json({ error: authErr?.message || 'Gagal memperbarui data Supabase Auth.' });
        return;
      }

      const { data: updatedProfile, error: profErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: fullName,
          nip,
          role,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profErr) {
        res.status(500).json({ error: `Gagal memperbarui tabel profiles: ${profErr.message}` });
        return;
      }

      res.json({
        user: {
          ...updatedProfile,
          last_sign_in_at: updatedAuth.user.last_sign_in_at || null,
          email_confirmed_at: updatedAuth.user.email_confirmed_at || null,
        },
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Gagal memperbarui data pengguna.',
      });
    }
  });

  // Admin User Management: Hard delete user from Supabase Authentication + profiles
  app.delete('/api/admin/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Supabase Admin belum terkonfigurasi.' });
      return;
    }

    const userId = String(req.params.id || '').trim();
    if (!userId) {
      res.status(400).json({ error: 'ID pengguna wajib disertakan.' });
      return;
    }

    if (userId === req.adminUserId) {
      res.status(400).json({ error: 'Anda tidak dapat menghapus akun Administrator yang sedang aktif.' });
      return;
    }

    try {
      // Hard delete (shouldSoftDelete = false) removes user permanently from Supabase auth.users
      const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId, false);
      if (deleteErr) {
        res.status(400).json({ error: deleteErr.message });
        return;
      }

      // Ensure profiles row is also removed if cascade was delayed
      await supabaseAdmin.from('profiles').delete().eq('id', userId);

      res.json({ deletedId: userId });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Gagal menghapus pengguna dari Supabase Auth.',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SMK Prima Unggul berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
