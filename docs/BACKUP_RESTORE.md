# MineTrack — Prosedur Pencadangan & Pemulihan Database (Backup & Disaster Recovery)

Dokumentasi resmi prosedur pencadangan (*backup*), retensi, dan pemulihan bencana (*disaster recovery*) untuk database sistem operasional pertambangan **MineTrack**.

---

## 1. Kebijakan Pencadangan Database

Untuk menjamin ketersediaan data produksi tambang dan kepatuhan terhadap regulasi pertambangan (ESDM / KaIT):
- **Full Backup Harian**: Dijalankan setiap hari pukul 01:00 WIB (luar jam pergantian shift utama).
- **WAL Archiving / Continuous PITR**: Pada platform Supabase / PostgreSQL cloud, Write-Ahead Logging (WAL) mencatat setiap transaksi sehingga memungkinkan pemulihan titik waktu (*Point-in-Time Recovery*) hingga detik tertentu.
- **Kebijakan Retensi (Retention Policy)**:
  - Salinan cadangan harian disimpan selama **30 hari**.
  - Salinan cadangan mingguan disimpan selama **12 minggu**.
  - Salinan cadangan bulanan disimpan selama **12 bulan**.
  - Salinan tahunan disimpan selama **7 tahun** (sesuai standar audit minerba).

---

## 2. Perintah Pencadangan Database (*Backup Execution*)

### A. Full Backup PostgreSQL via CLI (`pg_dump`)

Gunakan format biner terkompresi (*custom format* `-F c`) yang mendukung eksekusi paralel dan seleksi objek:

```bash
# Menjalankan pencadangan manual atau via cron job
pg_dump "$DATABASE_URL" \
  --format=custom \
  --blobs \
  --verbose \
  --file="./backups/minetrack_full_$(date +%Y%m%d_%H%M%S).dump"
```

### B. Otomatisasi Jadwal via Crontab (Linux/Server)
Tambahkan ke `/etc/cron.d/minetrack_backup`:
```cron
0 1 * * * postgres pg_dump "$DATABASE_URL" -F c -b -f /var/backups/minetrack/minetrack_$(date +\%Y\%m\%d).dump && find /var/backups/minetrack/ -type f -mtime +30 -delete
```

---

## 3. Prosedur Pemulihan Database (*Restore Procedure*)

Jika terjadi kerusakan database, kegagalan disk, atau korupsi data:

### Langkah 1: Karantina & Hentikan Lalu Lintas Aplikasi
Aktifkan mode pemeliharaan (*maintenance mode*) agar tidak ada transaksi baru yang masuk selama proses pemulihan.

### Langkah 2: Eksekusi Pemulihan via `pg_restore`

```bash
# 1. Pastikan koneksi ke database target
# 2. Jalankan pg_restore dengan opsi --clean untuk membersihkan skema sebelum penulisan ulang
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --verbose \
  "./backups/minetrack_full_20261026_010000.dump"
```

### Langkah 3: Verifikasi Integritas Data Pasca-Restore
Setelah pemulihan selesai:
1. Periksa tabel pengguna: `SELECT count(*) FROM "User";`
2. Periksa catatan produksi: `SELECT count(*) FROM "ProductionRecord" WHERE status = 'APPROVED';`
3. Jalankan pengujian kesehatan sistem:
   ```bash
   curl -s http://localhost:3000/api/health | jq .
   ```
4. Pastikan status database berstatus `CONNECTED` dengan latensi normal.

---

## 4. Simulasi Uji Petik Pemulihan (*Disaster Recovery Drill*)

- Uji petik pemulihan wajib dijalankan **minimal 1 kali setiap kuartal** di lingkungan staging/testing yang terisolasi.
- Catat waktu pemulihan (*Recovery Time Objective / RTO* target: &lt; 30 menit).
- Catat titik kehilangan data maksimal (*Recovery Point Objective / RPO* target: &lt; 15 menit).
