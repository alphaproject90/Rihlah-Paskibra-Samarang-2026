'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, QrCode, Shield, LogOut, Home, UserPlus, LogIn } from 'lucide-react';

interface HeaderProps {
  userType?: 'peserta' | 'panitia' | null;
  userName?: string;
}

export function Header({ userType, userName }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-wide block leading-tight">
                RIHLAH PASKIBRA
              </span>
              <span className="text-xs text-blue-400 font-medium tracking-wider">
                Kecamatan Samarang 2026
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <a
              href="/"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                pathname === '/' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Beranda</span>
            </a>

            {!userType && (
              <>
                <a
                  href="/daftar"
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname === '/daftar' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar</span>
                </a>

                <a
                  href="/login"
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname.startsWith('/login') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </a>
              </>
            )}

            {userType === 'peserta' && (
              <>
                <a
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Tiket Saya</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            )}

            {userType === 'panitia' && (
              <>
                <a
                  href="/panitia"
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname === '/panitia' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Admin</span>
                </a>
                <a
                  href="/panitia/scan"
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                    pathname === '/panitia/scan' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scanner</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
