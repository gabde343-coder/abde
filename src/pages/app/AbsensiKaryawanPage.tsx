import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceStatusText } from '../../components/StatusLabel';
import { getSupabaseClient } from '../../lib/supabase';
import {
  formatDateIndo,
  formatFullDateIndo,
  formatTimeShort,
  getTodayDateString,
} from '../../lib/formatters';
import {
  ROLE_LABELS,
  type EmployeeAttendance,
  type EmployeeAttendanceStatus,
} from '../../types/app';

export default function AbsensiKaryawanPage() {
  const { profile } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayDateString().slice(0, 7));

  const [todayEntry, setTodayEntry] = useState<EmployeeAttendance | null>(null);
  const [history, setHistory] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<EmployeeAttendanceStatus>('hadir');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = getTodayDateString();
    const [yearStr, monthStr] = selectedMonth.split('-');
    const lastDay = new Date(Number(yearStr), Number(monthStr), 0).getDate();
    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

    const [{ data: todayData }, { data: monthData, error: monthErr }] = await Promise.all([
      supabase
        .from('employee_attendances')
        .select('*')
        .eq('user_id', profile.id)
        .eq('attendance_date', today)
        .maybeSingle(),
      supabase
        .from('employee_attendances')
        .select('*')
        .eq('user_id', profile.id)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false }),
    ]);

    if (monthErr) {
      setFeedback({ type: 'error', message: monthErr.message });
    }

    setTodayEntry((todayData as EmployeeAttendance) || null);
    setHistory((monthData as EmployeeAttendance[]) || []);
    setLoading(false);
  }, [profile, selectedMonth]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase || !profile) return;

    setSubmitting(true);
    setFeedback(null);

    const today = getTodayDateString();
    const nowIso = new Date().toISOString();

    const { error } = await supabase.from('employee_attendances').insert({
      user_id: profile.id,
      attendance_date: today,
      check_in: status === 'hadir' ? nowIso : null,
      check_out: null,
      status,
      notes: notes.trim(),
    });

    setSubmitting(false);

    if (error) {
      setFeedback({
        type: 'error',
        message:
          error.code === '23505'
            ? 'Anda sudah melakukan absensi untuk tanggal hari ini.'
            : error.message,
      });
      return;
    }

    setNotes('');
    setFeedback({
      type: 'success',
      message:
        status === 'hadir'
          ? 'Absensi masuk berhasil dicatat.'
          : `Pengajuan status ${status.toUpperCase()} hari ini berhasil dicatat.`,
    });
    await loadAttendance();
  };

  const handleCheckOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !todayEntry) return;

    setSubmitting(true);
    setFeedback(null);

    const { error } = await supabase
      .from('employee_attendances')
      .update({ check_out: new Date().toISOString() })
      .eq('id', todayEntry.id);

    setSubmitting(false);

    if (error) {
      setFeedback({ type: 'error', message: error.message });
      return;
    }

    setFeedback({ type: 'success', message: 'Absensi pulang berhasil dicatat.' });
    await loadAttendance();
  };

  const liveClock = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  return (
    <div className="space-y-8">
      {/* Top Self-Attendance Panel */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        {/* Live Clock & Identity Card */}
        <section className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Presensi Mandiri Karyawan</span>
            </div>
            <div className="text-4xl font-extrabold font-mono text-zinc-900 tabular-nums tracking-tight my-3">
              {liveClock}
            </div>
            <p className="text-sm font-medium text-zinc-600">{formatFullDateIndo(now)}</p>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-200 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Nama</span>
              <span className="font-semibold text-zinc-900">{profile?.full_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Jabatan / Role</span>
              <span className="font-medium text-zinc-800">
                {profile ? ROLE_LABELS[profile.role] : '-'}
              </span>
            </div>
            {profile?.nip && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">NIP</span>
                <span className="font-mono text-xs text-zinc-800 tabular-nums">{profile.nip}</span>
              </div>
            )}
          </div>
        </section>

        {/* Action Panel */}
        <section className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-center">
          {feedback && (
            <div
              role="status"
              className={`mb-5 rounded-lg border px-4 py-3 text-xs font-medium ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-5 w-48 bg-zinc-200 rounded" />
              <div className="h-10 w-full bg-zinc-100 rounded" />
              <div className="h-10 w-40 bg-zinc-200 rounded" />
            </div>
          ) : !todayEntry ? (
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Catat Kehadiran Hari Ini</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pilih status kehadiran Anda dan tambahkan keterangan jika diperlukan.
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-zinc-700 mb-2">Status</span>
                <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 rounded-lg">
                  {(['hadir', 'izin', 'sakit'] as EmployeeAttendanceStatus[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStatus(opt)}
                      className={`py-2 px-3 rounded-md text-xs font-semibold capitalize transition-colors ${
                        status === opt
                          ? 'bg-white text-red-600 shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="emp-notes"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Keterangan {status !== 'hadir' ? '(Wajib untuk Izin / Sakit)' : '(Opsional)'}
                </label>
                <input
                  id="emp-notes"
                  type="text"
                  required={status !== 'hadir'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    status === 'hadir'
                      ? 'Contoh: Piket pagi di Lab TKJ'
                      : 'Tuliskan alasan izin atau keterangan sakit...'
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>
                  {submitting
                    ? 'Menyimpan...'
                    : status === 'hadir'
                    ? 'Absen Masuk Sekarang'
                    : `Simpan Status ${status.toUpperCase()}`}
                </span>
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Status Absensi Hari Ini</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Tercatat pada {formatDateIndo(todayEntry.attendance_date)}
                  </p>
                </div>
                <AttendanceStatusText status={todayEntry.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-200">
                <div>
                  <div className="text-xs text-zinc-500">Jam Masuk</div>
                  <div className="text-lg font-bold font-mono text-zinc-900 tabular-nums mt-0.5">
                    {formatTimeShort(todayEntry.check_in)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Jam Pulang</div>
                  <div className="text-lg font-bold font-mono text-zinc-900 tabular-nums mt-0.5">
                    {formatTimeShort(todayEntry.check_out)}
                  </div>
                </div>
              </div>

              {todayEntry.notes && (
                <div className="text-xs text-zinc-600">
                  <span className="font-semibold text-zinc-800">Catatan:</span> {todayEntry.notes}
                </div>
              )}

              {todayEntry.status === 'hadir' && !todayEntry.check_out ? (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{submitting ? 'Menyimpan...' : 'Catat Absen Pulang'}</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Presensi harian Anda telah lengkap.</span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Personal Attendance History Table */}
      <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Riwayat Absensi Pribadi</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daftar catatan presensi bulanan milik Anda sendiri
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="emp-month-filter" className="text-xs font-semibold text-zinc-600">
              Bulan:
            </label>
            <input
              id="emp-month-filter"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-zinc-100 rounded" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Tidak ada catatan absensi pada bulan ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                  <th className="py-3 px-6">Tanggal</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Jam Masuk</th>
                  <th className="py-3 px-6">Jam Pulang</th>
                  <th className="py-3 px-6">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-6 font-medium text-zinc-900 tabular-nums whitespace-nowrap">
                      {formatDateIndo(row.attendance_date)}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <AttendanceStatusText status={row.status} />
                    </td>
                    <td className="py-3 px-6 font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                      {formatTimeShort(row.check_in)}
                    </td>
                    <td className="py-3 px-6 font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                      {formatTimeShort(row.check_out)}
                    </td>
                    <td className="py-3 px-6 text-xs text-zinc-600">
                      {row.notes || <span className="text-zinc-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
