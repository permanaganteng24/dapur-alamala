import { CateringRequest, RequestStatus, PaymentProof } from '../types';

export interface IOrderRepository {
  getAll(): Promise<CateringRequest[]>;
  getById(id: string): Promise<CateringRequest | null>;
  create(order: CateringRequest): Promise<CateringRequest>;
  updateStatus(id: string, status: RequestStatus, ownerNotes?: string): Promise<void>;
  addPaymentProof(orderId: string, proof: PaymentProof): Promise<CateringRequest>;
  verifyPaymentProof(orderId: string, proofId: string, isVerified: boolean): Promise<void>;
}
