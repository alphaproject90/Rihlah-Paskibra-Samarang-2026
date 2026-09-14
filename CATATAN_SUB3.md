# Sub-tahap 3 — Update package.json & workflow dev lokal

## Yang berubah (cuma di `scripts` + 1 devDependency baru)

| Sebelum | Sesudah | Kenapa |
|---|---|---|
| `"dev": "tsx server.ts"` | `"dev": "vercel dev"` | Ini titik **cutover** sesungguhnya: mulai sekarang `npm run dev` menjalankan Vite (frontend) + semua `/api/*.ts` sebagai serverless function lokal, bukan lagi Express. |
| *(tidak ada)* | `"dev:legacy-express": "tsx server.ts"` | Saya sengaja **tambahkan**, bukan hapus, cara lama — supaya kalau nanti kamu ragu/mau bandingkan perilaku, tinggal `npm run dev:legacy-express`. Aman dihapus sendiri nanti kalau sudah yakin. |
| `"build": "vite build && esbuild server.ts --bundle ..."` | `"build": "vite build"` | Build production tidak lagi butuh bundle `server.ts` — Vercel akan build & jalankan setiap file di `/api` langsung dari source saat deploy, tidak perlu di-bundle manual di sini. |
| `"start": "node dist/server.cjs"` | *(dihapus)* | Sudah tidak relevan — `build` baru tidak lagi menghasilkan `dist/server.cjs`, jadi script ini kalau dijalankan justru akan error. |
| *(devDependency baru)* | `"vercel": "^59.17.0"` | Supaya `vercel dev` bisa jalan reproducible tanpa bergantung ke CLI global yang mungkin beda versi di komputer lain. |

## Yang SENGAJA belum saya sentuh — dan kenapa
Rencana awal Sub-tahap 3 juga menyebut "hapus dependency `express` dan `next`".
Saya **tunda** ini, karena:
- `server.ts` masih ada secara fisik dan masih `import express` — kalau
  dependency-nya dicabut sekarang, `tsc --noEmit` yang baru saja lolos di
  komputer kamu akan langsung merah lagi (`Cannot find module 'express'`).
- Folder `app/` (Next.js, sudah diputuskan mau dihapus di Jalur B) masih
  memakai `next`/`next/server` — sama alasannya.

Jadi urutan yang lebih aman: **hapus dependency `express`/`next` BARENGAN**
dengan penghapusan `server.ts`/`app/`/`middleware.ts` di Sub-tahap 4 — bukan
sebelum itu. Kalau dilakukan terpisah (dependency dicabut duluan, file
dihapus belakangan), akan ada jendela waktu di mana project gagal type-check.

## Cara pasang & tes
1. Copy `package.json` di zip ini, timpa `package.json` project lokal kamu.
2. `npm install` (untuk install `vercel` CLI sebagai devDependency).
3. Jalankan `npm run dev` → ini akan memanggil `vercel dev`. Kemungkinan dia
   akan tanya beberapa hal saat pertama kali jalan (link ke project Vercel
   atau jalan standalone) — ikuti saja prompt-nya, pilih "no" / skip kalau
   ditanya soal link ke akun Vercel (tidak wajib untuk sekadar tes lokal).
4. Setelah server lokal `vercel dev` jalan (biasanya di `http://localhost:3000`),
   coba buka `http://localhost:3000/api/health` di browser — kalau muncul JSON
   `{"status":"ok", ...}`, endpoint baru benar-benar jalan secara runtime.
5. `npx tsc --noEmit` lagi untuk pastikan tidak ada yang rusak dari perubahan
   script ini (harusnya tetap 0 error, karena scripts tidak memengaruhi
   type-checking).

## BELUM diverifikasi oleh saya
Saya tidak bisa menjalankan `vercel dev` di sandbox saya (butuh koneksi ke
akun Vercel/jaringan yang lebih terbuka). Jadi **langkah 3–4 di atas wajib
kamu coba sendiri dan konfirmasi hasilnya ke saya** — jangan anggap sub-tahap
ini selesai sampai kamu benar-benar lihat `/api/health` merespons.
