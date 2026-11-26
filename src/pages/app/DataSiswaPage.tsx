import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import { JURUSAN_LIST, type JurusanCode, type Student } from '../../types/app';

export default function DataSiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [jurusanFilter, setJurusanFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [nis, setNis] = useState('');
  const [fullName, setFullName] = useState('');
  const [kelas, setKelas] = useState('');
  const [jurusan, setJurusan] = useState<JurusanCode>('TKJ');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('kelas', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStudents((data as Student[]) || []);
      setErrorMsg(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (jurusanFilter !== 'ALL' && s.jurusan !== jurusanFilter) return false;
      if (q) {
        return (
          s.nis.toLowerCase().includes(q) ||
          s.full_name.toLowerCase().includes(q) ||
          s.kelas.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [students, jurusanFilter, searchQuery]);

  const openAddModal = () => {
    setEditingStudent(null);
    setNis('');
    setFullName('');
    setKelas('');
    setJurusan('TKJ');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setNis(student.nis);
    setFullName(student.full_name);
    setKelas(student.kelas);
    setJurusan(student.jurusan);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (!nis.trim() || !fullName.trim() || !kelas.trim()) {
      setFormError('NIS, Nama Lengkap, dan Kelas wajib diisi.');
      return;
    }

    setSaving(true);
    setFormError(null);

    if (editingStudent) {
      const { error } = await supabase
        .from('students')
        .update({
          nis: nis.trim(),
          full_name: fullName.trim(),
          kelas: kelas.trim().toUpperCase(),
          jurusan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingStudent.id);

      setSaving(false);
      if (error) {
        setFormError(error.code === '23505' ? 'NIS tersebut sudah terdaftar.' : error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('students').insert({
        nis: nis.trim(),
        full_name: fullName.trim(),
        kelas: kelas.trim().toUpperCase(),
        jurusan,
      });

      setSaving(false);
      if (error) {
        setFormError(error.code === '23505' ? 'NIS tersebut sudah terdaftar.' : error.message);
        return;
      }
    }

    setModalOpen(false);
    await loadStudents();
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setDeleting(true);
    const { error } = await supabase.from('students').delete().eq('id', deleteTarget.id);
    setDeleting(false);

    if (error) {
      setErrorMsg(error.message);
      setDeleteTarget(null);
      return;
    }

    setDeleteTarget(null);
    await loadStudents();
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIS, nama siswa, atau kelas..."
              className="w-full rounded-lg border border-zinc-300 pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-600"
            />
          </div>

          <select
            value={jurusanFilter}
            onChange={(e) => setJurusanFilter(e.target.value)}
            aria-label="Filter Jurusan"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:border-red-600"
          >
            <option value="ALL">Semua Jurusan</option>
            {JURUSAN_LIST.map((j) => (
              <option key={j.code} value={j.code}>
                {j.code} — {j.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Siswa</span>
        </button>
      </section>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Students Table */}
      <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900">Daftar Siswa SMK Prima Unggul</h2>
          <span className="text-xs font-mono text-zinc-500 tabular-nums">
            Total: {filteredStudents.length} siswa
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-zinc-100 rounded" />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="text-sm font-semibold text-zinc-900">Belum ada data siswa</div>
            <p className="text-xs text-zinc-500">
              Tambahkan siswa pertama agar guru dapat memulai absensi siswa.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Siswa Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                  <th className="py-3 px-6">NIS</th>
                  <th className="py-3 px-6">Nama Siswa</th>
                  <th className="py-3 px-6">Kelas</th>
                  <th className="py-3 px-6">Jurusan</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-6 font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                      {s.nis}
                    </td>
                    <td className="py-3 px-6 font-semibold text-zinc-900">{s.full_name}</td>
                    <td className="py-3 px-6 text-xs text-zinc-700 whitespace-nowrap">{s.kelas}</td>
                    <td className="py-3 px-6 text-xs font-mono font-semibold text-red-600 whitespace-nowrap">
                      {s.jurusan}
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          aria-label={`Edit ${s.full_name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label={`Hapus ${s.full_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="stu-nis" className="block text-xs font-semibold text-zinc-700 mb-1">
                  NIS
                </label>
                <input
                  id="stu-nis"
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Contoh: 20261001"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-zinc-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label htmlFor="stu-name" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="stu-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap siswa"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="stu-jurusan" className="block text-xs font-semibold text-zinc-700 mb-1">
                    Jurusan
                  </label>
                  <select
                    id="stu-jurusan"
                    value={jurusan}
                    onChange={(e) => setJurusan(e.target.value as JurusanCode)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:border-red-600"
                  >
                    {JURUSAN_LIST.map((j) => (
                      <option key={j.code} value={j.code}>
                        {j.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="stu-kelas" className="block text-xs font-semibold text-zinc-700 mb-1">
                    Kelas
                  </label>
                  <input
                    id="stu-kelas"
                    type="text"
                    required
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="Contoh: X TKJ 1"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-red-600"
                  />
                </div>
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
                  {saving ? 'Menyimpan...' : editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white rounded-xl border border-zinc-200 shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Hapus Data Siswa?</h3>
            <p className="text-sm text-zinc-600">
              Data siswa <strong>{deleteTarget.full_name}</strong> ({deleteTarget.nis}) beserta
              riwayat absensinya akan dihapus.
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
                onClick={handleDeleteStudent}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Hapus Siswa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
