# Perbaikan vercel.json — SPA rewrite terlalu agresif

## Penyebab error "Failed to parse source... invalid JS syntax" di index.html

vercel.json lama:
```json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

Aturan `/(.*)` cocok untuk SEMUA path tanpa kecuali. Di production ini aman
(Vercel cek file statis di `dist/` dulu sebelum rewrite diterapkan). Tapi di
`vercel dev`, tidak ada folder `dist/` — semua di-serve live oleh Vite dev
server. Akibatnya request untuk modul asli seperti `/src/main.tsx` atau
`/@vite/client` ikut kena rewrite dan malah menerima isi `index.html`, bukan
kode aslinya — Vite lalu gagal parse karena mengira HTML itu JS.

## Perbaikan

```json
"rewrites": [
  {
    "source": "/((?!api/)(?!.*\\.).*)",
    "destination": "/index.html"
  }
]
```

Regex ini artinya: cocokkan path apa pun, KECUALI yang:
- diawali `api/` (biar endpoint serverless tidak ikut ke-rewrite)
- mengandung titik `.` (artinya punya ekstensi file — .tsx, .css, .js, .png,
  dst — berarti itu request asset/modul asli, bukan halaman SPA)

Jadi cuma path "halaman" murni (`/login`, `/dashboard`, `/daftar`, dst — tanpa
ekstensi) yang di-fallback ke `index.html`. Ini yang memang dibutuhkan supaya
refresh browser di URL client-side routing tidak 404.

## Cara pasang

Timpa `vercel.json` di root project dengan file ini, lalu:

```powershell
npm run dev:api
```

Tidak perlu link ulang ke Vercel lagi — ini cuma ganti isi file konfigurasi,
bukan konfigurasi project di dashboard.
