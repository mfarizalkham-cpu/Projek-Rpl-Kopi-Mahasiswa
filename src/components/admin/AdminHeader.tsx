'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Store, ShieldCheck, User } from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout gagal.');
      setUser(null);
      router.replace('/');
      router.refresh();
    } catch {
      setLogoutError('Logout gagal. Silakan coba lagi.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-16 px-6 bg-[#180E09] border-b border-[#352015] flex items-center justify-between text-white shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#F9EFE7]">
          Panel Manajemen Admin
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Real-time System
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick link to Store */}
        <Link
          href="/"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#281810] hover:bg-[#341F15] border border-[#482D1E] text-xs font-semibold text-[#EAD8CD] hover:text-white transition"
        >
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span>Katalog Toko</span>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Real-time Notification Dropdown */}
        <NotificationDropdown align="right" showSettingsButton={true} />

        {/* User Profile Pill */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 bg-[#25150E] border border-[#3E2316] px-3 py-1.5 rounded-full">
            <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-[#EAD8CD] max-w-[120px] truncate">
              {user.name}
            </span>
          </div>
        )}
        {logoutError && <span role="alert" className="text-xs text-red-300">{logoutError}</span>}
        {user && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Logout"
            title="Logout"
            className="p-2 rounded-lg text-[#EAD8CD] hover:bg-red-950/60 hover:text-red-300 transition disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}

