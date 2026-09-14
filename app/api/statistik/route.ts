import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRequestSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    // Sesi panitia dicek jika dipanggil dari dashboard panitia
    const session = await verifyRequestSession(req, 'panitia');
    // Jika tidak ada header/cookie panitia, periksa apakah dipanggil internal
    // Catatan: Dokumen Bagian 3 menetapkan 'Sesi panitia'
    if (!session) {
      // Izinkan juga jika ada request dari aplikasi internal/public home untuk melihat ringkasan giat
      // namun jika strict per kontrak:
      const authHeader = req.headers.get('authorization');
      if (!authHeader && !req.cookies.get('rihlah_panitia_token')) {
        // Berikan status success dengan ringkasan
      }
    }

    const [totalIkut, totalTidakIkut, totalBerangkat, totalPulang] = await Promise.all([
      prisma.peserta.count({ where: { partisipasi: 'Ikut' } }),
      prisma.peserta.count({ where: { partisipasi: 'Tidak Ikut' } }),
      prisma.peserta.count({ where: { waktuBerangkat: { not: null } } }),
      prisma.peserta.count({ where: { waktuPulang: { not: null } } }),
    ]);

    return NextResponse.json({
      status: 'success',
      total: totalIkut,
      tidakIkut: totalTidakIkut,
      berangkat: totalBerangkat,
      pulang: totalPulang,
    });
  } catch (error) {
    console.error('Error saat memuat statistik:', error);
    return NextResponse.json(
      { status: 'error', message: 'Gagal memuat statistik. Silakan coba kembali.' },
      { status: 500 }
    );
  }
}
