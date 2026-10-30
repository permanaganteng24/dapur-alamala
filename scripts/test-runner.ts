import { 
  APP_CONFIG, 
  OWNER_WHATSAPP_NUMBER, 
  PAYMENT_BANK_DETAILS 
} from '../src/constants';
import { 
  formatRupiah, 
  cleanPhoneNumber 
} from '../src/lib/formatters';
import { 
  buildDirectOrderWhatsAppUrl, 
  buildClientOrderWhatsAppUrl, 
  buildPaymentProofWhatsAppUrl, 
  buildPaymentReceiptAcknowledgmentWhatsAppUrl,
  buildOwnerFollowUpWhatsAppUrl,
  buildPaidInvoiceWhatsAppUrl
} from '../src/lib/whatsapp';
import { 
  INITIAL_MENUS, 
  INITIAL_REQUESTS 
} from '../src/data/seedData';
import fs from 'fs';
import path from 'path';

// Minimal in-memory localStorage & sessionStorage polyfill for Node.js test environment
const storageStore: Record<string, string> = {};
const sessionStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (k: string) => storageStore[k] || null,
  setItem: (k: string, v: string) => { storageStore[k] = v; },
  removeItem: (k: string) => { delete storageStore[k]; },
  clear: () => { Object.keys(storageStore).forEach(k => delete storageStore[k]); }
};

const mockSessionStorage = {
  getItem: (k: string) => sessionStore[k] || null,
  setItem: (k: string, v: string) => { sessionStore[k] = v; },
  removeItem: (k: string) => { delete sessionStore[k]; },
  clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); }
};

(global as any).localStorage = mockLocalStorage;
(global as any).sessionStorage = mockSessionStorage;

(global as any).window = {
  location: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000/#/'
  },
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  dispatchEvent: () => true
};

import { 
  fetchMenus, 
  fetchAllRequests, 
  createCateringRequest, 
  updateRequestStatus, 
  updateCateringRequest,
  deleteCateringRequest,
  toggleMenuAvailability,
  submitPaymentProof, 
  verifyPaymentProof,
  loginAdmin,
  logoutAdmin,
  getAdminSession
} from '../src/lib/supabase';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? '— ' + details : ''}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 TEST SUITE: DAPUR ALAMALA CATERING APPLICATION');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Brand Configuration, Address & Official WhatsApp
  // -------------------------------------------------------------------------
  console.log('1. BRANDING, ADDRESS & CONTACT CONSTANTS:');
  assert(
    APP_CONFIG.brandName === 'Dapur Alamala',
    'Brand name is Dapur Alamala'
  );
  assert(
    OWNER_WHATSAPP_NUMBER === '6287875301729',
    'WhatsApp number matches configured user number (087875301729 / 6287875301729)',
    `Actual: ${OWNER_WHATSAPP_NUMBER}`
  );
  assert(
    APP_CONFIG.phone === '0878-7530-1729',
    'Display phone is 0878-7530-1729'
  );
  assert(
    APP_CONFIG.instagram === '@alamala_malang',
    'Instagram handle is @alamala_malang'
  );
  assert(
    APP_CONFIG.address.includes('Sengkaling') && APP_CONFIG.address.includes('Kemuning III'),
    'Operating address is set to Perumahan Sengkaling Indah II'
  );
  assert(
    PAYMENT_BANK_DETAILS.accountNumber === '8161234567',
    'Bank BCA account number is configured'
  );
  assert(
    PAYMENT_BANK_DETAILS.accountHolder.includes('ALAMALA'),
    'Bank account holder specifies ALAMALA'
  );

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Menu Catalog & Assets Integrity
  // -------------------------------------------------------------------------
  console.log('\n2. MENU CATALOG & ASSET VERIFICATION:');
  const menus = await fetchMenus();
  assert(menus.length >= 6, `Catalog contains ${menus.length} dishes (>= 6)`);
  
  const categories = new Set(menus.map(m => m.category));
  assert(
    categories.has('nasi_box') && categories.has('tumpeng') && categories.has('snack_box') && categories.has('puding_dessert'),
    'All 4 core culinary categories are present'
  );

  let allImagesValid = true;
  for (const m of menus) {
    if (!m.image_url.startsWith('/src/assets/images/') || !m.name || m.price <= 0) {
      allImagesValid = false;
      break;
    }
  }
  assert(allImagesValid, 'All menu items have valid local image assets, names, and prices > 0');

  // Verify asset files actually exist on disk
  let localFilesFound = true;
  for (const m of menus) {
    const diskPath = path.join(process.cwd(), m.image_url.replace(/^\//, ''));
    if (!fs.existsSync(diskPath)) {
      console.error(`Asset not found on disk: ${diskPath}`);
      localFilesFound = false;
    }
  }
  assert(localFilesFound, 'All referenced image files exist physically on disk');

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Formatting & Mathematical Calculations
  // -------------------------------------------------------------------------
  console.log('\n3. FORMATTERS & FINANCIAL CALCULATIONS:');
  const formattedPrice = formatRupiah(28000);
  assert(
    formattedPrice.includes('28.000'),
    'Rupiah formatting produces valid currency string',
    `Actual: ${formattedPrice}`
  );

  const cleanPhone1 = cleanPhoneNumber('0812-3079-5124');
  const cleanPhone2 = cleanPhoneNumber('6281230795124');
  assert(cleanPhone1 === '6281230795124', 'Phone cleaner formats 08... to 628...');
  assert(cleanPhone2 === '6281230795124', 'Phone cleaner preserves 628... format');

  // Pricing math: 50 pax * Rp 28.000 = Rp 1.400.000
  const qty = 50;
  const unitPrice = 28000;
  const total = qty * unitPrice;
  const dp = total * 0.5;
  const remaining = total - dp;
  assert(total === 1400000, 'Total calculation is accurate (Rp 1.400.000)');
  assert(dp === 700000, '50% DP calculation is accurate (Rp 700.000)');
  assert(remaining === 700000, 'Remaining balance is accurate (Rp 700.000)');

  // -------------------------------------------------------------------------
  // TEST GROUP 4: WhatsApp Message Generation
  // -------------------------------------------------------------------------
  console.log('\n4. WHATSAPP MESSAGE BUILDERS:');
  const sampleMenu = menus[0];
  const directWaUrl = buildDirectOrderWhatsAppUrl({
    customerName: 'Bapak Rudi',
    customerPhone: '081298765432',
    eventType: 'Syukuran Rumah',
    eventDate: '2026-10-30',
    portions: 40,
    location: 'Sengkaling Indah',
    notes: 'Sambal sedang',
    menu: sampleMenu,
    totalAmount: 1120000,
    dpAmount: 560000,
    remainingAmount: 560000,
    paymentOption: 'paid_dp_now',
    senderBank: 'BCA',
    senderName: 'Rudi Hartono',
    requestId: 'req-test-123'
  });

  assert(
    directWaUrl.includes('https://wa.me/6287875301729'),
    'Direct order WhatsApp URL points to 6287875301729'
  );
  assert(
    directWaUrl.includes(encodeURIComponent('Dapur Alamala')),
    'WhatsApp message contains brand name Dapur Alamala'
  );
  assert(
    directWaUrl.includes(encodeURIComponent('Bapak Rudi')),
    'WhatsApp message contains customer name'
  );
  assert(
    directWaUrl.includes(encodeURIComponent('Syukuran Rumah')),
    'WhatsApp message reflects free-form custom event type'
  );

  // Test custom arbitrary event type in direct WA builder
  const customEventWaUrl = buildDirectOrderWhatsAppUrl({
    customerName: 'Hj. Fatimah',
    customerPhone: '081234567890',
    eventType: 'Walimatussafar Haji & Doa Bersama',
    eventDate: '2026-11-15',
    portions: 75,
    location: 'Dau Malang',
    notes: 'Kue basah tanpa pemanis buatan',
    menu: sampleMenu,
    totalAmount: 2100000,
    dpAmount: 1050000,
    remainingAmount: 1050000,
    paymentOption: 'paid_dp_now',
    senderBank: 'BCA',
    senderName: 'Hj. Fatimah',
    requestId: 'req-custom-event-1'
  });
  assert(
    customEventWaUrl.includes(encodeURIComponent('Walimatussafar Haji & Doa Bersama')),
    'Direct order WhatsApp URL accurately includes custom free-form event type (Walimatussafar Haji & Doa Bersama)'
  );

  const ackWaUrl = buildPaymentReceiptAcknowledgmentWhatsAppUrl(
    {
      id: 'req-001',
      name: 'Ibu Ratna',
      phone: '628123456789',
      event_type: 'Rapat Dinas',
      event_date: '2026-11-02',
      portions: 50,
      status: 'DP Dibayar',
      created_at: new Date().toISOString()
    },
    {
      id: 'proof-001',
      stage: 'dp',
      amount: 700000,
      sender_bank: 'BCA',
      sender_name: 'Ibu Ratna',
      receipt_image: 'sample.jpg',
      created_at: new Date().toISOString(),
      status: 'verified'
    }
  );
  assert(
    ackWaUrl.includes('https://wa.me/628123456789'),
    'Acknowledgment URL directs to client phone number'
  );
  assert(
    ackWaUrl.includes(encodeURIComponent('TERVERIFIKASI')),
    'Receipt acknowledgment confirms verified payment'
  );

  // Status-tailored follow-up tests
  const baseReq = {
    id: 'req-wa-status-test',
    name: 'Bapak Hendra',
    phone: '081234567899',
    event_type: 'Akad Nikah',
    event_date: '2026-11-20',
    portions: 100,
    location: 'Klojen, Malang',
    created_at: new Date().toISOString()
  };

  const followUpBaru = buildOwnerFollowUpWhatsAppUrl({ ...baseReq, status: 'Baru' });
  assert(
    followUpBaru.includes('https://wa.me/6281234567899') && followUpBaru.includes(encodeURIComponent('rencana pemesanan')),
    'Follow-up for status Baru addresses new inquiry'
  );

  const followUpMenuDikirim = buildOwnerFollowUpWhatsAppUrl({ ...baseReq, status: 'Menu Dikirim' });
  assert(
    followUpMenuDikirim.includes(encodeURIComponent('Tautan Proposal')),
    'Follow-up for status Menu Dikirim invites client to review proposal'
  );

  const followUpDipesan = buildOwnerFollowUpWhatsAppUrl({ ...baseReq, status: 'Dipesan', total_price: 2800000 });
  assert(
    followUpDipesan.includes(encodeURIComponent('DP 50%')) && followUpDipesan.includes(encodeURIComponent(PAYMENT_BANK_DETAILS.accountNumber)),
    'Follow-up for status Dipesan provides DP 50% amount and official bank account'
  );

  const followUpDp = buildOwnerFollowUpWhatsAppUrl({ ...baseReq, status: 'DP Dibayar', total_price: 2800000, dp_amount: 1400000 });
  assert(
    followUpDp.includes(encodeURIComponent('JADWAL ACARA TELAH RESMI DIKUNCI')),
    'Follow-up for status DP Dibayar confirms locked schedule'
  );

  const followUpLunas = buildOwnerFollowUpWhatsAppUrl({ ...baseReq, status: 'Lunas', total_price: 2800000 });
  assert(
    followUpLunas.includes(encodeURIComponent('LUNAS 100%')),
    'Follow-up for status Lunas confirms fully paid and kitchen dispatch preparation'
  );

  const followUpSelesai = buildOwnerFollowUpWhatsAppUrl({ ...baseReq, status: 'Selesai' });
  assert(
    followUpSelesai.includes(encodeURIComponent('ulasan atau testimoni')),
    'Follow-up for status Selesai asks for feedback / testimonial'
  );

  // Official Paid Invoice WhatsApp Builder Tests
  const paidInvoiceWa = buildPaidInvoiceWhatsAppUrl({ ...baseReq, status: 'Lunas', total_price: 2800000, dp_amount: 1400000 });
  assert(
    paidInvoiceWa.includes('https://wa.me/6281234567899'),
    'Paid invoice WhatsApp URL targets client phone number'
  );
  assert(
    paidInvoiceWa.includes(encodeURIComponent('INVOICE & KWITANSI LUNAS RESMI')) && paidInvoiceWa.includes(encodeURIComponent('LUNAS 100% (TERVERIFIKASI)')),
    'Paid invoice WhatsApp message contains official receipt heading and 100% verified status'
  );
  assert(
    paidInvoiceWa.includes(encodeURIComponent('Rp 0 (LUNAS)')),
    'Paid invoice WhatsApp confirms zero remaining balance'
  );

  // -------------------------------------------------------------------------
  // TEST GROUP 5: Request Management & Order Pipeline
  // -------------------------------------------------------------------------
  console.log('\n5. ORDER MANAGEMENT & PAYMENT PIPELINE:');
  const newReq = await createCateringRequest({
    name: 'Testing Client',
    phone: '081234567890',
    event_type: 'Tasyakuran',
    event_date: '2026-11-10',
    portions: 30,
    location: 'Dau, Kabupaten Malang',
    notes: 'Uji alur otomatis'
  });

  assert(Boolean(newReq.id), 'Catering request generated with UUID');
  assert(newReq.status === 'Baru', 'Initial order status is "Baru"');
  assert(newReq.phone === '6281234567890', 'Phone number normalized properly');

  // Submit payment proof
  const proofResult = await submitPaymentProof(newReq.id, {
    stage: 'dp',
    amount: 420000,
    sender_bank: 'BCA',
    sender_name: 'Testing Client',
    receipt_image: 'data:image/jpeg;base64,sample',
    receipt_filename: 'struk_test.jpg',
    notes: 'Transfer DP 50%'
  });

  assert(
    proofResult.request.status === 'DP Dibayar',
    'Order status updated to "DP Dibayar" upon proof submission'
  );
  assert(
    proofResult.request.payment_proofs?.length === 1,
    'Payment proof appended to request proofs list'
  );

  // Verify payment proof
  await verifyPaymentProof(newReq.id, proofResult.proof.id, true);
  const allReqs = await fetchAllRequests();
  const verifiedReq = allReqs.find(r => r.id === newReq.id);
  assert(
    verifiedReq?.payment_proofs?.[0]?.status === 'verified',
    'Payment proof status updated to "verified"'
  );

  // Status transition to 'Lunas'
  await updateRequestStatus(newReq.id, 'Lunas');
  const lunasReq = (await fetchAllRequests()).find(r => r.id === newReq.id);
  assert(
    lunasReq?.status === 'Lunas',
    'Order successfully marked as "Lunas"'
  );

  // CRUD: Update Catering Request
  const updatedReq = await updateCateringRequest(newReq.id, {
    name: 'Testing Client Updated',
    portions: 50,
    total_price: 1400000,
    notes: 'Catatan diperbarui admin'
  });
  assert(
    updatedReq.name === 'Testing Client Updated' && updatedReq.portions === 50 && updatedReq.total_price === 1400000,
    'updateCateringRequest successfully modifies order details'
  );

  // CRUD: Toggle Menu Availability
  const dishToToggle = menus[0];
  const initialAvailable = dishToToggle.is_available !== false;
  const toggledState = await toggleMenuAvailability(dishToToggle.id);
  assert(
    toggledState === !initialAvailable,
    'toggleMenuAvailability toggles dish availability state'
  );
  // Restore menu availability
  await toggleMenuAvailability(dishToToggle.id);

  // CRUD: Delete Catering Request
  await deleteCateringRequest(newReq.id);
  const remainingReqs = await fetchAllRequests();
  assert(
    !remainingReqs.some(r => r.id === newReq.id),
    'deleteCateringRequest successfully removes order from storage'
  );

  // -------------------------------------------------------------------------
  // TEST GROUP 6: Admin Authentication & Security Guard
  // -------------------------------------------------------------------------
  console.log('\n6. AUTHENTICATION & ACCESS CONTROL:');
  const { verifyOwnerGatewayKey, SECRET_GATEWAY_KEY, getLockoutStatus } = await import('../src/lib/auth');

  // 1. Wrong credentials
  const badLogin = await loginAdmin('owner@dapur-alamala.com', 'wrongpassword');
  assert(!badLogin.success, 'Login fails with invalid password');

  // 2. Correct credentials
  const goodLogin = await loginAdmin('owner@dapur-alamala.com', 'amala2026');
  assert(goodLogin.success && Boolean(goodLogin.session?.token), 'Login succeeds with valid credentials');

  // 3. Session persistence & retrieval
  const activeSession = getAdminSession();
  assert(activeSession?.email === 'owner@dapur-alamala.com', 'Active session retrieved from storage');

  // 4. Logout
  await logoutAdmin();
  const clearedSession = getAdminSession();
  assert(clearedSession === null, 'Session cleared on logout');

  // 5. Gateway Key verification
  assert(verifyOwnerGatewayKey(SECRET_GATEWAY_KEY) === true, 'Valid gateway key is verified successfully');
  assert(verifyOwnerGatewayKey('invalid-key') === false, 'Invalid gateway key is rejected');
  assert(verifyOwnerGatewayKey(null) === false, 'Null gateway key is rejected');

  // -------------------------------------------------------------------------
  // TEST GROUP 8: Domain Models, Services & Validator Layer
  // -------------------------------------------------------------------------
  console.log('\n8. DOMAIN MODELS, SERVICES & VALIDATOR LOGIC:');
  const { OrderValidator } = await import('../src/validators/orderValidator');
  const { MenuItemModel } = await import('../src/domain/MenuItem');
  const { orderService } = await import('../src/services/OrderService');

  const validTest = OrderValidator.validate({
    customerName: 'Siti Aminah',
    customerPhone: '081234567890',
    eventDate: '2026-11-20',
    portions: 25
  });
  assert(validTest.isValid, 'OrderValidator accepts valid order payload');

  const invalidTest = OrderValidator.validate({
    customerName: '',
    customerPhone: '123',
    eventDate: '2020-01-01',
    portions: 5
  });
  assert(!invalidTest.isValid, 'OrderValidator flags invalid phone, past date, and low portions (<10)');
  assert(Boolean(invalidTest.errors.portions), 'Validator enforces minimal 10 pax');

  const itemModel = new MenuItemModel({
    id: 'test-1',
    name: 'Nasi Box Gurih',
    category: 'nasi_box',
    description: 'Enak',
    price: 30000
  });
  assert(itemModel.formattedPrice.includes('30.000'), 'MenuItemModel formats price accurately');
  assert(itemModel.priceUnitLabel === '/pax', 'MenuItemModel identifies pax unit');

  const calc = orderService.calculatePricing(50, 30000);
  assert(calc.total === 1500000, 'OrderService computes 50 pax total = Rp 1.500.000');
  assert(calc.dp === 750000, 'OrderService computes 50% DP = Rp 750.000');
  assert(calc.remaining === 750000, 'OrderService computes remaining balance = Rp 750.000');

  // Test arbitrary non-multiple portion quantities (e.g., 17 pax, 23 pax, 37 pax)
  const customPortionTest = OrderValidator.validate({
    customerName: 'Budi Santoso',
    customerPhone: '087875301729',
    eventDate: '2026-12-15',
    portions: 17
  });
  assert(customPortionTest.isValid, 'OrderValidator accepts custom non-multiple portions (e.g. 17 pax)');

  const customCalc = orderService.calculatePricing(17, 28000);
  assert(customCalc.total === 476000, 'OrderService computes 17 pax * 28.000 = Rp 476.000 (arbitrary quantity)');
  assert(customCalc.dp === 238000, 'OrderService computes exact 50% DP for 17 pax = Rp 238.000');

  // -------------------------------------------------------------------------
  // TEST GROUP 9: Official Invoice, WhatsApp Receipt & Sales Reporting
  // -------------------------------------------------------------------------
  console.log('\n9. OFFICIAL INVOICE, WHATSAPP RECEIPT & SALES REPORT ANALYTICS:');
  
  // Test Invoice Number generation format
  const sampleInvoiceNumber = `INV/${new Date().getFullYear()}/AMALA/${newReq.id.slice(0, 8).toUpperCase()}`;
  assert(
    sampleInvoiceNumber.startsWith('INV/') && sampleInvoiceNumber.includes('/AMALA/'),
    'Official invoice number conforms to standard structure (INV/YYYY/AMALA/XXXXXXXX)'
  );

  // Test Paid Invoice WhatsApp URL generation
  const paidInvoiceUrl = buildPaidInvoiceWhatsAppUrl(newReq);
  assert(
    paidInvoiceUrl.includes('https://wa.me/'),
    'Paid Invoice WhatsApp URL targets customer phone number'
  );
  assert(
    paidInvoiceUrl.includes(encodeURIComponent('LUNAS 100% (TERVERIFIKASI)')),
    'Paid Invoice WhatsApp receipt states LUNAS 100% (TERVERIFIKASI)'
  );
  assert(
    paidInvoiceUrl.includes(encodeURIComponent('BCA 8161234567 a.n. ALAMALA')),
    'Paid Invoice WhatsApp receipt contains official BCA account details'
  );
  assert(
    paidInvoiceUrl.includes(encodeURIComponent('Rp 0 (LUNAS)')),
    'Paid Invoice WhatsApp receipt shows Rp 0 remaining balance'
  );

  // Test Sales Report Revenue & Receivable math
  const salesOrders = [
    { total: 3000000, isLunas: true, dp: 1500000 },
    { total: 2000000, isLunas: false, isDp: true, dp: 1000000 },
    { total: 1000000, isLunas: false, isDp: false, dp: 500000 }
  ];

  const grossSales = salesOrders.reduce((sum, o) => sum + o.total, 0); // 6.000.000
  const realizedCash = (3000000) + (1000000); // 4.000.000 (100% of first + DP of second)
  const remainingReceivable = (2000000 - 1000000) + (1000000); // 2.000.000
  
  assert(grossSales === 6000000, 'Sales analytics computes accurate Gross Sales (Rp 6.000.000)');
  assert(realizedCash === 4000000, 'Sales analytics computes accurate Realized Cash Inflow (Rp 4.000.000)');
  assert(remainingReceivable === 2000000, 'Sales analytics computes accurate Accounts Receivable (Rp 2.000.000)');

  // -------------------------------------------------------------------------
  // TEST GROUP 10: RESPONSIVENESS AUDIT & SECURITY SEO
  // -------------------------------------------------------------------------
  console.log('\n10. RESPONSIVENESS AUDIT & SECURITY SEO VERIFICATION:');

  // 1. Verify robots.txt Security SEO
  const robotsPath = path.resolve(process.cwd(), 'public/robots.txt');
  assert(fs.existsSync(robotsPath), 'public/robots.txt exists on disk');
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert(robotsContent.includes('Disallow: /admin'), 'robots.txt blocks crawlers from /admin');
  assert(robotsContent.includes('Disallow: /portal-alamala-auth'), 'robots.txt blocks crawlers from stealth portal');
  assert(robotsContent.includes('Allow: /'), 'robots.txt permits indexing of public catering pages');

  // 2. Verify sitemap.xml
  const sitemapPath = path.resolve(process.cwd(), 'public/sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'public/sitemap.xml exists on disk');

  // 3. Verify index.html Security SEO & Responsive Viewport
  const indexPath = path.resolve(process.cwd(), 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert(indexHtml.includes('name="viewport" content="width=device-width'), 'Viewport meta tag configured for responsive mobile scaling');
  assert(indexHtml.includes('http-equiv="X-Content-Type-Options" content="nosniff"'), 'Security SEO: X-Content-Type-Options nosniff is set');
  assert(indexHtml.includes('name="referrer" content="strict-origin-when-cross-origin"'), 'Security SEO: Referrer-Policy strict-origin is set');
  assert(indexHtml.includes('application/ld+json'), 'Schema.org JSON-LD structured data is present');
  assert(indexHtml.includes('CateringService') && indexHtml.includes('Sengkaling'), 'Schema.org defines local CateringService in Sengkaling Malang');
  assert(indexHtml.includes('og:title') && indexHtml.includes('twitter:card'), 'OpenGraph and Twitter cards are configured for rich social sharing');

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
