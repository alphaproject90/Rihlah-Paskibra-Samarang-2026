import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const [totalIkut, totalTidakIkut, totalBerangkat, totalPulang] = await Promise.all([
      prisma.peserta.count({ where: { partisipasi: 'Ikut' } }),
      prisma.peserta.count({ where: { partisipasi: 'Tidak Ikut' } }),
      prisma.peserta.count({ where: { waktuBerangkat: { not: null } } }),
      prisma.peserta.count({ where: { waktuPulang: { not: null } } }),
    ]);

    res.json({
      status: 'success',
      total: totalIkut,
      tidakIkut: totalTidakIkut,
      berangkat: totalBerangkat,
      pulang: totalPulang,
    });
  } catch (err) {
    console.error('Error saat getStatistik:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memuat statistik.' });
  }
}
