import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_RAW = process.env.JWT_SECRET || 'rihlah-paskibra-samarang-jwt-secret-key-32-chars-long!';
const JWT_KEY = new TextEncoder().encode(JWT_SECRET_RAW);

const PESERTA_COOKIE = 'rihlah_peserta_token';
const PANITIA_COOKIE = 'rihlah_panitia_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Proteksi Halaman Dashboard Peserta (/dashboard)
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get(PESERTA_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL('/login/peserta', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_KEY);
      if (payload.role !== 'peserta') {
        return NextResponse.redirect(new URL('/login/peserta', request.url));
      }
    } catch {
      const response = NextResponse.redirect(new URL('/login/peserta', request.url));
      response.cookies.delete(PESERTA_COOKIE);
      return response;
    }
  }

  // 2. Proteksi Halaman Panitia (/panitia, /panitia/scan, dll)
  if (pathname.startsWith('/panitia')) {
    const token = request.cookies.get(PANITIA_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL('/login/panitia', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_KEY);
      if (payload.role !== 'panitia') {
        return NextResponse.redirect(new URL('/login/panitia', request.url));
      }
    } catch {
      const response = NextResponse.redirect(new URL('/login/panitia', request.url));
      response.cookies.delete(PANITIA_COOKIE);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/panitia/:path*'],
};
