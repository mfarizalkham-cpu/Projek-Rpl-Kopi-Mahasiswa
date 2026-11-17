'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Coffee, 
  Package, 
  Bot, 
  Layers, 
  Truck, 
  ShoppingCart, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  TrendingUp,
  Activity,
  Users
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    menuCount: 0,
    categoryCount: 0,
    ingredientCount: 0,
    activeAiModel: 'gemini',
    loading: true,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [menuRes, catRes, ingRes, aiRes] = await Promise.all([
        fetch('/api/menu').catch(() => null),
        fetch('/api/categories').catch(() => null),
        fetch('/api/inventory').catch(() => null),
        fetch('/api/settings/ai').catch(() => null),
      ]);

      const menus = menuRes && menuRes.ok ? await menuRes.json() : [];
      const categories = catRes && catRes.ok ? await catRes.json() : [];
      const inventory = ingRes && ingRes.ok ? await ingRes.json() : { ingredients: [] };
      const aiData = aiRes && aiRes.ok ? await aiRes.json() : { model: 'gemini' };

      setStats({
        menuCount: Array.isArray(menus) ? menus.length : 0,
        categoryCount: Array.isArray(categories) ? categories.length : 0,
        ingredientCount: Array.isArray(inventory?.ingredients) ? inventory.ingredients.length : 0,
        activeAiModel: aiData?.model || 'gemini',
        loading: false,
      });
    } catch {
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#2D1B14] border border-[#4A2E22] p-8 shadow-2xl text-white">
        <div className="absolute -right-8 -top-8 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pusat Kendali Kedai
            </div>
            <h1 className="text-3xl font-black text-[#F7E7CE] tracking-tight">
              Dashboard Admin Kopi Mahasiswa
            </h1>
            <p className="text-sm text-[#D7C4B7] max-w-xl leading-relaxed">
              Kelola katalog racikan kopi, inventori bahan baku resep, pesanan pengadaan supplier, 
              serta konfigurasi engine kecerdasan buatan dalam satu dasbor terpadu.
            </p>
          </div>

          <Link
            href="/admin/settings/ai"
            className="flex items-center gap-3 bg-[#1F120D] hover:bg-[#281810] border border-amber-500/40 p-4 rounded-2xl transition group shadow-lg shrink-0"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold group-hover:scale-105 transition">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300 block">
                Active AI Engine
              </span>
              <span className="text-base font-black text-white uppercase block">
                {stats.activeAiModel}
              </span>
              <span className="text-[11px] text-[#A89284] flex items-center gap-1 group-hover:text-amber-300 transition">
                Ganti Model <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-5 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-[#BCA798]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Menu</span>
            <Coffee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats.loading ? '...' : stats.menuCount} <span className="text-xs text-[#A89284] font-normal">item</span>
          </div>
          <Link href="/admin/menu" className="text-[11px] text-amber-400 hover:underline flex items-center gap-1">
            Lihat katalog menu &rarr;
          </Link>
        </div>

        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-5 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-[#BCA798]">
            <span className="text-xs font-bold uppercase tracking-wider">Kategori Menu</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats.loading ? '...' : stats.categoryCount} <span className="text-xs text-[#A89284] font-normal">kategori</span>
          </div>
          <Link href="/admin/categories" className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1">
            Kelola kategori &rarr;
          </Link>
        </div>

        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-5 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-[#BCA798]">
            <span className="text-xs font-bold uppercase tracking-wider">Bahan Baku</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats.loading ? '...' : stats.ingredientCount} <span className="text-xs text-[#A89284] font-normal">bahan</span>
          </div>
          <Link href="/admin/inventory" className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
            Cek status stok &rarr;
          </Link>
        </div>

        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-5 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-[#BCA798]">
            <span className="text-xs font-bold uppercase tracking-wider">AI Model Switcher</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 uppercase">
            {stats.loading ? '...' : stats.activeAiModel}
          </div>
          <Link href="/admin/settings/ai" className="text-[11px] text-amber-300 hover:underline flex items-center gap-1">
            Buka Pengaturan AI &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#EAD8CD] flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" /> Menu Pintasan Cepat
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            href="/admin/users"
            className="group bg-[#241610] hover:bg-[#2A1A13] border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-6 transition shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-[#F9EFE7] group-hover:text-amber-300 transition">
                Manajemen Pengguna
              </h3>
              <p className="text-xs text-[#C5B1A2] leading-relaxed">
                Kelola akun dan role Admin, Owner, Kasir, Pelanggan, dan Supplier Mitra. Tambah, edit, atau atur hak akses.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#3B251B] flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Kelola User</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/admin/settings/ai"
            className="group bg-[#241610] hover:bg-[#2A1A13] border border-[#3E271D] hover:border-amber-400/60 rounded-2xl p-6 transition shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-[#F9EFE7] group-hover:text-amber-300 transition">
                🤖 Pengaturan Model AI
              </h3>
              <p className="text-xs text-[#C5B1A2] leading-relaxed">
                Pilih dan atur engine AI aktif: Google Gemini atau xAI Grok.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#3B251B] flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Buka Konfigurasi</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/admin/menu"
            className="group bg-[#241610] hover:bg-[#2A1A13] border border-[#3E271D] hover:border-amber-500/50 rounded-2xl p-6 transition shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-[#F9EFE7] group-hover:text-amber-300 transition">
                Katalog Menu & Resep
              </h3>
              <p className="text-xs text-[#C5B1A2] leading-relaxed">
                Tambah menu kopi baru, atur formula takaran bahan baku resep, dan aktifkan status ketersediaan.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#3B251B] flex items-center justify-between text-xs font-bold text-[#D7C4B7]">
              <span>Kelola Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/admin/inventory"
            className="group bg-[#241610] hover:bg-[#2A1A13] border border-[#3E271D] hover:border-amber-500/50 rounded-2xl p-6 transition shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-[#F9EFE7] group-hover:text-cyan-300 transition">
                Stok & Inventori Bahan
              </h3>
              <p className="text-xs text-[#C5B1A2] leading-relaxed">
                Pantau sisa biji kopi, susu, sirup, lakukan penyesuaian stok opname manual, serta pantau log keluar/masuk.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#3B251B] flex items-center justify-between text-xs font-bold text-[#D7C4B7]">
              <span>Kelola Inventori</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

