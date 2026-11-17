'use client';

import { useState, useEffect } from 'react';
import { Truck, RefreshCw, Package, Clock, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function SupplierPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplierPurchases();
  }, []);

  const fetchSupplierPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      if (res.ok) setPurchases(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-coffee-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-900 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider mb-1">
            <Truck className="w-3.5 h-3.5 text-purple-700" /> Portal Mitra Supplier
          </div>
          <h1 className="text-2xl font-extrabold text-coffee-950">Daftar Pengadaan Bahan Baku Cafe</h1>
          <p className="text-xs text-coffee-600">Lihat rincian pesanan pembelian bahan baku dari Kopi Mahasiswa.</p>
        </div>

        <button
          onClick={fetchSupplierPurchases}
          className="p-2.5 rounded-xl bg-white border border-coffee-200 text-coffee-800 hover:bg-coffee-50 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Portal
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-coffee-500">Memuat data pengadaan supplier...</div>
      ) : purchases.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-coffee-200 space-y-2">
          <Package className="w-10 h-10 text-coffee-300 mx-auto" />
          <h3 className="font-bold text-coffee-950">Belum Ada Order Pengadaan Active</h3>
          <p className="text-xs text-coffee-500">Pesanan pengadaan baru dari admin Kopi Mahasiswa akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((pur) => (
            <div key={pur.id} className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-coffee-100 pb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-coffee-950 text-base">{pur.purchaseNumber}</span>
                    <span className="text-xs font-bold text-coffee-700">Mitra: {pur.supplier?.name || pur.supplierName}</span>
                  </div>
                  <span className="text-xs text-coffee-500 block mt-1">
                    Tanggal Terbit PO: {new Date(pur.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>

                <span
                  className={`font-bold px-3 py-1 rounded text-[11px] uppercase ${
                    pur.status === 'RECEIVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {pur.status === 'RECEIVED' ? '✓ DITERIMA GUDANG CAFE' : 'PENDING PENGIRIMAN'}
                </span>
              </div>

              {/* Items Table */}
              <div className="divide-y divide-coffee-50 bg-coffee-50/50 p-4 rounded-2xl">
                {pur.items?.map((item: any) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-coffee-950">
                      {item.ingredient?.name || item.ingredientName} x {item.quantity.toLocaleString('id-ID')} {item.ingredient?.unit || 'unit'}
                    </span>
                    <span className="font-extrabold text-coffee-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-coffee-600">Catatan: {pur.notes || '-'}</span>
                <div>
                  <span className="text-coffee-500 mr-2">Total PO Supplier:</span>
                  <span className="font-extrabold text-coffee-950 text-base">{formatRupiah(pur.totalAmount)}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
