import { Menu, CateringRequest } from '../types';

export const INITIAL_MENUS: Menu[] = [
  // --- KATEGORI 1: NASI BOX ---
  {
    id: 'menu-amala-01',
    name: 'Nasi Box Ayam Bakar Madu',
    category: 'nasi_box',
    description: 'Ayam bakar madu karamel gurih dengan bumbu rempah meresap, sambal bajak terasi matang, tahu & tempe bacem legit, lalapan timun kemangi segar, kerupuk udang, dan nasi putih wangi.',
    price: 28000,
    image_url: '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
    images: [
      '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
      '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg'
    ],
    tag: 'Menu Terlaris',
    is_available: true
  },
  {
    id: 'menu-amala-02',
    name: 'Nasi Kuning Box Komplit Syukuran',
    category: 'nasi_box',
    description: 'Nasi kuning wangi pulen bumbu kunyit santan, ayam suwir bumbu rujak pedas manis, telur balado separuh, orek tempe kacang karamel, mi goreng sayur, serundeng gurih, & sambal bajak.',
    price: 30000,
    image_url: '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg',
    images: [
      '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg',
      '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'
    ],
    tag: 'Favorit Doa & Pengajian',
    is_available: true
  },
  {
    id: 'menu-amala-03',
    name: 'Nasi Box Rendang Sapi Rempah Minang',
    category: 'nasi_box',
    description: 'Daging sapi empuk dimasak perlahan santan kental kelapa sangrai, gulai daun singkong muda, sambal ijo teri medan, telur dadar tebal, kerupuk, dan nasi putih hangat.',
    price: 38000,
    image_url: '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
    images: [
      '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
      '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg'
    ],
    tag: 'Daging Pilihan',
    is_available: true
  },
  {
    id: 'menu-amala-04',
    name: 'Nasi Kotak Ayam Lodho Khas Jawa Timur',
    category: 'nasi_box',
    description: 'Ayam panggang kuah santan kental rempah pedas gurih kelapa bakar, urap-urap sayur kelapa parut sangrai, telur asin masir separuh, dan rempeyek renyah.',
    price: 32000,
    image_url: '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg',
    images: [
      '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg',
      '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'
    ],
    tag: 'Khas Jawa Timuran',
    is_available: true
  },

  // --- KATEGORI 2: TUMPENG TRADISIONAL ---
  {
    id: 'menu-amala-05',
    name: 'Tumpeng Kuning Komplit Tampah 20 Pax',
    category: 'tumpeng',
    description: 'Nasi kuning wangi gurih kelapa asli, ayam goreng lengkuas rempah, perkedel kentang lembut, sambal goreng kentang ati ampela, telur rawis, serundeng, & hiasan ukir sayur bunga estetik.',
    price: 550000,
    image_url: '/src/assets/images/tumpeng_hias_tampah_1792341601967.jpg',
    images: [
      '/src/assets/images/tumpeng_hias_tampah_1792341601967.jpg',
      '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg'
    ],
    tag: 'Signature Acara',
    is_available: true
  },
  {
    id: 'menu-amala-06',
    name: 'Tumpeng Tampah Tradisional 15 Pax',
    category: 'tumpeng',
    description: 'Tumpeng kerucut kuning pulen ukuran medium, lengkap dengan ayam suwir pedas manis, telur balado separuh, perkedel, mi goreng kampung, serundeng gurih, dan hiasan janur pisang.',
    price: 450000,
    image_url: '/src/assets/images/tumpeng_hias_tampah_1792341601967.jpg',
    images: [
      '/src/assets/images/tumpeng_hias_tampah_1792341601967.jpg',
      '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg'
    ],
    tag: 'Ukuran Sedang',
    is_available: true
  },
  {
    id: 'menu-amala-07',
    name: 'Tumpeng Mini (Tumini) Eksklusif Mika',
    category: 'tumpeng',
    description: 'Tumpeng personal estetik kemasan mika bulat kancing emas, lengkap dengan ayam suwir bali, orek tempe, mi goreng sayur, serundeng kelapa, & sambal matah harum.',
    price: 35000,
    image_url: '/src/assets/images/tumpeng_hias_tampah_1792341601967.jpg',
    images: [
      '/src/assets/images/tumpeng_hias_tampah_1792341601967.jpg',
      '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg'
    ],
    tag: 'Kemasan Personal VIP',
    is_available: true
  },

  // --- KATEGORI 3: SNACK BOX & CAKE ---
  {
    id: 'menu-amala-08',
    name: 'Snack Box Tradisional Manis & Gurih (3 Macam)',
    category: 'snack_box',
    description: 'Lemper bakar ketan pulen isi ayam suwir gurih, pastel ragout ayam wortel renyah, kue basah lembut pasar tradisional, dan air mineral cup.',
    price: 16000,
    image_url: '/src/assets/images/snack_box_tradisional_1792341600946.jpg',
    images: [
      '/src/assets/images/snack_box_tradisional_1792341600946.jpg'
    ],
    tag: 'Pilihan Rapat Kantor',
    is_available: true
  },
  {
    id: 'menu-amala-09',
    name: 'Snack Box Deluxe Rapat & Seminar (4 Macam)',
    category: 'snack_box',
    description: 'Kue lumpur kentang kismis lumer, risoles smoked beef mayo keju cheddar leleh, pie buah mini segar, brownies kukus cokelat premium, dan air mineral cup.',
    price: 18500,
    image_url: '/src/assets/images/snack_box_tradisional_1792341600946.jpg',
    images: [
      '/src/assets/images/snack_box_tradisional_1792341600946.jpg'
    ],
    tag: 'Paket Komplit Acara',
    is_available: true
  },

  // --- KATEGORI 4: PUDING & DESSERT SEGAR ---
  {
    id: 'menu-amala-10',
    name: 'Puding Buah Segar Kaca & Vla Vanila',
    category: 'puding_dessert',
    description: 'Puding lapis leci dan stroberi dengan potongan buah asli segar, disajikan dingin dengan siraman vla vanila lembut aromatik.',
    price: 8500,
    image_url: '/src/assets/images/puding_buah_kaca_1792341616046.jpg',
    images: [
      '/src/assets/images/puding_buah_kaca_1792341616046.jpg'
    ],
    tag: 'Pencuci Mulut Dingin',
    is_available: true
  },
  {
    id: 'menu-amala-11',
    name: 'Puding Lumut Pandan Gula Aren & Kelapa Muda',
    category: 'puding_dessert',
    description: 'Puding lumut hijau daun pandan suji berpadu puding gula aren legit dan serutan kelapa muda gurih dingin dalam cup praktis.',
    price: 9500,
    image_url: '/src/assets/images/puding_buah_kaca_1792341616046.jpg',
    images: [
      '/src/assets/images/puding_buah_kaca_1792341616046.jpg'
    ],
    tag: 'Pandan Suji Asli',
    is_available: true
  },
  {
    id: 'menu-amala-12',
    name: 'Puding Cokelat Belgia Lapis Susu',
    category: 'puding_dessert',
    description: 'Puding cokelat pekat lembut berpadu lapisan susu murni gurih, disajikan dingin bersama vla cokelat vanila nikmat.',
    price: 9000,
    image_url: '/src/assets/images/puding_buah_kaca_1792341616046.jpg',
    images: [
      '/src/assets/images/puding_buah_kaca_1792341616046.jpg'
    ],
    tag: 'Favorit Anak & Dewasa',
    is_available: true
  }
];

export const INITIAL_REQUESTS: CateringRequest[] = [
  {
    id: '8942-dewi-sartika',
    name: 'Ibu Dewi Sartika',
    phone: '6281234567890',
    event_type: 'Syukuran Khitanan Ananda Rayyan',
    event_date: '2026-10-28',
    portions: 60,
    budget: 'Rp 30.000 /pax',
    location: 'Lowokwaru, Kota Malang',
    notes: 'Mohon sambal tidak terlalu pedas karena banyak anak kecil yang hadir.',
    owner_notes: 'Menu dikurasi khusus dengan lauk bumbu madu gurih ramah anak dan snack pembuka pengajian.',
    status: 'Menu Dikirim',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    menus: [
      {
        id: 'rm-01',
        request_id: '8942-dewi-sartika',
        menu_id: 'menu-amala-01',
        custom_price: 28000,
        note: 'Menu utama favorit: porsi kenyang & lauk ayam bakar madu',
        is_default_selected: true,
        menu: INITIAL_MENUS[0]
      },
      {
        id: 'rm-02',
        request_id: '8942-dewi-sartika',
        menu_id: 'menu-amala-08',
        custom_price: 16000,
        note: 'Snack box disajikan saat pembukaan doa bersama',
        is_default_selected: true,
        menu: INITIAL_MENUS[7]
      }
    ]
  },
  {
    id: '5533-dr-amanda',
    name: 'dr. Amanda & Keluarga',
    phone: '6281333444555',
    event_type: 'Syukuran Rumah Baru & Akreditasi RS',
    event_date: '2026-10-24',
    portions: 40,
    budget: 'Rp 45.000 /pax',
    location: 'Sengkaling, Kabupaten Malang',
    notes: 'Tumpeng tampah besar dipotong pukul 11.30 WIB siang.',
    status: 'DP Dibayar',
    payment_status: 'dp_paid',
    total_price: 2200000,
    dp_amount: 1100000,
    remaining_amount: 1100000,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    payment_proofs: [
      {
        id: 'proof-001',
        stage: 'dp',
        amount: 1100000,
        sender_bank: 'BCA',
        sender_name: 'dr. Amanda Setiawan',
        receipt_image: '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg',
        receipt_filename: 'bukti_transfer_dp_bca.jpg',
        notes: 'Transfer m-BCA DP 50% untuk kunci jadwal syukuran',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        status: 'verified',
        verified_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ],
    menus: [
      {
        id: 'rm-03',
        request_id: '5533-dr-amanda',
        menu_id: 'menu-amala-05',
        custom_price: 550000,
        note: 'Tumpeng tampah 20 pax (2 tampah)',
        is_default_selected: true,
        menu: INITIAL_MENUS[4]
      }
    ]
  },
  {
    id: '7721-bappeda-malang',
    name: 'Bpk. Kurniawan (Bappeda)',
    phone: '6285233119988',
    event_type: 'Rapat Koordinasi Wilayah',
    event_date: '2026-11-04',
    portions: 100,
    budget: 'Rp 28.000 /pax',
    location: 'Balaikota Malang',
    notes: 'Nasi kotak praktis rapi dengan air mineral cup dan buah pisang.',
    owner_notes: 'Disiapkan tepat waktu sebelum jam 11.45 WIB.',
    status: 'Baru',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    menus: [
      {
        id: 'rm-04',
        request_id: '7721-bappeda-malang',
        menu_id: 'menu-amala-01',
        custom_price: 28000,
        note: 'Paket Nasi Kotak Rapat Eksekutif',
        is_default_selected: true,
        menu: INITIAL_MENUS[0]
      }
    ]
  },
  {
    id: '6120-kel-h-sudirman',
    name: 'Keluarga Besar H. Sudirman',
    phone: '6281298765432',
    event_type: 'Akad & Syukuran Pernikahan Adat Jawa',
    event_date: '2026-10-12',
    portions: 250,
    budget: 'Rp 35.000 /pax',
    location: 'Gedung Kartini, Klojen, Kota Malang',
    notes: 'Penyajian tepat waktu jam 10.00 WIB pagi, mohon box dipacking pita gold sesuai tema.',
    owner_notes: 'Pesanan telah terlaksana dengan sukses dan ulasan bintang 5 dari keluarga pengantin.',
    status: 'Selesai',
    payment_status: 'fully_paid',
    total_price: 8750000,
    dp_amount: 4375000,
    remaining_amount: 0,
    created_at: new Date(Date.now() - 12 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
    payment_proofs: [
      {
        id: 'proof-sudirman-dp',
        stage: 'dp',
        amount: 4375000,
        sender_bank: 'BCA',
        sender_name: 'H. Sudirman',
        receipt_image: '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg',
        receipt_filename: 'bukti_transfer_dp_sudirman.jpg',
        notes: 'DP 50% untuk penguncian tanggal gedung',
        created_at: new Date(Date.now() - 11 * 86400 * 1000).toISOString(),
        status: 'verified',
        verified_at: new Date(Date.now() - 11 * 86400 * 1000).toISOString()
      },
      {
        id: 'proof-sudirman-pelunasan',
        stage: 'pelunasan',
        amount: 4375000,
        sender_bank: 'BCA',
        sender_name: 'H. Sudirman',
        receipt_image: '/src/assets/images/hero_catering_tumpeng_1792341599451.jpg',
        receipt_filename: 'bukti_pelunasan_sudirman.jpg',
        notes: 'Pelunasan H-2 sebelum acara pernikahan',
        created_at: new Date(Date.now() - 8 * 86400 * 1000).toISOString(),
        status: 'verified',
        verified_at: new Date(Date.now() - 8 * 86400 * 1000).toISOString()
      }
    ],
    menus: [
      {
        id: 'rm-05',
        request_id: '6120-kel-h-sudirman',
        menu_id: 'menu-amala-02',
        custom_price: 32000,
        note: 'Nasi Box Rendang Daging Sapi Padang & Sambal Ijo',
        is_default_selected: true,
        menu: INITIAL_MENUS[1]
      }
    ]
  },
  {
    id: '4319-pt-jaya-abadi',
    name: 'PT. Jaya Abadi Sentosa (Ibu Maya)',
    phone: '6281700223344',
    event_type: 'Annual Gathering & Townhall Perusahaan',
    event_date: '2026-10-18',
    portions: 120,
    budget: 'Rp 40.000 /pax',
    location: 'Hotel Santika Premiere Malang',
    notes: 'Kombinasi nasi box ayam bakar dan snack box coffee break sore.',
    owner_notes: 'Pengiriman batch 1 jam 11.30 untuk makan siang, batch 2 snack jam 15.00 WIB.',
    status: 'Lunas',
    payment_status: 'fully_paid',
    total_price: 4800000,
    dp_amount: 2400000,
    remaining_amount: 0,
    created_at: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    payment_proofs: [
      {
        id: 'proof-pt-dp',
        stage: 'dp',
        amount: 2400000,
        sender_bank: 'Mandiri',
        sender_name: 'PT JAYA ABADI SENTOSA',
        receipt_image: '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
        receipt_filename: 'po_dp_mandiri_transfer.jpg',
        notes: 'Transfer invoice DP 50%',
        created_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
        status: 'verified',
        verified_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
      },
      {
        id: 'proof-pt-pelunasan',
        stage: 'pelunasan',
        amount: 2400000,
        sender_bank: 'Mandiri',
        sender_name: 'PT JAYA ABADI SENTOSA',
        receipt_image: '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
        receipt_filename: 'po_pelunasan_mandiri.jpg',
        notes: 'Pelunasan transfer corporate',
        created_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
        status: 'verified',
        verified_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString()
      }
    ],
    menus: [
      {
        id: 'rm-06',
        request_id: '4319-pt-jaya-abadi',
        menu_id: 'menu-amala-01',
        custom_price: 28000,
        note: 'Nasi Box Ayam Bakar Madu',
        is_default_selected: true,
        menu: INITIAL_MENUS[0]
      },
      {
        id: 'rm-07',
        request_id: '4319-pt-jaya-abadi',
        menu_id: 'menu-amala-08',
        custom_price: 12000,
        note: 'Snack Box Tradisional 3 Macam',
        is_default_selected: true,
        menu: INITIAL_MENUS[7]
      }
    ]
  },
  {
    id: '3205-ibu-ratna',
    name: 'Ibu Ratna & Bpk. Dimas',
    phone: '6287899112233',
    event_type: 'Tasyakuran & Akikah Putri Pertama',
    event_date: '2026-10-05',
    portions: 70,
    budget: 'Rp 32.000 /pax',
    location: 'Perum Permata Jingga, Kota Malang',
    notes: 'Kirim pagi jam 08.00 WIB untuk dibagikan ke tetangga dan santri panti asuhan.',
    owner_notes: 'Selesai tepat waktu. Box sudah diberi kartu ucapan doa akikah.',
    status: 'Selesai',
    payment_status: 'fully_paid',
    total_price: 2240000,
    dp_amount: 1120000,
    remaining_amount: 0,
    created_at: new Date(Date.now() - 18 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    payment_proofs: [
      {
        id: 'proof-ratna-full',
        stage: 'pelunasan',
        amount: 2240000,
        sender_bank: 'BCA',
        sender_name: 'Ratna Wulandari',
        receipt_image: '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
        receipt_filename: 'transfer_bca_ratna_akikah.jpg',
        notes: 'Pembayaran lunas langsung di awal',
        created_at: new Date(Date.now() - 17 * 86400 * 1000).toISOString(),
        status: 'verified',
        verified_at: new Date(Date.now() - 17 * 86400 * 1000).toISOString()
      }
    ],
    menus: [
      {
        id: 'rm-08',
        request_id: '3205-ibu-ratna',
        menu_id: 'menu-amala-03',
        custom_price: 32000,
        note: 'Nasi Box Ayam Goreng Lengkuas Rempah',
        is_default_selected: true,
        menu: INITIAL_MENUS[2]
      }
    ]
  }
];
