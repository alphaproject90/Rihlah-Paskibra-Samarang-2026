import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession } from '../../lib/api/auth.js';
import {
  processPesertaGantiPassword,
  processPanitiaGantiPassword,
  requestPesertaResetOtp,
  verifyPesertaResetOtp,
  getPanitiaPendingResets,
  generatePanitiaWaLink,
  cancelPanitiaResetRequest,
} from '../../lib/services/passwordService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const action = req.query.action as string | undefined;

  // --------------------------------------------------------------------------
  // SUB-ALUR 1: Panitia - Ambil Daftar Antrean Reset (GET ?action=panitia-pending-resets)
  // --------------------------------------------------------------------------
  if (action === 'panitia-pending-resets') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const session = await getSession(req, 'panitia');
    const result = await getPanitiaPendingResets({ session, ip });
    return res.status(result.status).json(result.body);
  }

  // --------------------------------------------------------------------------
  // Seluruh sub-alur lainnya di bawah ini WAJIB menggunakan HTTP method POST
  // --------------------------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --------------------------------------------------------------------------
  // SUB-ALUR 2: Peserta - Request Kode OTP (POST ?action=request-otp)
  // --------------------------------------------------------------------------
  if (action === 'request-otp') {
    const result = await requestPesertaResetOtp({ body: req.body, ip });
    return res.status(result.status).json(result.body);
  }

  // --------------------------------------------------------------------------
  // SUB-ALUR 3: Peserta - Verifikasi OTP & Reset Password (POST ?action=verify-otp-reset)
  // --------------------------------------------------------------------------
  if (action === 'verify-otp-reset') {
    const result = await verifyPesertaResetOtp({ body: req.body, ip });
    return res.status(result.status).json(result.body);
  }

  // --------------------------------------------------------------------------
  // SUB-ALUR 4: Panitia - Generate Link wa.me (POST ?action=panitia-get-wa-link)
  // --------------------------------------------------------------------------
  if (action === 'panitia-get-wa-link') {
    const session = await getSession(req, 'panitia');
    const result = await generatePanitiaWaLink({ body: req.body, session, ip });
    return res.status(result.status).json(result.body);
  }

  // --------------------------------------------------------------------------
  // SUB-ALUR 5: Panitia - Batalkan Permohonan Reset (POST ?action=panitia-cancel-reset)
  // --------------------------------------------------------------------------
  if (action === 'panitia-cancel-reset') {
    const session = await getSession(req, 'panitia');
    const result = await cancelPanitiaResetRequest({ body: req.body, session, ip });
    return res.status(result.status).json(result.body);
  }

  // --------------------------------------------------------------------------
  // SUB-ALUR 6: Rotasi Password Panitia Aktif (POST ?target=panitia)
  // --------------------------------------------------------------------------
  const isPanitiaSelfChange =
    req.query.target === 'panitia' ||
    req.body?.target === 'panitia' ||
    req.body?.role === 'panitia';

  if (isPanitiaSelfChange) {
    const session = await getSession(req, 'panitia');
    const result = await processPanitiaGantiPassword({
      body: req.body,
      session,
      ip,
    });
    return res.status(result.status).json(result.body);
  }

  // --------------------------------------------------------------------------
  // SUB-ALUR 7: Ganti Password Aktif Peserta (POST default tanpa action)
  // --------------------------------------------------------------------------
  // Guard Keamanan Kritis: Jika request tidak menyertakan oldPassword (sebelumnya alur forgot-reset lama tanpa OTP),
  // tolak secara eksplisit dengan 400 dan arahkan ke alur OTP WhatsApp baru.
  if (!req.body?.oldPassword) {
    return res.status(400).json({
      error: "Gunakan fitur 'Lupa Password' untuk reset via kode OTP WhatsApp.",
    });
  }

  const sessionPanitia = await getSession(req, 'panitia');
  const sessionPeserta = await getSession(req, 'peserta');

  const result = await processPesertaGantiPassword({
    body: req.body,
    sessionPeserta,
    sessionPanitia,
    ip,
  });

  return res.status(result.status).json(result.body);
}
