'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Coffee,
  ShoppingBag,
  AlertTriangle,
  Package,
  CheckCircle2,
  CheckCheck,
  Trash2,
  ExternalLink,
  Settings,
  Sparkles,
  Inbox,
  X,
  CreditCard,
  Clock,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  userId?: string | null;
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
  product: number;
  inventory: number;
  payment: number;
}

interface NotificationDropdownProps {
  className?: string;
  align?: 'right' | 'left';
  showSettingsButton?: boolean;
}

export default function NotificationDropdown({
  className = '',
  align = 'right',
  showSettingsButton = true,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    order: 0,
    product: 0,
    inventory: 0,
    payment: 0,
  });
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORDER' | 'PRODUCT' | 'INVENTORY'>('ALL');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('GUEST');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from server
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=30');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.currentUserRole) {
          setUserRole(data.currentUserRole);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Polling setiap 8 detik untuk update otomatis
    const intervalId = setInterval(fetchNotifications, 8000);

    // Event listener untuk update instan ketika ada aktivitas
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('notification-updated', handleUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('notification-updated', handleUpdate);
    };
  }, []);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single notification as read
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
          prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
        );
        setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setStats((prev) => ({ ...prev, unread: 0 }));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete single notification
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!confirm('Hapus semua riwayat notifikasi?')) return;
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
          product: 0,
          inventory: 0,
          payment: 0,
        });
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Format relative time helper
  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 45) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  // Icon per category/type helper
  const renderIcon = (category: string, type: string) => {
    if (category === 'PRODUCT') {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300/50">
          <Coffee className="w-4 h-4" />
        </div>
      );
    }
    if (category === 'ORDER') {
      if (type.includes('COMPLETED')) {
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300/50">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      }
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-300/50">
          <ShoppingBag className="w-4 h-4" />
        </div>
      );
    }
    if (category === 'INVENTORY') {
      if (type.includes('OUT_OF_STOCK')) {
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 flex items-center justify-center shrink-0 border border-red-300/50">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      }
      if (type.includes('RESTOCKED')) {
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300/50">
            <Package className="w-4 h-4" />
          </div>
        );
      }
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300/50">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    if (category === 'PAYMENT') {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300/50">
          <CreditCard className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-coffee-100 dark:bg-espresso-800 text-coffee-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-coffee-300/50">
        <Sparkles className="w-4 h-4" />
      </div>
    );
  };

  // Filtered list
  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ORDER') return item.category === 'ORDER' || item.category === 'PAYMENT';
    if (activeFilter === 'PRODUCT') return item.category === 'PRODUCT';
    if (activeFilter === 'INVENTORY') return item.category === 'INVENTORY';
    return true;
  });

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2.5 rounded-full bg-coffee-100 hover:bg-amber-100 dark:bg-espresso-850 dark:hover:bg-espresso-800 text-coffee-900 dark:text-amber-300 border border-coffee-200 dark:border-coffee-700/60 transition-all duration-200 flex items-center justify-center shadow-sm active:scale-95 group focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        title="Notifikasi Aktivitas Toko"
        aria-label="Buka notifikasi"
      >
        <Bell className="w-5 h-5 text-coffee-800 dark:text-amber-300 group-hover:rotate-12 transition-transform duration-200" />

        {/* Unread Badge Counter */}
        {stats.unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 dark:bg-red-500 text-white font-extrabold text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-espresso-950 shadow-md animate-pulse">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
      </button>

      {/* Modern Notification Dropdown Popover */}
      {isOpen && (
        <div
          className={`fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-full sm:mt-2.5 ${
            align === 'right' ? 'sm:right-0 sm:origin-top-right' : 'sm:left-0 sm:origin-top-left'
          } sm:w-[410px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#1C120C] rounded-2xl shadow-2xl border border-amber-900/15 dark:border-amber-500/25 z-50 overflow-hidden backdrop-blur-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col`}
          style={{ maxHeight: 'calc(100vh - 5rem)' }}
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-[#FBF7F2] dark:bg-[#251810] border-b border-amber-900/10 dark:border-amber-500/15 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-coffee-950 dark:text-[#F8EDE3] flex items-center gap-1.5">
                  Notifikasi
                  {stats.unread > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      {stats.unread} baru
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-coffee-600 dark:text-amber-300/70 font-medium">
                  Aktivitas katalog, pesanan & stok
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 rounded-lg text-xs font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition flex items-center gap-1"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="text-[11px] hidden sm:inline">Tandai Baca</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded-lg text-xs text-coffee-500 hover:text-red-600 dark:text-coffee-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  title="Bersihkan semua notifikasi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-coffee-500 hover:text-coffee-800 dark:text-coffee-400 dark:hover:text-white hover:bg-coffee-100 dark:hover:bg-espresso-800 transition"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2.5 pb-2 bg-[#FDFBF7] dark:bg-[#1F140D] border-b border-amber-900/10 dark:border-amber-500/10 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap text-[11px] ${
                activeFilter === 'ALL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-coffee-100/70 hover:bg-coffee-200/70 dark:bg-espresso-800 dark:hover:bg-espresso-750 text-coffee-800 dark:text-amber-200/80'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setActiveFilter('ORDER')}
              className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap text-[11px] ${
                activeFilter === 'ORDER'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-coffee-100/70 hover:bg-coffee-200/70 dark:bg-espresso-800 dark:hover:bg-espresso-750 text-coffee-800 dark:text-amber-200/80'
              }`}
            >
              Pesanan ({stats.order + stats.payment})
            </button>
            <button
              onClick={() => setActiveFilter('PRODUCT')}
              className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap text-[11px] ${
                activeFilter === 'PRODUCT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-coffee-100/70 hover:bg-coffee-200/70 dark:bg-espresso-800 dark:hover:bg-espresso-750 text-coffee-800 dark:text-amber-200/80'
              }`}
            >
              Katalog Produk ({stats.product})
            </button>
            <button
              onClick={() => setActiveFilter('INVENTORY')}
              className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap text-[11px] ${
                activeFilter === 'INVENTORY'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-coffee-100/70 hover:bg-coffee-200/70 dark:bg-espresso-800 dark:hover:bg-espresso-750 text-coffee-800 dark:text-amber-200/80'
              }`}
            >
              Stok ({stats.inventory})
            </button>
          </div>

          {/* List of Notifications */}
          <div className="overflow-y-auto flex-grow divide-y divide-amber-900/10 dark:divide-amber-500/10 max-h-[360px] overscroll-contain">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-coffee-950 dark:text-[#F8EDE3]">
                    Tidak Ada Notifikasi
                  </h4>
                  <p className="text-xs text-coffee-600 dark:text-amber-300/60 max-w-xs mx-auto mt-0.5">
                    Aktivitas pemesanan, stok, atau perubahan katalog toko akan otomatis tercatat di sini.
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 transition-colors duration-150 flex items-start gap-3 cursor-pointer group ${
                    !item.isRead
                      ? 'bg-[#FBF5ED] dark:bg-[#281A12] hover:bg-[#F5ECE1] dark:hover:bg-[#322016]'
                      : 'bg-white dark:bg-[#1C120C] hover:bg-coffee-50/70 dark:hover:bg-[#221610]'
                  }`}
                >
                  {/* Category icon */}
                  {renderIcon(item.category, item.type)}

                  {/* Notification Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4
                        className={`text-xs leading-snug line-clamp-1 ${
                          !item.isRead
                            ? 'font-extrabold text-coffee-950 dark:text-amber-100'
                            : 'font-semibold text-coffee-800 dark:text-coffee-200'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-coffee-500 dark:text-amber-400/60 font-medium shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-coffee-700 dark:text-coffee-300 mt-1 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      {/* Read status & link */}
                      <div className="flex items-center gap-2">
                        {!item.isRead ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Belum dibaca
                          </span>
                        ) : (
                          <span className="text-[10px] text-coffee-400 dark:text-coffee-500 font-medium">
                            Sudah dibaca
                          </span>
                        )}
                        {item.link && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold group-hover:underline flex items-center gap-0.5">
                            Lihat <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Quick Item Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {!item.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="p-1 rounded text-coffee-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Tandai dibaca"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1 rounded text-coffee-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Hapus notifikasi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-[#FBF7F2] dark:bg-[#20140D] border-t border-amber-900/10 dark:border-amber-500/15 flex items-center justify-between shrink-0 text-xs">
            {/* Link to settings (for admin/owner) */}
            {showSettingsButton && (userRole === 'ADMIN' || userRole === 'OWNER') ? (
              <Link
                href="/admin/settings/notifications"
                onClick={() => setIsOpen(false)}
                className="font-bold text-coffee-700 dark:text-amber-300 hover:text-amber-600 dark:hover:text-amber-200 flex items-center gap-1.5 transition text-[11px]"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pengaturan WA & Email</span>
              </Link>
            ) : (
              <span className="text-[11px] text-coffee-500 dark:text-amber-400/60 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Katalog Real-time Aktif
              </span>
            )}

            {userRole === 'ADMIN' || userRole === 'OWNER' ? (
              <Link
                href="/admin/notifications"
                onClick={() => setIsOpen(false)}
                className="font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Pusat Notifikasi</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : userRole === 'PELANGGAN' ? (
              <Link
                href="/orders"
                onClick={() => setIsOpen(false)}
                className="font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Pesanan Saya</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <Link
                href="/kasir/orders"
                onClick={() => setIsOpen(false)}
                className="font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Panel Kasir</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

