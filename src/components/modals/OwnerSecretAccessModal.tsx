import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, X, ArrowRight, ShieldAlert, Clock } from 'lucide-react';
import { AlamalaEmblem } from '../common/AlamalaLogo';
import { loginAdmin, getLockoutStatus } from '../../lib/auth';

interface OwnerSecretAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const OwnerSecretAccessModal: React.FC<OwnerSecretAccessModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const lockStatus = getLockoutStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockStatus.isLocked) {
      setError(`Akses terkunci sementara. Silakan tunggu ${lockStatus.remainingMinutes} menit.`);
      return;
    }
    if (!email.trim()) {
      setError('Masukkan email pemilik.');
      return;
    }
    if (!password.trim()) {
      setError('Masukkan kata sandi pemilik.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await loginAdmin(email, password);
      if (res.success && res.session) {
        onLoginSuccess(res.session.email);
        onClose();
      } else {
        setError(res.error || 'Kata sandi tidak sesuai. Akses ditolak.');
      }
    } catch {
      setError('Terjadi kendala koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-[#FAF8F5] rounded-2xl shadow-2xl border border-stone-300 overflow-hidden text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white px-6 pt-6 pb-5 border-b border-stone-200 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1E3A2F]/10 border border-[#1E3A2F]/20 flex items-center justify-center shrink-0">
              <AlamalaEmblem size={26} color="#C3282E" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-lg font-bold text-stone-900 leading-tight">
                  Akses Khusus Pemilik
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Privat
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Dapur Alamala Management &amp; Order Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Area ini disembunyikan dari pelanggan umum. Masukkan kata sandi pemilik untuk mengakses pesanan masuk, verifikasi DP, dan pengaturan menu.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Pemilik / Pengelola
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A2F]"
                placeholder="owner@dapur-alamala.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kata Sandi Pemilik
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 text-xs rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A2F]"
                  placeholder="Masukkan kata sandi rahasia pemilik"
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
              className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Memverifikasi...' : 'Buka Dashboard Pemilik'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick guide for owner */}
          <div className="pt-3 border-t border-stone-200">
            <p className="text-[11px] font-semibold text-stone-600 mb-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
              <span>Cara Akses Privat untuk Owner:</span>
            </p>
            <ul className="text-[10px] text-stone-500 space-y-1 list-disc list-inside">
              <li>Tekan tombol keyboard <kbd className="px-1 py-0.5 bg-stone-200 text-stone-800 rounded font-mono">Ctrl + Shift + A</kbd> di mana saja.</li>
              <li>Atau klik 3x logo Dapur Alamala di bagian paling bawah halaman (footer).</li>
              <li>Atau ketik langsung alamat URL <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">/#/admin</code> pada peramban.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
