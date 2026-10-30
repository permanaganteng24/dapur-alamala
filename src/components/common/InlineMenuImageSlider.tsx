import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Images } from 'lucide-react';

interface InlineMenuImageSliderProps {
  images: string[];
  alt: string;
  tag?: string;
  onOpenModal?: (initialIndex: number) => void;
  aspectRatio?: string;
  className?: string;
}

export const InlineMenuImageSlider: React.FC<InlineMenuImageSliderProps> = ({
  images,
  alt,
  tag,
  onOpenModal,
  aspectRatio = 'aspect-[4/3]',
  className = ''
}) => {
  // Normalize images list (ensures at least 1 image and removes blanks)
  const validImages = Array.isArray(images) && images.length > 0 
    ? images.filter(Boolean) 
    : ['/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'];

  const [currentIndex, setCurrentIndex] = useState(0);
  const total = validImages.length;
  const hasMultiple = total > 1;

  // Touch tracking for mobile swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Keep currentIndex in bounds if images prop changes
  useEffect(() => {
    if (currentIndex >= total) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  const handlePrev = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  const handleSelectDot = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  // Touch gesture listeners for fluid mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultiple) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartX.current === null) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartX.current === null || touchEndX.current === null) return;
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - (touchStartY.current || 0));

    // Only trigger swipe if horizontal movement exceeds 35px and is predominantly horizontal
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > deltaY) {
      e.stopPropagation();
      if (deltaX > 0) {
        // Swiped left -> next
        handleNext(e);
      } else {
        // Swiped right -> prev
        handlePrev(e);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    isDragging.current = false;
  };

  const handleImageClick = () => {
    if (onOpenModal) {
      onOpenModal(currentIndex);
    }
  };

  return (
    <div 
      className={`relative ${aspectRatio} w-full overflow-hidden bg-stone-200 select-none group/slider ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Horizontal Carousel Track */}
      <div 
        className="flex w-full h-full transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {validImages.map((src, index) => (
          <div 
            key={`${src}-${index}`} 
            className="w-full h-full shrink-0 relative cursor-pointer"
            onClick={handleImageClick}
          >
            <img
              src={src}
              alt={`${alt} (Foto ${index + 1})`}
              className="w-full h-full object-cover group-hover/slider:scale-[1.02] transition-transform duration-300"
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Top Left Tag Badge */}
      {tag && (
        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[11px] font-semibold bg-white/95 text-stone-900 backdrop-blur-xs rounded shadow-xs z-10 pointer-events-none">
          {tag}
        </div>
      )}

      {/* Top Right Fullscreen Button */}
      {onOpenModal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(currentIndex);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 cursor-pointer shadow-xs"
          title="Perbesar foto"
          aria-label="Lihat foto layar penuh"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Navigation Chevrons (Previous & Next) */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover/slider:opacity-100 z-20 cursor-pointer shadow-sm active:scale-95"
            aria-label="Foto sebelumnya"
            title="Geser foto sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover/slider:opacity-100 z-20 cursor-pointer shadow-sm active:scale-95"
            aria-label="Foto berikutnya"
            title="Geser foto berikutnya"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </>
      )}

      {/* Bottom Photo Counter & Dots Indicator */}
      {hasMultiple && (
        <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-between px-3 pointer-events-none z-10">
          {/* Slider Pagination Dots */}
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-1 rounded-full pointer-events-auto">
            {validImages.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => handleSelectDot(e, dotIdx)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === dotIdx
                    ? 'w-3.5 h-1.5 bg-amber-300'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Lihat foto ${dotIdx + 1}`}
              />
            ))}
          </div>

          {/* Photo Counter Badge */}
          <div className="flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs">
            <Images className="w-3 h-3 text-amber-300" />
            <span>{currentIndex + 1} / {total}</span>
          </div>
        </div>
      )}
    </div>
  );
};
