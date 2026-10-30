import { orderRepository } from '../repositories/OrderRepository';
import { IOrderRepository } from '../repositories/IOrderRepository';
import { CateringRequest, NewRequestPayload, RequestStatus, PaymentProof, PaymentStage } from '../types';
import { cleanPhoneNumber, formatRupiah } from '../lib/formatters';
import { OrderModel } from '../domain/Order';

export class OrderService {
  constructor(private repo: IOrderRepository = orderRepository) {}

  async getAllOrders(): Promise<CateringRequest[]> {
    return this.repo.getAll();
  }

  async getOrderById(id: string): Promise<CateringRequest | null> {
    return this.repo.getById(id);
  }

  async createOrder(payload: NewRequestPayload, unitPrice: number = 28000): Promise<CateringRequest> {
    const portions = Math.max(10, Number(payload.portions) || 10);
    const newId = crypto.randomUUID ? crypto.randomUUID() : 'ord-' + Date.now();

    const orderModel = new OrderModel({
      id: newId,
      name: payload.name.trim(),
      phone: cleanPhoneNumber(payload.phone),
      eventType: payload.event_type,
      eventDate: payload.event_date,
      portions,
      location: payload.location?.trim() || 'Sengkaling, Malang',
      notes: payload.notes?.trim() || '',
      unitPrice,
      status: 'Baru'
    });

    const created = await this.repo.create(orderModel.toJSON() as CateringRequest);
    return created;
  }

  async updateOrderStatus(id: string, status: RequestStatus, ownerNotes?: string): Promise<void> {
    await this.repo.updateStatus(id, status, ownerNotes);
  }

  async submitPayment(
    orderId: string, 
    proofData: {
      stage: PaymentStage;
      amount: number;
      sender_bank?: string;
      sender_name?: string;
      receipt_image: string;
      receipt_filename?: string;
      notes?: string;
    }
  ): Promise<CateringRequest> {
    const newProof: PaymentProof = {
      id: 'proof-' + Date.now(),
      stage: proofData.stage,
      amount: proofData.amount,
      sender_bank: proofData.sender_bank || 'BCA',
      sender_name: proofData.sender_name || 'Pelanggan',
      receipt_image: proofData.receipt_image,
      receipt_filename: proofData.receipt_filename || 'struk_transfer.jpg',
      notes: proofData.notes || '',
      created_at: new Date().toISOString(),
      status: 'pending_verification'
    };

    return this.repo.addPaymentProof(orderId, newProof);
  }

  async verifyPayment(orderId: string, proofId: string, isVerified: boolean): Promise<void> {
    await this.repo.verifyPaymentProof(orderId, proofId, isVerified);
  }

  calculatePricing(portions: number, unitPrice: number, isTumpengBig: boolean = false) {
    const total = isTumpengBig 
      ? unitPrice * Math.max(1, Math.round(portions / 20))
      : unitPrice * portions;
    const dp = total * 0.5;
    const remaining = total - dp;

    return {
      total,
      dp,
      remaining,
      formattedTotal: formatRupiah(total),
      formattedDp: formatRupiah(dp),
      formattedRemaining: formatRupiah(remaining)
    };
  }
}

export const orderService = new OrderService();
