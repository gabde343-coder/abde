import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, ShieldAlert, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateIndo } from '../../lib/formatters';
import { ROLE_LABELS, type ManagedUser, type UserRole } from '../../types/app';

export default function UserManagementPage() {
  const { session, profile, config } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Hard Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || 'Gagal memuat daftar pengguna dari Supabase Auth.');
      } else {
        setUsers((data?.users as ManagedUser[]) || []);
      }
    } catch {
      setErrorMsg('Gagal menghubungi server manajemen pengguna.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (q) {
        return (
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.nip || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setNip('');
    setRole('guru');
    setPassword('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (u: ManagedUser) => {
    setEditingUser(u);
    setFullName(u.full_name);
    setEmail(u.email);
    setNip(u.nip || '');
    setRole(u.role);
    setPassword('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    if (!fullName.trim() || !email.trim()) {
      setFormError('Nama lengkap dan email wajib diisi.');
      return;
    }
    if (!editingUser && password.length < 6) {
      setFormError('Kata sandi minimal 6 karakter untuk pengguna baru.');
      return;
    }
    if (editingUser && password && password.length < 6) {
      setFormError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          nip: nip.trim(),
          role,
          password: password || undefined,
        }),
      });
      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setFormError(data?.error || 'Gagal menyimpan data pengguna.');
        return;
      }

      setModalOpen(false);
      await loadUsers();
    } catch {
      setSaving(false);
      setFormError('Terjadi kesalahan koneksi saat menyimpan pengguna.');
    }
  };

  const handleHardDelete = async () => {
    if (!deleteTarget || !session?.access_token) return;

    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      setDeleting(false);

      if (!res.ok) {
        setErrorMsg(data?.error || 'Gagal menghapus pengguna.');
        setDeleteTarget(null);
        return;
      }

      setDeleteTarget(null);
      await loadUsers();
    } catch {
      setDeleting(false);
      setErrorMsg('Gagal menghubungi server saat menghapus pengguna.');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {!config.adminConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-bold">SUPABASE_SERVICE_ROLE_KEY belum diatur.</span> Tambahkan
            Service Role Key di Secrets / <code className="font-mono">.env</code> server agar fitur
            sinkronisasi tambah, edit, dan hard delete pengguna ke Supabase Authentication dapat
            berjalan.
          </div>
        </div>
      )}

      {/* Toolbar */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, atau NIP..."
              className="w-full rounded-lg border border-zinc-300 pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-600"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter Role"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:border-red-600"
          >
            <option value="ALL">Semua Role</option>
            <option value="admin">Administrator</option>
            <option value="guru">Guru</option>
            <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah User Baru</span>
        </button>
      </section>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Users Table */}
      <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">
              Manajemen Pengguna (Tersinkron Supabase Authentication)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Penambahan, perubahan, dan penghapusan permanen langsung disinkronkan ke auth.users
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 tabular-nums">
            {filteredUsers.length} pengguna
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 bg-zinc-100 rounded" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Tidak ada data pengguna yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                  <th className="py-3 px-6">Nama &amp; Email</th>
                  <th className="py-3 px-6">NIP</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Terdaftar</th>
                  <th className="py-3 px-6">Login Terakhir</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === profile?.id;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-6">
                        <div className="font-semibold text-zinc-900">
                          {u.full_name}{' '}
                          {isSelf && <span className="text-xs text-red-600 font-medium">(Anda)</span>}
                        </div>
                        <div className="text-xs text-zinc-500">{u.email}</div>
                      </td>
                      <td className="py-3 px-6 font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                        {u.nip || '—'}
                      </td>
                      <td className="py-3 px-6 text-xs font-semibold text-zinc-800 whitespace-nowrap">
                        {ROLE_LABELS[u.role]}
                      </td>
                      <td className="py-3 px-6 text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                        {formatDateIndo(u.created_at)}
                      </td>
                      <td className="py-3 px-6 text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                        {u.last_sign_in_at ? formatDateIndo(u.last_sign_in_at) : 'Belum pernah'}
                      </td>
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                            aria-label={`Edit ${u.full_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Hapus permanen ${u.full_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="u-name" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="u-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap karyawan"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label htmlFor="u-email" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Email (Supabase Auth)
                </label>
                <input
                  id="u-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@smkprimaunggul.sch.id"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="u-role" className="block text-xs font-semibold text-zinc-700 mb-1">
                    Role
                  </label>
                  <select
                    id="u-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:border-red-600"
                  >
                    <option value="admin">Administrator</option>
                    <option value="guru">Guru</option>
                    <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="u-nip" className="block text-xs font-semibold text-zinc-700 mb-1">
                    NIP / NUPTK
                  </label>
                  <input
                    id="u-nip"
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Opsional"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-zinc-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="u-pass" className="block text-xs font-semibold text-zinc-700 mb-1">
                  {editingUser ? 'Kata Sandi Baru (Kosongkan jika tetap)' : 'Kata Sandi'}
                </label>
                <input
                  id="u-pass"
                  type="password"
                  required={!editingUser}
                  minLength={editingUser ? undefined : 6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? 'Opsional, minimal 6 karakter' : 'Minimal 6 karakter'}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Menyinkronkan...' : editingUser ? 'Simpan Perubahan' : 'Buat Akun User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hard Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">
              Hapus Permanen Pengguna (Hard Delete)?
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Akun <strong>{deleteTarget.full_name}</strong> ({deleteTarget.email}) akan dihapus
              secara permanen dari <strong>Supabase Authentication</strong> dan tabel profil,
              termasuk riwayat absensi karyawannya. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleHardDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
