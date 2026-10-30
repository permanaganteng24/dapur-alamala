import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, MessageCircle, CheckCircle2 } from 'lucide-react';
import { CateringRequest } from '../../types';
import { formatRupiah, cleanPhoneNumber } from '../../lib/formatters';
import { buildPaidInvoiceWhatsAppUrl } from '../../lib/whatsapp';
import { AlamalaEmblem } from '../common/AlamalaLogo';

interface OfficialInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: CateringRequest | null;
}

export const OfficialInvoiceModal: React.FC<OfficialInvoiceModalProps> = ({
  isOpen,
  onClose,
  request
}) => {
  // ESC key listener to ensure modal can always be closed with Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  // Financial calculations
  let calculatedTotal = request.total_price || 0;
  if (!calculatedTotal && request.menus && request.menus.length > 0) {
    calculatedTotal = request.menus.reduce((sum, item) => {
      const unit = item.custom_price || item.menu?.price || 0;
      return sum + (unit * (request.portions || 1));
    }, 0);
  }
  if (!calculatedTotal) {
    calculatedTotal = (request.portions || 10) * 28000;
  }
  const calculatedDp = request.dp_amount || Math.round(calculatedTotal * 0.5);
  const isFullyPaid = request.payment_status === 'fully_paid' || request.status === 'Lunas' || request.status === 'Selesai';
  const isDpPaid = request.payment_status === 'dp_paid' || request.status === 'DP Dibayar';
  const calculatedRemaining = request.remaining_amount !== undefined 
    ? request.remaining_amount 
    : (isFullyPaid ? 0 : calculatedTotal - calculatedDp);

  const invoiceNumber = `INV/${new Date(request.created_at).getFullYear()}/AMALA/${request.id.slice(0, 8).toUpperCase()}`;
  const issueDate = new Date(request.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSendToClientWa = () => {
    if (isFullyPaid) {
      window.open(buildPaidInvoiceWhatsAppUrl(request), '_blank');
      return;
    }

    const text = `Halo Bapak/Ibu *${request.name}*, berikut kami lampirkan Surat Penawaran & Invoice Resmi Dapur Alamala untuk acara *${request.event_type}*:\n\nNo. Invoice: *${invoiceNumber}*\nTotal Tagihan: *${formatRupiah(calculatedTotal)}*\nStatus Pembayaran: *${isDpPaid ? 'DP 50% TERBAYAR' : 'MENUNGGU DP'}*\n\nTautan Resmi: ${window.location.origin}/#/menu/${request.id}\n\nTerima kasih atas kepercayaannya memilih Dapur Alamala Catering!`;
    const cleanPhone = cleanPhoneNumber(request.phone);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Invoice Resmi Dapur Alamala"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col text-[#1C1917]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* STICKY TOP ACTION BAR: Always stays visible when scrolling long invoices */}
          <div className="no-print sticky top-0 z-30 px-4 sm:px-5 py-3 bg-stone-100/95 backdrop-blur-md border-b border-stone-200 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Printer className="w-4 h-4 text-[#1E3A2F] shrink-0" />
                <span className="truncate">Invoice Resmi {invoiceNumber}</span>
              </span>
              {isFullyPaid && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" /> LUNAS
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* WhatsApp Invoice / Kwitansi Lunas Button */}
              {isFullyPaid ? (
                <button
                  onClick={handleSendToClientWa}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Kirim kwitansi lunas dan bukti pembayaran resmi langsung ke WhatsApp pembeli"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kirim Kwitansi Lunas ke WA Pembeli</span>
                  <span className="sm:hidden">Kirim WA Lunas</span>
                </button>
              ) : (
                <button
                  onClick={handleSendToClientWa}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Kirimkan ringkasan invoice ke WhatsApp klien"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Kirim ke WA Klien</span>
                  <span className="sm:hidden">Kirim WA</span>
                </button>
              )}

              {/* Print / Save PDF Button */}
              <button
                onClick={handlePrint}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Cetak langsung ke printer atau simpan sebagai PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak / PDF</span>
                <span className="sm:hidden">Cetak</span>
              </button>

              {/* Close Button (Header) */}
              <button
                onClick={onClose}
                className="px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-200/80 hover:bg-stone-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Tutup Pratinjau Invoice (ESC)"
              >
                <X className="w-4 h-4" />
                <span className="hidden xs:inline">Tutup</span>
              </button>
            </div>
          </div>

          {/* Printable Invoice Document Body */}
          <div id="printable-invoice" className="p-6 sm:p-10 space-y-6 bg-white print:p-0 print:m-0 print:border-none">
            
            {/* Header: Official Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-[#1E3A2F]">
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-xl bg-[#1E3A2F]/10 border border-[#1E3A2F]/20 flex items-center justify-center shrink-0">
                  <AlamalaEmblem size={34} color="#C3282E" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E3A2F] leading-tight">
                    DAPUR ALAMALA
                  </h1>
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest block">
                    Puding, Cake &amp; Catering Tradisional Malang
                  </span>
                  <p className="text-xs text-stone-600 mt-1 max-w-sm leading-relaxed">
                    Perumahan Sengkaling Indah II Blok Kemuning III No. 8, Sengkaling, Dau, Kabupaten Malang
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    WhatsApp: <strong>0878-7530-1729</strong> · Instagram: <strong>@alamala_malang</strong>
                  </p>
                </div>
              </div>

              {/* Invoice Meta Box */}
              <div className="text-left sm:text-right shrink-0 bg-[#FAF8F5] sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-none border-stone-200">
                <div className="font-serif font-bold text-xl text-[#9B381E] tracking-wide">
                  {isFullyPaid ? 'KWITANSI & INVOICE LUNAS' : 'INVOICE & PENAWARAN'}
                </div>
                <div className="text-xs font-mono text-stone-600 font-semibold mt-1">
                  {invoiceNumber}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  Tanggal Terbit: {issueDate}
                </div>
                <div className="mt-2">
                  {isFullyPaid ? (
                    <span className="inline-block px-3 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs uppercase tracking-wider">
                      ✓ LUNAS 100% (PAID)
                    </span>
                  ) : isDpPaid ? (
                    <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs uppercase tracking-wider">
                      ✓ DP 50% TERVERIFIKASI
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs uppercase tracking-wider">
                      MENUNGGU PEMBAYARAN DP
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Client & Event Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF8F5] p-4 rounded-xl border border-stone-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                  Ditagihkan Kepada (Klien):
                </span>
                <span className="font-bold text-sm text-[#1C1917] block">
                  {request.name}
                </span>
                <span className="text-stone-600 block">
                  No. Telepon/WA: <strong>{request.phone}</strong>
                </span>
                <span className="text-stone-600 block">
                  Alamat Kirim: {request.location || 'Wilayah Malang Raya'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                  Rincian Agenda Acara:
                </span>
                <span className="font-bold text-sm text-[#1C1917] block">
                  {request.event_type}
                </span>
                <span className="text-stone-600 block">
                  Tanggal Pengantaran: <strong>{request.event_date || 'Konfirmasi Menyusul'}</strong>
                </span>
                <span className="text-stone-600 block">
                  Jumlah Pesanan: <strong>{request.portions} Pax / Box</strong>
                </span>
                {request.notes && (
                  <span className="text-[11px] text-stone-500 block italic">
                    Catatan: "{request.notes}"
                  </span>
                )}
              </div>
            </div>

            {/* Itemized Table (Horizontally scrollable on mobile) */}
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full min-w-[500px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/80 border-b border-stone-200 text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Deskripsi Menu &amp; Paket Hidangan</th>
                    <th className="py-2.5 px-3 text-center w-20">Porsi</th>
                    <th className="py-2.5 px-3 text-right w-28">Harga /Pax</th>
                    <th className="py-2.5 px-3 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {request.menus && request.menus.length > 0 ? (
                    request.menus.map((item, idx) => {
                      const unitPrice = item.custom_price || item.menu?.price || 28000;
                      const subtotal = unitPrice * (request.portions || 1);
                      return (
                        <tr key={item.id || idx} className="hover:bg-stone-50/50">
                          <td className="py-3 px-3 text-center font-medium text-stone-500">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-stone-900 block">
                              {item.menu?.name || 'Paket Hidangan Dapur Alamala'}
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              {item.note || item.menu?.description || 'Menu lengkap disiapkan fresh & higienis pada hari acara.'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-stone-800">
                            {request.portions} Pax
                          </td>
                          <td className="py-3 px-3 text-right text-stone-700">
                            {formatRupiah(unitPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-stone-900">
                            {formatRupiah(subtotal)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="py-3 px-3 text-center font-medium text-stone-500">1</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-stone-900 block">
                          {request.notes?.includes('Menu:')
                            ? request.notes.replace(/^Menu:\s*/, '').split('.')[0].trim()
                            : (request.event_type ? `Paket Sajian Catering (${request.event_type})` : 'Paket Sajian Catering Dapur Alamala')}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          Menu pilihan nusantara segar standar Dapur Alamala Malang.
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-stone-800">
                        {request.portions} Pax
                      </td>
                      <td className="py-3 px-3 text-right text-stone-700">
                        {formatRupiah(Math.round(calculatedTotal / (request.portions || 1)))}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-stone-900">
                        {formatRupiah(calculatedTotal)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
              {/* Payment Details & Instructions */}
              <div className="sm:max-w-xs space-y-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-stone-600 text-[11px] block">
                  Metode Pembayaran Resmi:
                </span>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>Bank BCA</span>
                    <span className="text-emerald-700 font-mono text-[11px]">8161234567</span>
                  </div>
                  <div className="text-stone-600 text-[11px]">
                    Atas Nama: <strong>ALAMALA</strong>
                  </div>
                  <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-200">
                    {isFullyPaid 
                      ? '✓ Pembayaran telah lunas 100%. Pesanan siap diproses dan dikirimkan.'
                      : 'Kunci slot jadwal acara dengan transfer Uang Muka (DP 50%). Sisa pembayaran dapat dilunasi saat pengantaran / H-1.'
                    }
                  </div>
                </div>
              </div>

              {/* Subtotal & Balance Breakdown */}
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-200 text-stone-600">
                  <span>Subtotal Pesanan:</span>
                  <span className="font-semibold text-stone-900">{formatRupiah(calculatedTotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200 text-stone-600">
                  <span>Uang Muka (DP 50%):</span>
                  <span className={`font-semibold ${isDpPaid || isFullyPaid ? 'text-emerald-700' : 'text-stone-900'}`}>
                    {formatRupiah(calculatedDp)} {isDpPaid || isFullyPaid ? '(Terbayar)' : '(Wajib)'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-stone-900 font-bold text-sm text-[#1C1917]">
                  <span>Total Tagihan:</span>
                  <span className="font-serif text-base text-[#9B381E]">{formatRupiah(calculatedTotal)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs font-semibold">
                  <span>Sisa Pelunasan:</span>
                  <span className={calculatedRemaining === 0 ? 'text-emerald-700 font-bold' : 'text-stone-900'}>
                    {calculatedRemaining === 0 ? 'LUNAS (Rp 0)' : formatRupiah(calculatedRemaining)}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Stamp & Signatures */}
            <div className="pt-8 border-t border-stone-200 flex items-end justify-between text-xs">
              <div className="text-[11px] text-stone-500 max-w-sm space-y-1">
                <p>Dokumen ini adalah bukti penawaran &amp; faktur tagihan resmi yang diterbitkan secara elektronik oleh Dapur Alamala Malang.</p>
                <p className="font-mono text-[10px]">Dicetak secara otomatis melalui portal manajemen Dapur Alamala.</p>
              </div>

              <div className="text-center shrink-0 space-y-1">
                <span className="text-[11px] text-stone-500 block">Dapur Alamala Malang,</span>
                
                {/* Official Red & Gold Circular Stamp */}
                <div className="my-1 inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-[#9B381E] text-[#9B381E] p-1 font-serif rotate-[-6deg] select-none opacity-85">
                  <div className="w-full h-full rounded-full border border-[#9B381E] flex flex-col items-center justify-center text-[9px] font-bold leading-tight uppercase">
                    <span>DAPUR</span>
                    <span className="text-[11px] text-[#C3282E]">ALAMALA</span>
                    <span className="text-[7px]">MALANG</span>
                  </div>
                </div>

                <div className="font-bold text-stone-900 underline block">
                  Ibu Alamala &amp; Tim Dapur
                </div>
                <span className="text-[10px] text-stone-500 block">Pengelola Resmi</span>
              </div>
            </div>

          </div>

          {/* NON-PRINTABLE BOTTOM ACTION BAR: Guaranteed visible close & send buttons at document bottom */}
          <div className="no-print px-5 py-4 bg-stone-100 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Tutup Pratinjau Invoice</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>

              {isFullyPaid ? (
                <button
                  onClick={handleSendToClientWa}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim Kwitansi Lunas ke WhatsApp Pembeli</span>
                </button>
              ) : (
                <button
                  onClick={handleSendToClientWa}
                  className="px-4 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Kirim Invoice ke WA Klien</span>
                </button>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
