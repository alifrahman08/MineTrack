# MineTrack — Production Readiness Audit Report

Dokumentasi audit menyeluruh terhadap arsitektur, keamanan, integritas data, alur bisnis, dan kesiapan operasional sistem **MineTrack**.

**Waktu Audit:** 2026-10-26  
**Auditor:** Senior Full-Stack Engineer, Software Architect, Security Engineer, QA & Database Specialist  
**Standar Klasifikasi Status:**
1. **Berfungsi dan telah diverifikasi** (Fitur utuh, backend & database terhubung, divalidasi test).
2. **Berfungsi sebagian** (Alur utama berjalan, namun terdapat batasan fitur atau validasi edge-case).
3. **Ada di UI tetapi belum terhubung ke backend** (Mocked atau client-only).
4. **Belum tersedia** (Belum diimplementasikan).
5. **Memiliki masalah keamanan atau integritas data** (Rentan IDOR, race condition, data duplikat, atau kebocoran akses).

---

## 1. Matriks Evaluasi Kesiapan Modul

| No | Modul / Area Sistem | Status Awal | Tingkat Risiko | File Terkait Utama | Temuan Audit & Kelemahan yang Ditemukan | Rencana Tindakan Perbaikan |
|:---|:---|:---:|:---:|:---|:---|:---|
| 1 | **Authentication & Session Management** | 1 | Sedang | `src/lib/auth/index.ts`, `src/app/api/auth/*` | Login JWT, Bcrypt hash, cookie HttpOnly berfungsi. Namun belum ada mekanisme invalidasi sesi instan jika role diubah di database saat token masih aktif. | Tambahkan verifikasi `isActive` dan role terkini dari database pada rute sensitif (`requireAuth`, `requireRole`). |
| 2 | **Role-Based Access Control (RBAC)** | 2 | Tinggi | `src/lib/auth/index.ts`, `src/app/api/*` | Guard level halaman ada di sidebar & layout, tetapi beberapa route handler API belum memverifikasi filter `siteId` (risiko IDOR antar-site). | Perketat seluruh API route dengan validasi kepemilikan site (`siteAccesses`) dan kepemilikan catatan. |
| 3 | **Master Data (Site, Pit, Blok, Material)** | 1 | Rendah | `src/app/admin/master/*`, `src/lib/db/*` | CRUD lengkap berfungsi. Proteksi relasional mencegah penghapusan master data yang memiliki transaksi. | Pertahankan dan perluas integrasi ke modul jembatan timbang dan rekonsiliasi. |
| 4 | **Shift & Penugasan Armada** | 1 | Sedang | `src/app/admin/shifts/*`, `src/lib/db/*` | Deteksi bentrok jadwal operator dan alat berat berfungsi dan lulus 2 unit test. Mendukung shift lintas tengah malam. | Tambahkan kaitan langsung antara shift assignment aktif dengan status ketersediaan alat. |
| 5 | **Catatan Produksi & Perhitungan Timbangan** | 2 | Tinggi | `src/app/admin/production/*`, `src/app/operator/production/*` | Rumus Netto = Bruto - Tara berjalan. Validasi server aktif. Belum ada nomor tiket timbang (*weighbridge ticket*) mandiri, data plat dump truck, dan petugas timbang (*weighmaster*). | Implementasikan Modul Jembatan Timbang Digital (Digital Weighbridge) dengan validasi tiket unik, plat dump truck, driver, dan weighmaster. |
| 6 | **Workflow Persetujuan (Approval Engine)** | 1 | Sedang | `src/app/api/production/[id]/review`, `src/lib/db/*` | Alur Draft -> Submitted -> Approved/Rejected/Needs Revision terverifikasi. Catatan draft tidak masuk agregasi resmi. Operator hanya bisa edit draft/revisi miliknya. | Tambahkan audit riwayat status jembatan timbang dan rekonsiliasi ke dalam workflow persetujuan. |
| 7 | **Monitoring Alat Berat & Armada** | 2 | Tinggi | `src/app/admin/equipment/*`, `src/lib/db/*` | CRUD alat berat dan status dinamis ada. Namun saat downtime selesai, status alat langsung diubah menjadi `AVAILABLE` tanpa memeriksa apakah ada downtime lain atau maintenance yang masih berlangsung. | Terapkan aturan *Multi-Factor Availability Consistency*: Unit tidak boleh `AVAILABLE` jika ada downtime aktif lain, maintenance berjalan, atau penugasan belum selesai. |
| 8 | **Downtime & Preventive Maintenance** | 2 | Tinggi | `src/app/admin/downtime/*`, `src/lib/db/*` | Pelaporan downtime dan durasi berfungsi. Namun modul *Preventive Maintenance (PM)* terjadwal, batas *hour meter*, dan riwayat komponen yang diperiksa belum tersedia. | Bangun modul *Preventive Maintenance* (jadwal berkala, jam operasi, checklist komponen, teknisi penanggung jawab). |
| 9 | **Laporan Operasional Harian (LOH)** | 1 | Rendah | `src/app/admin/reports/*`, `src/lib/db/*` | Form LOH per shift dan site berfungsi. Verifikasi supervisor dan penolakan ber-alasan berfungsi. | Integrasikan data downtime aktual dan tiket timbang langsung ke ringkasan LOH otomatis. |
| 10 | **Pengawasan Keselamatan Kerja (K3 / HSE)** | 1 | Sedang | `src/app/admin/safety/*`, `src/lib/db/*` | Pencatatan insiden, severity (Low-Critical), alur investigasi, dan tindak lanjut perbaikan berfungsi. | Hubungkan insiden berstatus CRITICAL langsung ke *Operational Alert Engine* agar memicu peringatan darurat. |
| 11 | **Dashboard & Analitik Recharts** | 2 | Sedang | `src/app/admin/analytics/*`, `src/components/dashboard/*` | Perhitungan Target vs Realisasi dengan *safe-divide* berjalan. Belum ada grafik produksi per jam, rata-rata ritase, dan rasio ketersediaan alat (*Mechanical Availability*). | Lengkapi rumus analitik produksi per jam, ritase, dan ketersediaan armada tambang. |
| 12 | **Pusat Notifikasi In-App** | 1 | Rendah | `src/components/layout/topbar.tsx`, `src/lib/db/*` | Notifikasi in-app tersimpan di DB, terisolasi per user, unread badge, popover. | Hubungkan dengan sistem peringatan operasional (Operational Alerts) dan cegah duplikasi notifikasi. |
| 13 | **Security Audit Logs** | 1 | Rendah | `src/app/admin/audit-logs/*`, `src/lib/db/*` | Mencatat user, timestamp, jenis aksi, entitas, dan detail tanpa secret/password. | Tambahkan pencatatan untuk aksi jembatan timbang, rekonsiliasi, upload dokumen, dan maintenance. |
| 14 | **Ekspor Laporan (CSV & Cetak)** | 1 | Sedang | `src/app/api/export/csv/*` | Ekspor CSV dinamis dengan filter tanggal/site berfungsi dan lolos uji. | Tambahkan penanda eksplisit antara data aktual dan estimasi pada hasil ekspor. |
| 15 | **Upload Bukti Foto & Dokumen** | 3 | Tinggi | Seluruh form produksi & K3 | Sebelumnya masih mencatat URL referensi (placeholder mode). Belum ada penyimpanan berkas riil dengan validasi MIME dan nama acak yang aman. | Bangun modul *Secure Document Storage* dengan verifikasi MIME type, batasan 10MB, penyimpanan fisik/Supabase, dan *signed URL*. |
| 16 | **Rekonsiliasi Produksi** | 4 | Tinggi | Belum ada | Belum ada mekanisme untuk membandingkan tiket timbang dengan catatan produksi ritase, mendeteksi tiket ganda atau tidak tertaut. | Bangun Modul Rekonsiliasi Produksi untuk supervisor & management dengan deteksi selisih (*variance*) dan catatan investigasi. |
| 17 | **PWA & Offline Support** | 4 | Sedang | Belum ada | Operator tambang di area pit pedalaman sering kehilangan sinyal, namun belum ada service worker, manifest, dan antrean draf offline. | Implementasikan PWA (manifest, service worker), antrean draf lokal dengan *Idempotency Key*, dan sinkronisasi saat online kembali. |
| 18 | **Sistem Peringatan Operasional (Alerts)** | 4 | Sedang | Belum ada | Belum ada sistem terpusat yang mendeteksi otomatis kondisi gawat (produksi drop, LOH terlambat, insiden kritis belum ditangani). | Bangun *Operational Alert Engine* dengan deduplikasi pintar (*dedup key*) agar tidak mengirim peringatan duplikat tiap refresh. |
| 19 | **Kesehatan Sistem & Prosedur Backup/Restore** | 4 | Tinggi | Belum ada | Belum ada health check endpoint, monitoring latensi DB/storage, dan SOP backup-restore PostgreSQL teruji. | Buat `/api/health`, halaman `/admin/system`, serta dokumen resmi `docs/BACKUP_RESTORE.md`. |
| 20 | **Arsitektur Integrasi Eksternal (Telemetri/GPS/ERP)** | 4 | Rendah | Belum ada | Belum ada kontrak antarmuka (*typed adapter interfaces*) untuk GPS/IoT, weighbridge fisik, dan ERP. | Buat kontrak interface adapter bersih di `src/lib/integrations/` tanpa simulasi palsu. |

---

## 2. Rencana Tindakan Perbaikan Prioritas Tinggi (P0 - P1)

1. **Perbaikan Keamanan & Validasi Site Access (P0)**:
   - Memastikan seluruh endpoint API `/api/production`, `/api/equipment`, `/api/shifts`, `/api/reports`, dan `/api/safety` memeriksa apakah pengguna berhak mengakses `siteId` yang diminta.
   - Mencegah manipulasi ID catatan produksi milik operator lain.

2. **Digital Weighbridge & Integritas Tiket Timbang (P1)**:
   - Buat model `WeighbridgeTicket` dengan nomor tiket unik, nomor plat dump truck, operator/driver, weighmaster, waktu masuk & keluar, bruto, tara, netto (tervalidasi server), serta status tiket.
   - Hubungkan tiket timbang dengan `ProductionRecord` secara atomik.

3. **Secure Document Storage (P1)**:
   - Sediakan endpoint `/api/upload` yang memverifikasi MIME type (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), membatasi ukuran maksimal 10MB, menyimpan berkas dengan nama aman terenkripsi (UUID), dan mencatat metadata di database.
   - Sediakan *signed URL* dengan batas waktu kedaluwarsa untuk berkas privat.

4. **Multi-Factor Equipment Availability & Preventive Maintenance (P1)**:
   - Buat aturan validasi konsistensi status armada: unit tidak dapat menjadi `AVAILABLE` jika masih memiliki downtime terbuka, maintenance berjalan, atau penugasan aktif.
   - Buat jadwal *Preventive Maintenance (PM)* berkala dan catatan jam operasi (*hour meter*).

5. **Modul Rekonsiliasi Produksi (P1)**:
   - Buat modul rekonsiliasi yang membandingkan total berat tiket timbang vs catatan ritase, mendeteksi tiket belum tertaut, dan menyediakan alur investigasi selisih bagi supervisor.

6. **PWA & Offline Queue (P4)**:
   - Tambahkan Web App Manifest, Service Worker, antrean draf offline dengan *Idempotency Key*, dan deteksi status koneksi.

---

## 3. Kesimpulan Awal Audit
Arsitektur dasar MineTrack telah memiliki fondasi data relasional dan workflow persetujuan yang solid. Dengan penambahan digital weighbridge, secure storage, rekonsiliasi produksi, konsistensi armada multi-faktor, dan sistem peringatan operasional, MineTrack dapat dinaikkan statusnya dari sistem dasar menjadi sistem operasional pertambangan yang tangguh, aman, dan siap untuk evaluasi produksi nyata.
