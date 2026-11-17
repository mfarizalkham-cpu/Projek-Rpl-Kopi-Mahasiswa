'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Sparkles, Plus, Check, Coffee, AlertCircle, ShoppingBag, Eye, X, HelpCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import RecommendationWizardModal from '@/components/RecommendationWizardModal';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Menu {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  category?: Category;
}

interface RecommendedMenu {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string | null;
  categoryName: string;
  reason: string;
  isAvailable: boolean;
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedMenu[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMenuModal, setSelectedMenuModal] = useState<Menu | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, menuRes, aiRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu'),
        fetch('/api/ai-recommendation'),
      ]);

      if (catRes.ok) setCategories(await catRes.json());
      if (menuRes.ok) setMenus(await menuRes.json());
      if (aiRes.ok) setRecommendations(await aiRes.json());
    } catch (err) {
      console.error('Error loading catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (menu: Menu | RecommendedMenu) => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('kopi_cart') || '[]');
      const existingIdx = existingCart.findIndex((item: { menuId: string }) => item.menuId === menu.id);

      if (existingIdx > -1) {
        existingCart[existingIdx].quantity += 1;
      } else {
        existingCart.push({
          menuId: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: 1,
          imageUrl: menu.imageUrl,
        });
      }

      localStorage.setItem('kopi_cart', JSON.stringify(existingCart));
      window.dispatchEvent(new Event('cart-updated'));

      // Show temporary added check animation
      setAddedItemIds((prev) => ({ ...prev, [menu.id]: true }));
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [menu.id]: false }));
      }, 1500);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const openAIChat = () => {
    window.dispatchEvent(new CustomEvent('open-chatbot'));
  };

  // Filtered menus
  const filteredMenus = menus.filter((menu) => {
    const matchesCategory = selectedCategory === 'ALL' || menu.categoryId === selectedCategory;
    const matchesSearch =
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-10 pb-16">
      
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-coffee-950 via-coffee-900 to-coffee-800 dark:from-espresso-950 dark:via-espresso-900 dark:to-coffee-950 text-white py-16 px-4 sm:px-8 rounded-3xl mx-4 sm:mx-8 shadow-2xl overflow-hidden mt-6 border border-coffee-800/80 dark:border-coffee-700/50 transition-colors duration-300">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Coffee className="w-3.5 h-3.5" /> F&B Khusus Mahasiswa & Civitas Academica
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Nikmati Kopi Racikan Terbaik, Energi Pembuka Hari Nugasmu!
          </h1>
          <p className="text-coffee-200 text-sm sm:text-base leading-relaxed">
            Dari Espresso Bold hingga Matcha Creamy — Kopi Mahasiswa hadir dengan standar rasa cafe bintang lima dan harga paling pas untuk saku mahasiswa.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href="#katalog"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-coffee-950 font-bold px-6 py-3 rounded-xl text-sm shadow-lg hover:shadow-amber-500/20 transition flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Pesan Sekarang
            </a>
            <button
              onClick={openAIChat}
              className="bg-gradient-to-r from-amber-400/20 to-amber-500/20 hover:from-amber-400/30 hover:to-amber-500/30 text-amber-300 font-bold px-5 py-3 rounded-xl text-sm transition border border-amber-400/40 flex items-center gap-2 shadow-inner group active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition" /> Tanya Barista AI
            </button>
            <Link
              href="/cart"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-3 rounded-xl text-sm transition border border-white/20 flex items-center gap-2"
            >
              Lihat Keranjang
            </Link>
          </div>
        </div>
      </section>

      {/* AI Recommendation Section */}
      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-espresso-900/90 dark:via-espresso-950 dark:to-espresso-900/90 border border-amber-500/20 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-coffee-950 flex items-center justify-center font-bold shadow-md">
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-coffee-950 dark:text-amber-100 tracking-tight flex items-center gap-2">
                    AI Smart Barista Recommendation
                  </h2>
                  <p className="text-xs text-coffee-600 dark:text-coffee-300">
                    Rekomendasi menu terlaris & favorit yang diracik khusus berdasarkan preferensi rasa terbaik!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="bg-coffee-900 hover:bg-coffee-950 dark:bg-espresso-850 dark:hover:bg-espresso-800 text-amber-300 font-bold text-xs px-4 py-2 rounded-xl transition border border-amber-500/30 flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" /> AI Menu Matcher
                </button>
                <span className="text-[11px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-600/40 hidden md:inline">
                  Verified DB Menu
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-espresso-850 rounded-2xl p-5 shadow-sm border border-coffee-100 dark:border-coffee-700/60 flex flex-col justify-between hover:shadow-md dark:hover:border-amber-500/50 transition group"
                >
                  <div className="space-y-3">
                    <div className="relative h-40 w-full rounded-xl overflow-hidden bg-coffee-100 dark:bg-espresso-800">
                      <Image
                        src={rec.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600'}
                        alt={rec.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-2 left-2 bg-amber-500 text-coffee-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow">
                        {rec.categoryName}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-coffee-950 dark:text-amber-100 text-base">{rec.name}</h3>
                      <p className="text-xs text-coffee-600 dark:text-coffee-300 line-clamp-2 mt-1">{rec.description}</p>
                    </div>

                    <div className="bg-amber-50 dark:bg-espresso-900 border border-amber-200/80 dark:border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-900 dark:text-amber-300 font-medium flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{rec.reason}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 flex items-center justify-between border-t border-coffee-50 dark:border-coffee-800">
                    <span className="font-extrabold text-coffee-950 dark:text-amber-300 text-base">{formatRupiah(rec.price)}</span>
                    <button
                      onClick={() => addToCart(rec)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                        addedItemIds[rec.id]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-coffee-800 hover:bg-coffee-900 dark:bg-amber-600 dark:hover:bg-amber-700 text-white'
                      }`}
                    >
                      {addedItemIds[rec.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Masuk Keranjang
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Tambah
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Catalog & Filter Section */}
      <section id="katalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-coffee-200 dark:border-coffee-800 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-coffee-950 dark:text-amber-100">Katalog Menu Kopi Mahasiswa</h2>
            <p className="text-xs text-coffee-600 dark:text-coffee-300">Pilih varian kopi, minuman non-kopi, dan pastry favoritmu.</p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/60 shadow-sm text-coffee-950 dark:text-white placeholder-coffee-400 dark:placeholder-coffee-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-coffee-900 text-amber-300 dark:bg-amber-600 dark:text-white shadow'
                : 'bg-white dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700/60 text-coffee-700 dark:text-coffee-300 hover:bg-coffee-50 dark:hover:bg-espresso-800'
            }`}
          >
            Semua Menu
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-coffee-900 text-amber-300 dark:bg-amber-600 dark:text-white shadow'
                  : 'bg-white dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700/60 text-coffee-700 dark:text-coffee-300 hover:bg-coffee-50 dark:hover:bg-espresso-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="py-16 text-center text-coffee-500 dark:text-coffee-400 font-medium text-sm">
            Memuat katalog menu segar...
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="bg-white dark:bg-espresso-850 rounded-2xl p-12 text-center border border-coffee-200 dark:border-coffee-800 space-y-2">
            <AlertCircle className="w-10 h-10 text-coffee-400 mx-auto" />
            <h3 className="font-bold text-coffee-950 dark:text-amber-100">Tidak ada menu yang sesuai</h3>
            <p className="text-xs text-coffee-500 dark:text-coffee-400">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                className={`bg-white dark:bg-espresso-850 rounded-2xl border ${
                  menu.isAvailable ? 'border-coffee-100 dark:border-coffee-700/60 hover:border-coffee-300 dark:hover:border-amber-500/50' : 'border-gray-200 dark:border-gray-800 opacity-75'
                } p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group`}
              >
                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedMenuModal(menu)}
                    className="relative h-44 w-full rounded-xl overflow-hidden bg-coffee-100 dark:bg-espresso-800 cursor-pointer"
                  >
                    <Image
                      src={menu.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600'}
                      alt={menu.name}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                    {!menu.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
                          Stok Habis
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-coffee-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {menu.category?.name || 'Kopi'}
                    </span>
                  </div>

                  <div>
                    <h3
                      onClick={() => setSelectedMenuModal(menu)}
                      className="font-bold text-coffee-950 dark:text-amber-100 text-base cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition"
                    >
                      {menu.name}
                    </h3>
                    <p className="text-xs text-coffee-600 dark:text-coffee-300 line-clamp-2 mt-1 leading-relaxed">{menu.description}</p>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-coffee-50 dark:border-coffee-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-coffee-500 dark:text-coffee-400 uppercase block leading-none">Harga</span>
                    <span className="font-extrabold text-coffee-950 dark:text-amber-300 text-base">{formatRupiah(menu.price)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedMenuModal(menu)}
                      className="p-2 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-100 dark:hover:bg-espresso-800 rounded-lg transition"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      disabled={!menu.isAvailable}
                      onClick={() => addToCart(menu)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                        !menu.isAvailable
                          ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                          : addedItemIds[menu.id]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-coffee-800 hover:bg-coffee-900 dark:bg-amber-600 dark:hover:bg-amber-700 text-white'
                      }`}
                    >
                      {addedItemIds[menu.id] ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{addedItemIds[menu.id] ? 'Ditambah' : 'Beli'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Menu Detail Modal */}
      {selectedMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-espresso-950 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-coffee-100 dark:border-coffee-700/60 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedMenuModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-espresso-850 text-gray-600 dark:text-coffee-300 hover:bg-gray-200 dark:hover:bg-espresso-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-coffee-100 dark:bg-espresso-800">
              <Image
                src={selectedMenuModal.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600'}
                alt={selectedMenuModal.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-2">
              <span className="bg-coffee-100 dark:bg-espresso-850 text-coffee-800 dark:text-amber-300 font-bold text-xs px-2.5 py-1 rounded-md inline-block">
                {selectedMenuModal.category?.name || 'Kopi Signature'}
              </span>
              <h3 className="text-xl font-extrabold text-coffee-950 dark:text-amber-100">{selectedMenuModal.name}</h3>
              <p className="text-xs text-coffee-600 dark:text-coffee-300 leading-relaxed">{selectedMenuModal.description}</p>
            </div>

            <div className="bg-coffee-50 dark:bg-espresso-900 p-4 rounded-xl flex items-center justify-between border border-coffee-100 dark:border-coffee-800">
              <div>
                <span className="text-xs text-coffee-500 dark:text-coffee-400 block">Status Ketersediaan</span>
                <span className={`font-bold text-xs ${selectedMenuModal.isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedMenuModal.isAvailable ? '✓ Siap Dipesan' : '✕ Stok Bahan Habis'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-coffee-500 dark:text-coffee-400 block">Harga Pas</span>
                <span className="text-xl font-extrabold text-coffee-950 dark:text-amber-300">{formatRupiah(selectedMenuModal.price)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={!selectedMenuModal.isAvailable}
                onClick={() => {
                  addToCart(selectedMenuModal);
                  setSelectedMenuModal(null);
                }}
                className={`w-full py-3 rounded-xl font-bold text-sm transition shadow flex items-center justify-center gap-2 ${
                  !selectedMenuModal.isAvailable
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-coffee-800 hover:bg-coffee-900 dark:bg-amber-600 dark:hover:bg-amber-700 text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" /> Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Wizard Modal */}
      <RecommendationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onAddToCart={(item) => addToCart(item)}
      />

    </div>
  );
}
