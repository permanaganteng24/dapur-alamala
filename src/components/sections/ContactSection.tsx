import React from 'react';
import { MapPin, Phone, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import { OWNER_WHATSAPP_NUMBER, APP_CONFIG } from '../../constants';
import { AlamalaOfficialBadge } from '../common/AlamalaLogo';

export const ContactSection: React.FC = () => {
  return (
    <section id="kontak" className="py-14 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C3282E] mb-2">
            Identitas &amp; Kontak Dapur
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight">
            Kunjungi Dapur Alamala Malang
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Puding, Cake &amp; Catering siap melayani pesanan Anda di Malang Raya dan Kota Batu.
          </p>
        </div>

        {/* 3-Column Layout: Official Brand Card, Details, and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Column 1: Exact Replica of Official Brand Card */}
          <div className="lg:col-span-4 flex justify-center">
            <AlamalaOfficialBadge className="w-full" />
          </div>

          {/* Column 2: Details & WhatsApp Action */}
          <div className="lg:col-span-4 space-y-4 text-xs text-stone-600">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1">
              <span className="font-serif font-bold text-sm text-[#1C1917] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C3282E]" />
                Alamat Dapur Operasional
              </span>
              <p className="text-stone-700 font-medium leading-relaxed">
                {APP_CONFIG.address}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1">
              <span className="font-serif font-bold text-sm text-[#1C1917] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E3A2F]" />
                Jam Pelayanan &amp; Pengiriman
              </span>
              <p className="text-stone-600">
                Senin – Minggu: 06.00 – 21.00 WIB (Pengiriman subuh untuk sarapan &amp; rapat pagi tersedia)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1">
              <span className="font-serif font-bold text-sm text-[#1C1917] flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-500" />
                Saluran WhatsApp Resmi
              </span>
              <p className="text-stone-700 font-semibold font-mono">
                +62 812-3079-5124 (081230795124)
              </p>
            </div>

            <a
              href={`https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=Halo%20Dapur%20Alamala%2C%20saya%20ingin%20konsultasi%20menu%20dan%20jadwal%20acara...`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs sm:text-sm font-semibold transition-colors active:scale-95 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat WhatsApp Dapur Alamala</span>
            </a>
          </div>

          {/* Column 3: Map Preview Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl overflow-hidden border border-stone-300 shadow-sm bg-stone-100">
              <iframe
                title="Peta Lokasi Dapur Alamala Sengkaling Malang"
                src="https://maps.google.com/maps?q=Perumahan+Sengkaling+Indah+II+Malang&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-72 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="p-3 bg-white flex items-center justify-between border-t border-stone-200 text-xs">
                <span className="font-medium text-stone-700">
                  Kab. Malang &amp; Batu
                </span>
                <a
                  href="https://maps.google.com/?q=Perumahan+Sengkaling+Indah+II+Jl+Kemuning+III+No+8+Malang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#C3282E] flex items-center gap-1 hover:underline"
                >
                  Buka Peta <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
