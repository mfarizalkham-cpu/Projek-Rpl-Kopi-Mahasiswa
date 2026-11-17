'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import PantunNotificationCard from '@/components/PantunNotificationCard';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase">Pending</span>;
      case 'CONFIRMED':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase">Dikonfirmasi</span>;
      case 'PROCESSING':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase">Diproses Barista</span>;
      case 'READY':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase">Siap Diambil</span>;
      case 'COMPLETED':
        return <span className="bg-green-600 text-white font-bold px-2.5 py-0.5 rounded text-[11px] uppercase">Selesai</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-900 border border-red-300 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase">Dibatalkan</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-coffee-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-coffee-950">Pesanan Saya</h1>
          <p className="text-xs text-coffee-600">Lacak riwayat dan status pemrosesan pesanan kopi & F&B milikmu.</p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl bg-white border border-coffee-200 text-coffee-800 hover:bg-coffee-50 transition flex items-center gap-1 text-xs font-bold shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-coffee-500 font-medium text-sm">
          Memuat riwayat pesanan...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-coffee-200 space-y-4 max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 text-coffee-300 mx-auto" />
          <h3 className="text-lg font-bold text-coffee-950">Belum Ada Pesanan Active</h3>
          <p className="text-xs text-coffee-600">Kamu belum melakukan pesanan kopi hari ini. Yuk pesan sekarang!</p>
          <Link
            href="/"
            className="inline-block bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow"
          >
            Mulai Pesan Kopi
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <PantunNotificationCard customerName={orders[0]?.customerName} orderNumber={orders[0]?.orderNumber} />
          
          <div className="space-y-4">
            {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-coffee-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-coffee-950 text-base">{order.orderNumber}</span>
                  <span className="text-xs text-coffee-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-coffee-400" />
                    {new Date(order.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-coffee-600 font-medium">Status:</span>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-coffee-50">
                {order.orderItems?.map((item: any) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-coffee-950">{item.menu?.name || item.menuName}</span>
                      <span className="text-coffee-500 ml-2 font-medium">x{item.quantity}</span>
                    </div>
                    <span className="font-bold text-coffee-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="bg-coffee-50 p-2.5 rounded-xl text-xs text-coffee-700 italic border border-coffee-100">
                  Catatan: {order.notes}
                </div>
              )}

              <div className="pt-3 border-t border-coffee-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-coffee-500">Pembayaran: </span>
                  <span className="font-bold text-coffee-900">{order.payment?.paymentMethod || 'QRIS'} </span>
                  <span className={`ml-1 font-bold ${order.payment?.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ({order.payment?.status || 'PENDING'})
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-coffee-500 mr-2">Total Transaksi:</span>
                  <span className="font-extrabold text-coffee-950 text-base">{formatRupiah(order.totalAmount)}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
      )}

    </div>
  );
}
