import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Menu, PaymentStage } from '../../types';
import { 
  formatRupiah, 
  createCateringRequest, 
  submitPaymentProof,
  buildDirectOrderWhatsAppUrl,
  PAYMENT_BANK_DETAILS 
} from '../../lib/supabase';
import { 
  X, 
  ShoppingBag, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Copy, 
  Check, 
  CreditCard, 
  UploadCloud, 
  Trash2, 
  ArrowRight,
  ArrowLeft,
  Building2,
  MessageCircle,
  AlertCircle
} from 'lucide-react';

interface SimpleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMenu?: Menu | null;
  menus: Menu[];
}

type CheckoutStep = 'order_form' | 'payment_checkout' | 'success';

export const SimpleOrderModal: React.FC<SimpleOrderModalProps> = ({
  isOpen,
  onClose,
  initialMenu,
  menus
}) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('order_form');
  
  // Form fields
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [portions, setPortions] = useState<number>(20);
  const [portionInput, setPortionInput] = useState<string>('20');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [eventType, setEventType] = useState('');

  // Payment fields
  const [paymentOption, setPaymentOption] = useState<'paid_dp_now' | 'pay_later'>('paid_dp_now');
  const [proofImage, setProofImage] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [senderBank, setSenderBank] = useState<string>('BCA');
  const [senderName, setSenderName] = useState<string>('');
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [generatedWaUrl, setGeneratedWaUrl] = useState('');
  const [createdRequestId, setCreatedRequestId] = useState('');

  const updatePortions = (val: number) => {
    const valid = Math.max(1, val);
    setPortions(valid);
    setPortionInput(String(valid));
  };

  const handlePortionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setPortionInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setPortions(parsed);
    }
  };

  const handlePortionInputBlur = () => {
    const parsed = parseInt(portionInput, 10);
    if (isNaN(parsed) || parsed < 10) {
      setPortions(10);
      setPortionInput('10');
    } else {
      setPortions(parsed);
      setPortionInput(String(parsed));
    }
  };

  useEffect(() => {
    if (initialMenu) {
      setSelectedMenuId(initialMenu.id);
    } else if (menus.length > 0 && !selectedMenuId) {
      setSelectedMenuId(menus[0].id);
    }
    if (isOpen) {
      setCurrentStep('order_form');
      setErrorBanner(null);
      setIsSubmitting(false);
      setPortionInput(String(portions));
    }
  }, [initialMenu, menus, isOpen]);

  const selectedMenu = useMemo(() => {
    return menus.find(m => m.id === selectedMenuId) || menus[0];
  }, [menus, selectedMenuId]);

  const isTumpengBig = selectedMenu?.category === 'tumpeng' && (selectedMenu?.price || 0) > 100000;

  const totalAmount = useMemo(() => {
    if (!selectedMenu) return 0;
    if (isTumpengBig) {
      return selectedMenu.price * Math.max(1, Math.round(portions / 20));
    }
    return selectedMenu.price * portions;
  }, [selectedMenu, portions, isTumpengBig]);

  const dpAmount = totalAmount * 0.5;
  const remainingAmount = totalAmount - dpAmount;

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !eventDate) {
      setErrorBanner('Mohon lengkapi nama pemesan, nomor WhatsApp, dan tanggal acara.');
      return;
    }
    if (!eventType.trim()) {
      setErrorBanner('Mohon tuliskan jenis agenda acara Anda (contoh: Syukuran, Khitanan, Rapat, dll).');
      return;
    }
    if (portions < 10) {
      setErrorBanner('Minimal pemesanan catering adalah 10 porsi (pax).');
      return;
    }
    setErrorBanner(null);
    if (!senderName) {
      setSenderName(customerName.trim());
    }
    setCurrentStep('payment_checkout');
  };

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(PAYMENT_BANK_DETAILS.accountNumber);
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(dpAmount.toString());
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  const handleProofImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorBanner('Pilih file gambar bukti transfer (JPG, PNG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorBanner('Ukuran gambar maksimal 5 MB.');
      return;
    }
    setErrorBanner(null);
    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofImage(ev.target?.result as string);
      setPaymentOption('paid_dp_now');
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorBanner(null);

    const reqId = 'order-' + Date.now();
    try {
      const created = await createCateringRequest({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        event_type: eventType.trim() || 'Pesanan Catering',
        event_date: eventDate,
        portions,
        location: address.trim() || 'Kota Malang',
        notes: notes.trim() ? `Menu: ${selectedMenu?.name}. ${notes.trim()}` : `Menu: ${selectedMenu?.name}`,
        budget: formatRupiah(selectedMenu?.price || 0),
        total_price: totalAmount,
        dp_amount: dpAmount,
        remaining_amount: remainingAmount,
        menus: selectedMenu ? [
          {
            id: 'rm-' + Date.now(),
            request_id: 'temp',
            menu_id: selectedMenu.id,
            custom_price: selectedMenu.price,
            note: selectedMenu.description,
            is_default_selected: true,
            menu: selectedMenu
          }
        ] : []
      });
      setCreatedRequestId(created.id);

      if (paymentOption === 'paid_dp_now' && proofImage) {
        await submitPaymentProof(created.id, {
          stage: 'dp',
          amount: dpAmount,
          sender_bank: senderBank || 'BCA',
          sender_name: senderName.trim() || customerName.trim(),
          receipt_image: proofImage,
          receipt_filename: proofFileName || 'bukti_transfer_dp.jpg',
          notes: 'Pembayaran DP 50% saat checkout'
        });
      }

      const waUrl = buildDirectOrderWhatsAppUrl({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        eventType,
        eventDate,
        portions,
        location: address.trim() || 'Kota Malang',
        notes: notes.trim(),
        menu: selectedMenu!,
        totalAmount,
        dpAmount,
        remainingAmount,
        paymentOption,
        senderBank,
        senderName: senderName.trim() || customerName.trim(),
        requestId: created.id
      });

      setGeneratedWaUrl(waUrl);
      setCurrentStep('success');

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {}

      try {
        window.open(waUrl, '_blank');
      } catch (err) {
        console.warn('Popup blocked, available via button', err);
      }
    } catch {
      setErrorBanner('Terjadi kendala saat mencatat pesanan. Silakan lanjutkan via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-lg bg-[#FAF8F5] rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with simple step text */}
        <div className="px-5 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
              {currentStep === 'order_form' ? 'Langkah 1 dari 2 · Detail Pesanan' : currentStep === 'payment_checkout' ? 'Langkah 2 dari 2 · Checkout' : 'Pesanan Tersusun'}
            </span>
            <h3 className="font-serif text-lg font-bold text-[#1C1917] leading-tight">
              {currentStep === 'order_form' ? 'Pemesanan Catering' : currentStep === 'payment_checkout' ? 'Checkout & Pembayaran DP 50%' : 'Konfirmasi Pesanan'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {errorBanner && (
            <div className="mb-4 p-3 bg-stone-100 border border-stone-300 rounded-lg flex items-start gap-2.5 text-stone-800 text-xs">
              <AlertCircle className="w-4 h-4 text-[#9B381E] shrink-0 mt-0.5" />
              <span className="flex-1">{errorBanner}</span>
              <button onClick={() => setErrorBanner(null)} className="text-stone-500 hover:text-stone-800">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* STEP 1: FORMULIR PEMESANAN */}
          {currentStep === 'order_form' && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              {/* Menu selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  1. Pilih Hidangan / Paket *
                </label>
                <select
                  value={selectedMenuId}
                  onChange={(e) => setSelectedMenuId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-medium"
                >
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {formatRupiah(m.price)} {m.category === 'tumpeng' && m.price > 100000 ? '/tampah' : '/pax'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Stepper (Bebas diisi, Min. 10 Pax) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    2. Jumlah Porsi (Bebas / Fleksibel) *
                  </label>
                  <span className="text-[#1E3A2F] font-bold bg-[#E8EFEA] px-2 py-0.5 rounded text-[11px] tabular-nums">
                    {portions} Pax
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mb-2">
                  Bisa diisi angka berapa saja sesuai yang Anda inginkan (bukan hanya kelipatan, contoh: 12, 17, 23, 37 pax. Minimal 10 pax).
                </p>

                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center border border-stone-300 bg-white rounded-lg overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => updatePortions(Math.max(10, portions - 1))}
                      className="p-2 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Kurangi 1 porsi"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="10"
                      step="1"
                      value={portionInput}
                      onChange={handlePortionInputChange}
                      onBlur={handlePortionInputBlur}
                      placeholder="Min. 10"
                      className="w-20 text-center text-xs sm:text-sm font-bold text-stone-900 focus:outline-none py-1.5 tabular-nums border-x border-stone-200"
                    />
                    <button
                      type="button"
                      onClick={() => updatePortions(portions + 1)}
                      className="p-2 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Tambah 1 porsi"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-stone-600 font-medium mr-0.5">Pilihan cepat:</span>
                    {[10, 15, 20, 25, 30, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updatePortions(preset)}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          portions === preset
                            ? 'bg-[#1E3A2F] text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {preset} Pax
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Pemesan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ibu Rina Dewi"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Date & Event Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tanggal Pengantaran *
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Jenis Acara (Bebas Ditulis) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Syukuran, Khitanan, Rapat, dll."
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alamat Pengantaran di Malang Raya
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Raya Sengkaling / Lowokwaru / Klojen"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              {/* Special notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Catatan Khusus (Level Pedas, Jam Tiba, dll.)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sambal dipisah untuk anak-anak, minta dikirim jam 10.30 pagi..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              {/* Subtotal summary banner */}
              <div className="p-3.5 bg-stone-100 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-500 block">Total Estimasi ({portions} Porsi)</span>
                  <span className="font-serif font-bold text-base text-[#1C1917] tabular-nums">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">DP 50% untuk Kunci Slot:</span>
                  <span className="font-semibold text-sm text-[#1E3A2F] tabular-nums">
                    {formatRupiah(dpAmount)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: CHECKOUT & PEMBAYARAN DP */}
          {currentStep === 'payment_checkout' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setCurrentStep('order_form')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ubah Data Pesanan</span>
              </button>

              {/* Order recap */}
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-[#1C1917]">
                  <span>{selectedMenu?.name}</span>
                  <span>{portions} Pax</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Tanggal Acara:</span>
                  <span className="text-stone-800">{eventDate} ({customerName})</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-100">
                  <span className="text-stone-500">Total Tagihan:</span>
                  <span className="font-bold text-[#1C1917] tabular-nums">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#1E3A2F]" />
                    <span className="font-semibold text-xs text-stone-900">
                      {PAYMENT_BANK_DETAILS.bankName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRekening}
                    className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedRekening ? <Check className="w-3 h-3 text-[#1E3A2F]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRekening ? 'Tersalin' : 'Salin Rekening'}</span>
                  </button>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block">No. Rekening Resmi:</span>
                    <span className="font-mono font-bold text-sm text-[#1C1917] tracking-wider tabular-nums">
                      {PAYMENT_BANK_DETAILS.accountNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 uppercase block">Atas Nama:</span>
                    <span className="font-semibold text-xs text-stone-900">
                      {PAYMENT_BANK_DETAILS.accountHolder}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="text-stone-600">Nominal Wajib DP 50%:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1E3A2F] tabular-nums">
                      {formatRupiah(dpAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNominal}
                      className="text-[10px] text-stone-500 hover:text-stone-900 underline cursor-pointer"
                    >
                      {copiedNominal ? 'Tersalin' : 'Salin Nominal'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700">
                  Status Pembayaran Saat Ini:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('paid_dp_now')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      paymentOption === 'paid_dp_now'
                        ? 'border-[#1E3A2F] bg-white ring-1 ring-[#1E3A2F]'
                        : 'border-stone-200 bg-[#FAF8F5] text-stone-600 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold block text-stone-900">Sudah Transfer DP</span>
                    <span className="text-[11px] text-stone-500 mt-0.5 block">Lampirkan foto struk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption('pay_later');
                      setProofImage('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      paymentOption === 'pay_later'
                        ? 'border-[#1E3A2F] bg-white ring-1 ring-[#1E3A2F]'
                        : 'border-stone-200 bg-[#FAF8F5] text-stone-600 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold block text-stone-900">Transfer Nanti</span>
                    <span className="text-[11px] text-stone-500 mt-0.5 block">Booking jadwal dulu</span>
                  </button>
                </div>
              </div>

              {/* Struk upload if paid now */}
              {paymentOption === 'paid_dp_now' && (
                <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-3">
                  <div className="text-xs font-semibold text-stone-800">
                    Foto Bukti Transfer (Screenshot M-Banking / Struk ATM)
                  </div>
                  {!proofImage ? (
                    <label className="flex flex-col items-center justify-center p-4 rounded-lg border border-dashed border-stone-300 hover:border-stone-500 bg-[#FAF8F5] cursor-pointer transition-colors">
                      <UploadCloud className="w-6 h-6 text-stone-500 mb-1" />
                      <span className="text-xs font-medium text-stone-700">
                        Klik untuk Pilih Foto Bukti Transfer
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        Format JPG atau PNG (Maksimal 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofImageUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={proofImage}
                          alt="Bukti Struk"
                          className="w-12 h-12 rounded object-cover bg-white shrink-0 border border-stone-200"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-stone-900 truncate block">
                            {proofFileName || 'bukti_transfer.jpg'}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            Foto siap dikirim bersama pesanan
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProofImage('');
                          setProofFileName('');
                        }}
                        className="p-1 text-stone-400 hover:text-red-600"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">
                        Bank Pengirim
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: BCA / Mandiri"
                        value={senderBank}
                        onChange={(e) => setSenderBank(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-white border border-stone-300 text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">
                        Nama Pemilik Rekening
                      </label>
                      <input
                        type="text"
                        placeholder="Nama di rekening"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-white border border-stone-300 text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Final Submit Button */}
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Memproses Checkout...' : 'Checkout & Kirim ke WhatsApp'}
                </span>
              </button>

              <p className="text-[11px] text-center text-stone-500">
                Pesan akan langsung terbuka di WhatsApp dapur dengan rincian lengkap.
              </p>
            </div>
          )}

          {/* STEP 3: SUKSES */}
          {currentStep === 'success' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-[#1E3A2F] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-xl font-bold text-[#1C1917]">
                  Pesanan Berhasil Disiapkan
                </h4>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  Format rincian pesanan telah disiapkan untuk WhatsApp Dapur Alamala.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-stone-200 w-full text-left text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-[#1C1917]">
                  <span>{selectedMenu?.name}</span>
                  <span>{portions} Pax</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Tanggal Acara:</span>
                  <span className="text-stone-800">{eventDate}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Total Tagihan:</span>
                  <span className="font-bold text-[#1C1917] tabular-nums">{formatRupiah(totalAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-100 text-stone-700">
                  <span>Status DP 50%:</span>
                  <span className="font-semibold text-[#1E3A2F]">
                    {paymentOption === 'paid_dp_now' ? 'Konfirmasi Dilampirkan' : 'Akan Ditransfer'}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2 pt-2">
                <a
                  href={generatedWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Buka Chat WhatsApp Dapur Alamala</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-lg border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
