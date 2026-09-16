import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { getSession } from '../../lib/api/auth.js';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../lib/auth/rateLimit.js';
import { STRONG_PASSWORD_REGEX, GantiPasswordPesertaSchema } from '../../lib/validation/index.js';
import { logSystem } from '../../lib/logger.js';

/**
 * Normalisasi format nomor telepon Indonesia ke format standar berawalan '08'
 */
function normalizeIndonesianPhone(val: string): string {
  let d = val.replace(/\D/g, '');
  if (d.startsWith('62')) {
    d = '0' + d.slice(2);
  } else if (!d.startsWith('0') && d.length >= 9) {
    d = '0' + d;
  }
  return d;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Delegasikan ke rotasi password panitia jika target adalah panitia
  const isPanitiaSelfChange =
    req.query.target === 'panitia' ||
    req.body?.target === 'panitia' ||
    req.body?.role === 'panitia';

  if (isPanitiaSelfChange) {
    return handlePanitiaGantiPassword(req, res);
  }

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
      // 1. Validasi Sekunder: Status keikutsertaan & kelayakan akun
      // Hanya peserta aktif berstatus 'Ikut' dengan username yang berhak mereset password
      if (targetPeserta.partisipasi !== 'Ikut' || !targetPeserta.username) {
        const [ipFail, targetFail] = await Promise.all([
          recordFailedAttempt(ipKey),
          recordFailedAttempt(targetKey),
        ]);
        if (ipFail.locked || targetFail.locked) {
          logSystem({
            level: 'WARN',
            action: 'GANTI_PASSWORD_LOCKED',
            details: { target: idTarget, reason: 'inactive_or_unregistered' },
            ipAddress: ip,
          });
          return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
        }
        return res.status(400).json({
          error: 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.',
        });
      }

      // 2. Validasi Sekunder Opsional: Asal Sekolah / Unit jika dikirimkan oleh klien
      const unitInput = (req.body?.unit || req.body?.asalSekolah || '').toString().trim().toLowerCase();
      if (unitInput && targetPeserta.asalSekolah.trim().toLowerCase() !== unitInput) {
        const [ipFail, targetFail] = await Promise.all([
          recordFailedAttempt(ipKey),
          recordFailedAttempt(targetKey),
        ]);
        if (ipFail.locked || targetFail.locked) {
          logSystem({
            level: 'WARN',
            action: 'GANTI_PASSWORD_LOCKED',
            details: { target: idTarget, reason: 'unit_mismatch' },
            ipAddress: ip,
          });
          return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
        }
        return res.status(400).json({
          error: 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.',
        });
      }

      // 3. Verifikasi Nomor WhatsApp Terdaftar (Normalisasi Penuh, Minimal 10 digit, Tanpa substring longgar)
      const waInputNorm = normalizeIndonesianPhone(waInput);
      if (waInputNorm.length < 10 || waInputNorm.length > 15) {
        return res.status(400).json({
          error: 'Format nomor WhatsApp tidak valid. Masukkan nomor lengkap minimal 10 digit.',
        });
      }

      const dbWaPribadiNorm = normalizeIndonesianPhone(targetPeserta.waPribadi || '');
      const dbWaDaruratNorm = normalizeIndonesianPhone(targetPeserta.waDarurat || '');

      const isWaMatch =
        (dbWaPribadiNorm && dbWaPribadiNorm === waInputNorm) ||
        (dbWaDaruratNorm && dbWaDaruratNorm === waInputNorm);

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

    // Catat log audit trail keberhasilan
    logSystem({
      level: 'INFO',
      action: isForgotReset ? 'RESET_PASSWORD_FORGOT_SUCCESS' : 'GANTI_PASSWORD_ACTIVE_SUCCESS',
      actorId: targetPeserta.idPeserta || targetPeserta.username || idTarget,
      details: {
        flow: isForgotReset ? 'forgot_reset' : 'active_change',
        idPeserta: targetPeserta.idPeserta,
      },
      ipAddress: ip,
    });

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

/**
 * Handler khusus untuk rotasi password panitia aktif (via dasbor pengaturan)
 */
async function handlePanitiaGantiPassword(req: VercelRequest, res: VercelResponse) {
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

    if (confirmPassword && newPassword !== confirmPassword) {
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


