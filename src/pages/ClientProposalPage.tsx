import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  fetchRequestById, 
  fetchMenus,
  subscribeToRequestUpdates, 
  formatRupiah, 
  buildClientOrderWhatsAppUrl,
  PAYMENT_BANK_DETAILS 
} from '../lib/supabase';
import { CateringRequest, Menu } from '../types';
import { 
  ArrowLeft, 
  Check, 
  Share2, 
  Copy, 
  Send, 
  AlertCircle,
  Printer
} from 'lucide-react';
import { AlamalaEmblem } from '../components/common/AlamalaLogo';
import { OfficialInvoiceModal } from '../components/modals/OfficialInvoiceModal';
import confetti from 'canvas-confetti';

interface ClientProposalPageProps {
  requestId: string;
  onNavigateBack: () => void;
}

export const ClientProposalPage: React.FC<ClientProposalPageProps> = ({ requestId, onNavigateBack }) => {
  const [request, setRequest] = useState<CateringRequest | null>(null);
  const [catalogMenus, setCatalogMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedMenuIds, setSelectedMenuIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const [reqData, allMenus] = await Promise.all([
        fetchRequestById(requestId),
        fetchMenus()
      ]);
      if (isMounted) {
        setRequest(reqData);
        setCatalogMenus(allMenus);
        const initSelection: Record<string, boolean> = {};
        if (reqData?.menus && reqData.menus.length > 0) {
          reqData.menus.forEach(m => {
            initSelection[m.menu_id] = m.is_default_selected !== false;
          });
        } else if (allMenus.length > 0) {
          initSelection[allMenus[0].id] = true;
          if (allMenus.length > 1) initSelection[allMenus[1].id] = true;
        }
        setSelectedMenuIds(initSelection);
        setLoading(false);
      }
    }
    load();

    const unsubscribe = subscribeToRequestUpdates(requestId, (updated) => {
      setRequest(updated);
      if (updated.menus && updated.menus.length > 0) {
        setSelectedMenuIds(prev => {
          const next = { ...prev };
          updated.menus?.forEach(m => {
            if (next[m.menu_id] === undefined) {
              next[m.menu_id] = m.is_default_selected !== false;
            }
          });
          return next;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [requestId]);

  const toggleMenu = (menuId: string) => {
    setSelectedMenuIds(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const isOwnerCustomized = Boolean(
    request && 
    request.status !== 'Baru' && 
    request.menus && 
    request.menus.length > 0
  );

  const displayMenuList = useMemo(() => {
    if (isOwnerCustomized && request?.menus) {
      return request.menus.map(rm => ({
        menu: rm.menu || catalogMenus.find(cm => cm.id === rm.menu_id)!,
        customPrice: rm.custom_price,
        note: rm.note
      })).filter(item => Boolean(item.menu));
    }
    return catalogMenus
      .filter(m => m.is_available)
      .map(m => ({
        menu: m,
        customPrice: undefined,
        note: undefined
      }));
  }, [isOwnerCustomized, request, catalogMenus]);

  const { selectedItems, totalPricePerPax, grandTotal, selectedCount } = useMemo(() => {
    if (!request) {
      return { selectedItems: [], totalPricePerPax: 0, grandTotal: 0, selectedCount: 0 };
    }
    const chosen: { menu: Menu; price: number }[] = [];
    let priceSum = 0;
    displayMenuList.forEach(item => {
      if (selectedMenuIds[item.menu.id]) {
        const itemPrice = item.customPrice ?? item.menu.price;
        chosen.push({ menu: item.menu, price: itemPrice });
        priceSum += itemPrice;
      }
    });
    const total = priceSum * (request.portions || 1);
    return {
      selectedItems: chosen,
      totalPricePerPax: priceSum,
      grandTotal: total,
      selectedCount: chosen.length
    };
  }, [request, displayMenuList, selectedMenuIds]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppOrder = () => {
    if (!request) return;
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch {}
    const url = buildClientOrderWhatsAppUrl(request, selectedItems, totalPricePerPax, grandTotal);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mb-3" />
        <p className="text-xs text-stone-600 font-medium">Memuat proposal menu...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-8 h-8 text-[#9B381E] mb-3" />
        <h2 className="font-serif text-xl font-bold text-[#1C1917]">Proposal Tidak Ditemukan</h2>
        <p className="text-xs text-stone-600 max-w-sm mt-1 mb-5">
          Tautan proposal ini mungkin telah berakhir atau kode tidak cocok.
        </p>
        <button
          onClick={onNavigateBack}
          className="px-4 py-2 rounded-lg bg-[#1E3A2F] text-white text-xs font-semibold cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] pb-32">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2">
            <AlamalaEmblem size={24} color="#C3282E" />
            <span className="font-serif text-base font-bold text-[#1C1917]">
              Dapur Alamala
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Cetak Surat Penawaran & Invoice Resmi"
            >
              <Printer className="w-3.5 h-3.5 text-[#1E3A2F]" />
              <span className="hidden sm:inline">Cetak Invoice</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 cursor-pointer"
              title="Salin Tautan"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#1E3A2F]" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
      >
        
        {/* Proposal Header Card */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#C3282E] mb-1">
              Proposal Menu Acara
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              {request.event_type}
            </h1>
          </div>

          {/* Unboxed clean metadata with separator dots */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-stone-600 pt-1 border-t border-stone-100">
            <span className="font-medium text-stone-900">{request.name}</span>
            <span>·</span>
            <span>{request.portions} Pax</span>
            <span>·</span>
            <span>{request.event_date}</span>
            <span>·</span>
            <span>{request.location || 'Malang'}</span>
          </div>

          {request.notes && (
            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-stone-200 text-xs text-stone-700 italic">
              "Catatan pemesan: {request.notes}"
            </div>
          )}

          {request.owner_notes && (
            <div className="p-3 bg-[#F4EFEA] rounded-lg border border-stone-300 text-xs text-stone-800">
              <span className="font-semibold block text-[#1E3A2F] mb-0.5">Catatan Dapur Alamala:</span>
              <p>{request.owner_notes}</p>
            </div>
          )}
        </div>

        {/* Menu Selection Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[#1C1917]">
              Pilih Hidangan ({selectedCount} Dipilih)
            </h2>
            <span className="text-xs text-stone-500">
              Centang untuk hitung otomatis
            </span>
          </div>

          <div className="space-y-3">
            {displayMenuList.map((item) => {
              const menu = item.menu;
              const isChecked = Boolean(selectedMenuIds[menu.id]);
              const finalPrice = item.customPrice ?? menu.price;

              return (
                <div
                  key={menu.id}
                  onClick={() => toggleMenu(menu.id)}
                  className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                    isChecked
                      ? 'border-[#1E3A2F] ring-1 ring-[#1E3A2F]'
                      : 'border-stone-200 hover:border-stone-300 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked ? 'bg-[#1E3A2F] text-white' : 'border border-stone-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1917]">
                          {menu.name}
                        </h3>
                        <span className="font-semibold text-sm text-[#1C1917] tabular-nums shrink-0">
                          {formatRupiah(finalPrice)}
                          <span className="text-[10px] text-stone-500 font-normal ml-0.5">/pax</span>
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {menu.description}
                      </p>

                      {item.note && (
                        <p className="text-[11px] text-[#C3282E] mt-1 font-medium">
                          Catatan: {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="p-5 rounded-xl bg-white border border-stone-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-700">
              Rekening BCA Resmi Dapur Alamala
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(PAYMENT_BANK_DETAILS.accountNumber);
                setCopiedRekening(true);
                setTimeout(() => setCopiedRekening(false), 2000);
              }}
              className="text-[11px] font-semibold text-[#1E3A2F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedRekening ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedRekening ? 'Tersalin' : 'Salin Rekening'}</span>
            </button>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-lg border border-stone-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-stone-500 uppercase block">No. Rekening:</span>
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

          <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100 text-stone-600">
            <span>Nominal DP 50%:</span>
            <span className="font-bold text-[#1E3A2F] text-sm tabular-nums">
              {formatRupiah(grandTotal * 0.5)}
            </span>
          </div>
        </div>

      </motion.main>

      {/* Sticky Bottom Summary Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] text-stone-500">
              {selectedCount} Menu · {request.portions} Pax
            </div>
            <div className="font-serif font-bold text-lg text-[#1C1917] tabular-nums">
              {formatRupiah(grandTotal)}
            </div>
          </div>

          <button
            onClick={handleWhatsAppOrder}
            disabled={selectedCount === 0}
            className="px-6 py-3 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span>Konfirmasi ke WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Official Invoice Modal */}
      <OfficialInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        request={request}
      />
    </div>
  );
};
