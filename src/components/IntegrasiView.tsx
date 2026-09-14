import React, { useState } from 'react';
import { ConfigIntegrasi, Peserta, TransaksiKeuangan, RundownItem } from '../types';
import { SAMPLE_SUPABASE_SQL } from '../data/initialData';
import { 
  Database, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

interface IntegrasiViewProps {
  config: ConfigIntegrasi;
  onSaveConfig: (cfg: ConfigIntegrasi) => void;
  onSyncGoogleSheets?: () => Promise<void>;
  onPullGoogleSheets?: () => Promise<void>;
  isSyncing?: boolean;
  peserta: Peserta[];
  keuangan: TransaksiKeuangan[];
  rundown: RundownItem[];
  onImportJsonBackup: (data: any) => void;
}

export const IntegrasiView: React.FC<IntegrasiViewProps> = ({
  config,
  onSaveConfig,
  peserta,
  keuangan,
  rundown,
  onImportJsonBackup
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'supabase' | 'backup'>('supabase');
  const [formConfig, setFormConfig] = useState<ConfigIntegrasi>(config);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: ''
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formConfig);
    setSyncStatusMsg({
      type: 'success',
      text: 'Konfigurasi integrasi berhasil disimpan ke sistem!'
    });
    setTimeout(() => setSyncStatusMsg({ type: null, text: '' }), 4000);
  };

  const handleCopySql = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Export full backup JSON
  const handleExportBackup = () => {
    const backupData = {
      app: 'Giat Rihlah Paskibar Samarang',
      exportedAt: new Date().toISOString(),
      peserta,
      keuangan,
      rundown,
      config: formConfig
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Rihlah_Paskibar_Samarang_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.peserta || parsed.keuangan) {
          onImportJsonBackup(parsed);
          setSyncStatusMsg({
            type: 'success',
            text: 'Data cadangan berhasil dipulihkan (restore) ke aplikasi!'
          });
        } else {
          throw new Error('Format file JSON tidak sesuai.');
        }
      } catch (err: any) {
        setSyncStatusMsg({
          type: 'error',
          text: 'Gagal membaca file JSON cadangan: ' + err.message
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Integrasi Cloud Database & Cadangan
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Cloud Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen basis data PostgreSQL Supabase dan fasilitas pencadangan mandiri JSON
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          {config.lastSync ? (
            <span className="text-xs text-slate-500 font-medium">
              Terakhir sync: {config.lastSync}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">
              Status: Database PostgreSQL Siap
            </span>
          )}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'supabase'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Supabase (PostgreSQL)
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'backup'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          Cadangan & Pulihkan (Offline Backup)
        </button>
      </div>

      {/* Feedback Message Alert */}
      {syncStatusMsg.text && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {syncStatusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{syncStatusMsg.text}</span>
        </div>
      )}

      {/* TAB 1: SUPABASE INTEGRATION */}
      {activeSubTab === 'supabase' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Konfigurasi Backend Supabase
                  </h3>
                  <p className="text-xs text-slate-500">Database PostgreSQL & REST API Cloud</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzproject.supabase.co"
                    value={formConfig.supabaseUrl || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, supabaseUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <div className="relative">
                    <input
                      id="supabase-anon-key-input"
                      type={showAnonKey ? 'text' : 'password'}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      value={formConfig.supabaseAnonKey || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, supabaseAnonKey: e.target.value })}
                      className="w-full px-3 py-2 pr-10 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      id="supabase-toggle-anon-key-btn"
                      onClick={() => setShowAnonKey(!showAnonKey)}
                      aria-label={showAnonKey ? 'Sembunyikan API key' : 'Lihat API key'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                    >
                      {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ditemukan di Project Settings &gt; API &gt; Project API keys (anon public)
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Simpan Konfigurasi Supabase
                  </button>
                </div>
              </form>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <span className="font-bold text-slate-800 block">Status Arsitektur Hybrid:</span>
                <p>
                  Aplikasi ini mengadopsi prinsip <strong>Local-First & Cloud-Synced</strong>. Jika URL Supabase diisi, data akan tersimpan ke PostgreSQL Supabase. Jika offline atau belum diisi, seluruh data berjalan normal dengan basis data lokal dan backend PostgreSQL.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Skema SQL Supabase (PostgreSQL)</h3>
                    <p className="text-[11px] text-slate-400">Eksekusi di SQL Editor Supabase</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopySql(SAMPLE_SUPABASE_SQL)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Tersalin!' : 'Salin SQL'}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-[480px] overflow-y-auto leading-relaxed border border-slate-800">
                {SAMPLE_SUPABASE_SQL}
              </pre>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: BACKUP & RESTORE OFFLINE */}
      {activeSubTab === 'backup' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Cadangkan & Pulihkan Data Rihlah (Offline Backup)
              </h3>
              <p className="text-xs text-slate-500">
                Amankan seluruh data peserta ({peserta.length} orang), transaksi kas, dan rundown acara dalam format file JSON mandiri.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Export Button */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <Download className="w-4 h-4 text-emerald-600" />
                  Unduh Cadangan
                </div>
                <p className="text-xs text-slate-500">
                  Simpan seluruh data ke file JSON di komputer atau ponsel Anda.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Unduh File Backup JSON
                </button>
              </div>

              {/* Import Button */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Pulihkan (Restore)
                </div>
                <p className="text-xs text-slate-500">
                  Pindahkan data dari panitia lain dengan mengunggah file JSON.
                </p>
                <label className="w-full flex items-center justify-center py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer">
                  <span>Pilih File Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
