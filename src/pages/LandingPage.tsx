import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone, ShieldCheck, Users } from 'lucide-react';
import { ImageWithFallback, SchoolMark } from '../components/SchoolMark';
import { BIDANG_KEAHLIAN, JURUSAN_LIST } from '../types/app';

const CLUSTER_IMAGES: Record<'tech' | 'broadcast' | 'business', { src: string; alt: string }> = {
  tech: {
    src: '/src/assets/images/lab_teknologi_tkj_dkv_1795667688549.jpg',
    alt: 'Laboratorium Teknik Komputer Jaringan dan Desain Komunikasi Visual SMK Prima Unggul',
  },
  broadcast: {
    src: '/src/assets/images/studio_broadcast_bc_1795667688753.jpg',
    alt: 'Studio Penyiaran dan Perfilman Broadcasting SMK Prima Unggul',
  },
  business: {
    src: '/src/assets/images/office_bisnis_mplb_1795667689087.jpg',
    alt: 'Ruang Simulasi Akuntansi, Perkantoran, dan Bisnis Digital SMK Prima Unggul',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="flex items-center gap-3 text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0"
          >
            <SchoolMark size="sm" />
            <span>SMK Prima Unggul</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600">
            <a
              href="#profil"
              className="hover:text-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              Profil Sekolah
            </a>
            <a
              href="#jurusan"
              className="hover:text-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              Program Keahlian
            </a>
            <a
              href="#sistem"
              className="hover:text-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              Sistem Absensi
            </a>
            <a
              href="#kontak"
              className="hover:text-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              Kontak
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
            >
              Masuk Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section: 2-Column Balanced Split */}
        <section className="border-b border-zinc-200 bg-zinc-50/50">
          <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-semibold text-red-600 tracking-wide mb-3">
                  Sekolah Menengah Kejuruan Terakreditasi A · Kurikulum Merdeka
                </p>
                <h1
                  className="font-extrabold tracking-tight text-zinc-900 leading-[1.12] mb-5"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
                >
                  Pendidikan Vokasi Unggul dengan Tata Kelola Presensi Digital.
                </h1>
                <p className="text-base text-zinc-600 leading-relaxed max-w-xl mb-8">
                  SMK Prima Unggul membina talenta siap kerja melalui 3 Bidang Keahlian dan 6
                  konsentrasi unggulan (TKJ, DKV, AK, BC, MPLB, dan BD), didukung sistem absensi
                  terpadu untuk guru, tenaga kependidikan, dan seluruh peserta didik.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    Masuk ke Portal Absensi
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#jurusan"
                    className="inline-flex items-center px-5 py-3 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:border-zinc-400 hover:text-zinc-900 transition-colors whitespace-nowrap shrink-0"
                  >
                    Lihat Program Keahlian
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6 flex">
                <div className="w-full rounded-xl overflow-hidden border border-zinc-200 bg-white">
                  <ImageWithFallback
                    src="/src/assets/images/hero_smk_campus_clean_1795667702054.jpg"
                    alt="Lingkungan Kampus SMK Prima Unggul dengan arsitektur modern merah dan putih"
                    fallbackTitle="Kampus SMK Prima Unggul"
                    className="w-full h-72 sm:h-96 lg:h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Summary Strip Below Hero */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border border-zinc-200 rounded-xl bg-white divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
              <div className="p-6">
                <div className="text-2xl font-bold text-zinc-900 tabular-nums">3 Bidang</div>
                <div className="text-sm text-zinc-600 mt-1">Rumpun Keahlian Utama</div>
              </div>
              <div className="p-6">
                <div className="text-2xl font-bold text-red-600 tabular-nums">6 Jurusan</div>
                <div className="text-sm text-zinc-600 mt-1">TKJ, DKV, AK, BC, MPLB & BD</div>
              </div>
              <div className="p-6">
                <div className="text-2xl font-bold text-zinc-900 tabular-nums">Akreditasi A</div>
                <div className="text-sm text-zinc-600 mt-1">Standar Mutu Nasional BAN-S/M</div>
              </div>
              <div className="p-6">
                <div className="text-2xl font-bold text-zinc-900 tabular-nums">Real-Time</div>
                <div className="text-sm text-zinc-600 mt-1">Rekap Kehadiran Siswa & Staf</div>
              </div>
            </div>
          </div>
        </section>

        {/* Profil SMK Prima Unggul */}
        <section id="profil" className="py-16 lg:py-24 border-b border-zinc-200 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold text-red-600 mb-2">Profil Institusi</p>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 leading-tight">
                  Membentuk Lulusan Kompeten, Disiplin, dan Berdaya Saing Industri.
                </h2>
              </div>

              <div className="lg:col-span-7 space-y-6 text-base text-zinc-600 leading-relaxed">
                <p>
                  <strong className="text-zinc-900 font-semibold">SMK Prima Unggul</strong> adalah
                  lembaga pendidikan menengah kejuruan yang memadukan kurikulum berbasis kompetensi
                  industri dengan budaya kerja profesional sejak bangku sekolah. Setiap laboratorium
                  dan studio praktik dirancang menyerupai lingkungan kerja sesungguhnya.
                </p>
                <p>
                  Kedisiplinan kehadiran menjadi fondasi utama pembinaan karakter siswa dan kinerja
                  pendidik. Melalui portal digital terintegrasi, pencatatan presensi harian karyawan
                  serta pemantauan kehadiran siswa di setiap kelas berlangsung akurat dan transparan.
                </p>

                <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-zinc-200">
                  <div>
                    <div className="text-sm font-bold text-zinc-900 mb-1">Praktik Berbasis Proyek</div>
                    <p className="text-sm text-zinc-600">
                      70% porsi pembelajaran berfokus pada studi kasus produksi dan sertifikasi
                      keahlian.
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 mb-1">Kemitraan Dunia Usaha</div>
                    <p className="text-sm text-zinc-600">
                      Penyaluran praktik kerja lapangan bersama perusahaan teknologi, media, dan
                      perbankan.
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 mb-1">Evaluasi Disiplin</div>
                    <p className="text-sm text-zinc-600">
                      Rekapitulasi kehadiran siswa dan pendidik tercatat rapi setiap hari secara
                      terpusat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Program Keahlian: 3 Bidang Keahlian & 6 Konsentrasi */}
        <section id="jurusan" className="py-16 lg:py-24 border-b border-zinc-200 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold text-red-600 mb-2">Program Pendidikan</p>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-3">
                3 Bidang Keahlian &amp; 6 Konsentrasi Unggulan
              </h2>
              <p className="text-base text-zinc-600">
                Kurikulum vokasi terstruktur dalam tiga rumpun keahlian utama yang menaungi enam
                jurusan aktif: TKJ, DKV, BC, AK, MPLB, dan BD.
              </p>
            </div>

            {/* 3 Bidang Keahlian Visual Showcase */}
            <div className="grid lg:grid-cols-3 gap-8 mb-14">
              {BIDANG_KEAHLIAN.map((bidang) => {
                const media = CLUSTER_IMAGES[bidang.imageKey];
                return (
                  <article
                    key={bidang.id}
                    className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden border-b border-zinc-200 bg-zinc-100">
                      <ImageWithFallback
                        src={media.src}
                        alt={media.alt}
                        fallbackTitle={bidang.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mb-2">
                        <span className="text-red-600 font-bold tabular-nums">
                          Bidang {bidang.number}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{bidang.majors.join(' & ')}</span>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-2">{bidang.title}</h3>
                      <p className="text-sm text-zinc-600 leading-relaxed flex-1">
                        {bidang.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Detail 6 Konsentrasi Keahlian */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Daftar Lengkap 6 Konsentrasi Keahlian
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Fokus kompetensi utama pada masing-masing jurusan di SMK Prima Unggul
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-zinc-500 tabular-nums">
                  TKJ · DKV · BC · AK · MPLB · BD
                </span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
                {JURUSAN_LIST.map((j, idx) => (
                  <div
                    key={j.code}
                    className={`p-6 ${idx >= 3 ? 'md:border-t md:border-zinc-200' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <span className="text-sm font-mono font-bold text-red-600">{j.code}</span>
                      <span className="text-xs text-zinc-500 truncate">{j.cluster}</span>
                    </div>
                    <h4 className="text-base font-bold text-zinc-900 mb-2">{j.name}</h4>
                    <p className="text-sm text-zinc-600 leading-relaxed mb-4">{j.summary}</p>
                    <ul className="space-y-1.5 text-xs text-zinc-700">
                      {j.competencies.map((comp) => (
                        <li key={comp} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-red-600 shrink-0" />
                          <span>{comp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sistem Absensi Terpadu */}
        <section id="sistem" className="py-16 lg:py-24 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold text-red-600 mb-2">Portal Internal</p>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
                  Sistem Absensi Siswa &amp; Karyawan Berbasis Peran
                </h2>
                <p className="text-base text-zinc-600 leading-relaxed mb-6">
                  Setiap civitas akademika mengakses fitur sesuai tanggung jawabnya melalui satu
                  portal terintegrasi dengan autentikasi dan database terpusat.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  Akses Portal Sekarang
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="lg:col-span-7 grid sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl border border-zinc-200 bg-zinc-50/70">
                  <ShieldCheck className="h-5 w-5 text-red-600 mb-3" />
                  <h3 className="text-base font-bold text-zinc-900 mb-2">Administrator</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Kelola akun guru dan staf, sinkronisasi data siswa per kelas, serta pantau rekap
                    kehadiran karyawan dan siswa.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-zinc-200 bg-zinc-50/70">
                  <Users className="h-5 w-5 text-red-600 mb-3" />
                  <h3 className="text-base font-bold text-zinc-900 mb-2">Guru</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Lakukan presensi mandiri harian, catat kehadiran siswa per kelas secara
                    terstruktur, dan unduh rekap absensi siswa.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-zinc-200 bg-zinc-50/70">
                  <CheckCircle2 className="h-5 w-5 text-red-600 mb-3" />
                  <h3 className="text-base font-bold text-zinc-900 mb-2">Tenaga Kependidikan</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Presensi masuk dan pulang mandiri secara harian lengkap dengan catatan izin atau
                    sakit serta riwayat kehadiran pribadi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer id="kontak" className="bg-zinc-950 text-zinc-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-8 pb-10 border-b border-zinc-800">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 text-white font-bold text-lg mb-3">
                <SchoolMark size="sm" />
                <span>SMK Prima Unggul</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                Sekolah Menengah Kejuruan berkompetensi industri dengan 3 Bidang Keahlian dan 6
                Program Keahlian: TKJ, DKV, AK, BC, MPLB, dan BD.
              </p>
            </div>

            <div className="md:col-span-4 space-y-2.5 text-sm">
              <div className="font-semibold text-white mb-3">Alamat &amp; Kontak</div>
              <div className="flex items-start gap-2.5 text-zinc-400">
                <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>Jl. Pendidikan Vokasi No. 45, Kota Nusantara</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <Phone className="h-4 w-4 text-red-500 shrink-0" />
                <span className="tabular-nums">(021) 555-0194</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <Mail className="h-4 w-4 text-red-500 shrink-0" />
                <span>info@smkprimaunggul.sch.id</span>
              </div>
            </div>

            <div className="md:col-span-3 space-y-2.5 text-sm">
              <div className="font-semibold text-white mb-3">Tautan Cepat</div>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <a href="#profil" className="hover:text-white transition-colors">
                    Profil Sekolah
                  </a>
                </li>
                <li>
                  <a href="#jurusan" className="hover:text-white transition-colors">
                    Program Keahlian
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Login Portal Absensi
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <span>© {new Date().getFullYear()} SMK Prima Unggul. Seluruh hak cipta dilindungi.</span>
            <span>Sistem Informasi Presensi Siswa &amp; Karyawan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
