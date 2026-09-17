import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const prisma = new PrismaClient();
const outDir = 'backup-db';

async function main() {
  if (!existsSync(outDir)) mkdirSync(outDir);

  const tables = [
    { name: 'peserta', query: () => prisma.peserta.findMany() },
    { name: 'pengaturan', query: () => prisma.pengaturan.findMany() },
    { name: 'logScan', query: () => prisma.logScan.findMany() },
    { name: 'dokumen', query: () => prisma.dokumen.findMany() },
    { name: 'systemLog', query: () => prisma.systemLog.findMany() },
    { name: 'resetPasswordRequest', query: () => prisma.resetPasswordRequest.findMany() },
  ];

  const summary = [];
  for (const t of tables) {
    try {
      const data = await t.query();
      const filePath = `${outDir}/${t.name}.json`;
      writeFileSync(filePath, JSON.stringify(data, null, 2));
      summary.push({ table: t.name, status: 'OK', rows: data.length, file: filePath });
    } catch (err) {
      summary.push({ table: t.name, status: 'GAGAL', error: err.message });
    }
  }

  console.log('=== RINGKASAN BACKUP (tanpa isi data) ===');
  console.table(summary.map(s => ({
    Tabel: s.table,
    Status: s.status,
    Baris: s.rows ?? '-',
  })));
}

main()
  .catch((e) => console.error('Error fatal:', e.message))
  .finally(() => prisma.$disconnect());
