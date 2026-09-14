import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SheetRow {
  idPeserta: string;
  namaLengkap: string;
  jenisKelamin: string;
  asalSekolah: string;
  partisipasi: string;
  alasanTidakIkut?: string;
  waPribadi?: string;
  waDarurat?: string;
  riwayatMedis?: string;
  waktuBerangkat?: string;
  waktuPulang?: string;
  username?: string;
  passwordPlain?: string;
}

/**
 * Script ETL satu kali: Migrasi data dari Google Sheets / CSV ke database PostgreSQL (Prisma)
 */
export async function migrateData(rows: SheetRow[]) {
  console.log(`🚀 Memulai proses migrasi ${rows.length} baris data peserta ke PostgreSQL...`);

  let successCount = 0;
  let failCount = 0;

  for (const row of rows) {
    try {
      const idClean = row.idPeserta?.trim();
      if (!idClean) continue;

      const partisipasiNorm =
        row.partisipasi?.toLowerCase().includes('tidak') ? 'Tidak Ikut' : 'Ikut';

      // Parse timestamp jika ada
      let berangkatDate: Date | null = null;
      if (row.waktuBerangkat && row.waktuBerangkat !== '-' && row.waktuBerangkat.trim() !== '') {
        const d = new Date(row.waktuBerangkat);
        if (!isNaN(d.getTime())) berangkatDate = d;
      }

      let pulangDate: Date | null = null;
      if (row.waktuPulang && row.waktuPulang !== '-' && row.waktuPulang.trim() !== '') {
        const d = new Date(row.waktuPulang);
        if (!isNaN(d.getTime())) pulangDate = d;
      }

      // Hash password
      let passwordHash: string | null = null;
      let statusPassword = 'Wajib Ganti';

      if (row.passwordPlain && row.passwordPlain.trim().length >= 4) {
        passwordHash = await bcrypt.hash(row.passwordPlain.trim(), 10);
      } else {
        // Default PIN awal '1945' jika belum ada
        passwordHash = await bcrypt.hash('1945', 10);
      }

      const usernameClean = row.username ? row.username.trim().toLowerCase() : null;

      // Upsert data peserta (idempoten)
      await prisma.peserta.upsert({
        where: { idPeserta: idClean },
        update: {
          namaLengkap: row.namaLengkap.trim(),
          jenisKelamin: row.jenisKelamin?.trim() || 'Laki-laki',
          asalSekolah: row.asalSekolah?.trim() || '-',
          partisipasi: partisipasiNorm,
          alasanTidakIkut: row.alasanTidakIkut?.trim() || null,
          waPribadi: row.waPribadi?.trim() || null,
          waDarurat: row.waDarurat?.trim() || null,
          riwayatMedis: row.riwayatMedis?.trim() || null,
          waktuBerangkat: berangkatDate,
          waktuPulang: pulangDate,
          username: usernameClean,
          // Jaga password existing jika sudah ada
        },
        create: {
          idPeserta: idClean,
          namaLengkap: row.namaLengkap.trim(),
          jenisKelamin: row.jenisKelamin?.trim() || 'Laki-laki',
          asalSekolah: row.asalSekolah?.trim() || '-',
          partisipasi: partisipasiNorm,
          alasanTidakIkut: row.alasanTidakIkut?.trim() || null,
          waPribadi: row.waPribadi?.trim() || null,
          waDarurat: row.waDarurat?.trim() || null,
          riwayatMedis: row.riwayatMedis?.trim() || null,
          waktuBerangkat: berangkatDate,
          waktuPulang: pulangDate,
          username: usernameClean,
          passwordHash,
          statusPassword,
        },
      });

      successCount++;
    } catch (err) {
      console.error(`Gagal migrasi baris ID ${row.idPeserta}:`, err);
      failCount++;
    }
  }

  console.log(`✅ Migrasi selesai! Sukses: ${successCount}, Gagal: ${failCount}`);
}

// Data awal benih / sampel migrasi nyata untuk pengujian lokal
const sampleInitialData: SheetRow[] = [
  {
    idPeserta: 'PASK-0001',
    namaLengkap: 'Rizky Pratama',
    jenisKelamin: 'Laki-laki',
    asalSekolah: 'SMAN 1 Garut',
    partisipasi: 'Ikut',
    waPribadi: '081234567890',
    waDarurat: '081234567899',
    riwayatMedis: '-',
    username: 'rizky123',
    passwordPlain: '1945',
  },
  {
    idPeserta: 'PASK-0002',
    namaLengkap: 'Siti Nurhaliza',
    jenisKelamin: 'Perempuan',
    asalSekolah: 'SMAN 2 Garut',
    partisipasi: 'Ikut',
    waPribadi: '081987654321',
    waDarurat: '081987654320',
    riwayatMedis: 'Alergi Dingin',
    username: 'sitinur',
    passwordPlain: '1945',
  },
  {
    idPeserta: 'PASK-0003',
    namaLengkap: 'Ahmad Fauzi',
    jenisKelamin: 'Laki-laki',
    asalSekolah: 'SMAN 17 Garut',
    partisipasi: 'Ikut',
    waPribadi: '085712345678',
    waDarurat: '085712345679',
    riwayatMedis: '-',
    username: 'ahmadf',
    passwordPlain: '1945',
  },
  {
    idPeserta: 'TIDAK-IKUT-0001',
    namaLengkap: 'Budi Santoso',
    jenisKelamin: 'Laki-laki',
    asalSekolah: 'SMKN 1 Garut',
    partisipasi: 'Tidak Ikut',
    alasanTidakIkut: 'Ujian Kejuruan Eksternal',
  },
];

migrateData(sampleInitialData)
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
