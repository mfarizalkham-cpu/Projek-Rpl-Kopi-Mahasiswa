'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, CheckCircle2, Clock, Truck, X } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface Supplier {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
}

interface PurchaseItemInput {
  ingredientId: string;
  quantity: number;
  unitCost: number;
}

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemInput[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, ingRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/suppliers'),
        fetch('/api/inventory'),
      ]);

      if (purRes.ok) setPurchases(await purRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
      if (ingRes.ok) {
        const data = await ingRes.json();
        setIngredients(data.ingredients || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSupplierId(suppliers[0]?.id || '');
    setNotes('');
    setPurchaseItems(
      ingredients.length > 0
        ? [{ ingredientId: ingredients[0].id, quantity: 1000, unitCost: ingredients[0].costPerUnit || 100 }]
        : []
    );
    setShowModal(true);
  };

  const addPurchaseRow = () => {
    if (ingredients.length === 0) return;
    setPurchaseItems([
      ...purchaseItems,
      { ingredientId: ingredients[0].id, quantity: 1000, unitCost: ingredients[0].costPerUnit || 100 },
    ]);
  };

  const removePurchaseRow = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleMarkReceived = async (id: string) => {
    if (!confirm('Konfirmasi bahwa barang pengadaan telah DITERIMA? (Stok bahan akan bertambah otomatis!)')) return;

    try {
      const res = await fetch(`/api/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RECEIVED' }),
      });

      if (res.ok) {
        alert('Stok bahan baku telah otomatis ditambahkan!');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal mengubah status');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) return;
    setSaving(true);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, notes, items: purchaseItems }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-coffee-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-coffee-950 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-purple-600" /> Pembelian & Pengadaan Bahan Baku
          </h1>
          <p className="text-xs text-coffee-600">Buat pesanan pengadaan ke supplier. Saat diterima, stok bertambah otomatis!</p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Buat Pembelian Bahan Baru
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-coffee-500">Memuat daftar pengadaan...</div>
      ) : (
        <div className="space-y-4">
          {purchases.map((pur) => (
            <div key={pur.id} className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-coffee-100 pb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-coffee-950 text-base">{pur.purchaseNumber}</span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                      Supplier: {pur.supplier?.name || pur.supplierName}
                    </span>
                  </div>
                  <span className="text-xs text-coffee-500 block mt-1">
                    Tanggal Order: {new Date(pur.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold px-2.5 py-1 rounded text-[11px] uppercase ${
                      pur.status === 'RECEIVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {pur.status === 'RECEIVED' ? '✓ DITERIMA (STOK BERTAMBAH)' : 'PENDING PENGIRIMAN'}
                  </span>

                  {pur.status === 'PENDING' && (
                    <button
                      onClick={() => handleMarkReceived(pur.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      Tandai Diterima
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="divide-y divide-coffee-50">
                {pur.items?.map((item: any) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-coffee-950">
                      {item.ingredient?.name || item.ingredientName} ({item.quantity.toLocaleString('id-ID')} {item.ingredient?.unit || 'unit'})
                    </span>
                    <span className="font-extrabold text-coffee-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-coffee-100 flex items-center justify-between text-xs">
                <span className="text-coffee-600">Catatan: {pur.notes || '-'}</span>
                <div>
                  <span className="text-coffee-500 mr-2">Total Biaya Pengadaan:</span>
                  <span className="font-extrabold text-coffee-950 text-base">{formatRupiah(pur.totalAmount)}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal Add Purchase */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-coffee-950">Buat Pembelian Bahan Baru</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Pilih Supplier Mitra</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Catatan Pengadaan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pengadaan rutin bulanan biji kopi"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              {/* Items builder */}
              <div className="border-t border-coffee-200 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-coffee-800">Daftar Bahan Yang Dibeli</label>
                  <button
                    type="button"
                    onClick={addPurchaseRow}
                    className="text-[11px] font-bold text-coffee-800 hover:text-coffee-950 bg-coffee-100 hover:bg-coffee-200 px-2 py-1 rounded-lg"
                  >
                    + Tambah Item
                  </button>
                </div>

                {purchaseItems.map((pi, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={pi.ingredientId}
                      onChange={(e) => {
                        const updated = [...purchaseItems];
                        updated[idx].ingredientId = e.target.value;
                        const ing = ingredients.find((ig) => ig.id === e.target.value);
                        if (ing) updated[idx].unitCost = ing.costPerUnit;
                        setPurchaseItems(updated);
                      }}
                      className="w-2/5 bg-coffee-50 border border-coffee-200 rounded-xl px-2 py-1.5 text-xs"
                    >
                      {ingredients.map((ig) => (
                        <option key={ig.id} value={ig.id}>
                          {ig.name} ({ig.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Qty"
                      value={pi.quantity}
                      onChange={(e) => {
                        const updated = [...purchaseItems];
                        updated[idx].quantity = parseFloat(e.target.value) || 0;
                        setPurchaseItems(updated);
                      }}
                      className="w-1/4 bg-coffee-50 border border-coffee-200 rounded-xl px-2 py-1.5 text-xs"
                    />

                    <input
                      type="number"
                      placeholder="Biaya/unit"
                      value={pi.unitCost}
                      onChange={(e) => {
                        const updated = [...purchaseItems];
                        updated[idx].unitCost = parseFloat(e.target.value) || 0;
                        setPurchaseItems(updated);
                      }}
                      className="w-1/4 bg-coffee-50 border border-coffee-200 rounded-xl px-2 py-1.5 text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => removePurchaseRow(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-coffee-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  {saving ? 'Memproses...' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
