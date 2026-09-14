# Catatan Perbaikan — Sub-tahap 1 Lanjutan

## 1. Kenapa package.json diperbaiki lagi

Script `"dev": "vercel dev"` menyebabkan error `must not recursively invoke itself`,
karena Vercel CLI membaca key `dev` di package.json sebagai "dev command" bawaan
framework — kalau isinya `vercel dev` lagi, dia mendeteksi itu sebagai potensi
infinite loop dan menolak jalan.

Perbaikan:
- `"dev"` → `"vite"` (frontend murni, cepat, tidak butuh login Vercel)
- `"dev:api"` → `"vercel dev"` (dipanggil manual kalau mau tes endpoint /api sungguhan)
- `"dev:legacy-express"` tetap ada, tidak diubah (fallback ke server.ts lama)

Cara pakai:
```
npm run dev          # cuma frontend Vite (localhost:5173 biasanya)
npm run dev:api       # vercel dev, jalankan frontend + /api/*.ts bareng (localhost:3000)
```

## 2. .gitignore ditambah 2 baris

```
.vercel/              # dibuat otomatis saat login/link vercel, isinya project ID, bukan secret besar tapi standar untuk tidak di-commit
tsconfig.tsbuildinfo  # cache internal tsc, tidak perlu di-commit
```

## 3. WAJIB DIHAPUS MANUAL — 5 file endpoint kanonik yang tidak dipakai

Setelah ditelusuri, `src/services/apiService.ts` (frontend Vite yang aktif)
HANYA memanggil 7 path ini:

```
/api/statistik
/api/peserta
/api/register
/api/verifikasi-pin
/api/login-peserta
/api/ganti-password
/api/scan
```

Path "kanonik" di bawah ini TIDAK PERNAH dipanggil oleh src/ — hanya dipakai oleh
app/ (Next.js, akan dihapus di Sub-tahap 4) dan components/Header.tsx (ikut
Next.js). Supaya jumlah Serverless Function tidak melebihi batas 12 di Vercel
Hobby plan, hapus 5 file ini:

```
api/peserta/register.ts
api/peserta/profile.ts
api/auth/peserta/login.ts
api/auth/peserta/ganti-password.ts
api/auth/panitia/login.ts
```

Setelah dihapus, folder `api/peserta/` dan `api/auth/peserta/` akan kosong —
boleh dihapus foldernya juga (tinggal `api/auth/panitia/` yang sudah tidak
berisi apa-apa juga, boleh dihapus totalnya, sisakan `api/auth/logout.ts`
langsung di `api/auth/`).

Struktur akhir `api/` setelah dihapus (9 file = 9 function, aman untuk Hobby plan):

```
api/health.ts
api/statistik.ts
api/peserta/index.ts        <- GET /api/peserta (dipakai src/)
api/register.ts
api/verifikasi-pin.ts
api/login-peserta.ts
api/ganti-password.ts
api/scan.ts
api/auth/logout.ts          <- belum dipakai src/, sengaja dipertahankan (lihat catatan di bawah)
```

Perintah cepat (jalankan dari root project, PowerShell):
```powershell
Remove-Item api\peserta\register.ts
Remove-Item api\peserta\profile.ts
Remove-Item -Recurse api\auth\peserta
Remove-Item -Recurse api\auth\panitia
```

## 4. Catatan: logout belum dipakai frontend

`api/auth/logout.ts` dipertahankan walau `src/` belum punya tombol/pemanggil
logout sama sekali (dicek: tidak ada string "logout" di `src/`). Ini bukan file
mati yang perlu dihapus — ini gap fungsional asli (peserta/panitia tidak punya
cara resmi logout dari UI). Dicatat sebagai backlog, bukan dikerjakan di
sub-tahap ini.

## 5. Setelah pasang: langkah verifikasi

```powershell
npm install
npm run dev:api
```

Lalu buka `http://localhost:3000/api/health` di browser — harus muncul JSON
`{"status":"ok", ...}`. Kirim hasilnya (atau error di terminal) untuk dicek.
