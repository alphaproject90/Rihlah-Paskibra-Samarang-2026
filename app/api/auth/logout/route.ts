import { NextResponse } from 'next/server';
import { PESERTA_COOKIE_NAME, PANITIA_COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  const response = NextResponse.json({ status: 'success', message: 'Berhasil logout' });
  response.cookies.delete(PESERTA_COOKIE_NAME);
  response.cookies.delete(PANITIA_COOKIE_NAME);
  return response;
}
