/**
 * Utility to compress image files from file input to web-optimized data URLs
 * Keeps file sizes under 150KB to preserve localStorage and state efficiency.
 */
export async function compressImageFile(
  file: File, 
  maxWidth = 1200, 
  maxHeight = 900, 
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer webp, fallback to jpeg
        try {
          const webpUrl = canvas.toDataURL('image/webp', quality);
          if (webpUrl && webpUrl.startsWith('data:image/webp')) {
            resolve(webpUrl);
            return;
          }
        } catch {
          // ignore
        }

        const jpegUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegUrl);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export const PRESET_CATALOG_IMAGES = [
  {
    name: 'Nasi Box Ayam Bakar Madu',
    url: '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
    category: 'nasi_box'
  },
  {
    name: 'Tumpeng Megah Tampah Hias',
    url: '/src/assets/images/tumpeng_hias_tampah_1792341601967.jpg',
    category: 'tumpeng'
  },
  {
    name: 'Prasmanan & Tumpeng Catering',
    url: '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg',
    category: 'tumpeng'
  },
  {
    name: 'Snack Box Tradisional & Kue Basah',
    url: '/src/assets/images/snack_box_tradisional_1792341600946.jpg',
    category: 'snack_box'
  },
  {
    name: 'Puding Buah Kaca Segar',
    url: '/src/assets/images/puding_buah_kaca_1792341616046.jpg',
    category: 'puding_dessert'
  }
];
