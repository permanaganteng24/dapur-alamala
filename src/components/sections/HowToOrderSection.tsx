import React, { useState } from 'react';
import { PAYMENT_BANK_DETAILS } from '../../constants';
import { Copy, Check, ShoppingBag, ArrowRight } from 'lucide-react';

interface HowToOrderSectionProps {
  onOpenOrderModal: () => void;
  onOpenPaymentModal?: () => void;
}

export const HowToOrderSection: React.FC<HowToOrderSectionProps> = ({ 
  onOpenOrderModal,
  onOpenPaymentModal 
}) => {
  const [copiedRekening, setCopiedRekening] = useState(false);

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(PAYMENT_BANK_DETAILS.accountNumber);
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const steps = [
    {
      number: '01',
      title: 'Pilih Menu & Tentukan Porsi',
      desc: 'Tentukan paket yang sesuai: Nasi Box, Tumpeng Tampah, Snack Box, atau Puding Buah (minimal pemesanan 10 pax).'
    },
    {
      number: '02',
      title: 'Isi Tanggal Acara & Alamat',
      desc: 'Tentukan tanggal pengantaran dan alamat di Malang Raya. Estimasi total biaya langsung terhitung otomatis transparan.'
    },
    {
      number: '03',
      title: 'Transfer Uang Muka (DP 50%)',
      desc: 'Transfer DP 50% ke rekening resmi BCA Dapur Alamala untuk mengunci kalender produksi dan belanja bahan segar.'
    },
    {
      number: '04',
      title: 'Rincian Otomatis ke WhatsApp',
      desc: 'Format pesanan lengkap dan bukti pembayaran langsung tersusun rapi untuk dikirimkan ke WhatsApp dapur kami.'
    }
  ];

  return (
    <section id="cara-pesan" className="py-14 sm:py-20 bg-[#FAF8F5] border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="max-w-xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9B381E] mb-2">
            Alur Pemesanan Praktis
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight">
            Pesan Hidangan dalam 4 Langkah Terarah
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Tanpa formulir rumit. Rincian pesanan dan kwitansi tagihan langsung terformat ke WhatsApp Dapur Alamala.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {steps.map((st) => (
            <div
              key={st.number}
              className="p-6 rounded-xl bg-white border border-stone-200 flex flex-col justify-between"
            >
              <div>
                <span className="font-serif text-2xl font-bold text-[#1E3A2F] tabular-nums block mb-4">
                  {st.number}
                </span>
                <h3 className="font-serif font-bold text-base text-[#1C1917] mb-2">
                  {st.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Official Bank Account Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Rekening Resmi Pembayaran DP 50%
            </div>
            <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1C1917]">
              {PAYMENT_BANK_DETAILS.bankName}
            </h4>
            <p className="text-xs text-stone-600">
              Uang muka minimal 50% untuk mengunci tanggal acara dan bahan baku. Pelunasan saat hidangan tiba atau H-1.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-left">
              <span className="text-[10px] text-stone-500 uppercase block font-medium">Nomor Rekening:</span>
              <span className="font-mono text-base font-bold text-[#1C1917] tracking-wider tabular-nums">
                {PAYMENT_BANK_DETAILS.accountNumber}
              </span>
              <span className="text-xs text-stone-600 block mt-0.5">
                a.n. {PAYMENT_BANK_DETAILS.accountHolder}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyRekening}
              className="px-4 py-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedRekening ? <Check className="w-3.5 h-3.5 text-[#1E3A2F]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRekening ? 'Tersalin' : 'Salin Rekening'}</span>
            </button>
          </div>
        </div>

        {/* Action Callout */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            Sudah memiliki rencana tanggal acara? Hubungi kami sekarang untuk memastikan ketersediaan slot dapur.
          </p>
          <button
            onClick={onOpenOrderModal}
            className="px-5 py-2.5 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Mulai Pemesanan</span>
          </button>
        </div>

      </div>
    </section>
  );
};
