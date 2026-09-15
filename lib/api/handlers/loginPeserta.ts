import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../prisma.js';
import bcrypt from 'bcryptjs';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../auth/rateLimit.js';
import { signToken, setCookie, PESERTA_COOKIE } from '../auth.js';

const PESAN_GAGAL_LOGIN = 'Username atau Password tidak sesuai. Periksa kembali data Anda.';

export default async function handleLoginPeserta(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const { username, password } = req.body || {};
    const usernameClean = (username || '').toString().trim().toLowerCase();
    const passwordClean = (password || '').toString();

    if (!usernameClean || !passwordClean) {
      res.status(401).json({ status: 'error', message: PESAN_GAGAL_LOGIN });
      return;
    }

    const rateKey = `peserta_${usernameClean}`;
    const rateCheck = await checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({ status: 'error', message: rateCheck.message });
      return;
    }

    const found = await prisma.peserta.findFirst({
      where: {
        OR: [
          { username: usernameClean },
          { idPeserta: { equals: usernameClean, mode: 'insensitive' } },
        ],
      },
    });

    if (!found || !found.passwordHash) {
      await recordFailedAttempt(rateKey);
      res.status(401).json({ status: 'error', message: PESAN_GAGAL_LOGIN });
      return;
    }

    const isMatch = await bcrypt.compare(passwordClean, found.passwordHash);
    if (!isMatch) {
      const failRec = await recordFailedAttempt(rateKey);
      if (failRec.locked) {
        res.status(429).json({
          status: 'error',
          message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.',
        });
        return;
      }
      res.status(401).json({ status: 'error', message: PESAN_GAGAL_LOGIN });
      return;
    }

    await resetRateLimit(rateKey);

    const token = await signToken({
      role: 'peserta',
      idPeserta: found.idPeserta,
      nama: found.namaLengkap,
      unit: found.asalSekolah,
      username: found.username || found.idPeserta,
    });

    const isWajibGanti = found.statusPassword === 'Wajib Ganti';

    setCookie(res, PESERTA_COOKIE, token, 86400);

    res.json({
      status: 'success',
      wajibGantiPassword: isWajibGanti,
      data: {
        id: found.idPeserta,
        nama: found.namaLengkap,
        jk: found.jenisKelamin,
        unit: found.asalSekolah,
        partisipasi: found.partisipasi,
        waktuBerangkat: found.waktuBerangkat ? found.waktuBerangkat.toISOString() : '',
        waktuPulang: found.waktuPulang ? found.waktuPulang.toISOString() : '',
      },
    });
  } catch (err) {
    console.error('Error saat login peserta:', err);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan sistem saat memproses login.' });
  }
}
