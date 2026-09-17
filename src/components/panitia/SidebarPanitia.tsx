import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  FileText, 
  Activity, 
  Settings, 
  LogOut, 
  X,
  ShieldCheck,
  UserCog,
  ClipboardCheck
} from 'lucide-react';
import { PanitiaTabType, PanitiaMenuItem } from './types';
import { StatsRihlah } from '../../types';

interface SidebarPanitiaProps {
  activeTab: PanitiaTabType;
  onTabChange: (tab: PanitiaTabType) => void;
  onLogout: () => void;
  stats: StatsRihlah;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isSuperAdmin?: boolean;    // Kontrol visibilitas menu admin
  username?: string;         // Ditampilkan di user info bawah sidebar
  panitiaRole?: string;      // Badge role di user info
}

export const SidebarPanitia: React.FC<SidebarPanitiaProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  stats,
  isOpenMobile,
  onCloseMobile,
  isSuperAdmin = true,
  username,
  panitiaRole,
}) => {
  const statsAktif = (stats as any)?.data ?? stats ?? { total: 0, berangkat: 0 };
  const totalPeserta = statsAktif.total ?? statsAktif.ikut ?? 0;
  const totalBerangkat = statsAktif.berangkat ?? statsAktif.sudahBerangkat ?? 0;

  const menuItems: PanitiaMenuItem[] = [
    {
      id: 'ringkasan',
      label: 'Ringkasan',
      icon: LayoutDashboard,
      description: 'Statistik & status utama',
    },
    {
      id: 'peserta',
      label: 'Data & Rekap',
      icon: Users,
      badge: totalPeserta > 0 ? totalPeserta : undefined,
      badgeColor: 'bg-red-50 text-red-700 border border-red-200',
      description: 'Daftar peserta & export CSV',
    },
    {
      id: 'scanner',
      label: 'Presensi QR',
      icon: QrCode,
      badge: totalPeserta > 0 ? `${totalBerangkat}/${totalPeserta}` : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      description: 'Pemindai kamera & QR code',
    },
    {
      id: 'kegiatan',
      label: 'Absen Kegiatan',
      icon: ClipboardCheck,
      description: 'Presensi sesi giat lapangan',
    },
    {
      id: 'dokumen',
      label: 'Dokumen PDF',
      icon: FileText,
      description: 'Berkas global & personal',
    },
    {
      id: 'log',
      label: 'Log Sistem',
      icon: Activity,
      description: 'Audit trail & aktivitas',
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: Settings,
      description: 'Kontrol sistem & password',
    },
    // Menu 'Kelola Akun' hanya ditampilkan untuk Super Admin
    ...(isSuperAdmin ? [{
      id: 'admin' as PanitiaTabType,
      label: 'Kelola Akun',
      icon: UserCog,
      description: 'Manajemen akun panitia',
    }] : []),
  ];

  const handleSelectTab = (tab: PanitiaTabType) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md text-slate-800 select-none">
      {/* Top Indonesian Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600 shrink-0" />

      {/* Brand Header */}
      <div className="p-5 border-b border-rose-100/80 bg-rose-50/40 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/30 ring-2 ring-red-500/20">
            <ShieldCheck className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black tracking-tight text-slate-900 leading-none">
                Giat Rihlah 2026
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                Panitia
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Paskibra Kec. Samarang
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-rose-100/60 transition cursor-pointer"
          aria-label="Tutup menu sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Menu Utama
        </div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              id={`panitia-nav-${item.id}`}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-bold shadow-lg shadow-red-500/25 ring-1 ring-red-400/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-rose-50/70 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <IconComponent
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <div className="truncate">
                  <span className="text-xs sm:text-sm block leading-tight">{item.label}</span>
                  <span className={`text-[10px] block leading-tight mt-0.5 truncate ${
                    isActive ? 'text-rose-100 opacity-95' : 'text-slate-400'
                  }`}>
                    {item.description}
                  </span>
                </div>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : item.badgeColor || 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile & Logout Bottom Section */}
      <div className="p-3 border-t border-rose-100/80 shrink-0 bg-rose-50/40">
        <div className="px-3 py-2 flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-xs font-bold text-red-700">
              {(username?.[0] ?? 'P').toUpperCase()}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-800 block truncate leading-none">
                {username ?? 'Panitia'}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                panitiaRole === 'SUPER_ADMIN'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {panitiaRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Mobil'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="panitia-btn-logout"
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 text-red-700 hover:text-white border border-red-200 hover:border-transparent transition-all duration-150 text-xs font-bold shadow-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Dasbor</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:w-64 shrink-0 border-r border-rose-100 flex-col min-h-[640px] z-20 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
