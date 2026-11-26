import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ClipboardCheck,
  Database,
  FileBarChart2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { SchoolMark } from './SchoolMark';
import { SchemaSetupModal } from './SchemaSetupModal';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../types/app';

const ROUTE_TITLES: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/dashboard': 'Dashboard',
  '/app/absensi-karyawan': 'Absensi Karyawan',
  '/app/absensi-siswa': 'Absensi Siswa',
  '/app/rekap/karyawan': 'Rekap Absensi Karyawan',
  '/app/rekap/siswa': 'Rekap Absensi Siswa',
  '/app/data-siswa': 'Data Siswa',
  '/app/users': 'User Management',
};

export function AppLayout() {
  const { profile, signOut, schemaMissing } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rekapExpanded, setRekapExpanded] = useState(true);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const role = profile?.role ?? 'tenaga_kependidikan';

  const pageTitle = useMemo(() => {
    return ROUTE_TITLES[location.pathname] || 'Portal Absensi';
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-red-600 text-white'
        : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
    }`;

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 pl-10 pr-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-red-50 text-red-700'
        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
    }`;

  const renderSidebarLinks = (onNavigate?: () => void) => (
    <nav className="space-y-1.5 px-3 py-4" aria-label="Menu Utama">
      <NavLink to="/app/dashboard" className={navLinkClass} onClick={onNavigate}>
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/app/absensi-karyawan" className={navLinkClass} onClick={onNavigate}>
        <UserCheck className="h-4 w-4 shrink-0" />
        <span>Absensi Karyawan</span>
      </NavLink>

      {(role === 'admin' || role === 'guru') && (
        <NavLink to="/app/absensi-siswa" className={navLinkClass} onClick={onNavigate}>
          <ClipboardCheck className="h-4 w-4 shrink-0" />
          <span>Absensi Siswa</span>
        </NavLink>
      )}

      {(role === 'admin' || role === 'guru') && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setRekapExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            aria-expanded={rekapExpanded}
          >
            <span className="flex items-center gap-3 whitespace-nowrap">
              <FileBarChart2 className="h-4 w-4 shrink-0" />
              <span>Rekap Absensi</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-zinc-400 transition-transform ${
                rekapExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {rekapExpanded && (
            <div className="mt-1 space-y-1">
              {role === 'admin' && (
                <NavLink to="/app/rekap/karyawan" className={subNavLinkClass} onClick={onNavigate}>
                  <span>Absensi Karyawan</span>
                </NavLink>
              )}
              <NavLink to="/app/rekap/siswa" className={subNavLinkClass} onClick={onNavigate}>
                <span>Absensi Siswa</span>
              </NavLink>
            </div>
          )}
        </div>
      )}

      {role === 'admin' && (
        <>
          <NavLink to="/app/data-siswa" className={navLinkClass} onClick={onNavigate}>
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>Data Siswa</span>
          </NavLink>

          <NavLink to="/app/users" className={navLinkClass} onClick={onNavigate}>
            <Users className="h-4 w-4 shrink-0" />
            <span>User Management</span>
          </NavLink>
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-zinc-200">
        <div className="h-16 px-5 border-b border-zinc-200 flex items-center gap-3 shrink-0">
          <SchoolMark size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-zinc-900 truncate">SMK Prima Unggul</div>
            <div className="text-xs text-zinc-500 truncate">Sistem Absensi</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">{renderSidebarLinks()}</div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/80">
          <div className="text-xs font-semibold text-zinc-900 truncate">
            {profile?.full_name || 'Pengguna'}
          </div>
          <div className="text-xs text-zinc-500 truncate mt-0.5">{ROLE_LABELS[role]}</div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-zinc-950/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full border-r border-zinc-200 flex flex-col z-10">
            <div className="h-16 px-5 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SchoolMark size="sm" />
                <span className="text-sm font-bold text-zinc-900">SMK Prima Unggul</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderSidebarLinks(() => setMobileMenuOpen(false))}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar with Logout on Top-Right */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-zinc-400">Portal</span>
              <span className="hidden sm:inline text-zinc-300">/</span>
              <h1 className="font-bold text-zinc-900 truncate">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-900 max-w-[160px] truncate">
                {profile?.full_name}
              </span>
              <span aria-hidden="true">·</span>
              <span>{ROLE_LABELS[role]}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{loggingOut ? 'Keluar...' : 'Logout'}</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {schemaMissing && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-red-900">
                    Tabel Database Belum Dibuat di Supabase
                  </div>
                  <p className="text-xs text-red-800 mt-0.5">
                    Jalankan <code className="font-mono font-semibold">supabase/schema.sql</code> di
                    SQL Editor Supabase Anda agar seluruh fitur absensi dan data siswa dapat
                    berfungsi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 whitespace-nowrap shrink-0"
              >
                Buka Skema SQL
              </button>
            </div>
          )}

          <Outlet />
        </main>
      </div>

      <SchemaSetupModal open={schemaModalOpen} onClose={() => setSchemaModalOpen(false)} />
    </div>
  );
}
