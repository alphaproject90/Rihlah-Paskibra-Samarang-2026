/**
 * ARCHITECTURE NOTE / KNOWN LIMITATION:
 * Endpoint ini mengembalikan seluruh data peserta (termasuk waPribadi, waDarurat, riwayatMedis)
 * secara unpaginated khusus untuk sesi panitia yang valid. Cocok untuk skala kegiatan sekolah saat ini (<500 peserta).
 * Jika volume peserta bertambah signifikan di event mendatang, terapkan limit/offset pagination atau search filter.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { getSession } from '../../lib/api/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  // Verifikasi sesi panitia sebelum memberikan akses data
  const session = await getSession(req, 'panitia');
  if (!session || (session as { role?: string }).role !== 'panitia') {
    return res.status(401).json({ error: 'Unauthorized: Sesi panitia tidak valid' });
  }

  try {
    const peserta = await prisma.peserta.findMany({
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
      orderBy: { namaLengkap: 'asc' },
    });

    const formatted = peserta.map((p) => ({
      ...p,
      waktuBerangkat: p.waktuBerangkat ? p.waktuBerangkat.toLocaleString('id-ID') : null,
      waktuPulang: p.waktuPulang ? p.waktuPulang.toLocaleString('id-ID') : null,
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching peserta list:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

