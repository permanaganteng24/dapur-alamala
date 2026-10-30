import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { loginAdmin, getLockoutStatus } from '../lib/auth';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ShieldAlert, Clock } from 'lucide-react';
import { AlamalaEmblem } from '../components/common/AlamalaLogo';

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
  onNavigateHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lockStatus = getLockoutStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockStatus.isLocked) {
      setError(`Akses terkunci sementara. Silakan tunggu ${lockStatus.remainingMinutes} menit.`);
      return;
    }
    if (!email.trim()) {
      setError('Silakan masukkan email pengelola.');
      return;
    }
    if (!password.trim()) {
      setError('Silakan masukkan kata sandi Anda.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loginAdmin(email, password);
      if (res.success && res.session) {
        onLoginSuccess(res.session.email);
      } else {
        setError(res.error || 'Akses ditolak. Email atau kata sandi tidak cocok.');
      }
    } catch {
      setError('Terjadi kendala autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
      >
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-stone-200 text-center flex flex-col items-center">
          <AlamalaEmblem size={52} color="#C3282E" className="mb-2" />
          <span className="font-serif text-2xl font-bold text-[#1C1917] block leading-tight">
            Dapur Alamala
          </span>
          <p className="text-xs text-stone-500 mt-1 flex items-center justify-center gap-1">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Portal Privat Pemilik &amp; Pengelola</span>
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {lockStatus.isLocked ? (
            <div className="p-4 rounded-xl bg-red-100/80 border border-red-300 text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-950">
                <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
                <span>Keamanan: Akses Ditutup Sementara</span>
              </div>
              <p className="leading-relaxed">
                Terlalu banyak percobaan kata sandi salah. Portal dikunci secara otomatis selama 15 menit untuk melindungi data pesanan.
              </p>
              <div className="flex items-center gap-1.5 font-semibold text-red-800 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Sisa waktu tunggu: &plusmn;{lockStatus.remainingMinutes} menit</span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 leading-relaxed">
              Halaman ini khusus pengelola Dapur Alamala untuk memantau pesanan catering dan konfirmasi pembayaran DP.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>Email Pemilik</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A2F]"
                placeholder="owner@dapur-alamala.com"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stone-400" />
                <span>Kata Sandi</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A2F]"
                  placeholder="Masukkan kata sandi"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk Dashboard Owner'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-stone-100 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs text-stone-600 hover:text-stone-900 underline cursor-pointer"
            >
              ← Kembali ke Halaman Utama Pelanggan
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

