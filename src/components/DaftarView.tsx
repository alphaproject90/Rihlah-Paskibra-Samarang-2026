import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { DAFTAR_SEKOLAH } from '../data/rihlahData';
import { FormPendaftaran } from '../types';

interface DaftarViewProps {
  onSubmit: (form: FormPendaftaran) => Promise<{ status: string; id?: string; message?: string }>;
  onSelesai: () => void;
  loading: boolean;
  pendaftaranDibuka?: boolean;
}

export const DaftarView: React.FC<DaftarViewProps> = ({ onSubmit, onSelesai, loading, pendaftaranDibuka = true }) => {
  const [formData, setFormData] = useState<FormPendaftaran>({
    nama: '',
    jk: 'Laki-laki',
    unit: DAFTAR_SEKOLAH[0],
    partisipasi: 'Ikut',
    alasan: '',
    waPeserta: '',
    waDarurat: '',
    medis: '',
    username: '',
    password: '',
    konfirmasiPassword: '',
    setujuKirimWa: true
  });

  const [suksesResult, setSuksesResult] = useState<{
    id: string;
    nama: string;
    partisipasi: 'Ikut' | 'Tidak Ikut';
    waPeserta: string;
    username: string;
    password: string;
  } | null>(null);

  const [qrUrl, setQrUrl] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);

  useEffect(() => {
    if (suksesResult && suksesResult.id && suksesResult.partisipasi === 'Ikut') {
      QRCode.toDataURL(suksesResult.id, {
        width: 220,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('Error QR:', err));
    }
  }, [suksesResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendaftaranDibuka) return;
    const res = await onSubmit(formData);
    if (res.status === 'success') {
      setSuksesResult({
        id: res.id || 'PASK-XXXX',
        nama: formData.nama,
        partisipasi: formData.partisipasi,
        waPeserta: formData.waPeserta,
        username: formData.username,
        password: formData.password
      });
    }
  };

  const handleKirimWa = () => {
    if (!suksesResult) return;
    const phone = suksesResult.waPeserta.replace(/^0/, '62');
    const pesan = encodeURIComponent(
      `Halo *${suksesResult.nama}*,\n\nBerikut akun login Anda untuk *Giat Rihlah Paskibra Samarang 2026*:\n` +
      `- ID Peserta: *${suksesResult.id}*\n` +
      `- Username: *${suksesResult.username}*\n` +
      `- Password: *${suksesResult.password}*\n\n` +
      `Simpan informasi ini dan tunjukkan tiket QR saat hari kegiatan.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${pesan}`, '_blank');
  };

  // State tampilan sukses
  if (suksesResult) {
    if (suksesResult.partisipasi === 'Ikut') {
      return (
        <div className="space-y-4 text-center my-auto py-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Pendaftaran Berhasil!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Data Anda telah tercatat dalam sistem Giat Rihlah.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3 max-w-sm mx-auto shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tiket Registrasi
            </span>
            <div className="font-mono text-xl font-black text-slate-800">
              {suksesResult.id}
            </div>
            <div className="text-sm font-bold text-slate-700">
              {suksesResult.nama}
            </div>

            <div className="flex justify-center my-2">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 inline-block">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code" className="w-40 h-40 mx-auto" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
                    Membuat QR...
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Simpan ID atau tangkap layar (screenshot) kode QR ini untuk proses presensi.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleKirimWa}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Kirim Username &amp; Password ke WhatsApp Saya</span>
            </button>

            <button
              type="button"
              onClick={onSelesai}
              className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white p-3.5 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4 text-center my-auto py-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Data Telah Disimpan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Terima kasih telah mengonfirmasi ketidakhadiran Anda pada Giat Rihlah 2026.
            </p>
          </div>
          <button
            type="button"
            onClick={onSelesai}
            className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white p-3.5 rounded-xl font-bold text-xs transition cursor-pointer mt-4"
          >
            Kembali ke Beranda
          </button>
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-slate-800">Formulir Pendaftaran</h3>
        <p className="text-xs text-slate-500">Lengkapi data di bawah ini secara benar</p>
      </div>

      {!pendaftaranDibuka && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-sm text-rose-900">Pendaftaran Telah Ditutup</span>
            <p className="mt-0.5 text-rose-700">
              Mohon maaf, penerimaan pendaftaran peserta baru telah ditutup oleh panitia pelaksana. Formulir ini tidak dapat dikirimkan.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Nama Lengkap */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            required
            placeholder="Masukkan nama lengkap Anda"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>

        {/* Jenis Kelamin */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Jenis Kelamin <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`border p-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer text-xs font-bold transition ${
                formData.jk === 'Laki-laki'
                  ? 'border-red-600 bg-red-50/50 text-red-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="jk"
                value="Laki-laki"
                checked={formData.jk === 'Laki-laki'}
                onChange={() => setFormData({ ...formData, jk: 'Laki-laki' })}
                className="hidden"
              />
              <span>Laki-laki</span>
            </label>
            <label
              className={`border p-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer text-xs font-bold transition ${
                formData.jk === 'Perempuan'
                  ? 'border-red-600 bg-red-50/50 text-red-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="jk"
                value="Perempuan"
                checked={formData.jk === 'Perempuan'}
                onChange={() => setFormData({ ...formData, jk: 'Perempuan' })}
                className="hidden"
              />
              <span>Perempuan</span>
            </label>
          </div>
        </div>

        {/* Asal Satuan / Sekolah */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Asal Satuan / Sekolah <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            {DAFTAR_SEKOLAH.map((sek) => (
              <option key={sek} value={sek}>
                {sek}
              </option>
            ))}
          </select>
        </div>

        {/* Partisipasi */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Apakah Anda mengikuti Rihlah? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`border p-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer text-xs font-bold transition ${
                formData.partisipasi === 'Ikut'
                  ? 'border-green-600 bg-green-50 text-green-700 font-black'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="partisipasi"
                value="Ikut"
                checked={formData.partisipasi === 'Ikut'}
                onChange={() => setFormData({ ...formData, partisipasi: 'Ikut' })}
                className="hidden"
              />
              <span>Ikut</span>
            </label>
            <label
              className={`border p-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer text-xs font-bold transition ${
                formData.partisipasi === 'Tidak Ikut'
                  ? 'border-red-600 bg-red-50 text-red-700 font-black'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="partisipasi"
                value="Tidak Ikut"
                checked={formData.partisipasi === 'Tidak Ikut'}
                onChange={() => setFormData({ ...formData, partisipasi: 'Tidak Ikut' })}
                className="hidden"
              />
              <span>Tidak Ikut</span>
            </label>
          </div>
        </div>

        {/* Jika Tidak Ikut: Alasan */}
        {formData.partisipasi === 'Tidak Ikut' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan Tidak Ikut <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.alasan}
              onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
              required
              rows={3}
              placeholder="Tuliskan alasan Anda tidak dapat mengikuti kegiatan ini..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        )}

        {/* Jika Ikut: Kontak, Medis, & Akun Login */}
        {formData.partisipasi === 'Ikut' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp Peserta <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.waPeserta}
                onChange={(e) => setFormData({ ...formData, waPeserta: e.target.value })}
                required
                pattern="0[0-9]{9,13}"
                placeholder="Contoh: 08123456789"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
              />
              <span className="text-[10px] text-slate-400">Diawali angka 0, minimal 10 digit.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp Darurat (Orang Tua / Wali) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.waDarurat}
                onChange={(e) => setFormData({ ...formData, waDarurat: e.target.value })}
                required
                pattern="0[0-9]{9,13}"
                placeholder="Contoh: 08123456789"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Riwayat Medis / Alergi <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <textarea
                value={formData.medis}
                onChange={(e) => setFormData({ ...formData, medis: e.target.value })}
                rows={2}
                placeholder="Contoh: Asma, Alergi Udara Dingin, atau kosongkan jika sehat..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            {/* Kotak Akun Login */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mt-2">
              <div className="border-b border-slate-200 pb-2">
                <span className="text-xs font-black text-slate-800 block">
                  Buat Akun Login Peserta
                </span>
                <span className="text-[11px] text-slate-500">
                  Akun ini akan digunakan untuk cek status, tiket QR, dan presensi.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="Contoh: abdulfatah"
                  className="w-full bg-white border border-slate-200 text-slate-800 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">4-20 karakter, tanpa spasi.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="daftar-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Kombinasi huruf besar, kecil, angka, simbol"
                    className="w-full bg-white border border-slate-200 text-slate-800 p-2.5 pr-10 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  />
                  <button
                    type="button"
                    id="daftar-toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">Min 8 karakter kombinasi kuat.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="daftar-confirm-password-input"
                    type={showKonfirmasiPassword ? 'text' : 'password'}
                    value={formData.konfirmasiPassword}
                    onChange={(e) => setFormData({ ...formData, konfirmasiPassword: e.target.value })}
                    required
                    placeholder="Ketik ulang password"
                    className="w-full bg-white border border-slate-200 text-slate-800 p-2.5 pr-10 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  />
                  <button
                    type="button"
                    id="daftar-toggle-confirm-password-btn"
                    onClick={() => setShowKonfirmasiPassword(!showKonfirmasiPassword)}
                    aria-label={showKonfirmasiPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                  >
                    {showKonfirmasiPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="waNotif"
                  checked={formData.setujuKirimWa}
                  onChange={(e) => setFormData({ ...formData, setujuKirimWa: e.target.checked })}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="waNotif" className="text-[11px] text-slate-600 leading-tight">
                  Kirim username &amp; password otomatis ke WhatsApp saya setelah daftar.
                </label>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading || !pendaftaranDibuka}
          className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white p-4 rounded-xl font-bold shadow-lg shadow-red-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer mt-4"
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          <span>
            {!pendaftaranDibuka ? 'Pendaftaran Ditutup' : loading ? 'Mengirim Data...' : 'Kirim Pendaftaran'}
          </span>
        </button>
      </form>
    </div>
  );
};
