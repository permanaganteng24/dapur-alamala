import React from 'react';
import { MapPin, Phone, Clock, Instagram, Heart, ArrowUpRight } from 'lucide-react';
import { OWNER_WHATSAPP_NUMBER, APP_CONFIG } from '../../constants';
import { AlamalaEmblem } from '../common/AlamalaLogo';

interface FooterProps {
  onNavigate: (route: string) => void;
  onOpenOwnerModal?: () => void;
  ownerSession?: string | null;
}

export const Footer: React.FC<FooterProps> = ({ 
  onNavigate, 
  onOpenOwnerModal, 
  ownerSession 
}) => {
  const [clickCount, setClickCount] = React.useState(0);
  const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSecretTrigger = () => {
    setClickCount((prev) => {
      const newCount = prev + 1;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (newCount >= 3) {
        if (onOpenOwnerModal) {
          onOpenOwnerModal();
        } else {
          onNavigate('/admin');
        }
        return 0;
      }
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1500);
      return newCount;
    });
  };

  return (
    <footer className="bg-[#F4EFEA] text-[#1C1917] border-t border-stone-200 pt-14 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-9 pb-12 border-b border-stone-300/70">
          
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <AlamalaEmblem size={32} color="#C3282E" />
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-[#1C1917] block leading-none">
                  Dapur Alamala
                </span>
                <span className="text-[11px] font-medium text-stone-500 italic">
                  Puding, Cake &amp; Catering.
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Catering rumahan terpercaya khas Malang dengan sajian hangat dari bumbu rempah asli. Melayani pesanan Nasi Box, Tumpeng Tampah Tradisional, aneka Snack Box &amp; Cake, serta Puding Buah segar.
            </p>
            <p className="text-xs text-stone-500">
              Dapur Higienis · Resep Istimewa · 100% Halal
            </p>
          </div>

          {/* Layanan Utama */}
          <div>
            <h4 className="font-serif font-bold text-sm text-[#1C1917] mb-3">
              Katalog Layanan
            </h4>
            <ul className="space-y-2 text-xs text-stone-600">
              <li>Nasi Box Rapat &amp; Acara Kantor</li>
              <li>Tumpeng Hias Tradisional &amp; Tumini</li>
              <li>Snack Box Kue Tradisional &amp; Cake</li>
              <li>Puding Buah Kaca &amp; Dessert Segar</li>
              <li>Paket Doa &amp; Syukuran Keluarga</li>
            </ul>
          </div>

          {/* Lokasi & Operasional */}
          <div>
            <h4 className="font-serif font-bold text-sm text-[#1C1917] mb-3">
              Dapur &amp; Pengiriman
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C3282E] shrink-0 mt-0.5" />
                <span>{APP_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E3A2F] shrink-0" />
                <span>Setiap Hari: 06.00 – 21.00 WIB</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-500 shrink-0" />
                <a 
                  href={`https://wa.me/${OWNER_WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#C3282E] transition-colors font-medium"
                >
                  +62 812-3079-5124
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-[#C3282E] shrink-0" />
                <a 
                  href={`https://instagram.com/${APP_CONFIG.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#C3282E] transition-colors"
                >
                  {APP_CONFIG.instagram}
                </a>
              </li>
            </ul>
          </div>

          {/* Akses & Navigasi Pelanggan */}
          <div>
            <h4 className="font-serif font-bold text-sm text-[#1C1917] mb-3">
              Informasi Penting
            </h4>
            <div className="space-y-2 text-xs text-stone-600">
              <a href="#cara-pesan" className="block hover:text-[#C3282E] transition-colors">
                Alur &amp; Ketentuan DP 50%
              </a>
              <a href="#menu" className="block hover:text-[#C3282E] transition-colors">
                Katalog Menu Lengkap
              </a>
              <a 
                href={`https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=Halo%20Dapur%20Alamala%2C%20saya%20ingin%20konsultasi%20menu%20khusus...`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-600 hover:text-[#C3282E] flex items-center gap-1 transition-colors"
              >
                <span>Konsultasi Khusus / Custom Menu</span>
                <ArrowUpRight className="w-3 h-3 text-stone-400" />
              </a>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-white/70 border border-stone-200">
              <p className="text-[11px] text-stone-600">
                Pengiriman menjangkau seluruh area Kota Malang, Kabupaten Malang (Sengkaling/Dau/Kepanjen), dan Kota Batu.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-1.5">
            <span 
              onClick={handleSecretTrigger}
              className="select-none cursor-default"
            >
              © {new Date().getFullYear()} Dapur Alamala Malang. Hak cipta dilindungi.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {ownerSession && (
              <button
                onClick={() => onNavigate('/admin')}
                className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Dashboard Owner
              </button>
            )}
            <p className="flex items-center gap-1 text-[11px]">
              Dimasak sepenuh rasa di Sengkaling, Malang
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
