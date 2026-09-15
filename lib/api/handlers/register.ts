import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../prisma.js';
import bcrypt from 'bcryptjs';
import { RegisterPesertaSchema } from '../../validation/index.js';

export default async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const parseResult = RegisterPesertaSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Data pendaftaran tidak valid.';
      res.status(400).json({ status: 'error', error: firstError, message: firstError });
      return;
    }

    const payload = parseResult.data;
    const isIkut = payload.partisipasi === 'Ikut';

    // Transaksi Prisma mencegah race condition pendaftaran
    const created = await prisma.$transaction(async (tx) => {
      const usernameClean = isIkut && payload.username ? payload.username.trim().toLowerCase() : null;

      if (usernameClean) {
        const exist = await tx.peserta.findUnique({
          where: { username: usernameClean },
        });
        if (exist) {
          throw new Error('DUPLICATE_USERNAME');
        }
      }

      let idPeserta = '';
      if (isIkut) {
        const countIkut = await tx.peserta.count({ where: { partisipasi: 'Ikut' } });
        idPeserta = `PASK-${String(countIkut + 1).padStart(4, '0')}`;
        let exists = await tx.peserta.findUnique({ where: { idPeserta } });
        let offset = 1;
        while (exists) {
          idPeserta = `PASK-${String(countIkut + 1 + offset).padStart(4, '0')}`;
          exists = await tx.peserta.findUnique({ where: { idPeserta } });
          offset++;
        }
      } else {
        const countTidak = await tx.peserta.count({ where: { partisipasi: 'Tidak Ikut' } });
        idPeserta = `TIDAK-IKUT-${String(countTidak + 1).padStart(4, '0')}`;
      }

      // Hash password dengan bcrypt cost factor 12
      let passHash: string | null = null;
      if (isIkut && payload.password) {
        passHash = await bcrypt.hash(payload.password, 12);
      }

      const record = await tx.peserta.create({
        data: {
          idPeserta,
          namaLengkap: payload.nama.trim(),
          jenisKelamin: payload.jk || 'Laki-laki',
          asalSekolah: payload.unit.trim(),
          partisipasi: payload.partisipasi,
          alasanTidakIkut: isIkut ? null : payload.alasan?.trim(),
          waPribadi: isIkut ? payload.waPeserta?.trim() : null,
          waDarurat: isIkut ? payload.waDarurat?.trim() : null,
          riwayatMedis: isIkut ? (payload.medis?.trim() || '-') : null,
          username: usernameClean,
          passwordHash: passHash,
          statusPassword: isIkut ? 'Selesai' : null,
        },
      });

      return record;
    });

    res.json({
      status: 'success',
      id: created.idPeserta,
      message: 'Pendaftaran berhasil disimpan!',
    });
  } catch (err: any) {
    if (err?.message === 'DUPLICATE_USERNAME' || err?.code === 'P2002') {
      res.json({ status: 'error', message: 'Username sudah digunakan. Silakan pilih username lain.' });
      return;
    }
    console.error('Error pendaftaran peserta:', err);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan sistem saat mendaftar.' });
  }
}
