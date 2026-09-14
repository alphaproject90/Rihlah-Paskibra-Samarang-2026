import React, { useState } from 'react';
import { Rocket, Github, Globe, Check, Copy, Terminal, Shield, Cpu, Zap, Cloud } from 'lucide-react';

export const DeployGuideView: React.FC = () => {
  const [copiedGit, setCopiedGit] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const gitCommands = `# 1. Inisialisasi Git dan Commit Kode
git init
git add .
git commit -m "feat: Sistem Manajemen Giat Rihlah Paskibar Kecamatan Samarang"

# 2. Hubungkan ke GitHub Repository Anda
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/rihlah-paskibar-samarang.git
git push -u origin main`;

  const envSample = `# Environment Variables untuk Vercel / Production:
VITE_SUPABASE_URL=https://proyek-anda.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
DATABASE_URL=postgresql://user:password@host:5432/dbname`;

  const copyText = (text: string, isEnv: boolean) => {
    navigator.clipboard.writeText(text);
    if (isEnv) {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 3000);
    } else {
      setCopiedGit(true);
      setTimeout(() => setCopiedGit(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Panduan Deployment: GitHub & Vercel
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
              Vercel + Supabase Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Petunjuk resmi publikasi sistem ke GitHub Repository dan Hosting Vercel dengan performa super cepat & SSL otomatis
          </p>
        </div>
      </div>

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900">Performa Tinggi & CDN</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vercel Edge Network menyajikan aset statis & React SPA dalam hitungan milidetik ke smartphone panitia di lapangan Samarang.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900">Keamanan & Skalabilitas</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Backend Supabase dan Google Sheets mampu menangani ribuan pengunjung serentak saat apel dan pendaftaran rihlah tanpa down.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900">CI/CD Otomatis</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap kali Anda push perubahan kode ke branch main GitHub, Vercel otomatis melakukan build dan deploy versi terbaru.
            </p>
          </div>
        </div>
      </div>

      {/* Step by step deployment cards */}
      <div className="space-y-4">
        
        {/* Step 1: GitHub */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Langkah 1: Hubungkan ke GitHub (Visual Studio Code & Git)
                </h3>
                <p className="text-xs text-slate-500">Gunakan terminal VS Code untuk upload repositori</p>
              </div>
            </div>
            <button
              onClick={() => copyText(gitCommands, false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              {copiedGit ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedGit ? 'Perintah Tersalin!' : 'Salin Perintah Git'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
            <pre>{gitCommands}</pre>
          </div>
        </div>

        {/* Step 2: Vercel Setup */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-black text-white">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Langkah 2: Hubungkan Repositori ke Vercel (1 Menit)
              </h3>
              <p className="text-xs text-slate-500">Deploy otomatis dari dashboard vercel.com</p>
            </div>
          </div>

          <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2.5 leading-relaxed">
            <li>Buka <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-red-600 font-bold underline">vercel.com</a> dan masuk menggunakan akun GitHub Anda.</li>
            <li>Klik tombol <strong>"Add New..." &gt; "Project"</strong>.</li>
            <li>Pilih repositori <strong>rihlah-paskibar-samarang</strong> yang baru saja Anda push ke GitHub.</li>
            <li>Pada pengaturan proyek Vercel:
              <ul className="list-disc list-inside ml-4 mt-1 text-slate-600 space-y-1">
                <li>Framework Preset: <strong>Vite</strong></li>
                <li>Root Directory: <strong>./</strong></li>
                <li>Build Command: <strong>npm run build</strong></li>
                <li>Output Directory: <strong>dist</strong></li>
              </ul>
            </li>
            <li>File <code>vercel.json</code> sudah kami sediakan di dalam proyek ini sehingga SPA routing otomatis berjalan sempurna tanpa error 404 saat refresh halaman!</li>
            <li>Klik tombol <strong>"Deploy"</strong>. Dalam 30 detik aplikasi Anda sudah aktif di internet dengan URL gratis: <code>https://rihlah-paskibar-samarang.vercel.app</code>!</li>
          </ol>
        </div>

        {/* Step 3: Environment Variables */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Langkah 3: Atur Environment Variables di Vercel (Opsional)
                </h3>
                <p className="text-xs text-slate-500">Project Settings &gt; Environment Variables</p>
              </div>
            </div>
            <button
              onClick={() => copyText(envSample, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedEnv ? 'Tersalin!' : 'Salin Contoh Env'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
            <pre>{envSample}</pre>
          </div>
          <p className="text-xs text-slate-500">
            Variabel ini juga dapat langsung dikonfigurasi melalui tab <strong>Sheets & Supabase</strong> di dalam aplikasi dan tersimpan aman di peramban panitia.
          </p>
        </div>

      </div>

    </div>
  );
};
