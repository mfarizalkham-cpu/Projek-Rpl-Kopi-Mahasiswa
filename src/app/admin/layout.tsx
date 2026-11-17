import React from 'react';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Admin Dashboard - Kopi Mahasiswa',
  description: 'Panel Manajemen E-Commerce F&B, Inventori, Resep & Pengaturan AI Kopi Mahasiswa',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-950 dark:bg-[#120D0A] text-white">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-900 dark:bg-[#1E120B] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
