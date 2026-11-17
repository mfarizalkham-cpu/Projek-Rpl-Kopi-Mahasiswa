'use client';

import { useState, useEffect } from 'react';
import { Store, RefreshCw, CheckCircle, Clock, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function KasirOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    setUpdatingId(orderId);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah status pesanan');
      }

      fetchOrders();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'ALL') return true;
    return order.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-coffee-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-coffee-950 flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-600" /> Point of Sale (POS) & Processing Order Kasir
          </h1>
          <p className="text-xs text-coffee-600">Proses pesanan masuk, konfirmasi pembayaran, dan ubah status pesanan.</p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl bg-white border border-coffee-200 text-coffee-800 hover:bg-coffee-50 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Orders
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['ALL', 'PENDING', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filterStatus === st
                ? 'bg-coffee-900 text-amber-300 shadow'
                : 'bg-white border border-coffee-200 text-coffee-700 hover:bg-coffee-50'
            }`}
          >
            {st === 'ALL' ? 'Semua Pesanan' : st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-coffee-500">Memuat pesanan POS kasir...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-coffee-200 space-y-2">
          <Store className="w-10 h-10 text-coffee-300 mx-auto" />
          <h3 className="font-bold text-coffee-950">Tidak Ada Pesanan Dalam Kategori Ini</h3>
          <p className="text-xs text-coffee-500">Seluruh pesanan telah diproses oleh barista & kasir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const isUpdating = updatingId === order.id;
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-coffee-100 pb-2">
                    <div>
                      <span className="font-extrabold text-coffee-950 text-base">{order.orderNumber}</span>
                      <span className="text-xs text-coffee-600 font-bold block">{order.customerName}</span>
                    </div>

                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                        order.status === 'COMPLETED'
                          ? 'bg-emerald-600 text-white'
                          : order.status === 'PROCESSING'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="bg-coffee-50/60 rounded-2xl p-3 divide-y divide-coffee-100/60 text-xs">
                    {order.orderItems?.map((item: any) => (
                      <div key={item.id} className="py-1.5 flex justify-between">
                        <span className="font-semibold text-coffee-950">
                          {item.menu?.name || item.menuName} <strong className="text-coffee-600">x{item.quantity}</strong>
                        </span>
                        <span className="font-bold text-coffee-900">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-xl border border-amber-200">
                      Catatan: {order.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-coffee-500">Metode: </span>
                      <span className="font-bold text-coffee-950">{order.payment?.paymentMethod || 'QRIS'}</span>
                    </div>
                    <div>
                      <span className="text-coffee-500">Bayar: </span>
                      <span
                        className={`font-bold ${
                          order.payment?.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {order.payment?.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-coffee-100 space-y-2">
                  <div className="flex justify-between items-center text-sm font-extrabold text-coffee-950 mb-2">
                    <span>Total Transaksi</span>
                    <span>{formatRupiah(order.totalAmount)}</span>
                  </div>

                  {/* Payment Confirmation */}
                  {order.payment?.status !== 'PAID' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => updateOrderStatus(order.id, order.status, 'PAID')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Konfirmasi Pembayaran Lunas
                    </button>
                  )}

                  {/* Status controls */}
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                        className="col-span-2 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition shadow"
                      >
                        Proses Ke Barista
                      </button>
                    )}

                    {order.status === 'PROCESSING' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        className="col-span-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow"
                      >
                        Tandai Pesanan Siap
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        className="col-span-2 py-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
                      >
                        Selesaikan Pesanan & Potong Stok Resep
                      </button>
                    )}

                    {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        className="col-span-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition border border-red-200 mt-1"
                      >
                        Batalkan Pesanan
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
