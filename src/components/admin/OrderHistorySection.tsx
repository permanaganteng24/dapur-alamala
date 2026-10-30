import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ArrowUpDown, 
  ExternalLink, 
  Copy, 
  Check, 
  MessageCircle, 
  FileText, 
  X,
  PackageCheck,
  TrendingUp,
  Receipt,
  Printer
} from 'lucide-react';
import { CateringRequest, RequestStatus } from '../../types';
import { formatRupiah, buildOwnerFollowUpWhatsAppUrl, buildPaidInvoiceWhatsAppUrl } from '../../lib/supabase';

interface OrderHistorySectionProps {
  requests: CateringRequest[];
  onStatusChange: (requestId: string, newStatus: RequestStatus) => Promise<void>;
  onOpenProposalPreview: (requestId: string) => void;
  onVerifyPayment?: (requestId: string, proofId: string, approve: boolean) => Promise<void>;
  onOpenInvoice?: (request: CateringRequest) => void;
}

export const OrderHistorySection: React.FC<OrderHistorySectionProps> = ({
  requests,
  onStatusChange,
  onOpenProposalPreview,
  onVerifyPayment,
  onOpenInvoice
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past' | 'this_month'>('all');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'event_date' | 'portions_desc' | 'total_desc'>('created_desc');
  
  // Selected Request for Full Inspector Modal
  const [inspectingOrder, setInspectingOrder] = useState<CateringRequest | null>(null);
  const [copiedLinkForId, setCopiedLinkForId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Calculate Cumulative Metrics
  const metrics = useMemo(() => {
    let totalPortions = 0;
    let totalRevenue = 0;
    let completedCount = 0;
    let dpPaidCount = 0;

    requests.forEach(req => {
      totalPortions += (req.portions || 0);
      
      // Calculate revenue if total_price exists or from menus
      let calculatedPrice = req.total_price || 0;
      if (!calculatedPrice && req.menus && req.menus.length > 0) {
        calculatedPrice = req.menus.reduce((sum, item) => {
          const unit = item.custom_price || item.menu?.price || 0;
          return sum + (unit * (req.portions || 1));
        }, 0);
      }
      
      if (req.payment_status === 'fully_paid' || req.status === 'Lunas' || req.status === 'Selesai') {
        totalRevenue += calculatedPrice;
      } else if (req.payment_status === 'dp_paid' || req.status === 'DP Dibayar') {
        totalRevenue += req.dp_amount || Math.round(calculatedPrice * 0.5);
      }

      if (req.status === 'Selesai') completedCount++;
      if (req.status === 'DP Dibayar' || req.payment_status === 'dp_paid') dpPaidCount++;
    });

    return {
      totalOrders: requests.length,
      totalPortions,
      totalRevenue,
      completedCount,
      dpPaidCount
    };
  }, [requests]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    return requests.filter(req => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = req.name?.toLowerCase().includes(q);
        const matchesPhone = req.phone?.includes(q);
        const matchesEvent = req.event_type?.toLowerCase().includes(q);
        const matchesId = req.id?.toLowerCase().includes(q);
        const matchesLocation = req.location?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEvent && !matchesId && !matchesLocation) {
          return false;
        }
      }

      // Status matching
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'dp_paid') {
          if (req.status !== 'DP Dibayar' && req.payment_status !== 'dp_paid') return false;
        } else if (selectedStatus === 'fully_paid') {
          if (req.status !== 'Lunas' && req.payment_status !== 'fully_paid' && req.status !== 'Selesai') return false;
        } else if (req.status !== selectedStatus) {
          return false;
        }
      }

      // Timeframe matching
      if (timeFilter === 'upcoming') {
        if (!req.event_date || req.event_date < today) return false;
      } else if (timeFilter === 'past') {
        if (!req.event_date || req.event_date >= today) return false;
      } else if (timeFilter === 'this_month') {
        if (!req.event_date || !req.event_date.startsWith(currentMonth)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'created_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'event_date') {
        return (a.event_date || '').localeCompare(b.event_date || '');
      }
      if (sortBy === 'portions_desc') {
        return (b.portions || 0) - (a.portions || 0);
      }
      if (sortBy === 'total_desc') {
        const totalA = a.total_price || ((a.menus?.[0]?.custom_price || 25000) * a.portions);
        const totalB = b.total_price || ((b.menus?.[0]?.custom_price || 25000) * b.portions);
        return totalB - totalA;
      }
      return 0;
    });
  }, [requests, searchQuery, selectedStatus, timeFilter, sortBy]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID Pesanan', 'Tanggal Submit', 'Nama Pelanggan', 'No. WhatsApp', 'Tipe Acara', 'Tanggal Acara', 'Porsi (Pax)', 'Lokasi', 'Status Pesanan', 'Status Pembayaran', 'Estimasi Total'];
    
    const rows = filteredOrders.map(req => {
      const estimatedTotal = req.total_price || (req.menus && req.menus.length > 0 
        ? req.menus.reduce((s, m) => s + (m.custom_price || m.menu?.price || 0) * (req.portions || 1), 0)
        : req.portions * 28000);
      
      return [
        `"${req.id}"`,
        `"${new Date(req.created_at).toLocaleDateString('id-ID')}"`,
        `"${req.name.replace(/"/g, '""')}"`,
        `"${req.phone}"`,
        `"${(req.event_type || '-').replace(/"/g, '""')}"`,
        `"${req.event_date || '-'}"`,
        req.portions || 0,
        `"${(req.location || 'Malang').replace(/"/g, '""')}"`,
        `"${req.status}"`,
        `"${req.payment_status || 'unpaid'}"`,
        estimatedTotal
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat_pesanan_dapur_alamala_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyProposalUrl = (id: string) => {
    const origin = window.location.origin;
    const url = `${origin}/#menu/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkForId(id);
    setTimeout(() => setCopiedLinkForId(null), 2500);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'Baru':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">Baru</span>;
      case 'Menu Dikirim':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-200">Menu Dikirim</span>;
      case 'Dipesan':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-900 border border-indigo-200">Dipesan</span>;
      case 'DP Dibayar':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">DP Dibayar</span>;
      case 'Lunas':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1E3A2F] text-white">Lunas</span>;
      case 'Selesai':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-800 text-stone-100">Selesai</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Historical Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Total Catatan Pesanan</span>
            <FileText className="w-4 h-4 text-stone-400" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums mt-1 block">
            {metrics.totalOrders}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Semua riwayat pengajuan klien
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Total Porsi Dilayani</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-900 tabular-nums mt-1 block">
            {metrics.totalPortions.toLocaleString('id-ID')} <span className="text-sm font-sans font-normal text-stone-500">Pax</span>
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            Akumulasi pesanan tercatat
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Estimasi Omset Tercatat</span>
            <TrendingUp className="w-4 h-4 text-[#9B381E]" />
          </div>
          <span className="font-serif text-xl sm:text-2xl font-bold text-[#9B381E] tabular-nums mt-1 block">
            {formatRupiah(metrics.totalRevenue)}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Dari DP & Pelunasan masuk
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Pesanan Selesai / Lunas</span>
            <CheckCircle2 className="w-4 h-4 text-[#1E3A2F]" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1E3A2F] tabular-nums mt-1 block">
            {metrics.completedCount} <span className="text-xs font-sans font-normal text-stone-500">selesai</span>
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            +{metrics.dpPaidCount} jadwal sedang proses
          </span>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Export */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama klien, no. WhatsApp, acara, lokasi, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A2F]/20 focus:border-[#1E3A2F]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh data riwayat pesanan dalam format CSV untuk Excel"
            >
              <Download className="w-3.5 h-3.5 text-[#1E3A2F]" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Badges & Sorters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mr-1">Status:</span>
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'Baru', label: 'Baru' },
              { id: 'Menu Dikirim', label: 'Menu Dikirim' },
              { id: 'dp_paid', label: 'DP Masuk' },
              { id: 'fully_paid', label: 'Lunas' },
              { id: 'Selesai', label: 'Selesai' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-[#1E3A2F] text-white font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Timeframe & Sort Selectors */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-2 py-1 rounded border border-stone-300 text-xs text-stone-700 bg-white"
              >
                <option value="all">Semua Waktu</option>
                <option value="this_month">Bulan Ini</option>
                <option value="upcoming">Acara Mendatang</option>
                <option value="past">Acara Lalu</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 rounded border border-stone-300 text-xs text-stone-700 bg-white"
              >
                <option value="created_desc">Submit: Terbaru</option>
                <option value="created_asc">Submit: Terlama</option>
                <option value="event_date">Jadwal Acara</option>
                <option value="portions_desc">Porsi Terbanyak</option>
                <option value="total_desc">Nilai Terbesar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table / Cards */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="font-serif font-bold text-base text-stone-800">
              Tidak ada data riwayat pesanan yang cocok
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah filter status di atas untuk melihat catatan lainnya.
            </p>
            {(searchQuery || selectedStatus !== 'all' || timeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setTimeFilter('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Klien & ID</th>
                  <th className="py-3 px-4">Acara & Lokasi</th>
                  <th className="py-3 px-4">Tanggal Acara</th>
                  <th className="py-3 px-4 text-center">Porsi</th>
                  <th className="py-3 px-4">Status & Pembayaran</th>
                  <th className="py-3 px-4 text-right">Estimasi Nilai</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-800">
                {filteredOrders.map((req) => {
                  const estimatedTotal = req.total_price || (req.menus && req.menus.length > 0 
                    ? req.menus.reduce((s, m) => s + (m.custom_price || m.menu?.price || 0) * (req.portions || 1), 0)
                    : req.portions * 28000);
                  
                  return (
                    <tr 
                      key={req.id} 
                      className="hover:bg-stone-50/60 transition-colors group cursor-pointer"
                      onClick={() => setInspectingOrder(req)}
                    >
                      {/* Client Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 group-hover:text-[#1E3A2F] transition-colors">
                          {req.name}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>#{req.id.slice(0, 8)}</span>
                          <span>·</span>
                          <span>{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </td>

                      {/* Event Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-800 line-clamp-1">
                          {req.event_type || 'Pesanan Catering'}
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{req.location || 'Kota Malang'}</span>
                        </div>
                      </td>

                      {/* Event Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-stone-700">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{req.event_date || 'Belum diisi'}</span>
                        </div>
                      </td>

                      {/* Portions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold text-[11px]">
                          {req.portions} Pax
                        </span>
                      </td>

                      {/* Status & Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(req.status)}
                          {req.payment_status === 'fully_paid' ? (
                            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Lunas
                            </span>
                          ) : req.payment_status === 'dp_paid' ? (
                            <span className="text-[10px] text-teal-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> DP 50% Masuk
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400 font-medium">
                              Belum Transfer
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estimated Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-serif font-bold text-stone-900 block">
                          {formatRupiah(estimatedTotal)}
                        </span>
                        {req.dp_amount ? (
                          <span className="text-[10px] text-stone-500 block">
                            DP: {formatRupiah(req.dp_amount)}
                          </span>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setInspectingOrder(req)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-[#1E3A2F] hover:bg-stone-100 transition-colors"
                            title="Buka rincian lengkap pesanan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {(req.status === 'Lunas' || req.payment_status === 'fully_paid') ? (
                            <button
                              onClick={() => window.open(buildPaidInvoiceWhatsAppUrl(req), '_blank')}
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                              title="Kirim Kwitansi & Invoice Lunas Resmi ke WA Klien"
                            >
                              <Receipt className="w-4 h-4 text-emerald-700" />
                            </button>
                          ) : (
                            <a
                              href={buildOwnerFollowUpWhatsAppUrl(req)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#1E3A2F] hover:bg-emerald-50 transition-colors"
                              title="Chat WhatsApp Klien"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {onOpenInvoice && (
                            <button
                              onClick={() => onOpenInvoice(req)}
                              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Lihat / Cetak Invoice Resmi"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleCopyProposalUrl(req.id)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                            title="Salin tautan proposal/nota digital"
                          >
                            {copiedLinkForId === req.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deep-Dive Order Detail Inspector Modal */}
      <AnimatePresence>
        {inspectingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-stone-200 my-8 text-left"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-stone-900">
                      Rincian Riwayat Pesanan
                    </h3>
                    {getStatusBadge(inspectingOrder.status)}
                  </div>
                  <p className="text-xs text-stone-500 font-mono mt-1">
                    ID: {inspectingOrder.id} · Diterima pada {new Date(inspectingOrder.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => setInspectingOrder(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client & Event Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-xl border border-stone-200 text-xs">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    Informasi Klien
                  </div>
                  <div className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#1E3A2F]" />
                    <span>{inspectingOrder.name}</span>
                  </div>
                  <div className="text-stone-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{inspectingOrder.phone}</span>
                    <a
                      href={buildOwnerFollowUpWhatsAppUrl(inspectingOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-[#1E3A2F] font-semibold hover:underline flex items-center gap-1"
                      title={`Follow-up klien via WhatsApp dengan template status: ${inspectingOrder.status}`}
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Chat WA ({inspectingOrder.status})</span>
                    </a>
                  </div>
                  <div className="text-stone-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{inspectingOrder.location || 'Wilayah Malang Raya'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    Detail Acara
                  </div>
                  <div className="font-bold text-stone-900">
                    {inspectingOrder.event_type || 'Acara Syukuran'}
                  </div>
                  <div className="text-stone-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Tanggal: <strong>{inspectingOrder.event_date || 'Belum diisi'}</strong></span>
                  </div>
                  <div className="text-stone-600 flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-stone-400" />
                    <span>Jumlah Porsi: <strong>{inspectingOrder.portions} Pax</strong></span>
                  </div>
                  {inspectingOrder.budget && (
                    <div className="text-stone-600">
                      Target Budget: {inspectingOrder.budget}
                    </div>
                  )}
                </div>
              </div>

              {/* Special Notes */}
              {inspectingOrder.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-amber-900 block">Catatan Khusus Klien:</span>
                  <p className="text-amber-800 italic">"{inspectingOrder.notes}"</p>
                </div>
              )}

              {/* Ordered Menus Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Paket Menu Terpilih
                </div>
                {inspectingOrder.menus && inspectingOrder.menus.length > 0 ? (
                  <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
                    {inspectingOrder.menus.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                          {item.menu?.image_url && (
                            <img
                              src={item.menu.image_url}
                              alt={item.menu.name}
                              className="w-12 h-10 object-cover rounded-md border border-stone-200 shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-semibold text-stone-900 block">
                              {item.menu?.name || 'Hidangan Pilihan'}
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              {item.note || 'Porsi lengkap standar Dapur Alamala'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-stone-900 block">
                            {formatRupiah(item.custom_price || item.menu?.price || 0)} /pax
                          </span>
                          <span className="text-[11px] text-stone-500 block">
                            Subtotal: {formatRupiah((item.custom_price || item.menu?.price || 0) * (inspectingOrder.portions || 1))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-500 italic">
                    Belum ada menu khusus yang dikurasi. Sistem menggunakan paket rekomendasi standar Dapur Alamala.
                  </div>
                )}
              </div>

              {/* Payment & Verification Log */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Status Pembayaran & Bukti Transfer
                </div>
                {inspectingOrder.payment_proofs && inspectingOrder.payment_proofs.length > 0 ? (
                  <div className="space-y-2">
                    {inspectingOrder.payment_proofs.map((proof) => (
                      <div key={proof.id} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-900">
                            {proof.stage === 'dp' ? 'DP 50%' : 'Pelunasan'} — {formatRupiah(proof.amount)}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            Bank {proof.sender_bank || 'BCA'} a.n. {proof.sender_name || inspectingOrder.name} · {new Date(proof.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            proof.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {proof.status === 'verified' ? 'Terverifikasi' : 'Perlu Dicek'}
                          </span>
                          {proof.receipt_image && (
                            <a
                              href={proof.receipt_image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded border border-stone-300 text-stone-700 bg-white hover:bg-stone-100 text-[11px]"
                            >
                              Lihat Gambar
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-500">
                    Belum ada bukti transfer yang dilampirkan oleh pelanggan.
                  </div>
                )}
              </div>

              {/* Status Update Quick Controller */}
              <div className="p-4 bg-stone-100 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-stone-800">
                  Ubah Status Pesanan Ini:
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={inspectingOrder.status}
                    disabled={isUpdatingStatus}
                    onChange={async (e) => {
                      const newStatus = e.target.value as RequestStatus;
                      setIsUpdatingStatus(true);
                      await onStatusChange(inspectingOrder.id, newStatus);
                      setInspectingOrder({ ...inspectingOrder, status: newStatus });
                      setIsUpdatingStatus(false);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-900 cursor-pointer"
                  >
                    <option value="Baru">Status: Baru (Menunggu Respon)</option>
                    <option value="Menu Dikirim">Status: Menu Dikirim (Proposal Terkirim)</option>
                    <option value="Dipesan">Status: Dipesan (Pelanggan Konfirmasi)</option>
                    <option value="DP Dibayar">Status: DP Dibayar (Jadwal Terkunci)</option>
                    <option value="Lunas">Status: Lunas (Pembayaran Selesai)</option>
                    <option value="Selesai">Status: Selesai (Catering Telah Diantar)</option>
                  </select>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                <div className="flex flex-wrap items-center gap-2">
                  {(inspectingOrder.status === 'Lunas' || inspectingOrder.payment_status === 'fully_paid') && (
                    <button
                      onClick={() => window.open(buildPaidInvoiceWhatsAppUrl(inspectingOrder), '_blank')}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Kirim kwitansi lunas dan bukti pembayaran sah ke WhatsApp pembeli"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Kirim Kwitansi Lunas ke WA</span>
                    </button>
                  )}
                  <button
                    onClick={() => onOpenProposalPreview(inspectingOrder.id)}
                    className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Lihat Halaman Klien</span>
                  </button>
                  {onOpenInvoice && (
                    <button
                      onClick={() => onOpenInvoice(inspectingOrder)}
                      className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Cetak surat penawaran & invoice resmi"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Cetak Invoice</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyProposalUrl(inspectingOrder.id)}
                    className="px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedLinkForId === inspectingOrder.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Link</span>
                  </button>
                </div>

                <button
                  onClick={() => setInspectingOrder(null)}
                  className="px-4 py-2 rounded-lg bg-[#1E3A2F] text-white text-xs font-semibold hover:bg-[#162C23] transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
