import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { getSession } from '../../lib/api/auth.js';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../lib/auth/rateLimit.js';
import { STRONG_PASSWORD_REGEX, GantiPasswordPesertaSchema } from '../../lib/validation/index.js';
import { logSystem } from '../../lib/logger.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const parseResult = GantiPasswordPesertaSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || 'Data ganti password tidak valid';
    return res.status(400).json({ error: errorMsg });
  }

  const { identifier, username, noWa, oldPassword, newPassword } = req.body || {};
  const idTarget = (identifier || username || '').toString().trim();
  const waInput = (noWa || '').toString().replace(/\D/g, '');
  const newPassStr = (newPassword || '').toString();

  // Validasi server-side kekuatan password (minimal 8 karakter kombinasi)
  if (!STRONG_PASSWORD_REGEX.test(newPassStr)) {
    return res.status(400).json({
      error: 'Password minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.',
    });
  }

  // Ekstrak IP klien untuk rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';

  try {
    // Cek sesi yang mungkin ada (panitia atau peserta)
    const sessionPanitia = await getSession(req, 'panitia');
    const sessionPeserta = await getSession(req, 'peserta');

    // Tentukan alur:
    // Flow (a): Ganti password aktif jika ada oldPassword, ATAU ada sesi peserta aktif
    // Flow (b): Reset password darurat/lupa jika ada hak akses panitia, ATAU verifikasi identitas (identifier + noWa)
    const isPanitiaReset = Boolean(sessionPanitia && (sessionPanitia as { role?: string }).role === 'panitia');
    const isForgotReset = Boolean(!oldPassword && idTarget && waInput);
    const isActiveChange = Boolean(oldPassword || (sessionPeserta && oldPassword));

    if (!isPanitiaReset && !isForgotReset && !isActiveChange) {
      return res.status(400).json({
        error: 'Permintaan tidak valid: Sertakan password lama untuk ganti password, atau nomor WhatsApp untuk reset lupa password.',
      });
    }

    // Tentukan pasangan key rate limit untuk non-panitia
    let ipKey = '';
    let targetKey = '';

    if (!isPanitiaReset) {
      if (isForgotReset) {
        ipKey = `ganti_pass_forgot_ip_${ip}`;
        targetKey = `ganti_pass_forgot_target_${idTarget}`;
      } else {
        const idUser = (sessionPeserta as { idPeserta?: string })?.idPeserta || idTarget;
        ipKey = `ganti_pass_active_ip_${ip}`;
        targetKey = `ganti_pass_active_user_${idUser}`;
      }

      // Periksa KEDUA key secara paralel via Promise.all
      const [ipCheck, targetCheck] = await Promise.all([
        checkRateLimit(ipKey),
        checkRateLimit(targetKey),
      ]);

      if (!ipCheck.allowed || !targetCheck.allowed) {
        return res.status(429).json({ error: ipCheck.message || targetCheck.message });
      }
    }

    // Temukan peserta target
    let targetPeserta = null;

    if (sessionPeserta && (sessionPeserta as { idPeserta?: string }).idPeserta && !isForgotReset && !isPanitiaReset) {
      const idPeserta = (sessionPeserta as { idPeserta?: string }).idPeserta;
      targetPeserta = await prisma.peserta.findUnique({ where: { idPeserta } });
    } else if (idTarget) {
      targetPeserta = await prisma.peserta.findFirst({
        where: {
          OR: [
            { username: idTarget },
            { idPeserta: { equals: idTarget, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!targetPeserta) {
      if (isForgotReset && !isPanitiaReset) {
        // Anti-enumeration: Catat gagal dan samakan respons dengan WA mismatch
        const [ipFail, targetFail] = await Promise.all([
          recordFailedAttempt(ipKey),
          recordFailedAttempt(targetKey),
        ]);
        if (ipFail.locked || targetFail.locked) {
          logSystem({
            level: 'WARN',
            action: 'GANTI_PASSWORD_LOCKED',
            details: { target: idTarget },
            ipAddress: ip,
          });
          return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
        }
        return res.status(400).json({ error: 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.' });
      }
      return res.status(404).json({ error: 'Akun peserta tidak ditemukan.' });
    }

    // ─── Flow (a): Ganti Password Aktif (Memerlukan Password Lama) ───────────────
    if (isActiveChange && !isPanitiaReset) {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Password lama wajib diisi.' });
      }

      // Wajib validasi password lama jika akun sudah memiliki passwordHash
      if (targetPeserta.passwordHash) {
        const isValid = await bcrypt.compare(oldPassword, targetPeserta.passwordHash);
        if (!isValid) {
          const [ipFail, targetFail] = await Promise.all([
            recordFailedAttempt(ipKey),
            recordFailedAttempt(targetKey),
          ]);
          if (ipFail.locked || targetFail.locked) {
            logSystem({
              level: 'WARN',
              action: 'GANTI_PASSWORD_LOCKED',
              details: { target: idTarget },
              ipAddress: ip,
            });
            return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
          }
          return res.status(401).json({ error: 'Password lama salah.' });
        }
      }
    }

    // ─── Flow (b): Reset Password Darurat / Lupa ───────────────────────────────
    if (isForgotReset && !isPanitiaReset) {
      // Verifikasi nomor WhatsApp terdaftar
      const dbWaPribadi = (targetPeserta.waPribadi || '').replace(/\D/g, '');
      const dbWaDarurat = (targetPeserta.waDarurat || '').replace(/\D/g, '');

      const isWaMatch =
        (dbWaPribadi && dbWaPribadi.endsWith(waInput.slice(-8))) ||
        (dbWaDarurat && dbWaDarurat.endsWith(waInput.slice(-8))) ||
        dbWaPribadi === waInput ||
        dbWaDarurat === waInput;

      if (!isWaMatch) {
        // Anti-enumeration: pesan identik dengan user not found
        const [ipFail, targetFail] = await Promise.all([
          recordFailedAttempt(ipKey),
          recordFailedAttempt(targetKey),
        ]);
        if (ipFail.locked || targetFail.locked) {
          logSystem({
            level: 'WARN',
            action: 'GANTI_PASSWORD_LOCKED',
            details: { target: idTarget },
            ipAddress: ip,
          });
          return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
        }
        return res.status(400).json({
          error: 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.',
        });
      }
    }

    // Hash password baru dengan bcrypt cost factor 12 (standar aman)
    const newPasswordHash = await bcrypt.hash(newPassStr, 12);

    await prisma.peserta.update({
      where: { id: targetPeserta.id },
      data: {
        passwordHash: newPasswordHash,
        statusPassword: 'Selesai',
      },
    });

    // Reset rate limit jika berhasil
    if (!isPanitiaReset) {
      await Promise.all([resetRateLimit(ipKey), resetRateLimit(targetKey)]);
    }

    const successMsg = isForgotReset
      ? 'Password berhasil diperbarui! Silakan login kembali dengan password baru Anda.'
      : 'Password berhasil diubah.';

    return res.status(200).json({
      success: true,
      status: 'success',
      message: successMsg,
    });
  } catch (error) {
    console.error('Ganti/Reset password error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

