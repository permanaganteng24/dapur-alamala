import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchAllRequests, 
  fetchMenus, 
  subscribeToAllRequests, 
  sendMenuProposal, 
  updateRequestStatus,
  createCateringRequest,
  updateCateringRequest,
  deleteCateringRequest,
  toggleMenuAvailability,
  upsertMenu, 
  deleteMenu, 
  formatRupiah, 
  buildOwnerFollowUpWhatsAppUrl,
  buildPaidInvoiceWhatsAppUrl,
  verifyPaymentProof,
  buildPaymentReceiptAcknowledgmentWhatsAppUrl,
  getAdminSession,
  updateLocalAdminPassword
} from '../lib/supabase';
import { CateringRequest, Menu, MenuCategory, RequestStatus, PaymentProof } from '../types';
import { 
  Plus, 
  Send, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  LogOut, 
  ExternalLink,
  MessageCircle,
  Eye,
  X,
  CreditCard,
  Lock,
  Key,
  Upload,
  Image as ImageIcon,
  Star,
  Images,
  Sparkles,
  AlertCircle,
  Loader2,
  History,
  TrendingUp,
  FileText,
  Search,
  Receipt,
  Phone,
  User,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { AlamalaEmblem } from '../components/common/AlamalaLogo';
import { compressImageFile, PRESET_CATALOG_IMAGES } from '../utils/imageCompressor';
import { OrderHistorySection } from '../components/admin/OrderHistorySection';
import { SalesReportSection } from '../components/admin/SalesReportSection';
import { OfficialInvoiceModal } from '../components/modals/OfficialInvoiceModal';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
  onOpenProposalPreview: (requestId: string) => void;
  onMenusUpdated?: (updated: Menu[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onNavigateHome,
  onOpenProposalPreview,
  onMenusUpdated
}) => {
  const [requests, setRequests] = useState<CateringRequest[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'Baru' | 'DP Dibayar' | 'Lunas' | 'history' | 'sales' | 'catalog' | 'settings'>('all');
  const [selectedInvoiceRequest, setSelectedInvoiceRequest] = useState<CateringRequest | null>(null);
  
  // Modals & sub-states
  const [curatingRequest, setCuratingRequest] = useState<CateringRequest | null>(null);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Record<string, { isSelected: boolean; customPrice?: number; note?: string }>>({});
  const [ownerNoteInput, setOwnerNoteInput] = useState('');
  const [sendingProposal, setSendingProposal] = useState(false);

  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [isAddingNewMenu, setIsAddingNewMenu] = useState(false);
  const [menuFormData, setMenuFormData] = useState<Partial<Menu>>({
    name: '',
    category: 'nasi_box',
    description: '',
    price: 25000,
    image_url: '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
    images: ['/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'],
    tag: 'Menu Favorit',
    is_available: true
  });
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  const [selectedProofModal, setSelectedProofModal] = useState<{ request: CateringRequest; proof: PaymentProof } | null>(null);
  const [copiedLinkForId, setCopiedLinkForId] = useState<string | null>(null);

  // Order CRUD & Search states
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'all' | MenuCategory>('all');
  const [isAddingNewOrder, setIsAddingNewOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CateringRequest | null>(null);
  const [orderFormData, setOrderFormData] = useState<Partial<CateringRequest>>({
    name: '',
    phone: '',
    event_type: 'Syukuran Keluarga',
    event_date: new Date().toISOString().split('T')[0],
    portions: 20,
    total_price: 560000,
    dp_amount: 280000,
    location: 'Kota Malang',
    notes: '',
    status: 'Baru',
    payment_status: 'unpaid'
  });
  const [justMarkedLunasRequest, setJustMarkedLunasRequest] = useState<CateringRequest | null>(null);
  
  // Security
  const [newAdminPass, setNewAdminPass] = useState('');
  const [passChangeNotice, setPassChangeNotice] = useState<string | null>(null);

  const adminSession = getAdminSession();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const [reqList, menuList] = await Promise.all([
        fetchAllRequests(),
        fetchMenus()
      ]);
      if (isMounted) {
        setRequests(reqList);
        setMenus(menuList);
        setLoading(false);
      }
    }
    loadData();

    const unsubscribe = subscribeToAllRequests((updatedList) => {
      setRequests(updatedList);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Filter requests with search support
  const filteredRequests = requests.filter(r => {
    let matchTab = true;
    if (activeTab === 'DP Dibayar') {
      matchTab = r.status === 'DP Dibayar' || r.payment_status === 'dp_paid';
    } else if (activeTab === 'Lunas') {
      matchTab = r.status === 'Lunas' || r.payment_status === 'fully_paid';
    } else if (activeTab !== 'all' && activeTab !== 'catalog' && activeTab !== 'settings' && activeTab !== 'sales' && activeTab !== 'history') {
      matchTab = r.status === activeTab;
    }

    if (!matchTab) return false;

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const matchName = r.name.toLowerCase().includes(q);
      const matchPhone = r.phone.toLowerCase().includes(q);
      const matchEvent = r.event_type.toLowerCase().includes(q);
      const matchLoc = (r.location || '').toLowerCase().includes(q);
      const matchId = r.id.toLowerCase().includes(q);
      return matchName || matchPhone || matchEvent || matchLoc || matchId;
    }

    return true;
  });

  const newCount = requests.filter(r => r.status === 'Baru').length;
  const dpCount = requests.filter(r => r.status === 'DP Dibayar' || r.payment_status === 'dp_paid').length;
  const lunasCount = requests.filter(r => r.status === 'Lunas' || r.payment_status === 'fully_paid').length;
  const totalCount = requests.length;

  const handleStatusChange = async (requestId: string, newStatus: RequestStatus) => {
    await updateRequestStatus(requestId, newStatus);
    if (newStatus === 'Lunas') {
      await updateCateringRequest(requestId, { payment_status: 'fully_paid', remaining_amount: 0 });
      const updated = await fetchAllRequests();
      setRequests(updated);
      const target = updated.find(r => r.id === requestId);
      if (target) {
        setJustMarkedLunasRequest(target);
        try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }); } catch {}
      }
    } else {
      const updated = await fetchAllRequests();
      setRequests(updated);
    }
  };

  const handleToggleMenuAvailability = async (menuId: string) => {
    await toggleMenuAvailability(menuId);
    const updated = await fetchMenus();
    setMenus(updated);
    onMenusUpdated?.(updated);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderFormData.name || !orderFormData.phone || !orderFormData.event_type) return;
    const portions = Number(orderFormData.portions) || 20;
    const totalPrice = Number(orderFormData.total_price) || (portions * 28000);
    const dpAmount = Number(orderFormData.dp_amount) || Math.round(totalPrice * 0.5);
    const initialStatus = (orderFormData.status as RequestStatus) || 'Baru';
    const paymentStatus = initialStatus === 'Lunas' ? 'fully_paid' : initialStatus === 'DP Dibayar' ? 'dp_paid' : 'unpaid';

    const newReq = await createCateringRequest({
      name: orderFormData.name,
      phone: orderFormData.phone,
      event_type: orderFormData.event_type,
      event_date: orderFormData.event_date || new Date().toISOString().split('T')[0],
      portions,
      budget: formatRupiah(Math.round(totalPrice / portions)) + ' /pax',
      location: orderFormData.location || 'Kota Malang',
      notes: orderFormData.notes || ''
    });

    if (initialStatus !== 'Baru' || orderFormData.total_price) {
      await updateCateringRequest(newReq.id, {
        status: initialStatus,
        payment_status: paymentStatus,
        total_price: totalPrice,
        dp_amount: dpAmount,
        remaining_amount: initialStatus === 'Lunas' ? 0 : totalPrice - dpAmount
      });
    }

    const updated = await fetchAllRequests();
    setRequests(updated);
    setIsAddingNewOrder(false);
    setOrderFormData({
      name: '',
      phone: '',
      event_type: '',
      event_date: new Date().toISOString().split('T')[0],
      portions: 20,
      total_price: 560000,
      dp_amount: 280000,
      location: 'Kota Malang',
      notes: '',
      status: 'Baru',
      payment_status: 'unpaid'
    });
    try { confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } }); } catch {}
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    const portions = Number(orderFormData.portions) || editingOrder.portions;
    const totalPrice = Number(orderFormData.total_price) || editingOrder.total_price || (portions * 28000);
    const dpAmount = Number(orderFormData.dp_amount) || editingOrder.dp_amount || Math.round(totalPrice * 0.5);
    const currentStatus = (orderFormData.status as RequestStatus) || editingOrder.status;
    const paymentStatus = currentStatus === 'Lunas' ? 'fully_paid' : currentStatus === 'DP Dibayar' ? 'dp_paid' : (orderFormData.payment_status || editingOrder.payment_status || 'unpaid');

    await updateCateringRequest(editingOrder.id, {
      name: orderFormData.name || editingOrder.name,
      phone: orderFormData.phone || editingOrder.phone,
      event_type: orderFormData.event_type || editingOrder.event_type,
      event_date: orderFormData.event_date || editingOrder.event_date,
      portions,
      total_price: totalPrice,
      dp_amount: dpAmount,
      remaining_amount: currentStatus === 'Lunas' ? 0 : (totalPrice - dpAmount),
      location: orderFormData.location || editingOrder.location,
      notes: orderFormData.notes !== undefined ? orderFormData.notes : editingOrder.notes,
      status: currentStatus,
      payment_status: paymentStatus
    });

    const updated = await fetchAllRequests();
    setRequests(updated);
    setEditingOrder(null);
    setOrderFormData({});
  };

  const handleDeleteOrder = async (requestId: string, clientName: string) => {
    if (confirm(`Yakin ingin menghapus pesanan atas nama "${clientName}"? Data pesanan ini akan dihapus secara permanen.`)) {
      await deleteCateringRequest(requestId);
      const updated = await fetchAllRequests();
      setRequests(updated);
    }
  };

  const handleVerifyPayment = async (requestId: string, proofId: string, isVerified: boolean) => {
    await verifyPaymentProof(requestId, proofId, isVerified);
    const updated = await fetchAllRequests();
    setRequests(updated);
    if (selectedProofModal && selectedProofModal.proof.id === proofId) {
      setSelectedProofModal(prev => prev ? {
        ...prev,
        proof: { ...prev.proof, status: isVerified ? 'verified' : 'rejected' }
      } : null);
    }
    if (isVerified) {
      try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch {}
    }
  };

  const handleCopyProposalUrl = (requestId: string) => {
    const url = `${window.location.origin}/#/menu/${requestId}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkForId(requestId);
    setTimeout(() => setCopiedLinkForId(null), 2000);
  };

  const openProposalCurator = (req: CateringRequest) => {
    setCuratingRequest(req);
    setOwnerNoteInput(
      req.owner_notes || 
      'Menu berikut kami sesuaikan dengan preferensi acara keluarga Anda.'
    );
    const selection: Record<string, { isSelected: boolean; customPrice?: number; note?: string }> = {};
    if (req.menus && req.menus.length > 0) {
      req.menus.forEach(m => {
        selection[m.menu_id] = {
          isSelected: true,
          customPrice: m.custom_price ?? m.menu?.price,
          note: m.note || ''
        };
      });
    } else {
      menus.slice(0, 3).forEach((m, idx) => {
        selection[m.id] = {
          isSelected: true,
          customPrice: m.price,
          note: idx === 0 ? 'Lauk utama favorit' : idx === 1 ? 'Snack pendamping' : 'Pencuci mulut'
        };
      });
    }
    setSelectedMenuItems(selection);
  };

  const handleSendProposal = async () => {
    if (!curatingRequest) return;
    setSendingProposal(true);
    try {
      const selectedList = Object.entries(selectedMenuItems)
        .filter(([_, val]) => val.isSelected)
        .map(([menuId, val]) => {
          const menu = menus.find(m => m.id === menuId);
          return {
            menu: menu!,
            customPrice: val.customPrice,
            note: val.note,
            isSelected: true
          };
        })
        .filter(item => Boolean(item.menu));

      await sendMenuProposal(curatingRequest.id, selectedList, ownerNoteInput);
      const updated = await fetchAllRequests();
      setRequests(updated);
      setCuratingRequest(null);
    } catch {
      //
    } finally {
      setSendingProposal(false);
    }
  };

  const handlePhotoFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingPhotos(true);
    try {
      const fileList = Array.from(files);
      const newUrls: string[] = [];
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImageFile(file);
        newUrls.push(compressed);
      }
      if (newUrls.length > 0) {
        const currentImages = Array.isArray(menuFormData.images) && menuFormData.images.length > 0
          ? menuFormData.images
          : (menuFormData.image_url ? [menuFormData.image_url] : []);
        const combined = [...currentImages, ...newUrls];
        setMenuFormData(prev => ({
          ...prev,
          images: combined,
          image_url: combined[0]
        }));
      }
    } catch {
      alert('Gagal memproses gambar. Pastikan file berupa gambar yang valid.');
    } finally {
      setIsProcessingPhotos(false);
      e.target.value = '';
    }
  };

  const handleAddPresetPhoto = (url: string) => {
    const currentImages = Array.isArray(menuFormData.images) && menuFormData.images.length > 0
      ? menuFormData.images
      : (menuFormData.image_url ? [menuFormData.image_url] : []);
    if (!currentImages.includes(url)) {
      const updated = [...currentImages, url];
      setMenuFormData(prev => ({
        ...prev,
        images: updated,
        image_url: updated[0]
      }));
    }
  };

  const handleAddUrlPhoto = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed) return;
    const currentImages = Array.isArray(menuFormData.images) && menuFormData.images.length > 0
      ? menuFormData.images
      : (menuFormData.image_url ? [menuFormData.image_url] : []);
    const updated = [...currentImages, trimmed];
    setMenuFormData(prev => ({
      ...prev,
      images: updated,
      image_url: updated[0]
    }));
    setPhotoUrlInput('');
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const currentImages = Array.isArray(menuFormData.images) && menuFormData.images.length > 0
      ? menuFormData.images
      : (menuFormData.image_url ? [menuFormData.image_url] : []);
    const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
    setMenuFormData(prev => ({
      ...prev,
      images: updated,
      image_url: updated[0] || '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'
    }));
  };

  const handleSetPrimaryPhoto = (indexToPrimary: number) => {
    const currentImages = Array.isArray(menuFormData.images) && menuFormData.images.length > 0
      ? [...menuFormData.images]
      : (menuFormData.image_url ? [menuFormData.image_url] : []);
    if (indexToPrimary <= 0 || indexToPrimary >= currentImages.length) return;
    const [selected] = currentImages.splice(indexToPrimary, 1);
    currentImages.unshift(selected);
    setMenuFormData(prev => ({
      ...prev,
      images: currentImages,
      image_url: currentImages[0]
    }));
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormData.name || !menuFormData.price) return;
    const images = Array.isArray(menuFormData.images) && menuFormData.images.length > 0
      ? menuFormData.images
      : [menuFormData.image_url || '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'];
    const newMenu: Menu = {
      id: editingMenu?.id || 'menu-' + Date.now(),
      name: menuFormData.name!,
      category: (menuFormData.category as MenuCategory) || 'nasi_box',
      description: menuFormData.description || '',
      price: Number(menuFormData.price),
      image_url: images[0] || '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
      images,
      tag: menuFormData.tag || '',
      is_available: menuFormData.is_available ?? true
    };
    await upsertMenu(newMenu);
    const updatedMenus = await fetchMenus();
    setMenus(updatedMenus);
    onMenusUpdated?.(updatedMenus);
    setEditingMenu(null);
    setIsAddingNewMenu(false);
  };

  const handleDeleteMenu = async (id: string) => {
    if (confirm('Hapus menu ini dari katalog aktif?')) {
      await deleteMenu(id);
      const updatedMenus = await fetchMenus();
      setMenus(updatedMenus);
      onMenusUpdated?.(updatedMenus);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPass.length < 6) {
      setPassChangeNotice('Kata sandi minimal 6 karakter.');
      return;
    }
    updateLocalAdminPassword(newAdminPass);
    setPassChangeNotice('Kata sandi berhasil diperbarui.');
    setNewAdminPass('');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlamalaEmblem size={28} color="#C3282E" />
            <span className="font-serif text-lg font-bold text-[#1C1917]">
              Dapur Alamala
            </span>
            <span className="text-xs text-stone-500 font-medium">
              · Portal Pengelola
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await onLogout();
                onNavigateHome();
              }}
              className="px-2.5 py-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 border border-stone-200 shadow-2xs"
              title="Kunci sesi admin dan kembali ke website sebagai mode pelanggan biasa (100% aman dari akses admin)"
            >
              <Eye className="w-3.5 h-3.5 text-stone-600" />
              <span>Buka Mode Pelanggan (Kunci)</span>
            </button>
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-md border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Keluar dan kunci sesi agar tidak bisa dibuka tanpa memasukkan kata sandi"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Kunci Sesi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* Metric Cards (Tabular, clean, interactive) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => setActiveTab('history')}
            className="p-4 rounded-xl bg-white border border-stone-200 hover:border-[#1E3A2F] cursor-pointer transition-all hover:shadow-xs group"
            title="Klik untuk membuka riwayat pesanan lengkap"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium group-hover:text-[#1E3A2F] transition-colors">
                Total Permintaan
              </span>
              <History className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#1E3A2F] transition-colors" />
            </div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums mt-1 block">
              {totalCount}
            </span>
            <span className="text-[10px] text-stone-400 mt-1 block group-hover:text-stone-700">
              Buka Riwayat Pesanan &rarr;
            </span>
          </div>

          <div 
            onClick={() => setActiveTab('Baru')}
            className="p-4 rounded-xl bg-white border border-stone-200 hover:border-amber-400 cursor-pointer transition-all hover:shadow-xs"
          >
            <span className="text-xs text-stone-500 font-medium block">
              Perlu Ditindaklanjuti
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#9B381E] tabular-nums mt-1 block">
              {newCount}
            </span>
            <span className="text-[10px] text-stone-400 mt-1 block">
              Pesanan baru masuk
            </span>
          </div>

          <div 
            onClick={() => setActiveTab('DP Dibayar')}
            className="p-4 rounded-xl bg-white border border-stone-200 hover:border-emerald-500 cursor-pointer transition-all hover:shadow-xs"
          >
            <span className="text-xs text-stone-500 font-medium block">
              DP 50% Masuk
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1E3A2F] tabular-nums mt-1 block">
              {dpCount}
            </span>
            <span className="text-[10px] text-stone-400 mt-1 block">
              Jadwal terkunci
            </span>
          </div>

          <div 
            onClick={() => setActiveTab('Lunas')}
            className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400 cursor-pointer transition-all hover:shadow-xs"
          >
            <span className="text-xs text-stone-500 font-medium block">
              Pesanan Lunas
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums mt-1 block">
              {lunasCount}
            </span>
            <span className="text-[10px] text-stone-400 mt-1 block">
              Siap / Selesai
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'all' ? 'bg-white text-stone-950 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua Pesanan ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('Baru')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'Baru' ? 'bg-white text-stone-950 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Baru ({newCount})
          </button>
          <button
            onClick={() => setActiveTab('DP Dibayar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'DP Dibayar' ? 'bg-white text-stone-950 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            DP Masuk ({dpCount})
          </button>
          <button
            onClick={() => setActiveTab('Lunas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'Lunas' ? 'bg-white text-stone-950 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Lunas ({lunasCount})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-stone-950 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#1E3A2F]" />
            <span>Riwayat Pesanan ({requests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'sales' ? 'bg-white text-stone-950 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Laporan Penjualan</span>
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'catalog' ? 'bg-white text-stone-950 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Katalog Menu ({menus.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'settings' ? 'bg-white text-stone-950 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pengaturan
          </button>
        </div>

        {/* Tab Content with smooth Framer Motion transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* TAB: CATALOG MANAGEMENT */}
            {activeTab === 'catalog' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1C1917]">
                      Katalog Menu Dapur ({menus.length} Hidangan)
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Kelola hidangan, harga, ketersediaan stok, dan galeri multi-foto menu.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMenu(null);
                      setMenuFormData({
                        name: '',
                        category: 'nasi_box',
                        description: '',
                        price: 25000,
                        image_url: '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg',
                        images: ['/src/assets/images/nasi_box_ayambakar_1792341600484.jpg'],
                        tag: 'Menu Favorit',
                        is_available: true
                      });
                      setPhotoUrlInput('');
                      setShowPresetPicker(false);
                      setIsAddingNewMenu(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Hidangan Baru</span>
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-lg text-xs">
                  {[
                    { id: 'all', label: 'Semua Menu', count: menus.length },
                    { id: 'nasi_box', label: 'Nasi Box', count: menus.filter(m => m.category === 'nasi_box').length },
                    { id: 'tumpeng', label: 'Tumpeng Tampah', count: menus.filter(m => m.category === 'tumpeng').length },
                    { id: 'snack_box', label: 'Snack Box', count: menus.filter(m => m.category === 'snack_box').length },
                    { id: 'puding_dessert', label: 'Puding & Dessert', count: menus.filter(m => m.category === 'puding_dessert').length },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCatalogCategoryFilter(cat.id as any)}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer text-xs ${
                        catalogCategoryFilter === cat.id
                          ? 'bg-white text-stone-900 font-semibold shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(catalogCategoryFilter === 'all' ? menus : menus.filter(m => m.category === catalogCategoryFilter)).map((m) => {
                    const photoCount = Array.isArray(m.images) && m.images.length > 0 ? m.images.length : (m.image_url ? 1 : 0);
                    const isAvailable = m.is_available !== false;
                    return (
                      <div key={m.id} className="p-3 bg-white rounded-xl border border-stone-200 flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={m.image_url}
                            alt={m.name}
                            className={`w-16 h-16 rounded-lg object-cover bg-stone-100 ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
                          />
                          {photoCount > 1 && (
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-stone-900/90 text-white text-[9px] font-semibold flex items-center gap-0.5 shadow-xs">
                              <Images className="w-2.5 h-2.5 text-amber-300" />
                              {photoCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                              {m.category.replace('_', ' ')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleMenuAvailability(m.id)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                                isAvailable 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Klik untuk mengubah ketersediaan hidangan (Tersedia / Habis)"
                            >
                              {isAvailable ? '✓ Tersedia' : '✕ Habis'}
                            </button>
                          </div>
                          <h4 className="font-serif font-bold text-xs text-[#1C1917] truncate mt-0.5">
                            {m.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-stone-800 tabular-nums">
                              {formatRupiah(m.price)}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              ({photoCount} foto)
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingMenu(m);
                              const mImages = Array.isArray(m.images) && m.images.length > 0 ? m.images : [m.image_url];
                              setMenuFormData({
                                ...m,
                                images: mImages,
                                image_url: mImages[0]
                              });
                              setPhotoUrlInput('');
                              setShowPresetPicker(false);
                              setIsAddingNewMenu(true);
                            }}
                            className="p-1.5 rounded text-stone-600 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                            title="Edit Menu & Foto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMenu(m.id)}
                            className="p-1.5 rounded text-stone-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            title="Hapus Hidangan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

        {/* TAB: SETTINGS & PASSWORD */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
              <h3 className="font-serif font-bold text-base text-[#1C1917] flex items-center gap-2">
                <Key className="w-4 h-4 text-stone-600" />
                <span>Ganti Kata Sandi Pemilik</span>
              </h3>
              <p className="text-xs text-stone-600">
                Perbarui kata sandi utama untuk mengamankan akses ke data pesanan dan laporan penjualan.
              </p>
              {passChangeNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded font-medium">
                  {passChangeNotice}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Kata Sandi Baru *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={newAdminPass}
                    onChange={(e) => setNewAdminPass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A2F]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A2F] text-white font-semibold rounded-lg cursor-pointer hover:bg-[#162C23] transition-colors"
                >
                  Simpan Kata Sandi
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4 text-xs">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-[#1C1917]">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>Status Keamanan Sistem</span>
              </div>
              
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-stone-800">
                    <span>Stealth 404 Guard</span>
                    <span className="text-emerald-700 font-bold">AKTIF</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Pelanggan yang mengetik /admin otomatis dialihkan ke halaman 404 (Halaman Tidak Ditemukan).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-stone-800">
                    <span>Anti Brute-Force Rate Limiting</span>
                    <span className="text-emerald-700 font-bold">AKTIF</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Maksimal 5x percobaan salah. Jika terlampaui, portal dikunci selama 15 menit.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-stone-800">
                    <span>Auto-Lock Timeout</span>
                    <span className="text-emerald-700 font-bold">30 MENIT</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Sesi otomatis terkunci saat tidak ada aktivitas atau saat tab browser ditutup.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <button
                  onClick={onLogout}
                  className="w-full py-2.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Kunci Sesi Admin Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ORDER HISTORY */}
        {activeTab === 'history' && (
          <OrderHistorySection
            requests={requests}
            onStatusChange={handleStatusChange}
            onOpenProposalPreview={onOpenProposalPreview}
            onVerifyPayment={handleVerifyPayment}
            onOpenInvoice={(req) => setSelectedInvoiceRequest(req)}
          />
        )}

        {/* TAB: SALES REPORT */}
        {activeTab === 'sales' && (
          <SalesReportSection
            requests={requests}
            menus={menus}
            onOpenInvoice={(req) => setSelectedInvoiceRequest(req)}
          />
        )}

        {/* TAB: REQUESTS & ORDERS LIST (Active Pipeline) */}
        {activeTab !== 'catalog' && activeTab !== 'settings' && activeTab !== 'history' && activeTab !== 'sales' && (
          <div className="space-y-4">
            {/* Search & Add New Order Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari pesanan (nama klien, nomor WA, acara, alamat)..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2F]"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setEditingOrder(null);
                  setOrderFormData({
                    name: '',
                    phone: '',
                    event_type: '',
                    event_date: new Date().toISOString().split('T')[0],
                    portions: 20,
                    total_price: 560000,
                    dp_amount: 280000,
                    location: 'Kota Malang',
                    notes: '',
                    status: 'Baru',
                    payment_status: 'unpaid'
                  });
                  setIsAddingNewOrder(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Pesanan Baru</span>
              </button>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500 space-y-2">
                <Receipt className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-semibold text-stone-700">Tidak ada pesanan yang sesuai</p>
                <p className="text-[11px] text-stone-400">
                  {orderSearchQuery ? `Tidak ditemukan pesanan dengan kata kunci "${orderSearchQuery}".` : 'Belum ada pesanan pada filter ini.'}
                </p>
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="mt-2 px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded text-stone-700 font-medium"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isPaidInFull = req.status === 'Lunas' || req.payment_status === 'fully_paid';
                return (
                  <div
                    key={req.id}
                    className="p-5 bg-white rounded-xl border border-stone-200 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-bold text-base text-[#1C1917]">
                            {req.name}
                          </h4>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            req.status === 'DP Dibayar' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                            isPaidInFull ? 'bg-emerald-600 text-white' :
                            req.status === 'Baru' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {req.status}
                          </span>
                          {isPaidInFull && (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Kwitansi Siap
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-x-2">
                          <span className="font-medium text-stone-800">{req.event_type}</span>
                          <span>·</span>
                          <span className="font-semibold text-stone-800">{req.portions} Pax</span>
                          <span>·</span>
                          <span>Tanggal: <strong>{req.event_date || 'Belum diisi'}</strong></span>
                          <span>·</span>
                          <span>WA: <strong>{req.phone}</strong></span>
                          <span>·</span>
                          <span>{req.location || 'Malang'}</span>
                        </div>
                      </div>

                      {/* Quick status dropdown */}
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-800 bg-white cursor-pointer shadow-2xs"
                        >
                          <option value="Baru">Status: Baru</option>
                          <option value="Menu Dikirim">Status: Menu Dikirim</option>
                          <option value="Dipesan">Status: Dipesan</option>
                          <option value="DP Dibayar">Status: DP Dibayar</option>
                          <option value="Lunas">Status: Lunas (100%)</option>
                          <option value="Selesai">Status: Selesai</option>
                        </select>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="text-xs text-stone-600 bg-[#FAF8F5] p-2.5 rounded-lg border border-stone-200 italic">
                        "{req.notes}"
                      </div>
                    )}

                    {/* Payment Proof Preview if any */}
                    {req.payment_proofs && req.payment_proofs.length > 0 && (
                      <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2 text-xs">
                        <div className="font-semibold text-stone-700 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#1E3A2F]" />
                          <span>Bukti Pembayaran Dilampirkan:</span>
                        </div>
                        {req.payment_proofs.map((proof) => (
                          <div key={proof.id} className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200">
                            <div>
                              <span className="font-semibold text-stone-900">
                                {proof.stage === 'dp' ? 'DP 50%' : 'Pelunasan'} — {formatRupiah(proof.amount)}
                              </span>
                              <span className="text-stone-500 block text-[11px]">
                                {proof.sender_bank || 'BCA'} a.n. {proof.sender_name || req.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedProofModal({ request: req, proof })}
                                className="px-2.5 py-1 rounded border border-stone-300 bg-white text-stone-700 text-xs hover:bg-stone-50 cursor-pointer"
                              >
                                Lihat Bukti
                              </button>
                              {proof.status !== 'verified' ? (
                                <button
                                  onClick={() => handleVerifyPayment(req.id, proof.id, true)}
                                  className="px-2.5 py-1 rounded bg-[#1E3A2F] text-white text-xs font-semibold cursor-pointer"
                                >
                                  Verifikasi
                                </button>
                              ) : (
                                <span className="text-[11px] font-semibold text-[#1E3A2F]">
                                  ✓ Terverifikasi
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons (CRUD, WhatsApp, Invoice) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-stone-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* WhatsApp Lunas vs Followup button */}
                        {isPaidInFull ? (
                          <button
                            onClick={() => window.open(buildPaidInvoiceWhatsAppUrl(req), '_blank')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Kirim kwitansi & bukti lunas resmi langsung ke WhatsApp pembeli"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Kirim Kwitansi Lunas WA</span>
                          </button>
                        ) : (
                          <a
                            href={buildOwnerFollowUpWhatsAppUrl(req)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1E3A2F] text-xs font-semibold transition-colors flex items-center gap-1.5 border border-emerald-200/60"
                            title={`Kirim pesan WhatsApp otomatis sesuai status: ${req.status}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#1E3A2F]" />
                            <span>Follow-up WA ({req.status})</span>
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedInvoiceRequest(req)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#9B381E] border border-amber-200/80 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Cetak Surat Penawaran & Invoice Resmi"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>

                        <button
                          onClick={() => openProposalCurator(req)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-800 hover:bg-stone-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{req.status === 'Baru' ? 'Kurasi Menu' : 'Menu'}</span>
                        </button>

                        <button
                          onClick={() => handleCopyProposalUrl(req.id)}
                          className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                          title="Salin tautan proposal/nota pelanggan"
                        >
                          {copiedLinkForId === req.id ? <Check className="w-3 h-3 text-[#1E3A2F]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLinkForId === req.id ? 'Tersalin' : 'Salin Tautan'}</span>
                        </button>
                      </div>

                      {/* Edit & Delete Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingOrder(req);
                            setOrderFormData({
                              name: req.name,
                              phone: req.phone,
                              event_type: req.event_type,
                              event_date: req.event_date,
                              portions: req.portions,
                              total_price: req.total_price || (req.portions * 28000),
                              dp_amount: req.dp_amount || Math.round((req.total_price || (req.portions * 28000)) * 0.5),
                              location: req.location || 'Kota Malang',
                              notes: req.notes || '',
                              status: req.status,
                              payment_status: req.payment_status
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit detail data pesanan ini"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(req.id, req.name)}
                          className="px-2 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Hapus pesanan ini secara permanen"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* CURATOR MODAL */}
      {curatingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-stone-500 block">Kurasi Menu</span>
                <h3 className="font-serif font-bold text-base text-[#1C1917]">
                  {curatingRequest.name} — {curatingRequest.event_type}
                </h3>
              </div>
              <button onClick={() => setCuratingRequest(null)} className="p-1 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Catatan Rekomendasi Dapur (Tampil di proposal client)
                </label>
                <textarea
                  rows={2}
                  value={ownerNoteInput}
                  onChange={(e) => setOwnerNoteInput(e.target.value)}
                  className="w-full p-2.5 rounded border border-stone-300 text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-2">
                  Pilih Menu dari Katalog ({menus.length} Tersedia)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {menus.map((m) => {
                    const current = selectedMenuItems[m.id] || { isSelected: false, customPrice: m.price };
                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg border ${
                          current.isSelected ? 'border-[#1E3A2F] bg-stone-50' : 'border-stone-200'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={current.isSelected}
                            onChange={(e) => {
                              setSelectedMenuItems({
                                ...selectedMenuItems,
                                [m.id]: { ...current, isSelected: e.target.checked }
                              });
                            }}
                            className="rounded border-stone-300"
                          />
                          <span className="font-semibold text-stone-900 flex-1">{m.name}</span>
                          <span className="text-stone-500 tabular-nums">{formatRupiah(m.price)}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCuratingRequest(null)}
                className="px-4 py-2 border border-stone-300 rounded text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sendingProposal}
                onClick={handleSendProposal}
                className="px-4 py-2 bg-[#1E3A2F] text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan Proposal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MENU MODAL WITH MULTI-PHOTO UPLOAD */}
      {isAddingNewMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-[#FAF8F5] shrink-0">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1C1917]">
                  {editingMenu ? 'Edit Menu & Foto' : 'Tambah Menu Baru'}
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Lengkapi data hidangan dan tambahkan satu atau beberapa foto menu.
                </p>
              </div>
              <button 
                onClick={() => setIsAddingNewMenu(false)} 
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveMenu} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Nama Hidangan */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Hidangan *</label>
                <input
                  type="text"
                  required
                  value={menuFormData.name || ''}
                  onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                  placeholder="Contoh: Nasi Box Ayam Bakar Madu"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                />
              </div>

              {/* Kategori & Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Kategori *</label>
                  <select
                    value={menuFormData.category || 'nasi_box'}
                    onChange={(e) => setMenuFormData({ ...menuFormData, category: e.target.value as MenuCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  >
                    <option value="nasi_box">Nasi Box</option>
                    <option value="tumpeng">Tumpeng Tampah</option>
                    <option value="snack_box">Snack Box</option>
                    <option value="puding_dessert">Puding &amp; Dessert</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Harga (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={menuFormData.price || 0}
                    onChange={(e) => setMenuFormData({ ...menuFormData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>
              </div>

              {/* Tag / Badge */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Label / Tag Promo (Opsional)
                </label>
                <input
                  type="text"
                  value={menuFormData.tag || ''}
                  onChange={(e) => setMenuFormData({ ...menuFormData, tag: e.target.value })}
                  placeholder="Contoh: Menu Terlaris, Best Seller, Rekomendasi"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Deskripsi Lengkap &amp; Isi Menu</label>
                <textarea
                  rows={2}
                  value={menuFormData.description || ''}
                  onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                  placeholder="Rincian lauk pauk, rasa, sambal, porsi, pelengkap..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                />
              </div>

              {/* FOTO MENU SECTION (MULTI-PHOTO) */}
              <div className="pt-2 border-t border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-[#1E3A2F]" />
                    <span className="font-bold text-stone-800 text-xs">
                      Foto Menu (Bisa Lebih Dari Satu)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold text-[11px] tabular-nums">
                    {(menuFormData.images?.length || 0)} Foto
                  </span>
                </div>

                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Foto pertama bertanda <strong className="text-emerald-800">★ Sampul Utama</strong> akan muncul di katalog utama. Foto tambahan dapat dilihat pelanggan di galeri pop-up.
                </p>

                {/* 3 Add Photo Methods Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Upload file from device */}
                  <label 
                    htmlFor="menu-photo-file-input"
                    className={`px-3 py-2 rounded-lg border border-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                      isProcessingPhotos ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {isProcessingPhotos ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    <span>{isProcessingPhotos ? 'Memproses Foto...' : 'Unggah Foto dari HP / Komputer'}</span>
                    <input
                      id="menu-photo-file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoFilesUpload}
                      disabled={isProcessingPhotos}
                    />
                  </label>

                  {/* Preset library picker toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPresetPicker(!showPresetPicker)}
                    className="px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pilih Foto Siap Pakai</span>
                  </button>
                </div>

                {/* Preset Picker Dropdown / Box */}
                {showPresetPicker && (
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-800 text-[11px]">
                        Koleksi Foto Kuliner Dapur Alamala (Klik untuk menambahkan):
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPresetPicker(false)}
                        className="text-stone-400 hover:text-stone-600 text-xs"
                      >
                        Tutup
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_CATALOG_IMAGES.map((preset, idx) => {
                        const isAlreadyAdded = menuFormData.images?.includes(preset.url);
                        return (
                          <div 
                            key={idx}
                            onClick={() => !isAlreadyAdded && handleAddPresetPhoto(preset.url)}
                            className={`p-1.5 rounded-lg border bg-white flex items-center gap-2 cursor-pointer transition-all ${
                              isAlreadyAdded 
                                ? 'opacity-50 border-stone-200 cursor-not-allowed' 
                                : 'hover:border-stone-400 hover:shadow-xs'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-10 h-10 rounded object-cover shrink-0 bg-stone-100"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-medium text-stone-800 block truncate">
                                {preset.name}
                              </span>
                              <span className="text-[9px] text-[#1E3A2F] font-semibold">
                                {isAlreadyAdded ? '✓ Terpasang' : '+ Tambah'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Online URL input */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="Atau tempel link gambar (https://...)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlPhoto}
                    disabled={!photoUrlInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white font-medium text-xs cursor-pointer"
                  >
                    Tambah Link
                  </button>
                </div>

                {/* CURRENT PHOTOS LIST / GALLERY */}
                <div className="space-y-2 pt-1">
                  <span className="font-semibold text-stone-700 text-xs block">
                    Daftar Foto Terpasang (Urutan Tampil):
                  </span>

                  {(!menuFormData.images || menuFormData.images.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-stone-300 text-center text-stone-500 text-xs bg-stone-50">
                      Belum ada foto yang ditambahkan. Silakan klik tombol unggah foto di atas.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {menuFormData.images.map((imgUrl, idx) => {
                        const isPrimary = idx === 0;
                        return (
                          <div 
                            key={idx}
                            className={`group relative rounded-xl border overflow-hidden bg-white shadow-xs transition-all ${
                              isPrimary ? 'border-emerald-600 ring-2 ring-emerald-600/30' : 'border-stone-200'
                            }`}
                          >
                            {/* Image Thumbnail */}
                            <div className="aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                              <img
                                src={imgUrl}
                                alt={`Foto ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Position Index Badge */}
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold backdrop-blur-xs">
                              #{idx + 1}
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white transition-colors cursor-pointer"
                              title="Hapus foto ini"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            {/* Footer / Primary Toggle */}
                            <div className="p-1.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                              {isPrimary ? (
                                <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                                  <span>Foto Utama</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryPhoto(idx)}
                                  className="text-[10px] text-stone-600 hover:text-emerald-800 font-semibold cursor-pointer underline flex items-center gap-0.5"
                                  title="Jadikan foto sampul utama di katalog"
                                >
                                  <span>Jadikan Utama</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingNewMenu(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPhotos}
                  className="px-5 py-2 bg-[#1E3A2F] hover:bg-[#162C23] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Menu &amp; Foto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROOF INSPECTION MODAL */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1C1917]">
                  Bukti Transfer {selectedProofModal.proof.stage === 'dp' ? 'DP 50%' : 'Pelunasan'}
                </h3>
                <span className="text-xs text-stone-500">
                  {selectedProofModal.request.name}
                </span>
              </div>
              <button onClick={() => setSelectedProofModal(null)} className="p-1 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="aspect-[4/3] bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                <img
                  src={selectedProofModal.proof.receipt_image}
                  alt="Bukti Transfer"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Nominal:</span>
                  <span className="text-[#1E3A2F] tabular-nums">{formatRupiah(selectedProofModal.proof.amount)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Pengirim:</span>
                  <span>{selectedProofModal.proof.sender_bank || 'BCA'} a.n. {selectedProofModal.proof.sender_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                {selectedProofModal.proof.status !== 'verified' ? (
                  <button
                    onClick={() => handleVerifyPayment(selectedProofModal.request.id, selectedProofModal.proof.id, true)}
                    className="w-full py-2.5 bg-[#1E3A2F] text-white font-semibold rounded text-xs cursor-pointer"
                  >
                    Verifikasi Pembayaran &amp; Kunci Jadwal
                  </button>
                ) : (
                  <div className="text-center text-xs font-semibold text-[#1E3A2F]">
                    ✓ Pembayaran telah diverifikasi sah
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ORDER MODAL */}
      {(isAddingNewOrder || editingOrder) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => {
            setIsAddingNewOrder(false);
            setEditingOrder(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-[#FAF8F5] shrink-0">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1C1917]">
                  {editingOrder ? 'Edit Data Pesanan Klien' : 'Catat Pesanan Baru (Manual)'}
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {editingOrder 
                    ? `Perbarui rincian pesanan #${editingOrder.id.slice(0, 8)}` 
                    : 'Input pesanan langsung dari telepon, WhatsApp, atau pelanggan offline.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsAddingNewOrder(false);
                  setEditingOrder(null);
                }} 
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Klien */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nama Pemesan (Klien) *</label>
                  <input
                    type="text"
                    required
                    value={orderFormData.name || ''}
                    onChange={(e) => setOrderFormData({ ...orderFormData, name: e.target.value })}
                    placeholder="Contoh: Ibu Rina / Pak Budi"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>

                {/* No WhatsApp */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nomor WhatsApp / HP *</label>
                  <input
                    type="tel"
                    required
                    value={orderFormData.phone || ''}
                    onChange={(e) => setOrderFormData({ ...orderFormData, phone: e.target.value })}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Jenis Acara */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Jenis Agenda Acara *</label>
                  <input
                    type="text"
                    required
                    value={orderFormData.event_type || ''}
                    onChange={(e) => setOrderFormData({ ...orderFormData, event_type: e.target.value })}
                    placeholder="Contoh: Syukuran Keluarga, Sertijab, Arisan, dll."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>

                {/* Tanggal Acara */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tanggal Pengantaran *</label>
                  <input
                    type="date"
                    required
                    value={orderFormData.event_date || ''}
                    onChange={(e) => setOrderFormData({ ...orderFormData, event_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Jumlah Porsi */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Jumlah Porsi (Pax) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={orderFormData.portions || 20}
                    onChange={(e) => {
                      const pax = Number(e.target.value);
                      const currentTotal = orderFormData.total_price || (pax * 28000);
                      setOrderFormData({
                        ...orderFormData,
                        portions: pax,
                        total_price: pax > 0 ? (pax * 28000) : currentTotal,
                        dp_amount: pax > 0 ? Math.round((pax * 28000) * 0.5) : Math.round(currentTotal * 0.5)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>

                {/* Total Tagihan */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Total Tagihan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={orderFormData.total_price || 0}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      setOrderFormData({
                        ...orderFormData,
                        total_price: total,
                        dp_amount: Math.round(total * 0.5)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>

                {/* Uang Muka DP */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Uang Muka (DP 50%)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={orderFormData.dp_amount || 0}
                    onChange={(e) => setOrderFormData({ ...orderFormData, dp_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>
              </div>

              {/* Status Pesanan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Status Progres *</label>
                  <select
                    value={orderFormData.status || 'Baru'}
                    onChange={(e) => {
                      const st = e.target.value as RequestStatus;
                      setOrderFormData({
                        ...orderFormData,
                        status: st,
                        payment_status: st === 'Lunas' ? 'fully_paid' : st === 'DP Dibayar' ? 'dp_paid' : (orderFormData.payment_status || 'unpaid')
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  >
                    <option value="Baru">Baru (Belum Ditindaklanjuti)</option>
                    <option value="Menu Dikirim">Menu Dikirim</option>
                    <option value="Dipesan">Dipesan (Menunggu DP)</option>
                    <option value="DP Dibayar">DP Dibayar (Jadwal Terkunci)</option>
                    <option value="Lunas">Lunas (100% Terbayar)</option>
                    <option value="Selesai">Selesai (Terkirim)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Alamat / Lokasi Pengantaran</label>
                  <input
                    type="text"
                    value={orderFormData.location || ''}
                    onChange={(e) => setOrderFormData({ ...orderFormData, location: e.target.value })}
                    placeholder="Contoh: Perumahan Tlogomas Indah, Lowokwaru"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  />
                </div>
              </div>

              {/* Catatan Khusus */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Catatan Khusus / Preferensi Menu</label>
                <textarea
                  rows={2}
                  value={orderFormData.notes || ''}
                  onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                  placeholder="Contoh: Tidak terlalu pedas, minta sambal dipisah, diantar tepat jam 11:30 WIB..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewOrder(false);
                    setEditingOrder(null);
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E3A2F] hover:bg-[#162C23] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingOrder ? 'Simpan Perubahan' : 'Catat Pesanan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CELEBRATORY LUNAS TOAST MODAL: Direct 1-Click WhatsApp Kwitansi Sender */}
      {justMarkedLunasRequest && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setJustMarkedLunasRequest(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden text-center p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Pesanan Telah LUNAS (100%)!
              </h3>
              <p className="text-xs text-stone-600">
                Status pesanan <strong>{justMarkedLunasRequest.name}</strong> ({justMarkedLunasRequest.event_type}) telah diperbarui menjadi <strong>Lunas</strong>.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-left space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>No. WhatsApp:</span>
                <span className="font-semibold text-stone-900">{justMarkedLunasRequest.phone}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Total Tagihan:</span>
                <span className="font-semibold text-emerald-800 font-serif text-sm">
                  {formatRupiah(justMarkedLunasRequest.total_price || (justMarkedLunasRequest.portions * 28000))}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  window.open(buildPaidInvoiceWhatsAppUrl(justMarkedLunasRequest), '_blank');
                  setJustMarkedLunasRequest(null);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Kwitansi Lunas ke WhatsApp Klien</span>
              </button>

              <button
                onClick={() => {
                  setSelectedInvoiceRequest(justMarkedLunasRequest);
                  setJustMarkedLunasRequest(null);
                }}
                className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-stone-600" />
                <span>Lihat / Cetak Invoice Resmi</span>
              </button>

              <button
                onClick={() => setJustMarkedLunasRequest(null)}
                className="w-full py-1.5 text-stone-400 hover:text-stone-600 text-xs font-medium cursor-pointer"
              >
                Tutup (Nanti Saja)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Invoice & Proposal Modal */}
      <OfficialInvoiceModal
        isOpen={!!selectedInvoiceRequest}
        onClose={() => setSelectedInvoiceRequest(null)}
        request={selectedInvoiceRequest}
      />

    </div>
  );
};
