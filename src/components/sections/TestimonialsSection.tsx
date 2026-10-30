import React from 'react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Ibu Hj. Rahmawati',
      role: 'Pengajian & Syukuran Khitanan, Klojen Malang',
      text: 'Rasa ayam bakar madunya sangat meresap dan dagingnya empuk. Sambal bajaknya pas tidak terlalu pedas sehingga disukai anak-anak dan orang tua. Kemasan rapi dan sampai di rumah tepat waktu sebelum acara dimulai.',
      event: '60 Pax Nasi Box'
    },
    {
      name: 'Hendra Gunawan',
      role: 'General Affairs Telkom Malang',
      text: 'Fitur pemilihan menunya sangat memudahkan panitia kantor. Kami bisa menyesuaikan budget per pax dengan transparan. Pengiriman ke kantor sebelum jam makan siang dalam kondisi hangat dan bersih.',
      event: '120 Pax Nasi Box Rapat'
    },
    {
      name: 'dr. Amanda & Keluarga',
      role: 'Syukuran Akreditasi RS, Kota Malang',
      text: 'Tumpeng tampah dari Dapur Alamala sangat cantik dengan hiasan sayur bunga yang rapi untuk sesi foto bersama direksi. Nasi kuningnya pulen dan gurih. Semua tamu puas.',
      event: 'Tumpeng Tampah 25 Pax'
    }
  ];

  return (
    <section id="ulasan" className="py-14 sm:py-20 bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="max-w-xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9B381E] mb-2">
            Pengalaman Pelanggan
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight">
            Dipercaya untuk Hari Berharga Anda
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Ulasan nyata dari keluarga dan instansi yang telah memesan sajian Dapur Alamala di Malang Raya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-6 sm:p-7 rounded-xl bg-[#FAF8F5] border border-stone-200 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic mb-6">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200">
                <h4 className="font-serif font-bold text-sm text-[#1C1917]">
                  {t.name}
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {t.role}
                </p>
                <span className="text-[10px] text-stone-400 font-medium block mt-1">
                  Pesanan: {t.event}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
