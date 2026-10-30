import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Download, 
  Calendar, 
  Printer, 
  PackageCheck, 
  CreditCard, 
  CheckCircle2, 
  PieChart, 
  BarChart3, 
  ArrowUpRight,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { CateringRequest, Menu } from '../../types';
import { formatRupiah } from '../../lib/formatters';

interface SalesReportSectionProps {
  requests: CateringRequest[];
  menus: Menu[];
  onOpenInvoice?: (request: CateringRequest) => void;
}

export const SalesReportSection: React.FC<SalesReportSectionProps> = ({
  requests,
  menus,
  onOpenInvoice
}) => {
  const [timeframe, setTimeframe] = useState<'all' | 'this_month' | 'last_30_days' | 'last_month'>('all');

  // Filter requests based on selected timeframe
  const filteredRequests = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    
    // Previous month string
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    // 30 days ago timestamp
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400 * 1000).toISOString();

    return requests.filter(req => {
      const reqDate = req.event_date || req.created_at.slice(0, 10);
      if (timeframe === 'this_month') {
        return reqDate.startsWith(currentMonth);
      }
      if (timeframe === 'last_month') {
        return reqDate.startsWith(lastMonth);
      }
      if (timeframe === 'last_30_days') {
        return req.created_at >= thirtyDaysAgo;
      }
      return true;
    });
  }, [requests, timeframe]);

  // Aggregate Sales KPIs
  const report = useMemo(() => {
    let grossRevenue = 0;
    let realizedCash = 0;
    let accountsReceivable = 0;
    let totalPortions = 0;
    let fullyPaidCount = 0;
    let dpPaidCount = 0;

    // Category Sales breakdown
    const categoryRevenue: Record<string, { revenue: number; portions: number }> = {
      nasi_box: { revenue: 0, portions: 0 },
      tumpeng: { revenue: 0, portions: 0 },
      snack_box: { revenue: 0, portions: 0 },
      puding_dessert: { revenue: 0, portions: 0 },
    };

    // Item Sales ranking
    const itemSales: Record<string, { name: string; portions: number; revenue: number }> = {};

    filteredRequests.forEach(req => {
      totalPortions += (req.portions || 0);

      // Compute total request value
      let reqTotal = req.total_price || 0;
      if (!reqTotal && req.menus && req.menus.length > 0) {
        reqTotal = req.menus.reduce((sum, item) => {
          const unit = item.custom_price || item.menu?.price || 0;
          return sum + (unit * (req.portions || 1));
        }, 0);
      }
      if (!reqTotal) {
        reqTotal = (req.portions || 10) * 28000;
      }

      grossRevenue += reqTotal;

      const isFull = req.payment_status === 'fully_paid' || req.status === 'Lunas' || req.status === 'Selesai';
      const isDp = req.payment_status === 'dp_paid' || req.status === 'DP Dibayar';

      if (isFull) {
        realizedCash += reqTotal;
        fullyPaidCount++;
      } else if (isDp) {
        const dpVal = req.dp_amount || Math.round(reqTotal * 0.5);
        realizedCash += dpVal;
        accountsReceivable += (reqTotal - dpVal);
        dpPaidCount++;
      } else {
        accountsReceivable += reqTotal;
      }

      // Attribute to menus & categories
      if (req.menus && req.menus.length > 0) {
        req.menus.forEach(m => {
          const cat = m.menu?.category || 'nasi_box';
          const unit = m.custom_price || m.menu?.price || 28000;
          const portionPart = req.portions || 1;
          const val = unit * portionPart;

          if (categoryRevenue[cat]) {
            categoryRevenue[cat].revenue += val;
            categoryRevenue[cat].portions += portionPart;
          }

          const menuName = m.menu?.name || 'Paket Hidangan';
          if (!itemSales[menuName]) {
            itemSales[menuName] = { name: menuName, portions: 0, revenue: 0 };
          }
          itemSales[menuName].portions += portionPart;
          itemSales[menuName].revenue += val;
        });
      } else {
        categoryRevenue['nasi_box'].revenue += reqTotal;
        categoryRevenue['nasi_box'].portions += (req.portions || 0);
      }
    });

    const averageOrderValue = filteredRequests.length > 0 ? Math.round(grossRevenue / filteredRequests.length) : 0;
    const sortedTopDishes = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      orderCount: filteredRequests.length,
      grossRevenue,
      realizedCash,
      accountsReceivable,
      totalPortions,
      averageOrderValue,
      fullyPaidCount,
      dpPaidCount,
      categoryRevenue,
      sortedTopDishes
    };
  }, [filteredRequests]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No Invoice', 'Tanggal Acara', 'Nama Klien', 'No WhatsApp', 'Tipe Acara', 'Porsi (Pax)', 'Total Omset', 'Kas Diterima (DP/Lunas)', 'Sisa Piutang', 'Status Pembayaran'];
    const rows = filteredRequests.map(r => {
      let reqTotal = r.total_price || (r.portions * 28000);
      const isFull = r.payment_status === 'fully_paid' || r.status === 'Lunas' || r.status === 'Selesai';
      const isDp = r.payment_status === 'dp_paid' || r.status === 'DP Dibayar';
      const cash = isFull ? reqTotal : isDp ? (r.dp_amount || reqTotal * 0.5) : 0;
      const remaining = reqTotal - cash;

      return [
        `"INV-${r.id.slice(0, 8)}"`,
        `"${r.event_date || '-'}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.phone}"`,
        `"${(r.event_type || '-').replace(/"/g, '""')}"`,
        r.portions,
        reqTotal,
        cash,
        remaining,
        `"${r.payment_status || r.status}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_penjualan_alamala_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#1E3A2F]" />
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Periode Laporan:
          </span>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'last_30_days', label: '30 Hari Terakhir' },
              { id: 'last_month', label: 'Bulan Lalu' },
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak ringkasan laporan penjualan"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>Cetak Ringkasan</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-[#1E3A2F] hover:bg-[#162C23] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Unduh data pembukuan ke format CSV Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Total Omset Kotor</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums mt-1 block">
            {formatRupiah(report.grossRevenue)}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Dari {report.orderCount} transaksi tercatat
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Kas Masuk Realisasi</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-teal-800 tabular-nums mt-1 block">
            {formatRupiah(report.realizedCash)}
          </span>
          <span className="text-[11px] text-teal-700 mt-1 block">
            DP diverifikasi &amp; pelunasan masuk
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Sisa Piutang Berjalan</span>
            <CreditCard className="w-4 h-4 text-[#9B381E]" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-[#9B381E] tabular-nums mt-1 block">
            {formatRupiah(report.accountsReceivable)}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Tagihan pelunasan saat kirim / H-1
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Total Porsi Terjual</span>
            <PackageCheck className="w-4 h-4 text-[#1E3A2F]" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums mt-1 block">
            {report.totalPortions.toLocaleString('id-ID')} <span className="text-sm font-sans font-normal text-stone-500">Pax</span>
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Rata-rata: {formatRupiah(report.averageOrderValue)} /pesanan
          </span>
        </div>
      </div>

      {/* Visual Analytics Grid: Category Distribution & Top Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#1E3A2F]" />
              <span>Kontribusi Penjualan per Kategori</span>
            </h3>
            <span className="text-xs text-stone-500 font-medium">Omset &amp; Porsi</span>
          </div>

          <div className="space-y-3">
            {[
              { id: 'nasi_box', label: 'Nasi Box Premium', data: report.categoryRevenue['nasi_box'], color: 'bg-emerald-600' },
              { id: 'tumpeng', label: 'Tumpeng Tradisional', data: report.categoryRevenue['tumpeng'], color: 'bg-amber-600' },
              { id: 'snack_box', label: 'Snack Box Tradisional', data: report.categoryRevenue['snack_box'], color: 'bg-blue-600' },
              { id: 'puding_dessert', label: 'Puding & Dessert', data: report.categoryRevenue['puding_dessert'], color: 'bg-rose-500' },
            ].map((cat) => {
              const percentage = report.grossRevenue > 0 ? Math.round((cat.data.revenue / report.grossRevenue) * 100) : 0;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-stone-800">{cat.label}</span>
                    <span className="text-stone-600 font-medium tabular-nums">
                      {formatRupiah(cat.data.revenue)} ({percentage}%) · {cat.data.portions} Pax
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Dishes */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#9B381E]" />
              <span>Top 5 Hidangan Paling Laris</span>
            </h3>
            <span className="text-xs text-stone-500 font-medium">Berdasarkan Omset</span>
          </div>

          {report.sortedTopDishes.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 italic">
              Belum ada data hidangan terjual pada rentang waktu ini.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 text-xs">
              {report.sortedTopDishes.map((dish, rank) => (
                <div key={dish.name} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      rank === 0 ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {rank + 1}
                    </span>
                    <span className="font-medium text-stone-900">{dish.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">{formatRupiah(dish.revenue)}</span>
                    <span className="text-[10px] text-stone-500">{dish.portions} porsi</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Financial Transactions Ledger Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="font-bold text-xs sm:text-sm text-stone-800 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#1E3A2F]" />
            <span>Daftar Transaksi Penjualan ({filteredRequests.length} Rekap)</span>
          </div>
          <span className="text-xs text-stone-500">
            Total Omset: <strong>{formatRupiah(report.grossRevenue)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3 px-4">No. Invoice &amp; Tanggal</th>
                <th className="py-3 px-4">Klien &amp; Acara</th>
                <th className="py-3 px-4 text-center">Porsi</th>
                <th className="py-3 px-4 text-right">Total Nilai</th>
                <th className="py-3 px-4 text-right">Kas Diterima</th>
                <th className="py-3 px-4 text-right">Sisa Piutang</th>
                <th className="py-3 px-4 text-center">Status</th>
                {onOpenInvoice && <th className="py-3 px-4 text-center">Invoice</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRequests.map(r => {
                let reqTotal = r.total_price || (r.portions * 28000);
                const isFull = r.payment_status === 'fully_paid' || r.status === 'Lunas' || r.status === 'Selesai';
                const isDp = r.payment_status === 'dp_paid' || r.status === 'DP Dibayar';
                const cash = isFull ? reqTotal : isDp ? (r.dp_amount || reqTotal * 0.5) : 0;
                const remaining = reqTotal - cash;

                return (
                  <tr key={r.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-stone-900 block">
                        INV-{r.id.slice(0, 8)}
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        {r.event_date || new Date(r.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-900 block">{r.name}</span>
                      <span className="text-[11px] text-stone-500 block">{r.event_type}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {r.portions} Pax
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-stone-900">
                      {formatRupiah(reqTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-teal-700">
                      {formatRupiah(cash)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-stone-600">
                      {remaining === 0 ? <span className="text-emerald-700">Lunas</span> : formatRupiah(remaining)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isFull ? 'bg-emerald-100 text-emerald-800' : isDp ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isFull ? 'Lunas' : isDp ? 'DP Masuk' : 'Menunggu DP'}
                      </span>
                    </td>
                    {onOpenInvoice && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onOpenInvoice(r)}
                          className="px-2 py-1 rounded border border-stone-300 hover:bg-stone-100 text-[11px] font-medium text-stone-700 flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-[#1E3A2F]" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
