'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Coffee, 
  LayoutDashboard, 
  Package, 
  Truck, 
  ShoppingCart, 
  Layers, 
  Bot, 
  Sparkles, 
  Store, 
  ArrowLeft, 
  ShieldCheck,
  ChevronRight,
  Bell,
  Users
} from 'lucide-react';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuGroups: MenuGroup[] = [
    {
      group: 'Menu Utama',
      items: [
        {
          title: 'Dashboard Overview',
          href: '/admin',
          icon: LayoutDashboard,
        },
        {
          title: 'Pusat Notifikasi',
          href: '/admin/notifications',
          icon: Bell,
          badge: 'Real-time',
        },
        {
          title: 'Katalog & Resep Menu',
          href: '/admin/menu',
          icon: Coffee,
        },
        {
          title: 'Kategori Produk',
          href: '/admin/categories',
          icon: Layers,
        },
      ],
    },
    {
      group: 'Operasional & Stok',
      items: [
        {
          title: 'Stok & Inventori Bahan',
          href: '/admin/inventory',
          icon: Package,
        },
        {
          title: 'Daftar Supplier',
          href: '/admin/suppliers',
          icon: Truck,
        },
        {
          title: 'Pengadaan Bahan Baku',
          href: '/admin/purchases',
          icon: ShoppingCart,
        },
      ],
    },
    {
      group: 'Pengaturan / Akses',
      items: [
        {
          title: 'Manajemen Pengguna',
          href: '/admin/users',
          icon: Users,
          badge: 'Role & User',
        },
        {
          title: '🤖 Pengaturan AI',
          href: '/admin/settings/ai',
          icon: Bot,
          badge: 'Switcher',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 flex-none bg-[#180E09] border-r border-[#382216] flex flex-col justify-between min-h-screen z-20 text-white select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-[#352015] bg-[#20130C]">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 text-[#1F120D] flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#F9EFE7] block leading-tight">
                KOPI MAHASISWA
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Admin Control
              </span>
            </div>
          </Link>
        </div>

        {/* Menu Navigation */}
        <div className="py-5 px-3 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <h4 className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#8F7768]">
                {group.group}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-[#C9B5A7] hover:text-white hover:bg-[#261710] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-[#9A8273]'}`} />
                        <span>{item.title}</span>
                      </div>

                      {item.badge ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Switch back to Store */}
      <div className="p-4 border-t border-[#352015] bg-[#1E120B] space-y-2">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl bg-[#281810] hover:bg-[#341F15] border border-[#482D1E] text-xs font-bold text-[#EAD8CD] hover:text-white transition shadow-sm"
        >
          <Store className="w-4 h-4 text-amber-400" />
          <span>Kembali ke Katalog Toko</span>
        </Link>
      </div>
    </aside>
  );
}

