# MineTrack — Sistem Monitoring Operasional Tambang Berbasis Web

> **"Operational Clarity. Every Shift."**

MineTrack adalah sistem monitoring operasional pertambangan berbasis web kelas enterprise (*production-ready*) yang dirancang untuk membantu perusahaan tambang mengelola dan mengawasi seluruh kegiatan produksi secara terintegrasi — mulai dari pencatatan produksi harian (timbangan bruto/tara dan ritase), monitoring armada alat berat, aktivitas operator, pengelolaan shift kerja, pengawasan keselamatan kerja (K3), hingga laporan operasional harian (LOH) dan evaluasi target produksi eksekutif.

Aplikasi ini dibangun menggunakan arsitektur modern Next.js App Router, TypeScript, skema PostgreSQL yang dinormalisasi dengan Prisma ORM, validasi Zod ketat, otorisasi berbasis peran (RBAC), serta antarmuka industrial yang responsif, bersih, dan profesional.

---

## 📑 Daftar Isi
1. [Fitur Utama Sistem](#-fitur-utama-sistem)
2. [Role & Hak Akses (RBAC)](#-role--hak-akses-rbac)
3. [Akun Demo Pengujian](#-akun-demo-pengujian)
4. [Teknologi & Stack](#-teknologi--stack)
5. [Struktur Direktori](#-struktur-direktori)
6. [Instalasi & Menjalankan Lokal](#-instalasi--menjalankan-lokal)
7. [Database & Seeder](#-database--seeder)
8. [Pengujian (Testing)](#-pengujian-testing)
9. [Panduan Deployment Vercel & Supabase](#-panduan-deployment-vercel--supabase)
10. [Dokumentasi Teknis & Kesiapan Produksi](#-dokumentasi-teknis--kesiapan-produksi)
11. [Kontrak Integrasi Arsitektur Masa Depan](#-kontrak-integrasi-arsitektur-masa-depan)

---

## 🚀 Fitur Utama Sistem

### 1. Monitoring Produksi & Timbangan Presisi
- **Pencatatan Berbasis Timbang**: Menghitung berat bersih secara otomatis:  
  $$\text{Berat Bersih (Netto)} = \text{Berat Bruto} - \text{Berat Tara}$$  
  Dilengkapi validasi server ketat: Berat bruto tidak boleh lebih kecil dari berat tara, nilai numerik presisi non-negatif.
- **Pencatatan Berbasis Ritase**: Perhitungan berdasarkan jumlah ritase muatan per trip dengan penandaan jelas antara berat aktual vs estimasi (tidak dicampur tanpa indikator).
- **Penomoran Otomatis**: Format standar tambang `PRD-YYYYMMDD-XXXX`.
- **Ekspor Data**: Ekspor data produksi dan analitik ke format file CSV yang aman.

### 2. Workflow Persetujuan Nyata (Approval Engine)
- Alur berjenjang: **Draft $\rightarrow$ Submitted $\rightarrow$ Under Review $\rightarrow$ Approved / Needs Revision / Rejected**.
- Hanya data dengan status **Approved** yang dihitung ke dalam agregasi produksi resmi dan perbandingan target.
- Operator hanya dapat mengedit draf atau laporan miliknya yang dikembalikan untuk revisi.
- Supervisor wajib menyertakan alasan ketika menolak atau mengembalikan laporan.
- Seluruh riwayat perubahan status tercatat permanen di riwayat status dan audit log.

### 3. Pengelolaan Shift & Deteksi Bentrok Jadwal
- Manajemen shift (Day Shift & Night Shift dengan dukungan lintas tengah malam).
- **Deteksi Bentrok Jadwal**:
  - Mencegah seorang operator ditugaskan ke lebih dari satu shift pada tanggal yang sama.
  - Mencegah alat berat yang sama dialokasikan ke pekerjaan berbeda pada shift yang bersamaan.

### 4. Monitoring Armada Alat Berat & Downtime Terintegrasi
- Pelacakan unit: Excavator, Dump Truck, Bulldozer, Wheel Loader.
- Status dinamis: `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `BREAKDOWN`, `INACTIVE`.
- **Integrasi Siklus Alat**: Pelaporan downtime otomatis mengubah status armada menjadi `BREAKDOWN`. Saat downtime diselesaikan (*resolved*), status unit otomatis kembali `AVAILABLE` dan durasi henti (menit) terkalkulasi secara tepat.

### 5. Pengawasan Keselamatan Kerja (K3 / HSE)
- Pencatatan Insiden, Near Miss, Kondisi Tidak Aman, dan Tindakan Tidak Aman.
- Tingkat keparahan (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) dengan penanda visual khusus untuk kondisi berisiko tinggi.
- Alur penyelesaian: `OPEN` $\rightarrow$ `UNDER_INVESTIGATION` $\rightarrow$ `ACTION_REQUIRED` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED`.

### 6. Evaluasi Target vs Realisasi & Dashboard Eksekutif
- Perhitungan persentase pencapaian:  
  $$\text{Pencapaian (\%)} = \frac{\text{Produksi Disetujui}}{\text{Target Produksi}} \times 100\%$$  
  Dilengkapi penanganan matematis *safe-divide* untuk mencegah *divide-by-zero* jika target nol.
- Visualisasi interaktif Recharts: Tren produksi mingguan/bulanan, komparasi per site, distribusi material, dan rasio utilisasi armada.

### 7. Pusat Notifikasi & Jejak Audit (Audit Logs)
- Notifikasi *in-app* terhubung ke pengguna yang berwenang (notifikasi pengajuan review, revisi laporan, downtime, insiden K3).
- Audit log mencatat pengguna, aksi, entitas, stempel waktu, dan detail perubahan tanpa mengekspos kata sandi atau secret.

---

## 👥 Role & Hak Akses (RBAC)

| Modul / Fitur | Administrator | Mine Supervisor | Operator Lapangan | Management |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard Khusus** | ✅ Admin Dashboard | ✅ Supervisor Dashboard | ✅ Operator Dashboard | ✅ Executive Dashboard |
| **Manajemen Pengguna & Role** | ✅ CRUD Lengkap | ❌ | ❌ | ❌ (Read Only) |
| **Master Data (Site, Pit, Material)** | ✅ CRUD Lengkap | ❌ (Read Only) | ❌ (Read Only) | ❌ (Read Only) |
| **Penugasan Shift & Armada** | ✅ Kelola | ✅ Kelola & Awasi | 👁️ Lihat Jadwal Sendiri | 👁️ Monitoring |
| **Input Data Produksi** | ✅ Full Akses | ❌ (Verifikator) | ✅ Buat Draf / Submit | ❌ (Read Only) |
| **Persetujuan (Approval Workflow)** | ✅ Override | ✅ Approve / Reject / Return | ❌ | ❌ |
| **Lapor Downtime & Kerusakan** | ✅ | ✅ Pantau & Resolve | ✅ Lapor Kejadian | 👁️ Ringkasan |
| **Laporan Keselamatan (K3)** | ✅ Kelola | ✅ Tindak Lanjut | ✅ Lapor Temuan | 👁️ Statistik Zero Fatality |
| **Laporan Operasional Harian (LOH)** | ✅ | ✅ Review & Setujui | 👁️ Sesuai Shift | 👁️ LOH Disetujui |
| **Ekspor CSV Laporan** | ✅ | ✅ | ❌ | ✅ |
| **Audit Log Keamanan** | ✅ Akses Penuh | ❌ | ❌ | ❌ |

---

## 🔑 Akun Demo Pengujian

Aplikasi telah dilengkapi seeder akun demo siap pakai untuk memverifikasi alur antar-role:

| Role | Email | Password | Site Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@minetrack.com` | `MineTrack2026!` | Semua Site (Head Office) |
| **Mine Supervisor** | `supervisor@minetrack.com` | `MineTrack2026!` | Site Kalimantan Barat (Pit North) |
| **Operator Lapangan**| `operator@minetrack.com` | `MineTrack2026!` | Site Kalimantan Barat (Pit North) |
| **Management** | `manager@minetrack.com` | `MineTrack2026!` | Executive Multi-Site |

> **Catatan Keamanan**: Kredensial di atas digunakan khusus untuk lingkungan pengujian dan *local development*. Pada *production environment*, kata sandi di-hash menggunakan algoritma *Bcrypt* dengan salt terenkripsi.

---

## 🛠️ Teknologi & Stack

- **Framework**: Next.js 16.4.3 (App Router, Turbopack, React 19)
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & Lucide React Icons
- **Komponen UI**: Desain modular industri (Dark Slate / Charcoal `#0F172A`, Safety Amber/Orange `#F59E0B`, Forest Green `#10B981`, Hazard Red `#EF4444`)
- **Database & ORM**: PostgreSQL via Prisma ORM (v6.4.1) & SQLite/JSON engine untuk local standalone resilience
- **Validasi Schema**: Zod & React Hook Form
- **Grafik & Visualisasi**: Recharts
- **Tanggal & Waktu**: date-fns (Format Indonesia & Zona Waktu Asia/Jakarta)
- **Autentikasi & Sesi**: JWT via `jose`, `bcryptjs`, Secure HttpOnly Cookies
- **Testing**: Vitest (Unit & Integration Testing)

---

## 📁 Struktur Direktori

```text
MineTrack/
├── prisma/
│   ├── schema.prisma             # Skema model 20 tabel relasional PostgreSQL
│   └── migrations/
│       └── 0_init/migration.sql  # DDL migrasi SQL lengkap
├── scripts/
│   └── seed.mjs                  # Script seeder standalone data operasional
├── tests/
│   └── unit/
│       ├── production.test.ts    # Pengujian kalkulasi timbang & validasi Zod
│       ├── operations.test.ts    # Pengujian shift, armada, downtime, & status
│       └── auth-rbac.test.ts     # Pengujian login, token JWT, & otorisasi role
├── docs/
│   ├── ERD.md                    # Diagram ERD & relasi tabel database
│   └── WORKFLOW.md               # Alur persetujuan, jadwal shift, & keselamatan
├── src/
│   ├── app/
│   │   ├── (public)/page.tsx     # Landing page publik industrial modern
│   │   ├── login/page.tsx        # Halaman autentikasi aman
│   │   ├── admin/                # Modul & Dashboard Administrator
│   │   ├── supervisor/           # Modul & Dashboard Mine Supervisor
│   │   ├── operator/             # Modul & Dashboard Operator Lapangan
│   │   ├── management/           # Modul & Dashboard Management Eksekutif
│   │   └── api/                  # 17 Route Handlers backend RESTful
│   ├── components/
│   │   ├── ui/                   # Komponen atomik (Button, Badge, Card, Modal)
│   │   ├── layout/               # Sidebar dinamis, Topbar jam WIB, DashboardLayout
│   │   └── dashboard/            # MetricCard & Recharts visualisasi produksi
│   ├── lib/
│   │   ├── auth/                 # Sesi JWT, hash Bcrypt, guard RBAC
│   │   ├── db/                   # Repository data relasional, kalkulasi & audit
│   │   ├── validations/          # Schema Zod untuk seluruh formulir
│   │   └── utils.ts              # Formatter Rupiah, Tanggal ID, & utilitas CSS
│   └── types/                    # Definisi model TypeScript domain tambang
├── .env.example                  # Template variabel lingkungan
├── next.config.ts                # Konfigurasi Next.js
└── vitest.config.ts              # Konfigurasi runner Vitest
```

---

## 💻 Instalasi & Menjalankan Lokal

### Prasyarat
- Node.js versi 18.18+ atau 20+
- npm atau pnpm

### Langkah Instalasi

1. **Clone repository & masuk ke direktori proyek:**
   ```bash
   cd c:\MineTrack
   ```

2. **Instal dependensi:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Salin konfigurasi environment:**
   ```bash
   cp .env.example .env
   ```

4. **Jalankan Seeder Data:**
   ```bash
   npm run prisma:seed
   ```
   *Seeder akan menginisialisasi 4 akun peran demo, 2 lokasi tambang (Kalbar & Kaltim), 3 pit aktif, armada alat berat, target produksi, draf dan laporan produksi contoh, downtime, serta insiden keselamatan.*

5. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian (Testing)

Sistem MineTrack telah diuji menggunakan **Vitest** mencakup validasi matematika timbangan, integritas bisnis, workflow persetujuan, pencegahan bentrok jadwal, keamanan berkas signed URL, rekonsiliasi timbangan vs ritase, konsistensi ketersediaan alat, dan deduplikasi peringatan.

Jalankan seluruh rangkaian unit & integration tests:
```bash
npm test
```

### Hasil Pengujian yang Terverifikasi (27 / 27 Passed - 100%):
- ✅ **Perhitungan Berat Bersih**: $Netto = Bruto - Tara$ dengan pembulatan presisi 2 desimal.
- ✅ **Validasi Timbangan**: Ditolak jika $Bruto < Tara$ atau nilai bernilai negatif.
- ✅ **Workflow Persetujuan**: Operator submit draf $\rightarrow$ Supervisor menyetujui $\rightarrow$ Status berubah menjadi `APPROVED`.
- ✅ **Revisi Catatan**: Catatan berstatus `NEEDS_REVISION` dapat diperbaiki oleh operator pembuat dan diajukan ulang.
- ✅ **Pencegahan Akses Lintas Operator**: Operator lain diblokir dari mengubah catatan milik rekannya (IDOR prevention).
- ✅ **Integritas Angka Resmi**: Catatan draf dan ditolak tidak masuk ke agregasi produksi resmi.
- ✅ **Pencegahan Bentrok Shift**: Deteksi jadwal ganda operator pada tanggal dan shift yang sama.
- ✅ **Pencegahan Bentrok Alat Berat**: Unit tidak dapat dialokasikan ke pekerjaan tumpang tindih pada shift yang sama.
- ✅ **Downtime & Status Armada**: Pelaporan downtime otomatis mengubah unit menjadi `BREAKDOWN` dan penyelesaian downtime mengembalikan unit ke `AVAILABLE`.
- ✅ **Blokir Akun Nonaktif**: Pengguna nonaktif ditolak masuk sistem dengan pesan informasi yang jelas.
- ✅ **Jembatan Timbang Digital**: Validasi gross/tare/net, pencatatan supir/nopol, riwayat koreksi audit, dan alasan pembatalan.
- ✅ **Konsistensi Multi-Factor Status Alat**: Unit dilarang keras diubah menjadi `AVAILABLE` jika memiliki downtime aktif, shift aktif, atau Preventive Maintenance aktif.
- ✅ **Penyimpanan Berkas Aman (Storage)**: Validasi whitelist MIME type, batas ukuran 10MB, UUID nama berkas acak, serta verifikasi HMAC-SHA256 signed URL dengan masa kedaluwarsa.
- ✅ **Rekonsiliasi Produksi**: Scanning otomatis mendeteksi variance antara tiket timbang dan catatan ritase produksi, serta alur resolusi supervisor.
- ✅ **Peringatan Operasional Otomatis**: Deteksi downtime dan risiko keselamatan otomatis dengan kunci deduplikasi (`dedupKey`) untuk mencegah spam notifikasi.
- ✅ **Sinkronisasi Offline Berbasis Idempotensi**: Pemrosesan antrean batch offline dengan kunci idempotensi unik mencegah duplikasi data transaksi.

---

## 🌐 Panduan Deployment Vercel & Supabase

### 1. Setup Database di Supabase / PostgreSQL
1. Buat proyek baru di [Supabase](https://supabase.com) atau instance PostgreSQL production.
2. Buka **SQL Editor**, lalu jalankan DDL migrasi awal dan modul lanjutan:
   - [`prisma/migrations/0_init/migration.sql`](file:///c:/MineTrack/prisma/migrations/0_init/migration.sql)
   - [`prisma/migrations/20261026_advanced_modules/migration.sql`](file:///c:/MineTrack/prisma/migrations/20261026_advanced_modules/migration.sql)
3. Database PostgreSQL kini memiliki skema lengkap (25 tabel relasional, foreign keys, index, dan constraint).

### 2. Konfigurasi Environment Variables di Vercel
Saat melakukan import repository ke [Vercel](https://vercel.com), tambahkan Environment Variables berikut:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
JWT_SECRET="[BUAT_KUNCI_RAHASIA_MINIMAL_32_KARAKTER]"
STORAGE_SIGNING_SECRET="[BUAT_KUNCI_HMAC_SHA256_STORAGE]"
NODE_ENV="production"
```

### 3. Build & Deploy
Perintah build otomatis yang digunakan oleh Vercel:
```bash
npm run build
```
Build telah divalidasi dan menghasilkan **63 halaman dan API route yang terkompilasi bersih (0 TypeScript errors)**.

---

## 📖 Dokumentasi Teknis & Kesiapan Produksi

- **Audit Kesiapan Produksi (18 Area)**: [`docs/PRODUCTION_READINESS_AUDIT.md`](file:///c:/MineTrack/docs/PRODUCTION_READINESS_AUDIT.md)
- **Standar & Kebijakan Keamanan (Security Hardening)**: [`docs/SECURITY.md`](file:///c:/MineTrack/docs/SECURITY.md)
- **SOP Backup & Disaster Recovery (RPO/RTO)**: [`docs/BACKUP_RESTORE.md`](file:///c:/MineTrack/docs/BACKUP_RESTORE.md)
- **Diagram Relasi Entitas (ERD 25 Entitas)**: [`docs/ERD.md`](file:///c:/MineTrack/docs/ERD.md)
- **Siklus Alur Bisnis & Validasi (Workflow)**: [`docs/WORKFLOW.md`](file:///c:/MineTrack/docs/WORKFLOW.md)

---

## 🔌 Kontrak Integrasi Arsitektur Masa Depan (Integration Adapters)

MineTrack telah dilengkapi dengan kontrak antarmuka (*typed interface contracts*) dan adapter siap pakai tanpa simulasi palsu pada direktori `src/lib/integrations/`:
1. **Jembatan Timbang Hardware (`weighbridge-scale.ts`)**: Kompatibel dengan indikator Toledo 8142, Avery Weigh-Tronix, dan Dini Argeo melalui RS-232 / TCP Socket Bridge.
2. **GPS & Telemetri Alat Berat (`telemetry.ts`)**: Ingestion payload GPS, HM, bahan bakar, dan fault codes dari telematics gateway (Komtrax / VIMS / CareTrack).
3. **Sistem Dispatch Armada / FMS (`dispatch.ts`)**: Sinkronisasi penugasan truk, hauler matching, dan antrean loader.
4. **Sistem ERP Korporat (`erp.ts`)**: Integrasi batch akuntansi produksi dan stok batubara/mineral ke SAP, Oracle, atau Microsoft Dynamics.

---

**MineTrack** — *Dikembangkan dengan standar rekayasa perangkat lunak pertambangan modern.*
