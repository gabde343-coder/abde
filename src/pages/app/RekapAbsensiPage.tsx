import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceStatusText } from '../../components/StatusLabel';
import { getSupabaseClient } from '../../lib/supabase';
import {
  exportToCsv,
  formatDateIndo,
  formatTimeShort,
  getFirstDayOfMonthString,
  getTodayDateString,
} from '../../lib/formatters';
import {
  JURUSAN_LIST,
  ROLE_LABELS,
  type EmployeeAttendance,
  type StudentAttendance,
} from '../../types/app';

export default function RekapAbsensiPage() {
  const { type } = useParams<{ type: string }>();
  const { profile } = useAuth();
  const role = profile?.role ?? 'tenaga_kependidikan';

  const isKaryawan = type === 'karyawan';
  const isSiswa = type === 'siswa';

  const [startDate, setStartDate] = useState(() => getFirstDayOfMonthString());
  const [endDate, setEndDate] = useState(() => getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [jurusanFilter, setJurusanFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [empRows, setEmpRows] = useState<EmployeeAttendance[]>([]);
  const [stuRows, setStuRows] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || (!isKaryawan && !isSiswa)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    if (isKaryawan) {
      const { data, error } = await supabase
        .from('employee_attendances')
        .select('*, profiles(full_name, email, nip, role)')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setEmpRows((data as EmployeeAttendance[]) || []);
      }
    } else {
      const { data, error } = await supabase
        .from('student_attendances')
        .select('*, students(nis, full_name, kelas, jurusan)')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setStuRows((data as StudentAttendance[]) || []);
      }
    }

    setLoading(false);
  }, [isKaryawan, isSiswa, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEmp = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return empRows.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (roleFilter !== 'ALL' && row.profiles?.role !== roleFilter) return false;
      if (q) {
        const name = (row.profiles?.full_name || '').toLowerCase();
        const email = (row.profiles?.email || '').toLowerCase();
        const nip = (row.profiles?.nip || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !nip.includes(q)) return false;
      }
      return true;
    });
  }, [empRows, statusFilter, roleFilter, searchQuery]);

  const filteredStu = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stuRows.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (jurusanFilter !== 'ALL' && row.students?.jurusan !== jurusanFilter) return false;
      if (q) {
        const name = (row.students?.full_name || '').toLowerCase();
        const nis = (row.students?.nis || '').toLowerCase();
        const kelas = (row.students?.kelas || '').toLowerCase();
        if (!name.includes(q) && !nis.includes(q) && !kelas.includes(q)) return false;
      }
      return true;
    });
  }, [stuRows, statusFilter, jurusanFilter, searchQuery]);

  if (!isKaryawan && !isSiswa) {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (isKaryawan && role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (isSiswa && role !== 'admin' && role !== 'guru') {
    return <Navigate to="/app/dashboard" replace />;
  }

  const summary = useMemo(() => {
    const list = isKaryawan ? filteredEmp : filteredStu;
    return {
      total: list.length,
      hadir: list.filter((i) => i.status === 'hadir').length,
      izin: list.filter((i) => i.status === 'izin').length,
      sakit: list.filter((i) => i.status === 'sakit').length,
      alpa: isSiswa ? filteredStu.filter((i) => i.status === 'alpa').length : 0,
    };
  }, [isKaryawan, isSiswa, filteredEmp, filteredStu]);

  const handleExport = () => {
    if (isKaryawan) {
      exportToCsv(
        `rekap-absensi-karyawan-${startDate}-sd-${endDate}.csv`,
        ['Tanggal', 'Nama', 'NIP', 'Role', 'Status', 'Jam Masuk', 'Jam Pulang', 'Catatan'],
        filteredEmp.map((r) => [
          r.attendance_date,
          r.profiles?.full_name || '-',
          r.profiles?.nip || '-',
          r.profiles?.role ? ROLE_LABELS[r.profiles.role] : '-',
          r.status.toUpperCase(),
          formatTimeShort(r.check_in),
          formatTimeShort(r.check_out),
          r.notes || '',
        ])
      );
    } else {
      exportToCsv(
        `rekap-absensi-siswa-${startDate}-sd-${endDate}.csv`,
        ['Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Jurusan', 'Status', 'Catatan'],
        filteredStu.map((r) => [
          r.attendance_date,
          r.students?.nis || '-',
          r.students?.full_name || '-',
          r.students?.kelas || '-',
          r.students?.jurusan || '-',
          r.status.toUpperCase(),
          r.notes || '',
        ])
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
            <div>
              <label htmlFor="rekap-start" className="block text-xs font-semibold text-zinc-700 mb-1">
                Dari Tanggal
              </label>
              <input
                id="rekap-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label htmlFor="rekap-end" className="block text-xs font-semibold text-zinc-700 mb-1">
                Sampai Tanggal
              </label>
              <input
                id="rekap-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label htmlFor="rekap-status" className="block text-xs font-semibold text-zinc-700 mb-1">
                Status
              </label>
              <select
                id="rekap-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:border-red-600"
              >
                <option value="ALL">Semua Status</option>
                <option value="hadir">Hadir</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
                {isSiswa && <option value="alpa">Alpa</option>}
              </select>
            </div>

            {isKaryawan ? (
              <div>
                <label htmlFor="rekap-role" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Role Karyawan
                </label>
                <select
                  id="rekap-role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="ALL">Semua Role</option>
                  <option value="admin">Administrator</option>
                  <option value="guru">Guru</option>
                  <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="rekap-jurusan" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Jurusan
                </label>
                <select
                  id="rekap-jurusan"
                  value={jurusanFilter}
                  onChange={(e) => setJurusanFilter(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="ALL">Semua Jurusan</option>
                  {JURUSAN_LIST.map((j) => (
                    <option key={j.code} value={j.code}>
                      {j.code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="rekap-search" className="block text-xs font-semibold text-zinc-700 mb-1">
                Pencarian
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="rekap-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isKaryawan ? 'Nama / NIP...' : 'Nama / NIS / Kelas...'}
                  className="w-full rounded-lg border border-zinc-300 pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={summary.total === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {errorMsg}
          </div>
        )}
      </section>

      {/* Summary Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-500 font-medium">Total Catatan</div>
          <div className="text-2xl font-bold text-zinc-900 tabular-nums mt-1">{summary.total}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-500 font-medium">Hadir</div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">{summary.hadir}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-500 font-medium">Izin</div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums mt-1">{summary.izin}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-500 font-medium">Sakit</div>
          <div className="text-2xl font-bold text-sky-700 tabular-nums mt-1">{summary.sakit}</div>
        </div>
        {isSiswa && (
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="text-xs text-zinc-500 font-medium">Alpa</div>
            <div className="text-2xl font-bold text-red-600 tabular-nums mt-1">{summary.alpa}</div>
          </div>
        )}
      </section>

      {/* Data Table */}
      <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-zinc-100 rounded" />
            ))}
          </div>
        ) : summary.total === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Tidak ditemukan catatan absensi pada rentang tanggal dan filter yang dipilih.
          </div>
        ) : isKaryawan ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                  <th className="py-3 px-5">Tanggal</th>
                  <th className="py-3 px-5">Nama Karyawan</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Masuk</th>
                  <th className="py-3 px-5">Pulang</th>
                  <th className="py-3 px-5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredEmp.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-5 text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                      {formatDateIndo(row.attendance_date)}
                    </td>
                    <td className="py-3 px-5">
                      <div className="font-semibold text-zinc-900">
                        {row.profiles?.full_name || 'Karyawan'}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono">{row.profiles?.nip || row.profiles?.email}</div>
                    </td>
                    <td className="py-3 px-5 text-xs text-zinc-700 whitespace-nowrap">
                      {row.profiles?.role ? ROLE_LABELS[row.profiles.role] : '-'}
                    </td>
                    <td className="py-3 px-5 whitespace-nowrap">
                      <AttendanceStatusText status={row.status} />
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                      {formatTimeShort(row.check_in)}
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                      {formatTimeShort(row.check_out)}
                    </td>
                    <td className="py-3 px-5 text-xs text-zinc-600">{row.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                  <th className="py-3 px-5">Tanggal</th>
                  <th className="py-3 px-5">NIS</th>
                  <th className="py-3 px-5">Nama Siswa</th>
                  <th className="py-3 px-5">Kelas</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredStu.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-5 text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                      {formatDateIndo(row.attendance_date)}
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-zinc-700 tabular-nums whitespace-nowrap">
                      {row.students?.nis || '-'}
                    </td>
                    <td className="py-3 px-5 font-semibold text-zinc-900 whitespace-nowrap">
                      {row.students?.full_name || '-'}
                    </td>
                    <td className="py-3 px-5 text-xs text-zinc-600 whitespace-nowrap">
                      {row.students?.kelas || '-'} · {row.students?.jurusan || '-'}
                    </td>
                    <td className="py-3 px-5 whitespace-nowrap">
                      <AttendanceStatusText status={row.status} />
                    </td>
                    <td className="py-3 px-5 text-xs text-zinc-600">{row.notes || '—'}</td>
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
