# Tahap 2 / Jalur B — Sub-tahap 1: Endpoint /api/*.ts (Vercel Serverless Functions)

## Cara pasang ke project lokal kamu
1. Extract zip ini, lalu copy semua folder/file (`api/`, `lib/`) ke root project
   `Rihlah-Paskibra-Samarang-2026` kamu — akan **menambahkan** file baru, TIDAK
   menimpa file lama (server.ts, app/, src/ semuanya utuh, tidak disentuh).
2. `package.json` di sini SUDAH beda dari punya kamu — cuma nambah 1 baris
   devDependency `@vercel/node`. Cara paling aman: buka `package.json` kamu,
   tambahkan manual baris ini di `devDependencies` (jangan overwrite seluruh
   file, supaya perubahan lain di lokal kamu — kalau ada — tidak hilang):
   ```json
   "@vercel/node": "^13.0.1",
   ```
3. Jalankan `npm install` (atau `bun install`, sesuai lockfile yang kamu pakai)
   supaya `@vercel/node` ter-install.
4. Jalankan `npx prisma generate` (di lokal kamu, jaringan bebas jadi ini akan
   berhasil — beda dengan sandbox saya yang network-nya dibatasi).
5. Jalankan `npx tsc --noEmit` — **ini WAJIB**, karena di sandbox saya
   pengecekan tipe Prisma tidak bisa 100% jalan (lihat catatan di bawah).

## Yang sudah saya verifikasi vs yang BELUM
- ✅ **Verified**: 17 file baru lolos bundling `esbuild` (sintaks + semua path
  import resolve dengan benar) — dicek langsung, bukan asumsi.
- ✅ **Verified**: `tsc --noEmit` jalan 0 error, termasuk validasi tipe asli
  `VercelRequest`/`VercelResponse` dari `@vercel/node` (bukan stub).
- ⚠️ **BELUM diverifikasi**: bagian query Prisma (nama field, `$transaction`,
  dll) di dalam file-file ini — karena `npx prisma generate` gagal di sandbox
  saya (query engine binary dari `binaries.prisma.sh` diblokir jaringan
  sandbox). Kodenya sendiri adalah salinan 1:1 dari `server.ts` yang sudah
  terbukti jalan, tapi tetap **jalankan `tsc --noEmit` di lokal kamu** sebagai
  konfirmasi akhir sebelum dianggap beres.
- ⚠️ **BELUM diuji end-to-end** (jalan beneran lewat `vercel dev` / request
  HTTP asli) — itu bagian Sub-tahap 5 (deploy & uji), belum sub-tahap ini.

## Daftar file baru
```
lib/api/auth.ts                          JWT sign/verify + cookie parser + getSession
lib/api/handlers/register.ts             logic handleRegister
lib/api/handlers/loginPeserta.ts         logic handleLoginPeserta
lib/api/handlers/gantiPassword.ts        logic handleGantiPassword
lib/api/handlers/loginPanitia.ts         logic handleLoginPanitia

api/health.ts                            GET  /api/health
api/statistik.ts                         GET  /api/statistik
api/peserta/index.ts                     GET  /api/peserta            (protected: panitia)
api/peserta/profile.ts                   GET  /api/peserta/profile    (protected: peserta)
api/peserta/register.ts                  POST /api/peserta/register
api/register.ts                          POST /api/register           (alias)
api/auth/peserta/login.ts                POST /api/auth/peserta/login
api/login-peserta.ts                     POST /api/login-peserta      (alias)
api/auth/peserta/ganti-password.ts       POST /api/auth/peserta/ganti-password
api/ganti-password.ts                    POST /api/ganti-password     (alias)
api/auth/panitia/login.ts                POST /api/auth/panitia/login
api/verifikasi-pin.ts                    POST /api/verifikasi-pin     (alias)
api/auth/logout.ts                       POST /api/auth/logout
api/scan.ts                              POST /api/scan               (protected: panitia)
```

## Kesetaraan dengan Tahap 1 (keamanan) — dicek satu per satu
| Fix Tahap 1 | Ada di server.ts | Ada di versi baru |
|---|---|---|
| Guard session `GET /api/peserta` | ✅ | ✅ `api/peserta/index.ts` |
| Guard session `POST /api/scan` | ✅ | ✅ `api/scan.ts` |
| PIN default 1945/0000 dihapus | ✅ | ✅ `lib/api/handlers/loginPanitia.ts` |
| Fail-fast `JWT_SECRET` | ✅ | ✅ `lib/api/auth.ts` (lihat catatan runtime di bawah) |

**Beda perilaku fail-fast JWT_SECRET** (bukan bug, tapi konsekuensi arsitektur
serverless yang perlu kamu tahu): di `server.ts`, satu proses panjang crash
total kalau `JWT_SECRET` kosong — semua endpoint mati. Di Vercel, setiap
function di-bundle terpisah, jadi guard di `lib/api/auth.ts` hanya bikin
function yang benar-benar meng-import modul itu yang gagal saat cold start
(hampir semua function, kecuali `api/health.ts` dan `api/statistik.ts` yang
memang tidak butuh auth). Efeknya sama secara praktis: kalau env var lupa
diisi di Vercel, endpoint-endpoint yang butuh sesi tetap tidak akan pernah
jalan.

## Satu bugfix kecil di luar scope Tahap 1 (saya tandai eksplisit)
Di `handleRegister` versi lama (`server.ts`), ada bug yang sudah pernah kita
temukan waktu audit: validasi `waDarurat` tidak ada `return;`, jadi kalau WA
darurat invalid tapi field lain valid, eksekusi tetap lanjut dan berpotensi
error "Cannot set headers after they are sent". Di `lib/api/handlers/register.ts`
saya **tambahkan `return;` yang hilang itu** — ini penyimpangan kecil dari
"pure copy-paste", saya putuskan untuk memperbaikinya sekalian karena sudah
teridentifikasi jelas sebagai bug nyata, bukan perilaku yang disengaja.
Beri tahu saya kalau kamu ingin saya balikin ke perilaku lama (tanpa `return`)
supaya port ini 100% identik dulu, baru diperbaiki terpisah.

## Belum dikerjakan (sengaja, sesuai batasan Sub-tahap 1)
- `server.ts`, `app/`, `middleware.ts`, `vite.config.ts` — masih utuh, belum
  dihapus (itu Sub-tahap 4, setelah endpoint baru ini teruji).
- `package.json` scripts (`dev`, `build`) — belum diubah ke `vercel dev`
  (itu Sub-tahap 3).
