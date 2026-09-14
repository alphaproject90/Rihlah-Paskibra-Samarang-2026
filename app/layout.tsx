import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Giat Rihlah Paskibra Samarang 2026',
  description: 'Sistem Manajemen Acara & Presensi QR Code Giat Rihlah Paskibar Kecamatan Samarang',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
