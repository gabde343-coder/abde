export type UserRole = 'admin' | 'guru' | 'tenaga_kependidikan';

export type EmployeeAttendanceStatus = 'hadir' | 'izin' | 'sakit';
export type StudentAttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa';

export type JurusanCode = 'TKJ' | 'DKV' | 'AK' | 'BC' | 'MPLB' | 'BD';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  nip: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface ManagedUser extends Profile {
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export interface Student {
  id: string;
  nis: string;
  full_name: string;
  kelas: string;
  jurusan: JurusanCode;
  created_at: string;
}

export interface EmployeeAttendance {
  id: string;
  user_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: EmployeeAttendanceStatus;
  notes: string;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'email' | 'nip' | 'role'>;
}

export interface StudentAttendance {
  id: string;
  student_id: string;
  attendance_date: string;
  status: StudentAttendanceStatus;
  notes: string;
  recorded_by: string | null;
  created_at: string;
  students?: Pick<Student, 'nis' | 'full_name' | 'kelas' | 'jurusan'>;
  recorder?: Pick<Profile, 'full_name'> | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  guru: 'Guru',
  tenaga_kependidikan: 'Tenaga Kependidikan',
};

export interface JurusanInfo {
  code: JurusanCode;
  name: string;
  cluster: string;
  summary: string;
  competencies: string[];
}

export const BIDANG_KEAHLIAN = [
  {
    id: 'tik',
    number: '01',
    title: 'Teknologi Informasi & Desain',
    description:
      'Mempersiapkan teknisi jaringan berstandar industri serta desainer komunikasi visual yang menguasai produksi media digital modern.',
    majors: ['TKJ', 'DKV'] as JurusanCode[],
    imageKey: 'tech' as const,
  },
  {
    id: 'kreatif',
    number: '02',
    title: 'Seni & Ekonomi Kreatif',
    description:
      'Mengembangkan kompetensi penyiaran televisi, produksi film pendek, sinematografi, dan manajemen studio siaran profesional.',
    majors: ['BC'] as JurusanCode[],
    imageKey: 'broadcast' as const,
  },
  {
    id: 'bisnis',
    number: '03',
    title: 'Bisnis, Akuntansi & Manajemen',
    description:
      'Mencetak tenaga profesional di bidang pembukuan keuangan, administrasi perkantoran modern, serta pemasaran niaga digital.',
    majors: ['AK', 'MPLB', 'BD'] as JurusanCode[],
    imageKey: 'business' as const,
  },
];

export const JURUSAN_LIST: JurusanInfo[] = [
  {
    code: 'TKJ',
    name: 'Teknik Komputer dan Jaringan',
    cluster: 'Teknologi Informasi & Desain',
    summary: 'Instalasi infrastruktur jaringan, administrasi server Linux, routing switching, dan keamanan siber dasar.',
    competencies: ['Administrasi Server', 'Fiber Optik & Mikrotik', 'Keamanan Jaringan'],
  },
  {
    code: 'DKV',
    name: 'Desain Komunikasi Visual',
    cluster: 'Teknologi Informasi & Desain',
    summary: 'Perancangan identitas merek, ilustrasi vektor, tata letak publikasi, fotografi komersial, dan antarmuka digital.',
    competencies: ['Branding & Tipografi', 'Fotografi Produk', 'Desain UI/UX'],
  },
  {
    code: 'BC',
    name: 'Broadcasting dan Perfilman',
    cluster: 'Seni & Ekonomi Kreatif',
    summary: 'Produksi program siaran, penulisan naskah, tata kamera, penyuntingan video, dan tata suara studio.',
    competencies: ['Sinematografi', 'Editing & Color Grading', 'Manajemen Siaran'],
  },
  {
    code: 'AK',
    name: 'Akuntansi',
    cluster: 'Bisnis, Akuntansi & Manajemen',
    summary: 'Penyusunan laporan keuangan perusahaan jasa/dagang, perpajakan terapan, dan perangkat lunak akuntansi.',
    competencies: ['Siklus Akuntansi', 'Aplikasi Komputer Akuntansi', 'Administrasi Pajak'],
  },
  {
    code: 'MPLB',
    name: 'Manajemen Perkantoran dan Layanan Bisnis',
    cluster: 'Bisnis, Akuntansi & Manajemen',
    summary: 'Tata kelola kearsipan digital, korespondensi bisnis, layanan pelanggan prima, dan otomasi perkantoran.',
    competencies: ['Kearsipan Digital', 'Korespondensi Bisnis', 'Protokoler & Layanan'],
  },
  {
    code: 'BD',
    name: 'Bisnis Digital',
    cluster: 'Bisnis, Akuntansi & Manajemen',
    summary: 'Pengelolaan toko daring, analitik pemasaran digital, optimasi konten komersial, dan kewirausahaan ritel.',
    competencies: ['E-Commerce Operations', 'Digital Marketing', 'Analitik Penjualan'],
  },
];
