import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const [totalIkut, totalTidakIkut, totalBerangkat, totalPulang] = await Promise.all([
      prisma.peserta.count({ where: { partisipasi: 'Ikut' } }),
      prisma.peserta.count({ where: { partisipasi: 'Tidak Ikut' } }),
      prisma.peserta.count({ where: { waktuBerangkat: { not: null } } }),
      prisma.peserta.count({ where: { waktuPulang: { not: null } } }),
    ]);

    // Response shape konsisten — data dibungkus dalam key 'data'
    // sesuai yang diharapkan apiService.ts: json.data as StatsRihlah
    res.json({
      success: true,
      data: {
        total: totalIkut,
        tidakIkut: totalTidakIkut,
        berangkat: totalBerangkat,
        pulang: totalPulang,
        ikut: totalIkut,
        sudahBerangkat: totalBerangkat,
        sudahPulang: totalPulang,
      },
    });
  } catch (err) {
    console.error('Error saat getStatistik:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat statistik.' });
  }
}

