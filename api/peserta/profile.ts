import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma';
import { getSession } from '../../lib/api/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const session = await getSession(req, 'peserta');
    if (!session || !(session as any).idPeserta) {
      res.status(401).json({ status: 'error', message: 'Sesi peserta tidak valid.' });
      return;
    }

    const p = await prisma.peserta.findUnique({
      where: { idPeserta: (session as any).idPeserta },
      select: {
        idPeserta: true,
        namaLengkap: true,
        jenisKelamin: true,
        asalSekolah: true,
        partisipasi: true,
        waktuBerangkat: true,
        waktuPulang: true,
        statusPassword: true,
      },
    });

    if (!p) {
      res.status(404).json({ status: 'error', message: 'Peserta tidak ditemukan.' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        id: p.idPeserta,
        nama: p.namaLengkap,
        jk: p.jenisKelamin,
        unit: p.asalSekolah,
        partisipasi: p.partisipasi,
        waktuBerangkat: p.waktuBerangkat ? p.waktuBerangkat.toISOString() : '',
        waktuPulang: p.waktuPulang ? p.waktuPulang.toISOString() : '',
        statusPassword: p.statusPassword,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Gagal memuat profil peserta.' });
  }
}
