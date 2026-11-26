import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/app/DashboardPage';
import AbsensiKaryawanPage from './pages/app/AbsensiKaryawanPage';
import AbsensiSiswaPage from './pages/app/AbsensiSiswaPage';
import RekapAbsensiPage from './pages/app/RekapAbsensiPage';
import DataSiswaPage from './pages/app/DataSiswaPage';
import UserManagementPage from './pages/app/UserManagementPage';
import type { UserRole } from './types/app';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-sm font-medium text-zinc-600">Memuat sesi aplikasi...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireRole({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!profile || !allowed.includes(profile.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="absensi-karyawan" element={<AbsensiKaryawanPage />} />
            <Route
              path="absensi-siswa"
              element={
                <RequireRole allowed={['admin', 'guru']}>
                  <AbsensiSiswaPage />
                </RequireRole>
              }
            />
            <Route
              path="rekap/:type"
              element={
                <RequireRole allowed={['admin', 'guru']}>
                  <RekapAbsensiPage />
                </RequireRole>
              }
            />
            <Route
              path="data-siswa"
              element={
                <RequireRole allowed={['admin']}>
                  <DataSiswaPage />
                </RequireRole>
              }
            />
            <Route
              path="users"
              element={
                <RequireRole allowed={['admin']}>
                  <UserManagementPage />
                </RequireRole>
              }
            />
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
