'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Coffee, Check, X, ShieldAlert, BookOpen } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

interface Menu {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  category?: Category;
  recipes?: { ingredientId: string; quantity: number; ingredient?: Ingredient }[];
}

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [recipeInputs, setRecipeInputs] = useState<RecipeItem[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes, ingRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/categories'),
        fetch('/api/inventory'),
      ]);

      if (menuRes.ok) setMenus(await menuRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (ingRes.ok) {
        const data = await ingRes.json();
        setIngredients(data.ingredients || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMenu(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setIsAvailable(true);
    setRecipeInputs([]);
    setShowModal(true);
  };

  const openEditModal = (menu: Menu) => {
    setEditingMenu(menu);
    setName(menu.name);
    setCategoryId(menu.categoryId);
    setDescription(menu.description);
    setPrice(menu.price.toString());
    setImageUrl(menu.imageUrl || '');
    setIsAvailable(menu.isAvailable);
    setRecipeInputs(
      menu.recipes?.map((r) => ({ ingredientId: r.ingredientId, quantity: r.quantity })) || []
    );
    setShowModal(true);
  };

  const addRecipeRow = () => {
    if (ingredients.length === 0) return;
    setRecipeInputs([...recipeInputs, { ingredientId: ingredients[0].id, quantity: 10 }]);
  };

  const removeRecipeRow = (index: number) => {
    setRecipeInputs(recipeInputs.filter((_, i) => i !== index));
  };

  const toggleAvailability = async (menu: Menu) => {
    try {
      const res = await fetch(`/api/menu/${menu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !menu.isAvailable }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingMenu ? `/api/menu/${editingMenu.id}` : '/api/menu';
      const method = editingMenu ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          name,
          description,
          price: parseFloat(price),
          imageUrl,
          isAvailable,
          recipes: recipeInputs,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-coffee-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-coffee-950 flex items-center gap-2">
            <Coffee className="w-6 h-6 text-red-600" /> Manajemen Menu & Resep Bahan Baku
          </h1>
          <p className="text-xs text-coffee-600">Tambah menu baru, atur resep bahan baku, dan kelola status ketersediaan.</p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah Menu Baru
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-coffee-500">Memuat daftar menu...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-coffee-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-coffee-50 text-coffee-900 border-b border-coffee-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Menu</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga</th>
                <th className="p-4">Status Ketersediaan</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-coffee-50/50 transition">
                  <td className="p-4 font-bold text-coffee-950 flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-coffee-100 shrink-0">
                      <Image
                        src={menu.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600'}
                        alt={menu.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <span className="block font-bold">{menu.name}</span>
                      <span className="text-[10px] text-coffee-500 line-clamp-1">{menu.description}</span>
                    </div>
                  </td>

                  <td className="p-4 text-coffee-700 font-semibold">{menu.category?.name || 'Kopi'}</td>
                  <td className="p-4 font-extrabold text-coffee-950">{formatRupiah(menu.price)}</td>

                  <td className="p-4">
                    <button
                      onClick={() => toggleAvailability(menu)}
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider transition ${
                        menu.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {menu.isAvailable ? '✓ Aktif (Tersedia)' : '✕ Non-Aktif (Habis)'}
                    </button>
                  </td>

                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => openEditModal(menu)}
                      className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                      title="Edit Menu & Resep"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id)}
                      className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Edit / Add */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-coffee-950">
              {editingMenu ? 'Edit Menu & Resep' : 'Tambah Menu Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Nama Menu</label>
                  <input
                    type="text"
                    required
                    placeholder="Es Kopi Susu Aren"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi cita rasa menu"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Harga (IDR)</label>
                  <input
                    type="number"
                    required
                    placeholder="18000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Status Ketersediaan</label>
                  <select
                    value={isAvailable ? 'true' : 'false'}
                    onChange={(e) => setIsAvailable(e.target.value === 'true')}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  >
                    <option value="true">Aktif / Tersedia</option>
                    <option value="false">Non-Aktif / Habis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">URL Gambar (Unsplash)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              {/* Recipe Builder */}
              <div className="border-t border-coffee-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-coffee-950 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-600" /> Resep Penggunaan Bahan Baku
                  </span>
                  <button
                    type="button"
                    onClick={addRecipeRow}
                    className="text-[11px] font-bold text-coffee-800 hover:text-coffee-950 bg-coffee-100 hover:bg-coffee-200 px-2.5 py-1 rounded-lg transition"
                  >
                    + Tambah Komponen Bahan
                  </button>
                </div>

                {recipeInputs.length === 0 ? (
                  <p className="text-[11px] text-coffee-400 italic">Belum ada resep bahan baku dikaitkan.</p>
                ) : (
                  <div className="space-y-2">
                    {recipeInputs.map((rec, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={rec.ingredientId}
                          onChange={(e) => {
                            const updated = [...recipeInputs];
                            updated[idx].ingredientId = e.target.value;
                            setRecipeInputs(updated);
                          }}
                          className="w-1/2 bg-coffee-50 border border-coffee-200 rounded-xl px-2 py-1.5 text-xs"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="any"
                          placeholder="Jumlah"
                          value={rec.quantity}
                          onChange={(e) => {
                            const updated = [...recipeInputs];
                            updated[idx].quantity = parseFloat(e.target.value) || 0;
                            setRecipeInputs(updated);
                          }}
                          className="w-1/3 bg-coffee-50 border border-coffee-200 rounded-xl px-2 py-1.5 text-xs"
                        />

                        <button
                          type="button"
                          onClick={() => removeRecipeRow(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-coffee-100">
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
                  {saving ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
