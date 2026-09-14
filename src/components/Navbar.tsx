import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  CalendarClock, 
  Tent, 
  Wallet, 
  RefreshCw, 
  Rocket,
  ShieldCheck,
  MapPin
} from 'lucide-react';

export type TabType = 'dashboard' | 'peserta' | 'presensi' | 'rundown' | 'regu' | 'keuangan' | 'integrasi' | 'deploy';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pesertaCount: number;
  presensiHadirCount: number;
  isSyncedWithSheets: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pesertaCount,
  presensiHadirCount,
  isSyncedWithSheets
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'peserta' as TabType, label: 'Data Peserta', icon: Users, badge: pesertaCount },
    { id: 'presensi' as TabType, label: 'Presensi QR', icon: QrCode, highlight: `${presensiHadirCount}/${pesertaCount}` },
    { id: 'rundown' as TabType, label: 'Rundown', icon: CalendarClock },
    { id: 'regu' as TabType, label: 'Regu & Tenda', icon: Tent },
    { id: 'keuangan' as TabType, label: 'Kas & Iuran', icon: Wallet },
    { id: 'integrasi' as TabType, label: 'Sheets & Supabase', icon: RefreshCw },
    { id: 'deploy' as TabType, label: 'GitHub & Vercel', icon: Rocket },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Indonesian Flag Stripe Banner */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 via-50% to-white border-b border-red-200" />

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-500/20 ring-2 ring-red-100">
              <ShieldCheck className="w-6 h-6" />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  Giat Rihlah Paskibar
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  Kec. Samarang
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <MapPin className="w-3 h-3 text-red-500" />
                  Kamojang Camping Ground, Garut
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-medium">
                  {isSyncedWithSheets ? '● Google Sheets Aktif' : '● Mode Lokal & API'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stat Pill for Mobile & Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs flex items-center gap-2">
              <span className="text-slate-500 font-medium">Hadir:</span>
              <span className="font-bold text-slate-800">{presensiHadirCount}</span>
              <span className="text-slate-400">/</span>
              <span className="font-bold text-slate-800">{pesertaCount} Peserta</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Siap Rihlah
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-1 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-red-700 text-red-100' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.highlight && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tab.highlight}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
