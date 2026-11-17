'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, ShieldAlert } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  _count?: { menus: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories';
      const method = editingCat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, imageUrl }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCategories();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-coffee-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-coffee-950 flex items-center gap-2">
            <Tag className="w-6 h-6 text-red-600" /> Manajemen Kategori Menu
          </h1>
          <p className="text-xs text-coffee-600">Tambah, ubah, atau hapus kategori produk F&B.</p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah Kategori Baru
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-coffee-500">Memuat kategori...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-coffee-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-coffee-50 text-coffee-900 border-b border-coffee-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Nama Kategori</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-coffee-50/50 transition">
                  <td className="p-4 font-bold text-coffee-950">{cat.name}</td>
                  <td className="p-4 font-mono text-coffee-600">{cat.slug}</td>
                  <td className="p-4 text-coffee-600 max-w-xs truncate">{cat.description || '-'}</td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-coffee-950">
              {editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Signature"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat kategori"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
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

              <div className="flex items-center gap-3 pt-2">
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
                  {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
