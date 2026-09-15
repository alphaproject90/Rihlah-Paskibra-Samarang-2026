import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { getSession } from '../../lib/api/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  try {
    const session = await getSession(req, 'panitia');

    // ⚠️ SECURITY FIX #1 (Tahap 1, dipertahankan): tolak jika sesi tidak valid atau role bukan panitia
    if (!session || (session as any).role !== 'panitia') {
      res.status(401).json({ status: 'error', message: 'Akses ditolak. Sesi panitia tidak valid.' });
      return;
    }

    // Kolom passwordHash tidak pernah di-serialize
    const list = await prisma.peserta.findMany({
      select: {
        idPeserta: true,
        namaLengkap: true,
        jenisKelamin: true,
        asalSekolah: true,
        partisipasi: true,
        alasanTidakIkut: true,
        waPribadi: true,
        waDarurat: true,
        riwayatMedis: true,
        waktuBerangkat: true,
        waktuPulang: true,
        username: true,
        statusPassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map((p) => ({
      id: p.idPeserta,
      nama: p.namaLengkap,
      jk: p.jenisKelamin,
      unit: p.asalSekolah,
      partisipasi: p.partisipasi,
      alasan: p.alasanTidakIkut || '',
      waPeserta: p.waPribadi || '',
      waDarurat: p.waDarurat || '',
      medis: p.riwayatMedis || '',
      waktuBerangkat: p.waktuBerangkat ? p.waktuBerangkat.toLocaleString('id-ID') : '',
      waktuPulang: p.waktuPulang ? p.waktuPulang.toLocaleString('id-ID') : '',
      username: p.username || '',
      statusPassword: p.statusPassword || 'Selesai',
    }));

    res.json({ status: 'success', data: formatted });
  } catch (err) {
    console.error('Error saat getPeserta:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memuat data peserta.' });
  }
}
