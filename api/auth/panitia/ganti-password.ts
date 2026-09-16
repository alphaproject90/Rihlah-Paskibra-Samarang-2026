import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma.js';
import { getSession } from '../../../lib/api/auth.js';
import { STRONG_PASSWORD_REGEX } from '../../../lib/validation/index.js';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../../lib/auth/rateLimit.js';
import { logSystem } from '../../../lib/logger.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `panitia_ganti_pass_ip_${ip}`;

  try {
    // 1. Verifikasi hak akses: Hanya panitia dengan sesi aktif yang dapat mengganti password
    const session = await getSession(req, 'panitia');
    if (!session || (session as any).role !== 'panitia') {
      return res.status(401).json({
        success: false,
        error: 'Sesi panitia tidak valid atau telah kedaluwarsa. Silakan login ulang.',
      });
    }

    // 2. Periksa rate limit
    const rateLimitCheck = await checkRateLimit(rateLimitKey);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ error: rateLimitCheck.message });
    }

    const { oldPassword, newPassword, confirmPassword } = req.body || {};

    if (!oldPassword || typeof oldPassword !== 'string') {
      return res.status(400).json({ error: 'Password lama wajib diisi.' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Password baru wajib diisi.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Konfirmasi password baru tidak cocok.' });
    }

    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        error: 'Password baru minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.',
      });
    }

    // 3. Ambil hash password panitia aktif (dari Pengaturan DB atau fallback env)
    const pengaturan = await prisma.pengaturan.findUnique({ where: { id: 'singleton' } });
    const currentHash = (pengaturan as any)?.panitiaPasswordHash || process.env.PANITIA_PASSWORD_HASH;

    if (!currentHash) {
      return res.status(500).json({ error: 'Server misconfiguration: Kredensial panitia tidak terdaftar.' });
    }

    // 4. Verifikasi kecocokan password lama
    const isOldMatch = await bcrypt.compare(oldPassword, currentHash);
    if (!isOldMatch) {
      const { locked } = await recordFailedAttempt(rateLimitKey);
      if (locked) {
        logSystem({
          level: 'CRITICAL',
          action: 'PANITIA_PASSWORD_CHANGE_LOCKED',
          actorId: 'panitia',
          ipAddress: ip,
        });
        return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
      }

      logSystem({
        level: 'WARN',
        action: 'PANITIA_PASSWORD_CHANGE_FAILED',
        actorId: 'panitia',
        details: { reason: 'invalid_old_password' },
        ipAddress: ip,
      });

      return res.status(400).json({ error: 'Password lama tidak sesuai.' });
    }

    // 5. Hash password baru dengan bcrypt cost factor 12
    const newHash = await bcrypt.hash(newPassword, 12);

    // 6. Simpan password baru ke tabel Pengaturan singleton
    await (prisma.pengaturan as any).upsert({
      where: { id: 'singleton' },
      update: {
        panitiaPasswordHash: newHash,
        updatedOleh: (session as any).username || 'panitia',
      },
      create: {
        id: 'singleton',
        panitiaPasswordHash: newHash,
        updatedOleh: (session as any).username || 'panitia',
      },
    });

    // 7. Reset rate limit dan catat audit log keberhasilan
    await resetRateLimit(rateLimitKey);

    logSystem({
      level: 'INFO',
      action: 'PANITIA_PASSWORD_CHANGED',
      actorId: 'panitia',
      details: { message: 'Password panitia berhasil diperbarui via dasbor pengaturan' },
      ipAddress: ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Password panitia berhasil diperbarui! Gunakan password baru untuk login berikutnya.',
    });
  } catch (error) {
    console.error('Error saat ganti password panitia:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat memperbarui password panitia.' });
  }
}
