'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, History, Edit3 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
}

interface StockHistoryItem {
  id: string;
  ingredientId: string;
  ingredientName?: string;
  ingredient?: { name: string };
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  createdAt: string;
}

export default function AdminInventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add ingredient modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('gram');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('10');
  const [costPerUnit, setCostPerUnit] = useState('0');

  // Adjustment modal
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [adjType, setAdjType] = useState<'IN' | 'OUT'>('IN');
  const [adjQty, setAdjQty] = useState('');
  const [reason, setReason] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setIngredients(data.ingredients || []);
        setHistory(data.stockHistory || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, unit, stock, minStock, costPerUnit }),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchInventory();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAdjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIng) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/inventory/${selectedIng.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustmentType: adjType,
          adjustmentQty: adjQty,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Penyesuaian stok gagal');

      setShowAdjModal(false);
      fetchInventory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = ingredients.filter((i) => i.stock <= i.minStock).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-coffee-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-coffee-950 flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" /> Manajemen Stok Bahan Baku & Riwayat
          </h1>
          <p className="text-xs text-coffee-600">Pantau ketersediaan bahan, batas stok minimum, serta log mutasi stok masuk/keluar.</p>
        </div>

        <button
          onClick={() => {
            setName('');
            setUnit('gram');
            setStock('0');
            setMinStock('10');
            setCostPerUnit('0');
            setShowAddModal(true);
          }}
          className="bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah Bahan Baru
        </button>
      </div>

      {/* Low stock warning banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs font-medium shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-bold">Peringatan Stok Menipis!</strong> Terdeteksi {lowStockCount} bahan baku yang telah mencapai atau berada di bawah batas minimum stok. Segera lakukan pengadaan pembelian bahan baku!
          </div>
        </div>
      )}

      {/* Ingredients Table */}
      <div className="bg-white rounded-3xl border border-coffee-200 shadow-sm overflow-hidden space-y-4 p-6">
        <h2 className="font-bold text-coffee-950 text-base">Daftar Bahan Baku Cafe</h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-coffee-500">Memuat stok bahan baku...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-coffee-50 text-coffee-900 border-b border-coffee-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Nama Bahan</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3">Stok Saat Ini</th>
                  <th className="p-3">Stok Minimum</th>
                  <th className="p-3">Biaya Modal / Satuan</th>
                  <th className="p-3 text-center">Penyesuaian Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {ingredients.map((ing) => {
                  const isLow = ing.stock <= ing.minStock;
                  return (
                    <tr key={ing.id} className="hover:bg-coffee-50/50 transition">
                      <td className="p-3 font-bold text-coffee-950 flex items-center gap-2">
                        {ing.name}
                        {isLow && (
                          <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-300 uppercase">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-coffee-700 font-mono">{ing.unit}</td>
                      <td className={`p-3 font-extrabold text-sm ${isLow ? 'text-red-600' : 'text-coffee-950'}`}>
                        {ing.stock.toLocaleString('id-ID')} {ing.unit}
                      </td>
                      <td className="p-3 text-coffee-600 font-semibold">{ing.minStock} {ing.unit}</td>
                      <td className="p-3 text-coffee-800 font-semibold">{formatRupiah(ing.costPerUnit)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedIng(ing);
                            setAdjType('IN');
                            setAdjQty('');
                            setReason('');
                            setError('');
                            setShowAdjModal(true);
                          }}
                          className="px-3 py-1.5 bg-coffee-100 hover:bg-coffee-200 text-coffee-900 font-bold rounded-lg transition text-[11px] flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Adjust Stok
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock History Audit Log */}
      <div className="bg-white rounded-3xl border border-coffee-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-coffee-100 pb-3">
          <h2 className="font-bold text-coffee-950 text-base flex items-center gap-2">
            <History className="w-5 h-5 text-coffee-700" /> Riwayat Mutasi Stok (Audit Trail)
          </h2>
          <span className="text-xs text-coffee-500 font-medium">{history.length} Catatan Terakhir</span>
        </div>

        <div className="divide-y divide-coffee-100 max-h-80 overflow-y-auto pr-2">
          {history.length === 0 ? (
            <p className="text-xs text-coffee-500 py-4 italic text-center">Belum ada riwayat perubahan stok.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                      item.type === 'IN' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    {item.type === 'IN' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-coffee-950 block">
                      {item.ingredient?.name || item.ingredientName || 'Bahan Baku'}
                    </span>
                    <span className="text-coffee-500 text-[11px]">{item.reason}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-extrabold text-xs block ${
                      item.type === 'IN' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {item.type === 'IN' ? '+' : '-'}{item.quantity.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-coffee-400">
                    {new Date(item.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-coffee-950">Tambah Bahan Baku Baru</h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Biji Kopi Arabika"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Satuan Ukur</label>
                  <input
                    type="text"
                    required
                    placeholder="gram / ml / pcs"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Stok Minimum Alert</label>
                  <input
                    type="number"
                    step="any"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Biaya Modal / Satuan</label>
                  <input
                    type="number"
                    step="any"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjModal && selectedIng && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-coffee-950">
              Penyesuaian Stok: <span className="text-amber-700">{selectedIng.name}</span>
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAdjSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Jenis Penyesuaian</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('IN')}
                    className={`py-2 rounded-xl font-bold text-xs border transition ${
                      adjType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-coffee-50 text-coffee-700 border-coffee-200'
                    }`}
                  >
                    + Stok Masuk (IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('OUT')}
                    className={`py-2 rounded-xl font-bold text-xs border transition ${
                      adjType === 'OUT'
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-coffee-50 text-coffee-700 border-coffee-200'
                    }`}
                  >
                    - Stok Keluar (OUT)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">
                  Jumlah Perubahan ({selectedIng.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Contoh: 500"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Alasan Penyesuaian / Catatan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Pembelian langsung pasar / Bahan kadaluarsa / Opname"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  {saving ? 'Memproses...' : 'Simpan Mutasi Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
