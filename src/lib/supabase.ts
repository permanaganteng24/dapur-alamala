import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CateringRequest, Menu, NewRequestPayload, RequestMenuItem, RequestStatus, PaymentProof, PaymentStage } from '../types';
import { INITIAL_MENUS, INITIAL_REQUESTS } from '../data/seedData';
import { STORAGE_KEYS, OWNER_WHATSAPP_NUMBER, PAYMENT_BANK_DETAILS, APP_CONFIG } from '../constants';
import { cleanPhoneNumber } from './formatters';

const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  '';
const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// In-Memory Fast Cache for instant response (< 1ms)
let cachedMenus: Menu[] | null = null;
let cachedRequests: CateringRequest[] | null = null;

// Realtime Event Broadcaster across tabs / windows
type RealtimePayload = {
  type: 'REQUEST_CREATED' | 'REQUEST_UPDATED' | 'PROPOSAL_SENT' | 'MENU_CATALOG_UPDATED' | 'PAYMENT_PROOF_SUBMITTED' | 'PAYMENT_PROOF_VERIFIED';
  requestId?: string;
  data?: unknown;
};

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel(STORAGE_KEYS.EVENT_BUS)
  : null;

function emitRealtimeEvent(payload: RealtimePayload) {
  if (broadcastChannel) {
    broadcastChannel.postMessage(payload);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_KEYS.EVENT_BUS, { detail: payload }));
  }
}

// ---------------------------------------------------------------------------
// LocalStorage Persistence
// ---------------------------------------------------------------------------
function getStoredMenus(): Menu[] {
  if (cachedMenus) return cachedMenus;
  if (typeof window === 'undefined') return INITIAL_MENUS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENUS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(INITIAL_MENUS));
      cachedMenus = INITIAL_MENUS;
      return INITIAL_MENUS;
    }
    const parsed: Menu[] = JSON.parse(raw);
    const enriched = parsed.map(m => ({
      ...m,
      images: Array.isArray(m.images) && m.images.length > 0
        ? m.images
        : [m.image_url || '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg']
    }));
    cachedMenus = enriched;
    return enriched;
  } catch (err) {
    console.warn('Failed to parse menus, falling back to initial', err);
    cachedMenus = INITIAL_MENUS;
    return INITIAL_MENUS;
  }
}

function saveStoredMenus(menus: Menu[]): void {
  cachedMenus = menus;
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
  emitRealtimeEvent({ type: 'MENU_CATALOG_UPDATED' });
}

function getStoredRequests(): CateringRequest[] {
  if (cachedRequests) return cachedRequests;
  if (typeof window === 'undefined') return INITIAL_REQUESTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
      cachedRequests = INITIAL_REQUESTS;
      return INITIAL_REQUESTS;
    }
    const parsed: CateringRequest[] = JSON.parse(raw);
    const existingIds = new Set(parsed.map(r => r.id));
    const missing = INITIAL_REQUESTS.filter(r => !existingIds.has(r.id));
    const merged = missing.length > 0 ? [...parsed, ...missing] : parsed;
    cachedRequests = merged;
    return merged;
  } catch (err) {
    console.warn('Failed to parse requests, falling back to initial', err);
    cachedRequests = INITIAL_REQUESTS;
    return INITIAL_REQUESTS;
  }
}

function saveStoredRequests(requests: CateringRequest[]): void {
  cachedRequests = requests;
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
}

// ---------------------------------------------------------------------------
// Unified Service Methods
// ---------------------------------------------------------------------------
export async function fetchMenus(): Promise<Menu[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        cachedMenus = data as Menu[];
        return cachedMenus;
      }
    } catch {
      // fallback to local
    }
  }
  return getStoredMenus();
}

export async function upsertMenu(menu: Menu): Promise<Menu> {
  const list = getStoredMenus();
  const index = list.findIndex(m => m.id === menu.id);
  let updatedList: Menu[];
  if (index >= 0) {
    updatedList = [...list];
    updatedList[index] = menu;
  } else {
    updatedList = [menu, ...list];
  }
  saveStoredMenus(updatedList);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('menus').upsert(menu);
    } catch (err) {
      console.warn('Supabase upsertMenu failed:', err);
    }
  }
  return menu;
}

export async function deleteMenu(id: string): Promise<void> {
  const list = getStoredMenus().filter(m => m.id !== id);
  saveStoredMenus(list);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('menus').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteMenu failed:', err);
    }
  }
}

export async function fetchAllRequests(): Promise<CateringRequest[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          menus:request_menus(
            id,
            request_id,
            menu_id,
            custom_price,
            note,
            is_default_selected,
            menu:menus(*)
          )
        `)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        cachedRequests = data as CateringRequest[];
        return cachedRequests;
      }
    } catch {
      // fallback
    }
  }
  return getStoredRequests();
}

export async function fetchRequestById(id: string): Promise<CateringRequest | null> {
  const all = getStoredRequests();
  const found = all.find(r => r.id === id);
  if (found) return found;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          menus:request_menus(
            id,
            request_id,
            menu_id,
            custom_price,
            note,
            is_default_selected,
            menu:menus(*)
          )
        `)
        .eq('id', id)
        .single();
      if (!error && data) return data as CateringRequest;
    } catch {
      // fallback
    }
  }
  return null;
}

export async function createCateringRequest(payload: NewRequestPayload): Promise<CateringRequest> {
  const all = getStoredRequests();
  if (payload.idempotency_key) {
    const existing = all.find(r => r.idempotency_key === payload.idempotency_key);
    if (existing) return existing;
  }

  const newId = crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now();
  const newRequest: CateringRequest = {
    id: newId,
    name: payload.name,
    phone: cleanPhoneNumber(payload.phone),
    event_type: payload.event_type,
    event_date: payload.event_date,
    portions: Number(payload.portions) || 20,
    budget: payload.budget || 'Rp 25.000 /pax',
    location: payload.location || 'Kota Malang',
    notes: payload.notes || '',
    status: 'Baru',
    created_at: new Date().toISOString(),
    menus: payload.menus || [],
    total_price: payload.total_price,
    dp_amount: payload.dp_amount,
    remaining_amount: payload.remaining_amount,
    idempotency_key: payload.idempotency_key
  };

  const updated = [newRequest, ...all];
  saveStoredRequests(updated);
  emitRealtimeEvent({ type: 'REQUEST_CREATED', requestId: newRequest.id, data: newRequest });

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('requests').insert([newRequest]);
    } catch (err) {
      console.warn('Supabase createCateringRequest failed:', err);
    }
  }

  return newRequest;
}

export async function updateRequestStatus(
  requestId: string, 
  status: RequestStatus, 
  ownerNotes?: string
): Promise<void> {
  const all = getStoredRequests();
  const index = all.findIndex(r => r.id === requestId);
  if (index >= 0) {
    all[index].status = status;
    if (ownerNotes !== undefined) {
      all[index].owner_notes = ownerNotes;
    }
    all[index].updated_at = new Date().toISOString();
    saveStoredRequests(all);
    emitRealtimeEvent({ type: 'REQUEST_UPDATED', requestId, data: all[index] });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('requests')
        .update({ status, owner_notes: ownerNotes, updated_at: new Date().toISOString() })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase updateRequestStatus failed:', err);
    }
  }
}

export async function updateCateringRequest(
  requestId: string,
  updates: Partial<CateringRequest>
): Promise<CateringRequest> {
  const all = getStoredRequests();
  const index = all.findIndex(r => r.id === requestId);
  if (index < 0) {
    throw new Error('Pesanan tidak ditemukan');
  }

  const updated: CateringRequest = {
    ...all[index],
    ...updates,
    phone: updates.phone ? cleanPhoneNumber(updates.phone) : all[index].phone,
    updated_at: new Date().toISOString()
  };

  all[index] = updated;
  saveStoredRequests(all);
  emitRealtimeEvent({ type: 'REQUEST_UPDATED', requestId, data: updated });

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('requests')
        .update({ ...updates, updated_at: updated.updated_at })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase updateCateringRequest failed:', err);
    }
  }

  return updated;
}

export async function deleteCateringRequest(requestId: string): Promise<void> {
  const all = getStoredRequests();
  const filtered = all.filter(r => r.id !== requestId);
  saveStoredRequests(filtered);
  emitRealtimeEvent({ type: 'REQUEST_UPDATED', requestId });

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('requests').delete().eq('id', requestId);
    } catch (err) {
      console.warn('Supabase deleteCateringRequest failed:', err);
    }
  }
}

export async function toggleMenuAvailability(menuId: string): Promise<boolean> {
  const menus = getStoredMenus();
  const index = menus.findIndex(m => m.id === menuId);
  if (index < 0) return false;

  const currentAvailable = menus[index].is_available !== false;
  menus[index] = {
    ...menus[index],
    is_available: !currentAvailable
  };
  saveStoredMenus(menus);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('menus')
        .update({ is_available: !currentAvailable })
        .eq('id', menuId);
    } catch (err) {
      console.warn('Supabase toggleMenuAvailability failed:', err);
    }
  }

  return !currentAvailable;
}

export async function submitPaymentProof(
  requestId: string,
  proofData: {
    stage: PaymentStage;
    amount: number;
    sender_bank?: string;
    sender_name?: string;
    receipt_image: string;
    receipt_filename?: string;
    notes?: string;
    idempotency_key?: string;
  }
): Promise<{ request: CateringRequest; proof: PaymentProof }> {
  const all = getStoredRequests();
  const index = all.findIndex(r => r.id === requestId);

  if (index >= 0 && all[index].payment_proofs) {
    const existingProofs = all[index].payment_proofs || [];
    const duplicate = existingProofs.find(p => 
      (proofData.idempotency_key && p.idempotency_key === proofData.idempotency_key) ||
      (p.stage === proofData.stage && p.amount === proofData.amount && p.receipt_filename === proofData.receipt_filename)
    );
    if (duplicate) {
      return { request: all[index], proof: duplicate };
    }
  }

  const newProof: PaymentProof = {
    id: 'proof-' + Date.now(),
    stage: proofData.stage,
    amount: proofData.amount,
    sender_bank: proofData.sender_bank || 'BCA',
    sender_name: proofData.sender_name || 'Pelanggan',
    receipt_image: proofData.receipt_image,
    receipt_filename: proofData.receipt_filename || 'bukti_transfer.jpg',
    notes: proofData.notes || '',
    created_at: new Date().toISOString(),
    status: 'pending_verification',
    idempotency_key: proofData.idempotency_key
  };

  if (index >= 0) {
    const existing = all[index];
    const updatedProofs = [...(existing.payment_proofs || []), newProof];
    const newStatus: RequestStatus = proofData.stage === 'pelunasan' ? 'Lunas' : 'DP Dibayar';
    all[index] = {
      ...existing,
      payment_proofs: updatedProofs,
      payment_status: proofData.stage === 'pelunasan' ? 'fully_paid' : 'dp_paid',
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    saveStoredRequests(all);
    emitRealtimeEvent({ type: 'PAYMENT_PROOF_SUBMITTED', requestId, data: { request: all[index], proof: newProof } });
    return { request: all[index], proof: newProof };
  } else {
    const fallbackRequest: CateringRequest = {
      id: requestId,
      name: proofData.sender_name || 'Pelanggan',
      phone: '',
      event_type: 'Pemesanan Catering',
      event_date: new Date().toISOString().split('T')[0],
      portions: 10,
      status: proofData.stage === 'pelunasan' ? 'Lunas' : 'DP Dibayar',
      payment_status: proofData.stage === 'pelunasan' ? 'fully_paid' : 'dp_paid',
      payment_proofs: [newProof],
      created_at: new Date().toISOString()
    };
    const updated = [fallbackRequest, ...all];
    saveStoredRequests(updated);
    emitRealtimeEvent({ type: 'PAYMENT_PROOF_SUBMITTED', requestId, data: { request: fallbackRequest, proof: newProof } });
    return { request: fallbackRequest, proof: newProof };
  }
}

export async function verifyPaymentProof(
  requestId: string,
  proofId: string,
  verified: boolean
): Promise<void> {
  const all = getStoredRequests();
  const index = all.findIndex(r => r.id === requestId);
  if (index >= 0) {
    const proofs = all[index].payment_proofs || [];
    const pIndex = proofs.findIndex(p => p.id === proofId);
    if (pIndex >= 0) {
      proofs[pIndex].status = verified ? 'verified' : 'rejected';
      proofs[pIndex].verified_at = new Date().toISOString();
      if (verified) {
        if (proofs[pIndex].stage === 'pelunasan') {
          all[index].status = 'Lunas';
          all[index].payment_status = 'fully_paid';
        } else {
          all[index].status = 'DP Dibayar';
          all[index].payment_status = 'dp_paid';
        }
      }
    }
    all[index].payment_proofs = proofs;
    all[index].updated_at = new Date().toISOString();
    saveStoredRequests(all);
    emitRealtimeEvent({ type: 'PAYMENT_PROOF_VERIFIED', requestId, data: all[index] });
  }
}

export async function sendMenuProposal(
  requestId: string,
  selectedMenuItems: { menu: Menu; customPrice?: number; note?: string; isSelected?: boolean }[],
  ownerNote: string
): Promise<void> {
  const proposalMenus: RequestMenuItem[] = selectedMenuItems.map((item, idx) => ({
    id: `rm-${Date.now()}-${idx}`,
    request_id: requestId,
    menu_id: item.menu.id,
    custom_price: item.customPrice || item.menu.price,
    note: item.note || '',
    is_default_selected: item.isSelected !== false,
    menu: item.menu
  }));

  const all = getStoredRequests();
  const index = all.findIndex(r => r.id === requestId);
  if (index >= 0) {
    all[index].status = 'Menu Dikirim';
    all[index].owner_notes = ownerNote;
    all[index].menus = proposalMenus;
    all[index].updated_at = new Date().toISOString();
    saveStoredRequests(all);
    emitRealtimeEvent({ type: 'PROPOSAL_SENT', requestId, data: all[index] });
  }
}

export function subscribeToRequestUpdates(
  requestId: string,
  onUpdate: (request: CateringRequest) => void
): () => void {
  const handleLocalEvent = (evt: CustomEvent<RealtimePayload> | MessageEvent<RealtimePayload>) => {
    const payload = ('detail' in evt ? evt.detail : evt.data) as RealtimePayload;
    if (payload && (payload.requestId === requestId || !payload.requestId)) {
      const all = getStoredRequests();
      const found = all.find(r => r.id === requestId);
      if (found) onUpdate(found);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleLocalEvent as EventListener);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener(STORAGE_KEYS.EVENT_BUS, handleLocalEvent as EventListener);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleLocalEvent as EventListener);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener(STORAGE_KEYS.EVENT_BUS, handleLocalEvent as EventListener);
    }
  };
}

export function subscribeToAllRequests(onUpdate: (requests: CateringRequest[]) => void): () => void {
  const handleLocalEvent = () => {
    const all = getStoredRequests();
    onUpdate(all);
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleLocalEvent);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener(STORAGE_KEYS.EVENT_BUS, handleLocalEvent);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleLocalEvent);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener(STORAGE_KEYS.EVENT_BUS, handleLocalEvent);
    }
  };
}

export function subscribeToMenuUpdates(onUpdate: (menus: Menu[]) => void): () => void {
  const handleLocalEvent = () => {
    cachedMenus = null;
    const all = getStoredMenus();
    onUpdate(all);
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.MENUS) {
      cachedMenus = null;
      const all = getStoredMenus();
      onUpdate(all);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleLocalEvent);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener(STORAGE_KEYS.EVENT_BUS, handleLocalEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleLocalEvent);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener(STORAGE_KEYS.EVENT_BUS, handleLocalEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

// Re-exports
export { formatRupiah, cleanPhoneNumber } from './formatters';
export { PAYMENT_BANK_DETAILS, OWNER_WHATSAPP_NUMBER, APP_CONFIG, STORAGE_KEYS } from '../constants';
export { 
  buildClientOrderWhatsAppUrl, 
  buildOwnerFollowUpWhatsAppUrl, 
  buildPaymentProofWhatsAppUrl,
  buildPaymentReceiptAcknowledgmentWhatsAppUrl,
  buildDirectOrderWhatsAppUrl,
  buildPaidInvoiceWhatsAppUrl
} from './whatsapp';
export { 
  loginAdmin, 
  logoutAdmin, 
  getAdminSession, 
  updateLocalAdminPassword,
  type AdminAuthSession 
} from './auth';
