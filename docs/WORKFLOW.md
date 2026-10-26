# Workflow Operasional & Persetujuan — MineTrack

Dokumentasi alur bisnis, siklus persetujuan, dan keterhubungan role di dalam sistem **MineTrack**.

---

## 1. Alur Persetujuan Catatan Produksi (Production Approval Workflow)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Operator mencatat data timbang / ritase
    DRAFT --> SUBMITTED : Operator mengajukan untuk review
    SUBMITTED --> UNDER_REVIEW : Supervisor membuka antrean verifikasi
    UNDER_REVIEW --> APPROVED : Supervisor menyetujui (Data valid)
    UNDER_REVIEW --> NEEDS_REVISION : Supervisor mengembalikan + alasan
    UNDER_REVIEW --> REJECTED : Supervisor menolak (Data cacat)
    NEEDS_REVISION --> SUBMITTED : Operator memperbaiki & ajukan ulang
    APPROVED --> [*] : Masuk laporan resmi & agregasi target
    REJECTED --> [*] : Diarsipkan, tidak dihitung
```

### Aturan Bisnis & Validasi Server:
1. **Pemisahan Data Resmi vs Draft**:
   - Hanya catatan dengan status `APPROVED` yang dihitung ke dalam analitik produksi resmi, grafik realisasi target, dan LOH (Laporan Operasional Harian).
   - Catatan berstatus `DRAFT`, `SUBMITTED`, atau `NEEDS_REVISION` dipisahkan secara tegas dan tidak mencemari angka produksi aktual.
2. **Kewenangan Operator**:
   - Operator hanya dapat mengedit catatan miliknya sendiri yang masih berstatus `DRAFT` atau `NEEDS_REVISION`.
   - Operator tidak dapat mengubah catatan yang sudah disetujui (`APPROVED`) atau catatan milik operator lain.
3. **Kewenangan Supervisor**:
   - Supervisor dapat menyetujui (`APPROVE`), menolak (`REJECT`), atau meminta perbaikan (`NEEDS_REVISION`).
   - Saat meminta perbaikan atau menolak, wajib mencantumkan catatan alasan perbaikan untuk memandu operator.
4. **Audit Trail**:
   - Setiap perubahan status dicatat secara atomik ke tabel `production_status_history` dan `audit_logs` dengan identitas user pembuat, status sebelumnya, status baru, alasan, dan stempel waktu.
   - Notifikasi otomatis dikirimkan ke kotak masuk in-app operator terkait.

---

## 2. Alur Pengelolaan Shift & Penugasan Armada

```mermaid
flowchart TD
    A[Supervisor / Admin buat Jadwal Shift] --> B{Validasi Bentrok}
    B -->|Operator sudah ada di shift sama| C[Tolak Penugasan]
    B -->|Alat berat sudah dipakai di shift sama| D[Tolak Alokasi]
    B -->|Valid & Tidak Bentrok| E[Simpan Shift Assignment]
    E --> F[Operator login & melihat penugasan shift di Dashboard]
    F --> G[Operator memulai pencatatan ritase sesuai alokasi]
```

### Pencegahan Konflik (Conflict Detection):
- Validasi mencegah operator ganda pada tanggal dan shift yang sama.
- Validasi mencegah satu unit alat berat yang sama ditugaskan ke lebih dari satu operator pada shift yang sama.
- Mendukung jam kerja shift malam yang melintasi tengah malam (misal 20:00 - 05:00 WIB).

---

## 3. Alur Pelaporan Downtime & Siklus Pemeliharaan Alat

```mermaid
flowchart TD
    A[Gangguan Unit di Pit] --> B[Operator / Petugas lapor Downtime]
    B --> C[Status Alat Berat otomatis menjadi BREAKDOWN]
    C --> D[Notifikasi ke Supervisor & Tim Maintenance]
    D --> E[Penanganan Perbaikan & Penggantian Suku Cadang]
    E --> F[Supervisor / Teknisi tandai Selesai (Resolve)]
    F --> G[Durasi downtime dihitung dalam menit]
    G --> H[Status Alat Berat otomatis kembali AVAILABLE]
    H --> I[Downtime terakumulasi di Dashboard Management & LOH]
```

---

## 4. Alur Manajemen Keselamatan Kerja (K3)

```mermaid
stateDiagram-v2
    [*] --> OPEN : Insiden / Kondisi Tidak Aman dilaporkan
    OPEN --> UNDER_INVESTIGATION : Tim HSE / Supervisor investigasi akar masalah
    UNDER_INVESTIGATION --> ACTION_REQUIRED : Rekomendasi tindakan perbaikan (CAPA)
    ACTION_REQUIRED --> RESOLVED : Tindakan pencegahan telah selesai dijalankan
    RESOLVED --> CLOSED : Supervisor / K3 menyetujui penutupan kasus
    CLOSED --> [*]
```

- Insiden berstatus `CRITICAL` atau `HIGH` otomatis memicu peringatan prioritas tinggi di Dashboard Administrator, Supervisor, dan Management.
- Statistik keselamatan kerja (Zero Fatality, Total Kejadian, Status Penanganan) terhubung langsung ke Executive Dashboard Management.

---

## 5. Alur Jembatan Timbang Digital (Digital Weighbridge Lifecycle)

```mermaid
flowchart TD
    A[Truk Tiba di Jembatan Timbang] --> B[Operator Timbang Timbang Gross Weight]
    B --> C[Truk Bongkar Muatan di ROM / Stockpile]
    C --> D[Truk Kembali Menimbang Tare Weight]
    D --> E{Validasi Sistem}
    E -->|Gross <= Tare atau Negatif| F[Tolak Transaksi Timbang]
    E -->|Gross > Tare| G[Hitung Net Weight = Gross - Tare]
    G --> H[Simpan Tiket Timbang: WB-YYYYMMDD-XXXX]
    H --> I[Unggah Foto Fisik Tiket / Truk via Safe Storage]
    I --> J[Supervisor Review: Verifikasi / Koreksi / Batalkan]
```

### Validasi & Audit Trail Timbangan:
1. **Pencegahan Fraud & Koreksi**: Setiap perbaikan nilai gross/tare sesudah tiket dibuat wajib mengisi alasan koreksi dan tercatat permanen di `correctionHistory`.
2. **Pembatalan Tiket**: Pembatalan tiket jembatan timbang hanya dapat dilakukan dengan mengisi `cancellationReason` wajib dan dicatat dalam audit log.

---

## 6. Alur Rekonsiliasi Produksi & Resolusi Discrepancy

```mermaid
flowchart TD
    A[Supervisor / Manajemen Pilih Site & Tanggal] --> B[Sistem Scan Tiket Timbang vs Ritase Produksi]
    B --> C[Hitung Total Net Timbangan vs Total Ritase Terverifikasi]
    C --> D[Hitung Variance Percentage]
    D --> E{Apakah Deviasi > 5%?}
    E -->|Ya| F[Status: VARIANCE_DETECTED - Peringatan Kuning/Merah]
    E -->|Tidak| G[Status: RECONCILED - Selisih Normal]
    F --> H[Supervisor Investigasi Lapangan: Cek Tare Error / Kalibrasi / Rute]
    H --> I[Supervisor Menyimpan Catatan Resolusi & Tandai Selesai]
    I --> J[Audit Trail Tercipta & Status Berubah Menjadi RESOLVED]
```

---

## 7. Alur Pemeliharaan Preventif & Penegakan Multi-Factor Availability

```mermaid
flowchart TD
    A[Penjadwalan PM berdasarkan Hour Meter / Tanggal] --> B[Status PM: SCHEDULED / IN_PROGRESS]
    B --> C{Pemeriksaan Multi-Factor Status Unit}
    C -->|Mencoba set status AVAILABLE| D[Ditolak: Unit dilarang AVAILABLE jika ada PM aktif]
    C -->|Mencoba alokasi ke Shift Baru| E[Ditolak: Unit sedang dalam siklus servis]
    B --> F[Mekanik Melakukan Servis & Checklist 6 Komponen]
    F --> G[Penyelesaian PM: Status COMPLETED + Update HM]
    G --> H[Pemeriksaan Ulang: Tidak Ada Downtime Aktif & Tidak Ada Shift Aktif]
    H --> I[Unit Diizinkan Kembali ke Status AVAILABLE]
```

---

## 8. Alur Sinkronisasi Offline PWA & Validasi Idempotensi

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Operator Lapangan
    participant PWA as Browser / Local PWA Storage
    participant SW as Service Worker
    participant API as /api/offline/sync
    participant DB as Repository & Database

    Operator->>PWA: Masukkan Data Ritase / Timbang saat Sinyal Hilang
    PWA->>PWA: Buat Idempotency Key (UUID/Timestamp Unik)
    PWA->>PWA: Simpan Transaksi ke Local Sync Queue
    Note over PWA: Indikator UI menunjukkan "Koneksi Offline (N Antrean)"
    SW-->>PWA: Event 'online' terdeteksi saat sinyal pulih
    PWA->>API: POST /api/offline/sync (Kirim batch transaksi + Idempotency Key)
    API->>DB: Cek apakah Idempotency Key sudah pernah diproses
    alt Key Sudah Terdaftar (Duplikat Resend)
        DB-->>API: Abaikan mutasi, kembalikan status SUKSES (Idempotent)
    else Key Baru
        API->>DB: Eksekusi transaksi & simpan catatan audit
        DB-->>API: Konfirmasi transaksi tersimpan
    end
    API-->>PWA: Batch Sinkronisasi Selesai
    PWA->>PWA: Bersihkan Antrean Lokal
    Note over PWA: Indikator UI berubah menjadi "Sistem Online"
```
