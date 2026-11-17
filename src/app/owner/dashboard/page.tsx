'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, AlertTriangle, Flame, RefreshCw, Layers } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function OwnerDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealDbStats();
  }, []);

  const fetchRealDbStats = async () => {
    setLoading(true);
    try {
      const [ordRes, ingRes, menuRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/inventory'),
        fetch('/api/menu'),
      ]);

      if (ordRes.ok) setOrders(await ordRes.json());
      if (ingRes.ok) {
        const data = await ingRes.json();
        setIngredients(data.ingredients || []);
      }
      if (menuRes.ok) setMenus(await menuRes.json());
    } finally {
      setLoading(false);
    }
  };

  // Calculations from real DB data
  const totalRevenue = orders
    .filter((o) => o.payment?.status === 'PAID' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrders = orders.length;
  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED' || o.payment?.status === 'PAID').length;

  // Best seller menu calculation
  const menuSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};
  orders.forEach((o) => {
    o.orderItems?.forEach((item: any) => {
      const name = item.menu?.name || item.menuName || 'Menu';
      if (!menuSalesMap[name]) {
        menuSalesMap[name] = { name, qty: 0, revenue: 0 };
      }
      menuSalesMap[name].qty += item.quantity;
      menuSalesMap[name].revenue += item.subtotal;
    });
  });

  const bestSellers = Object.values(menuSalesMap).sort((a, b) => b.qty - a.qty);
  const lowStockItems = ingredients.filter((i) => i.stock <= i.minStock);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-coffee-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-blue-700" /> Read-Only Analytics (Real DB Data)
          </div>
          <h1 className="text-2xl font-extrabold text-coffee-950">Dashboard Performa Bisnis Owner</h1>
          <p className="text-xs text-coffee-600">Laporan real-time pendapatan, volume pesanan, menu terlaris, dan stok cafe.</p>
        </div>

        <button
          onClick={fetchRealDbStats}
          className="p-2.5 rounded-xl bg-white border border-coffee-200 text-coffee-800 hover:bg-coffee-50 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync DB Stats
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-coffee-500 uppercase tracking-wider">Total Pendapatan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-coffee-950 block">{formatRupiah(totalRevenue)}</span>
          <span className="text-[11px] text-emerald-600 font-medium">✓ Berasal dari transaksi lunas</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-coffee-500 uppercase tracking-wider">Total Pesanan</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-coffee-950 block">{totalOrders} Trx</span>
          <span className="text-[11px] text-blue-600 font-medium">{completedOrdersCount} Pesanan Selesai Diproses</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-coffee-500 uppercase tracking-wider">Varian Menu Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-coffee-950 block">{menus.filter((m) => m.isAvailable).length} Menu</span>
          <span className="text-[11px] text-amber-700 font-medium">Dari {menus.length} Total Katalog</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-coffee-500 uppercase tracking-wider">Alert Stok Menipis</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-coffee-950 block">{lowStockItems.length} Bahan</span>
          <span className={`text-[11px] font-medium ${lowStockItems.length > 0 ? 'text-red-600 font-bold' : 'text-emerald-600'}`}>
            {lowStockItems.length > 0 ? 'Perlu Pengadaan Segera' : 'Semua Stok Aman'}
          </span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Best Seller Ranking */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-coffee-100 pb-3">
            <h2 className="font-bold text-coffee-950 text-base flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" /> Peringkat Menu Terlaris (Best Seller)
            </h2>
            <span className="text-xs text-coffee-500 font-medium">Berdasarkan Volume Penjualan DB</span>
          </div>

          <div className="divide-y divide-coffee-100">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-coffee-500 py-6 italic text-center">Belum ada data penjualan tercatat.</p>
            ) : (
              bestSellers.map((item, idx) => (
                <div key={item.name} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      idx === 0 ? 'bg-amber-400 text-coffee-950' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-coffee-100 text-coffee-800'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-coffee-950 block text-sm">{item.name}</span>
                      <span className="text-coffee-500 text-[11px]">{item.qty} Porsi Terjual</span>
                    </div>
                  </div>

                  <span className="font-extrabold text-coffee-950 text-sm">{formatRupiah(item.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-coffee-100 pb-3">
            <h2 className="font-bold text-coffee-950 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Stok Menipis (Need Reorder)
            </h2>
          </div>

          <div className="divide-y divide-coffee-100">
            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 space-y-1">
                <span className="font-bold block">✓ Kondisi Inventaris Sangat Baik</span>
                <span className="text-coffee-500">Tidak ada bahan baku yang berada di bawah stok batas minimum.</span>
              </div>
            ) : (
              lowStockItems.map((ing) => (
                <div key={ing.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-coffee-950 block">{ing.name}</span>
                    <span className="text-coffee-500 text-[11px]">Batas Min: {ing.minStock} {ing.unit}</span>
                  </div>
                  <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {ing.stock} {ing.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
