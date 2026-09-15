# Setup Database Supabase — Panduan Lengkap

## Kenapa perlu 2 connection string (bukan cuma 1)

Supabase menyediakan dua jenis koneksi ke database yang sama:

- **Pooled connection** (port `6543`, via PgBouncer) — dipakai aplikasi
  runtime (Vercel Serverless Functions). Serverless memicu banyak koneksi
  singkat bersamaan; tanpa pooling, database bisa kehabisan slot koneksi.
- **Direct connection** (port `5432`) — dipakai khusus untuk `prisma migrate`,
  karena migration butuh koneksi langsung yang mendukung fitur seperti
  advisory locks, yang tidak selalu didukung lewat pooler.

Karena itu `schema.prisma` butuh dua variable: `DATABASE_URL` (pooled) dan
`DIRECT_URL` (direct) — sudah saya siapkan di `schema.prisma` versi baru.

---

## Langkah 1 — Buat project Supabase

1. Buka https://supabase.com, login (bisa pakai akun GitHub yang sama).
2. Klik **New Project**.
3. Isi:
   - **Name**: `rihlah-paskibra-samarang-2026` (bebas, untuk identifikasi saja)
   - **Database Password**: generate password kuat, **simpan di tempat aman**
     (password manager) — ini beda dari password akun Supabase kamu, dan
     dibutuhkan lagi untuk connection string.
   - **Region**: pilih yang terdekat dari mayoritas pengguna aplikasi
     (misalnya Singapore kalau target user di Indonesia — latency lebih
     rendah dibanding US).
4. Klik **Create new project**. Tunggu 1-2 menit sampai provisioning selesai.

## Langkah 2 — Ambil kedua connection string

1. Di dashboard project, buka **Project Settings** (ikon gear) → **Database**.
2. Scroll ke bagian **Connection string**.
3. Akan ada beberapa tab/mode. Ambil dua:

   **Untuk `DATABASE_URL` (pooled):**
   - Pilih mode **Transaction** (kadang disebut "Transaction pooler"), port `6543`.
   - Copy string yang formatnya kira-kira:
     ```
     postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```
   - Ganti `[PASSWORD]` dengan password database yang kamu buat di Langkah 1.

   **Untuk `DIRECT_URL` (direct):**
   - Pilih mode **Session** atau cari opsi "Direct connection", port `5432`.
   - Formatnya kira-kira:
     ```
     postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
     ```
     (atau host tanpa `pooler`, tergantung tampilan dashboard Supabase saat
     ini — intinya port `5432`, bukan `6543`)

   Supabase kadang menambahkan parameter tambahan di akhir URL (misal
   `?pgbouncer=true`) — biarkan apa adanya, jangan dihapus.

## Langkah 3 — Set kedua variable ini di Vercel

1. Buka dashboard Vercel → project → **Environment Variables**.
2. Edit `DATABASE_URL` yang sudah ada → ganti value dengan connection string
   **pooled** (port 6543) dari Langkah 2. Pastikan scope: Production, Preview,
   **dan Development** (supaya `vercel dev` di lokal juga ikut jalan).
3. Tambah variable baru: Name `DIRECT_URL`, Value: connection string
   **direct** (port 5432). Scope sama: Production, Preview, Development.
4. Save.

## Langkah 4 — Timpa `prisma/schema.prisma`

Ganti isi `prisma/schema.prisma` project lokal kamu dengan file `schema.prisma`
di zip ini — satu-satunya perubahan adalah baris `directUrl = env("DIRECT_URL")`
ditambahkan di blok `datasource db`, tidak ada perubahan model/tabel.

## Langkah 5 — Tarik ulang env ke lokal & migrate

```powershell
vercel env pull .env.local
npx prisma migrate deploy
```

`prisma migrate deploy` akan membuat tabel `Peserta` dan `LogScan` di database
Supabase yang baru, berdasarkan migration yang sudah ada di
`prisma/migrations/20260914183559_init/migration.sql` — tabelnya akan kosong
(belum ada data peserta), karena ini database baru.

Kalau kamu punya data peserta lama yang perlu dipindahkan (dari Google Sheets
atau database lokal sebelumnya), itu langkah terpisah lewat
`scripts/migrate-from-sheets.ts` — beri tahu saya kalau sudah sampai situ,
supaya saya cek dulu skrip itu sebelum dijalankan ke database production.

## Langkah 6 — Verifikasi

```powershell
npx prisma studio
```

Ini akan membuka browser dengan GUI Prisma Studio, sambungan ke Supabase —
cek apakah tabel `Peserta` dan `LogScan` sudah muncul (kosong itu wajar).

Lalu:
```powershell
npm run dev:api
```

Buka `http://localhost:3000/api/health` — sekarang seharusnya benar-benar
berhasil konek database dan mengembalikan `"totalPeserta": 0` (bukan error
lagi).

## Setelah semua ini beres

Kabari saya — kita lanjut:
1. Coba tes pendaftaran peserta beneran lewat form (yang tadi "Failed to fetch")
2. Redeploy production di Vercel supaya env var baru (`DIRECT_URL`, `DATABASE_URL`
   yang sudah diganti ke Supabase) ikut terpakai di production juga.
3. Baru lanjut commit+push Sub-tahap 4 (cleanup) yang sempat tertunda karena
   masalah database ini.
