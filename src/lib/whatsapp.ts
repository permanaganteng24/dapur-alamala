import { CateringRequest, Menu, PaymentProof, PaymentStage } from '../types';
import { formatRupiah, cleanPhoneNumber } from './formatters';
import { OWNER_WHATSAPP_NUMBER, PAYMENT_BANK_DETAILS } from '../constants';

export function buildDirectOrderWhatsAppUrl(params: {
  customerName: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  portions: number;
  location: string;
  notes?: string;
  menu: Menu;
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
  paymentOption: 'paid_dp_now' | 'pay_later';
  senderBank?: string;
  senderName?: string;
  requestId: string;
}): string {
  const menuPriceStr = formatRupiah(params.menu.price);
  const totalStr = formatRupiah(params.totalAmount);
  const dpStr = formatRupiah(params.dpAmount);
  const remainingStr = formatRupiah(params.remainingAmount);

  let text = '';
  if (params.paymentOption === 'paid_dp_now') {
    text = `*PESANAN CATERING & KONFIRMASI PEMBAYARAN DP*
Dapur Alamala - Puding, Cake & Catering Malang (No: #${params.requestId.slice(0, 8)})

Halo Bu Alamala, saya *${params.customerName.trim()}* ingin mengonfirmasi pesanan catering dan sudah mentransfer DP 50%:

*Rincian Acara:*
· Menu: *${params.menu.name}*
· Jumlah Porsi: *${params.portions} Pax* (${menuPriceStr}/porsi)
· Jenis Acara: ${params.eventType}
· Tanggal Acara: *${params.eventDate}*
· Alamat Kirim: ${params.location || 'Malang'}
${params.notes ? `· Catatan Khusus: "${params.notes}"\n` : ''}
*Rincian Tagihan:*
· Total Pesanan: *${totalStr}*
· Transfer DP 50%: *${dpStr}* (SUDAH DITRANSFER)
· Pengirim: ${params.senderBank || 'BCA'} a.n. ${params.senderName || params.customerName}
· Rekening Tujuan: BCA ${PAYMENT_BANK_DETAILS.accountNumber} a.n. ${PAYMENT_BANK_DETAILS.accountHolder}
· Sisa Pelunasan: *${remainingStr}* (saat pengantaran/H-1)

Foto bukti transfer telah saya siapkan di chat ini. Mohon jadwalnya dikunci ya Bu. Terima kasih!`;
  } else {
    text = `*PEMESANAN CATERING & BOOKING JADWAL*
Dapur Alamala - Puding, Cake & Catering Malang (No: #${params.requestId.slice(0, 8)})

Halo Dapur Alamala, saya *${params.customerName.trim()}* ingin booking jadwal pesanan catering:

*Rincian Acara:*
· Menu: *${params.menu.name}*
· Jumlah Porsi: *${params.portions} Pax* (${menuPriceStr}/porsi)
· Jenis Acara: ${params.eventType}
· Tanggal Acara: *${params.eventDate}*
· Alamat Kirim: ${params.location || 'Malang'}
${params.notes ? `· Catatan Khusus: "${params.notes}"\n` : ''}
*Estimasi Total:*
· Total Tagihan: *${totalStr}*
· Wajib DP 50%: *${dpStr}*
· Sisa Pelunasan: *${remainingStr}*

*Rekening Pembayaran DP 50%:*
· Bank: *${PAYMENT_BANK_DETAILS.bankName}*
· No. Rekening: *${PAYMENT_BANK_DETAILS.accountNumber}*
· Atas Nama: *${PAYMENT_BANK_DETAILS.accountHolder}*

Saya akan segera transfer DP 50% untuk mengunci jadwal. Terima kasih!`;
  }

  return `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildClientOrderWhatsAppUrl(
  request: CateringRequest,
  selectedMenus: { menu: Menu; price: number }[],
  totalPricePerPax: number,
  grandTotal: number
): string {
  const menuLines = selectedMenus
    .map((item, i) => `${i + 1}. *${item.menu.name}* (${formatRupiah(item.price)}/pax)`)
    .join('\n');

  const dpAmount = grandTotal * 0.5;
  const remainingAmount = grandTotal - dpAmount;

  const text = `Halo Dapur Alamala, saya *${request.name}* mengonfirmasi menu pilihan dari proposal catering:

*Detail Acara:*
· Acara: ${request.event_type}
· Tanggal: ${request.event_date}
· Jumlah: ${request.portions} Pax
· Lokasi: ${request.location || 'Malang'}

*Menu Pilihan:*
${menuLines}

*Total Biaya & DP:*
· Harga per Pax: ${formatRupiah(totalPricePerPax)}
· Total (${request.portions} Pax): *${formatRupiah(grandTotal)}*
· Wajib DP 50%: *${formatRupiah(dpAmount)}*
· Sisa: ${formatRupiah(remainingAmount)}

*Rekening BCA Resmi:*
· ${PAYMENT_BANK_DETAILS.accountNumber} a.n. ${PAYMENT_BANK_DETAILS.accountHolder}

${request.notes ? `Catatan: "${request.notes}"\n` : ''}Tautan Proposal: ${window.location.origin}/#/menu/${request.id}

Mohon konfirmasi ketersediaan slotnya ya Bu Alamala. Terima kasih!`;

  return `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildOwnerFollowUpWhatsAppUrl(request: CateringRequest): string {
  const origin = typeof window !== 'undefined' && window.location?.origin 
    ? window.location.origin 
    : 'http://localhost:3000';
  const proposalUrl = `${origin}/#/menu/${request.id}`;
  const targetPhone = cleanPhoneNumber(request.phone);

  // Financial calculations
  let calculatedTotal = request.total_price || 0;
  if (!calculatedTotal && request.menus && request.menus.length > 0) {
    calculatedTotal = request.menus.reduce((sum, item) => {
      const unit = item.custom_price || item.menu?.price || 0;
      return sum + (unit * (request.portions || 1));
    }, 0);
  }
  if (!calculatedTotal) {
    calculatedTotal = (request.portions || 10) * 28000;
  }
  const calculatedDp = request.dp_amount || Math.round(calculatedTotal * 0.5);
  const calculatedRemaining = request.remaining_amount !== undefined 
    ? request.remaining_amount 
    : (request.payment_status === 'fully_paid' || request.status === 'Lunas' || request.status === 'Selesai' ? 0 : calculatedTotal - calculatedDp);

  const totalStr = formatRupiah(calculatedTotal);
  const dpStr = formatRupiah(calculatedDp);
  const remainingStr = formatRupiah(calculatedRemaining);

  let text = '';

  switch (request.status) {
    case 'Baru':
      text = `Halo Bapak/Ibu *${request.name}*, salam hangat dari Dapur Alamala Catering Malang! 🙏

Terima kasih banyak telah menghubungi kami terkait rencana pemesanan catering:
· Acara: *${request.event_type}* (${request.portions} Pax)
· Tanggal Acara: *${request.event_date || 'Dalam pembahasan'}*
· Lokasi Pengantaran: *${request.location || 'Wilayah Malang Raya'}*

Permintaan Bapak/Ibu sudah kami terima dan slot jadwal dapur saat ini masih tersedia. Apakah ada preferensi khusus mengenai menu hidangan, tingkat kepedasan, atau kemasan yang diinginkan?

Kami siap membantu menyiapkan paket hidangan lezat dan higienis untuk momen bahagia Bapak/Ibu. Terima kasih!`;
      break;

    case 'Menu Dikirim':
      text = `Halo Bapak/Ibu *${request.name}*, salam hangat dari Dapur Alamala Catering Malang! ✨

Kami ingin mengabarkan bahwa proposal menu kurasi untuk acara *${request.event_type}* (${request.portions} Pax) pada tanggal *${request.event_date}* sudah siap ditinjau:

📋 *Tautan Proposal & Pilihan Menu:*
${proposalUrl}

Bapak/Ibu dapat membuka tautan di atas untuk melihat rincian hidangan dan mencentang menu favorit. Bila ingin mengubah variasi lauk, snack, atau request khusus, kami siap menyesuaikannya.

Bila sudah cocok, silakan konfirmasi kepada kami agar slot tanggal acara dapat segera kami amankan. Terima kasih!`;
      break;

    case 'Dipesan':
      text = `Halo Bapak/Ibu *${request.name}*, salam hangat dari Dapur Alamala! 📋

Pesanan catering untuk acara *${request.event_type}* (${request.portions} Pax) pada tanggal *${request.event_date}* telah kami catat rapi dalam antrean konfirmasi.

*Rincian Tagihan & Penguncian Slot:*
· Estimasi Total: *${totalStr}*
· Uang Muka (DP 50%): *${dpStr}*
· Sisa Pelunasan: *${remainingStr}* (saat pengantaran / H-1)

*Rekening Resmi Pembayaran DP 50%:*
· Bank: *${PAYMENT_BANK_DETAILS.bankName}*
· No. Rekening: *${PAYMENT_BANK_DETAILS.accountNumber}*
· Atas Nama: *${PAYMENT_BANK_DETAILS.accountHolder}*

Tautan Nota/Proposal: ${proposalUrl}

Mohon konfirmasi jika DP 50% telah ditransfer agar tanggal acara Bapak/Ibu resmi kami kunci di kalender produksi dapur. Terima kasih banyak!`;
      break;

    case 'DP Dibayar':
      text = `Halo Bapak/Ibu *${request.name}*, salam hangat dari Dapur Alamala! 👨‍🍳✨

Kami mengonfirmasi bahwa pembayaran DP 50% sebesar *${dpStr}* untuk acara *${request.event_type}* (${request.portions} Pax) pada tanggal *${request.event_date}* telah kami terima dan *JADWAL ACARA TELAH RESMI DIKUNCI*.

*Detail Pengantaran:*
· Lokasi: *${request.location || 'Malang'}*
· Sisa Pelunasan: *${remainingStr}* (bisa dilunasi saat pengantaran / H-1)
${request.notes ? `· Catatan Khusus: "${request.notes}"\n` : ''}
Seluruh hidangan akan kami masak hangat menggunakan rempah nusantara segar pada hari H. Mohon konfirmasi kembali jam tiba / jam penyajian yang diharapkan di lokasi acara ya Bu/Pak. Terima kasih!`;
      break;

    case 'Lunas':
      text = `Halo Bapak/Ibu *${request.name}*, salam hangat dari Dapur Alamala! 🥘🎉

Status pesanan catering untuk acara *${request.event_type}* (${request.portions} Pax) pada tanggal *${request.event_date}* telah *LUNAS 100%*.

*Detail Pesanan Siap Kirim:*
· Total Pembayaran: *${totalStr} (Lunas)*
· Alamat Tujuan: *${request.location || 'Malang'}*
· Porsi: *${request.portions} Pax*

Tim Dapur Alamala siap memasak hangat dan mengantarkan pesanan tepat waktu ke lokasi acara. Jika ada kontak penerima cadangan di lokasi selain Bapak/Ibu, mohon diinfokan ya. Terima kasih banyak atas kepercayaannya!`;
      break;

    case 'Selesai':
      text = `Halo Bapak/Ibu *${request.name}*, salam hangat dari Dapur Alamala! 🌸🙏

Terima kasih banyak telah mempercayakan sajian hidangan acara *${request.event_type}* kepada Dapur Alamala Catering. Kami berharap seluruh keluarga dan para tamu berkenan menikmati hidangan yang kami sajikan.

Apabila Bapak/Ibu berkenan, kami sangat berterima kasih bila dapat membagikan ulasan atau testimoni singkat mengenai rasa masakan dan pelayanan kami.

Semoga acara Bapak/Ibu membawa banyak berkah dan kebahagiaan. Kami nantikan kesempatan untuk melayani kembali di acara berikutnya! Terima kasih banyak.`;
      break;

    default:
      text = `Halo Bapak/Ibu *${request.name}*, salam hangat dari Dapur Alamala Catering Malang!

Terkait pesanan catering untuk acara *${request.event_type}* (${request.portions} Pax) pada tanggal *${request.event_date}*, kami siap membantu segala kebutuhan sajian hidangan Anda.

Tautan Proposal: ${proposalUrl}

Silakan hubungi kami bila ada hal yang ingin ditanyakan atau disesuaikan. Terima kasih!`;
      break;
  }

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

export function buildPaymentProofWhatsAppUrl(params: {
  customerName: string;
  eventType?: string;
  eventDate?: string;
  portions?: number;
  stage: PaymentStage;
  amount: number;
  senderBank: string;
  senderName: string;
  notes?: string;
  requestId?: string;
}): string {
  const stageTitle = params.stage === 'dp' ? 'UANG MUKA (DP 50%)' : 'PELUNASAN PESANAN (100% LUNAS)';
  const text = `*KONFIRMASI BUKTI PEMBAYARAN - DAPUR ALAMALA*

Halo Ibu Alamala, saya *${params.customerName.trim()}* mengonfirmasi bahwa pembayaran telah ditransfer:

· Jenis: *${stageTitle}*
· Nominal: *${formatRupiah(params.amount)}*
· Pengirim: *${params.senderBank} a.n. ${params.senderName}*
· Tujuan: *BCA ${PAYMENT_BANK_DETAILS.accountNumber} a.n. ${PAYMENT_BANK_DETAILS.accountHolder}*
· Acara: ${params.eventType || 'Pemesanan Catering'} (${params.eventDate || '-'})
${params.requestId ? `· ID Pesanan: #${params.requestId.slice(0, 8)}\n` : ''}
Foto struk bukti transfer telah saya lampirkan di chat ini. Mohon verifikasinya ya. Terima kasih!`;

  return `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildPaymentReceiptAcknowledgmentWhatsAppUrl(
  request: CateringRequest,
  proof: PaymentProof
): string {
  const stageName = proof.stage === 'dp' ? 'UANG MUKA (DP 50%)' : 'PELUNASAN (LUNAS)';
  const text = `*TANDA TERIMA RESMI PEMBAYARAN - DAPUR ALAMALA CATERING*

Kepada Yth. Bapak/Ibu *${request.name}*,
Pembayaran Anda telah berhasil kami verifikasi:

· Status: *${stageName} TERVERIFIKASI*
· Nominal: *${formatRupiah(proof.amount)}*
· Pengirim: *${proof.sender_bank || 'BCA'} a.n. ${proof.sender_name || request.name}*
· Tanggal Verifikasi: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
· Referensi: #${proof.id}

*Jadwal Pesanan Terkunci:*
· Acara: ${request.event_type} (${request.portions} Pax)
· Tanggal Kirim: ${request.event_date}
· Lokasi: ${request.location || 'Malang'}

Jadwal Anda resmi terkunci di kalender Dapur Alamala. Kami akan menyiapkan sajian terbaik dan higienis untuk momen bahagia Anda!

Salam hangat,
*Ibu Alamala & Tim Dapur Alamala Malang*`;

  return `https://wa.me/${request.phone}?text=${encodeURIComponent(text)}`;
}

export function buildPaidInvoiceWhatsAppUrl(request: CateringRequest): string {
  const origin = typeof window !== 'undefined' && window.location?.origin 
    ? window.location.origin 
    : 'http://localhost:3000';
  const digitalInvoiceUrl = `${origin}/#/menu/${request.id}`;
  const targetPhone = cleanPhoneNumber(request.phone);

  // Financial calculations
  let calculatedTotal = request.total_price || 0;
  if (!calculatedTotal && request.menus && request.menus.length > 0) {
    calculatedTotal = request.menus.reduce((sum, item) => {
      const unit = item.custom_price || item.menu?.price || 0;
      return sum + (unit * (request.portions || 1));
    }, 0);
  }
  if (!calculatedTotal) {
    calculatedTotal = (request.portions || 10) * 28000;
  }
  const calculatedDp = request.dp_amount || Math.round(calculatedTotal * 0.5);

  const invoiceNumber = `INV/${new Date(request.created_at).getFullYear()}/AMALA/${request.id.slice(0, 8).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const text = `*INVOICE & KWITANSI LUNAS RESMI*
*DAPUR ALAMALA MALANG*
Perumahan Sengkaling Indah II Blok Kemuning III No. 8, Sengkaling, Dau, Malang
WhatsApp: 0878-7530-1729 · Rekening: BCA 8161234567 a.n. ALAMALA
--------------------------------------------------

Kepada Yth. Bapak/Ibu: *${request.name}*
No. WhatsApp: ${request.phone}
No. Dokumen: *${invoiceNumber}*
Tanggal: ${issueDate}

*STATUS PEMBAYARAN: LUNAS 100% (TERVERIFIKASI)* ✓

*Rincian Pesanan Catering:*
· Acara: *${request.event_type}*
· Tanggal Pengantaran: *${request.event_date || 'Sesuai Jadwal'}*
· Jumlah Porsi: *${request.portions} Pax / Box*
· Alamat Kirim: *${request.location || 'Wilayah Malang Raya'}*
${request.notes ? `· Catatan Khusus: "${request.notes}"\n` : ''}
*Rincian Finansial:*
· Total Tagihan: *${formatRupiah(calculatedTotal)}*
· Uang Muka (DP 50%): ${formatRupiah(calculatedDp)} (Lunas)
· Pelunasan: ${formatRupiah(calculatedTotal - calculatedDp)} (Lunas)
· Total Diterima: *${formatRupiah(calculatedTotal)} (100% LUNAS)*
· Sisa Tagihan: *Rp 0 (LUNAS)*
· Metode: Transfer Bank BCA 8161234567 a.n. ALAMALA

📄 *Tautan Invoice & Nota Digital:*
${digitalInvoiceUrl}

Terima kasih banyak atas pelunasan tagihan catering Dapur Alamala Malang. Seluruh pesanan telah masuk jadwal produksi dan akan kami masak hangat menggunakan bahan berkualitas prima serta diantar tepat waktu.

Salam hangat,
*Ibu Alamala & Tim Dapur Alamala Malang*`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}
