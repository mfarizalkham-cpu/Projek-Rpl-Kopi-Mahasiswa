'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Coffee, ShoppingBag, User, LogOut, Shield, BarChart3, Truck, Store, Menu as MenuIcon, X, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    fetchUser();
    updateCartCount();

    // Listen for cart changes
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('kopi_cart') || '[]');
      const totalItems = cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
      setCartCount(totalItems);
    } catch {
      setCartCount(0);
    }
  };

  const openAIChat = () => {
    window.dispatchEvent(new CustomEvent('open-chatbot'));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout gagal.');
      setUser(null);
      setMobileMenuOpen(false);
      router.replace('/');
      router.refresh();
    } catch {
      setLogoutError('Logout gagal. Silakan coba lagi.');
    } finally {
      setLoggingOut(false);
    }
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-espresso-950/90 backdrop-blur-md border-b border-coffee-100 dark:border-coffee-900/60 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-coffee-800 to-coffee-600 dark:from-amber-600 dark:to-coffee-800 text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-coffee-950 dark:text-amber-100 tracking-tight block leading-none">
                KOPI MAHASISWA
              </span>
              <span className="text-[10px] text-coffee-500 dark:text-amber-400/70 font-medium tracking-widest uppercase block mt-0.5">
                F&B E-Commerce & POS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-medium text-sm text-coffee-700 dark:text-coffee-300">
            <Link
              href="/"
              className={`hover:text-coffee-900 dark:hover:text-amber-300 transition ${
                pathname === '/' ? 'text-coffee-900 dark:text-amber-300 font-bold border-b-2 border-coffee-800 dark:border-amber-400 pb-1' : ''
              }`}
            >
              Katalog Menu
            </Link>

            {user?.role === 'PELANGGAN' && (
              <Link
                href="/orders"
                className={`hover:text-coffee-900 dark:hover:text-amber-300 transition ${
                  pathname === '/orders' ? 'text-coffee-900 dark:text-amber-300 font-bold border-b-2 border-coffee-800 dark:border-amber-400 pb-1' : ''
                }`}
              >
                Pesanan Saya
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <div className="flex items-center gap-4 bg-coffee-50 dark:bg-espresso-900 px-3 py-1.5 rounded-lg border border-coffee-200 dark:border-coffee-800">
                <span className="text-xs font-bold text-coffee-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-red-600" /> Admin:
                </span>
                <Link href="/admin/menu" className="hover:text-coffee-900 dark:hover:text-amber-300 text-xs font-semibold">Menu</Link>
                <Link href="/admin/categories" className="hover:text-coffee-900 dark:hover:text-amber-300 text-xs font-semibold">Kategori</Link>
                <Link href="/admin/inventory" className="hover:text-coffee-900 dark:hover:text-amber-300 text-xs font-semibold">Stok</Link>
                <Link href="/admin/suppliers" className="hover:text-coffee-900 dark:hover:text-amber-300 text-xs font-semibold">Supplier</Link>
                <Link href="/admin/purchases" className="hover:text-coffee-900 dark:hover:text-amber-300 text-xs font-semibold">Pembelian</Link>
              </div>
            )}

            {user?.role === 'KASIR' && (
              <Link
                href="/kasir/orders"
                className="bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-transparent dark:border-amber-800 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-amber-200 dark:hover:bg-amber-900 transition"
              >
                <Store className="w-4 h-4 text-amber-700 dark:text-amber-400" /> POS Kasir
              </Link>
            )}

            {user?.role === 'OWNER' && (
              <Link
                href="/owner/dashboard"
                className="bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-transparent dark:border-blue-800 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-blue-200 dark:hover:bg-blue-900 transition"
              >
                <BarChart3 className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Owner Dashboard
              </Link>
            )}

            {user?.role === 'SUPPLIER' && (
              <Link
                href="/supplier/purchases"
                className="bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border border-transparent dark:border-purple-800 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-purple-200 dark:hover:bg-purple-900 transition"
              >
                <Truck className="w-4 h-4 text-purple-700 dark:text-purple-400" /> Pengadaan Supplier
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* AI Assistant Quick Icon Button (Simpel & Elegan) */}
            <button
              onClick={openAIChat}
              type="button"
              className="relative p-2.5 rounded-full transition-all duration-300 shadow-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/50 group bg-amber-50 hover:bg-amber-100 border-amber-300/80 text-amber-800 dark:bg-espresso-850 dark:hover:bg-espresso-800 dark:border-amber-500/30 dark:text-amber-400 active:scale-95"
              title="Tanya Barista AI (KopiBot)"
              aria-label="Tanya Barista AI"
            >
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              <span className="sr-only">Tanya AI</span>
              {/* Online Green Indicator Dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-espresso-950 shadow-sm"></span>
            </button>

            {/* Theme Toggle (Dark / Light Mode) */}
            <ThemeToggle />

            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-coffee-100 hover:bg-coffee-200 dark:bg-espresso-850 dark:hover:bg-espresso-800 text-coffee-900 dark:text-amber-300 border border-coffee-200 dark:border-coffee-700/60 transition flex items-center justify-center shadow-sm"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-espresso-950 shadow">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Login / Profile */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 bg-coffee-50 dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700/60 px-3 py-1.5 rounded-full">
                <User className="w-4 h-4 text-coffee-800 dark:text-amber-400" />
                <span className="text-xs font-semibold text-coffee-900 dark:text-coffee-100 max-w-[120px] truncate">{user.name}</span>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-coffee-800 hover:bg-coffee-900 dark:bg-amber-600 dark:hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <User className="w-4 h-4" /> Login
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Logout"
                title="Logout"
                className="bg-coffee-100 hover:bg-red-100 dark:bg-espresso-850 dark:hover:bg-red-950/50 text-coffee-800 hover:text-red-700 dark:text-coffee-200 dark:hover:text-red-300 p-2 rounded-xl border border-coffee-200 dark:border-coffee-700/60 transition disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-coffee-800 dark:text-coffee-200 hover:bg-coffee-100 dark:hover:bg-espresso-850 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>
      {logoutError && (
        <p role="alert" className="text-center text-xs text-red-700 dark:text-red-300 pb-2">
          {logoutError}
        </p>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-espresso-950 border-b border-coffee-200 dark:border-coffee-800 px-4 py-3 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md font-medium text-coffee-800 dark:text-coffee-200 hover:bg-coffee-50 dark:hover:bg-espresso-900"
          >
            Katalog Menu
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openAIChat();
            }}
            className="w-full text-left px-3 py-2 rounded-md font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-espresso-900 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Tanya Barista AI (KopiBot)
          </button>
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md font-medium text-coffee-800 dark:text-coffee-200 hover:bg-coffee-50 dark:hover:bg-espresso-900"
          >
            Keranjang Belanja ({cartCount})
          </Link>
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin/menu"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
            >
              Panel Admin
            </Link>
          )}
          {user?.role === 'KASIR' && (
            <Link
              href="/kasir/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"
            >
              POS Kasir
            </Link>
          )}
          {user?.role === 'OWNER' && (
            <Link
              href="/owner/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md font-medium text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40"
            >
              Dashboard Owner
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

