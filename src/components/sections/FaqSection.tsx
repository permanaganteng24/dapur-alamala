import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PAYMENT_BANK_DETAILS, APP_CONFIG } from '../../constants';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Berapa batas minimal pemesanan di Dapur Alamala?',
      a: 'Minimal pemesanan untuk Nasi Box, Snack Box, dan Puding Buah adalah 10 porsi (pax). Untuk Tumpeng Tampah Tradisional tersedia mulai ukuran 10 hingga 25 porsi.'
    },
    {
      q: 'Apakah Dapur Alamala menerima pesanan mendadak H-1?',
      a: `Bisa. Kami menerima pesanan kilat H-1 untuk menu Nasi Box dan Snack Box selama kapasitas slot produksi dapur pada hari tersebut masih tersedia. Silakan hubungi langsung via WhatsApp ke ${APP_CONFIG.phone} untuk cek ketersediaan slot.`
    },
    {
      q: 'Bagaimana sistem pembayaran dan ketentuan uang muka (DP)?',
      a: `Untuk mengunci tanggal acara dan belanja bahan baku segar, pemesan melakukan pembayaran DP 50% ke rekening resmi ${PAYMENT_BANK_DETAILS.bankName}: ${PAYMENT_BANK_DETAILS.accountNumber} a.n. ${PAYMENT_BANK_DETAILS.accountHolder}. Pelunasan sisa 50% dapat ditransfer saat hidangan tiba atau H-1 pengiriman.`
    },
    {
      q: 'Wilayah mana saja yang dijangkau pengiriman Dapur Alamala?',
      a: 'Dapur kami berlokasi di Sengkaling (Dau, Kab. Malang). Kami melayani pengantaran ke seluruh wilayah Kota Malang, Kabupaten Malang, dan Kota Batu dengan kurir khusus agar makanan tetap hangat dan tertata rapi.'
    },
    {
      q: 'Apakah bisa request khusus untuk tingkat kepedasan atau alergi?',
      a: 'Bisa. Anda dapat menuliskan catatan khusus saat checkout (misal: sambal dipisah untuk anak-anak, lauk tanpa santan, atau request rasa manis). Tim dapur kami akan menyesuaikan racikan bumbunya.'
    }
  ];

  return (
    <section className="py-14 sm:py-20 bg-[#FAF8F5] border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="max-w-xl mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9B381E] mb-2">
            Pertanyaan Umum
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            Hal yang Kerap Ditanyakan
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Informasi seputar porsi, jadwal pemesanan, dan pengantaran catering di Malang.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
              >
                <span className="font-serif font-bold text-sm sm:text-base text-[#1C1917]">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                    openIndex === i ? 'rotate-180 text-[#1C1917]' : ''
                  }`}
                />
              </button>
              
              {openIndex === i && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
