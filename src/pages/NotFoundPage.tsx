import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Search, HelpCircle } from 'lucide-react';
import { AlamalaEmblem } from '../components/common/AlamalaLogo';

interface NotFoundPageProps {
  onNavigateHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <AlamalaEmblem size={32} color="#C3282E" className="group-hover:scale-105 transition-transform" />
          <span className="font-serif text-xl font-bold text-[#1C1917]">
            Dapur Alamala
          </span>
        </div>

        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-[#1E3A2F]" />
          <span>Beranda</span>
        </button>
      </header>

      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full mx-auto my-auto text-center space-y-6 py-12"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
          <Search className="w-8 h-8 text-stone-400" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#9B381E]">
            Error 404
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
            Halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau alamat URL yang Anda masukkan salah.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
            <HelpCircle className="w-4 h-4 text-[#1E3A2F]" />
            <span>Mungkin yang Anda cari:</span>
          </div>
          <ul className="text-xs text-stone-600 space-y-1.5 pl-5 list-disc">
            <li>Katalog Nasi Box, Tumpeng &amp; Snack Box</li>
            <li>Alur Pemesanan &amp; Ketentuan DP 50%</li>
            <li>Pelacakan Status Pesanan Catering Anda</li>
          </ul>
        </div>

        <div>
          <button
            onClick={onNavigateHome}
            className="w-full py-3 px-5 rounded-xl bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Utama</span>
          </button>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-stone-400">
        &copy; {new Date().getFullYear()} Dapur Alamala Malang.
      </footer>
    </div>
  );
};
