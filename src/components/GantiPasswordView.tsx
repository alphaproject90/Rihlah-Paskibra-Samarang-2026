import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft, MessageSquare, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { STRONG_PASSWORD_REGEX } from '../../lib/validation';

interface GantiPasswordViewProps {
  onBatal: () => void;
  onSuccess?: () => void;
  onSubmit?: (identifier: string, noWa: string, newPass: string, confirmPass: string) => Promise<void>;
  loading?: boolean;
}

export const GantiPasswordView: React.FC<GantiPasswordViewProps> = ({ onBatal, onSuccess }) => {
  // Wizard Step State
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Form States
  const [identifier, setIdentifier] = useState('');
  const [noWa, setNoWa] = useState('');
  const [unit, setUnit] = useState('');

  // Step 2 Form States
  const [requestId, setRequestId] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // HANDLER LANGKAH 1: Pengajuan Kode OTP
  // --------------------------------------------------------------------------
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const idClean = identifier.trim();
    const waClean = noWa.trim();
    const unitClean = unit.trim();

    if (!idClean) {
      setErrorMessage('Harap masukkan Username atau ID Peserta Anda.');
      return;
    }
    if (!waClean) {
      setErrorMessage('Harap masukkan Nomor WhatsApp yang terdaftar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.requestOtpReset(idClean, waClean, unitClean || undefined);
      if (res.success && res.data) {
        setRequestId(res.data.requestId);
        setMaskedPhone(res.data.maskedPhone);
        setStep(2);
        setErrorMessage(null);
      } else {
        setErrorMessage(res.message || res.error || 'Gagal mengajukan permohonan OTP. Periksa kembali data Anda.');
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER LANGKAH 2: Verifikasi OTP & Simpan Password
  // --------------------------------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const otpClean = otp.trim();
    if (!/^\d{6}$/.test(otpClean)) {
      setErrorMessage('Kode OTP harus berupa 6 digit angka.');
      return;
    }

    if (!newPassword) {
      setErrorMessage('Password baru wajib diisi.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      setErrorMessage('Password minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.verifyOtpReset(requestId, otpClean, newPassword);
      if (res.success) {
        setSuccessMessage(res.message || 'Password berhasil diperbarui! Silakan login kembali.');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            onBatal();
          }
        }, 2000);
      } else {
        setErrorMessage(res.message || res.error || 'Verifikasi OTP gagal.');
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat memverifikasi OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-5 my-auto max-w-md mx-auto w-full border border-slate-700/60">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-700/70 rounded-2xl flex items-center justify-center mx-auto mb-2 text-amber-400 shadow-inner">
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black">Reset Password Akun</h3>
        <p className="text-xs text-slate-300 mt-1">
          Verifikasi identitas dan kode OTP melalui bantuan Panitia
        </p>

        {/* Wizard Step Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-4">
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 1
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            <span>1</span>
            <span>Identitas</span>
          </div>
          <span className="text-slate-500 text-xs">➔</span>
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 2
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            <span>2</span>
            <span>OTP &amp; Password</span>
          </div>
        </div>
      </div>

      {/* Alert Error */}
      {errorMessage && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs p-3 rounded-xl flex items-start space-x-2">
          <span className="font-bold text-base leading-none">⚠️</span>
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Alert Success */}
      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs p-3.5 rounded-xl flex items-center space-x-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="leading-relaxed font-semibold">{successMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAHAP 1: IDENTITAS PESERTA                                          */}
      {/* ==================================================================== */}
      {step === 1 && !successMessage && (
        <form onSubmit={handleRequestOtp} className="space-y-3.5">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 leading-relaxed">
            <span className="font-bold block mb-0.5">ℹ️ Langkah 1:</span>
            Masukkan Username/ID dan nomor WhatsApp saat pendaftaran. Panitia akan mengirimkan tautan kode OTP resmi ke nomor WhatsApp Anda.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Username atau ID Peserta <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Contoh: abdulf atau PASK-A1"
              className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nomor WhatsApp Terdaftar <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              required
              placeholder="Contoh: 081234567890"
              className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Nomor WhatsApp pribadi atau darurat yang terdaftar di akun
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asal Sekolah / Unit <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Contoh: SMA Negeri 1 Samarang"
              className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || !identifier.trim() || !noWa.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black p-3.5 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Mengecek Data...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  <span>Minta Kode OTP via WhatsApp</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBatal}
              disabled={isSubmitting}
              className="w-full bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white font-bold p-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Batal &amp; Kembali ke Login
            </button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAHAP 2: INPUT KODE OTP & PASSWORD BARU                             */}
      {/* ==================================================================== */}
      {step === 2 && !successMessage && (
        <form onSubmit={handleVerifyOtp} className="space-y-3.5">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 leading-relaxed">
            <span className="font-bold block mb-0.5">💬 Permohonan Terdaftar!</span>
            Panitia akan segera mengirimkan pesan WhatsApp berisi 6 digit kode OTP ke nomor <strong>{maskedPhone || noWa}</strong>. Hubungi panitia jika Anda belum menerima pesan.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Kode OTP (6 Digit Angka) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              placeholder="123456"
              className="w-full bg-slate-900 text-amber-300 p-3 rounded-xl border border-slate-700 text-center text-xl tracking-[0.4em] font-mono font-bold focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-600 placeholder:tracking-normal"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Kode berlaku selama 10 menit sejak dikirimkan panitia (Maksimal 3 kali percobaan)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password Baru <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="ganti-new-password-input"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Min. 8 karakter kombinasi"
                className="w-full bg-slate-900 text-white p-3 pr-11 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                id="ganti-toggle-new-password-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Sembunyikan password baru' : 'Lihat password baru'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Wajib minimal 8 karakter (huruf besar, huruf kecil, angka, simbol)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Konfirmasi Password Baru <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="ganti-confirm-password-input"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ulangi password baru"
                className="w-full bg-slate-900 text-white p-3 pr-11 rounded-xl border border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                id="ganti-toggle-confirm-password-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || otp.length !== 6 || !newPassword || !confirmPassword}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black p-3.5 rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memverifikasi OTP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verifikasi &amp; Simpan Password</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setErrorMessage(null);
              }}
              disabled={isSubmitting}
              className="w-full bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white font-bold p-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Langkah 1</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
