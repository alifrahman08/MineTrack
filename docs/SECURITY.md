# MineTrack — Security & Hardening Architecture

Dokumentasi arsitektur keamanan, otentikasi, otorisasi berbasis peran (RBAC), perlindungan data lintas-site, dan mitigasi kerentanan pada sistem **MineTrack**.

---

## 1. Otentikasi & Manajemen Sesi JWT

- **Token Format**: JSON Web Token (JWT) ditandatangani menggunakan algoritma kriptografi simetris `HS256`.
- **Penyimpanan Sesi**: Sesi disimpan secara aman di peramban klien menggunakan cookie dengan parameter:
  - `HttpOnly = true` (Mencegah serangan XSS mengakses token via JavaScript).
  - `Secure = true` pada lingkungan produksi (Token hanya ditransmisikan melalui HTTPS).
  - `SameSite = Lax` (Mencegah serangan Cross-Site Request Forgery / CSRF).
  - `Max-Age = 86400` (Kedaluwarsa 24 jam).
- **Password Hashing**: Menggunakan `bcryptjs` dengan *salt rounds* standar industri (10 putaran). Kata sandi dalam bentuk teks polos (*plaintext*) tidak pernah disimpan di database maupun jejak audit log.
- **Pemeriksaan Akun Aktif**: Setiap upaya login dan akses route sensitif memverifikasi kolom `isActive = true`. Jika akun dinonaktifkan oleh Administrator, akses langsung ditolak seketika (*login block*).

---

## 2. Otorisasi Berbasis Peran & Isolasi Data Site (RBAC & IDOR)

### Matriks Akses Kewenangan:

| Role | Ruang Lingkup Otoritas | Pembatasan Kritis |
| :--- | :--- | :--- |
| **ADMINISTRATOR** | Konfigurasi sistem, master data, seluruh site, manajemen akun, audit logs. | Tidak boleh menghapus master data yang sedang memiliki transaksi aktif. |
| **MINE SUPERVISOR** | Pengawasan lapangan, verifikasi jembatan timbang, persetujuan catatan produksi, rekonsiliasi, penugasan shift, downtime, dan K3 pada site yang ditugaskan. | Tidak dapat mengubah konfigurasi sistem global atau mengelola akun Administrator. |
| **OPERATOR LAPANGAN** | Input data produksi (timbang & ritase), pelaporan downtime, temuan K3, antrean draf offline. | **Hanya dapat mengedit draf miliknya sendiri** atau laporan berstatus `NEEDS_REVISION`. Dilarang mengedit catatan operator lain atau catatan yang telah disetujui (`APPROVED`). |
| **MANAGEMENT** | Akses baca (*read-only*) analitik multi-site, tren pencapaian target, laporan produksi resmi, rekapitulasi downtime & K3, ekspor CSV. | Dilarang mengubah catatan produksi yang telah disetujui atau menerbitkan tiket timbang. |

### Pencegahan IDOR (*Insecure Direct Object References*):
1. Setiap mutasi catatan produksi (`/api/production/[id]`) memverifikasi bahwa `record.operatorId === session.user.id` atau pengguna memiliki role `ADMINISTRATOR` / `SUPERVISOR`.
2. Pengambilan data produksi, jadwal shift, dan downtime memvalidasi `siteAccesses` pengguna. Pengguna tidak dapat sekadar mengganti parameter URL `siteId` untuk melihat data tambang di luar kewenangannya.

---

## 3. Kebijakan Penyimpanan Dokumen Aman (*Secure Storage Policy*)

Penyimpanan berkas foto tiket timbang, foto kondisi alat berat, dan bukti K3 mengikuti standar keamanan:
1. **Validasi Server-Side MIME Type**: Hanya format `image/jpeg`, `image/png`, `image/webp`, dan `application/pdf` yang diterima. Berkas berbahaya seperti `.exe`, `.sh`, `.php`, atau `.js` otomatis ditolak.
2. **Batasan Ukuran**: Maksimum 10MB per berkas untuk mencegah *Denial of Service* (DoS) berbasis memori/disk.
3. **Penamaan Objek Terenkripsi (UUID)**: Nama berkas fisik diubah menjadi acak menggunakan `crypto.randomUUID()`, mencegah tebakan URL (*path traversal*) atau penimpaan file sengaja (*file overwriting*).
4. **Tautan Bertanda Tangan (*Signed URL*)**: Berkas privat diakses melalui endpoint `/api/upload/view` dengan tanda tangan HMAC-SHA256 dan batas waktu kedaluwarsa (*expiration timestamp*). Tautan yang dimanipulasi atau kedaluwarsa akan ditolak dengan status HTTP 403.
5. **Pembersihan Berkas Gagal**: Jika penyimpanan metadata database gagal, berkas fisik yang sempat terunggah ke disk otomatis dihapus (*cleanup orphaned file*).

---

## 4. Keamanan Audit Log & Forensik

Seluruh tindakan operasional penting tercatat permanen di tabel `AuditLog`:
- Penerbitan tiket jembatan timbang dan setiap koreksi nilai timbang (mencatat nilai sebelum, nilai sesudah, pelaku, dan alasan).
- Transisi status persetujuan produksi (`DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `APPROVED` / `REJECTED` / `NEEDS_REVISION`).
- Penugasan shift dan alokasi alat berat.
- Pelaporan downtime dan penyelesaian perbaikan.
- Pengunggahan dan penghapusan dokumen bukti.
- Login berhasil dan penolakan akun nonaktif.

> **Larangan**: Audit log dilarang keras menyimpan password, token JWT, secret key, atau data kredensial sensitif.
