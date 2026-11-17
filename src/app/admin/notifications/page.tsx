'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  ShoppingBag, 
  CreditCard, 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  CheckCheck, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Filter, 
  Clock, 
  Sparkles, 
  Inbox,
  Package,
  Coffee
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'ORDER' | 'PAYMENT' | 'INVENTORY' | 'PRODUCT' | 'SYSTEM';
  type: string;
  link?: string | null;
  metadata?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  order: number;
  payment: number;
  inventory: number;
  product?: number;
  system: number;
}

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    order: 0,
    payment: 0,
    inventory: 0,
    system: 0,
  });

  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ORDER' | 'PAYMENT' | 'INVENTORY' | 'PRODUCT' | 'SYSTEM'>('ALL');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const categoryParam = activeCategory !== 'ALL' ? `category=${activeCategory}&` : '';
      const unreadParam = onlyUnread ? 'isRead=false&' : '';
      const res = await fetch(`/api/notifications?${categoryParam}${unreadParam}limit=60`);

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeCategory, onlyUnread]);

  // Mark single as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (stats.unread === 0) return;
    try {
      setMarkingAll(true);
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setStats((prev) => ({ ...prev, unread: 0 }));
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Delete notification
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (deleted && !deleted.isRead) {
          setStats((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
            unread: Math.max(0, prev.unread - 1),
          }));
        } else {
          setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        }
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (!confirm('Apakah Anda yakin ingin membersihkan seluruh riwayat notifikasi?')) return;

    try {
      const res = await fetch('/api/notifications?all=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications([]);
        setStats({
          total: 0,
          unread: 0,
          order: 0,
          payment: 0,
          inventory: 0,
          system: 0,
        });
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // Generate Daily Report
  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_report' }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;

      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Icon & Style per Category
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'PRODUCT':
        return {
          icon: Coffee,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          badgeText: 'Katalog Produk',
          badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
        };
      case 'ORDER':
        return {
          icon: ShoppingBag,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          badgeText: 'Status Pesanan',
          badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
        };
      case 'PAYMENT':
        return {
          icon: CreditCard,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          badgeText: 'Pembayaran Lunas',
          badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
        };
      case 'INVENTORY':
        return {
          icon: AlertTriangle,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          badgeText: 'Peringatan Stok',
          badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-800/50',
        };
      case 'SYSTEM':
      default:
        return {
          icon: FileText,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          badgeText: 'Laporan Sistem',
          badgeClass: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3E2519] pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-900/30">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-amber-50 tracking-tight">
                Pusat Notifikasi & Laporan Sistem
              </h1>
              {stats.unread > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse shadow-sm">
                  {stats.unread} Baru
                </span>
              )}
            </div>
            <p className="text-xs text-[#A89284] mt-0.5">
              Monitoring real-time pesanan masuk, status kasir/barista, konfirmasi pembayaran, dan inventaris kedai.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${generatingReport ? 'animate-spin' : ''}`} />
            {generatingReport ? 'Menganalisis...' : 'Buat Laporan Hari Ini'}
          </button>

          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll || stats.unread === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#26160F] hover:bg-[#341F16] border border-[#48291B] text-amber-200 text-xs font-semibold rounded-xl transition-all disabled:opacity-40"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            Tandai Semua Dibaca
          </button>

          <button
            onClick={fetchNotifications}
            title="Refresh Notifikasi"
            className="p-2 bg-[#20130C] hover:bg-[#2C1910] border border-[#3E2419] text-amber-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stat Cards Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card: Unread */}
        <div 
          onClick={() => setOnlyUnread(!onlyUnread)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            onlyUnread 
              ? 'bg-rose-950/40 border-rose-500/50 shadow-md ring-1 ring-rose-500/30' 
              : 'bg-[#1D110B] border-[#382115] hover:border-amber-700/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C8274]">Belum Dibaca</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{stats.unread}</div>
          <span className="text-[10px] text-amber-300/70 mt-1 block">
            {onlyUnread ? '✕ Klik untuk reset filter' : 'Klik untuk filter belum dibaca'}
          </span>
        </div>

        {/* Card: Pesanan */}
        <div 
          onClick={() => setActiveCategory(activeCategory === 'ORDER' ? 'ALL' : 'ORDER')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === 'ORDER' 
              ? 'bg-amber-950/40 border-amber-500/50 shadow-md ring-1 ring-amber-500/30' 
              : 'bg-[#1D110B] border-[#382115] hover:border-amber-700/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C8274]">Status Pesanan</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-100">{stats.order}</div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Pesanan baru & progres</span>
        </div>

        {/* Card: Pembayaran */}
        <div 
          onClick={() => setActiveCategory(activeCategory === 'PAYMENT' ? 'ALL' : 'PAYMENT')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === 'PAYMENT' 
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30' 
              : 'bg-[#1D110B] border-[#382115] hover:border-amber-700/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C8274]">Pembayaran</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-100">{stats.payment}</div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Verifikasi transaksi lunas</span>
        </div>

        {/* Card: Inventaris */}
        <div 
          onClick={() => setActiveCategory(activeCategory === 'INVENTORY' ? 'ALL' : 'INVENTORY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === 'INVENTORY' 
              ? 'bg-rose-950/40 border-rose-500/50 shadow-md ring-1 ring-rose-500/30' 
              : 'bg-[#1D110B] border-[#382115] hover:border-amber-700/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C8274]">Peringatan Stok</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-200">{stats.inventory}</div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Bahan di bawah batas aman</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#190E08] p-2 rounded-2xl border border-[#351E14]">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'ALL'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-[#9A8172] hover:text-white hover:bg-[#25150D]'
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setActiveCategory('PRODUCT')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'PRODUCT'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-[#9A8172] hover:text-white hover:bg-[#25150D]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" /> Produk ({stats.product || 0})
          </button>
          <button
            onClick={() => setActiveCategory('ORDER')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'ORDER'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-[#9A8172] hover:text-white hover:bg-[#25150D]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Pesanan ({stats.order})
          </button>
          <button
            onClick={() => setActiveCategory('PAYMENT')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'PAYMENT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[#9A8172] hover:text-white hover:bg-[#25150D]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Pembayaran ({stats.payment})
          </button>
          <button
            onClick={() => setActiveCategory('INVENTORY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'INVENTORY'
                ? 'bg-rose-700 text-white shadow-md'
                : 'text-[#9A8172] hover:text-white hover:bg-[#25150D]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Stok ({stats.inventory})
          </button>
          <button
            onClick={() => setActiveCategory('SYSTEM')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'SYSTEM'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[#9A8172] hover:text-white hover:bg-[#25150D]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Laporan Sistem ({stats.system})
          </button>
        </div>

        {/* Clear History */}
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent hover:bg-rose-950/40 text-rose-400/80 hover:text-rose-300 border border-transparent hover:border-rose-800/40 text-xs font-semibold transition-all self-end sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Bersihkan Riwayat
          </button>
        )}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-[#1B100A] border border-[#351F14]">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-amber-200/80">Memuat data Pusat Notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-[#1B100A] border border-[#351F14] space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#29170E] flex items-center justify-center mx-auto text-[#755D4E]">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Tidak Ada Notifikasi</h3>
            <p className="text-xs text-[#9C8274] max-w-sm mx-auto">
              Saat ini belum ada notifikasi untuk kategori yang dipilih. Setiap transaksi, progres pesanan, atau perubahan stok akan otomatis muncul di sini.
            </p>
            <button
              onClick={handleGenerateReport}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D1B13] hover:bg-[#3D2317] border border-[#4E2B1A] text-amber-300 text-xs font-bold rounded-xl transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> Buat Laporan Ringkasan Sistem
            </button>
          </div>
        ) : (
          notifications.map((item) => {
            const theme = getCategoryTheme(item.category);
            const Icon = theme.icon;

            return (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                className={`p-4 md:p-5 rounded-2xl border transition-all relative flex flex-col sm:flex-row items-start gap-4 ${
                  !item.isRead
                    ? 'bg-[#25150D] border-amber-700/50 shadow-md shadow-amber-950/20'
                    : 'bg-[#1B100A] border-[#351F14] hover:border-[#4B2A1A]'
                }`}
              >
                {/* Unread Indicator Bar */}
                {!item.isRead && (
                  <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                      Baru
                    </span>
                  </div>
                )}

                {/* Category Icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${theme.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content Body */}
                <div className="flex-1 min-w-0 pr-12 sm:pr-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${theme.badgeClass}`}
                    >
                      {theme.badgeText}
                    </span>
                    <span className="text-[11px] text-[#8E7668] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTimestamp(item.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#D1BEB1] mt-1 leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[#301A0E]">
                    {item.link && (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Buka Halaman Terkait <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}

                    {!item.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className="text-xs text-[#9E8677] hover:text-emerald-400 flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Tandai Dibaca
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Hapus Notifikasi"
                      className="text-xs text-[#826B5E] hover:text-rose-400 flex items-center gap-1 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

