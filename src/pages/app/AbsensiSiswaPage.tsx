import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Save, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import { getTodayDateString } from '../../lib/formatters';
import {
  JURUSAN_LIST,
  type Student,
  type StudentAttendance,
  type StudentAttendanceStatus,
} from '../../types/app';

interface DraftEntry {
  status: StudentAttendanceStatus;
  notes: string;
}

export default function AbsensiSiswaPage() {
  const { profile } = useAuth();
  const [date, setDate] = useState(() => getTodayDateString());
  const [jurusanFilter, setJurusanFilter] = useState<string>('ALL');
  const [kelasFilter, setKelasFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedback(null);

    const [{ data: studentRows, error: stuErr }, { data: attRows, error: attErr }] =
      await Promise.all([
        supabase.from('students').select('*').order('kelas', { ascending: true }).order('full_name'),
        supabase.from('student_attendances').select('*').eq('attendance_date', date),
      ]);

    if (stuErr || attErr) {
      setFeedback({
        type: 'error',
        message: stuErr?.message || attErr?.message || 'Gagal memuat data siswa.',
      });
      setLoading(false);
      return;
    }

    const stuList = (studentRows as Student[]) || [];
    const attMap = new Map(
      ((attRows as StudentAttendance[]) || []).map((a) => [a.student_id, a])
    );

    const nextDrafts: Record<string, DraftEntry> = {};
    for (const s of stuList) {
      const existing = attMap.get(s.id);
      nextDrafts[s.id] = {
        status: existing?.status ?? 'hadir',
        notes: existing?.notes ?? '',
      };
    }

    setStudents(stuList);
    setDrafts(nextDrafts);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableClasses = useMemo(() => {
    const filtered =
      jurusanFilter === 'ALL'
        ? students
        : students.filter((s) => s.jurusan === jurusanFilter);
    return Array.from(new Set(filtered.map((s) => s.kelas))).sort();
  }, [students, jurusanFilter]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (jurusanFilter !== 'ALL' && s.jurusan !== jurusanFilter) return false;
      if (kelasFilter !== 'ALL' && s.kelas !== kelasFilter) return false;
      if (q && !s.full_name.toLowerCase().includes(q) && !s.nis.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [students, jurusanFilter, kelasFilter, searchQuery]);

  const setStudentStatus = (studentId: string, status: StudentAttendanceStatus) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes ?? '',
      },
    }));
  };

  const setStudentNotes = (studentId: string, notes: string) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status ?? 'hadir',
        notes,
      },
    }));
  };

  const markAllFilteredPresent = () => {
    setDrafts((prev) => {
      const copy = { ...prev };
      for (const s of filteredStudents) {
        copy[s.id] = {
          status: 'hadir',
          notes: copy[s.id]?.notes ?? '',
        };
      }
      return copy;
    });
  };

  const handleSave = async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !profile || filteredStudents.length === 0) return;

    setSaving(true);
    setFeedback(null);

    const payload = filteredStudents.map((s) => ({
      student_id: s.id,
      attendance_date: date,
      status: drafts[s.id]?.status ?? 'hadir',
      notes: (drafts[s.id]?.notes ?? '').trim(),
      recorded_by: profile.id,
    }));

    const { error } = await supabase
      .from('student_attendances')
      .upsert(payload, { onConflict: 'student_id,attendance_date' });

    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: error.message });
      return;
    }

    setFeedback({
      type: 'success',
      message: `Absensi ${payload.length} siswa untuk tanggal ${date} berhasil disimpan.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter & Action Toolbar */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <div>
              <label htmlFor="stu-att-date" className="block text-xs font-semibold text-zinc-700 mb-1">
                Tanggal Absensi
              </label>
              <input
                id="stu-att-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div>
              <label htmlFor="stu-att-jurusan" className="block text-xs font-semibold text-zinc-700 mb-1">
                Jurusan
              </label>
              <select
                id="stu-att-jurusan"
                value={jurusanFilter}
                onChange={(e) => {
                  setJurusanFilter(e.target.value);
                  setKelasFilter('ALL');
                }}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              >
                <option value="ALL">Semua Jurusan</option>
                {JURUSAN_LIST.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.code} — {j.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stu-att-kelas" className="block text-xs font-semibold text-zinc-700 mb-1">
                Kelas
              </label>
              <select
                id="stu-att-kelas"
                value={kelasFilter}
                onChange={(e) => setKelasFilter(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              >
                <option value="ALL">Semua Kelas</option>
                {availableClasses.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stu-att-search" className="block text-xs font-semibold text-zinc-700 mb-1">
                Cari Siswa
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="stu-att-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="NIS atau nama..."
                  className="w-full rounded-lg border border-zinc-300 pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={markAllFilteredPresent}
              disabled={filteredStudents.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 hover:border-zinc-400 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4 text-red-600" />
              <span>Tandai Semua Hadir</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || filteredStudents.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Menyimpan...' : `Simpan Absensi (${filteredStudents.length})`}</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-xs font-medium ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </section>

      {/* Student Roll-Call Table */}
      <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 bg-zinc-100 rounded" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="text-sm font-semibold text-zinc-900">Belum ada data siswa terdaftar</div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Administrator perlu menambahkan daftar siswa (NIS, Nama, Kelas) melalui menu Data
              Siswa terlebih dahulu sebelum guru dapat melakukan absensi.
            </p>
            {profile?.role === 'admin' && (
              <Link
                to="/app/data-siswa"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Kelola Data Siswa
              </Link>
            )}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Tidak ada siswa yang sesuai dengan filter kelas atau pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                  <th className="py-3 px-5">NIS</th>
                  <th className="py-3 px-5">Nama Lengkap</th>
                  <th className="py-3 px-5">Kelas</th>
                  <th className="py-3 px-5">Status Kehadiran</th>
                  <th className="py-3 px-5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredStudents.map((s) => {
                  const entry = drafts[s.id] || { status: 'hadir' as const, notes: '' };
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/60">
                      <td className="py-3 px-5 font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                        {s.nis}
                      </td>
                      <td className="py-3 px-5 font-semibold text-zinc-900 whitespace-nowrap">
                        {s.full_name}
                      </td>
                      <td className="py-3 px-5 text-xs text-zinc-600 whitespace-nowrap">
                        {s.kelas} · {s.jurusan}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
                          {(['hadir', 'izin', 'sakit', 'alpa'] as StudentAttendanceStatus[]).map(
                            (opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setStudentStatus(s.id, opt)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                                  entry.status === opt
                                    ? opt === 'alpa'
                                      ? 'bg-red-600 text-white shadow-xs'
                                      : opt === 'hadir'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white text-zinc-900 shadow-xs'
                                    : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                              >
                                {opt}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5 min-w-[200px]">
                        <input
                          type="text"
                          value={entry.notes}
                          onChange={(e) => setStudentNotes(s.id, e.target.value)}
                          placeholder="Catatan opsional..."
                          className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-red-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
