import { RequestStatus, PaymentStatus, PaymentProof, RequestMenuItem } from '../types';
import { formatRupiah } from '../lib/formatters';

export class OrderModel {
  public id: string;
  public name: string;
  public phone: string;
  public eventType: string;
  public eventDate: string;
  public portions: number;
  public location: string;
  public notes: string;
  public ownerNotes?: string;
  public status: RequestStatus;
  public paymentStatus: PaymentStatus;
  public paymentProofs: PaymentProof[];
  public unitPrice: number;
  public isTumpengBig: boolean;
  public createdAt: string;
  public updatedAt?: string;
  public menus: RequestMenuItem[];

  constructor(data: {
    id: string;
    name: string;
    phone: string;
    event_type?: string;
    eventType?: string;
    event_date?: string;
    eventDate?: string;
    portions: number;
    location?: string;
    notes?: string;
    owner_notes?: string;
    ownerNotes?: string;
    status?: RequestStatus;
    payment_status?: PaymentStatus;
    paymentStatus?: PaymentStatus;
    payment_proofs?: PaymentProof[];
    paymentProofs?: PaymentProof[];
    unitPrice?: number;
    isTumpengBig?: boolean;
    created_at?: string;
    updated_at?: string;
    menus?: RequestMenuItem[];
  }) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
    this.eventType = data.eventType || data.event_type || 'Syukuran Keluarga';
    this.eventDate = data.eventDate || data.event_date || new Date().toISOString().split('T')[0];
    this.portions = Math.max(10, Number(data.portions) || 10);
    this.location = data.location || 'Sengkaling, Malang';
    this.notes = data.notes || '';
    this.ownerNotes = data.ownerNotes || data.owner_notes;
    this.status = data.status || 'Baru';
    this.paymentStatus = data.paymentStatus || data.payment_status || 'unpaid';
    this.paymentProofs = data.paymentProofs || data.payment_proofs || [];
    this.unitPrice = data.unitPrice || 28000;
    this.isTumpengBig = Boolean(data.isTumpengBig);
    this.createdAt = data.created_at || new Date().toISOString();
    this.updatedAt = data.updated_at;
    this.menus = data.menus || [];
  }

  get totalAmount(): number {
    if (this.menus && this.menus.length > 0) {
      let sumPerPax = 0;
      this.menus.forEach(m => {
        if (m.is_default_selected !== false) {
          sumPerPax += (m.custom_price || m.menu?.price || 0);
        }
      });
      return sumPerPax * this.portions;
    }
    if (this.isTumpengBig) {
      return this.unitPrice * Math.max(1, Math.round(this.portions / 20));
    }
    return this.unitPrice * this.portions;
  }

  get dpAmount(): number {
    return this.totalAmount * 0.5;
  }

  get remainingAmount(): number {
    return this.totalAmount - this.dpAmount;
  }

  get formattedTotal(): string {
    return formatRupiah(this.totalAmount);
  }

  get formattedDp(): string {
    return formatRupiah(this.dpAmount);
  }

  get isDpPaid(): boolean {
    return this.status === 'DP Dibayar' || this.paymentStatus === 'dp_paid' || this.paymentStatus === 'fully_paid';
  }

  get isFullyPaid(): boolean {
    return this.status === 'Lunas' || this.paymentStatus === 'fully_paid';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      event_type: this.eventType,
      event_date: this.eventDate,
      portions: this.portions,
      location: this.location,
      notes: this.notes,
      owner_notes: this.ownerNotes,
      status: this.status,
      payment_status: this.paymentStatus,
      payment_proofs: this.paymentProofs,
      total_price: this.totalAmount,
      dp_amount: this.dpAmount,
      remaining_amount: this.remainingAmount,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      menus: this.menus
    };
  }
}
