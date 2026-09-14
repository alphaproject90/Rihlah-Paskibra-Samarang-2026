# Perbaikan Final vercel.json — Hapus rewrite SPA sepenuhnya

## Kenapa perbaikan sebelumnya (regex "kecuali ada titik") masih gagal

Fix sebelumnya:
```json
"source": "/((?!api/)(?!.*\\.).*)"
```
Idenya: lewati path yang mengandung titik (dianggap file/asset). Tapi Vite
punya path virtual internal TANPA titik, contoh:
- `/@vite/client`
- `/@react-refresh`

Path ini tidak mengandung `.` sama sekali, jadi tetap ketangkap rewrite dan
tetap dibalikin isi `index.html` — makanya error "invalid JS syntax" yang
sama persis muncul lagi walau sudah "diperbaiki".

## Akar masalah sebenarnya: rewrite ini memang tidak dibutuhkan

Dicek langsung ke `src/App.tsx`: navigasi antar halaman (home, daftar, login,
dashboard, scanner, dst) dikontrol lewat `useState<HalamanType>` di dalam
SATU komponen React — bukan lewat URL routing. Tidak ada `react-router-dom`
di dependencies sama sekali.

Artinya: seluruh aplikasi memang hanya hidup di satu alamat, `/`. Tidak ada
halaman lain yang perlu di-fallback-kan ke `index.html` saat direfresh,
karena tidak ada URL lain yang pernah dipakai. Rewrite SPA di vercel.json itu
sisa konfigurasi yang tidak relevan untuk arsitektur app ini — bukan cuma
salah tulis regex, tapi memang tidak perlu ada sejak awal.

## Perbaikan

```json
{
  "framework": "vite",
  "buildCommand": "vite build",
  "outputDirectory": "dist"
}
```

Rewrites dihapus total. Request ke `/api/*` otomatis ditangani serverless
function (default Vercel, tidak perlu rewrite manual). Request lain (asset,
modul Vite, halaman) diserve apa adanya oleh Vite — tidak ada lagi yang
"dibajak" jadi index.html.

## Cara pasang

Timpa `vercel.json` di root project, lalu:
```powershell
npm run dev:api
```
