export interface OrderValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class OrderValidator {
  static validate(data: {
    customerName: string;
    customerPhone: string;
    eventDate: string;
    portions: number;
    address?: string;
  }): OrderValidationResult {
    const errors: Record<string, string> = {};

    if (!data.customerName || data.customerName.trim().length < 2) {
      errors.customerName = 'Nama pemesan wajib diisi (minimal 2 karakter).';
    }

    const cleanPhone = (data.customerPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 14) {
      errors.customerPhone = 'Nomor WhatsApp tidak valid (contoh: 081234567890).';
    }

    if (!data.eventDate) {
      errors.eventDate = 'Tanggal acara wajib dipilih.';
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      if (data.eventDate < todayStr) {
        errors.eventDate = 'Tanggal acara tidak boleh di masa lampau.';
      }
    }

    if (!data.portions || data.portions < 10) {
      errors.portions = 'Minimal pemesanan adalah 10 porsi (pax).';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
