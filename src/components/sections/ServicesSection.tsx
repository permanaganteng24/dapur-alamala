import React, { useState } from 'react';
import { Menu } from '../../types';
import { formatRupiah } from '../../lib/formatters';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { MenuGalleryModal } from '../modals/MenuGalleryModal';
import { InlineMenuImageSlider } from '../common/InlineMenuImageSlider';

interface ServicesSectionProps {
  menus: Menu[];
  onSelectMenuForOrder: (menu: Menu) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  menus,
  onSelectMenuForOrder
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMenuForGallery, setSelectedMenuForGallery] = useState<Menu | null>(null);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState<number>(0);

  const categories = [
    { id: 'all', label: 'Semua Menu' },
    { id: 'nasi_box', label: 'Nasi Box' },
    { id: 'tumpeng', label: 'Tumpeng Tampah' },
    { id: 'snack_box', label: 'Snack Box' },
    { id: 'puding_dessert', label: 'Puding & Dessert' },
  ];

  const filteredMenus = activeCategory === 'all'
    ? menus
    : menus.filter(m => m.category === activeCategory);

  return (
    <section id="menu" className="py-14 sm:py-20 bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#9B381E] mb-2">
              Katalog Hidangan
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight">
              Pilihan Paket Sajian Dapur Alamala
            </h2>
            <p className="text-sm text-stone-600 mt-2 max-w-xl">
              Seluruh hidangan disiapkan hangat pada hari acara menggunakan rempah nusantara segar dan pengemasan higienis.
            </p>
          </div>

          {/* Category Filter - Segmented Control (Interactive buttons) */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg overflow-x-auto max-w-full shrink-0">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-white text-stone-950 shadow-sm font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid: 3-column desktop, 2-column tablet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredMenus.map((item) => (
            <article
              key={item.id}
              className="group rounded-xl border border-stone-200 bg-[#FAF8F5] overflow-hidden flex flex-col justify-between hover:border-stone-300 hover:shadow-sm transition-all duration-200"
            >
              {/* Product Image Slider (Swipe & Slide photos directly on card without opening modal) */}
              <InlineMenuImageSlider
                images={item.images && item.images.length > 0 ? item.images : [item.image_url]}
                alt={item.name}
                tag={item.tag}
                onOpenModal={(initialIdx) => {
                  setSelectedMenuForGallery(item);
                  setGalleryInitialIndex(initialIdx);
                }}
              />

              {/* Product Content Details */}
              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <div className="text-[11px] text-stone-500 font-medium uppercase tracking-wider mb-1">
                    {item.category === 'tumpeng' ? 'Tumpeng Tradisional' : item.category === 'snack_box' ? 'Snack Tradisional' : item.category === 'puding_dessert' ? 'Dessert Segar' : 'Nasi Box Premium'}
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#1C1917] leading-snug group-hover:text-[#9B381E] transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 block">Mulai dari</span>
                    <span className="font-bold text-sm sm:text-base text-[#1C1917] tabular-nums">
                      {formatRupiah(item.price)}
                    </span>
                    <span className="text-[11px] text-stone-500 font-normal ml-1">
                      {item.category === 'tumpeng' && item.price > 100000 ? '/tampah' : '/pax'}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectMenuForOrder(item)}
                    className="px-3.5 py-2 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Pilih Menu</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Quick Proposal Callout */}
        <div className="mt-12 p-6 sm:p-7 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-serif text-lg font-bold text-[#1C1917]">
              Punya Anggaran Khusus atau Ingin Kustom Menu?
            </h4>
            <p className="text-xs text-stone-600">
              Kami siap menyesuaikan pilihan lauk, kue basah, atau level kepedasan sesuai kebutuhan acara Anda.
            </p>
          </div>

          <button
            onClick={() => onSelectMenuForOrder(menus[0])}
            className="px-5 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>Konsultasi &amp; Estimasi Biaya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Menu Photo Gallery & Details Lightbox Modal */}
      <MenuGalleryModal
        menu={selectedMenuForGallery}
        isOpen={Boolean(selectedMenuForGallery)}
        initialIndex={galleryInitialIndex}
        onClose={() => setSelectedMenuForGallery(null)}
        onSelectForOrder={onSelectMenuForOrder}
      />
    </section>
  );
};
