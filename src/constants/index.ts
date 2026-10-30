export const PAYMENT_BANK_DETAILS = {
  bankName: 'Bank Central Asia (BCA)',
  accountNumber: '8161234567',
  accountHolder: 'DAPUR ALAMALA CATERING',
  dpPercentage: 50,
  minPax: 10,
  instruction: 'Pembayaran DP 50% melalui transfer BCA untuk mengunci slot tanggal acara & persiapan bahan segar.'
};

export const OWNER_WHATSAPP_NUMBER = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_NUMBER) ||
  '6287875301729'; // Nomor WhatsApp aktif pengguna: 087875301729

export const APP_CONFIG = {
  brandName: 'Dapur Alamala',
  tagline: 'Puding, Cake & Catering.',
  location: 'Sengkaling, Kabupaten Malang',
  address: 'Perumahan Sengkaling Indah II, Jl. Kemuning III Jl. Raya Sengkaling No.8, Malang Kabupaten, 65233, Jawa Timur, ID',
  phone: '0878-7530-1729',
  rawPhone: '087875301729',
  instagram: '@alamala_malang',
  minPax: 10,
  defaultDpPercentage: 50
};

export const STORAGE_KEYS = {
  MENUS: 'dapur_alamala_menus_v3',
  REQUESTS: 'dapur_alamala_requests_v3',
  AUTH: 'dapur_alamala_admin_session_v3',
  CUSTOM_PASSWORD: 'dapur_alamala_custom_password_v3',
  EVENT_BUS: 'dapur_alamala_realtime_channel'
};
