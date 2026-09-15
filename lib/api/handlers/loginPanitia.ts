import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../auth/rateLimit.js';
import { signToken, setCookie, PANITIA_COOKIE } from '../auth.js';

const PESAN_GAGAL_LOGIN = 'Username atau Password Panitia tidak sesuai.';

export default async function handleLoginPanitia(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const { username, password } = req.body || {};
    const usernameInput = (username || '').toString().trim();
    const passwordInput = (password || '').toString();

    if (!usernameInput || !passwordInput) {
      res.status(400).json({ status: 'error', message: 'Username dan password panitia wajib diisi.' });
      return;
    }

    const rateKey = 'panitia_auth';
    const rateCheck = await checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({ status: 'error', message: rateCheck.message });
      return;
    }

    const panitiaUsername = process.env.PANITIA_USERNAME;
    const panitiaPasswordHash = process.env.PANITIA_PASSWORD_HASH;

    // ⚠️ Fail-fast: sama seperti PANITIA_PIN_HASH sebelumnya, tidak ada fallback default.
    if (!panitiaUsername || !panitiaPasswordHash) {
      res.status(500).json({ status: 'error', message: 'PANITIA_USERNAME / PANITIA_PASSWORD_HASH belum dikonfigurasi di environment.' });
      return;
    }

    // Bandingkan username (case-sensitive, sesuai apa adanya yang dikonfigurasi)
    const usernameMatch = usernameInput === panitiaUsername;
    const passwordMatch = await bcrypt.compare(passwordInput, panitiaPasswordHash);

    if (!usernameMatch || !passwordMatch) {
      const failRec = await recordFailedAttempt(rateKey);
      if (failRec.locked) {
        res.status(429).json({
          status: 'error',
          message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.',
        });
        return;
      }
      res.status(401).json({ status: 'error', message: PESAN_GAGAL_LOGIN, valid: false });
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
