import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ClipboardCheck, GraduationCap, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceStatusText } from '../../components/StatusLabel';
import { getSupabaseClient } from '../../lib/supabase';
import {
  formatDateIndo,
  formatFullDateIndo,
  formatTimeShort,
  getFirstDayOfMonthString,
  getTodayDateString,
} from '../../lib/formatters';
import {
  ROLE_LABELS,
  type EmployeeAttendance,
  type StudentAttendance,
} from '../../types/app';

interface DashboardMetrics {
  totalEmployees: number;
  employeesPresentToday: number;
  totalStudents: number;
  studentsPresentToday: number;
  myMonthPresent: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'tenaga_kependidikan';

  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<EmployeeAttendance | null>(null);
  const [recentEmployeeLogs, setRecentEmployeeLogs] = useState<EmployeeAttendance[]>([]);
  const [recentStudentLogs, setRecentStudentLogs] = useState<StudentAttendance[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    employeesPresentToday: 0,
    totalStudents: 0,
    studentsPresentToday: 0,
    myMonthPresent: 0,
  });

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    if (!supabase || !profile) {
      setLoading(false);
      return;
    }

    const today = getTodayDateString();
    const monthStart = getFirstDayOfMonthString();

    (async () => {
      setLoading(true);
      try {
        // 1. Personal attendance today & this month
        const [{ data: myToday }, { data: myMonthRows }] = await Promise.all([
          supabase
            .from('employee_attendances')
            .select('*')
            .eq('user_id', profile.id)
            .eq('attendance_date', today)
            .maybeSingle(),
          supabase
            .from('employee_attendances')
            .select('id, status')
            .eq('user_id', profile.id)
            .gte('attendance_date', monthStart)
            .lte('attendance_date', today),
        ]);

        let totalEmployees = 0;
        let employeesPresentToday = 0;
        let totalStudents = 0;
        let studentsPresentToday = 0;
        let empLogs: EmployeeAttendance[] = [];
        let stuLogs: StudentAttendance[] = [];

        if (role === 'admin') {
          const [profRes, empTodayRes, empRecentRes] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase
              .from('employee_attendances')
              .select('id', { count: 'exact', head: true })
              .eq('attendance_date', today)
              .eq('status', 'hadir'),
            supabase
              .from('employee_attendances')
              .select('*, profiles(full_name, email, nip, role)')
              .order('attendance_date', { ascending: false })
              .order('created_at', { ascending: false })
              .limit(6),
          ]);
          totalEmployees = profRes.count ?? 0;
          employeesPresentToday = empTodayRes.count ?? 0;
          empLogs = (empRecentRes.data as EmployeeAttendance[]) || [];
        } else {
          const { data: myRecent } = await supabase
            .from('employee_attendances')
            .select('*')
            .eq('user_id', profile.id)
            .order('attendance_date', { ascending: false })
            .limit(6);
          empLogs = (myRecent as EmployeeAttendance[]) || [];
        }

        if (role === 'admin' || role === 'guru') {
          const [stuCountRes, stuTodayRes, stuRecentRes] = await Promise.all([
            supabase.from('students').select('id', { count: 'exact', head: true }),
            supabase
              .from('student_attendances')
              .select('id', { count: 'exact', head: true })
              .eq('attendance_date', today)
              .eq('status', 'hadir'),
            supabase
              .from('student_attendances')
              .select('*, students(nis, full_name, kelas, jurusan)')
              .order('attendance_date', { ascending: false })
              .order('created_at', { ascending: false })
              .limit(6),
          ]);
          totalStudents = stuCountRes.count ?? 0;
          studentsPresentToday = stuTodayRes.count ?? 0;
          stuLogs = (stuRecentRes.data as StudentAttendance[]) || [];
        }

        if (!active) return;

        setTodayRecord((myToday as EmployeeAttendance) || null);
        setRecentEmployeeLogs(empLogs);
        setRecentStudentLogs(stuLogs);
        setMetrics({
          totalEmployees,
          employeesPresentToday,
          totalStudents,
          studentsPresentToday,
          myMonthPresent: (myMonthRows || []).filter((r) => r.status === 'hadir').length,
        });
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [profile, role]);

  return (
    <div className="space-y-8">
      {/* Greeting & Today's Personal Attendance Strip */}
      <section className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <CalendarDays className="h-3.5 w-3.5 text-red-600" />
            <span>{formatFullDateIndo(new Date())}</span>
            <span aria-hidden="true">·</span>
            <span>{ROLE_LABELS[role]}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900">
            Selamat datang, {profile?.full_name || 'Pengguna'}
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            {todayRecord
              ? todayRecord.status === 'hadir'
                ? todayRecord.check_out
                  ? `Absensi hari ini selesai (${formatTimeShort(todayRecord.check_in)} – ${formatTimeShort(todayRecord.check_out)}).`
                  : `Anda sudah absen masuk pukul ${formatTimeShort(todayRecord.check_in)}. Jangan lupa absen pulang.`
                : `Status absensi Anda hari ini tercatat: ${todayRecord.status.toUpperCase()}.`
              : 'Anda belum melakukan absensi karyawan hari ini.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/app/absensi-karyawan"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            <UserCheck className="h-4 w-4" />
            <span>{todayRecord && !todayRecord.check_out && todayRecord.status === 'hadir' ? 'Absen Pulang' : 'Buka Absensi Karyawan'}</span>
          </Link>

          {(role === 'admin' || role === 'guru') && (
            <Link
              to="/app/absensi-siswa"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-800 text-sm font-semibold hover:border-zinc-400 transition-colors whitespace-nowrap"
            >
              <ClipboardCheck className="h-4 w-4 text-red-600" />
              <span>Input Absensi Siswa</span>
            </Link>
          )}
        </div>
      </section>

      {/* Metrics Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-zinc-200 bg-white p-5 animate-pulse">
              <div className="h-3 w-24 bg-zinc-200 rounded mb-4" />
              <div className="h-7 w-16 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="text-xs font-semibold text-zinc-500 mb-2">Status Absen Saya</div>
            <div className="text-xl font-bold text-zinc-900">
              {todayRecord ? <AttendanceStatusText status={todayRecord.status} /> : 'Belum Absen'}
            </div>
            <div className="text-xs text-zinc-500 mt-2 font-mono tabular-nums">
              Masuk: {formatTimeShort(todayRecord?.check_in)}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="text-xs font-semibold text-zinc-500 mb-2">Kehadiran Bulan Ini</div>
            <div className="text-2xl font-bold text-zinc-900 tabular-nums">
              {metrics.myMonthPresent} <span className="text-sm font-normal text-zinc-500">hari</span>
            </div>
            <div className="text-xs text-zinc-500 mt-2">Total status Hadir pribadi</div>
          </div>

          {role === 'admin' && (
            <>
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-500">Karyawan Hadir</span>
                  <Users className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                  {metrics.employeesPresentToday}{' '}
                  <span className="text-sm font-normal text-zinc-500">/ {metrics.totalEmployees}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">Guru &amp; Tenaga Kependidikan</div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-500">Siswa Hadir Hari Ini</span>
                  <GraduationCap className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                  {metrics.studentsPresentToday}{' '}
                  <span className="text-sm font-normal text-zinc-500">/ {metrics.totalStudents}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">Seluruh kelas &amp; jurusan</div>
              </div>
            </>
          )}

          {role === 'guru' && (
            <>
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-500">Total Siswa Terdaftar</span>
                  <GraduationCap className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                  {metrics.totalStudents}
                </div>
                <div className="text-xs text-zinc-500 mt-2">TKJ, DKV, AK, BC, MPLB, BD</div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-500">Siswa Hadir Hari Ini</span>
                  <ClipboardCheck className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                  {metrics.studentsPresentToday}
                </div>
                <div className="text-xs text-zinc-500 mt-2">Tercatat pada tanggal hari ini</div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Recent Activity Tables */}
      <div className={`grid gap-6 ${role === 'admin' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Employee Logs (Admin sees all recent; Guru & Tendik see personal recent) */}
        <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                {role === 'admin' ? 'Aktivitas Absensi Karyawan Terbaru' : 'Riwayat Absensi Pribadi Terbaru'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {role === 'admin' ? 'Catatan terbaru dari seluruh karyawan' : '6 entri absensi terakhir Anda'}
              </p>
            </div>
            <Link
              to={role === 'admin' ? '/app/rekap/karyawan' : '/app/absensi-karyawan'}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 whitespace-nowrap"
            >
              Lihat Semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentEmployeeLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Belum ada data absensi karyawan yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                    <th className="py-2.5 px-4">Tanggal</th>
                    {role === 'admin' && <th className="py-2.5 px-4">Nama</th>}
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Masuk / Pulang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {recentEmployeeLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/70">
                      <td className="py-3 px-4 text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                        {formatDateIndo(item.attendance_date)}
                      </td>
                      {role === 'admin' && (
                        <td className="py-3 px-4 font-medium text-zinc-900 truncate max-w-[160px]">
                          {item.profiles?.full_name || 'Karyawan'}
                        </td>
                      )}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <AttendanceStatusText status={item.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                        {formatTimeShort(item.check_in)} – {formatTimeShort(item.check_out)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Student Logs (Admin & Guru) */}
        {(role === 'admin' || role === 'guru') && (
          <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Absensi Siswa Terbaru</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Catatan kehadiran peserta didik terkini
                </p>
              </div>
              <Link
                to="/app/rekap/siswa"
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 whitespace-nowrap"
              >
                Rekap Siswa
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentStudentLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                Belum ada catatan absensi siswa. Silakan input melalui menu Absensi Siswa.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                      <th className="py-2.5 px-4">Tanggal</th>
                      <th className="py-2.5 px-4">Siswa</th>
                      <th className="py-2.5 px-4">Kelas</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {recentStudentLogs.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/70">
                        <td className="py-3 px-4 text-xs text-zinc-600 tabular-nums whitespace-nowrap">
                          {formatDateIndo(item.attendance_date)}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-900 truncate max-w-[160px]">
                          {item.students?.full_name || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-600 whitespace-nowrap">
                          {item.students?.kelas || '-'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <AttendanceStatusText status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
