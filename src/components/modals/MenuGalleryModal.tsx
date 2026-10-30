import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Images, CheckCircle2 } from 'lucide-react';
import { Menu } from '../../types';
import { formatRupiah } from '../../lib/formatters';

interface MenuGalleryModalProps {
  menu: Menu | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectForOrder: (menu: Menu) => void;
  initialIndex?: number;
}

export const MenuGalleryModal: React.FC<MenuGalleryModalProps> = ({
  menu,
  isOpen,
  onClose,
  onSelectForOrder,
  initialIndex = 0,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Sync active index when menu or initialIndex changes
  useEffect(() => {
    setActiveIndex(initialIndex || 0);
  }, [menu, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !menu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const photos = menu.images && menu.images.length > 0 ? menu.images : [menu.image_url];
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, menu, onClose]);

  if (!isOpen || !menu) return null;

  const photos = Array.isArray(menu.images) && menu.images.length > 0 
    ? menu.images 
    : [menu.image_url || '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'];

  const hasMultiple = photos.length > 1;

  const nextPhoto = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
              {menu.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
              <Images className="w-3.5 h-3.5 text-stone-400" />
              <span>{photos.length} Foto Tersedia</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
          
          {/* Main Photo Viewer */}
          <div className="relative aspect-[16/10] sm:aspect-[16/10] w-full bg-stone-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={photos[activeIndex] || activeIndex}
                src={photos[activeIndex]}
                alt={`${menu.name} - Foto ${activeIndex + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full object-contain sm:object-cover"
              />
            </AnimatePresence>

            {/* Photo Counter Pill */}
            {hasMultiple && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium backdrop-blur-xs">
                {activeIndex + 1} / {photos.length}
              </div>
            )}

            {/* Tag Badge */}
            {menu.tag && (
              <div className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold bg-white/95 text-stone-900 backdrop-blur-xs rounded shadow-xs">
                {menu.tag}
              </div>
            )}

            {/* Prev / Next Arrows */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-all cursor-pointer shadow-md active:scale-95"
                  title="Foto sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-all cursor-pointer shadow-md active:scale-95"
                  title="Foto berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails bar if multiple photos */}
          {hasMultiple && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-stone-100 ${
                    idx === activeIndex
                      ? 'border-[#1E3A2F] ring-2 ring-[#1E3A2F]/30 scale-102'
                      : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-medium py-0.5 text-center">
                      Utama
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Details Section */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1C1917]">
                  {menu.name}
                </h3>
                <span className="text-xs text-stone-500">
                  {menu.category === 'tumpeng' ? 'Tumpeng Tradisional' : menu.category === 'snack_box' ? 'Snack Tradisional' : menu.category === 'puding_dessert' ? 'Dessert Segar' : 'Nasi Box Premium'}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-stone-500 block">Harga</span>
                <span className="font-bold text-base sm:text-lg text-[#1E3A2F] tabular-nums">
                  {formatRupiah(menu.price)}
                </span>
                <span className="text-xs text-stone-500 font-normal ml-1">
                  {menu.category === 'tumpeng' && menu.price > 100000 ? '/tampah' : '/pax'}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {menu.description}
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A2F]" />
                100% Halal &amp; Higienis
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A2F]" />
                Bahan Segar Pilihan
              </span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectForOrder(menu);
            }}
            className="px-5 py-2.5 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pesan Menu Ini</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
