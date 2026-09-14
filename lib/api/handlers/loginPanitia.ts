import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../auth/rateLimit';
import { signToken, setCookie, PANITIA_COOKIE } from '../auth';

export default async function handleLoginPanitia(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const { pin } = req.body || {};
    const pinStr = (pin || '').toString().trim();

    if (!pinStr || pinStr.length < 4) {
      res.status(400).json({ status: 'error', message: 'PIN panitia minimal 4 digit angka.' });
      return;
    }

    const rateKey = 'panitia_pin_auth';
    const rateCheck = await checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({ status: 'error', message: rateCheck.message });
      return;
    }

    const pinHashEnv = process.env.PANITIA_PIN_HASH;

    // ⚠️ SECURITY FIX #3 (Tahap 1, dipertahankan): fail-fast, TIDAK ada fallback PIN default
    if (!pinHashEnv) {
      res.status(500).json({ status: 'error', message: 'PANITIA_PIN_HASH belum dikonfigurasi di environment.' });
      return;
    }

    const isValid = await bcrypt.compare(pinStr, pinHashEnv);

    if (!isValid) {
      const failRec = await recordFailedAttempt(rateKey);
      if (failRec.locked) {
        res.status(429).json({
          status: 'error',
          message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.',
        });
        return;
      }
      res.status(401).json({ status: 'error', message: 'PIN Panitia salah.', valid: false });
      return;
    }

    await resetRateLimit(rateKey);

    const token = await signToken({
      role: 'panitia',
      name: 'Panitia Rihlah Paskibra Samarang',
    });

    setCookie(res, PANITIA_COOKIE, token, 86400);

    res.json({
      status: 'success',
      valid: true,
      message: 'Login panitia berhasil!',
    });
  } catch (err) {
    console.error('Error saat login panitia:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memproses login panitia.' });
  }
}
