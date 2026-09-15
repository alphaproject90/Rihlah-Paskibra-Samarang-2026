import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { getSession } from '../../lib/api/auth';
import { STRONG_PASSWORD_REGEX, GantiPasswordPesertaSchema } from '../../lib/validation';

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
        return res.status(400).json({
          error: 'Nomor WhatsApp tidak cocok dengan data pendaftaran peserta.',
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

