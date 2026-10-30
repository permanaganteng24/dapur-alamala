import { IOrderRepository } from './IOrderRepository';
import { CateringRequest, RequestStatus, PaymentProof } from '../types';
import { INITIAL_REQUESTS } from '../data/seedData';
import { STORAGE_KEYS } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export class OrderRepository implements IOrderRepository {
  private cache: CateringRequest[] | null = null;

  async getAll(): Promise<CateringRequest[]> {
    if (this.cache) return this.cache;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('requests')
          .select(`*, menus:request_menus(*, menu:menus(*))`)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          this.cache = data as CateringRequest[];
          return this.cache;
        }
      } catch {
        //
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
        if (raw) {
          this.cache = JSON.parse(raw);
          return this.cache || INITIAL_REQUESTS;
        }
      } catch {
        //
      }
    }

    this.cache = INITIAL_REQUESTS;
    return INITIAL_REQUESTS;
  }

  async getById(id: string): Promise<CateringRequest | null> {
    const list = await this.getAll();
    return list.find(r => r.id === id) || null;
  }

  async create(order: CateringRequest): Promise<CateringRequest> {
    const list = await this.getAll();
    const updated = [order, ...list];
    this.cache = updated;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('requests').insert([order]);
      } catch {
        //
      }
    }
    return order;
  }

  async updateStatus(id: string, status: RequestStatus, ownerNotes?: string): Promise<void> {
    const list = await this.getAll();
    const index = list.findIndex(r => r.id === id);
    if (index >= 0) {
      list[index].status = status;
      if (ownerNotes !== undefined) list[index].owner_notes = ownerNotes;
      list[index].updated_at = new Date().toISOString();
      this.cache = [...list];

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(this.cache));
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('requests')
          .update({ status, owner_notes: ownerNotes, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch {
        //
      }
    }
  }

  async addPaymentProof(orderId: string, proof: PaymentProof): Promise<CateringRequest> {
    const list = await this.getAll();
    const index = list.findIndex(r => r.id === orderId);
    if (index >= 0) {
      const existing = list[index];
      const updatedProofs = [...(existing.payment_proofs || []), proof];
      const newStatus: RequestStatus = proof.stage === 'pelunasan' ? 'Lunas' : 'DP Dibayar';
      list[index] = {
        ...existing,
        payment_proofs: updatedProofs,
        payment_status: proof.stage === 'pelunasan' ? 'fully_paid' : 'dp_paid',
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      this.cache = [...list];

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(this.cache));
      }
      return list[index];
    }
    throw new Error(`Order ${orderId} not found`);
  }

  async verifyPaymentProof(orderId: string, proofId: string, isVerified: boolean): Promise<void> {
    const list = await this.getAll();
    const index = list.findIndex(r => r.id === orderId);
    if (index >= 0) {
      const proofs = list[index].payment_proofs || [];
      const pIndex = proofs.findIndex(p => p.id === proofId);
      if (pIndex >= 0) {
        proofs[pIndex].status = isVerified ? 'verified' : 'rejected';
        proofs[pIndex].verified_at = new Date().toISOString();
        if (isVerified) {
          if (proofs[pIndex].stage === 'pelunasan') {
            list[index].status = 'Lunas';
            list[index].payment_status = 'fully_paid';
          } else {
            list[index].status = 'DP Dibayar';
            list[index].payment_status = 'dp_paid';
          }
        }
      }
      list[index].payment_proofs = proofs;
      list[index].updated_at = new Date().toISOString();
      this.cache = [...list];

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(this.cache));
      }
    }
  }
}

export const orderRepository = new OrderRepository();
