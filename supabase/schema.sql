-- ============================================================================
-- SMK PRIMA UNGGUL - SISTEM ABSENSI SISWA & KARYAWAN
-- Jalankan script ini di Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Extension untuk UUID
create extension if not exists "pgcrypto";

-- 2. Tabel Profil Karyawan (Terhubung dengan Supabase Auth auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  nip text default '',
  role text not null check (role in ('admin', 'guru', 'tenaga_kependidikan')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabel Data Siswa
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  nis text unique not null,
  full_name text not null,
  kelas text not null,
  jurusan text not null check (jurusan in ('TKJ', 'DKV', 'AK', 'BC', 'MPLB', 'BD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Tabel Absensi Karyawan (Semua Role: Admin, Guru, Tenaga Kependidikan)
create table if not exists public.employee_attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  status text not null check (status in ('hadir', 'izin', 'sakit')),
  notes text default '',
  created_at timestamptz not null default now(),
  unique (user_id, attendance_date)
);

-- 5. Tabel Absensi Siswa (Diinput oleh Guru & Admin)
create table if not exists public.student_attendances (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('hadir', 'izin', 'sakit', 'alpa')),
  notes text default '',
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

-- 6. Trigger Otomatis: User Pertama di Supabase Auth Menjadi ADMIN
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
  assigned_role text;
begin
  select count(*) into user_count from public.profiles;

  if user_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := coalesce(new.raw_user_meta_data->>'role', 'tenaga_kependidikan');
    if assigned_role not in ('admin', 'guru', 'tenaga_kependidikan') then
      assigned_role := 'tenaga_kependidikan';
    end if;
  end if;

  insert into public.profiles (id, email, full_name, nip, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, 'User'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'nip', ''),
    assigned_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    nip = excluded.nip,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Helper Functions untuk RLS (Non-rekursif)
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 8. Aktifkan Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.employee_attendances enable row level security;
alter table public.student_attendances enable row level security;

-- 9. Kebijakan RLS: profiles
drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update own basic profile" on public.profiles;
create policy "Users can update own basic profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles"
  on public.profiles for all
  to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- 10. Kebijakan RLS: students
drop policy if exists "Admin and Guru can view students" on public.students;
create policy "Admin and Guru can view students"
  on public.students for select
  to authenticated
  using (public.get_my_role() in ('admin', 'guru'));

drop policy if exists "Admin can insert students" on public.students;
create policy "Admin can insert students"
  on public.students for insert
  to authenticated
  with check (public.get_my_role() = 'admin');

drop policy if exists "Admin can update students" on public.students;
create policy "Admin can update students"
  on public.students for update
  to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

drop policy if exists "Admin can delete students" on public.students;
create policy "Admin can delete students"
  on public.students for delete
  to authenticated
  using (public.get_my_role() = 'admin');

-- 11. Kebijakan RLS: employee_attendances
drop policy if exists "Employees view own attendance or admin views all" on public.employee_attendances;
create policy "Employees view own attendance or admin views all"
  on public.employee_attendances for select
  to authenticated
  using (user_id = auth.uid() or public.get_my_role() = 'admin');

drop policy if exists "Employees can check in own attendance" on public.employee_attendances;
create policy "Employees can check in own attendance"
  on public.employee_attendances for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Employees can update own attendance or admin updates" on public.employee_attendances;
create policy "Employees can update own attendance or admin updates"
  on public.employee_attendances for update
  to authenticated
  using (user_id = auth.uid() or public.get_my_role() = 'admin')
  with check (user_id = auth.uid() or public.get_my_role() = 'admin');

-- 12. Kebijakan RLS: student_attendances
drop policy if exists "Admin and Guru can view student attendances" on public.student_attendances;
create policy "Admin and Guru can view student attendances"
  on public.student_attendances for select
  to authenticated
  using (public.get_my_role() in ('admin', 'guru'));

drop policy if exists "Admin and Guru can insert student attendances" on public.student_attendances;
create policy "Admin and Guru can insert student attendances"
  on public.student_attendances for insert
  to authenticated
  with check (public.get_my_role() in ('admin', 'guru'));

drop policy if exists "Admin and Guru can update student attendances" on public.student_attendances;
create policy "Admin and Guru can update student attendances"
  on public.student_attendances for update
  to authenticated
  using (public.get_my_role() in ('admin', 'guru'))
  with check (public.get_my_role() in ('admin', 'guru'));

drop policy if exists "Admin can delete student attendances" on public.student_attendances;
create policy "Admin can delete student attendances"
  on public.student_attendances for delete
  to authenticated
  using (public.get_my_role() = 'admin');

-- 13. Index untuk performa query rekap
create index if not exists idx_emp_att_date on public.employee_attendances (attendance_date desc);
create index if not exists idx_emp_att_user on public.employee_attendances (user_id, attendance_date desc);
create index if not exists idx_stu_att_date on public.student_attendances (attendance_date desc);
create index if not exists idx_stu_kelas on public.students (kelas, jurusan);
