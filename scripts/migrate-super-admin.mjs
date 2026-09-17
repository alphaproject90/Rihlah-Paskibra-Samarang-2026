/**
 * scripts/migrate-super-admin.mjs
 *
 * Script migrasi 1x (idempotent): membaca akun panitia lama dari env-var
 * (PANITIA_USERNAME + PANITIA_PASSWORD_HASH) dan memindahkannya sebagai baris
 * pertama di tabel Panitia dengan role SUPER_ADMIN.
 *
 * CARA MENJALANKAN:
 *   npm run migrate:admin
 *   (atau: node scripts/migrate-super-admin.mjs)
 *
 * KAPAN DIJALANKAN:
 *   - 1x saja, setelah migration DB Tahap 1 (add_panitia_model) berhasil di-apply.
 *   - Aman dijalankan ulang — script ini idempotent (cek duplikat sebelum insert).
 *
 * PRASYARAT:
 *   - PANITIA_USERNAME dan PANITIA_PASSWORD_HASH harus sudah diset di .env / .env.local
 *   - DIRECT_URL harus aktif (koneksi langsung ke DB, bukan pooler)
 */

import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env / .env.local secara manual (tidak pakai dotenv agar tidak ada dep tambahan)
function loadEnv() {
  const files = ['.env.local', '.env'];
  for (const f of files) {
    try {
      const content = readFileSync(resolve(process.cwd(), f), 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
      console.log(`✔ Loaded env from ${f}`);
    } catch {
      // file tidak ada — lanjut ke berikutnya
    }
  }
}

loadEnv();

const prisma = new PrismaClient();

async function main() {
  const username = process.env.PANITIA_USERNAME;
  const passwordHash = process.env.PANITIA_PASSWORD_HASH;

  // Validasi env var wajib
  if (!username) {
    console.error('❌ ERROR: PANITIA_USERNAME tidak ditemukan di environment variables.');
    console.error('   Set dulu di .env atau .env.local sebelum menjalankan script ini.');
    process.exit(1);
  }
  if (!passwordHash) {
    console.error('❌ ERROR: PANITIA_PASSWORD_HASH tidak ditemukan di environment variables.');
    console.error('   Set dulu di .env atau .env.local sebelum menjalankan script ini.');
    process.exit(1);
  }
  if (!passwordHash.startsWith('$2')) {
    console.error('❌ ERROR: PANITIA_PASSWORD_HASH tampaknya bukan hash bcrypt yang valid.');
    console.error('   Hash bcrypt harus diawali dengan $2a$ atau $2b$.');
    console.error('   Generate dengan: node -e "require(\'bcryptjs\').hash(\'PASSWORD\', 10).then(h => console.log(h))"');
    process.exit(1);
  }

  console.log(`\n🔍 Mengecek apakah akun "${username}" sudah ada di tabel Panitia...`);

  // Idempotency check — jangan insert jika sudah ada
  const existing = await prisma.panitia.findUnique({ where: { username } });
  if (existing) {
    console.log(`✅ Akun "${username}" sudah ada di tabel Panitia (id: ${existing.id}).`);
    console.log('   Tidak ada perubahan yang dilakukan — script selesai (idempotent).\n');
    return;
  }

  console.log(`📝 Akun "${username}" belum ada. Membuat akun SUPER_ADMIN baru...`);

  const akun = await prisma.panitia.create({
    data: {
      username,
      passwordHash,
      namaLengkap: 'Super Admin (Migrated)',
      role: 'SUPER_ADMIN',
      mobil: null,
      aktif: true,
      createdBy: null, // null = dibuat via migrasi, bukan oleh Super Admin lain
    },
  });

  console.log('\n✅ Berhasil! Akun Super Admin berhasil dibuat:');
  console.log(`   ID       : ${akun.id}`);
  console.log(`   Username : ${akun.username}`);
  console.log(`   Nama     : ${akun.namaLengkap}`);
  console.log(`   Role     : ${akun.role}`);
  console.log(`   Aktif    : ${akun.aktif}`);
  console.log(`   CreatedAt: ${akun.createdAt.toLocaleString('id-ID')}`);
  console.log('\n💡 Tip: Login panitia sekarang akan menggunakan akun dari tabel Panitia.');
  console.log('   Env var PANITIA_USERNAME & PANITIA_PASSWORD_HASH masih berfungsi sebagai');
  console.log('   fallback selama login.ts belum di-update (Tahap 1 sudah menangani ini).\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Script gagal dengan error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
