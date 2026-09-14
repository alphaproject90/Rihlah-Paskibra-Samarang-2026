import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GantiPasswordPesertaSchema } from '@/lib/validation';
import { hashPassword, comparePassword } from '@/lib/auth/password';
import { verifyRequestSession, PesertaSessionPayload } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const validation = GantiPasswordPesertaSchema.safeParse(body);
    if (!validation.success) {
      const msg = validation.error.errors[0]?.message || 'Data ganti password tidak valid.';
      return NextResponse.json({ status: 'error', message: msg }, { status: 400 });
    }

    const { oldPassword, newPassword, identifier, noWa } = validation.data;

    // Skenario A: Peserta sedang login dan mengganti password
    const session = await verifyRequestSession(req, 'peserta') as PesertaSessionPayload | null;

    const result = await prisma.$transaction(async (tx) => {
      let targetPeserta = null;

      if (session) {
        targetPeserta = await tx.peserta.findUnique({
          where: { idPeserta: session.idPeserta },
        });
      } else if (identifier && noWa) {
        // Skenario B: Lupa Password via verifikasi No WhatsApp
        const idClean = identifier.trim().toLowerCase();
        const waClean = noWa.replace(/[^0-9]/g, '');

        targetPeserta = await tx.peserta.findFirst({
          where: {
            OR: [
              { username: idClean },
              { idPeserta: { equals: idClean, mode: 'insensitive' } },
            ],
          },
        });

        if (!targetPeserta) {
          throw new Error('NOT_FOUND');
        }

        const waDbClean = (targetPeserta.waPribadi || '').replace(/[^0-9]/g, '');
        if (!waDbClean || waDbClean !== waClean) {
          throw new Error('WA_MISMATCH');
        }
      } else if (identifier && oldPassword) {
        // Skenario C: Ganti password awal dengan password lama
        const idClean = identifier.trim().toLowerCase();
        targetPeserta = await tx.peserta.findFirst({
          where: {
            OR: [
              { username: idClean },
              { idPeserta: { equals: idClean, mode: 'insensitive' } },
            ],
          },
        });

        if (!targetPeserta || !targetPeserta.passwordHash) {
          throw new Error('NOT_FOUND');
        }

        const match = await comparePassword(oldPassword, targetPeserta.passwordHash);
        if (!match) {
          throw new Error('WRONG_PASSWORD');
        }
      } else {
        throw new Error('UNAUTHORIZED');
      }

      if (!targetPeserta) {
        throw new Error('NOT_FOUND');
      }

      // Jika ada oldPassword dan session, verifikasi
      if (session && oldPassword && targetPeserta.passwordHash) {
        const match = await comparePassword(oldPassword, targetPeserta.passwordHash);
        if (!match) {
          throw new Error('WRONG_PASSWORD');
        }
      }

      // Hash password baru dengan bcrypt
      const newHash = await hashPassword(newPassword);

      // Simpan password baru
      await tx.peserta.update({
        where: { id: targetPeserta.id },
        data: {
          passwordHash: newHash,
          statusPassword: 'Selesai',
        },
      });

      return targetPeserta;
    });

    return NextResponse.json({
      status: 'success',
      message: 'Password berhasil diperbarui! Silakan login kembali dengan password baru Anda.',
    });
  } catch (error: any) {
    if (error?.message === 'WRONG_PASSWORD') {
      return NextResponse.json({ status: 'error', message: 'Password saat ini tidak sesuai.' }, { status: 400 });
    }
    if (error?.message === 'WA_MISMATCH') {
      return NextResponse.json(
        { status: 'error', message: 'Nomor WhatsApp tidak cocok dengan data pendaftaran peserta.' },
        { status: 400 }
      );
    }
    if (error?.message === 'NOT_FOUND') {
      return NextResponse.json(
        { status: 'error', message: 'Akun dengan Username atau ID Peserta tersebut tidak ditemukan.' },
        { status: 404 }
      );
    }
    if (error?.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { status: 'error', message: 'Akses tidak diizinkan. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    console.error('Error di ganti password:', error);
    return NextResponse.json(
      { status: 'error', message: 'Terjadi kesalahan sistem saat memperbarui password.' },
      { status: 500 }
    );
  }
}
