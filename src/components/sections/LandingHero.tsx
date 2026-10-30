import React from 'react';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { OWNER_WHATSAPP_NUMBER, APP_CONFIG } from '../../constants';
import { AlamalaEmblem } from '../common/AlamalaLogo';

interface LandingHeroProps {
  onOpenOrderModal: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenOrderModal }) => {
  return (
    <section id="beranda" className="pt-8 sm:pt-14 pb-14 border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Narrative & Clear Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C3282E]">
              <AlamalaEmblem size={22} color="#C3282E" />
              <span>Dapur Alamala · Puding, Cake &amp; Catering Malang</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C1917] leading-[1.18] tracking-tight [text-wrap:balance]">
              Sajian Hangat Penuh Kehangatan untuk Momen Bahagia Anda.
            </h1>

            <p className="text-base text-stone-600 leading-relaxed max-w-xl">
              Dapur Alamala melayani pesanan Nasi Box lezat, Tumpeng Hias Tradisional, aneka Snack Box &amp; Cake, serta Puding Buah segar. Dimasak setiap hari dari bahan pilihan di Sengkaling, Kabupaten Malang untuk syukuran keluarga, rapat kantor, dan perayaan istimewa Anda.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onOpenOrderModal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white font-semibold text-sm transition-colors shadow-sm active:scale-98 cursor-pointer"
              >
                <span>Pesan Sekarang (Min. 10 Pax)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=Halo%20Dapur%20Alamala%2C%20saya%20ingin%20konsultasi%20paket%20catering...`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm transition-colors active:scale-98"
              >
                <MessageCircle className="w-4 h-4 text-[#1E3A2F]" />
                <span>WhatsApp: {APP_CONFIG.phone}</span>
              </a>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-500">
              <span className="flex items-center gap-1.5 font-medium text-stone-700">
                <ShieldCheck className="w-4 h-4 text-[#1E3A2F]" />
                100% Halal &amp; Higienis
              </span>
              <span>·</span>
              <span>Dapur Sengkaling Malang</span>
              <span>·</span>
              <span>Diantar Hangat Tepat Waktu</span>
            </div>
          </div>

          {/* Right Column: Visual Showcase (Dominant Focal Anchor) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-stone-300 bg-stone-100 shadow-sm aspect-[4/3]">
              <img
                src="/src/assets/images/hero_catering_tumpeng_1792341599451.jpg"
                alt="Tumpeng Hias Tradisional Dapur Alamala Malang"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                width={800}
                height={600}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <AlamalaEmblem size={24} color="#F4F1DE" />
                  <span className="text-xs uppercase tracking-wider text-amber-200 font-semibold">
                    Dapur Alamala Malang
                  </span>
                </div>
                <p className="font-serif text-lg font-bold leading-tight">
                  Tumpeng Tampah Tradisional &amp; Nasi Box
                </p>
                <p className="text-xs text-stone-200 mt-0.5">
                  Puding, Cake &amp; Catering · Sengkaling Indah II
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* 3-Column Quantitative Proof Strip */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-stone-200">
          <div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tabular-nums block">
              1.500+
            </span>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              Acara Keluarga, Dinas &amp; Kantor Tersaji di Malang Raya
            </p>
          </div>
          <div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1E3A2F] tabular-nums block">
              10 Pax
            </span>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              Minimal Pemesanan Ramah Acara Kecil hingga Besar
            </p>
          </div>
          <div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C3282E] tabular-nums block">
              50% DP
            </span>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              Sistem Uang Muka Transparan via BCA untuk Kunci Jadwal
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
