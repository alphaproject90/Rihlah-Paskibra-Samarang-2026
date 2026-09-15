import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookies } from '../../lib/api/auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  clearAuthCookies(res);
  res.json({ status: 'success', message: 'Logout berhasil' });
}
