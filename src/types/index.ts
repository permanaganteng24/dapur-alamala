export type MenuCategory = 
  | 'nasi_box' 
  | 'tumpeng' 
  | 'snack_box' 
  | 'puding_dessert';

export interface Menu {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  price: number;
  image_url: string;
  images?: string[];
  tag?: string;
  is_available: boolean;
  created_at?: string;
}

export type RequestStatus = 'Baru' | 'Menu Dikirim' | 'Dipesan' | 'DP Dibayar' | 'Lunas' | 'Selesai';
export type PaymentStage = 'dp' | 'pelunasan';
export type PaymentStatus = 'unpaid' | 'dp_paid' | 'fully_paid';

export interface PaymentProof {
  id: string;
  stage: PaymentStage;
  amount: number;
  sender_bank?: string;
  sender_name?: string;
  receipt_image: string;
  receipt_filename?: string;
  notes?: string;
  created_at: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  verified_at?: string;
  idempotency_key?: string;
}

export interface CateringRequest {
  id: string;
  name: string;
  phone: string;
  event_type: string;
  event_date: string;
  portions: number;
  budget?: string;
  location?: string;
  notes?: string;
  owner_notes?: string;
  status: RequestStatus;
  created_at: string;
  updated_at?: string;
  menus?: RequestMenuItem[];
  payment_status?: PaymentStatus;
  payment_proofs?: PaymentProof[];
  total_price?: number;
  dp_amount?: number;
  remaining_amount?: number;
  idempotency_key?: string;
}

export interface RequestMenuItem {
  id: string;
  request_id: string;
  menu_id: string;
  custom_price?: number;
  note?: string;
  is_default_selected?: boolean;
  menu?: Menu;
}

export interface NewRequestPayload {
  name: string;
  phone: string;
  event_type: string;
  event_date: string;
  portions: number;
  budget?: string;
  location?: string;
  notes?: string;
  idempotency_key?: string;
  menus?: RequestMenuItem[];
  total_price?: number;
  dp_amount?: number;
  remaining_amount?: number;
}
