import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookies } from '../../lib/api/auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Clear cookies menggunakan fungsi sentral agar seluruh token dihapus bersih
  clearAuthCookies(res);

  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
