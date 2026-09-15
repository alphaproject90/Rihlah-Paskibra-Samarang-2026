/**
 * ARCHITECTURE NOTE:
 * Endpoint publik (read-only, tanpa session auth) untuk memantau status kesehatan server,
 * koneksi basis data Prisma, dan jumlah total peserta terdaftar.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const count = await prisma.peserta.count();
    res.json({
      status: 'ok',
      event: 'Giat Rihlah Paskibra Samarang 2026',
      engine: 'PostgreSQL + Prisma ORM',
      totalPeserta: count,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
}
