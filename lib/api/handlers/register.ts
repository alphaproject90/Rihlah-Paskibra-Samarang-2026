import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../prisma.js';
import bcrypt from 'bcryptjs';
import { PHONE_REGEX, USERNAME_REGEX, STRONG_PASSWORD_REGEX } from '../../validation/index.js';

export default async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const payload = req.body;
    if (!payload || !payload.nama || !payload.unit) {
      res.status(400).json({ status: 'error', message: 'Data pendaftaran belum lengkap.' });
      return;
    }

    const isIkut = payload.partisipasi === 'Ikut';

    // Validasi server-side
    if (isIkut) {
      const waPeserta = (payload.waPeserta || '').toString().trim();
      const waDarurat = (payload.waDarurat || '').toString().trim();
      const usernameInput = (payload.username || '').toString().trim().toLowerCase();
      const passwordInput = (payload.password || '').toString();

      if (!PHONE_REGEX.test(waPeserta)) {
        res.json({
          status: 'error',
          message: 'Nomor WhatsApp Peserta tidak valid. Gunakan format nomor telepon yang benar (contoh: 08123456789).',
        });
        return;
      }
      if (!PHONE_REGEX.test(waDarurat)) {
        res.json({
          status: 'error',
          message: 'Nomor WhatsApp Darurat tidak valid. Gunakan format nomor telepon yang benar (contoh: 08123456789).',
        });
        return;
      }
      if (!USERNAME_REGEX.test(usernameInput)) {
        res.json({
          status: 'error',
          message: 'Username tidak valid. Gunakan 4-20 karakter huruf/angka/underscore tanpa spasi.',
        });
        return;
      }
      if (!STRONG_PASSWORD_REGEX.test(passwordInput)) {
        res.json({
          status: 'error',
          message: 'Password minimal 8 karakter dan harus kombinasi huruf besar, huruf kecil, angka, dan simbol.',
        });
        return;
      }
    } else {
      if (!payload.alasan || payload.alasan.trim().length < 3) {
        res.json({ status: 'error', message: 'Harap cantumkan alasan tidak mengikuti rihlah.' });
        return;
      }
    }

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

      // Hash password dengan bcrypt cost >= 10
      let passHash: string | null = null;
      if (isIkut && payload.password) {
        passHash = await bcrypt.hash(payload.password, 10);
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
