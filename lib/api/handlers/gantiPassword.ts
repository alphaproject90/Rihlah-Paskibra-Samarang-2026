import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../prisma';
import bcrypt from 'bcryptjs';
import { STRONG_PASSWORD_REGEX } from '../../validation';
import { getSession } from '../auth';

export default async function handleGantiPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const { identifier, username, noWa, oldPassword, newPassword } = req.body || {};
    const idTarget = (identifier || username || '').toString().trim().toLowerCase();
    const waInput = (noWa || '').toString().replace(/\D/g, '');
    const newPassStr = (newPassword || '').toString();

    if (!STRONG_PASSWORD_REGEX.test(newPassStr)) {
      res.json({
        status: 'error',
        message: 'Password baru minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol.',
      });
      return;
    }

    // Periksa sesi peserta
    const session = await getSession(req, 'peserta');

    // Transaksi Prisma mencegah race condition update password
    await prisma.$transaction(async (tx) => {
      let target = null;

      if (session && (session as any).idPeserta) {
        target = await tx.peserta.findUnique({
          where: { idPeserta: (session as any).idPeserta },
        });
      } else if (idTarget && waInput) {
        // Alur Lupa Password dengan verifikasi WhatsApp
        target = await tx.peserta.findFirst({
          where: {
            OR: [
              { username: idTarget },
              { idPeserta: { equals: idTarget, mode: 'insensitive' } },
            ],
          },
        });

        if (!target) throw new Error('NOT_FOUND');

        const dbWa = (target.waPribadi || '').replace(/\D/g, '');
        if (!dbWa || dbWa !== waInput) {
          throw new Error('WA_MISMATCH');
        }
      } else if (idTarget && oldPassword) {
        target = await tx.peserta.findFirst({
          where: {
            OR: [
              { username: idTarget },
              { idPeserta: { equals: idTarget, mode: 'insensitive' } },
            ],
          },
        });

        if (!target || !target.passwordHash) throw new Error('NOT_FOUND');

        const match = await bcrypt.compare(oldPassword, target.passwordHash);
        if (!match) throw new Error('WRONG_PASSWORD');
      } else {
        throw new Error('UNAUTHORIZED');
      }

      if (!target) throw new Error('NOT_FOUND');

      if (session && oldPassword && target.passwordHash) {
        const match = await bcrypt.compare(oldPassword, target.passwordHash);
        if (!match) throw new Error('WRONG_PASSWORD');
      }

      const newHashed = await bcrypt.hash(newPassStr, 10);
      await tx.peserta.update({
        where: { id: target.id },
        data: {
          passwordHash: newHashed,
          statusPassword: 'Selesai',
        },
      });
    });

    res.json({
      status: 'success',
      message: 'Password berhasil diperbarui! Silakan login kembali dengan password baru Anda.',
    });
  } catch (err: any) {
    if (err?.message === 'WRONG_PASSWORD') {
      res.json({ status: 'error', message: 'Password saat ini tidak sesuai.' });
      return;
    }
    if (err?.message === 'WA_MISMATCH') {
      res.json({ status: 'error', message: 'Nomor WhatsApp tidak cocok dengan data terdaftar peserta.' });
      return;
    }
    if (err?.message === 'NOT_FOUND') {
      res.json({ status: 'error', message: 'Akun dengan Username atau ID Peserta tersebut tidak ditemukan.' });
      return;
    }
    if (err?.message === 'UNAUTHORIZED') {
      res.json({ status: 'error', message: 'Nomor WhatsApp terdaftar diperlukan untuk verifikasi lupa password.' });
      return;
    }
    console.error('Error saat ganti password:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memperbarui password.' });
  }
}
