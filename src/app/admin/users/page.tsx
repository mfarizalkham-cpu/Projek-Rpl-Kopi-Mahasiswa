'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Coffee,
  Crown,
  Briefcase,
  ShoppingBag,
  Truck
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OWNER' | 'KASIR' | 'PELANGGAN' | 'SUPPLIER';
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  total: number;
  admin: number;
  owner: number;
  kasir: number;
  pelanggan: number;
  supplier: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    admin: 0,
    owner: 0,
    kasir: 0,
    pelanggan: 0,
    supplier: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'PELANGGAN',
    password: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRole !== 'ALL') params.set('role', selectedRole);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        showToast('error', data.error || 'Gagal mengambil data user');
      }
    } catch {
      showToast('error', 'Koneksi server gagal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'PELANGGAN',
      password: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      showToast('error', 'Semua kolom bertanda bintang wajib diisi');
      return;
    }

    try {
      setFormLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message || 'User berhasil ditambahkan');
        setIsAddModalOpen(false);
        fetchUsers();
      } else {
        showToast('error', data.error || 'Gagal menambahkan user');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setFormLoading(true);
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message || 'Data pengguna berhasil diperbarui');
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        showToast('error', data.error || 'Gagal memperbarui pengguna');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setFormLoading(true);
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message || 'Pengguna berhasil dihapus');
        setIsDeleteModalOpen(false);
        fetchUsers();
      } else {
        showToast('error', data.error || 'Gagal menghapus pengguna');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem');
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Admin
          </span>
        );
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Owner
          </span>
        );
      case 'KASIR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <Briefcase className="w-3.5 h-3.5 text-orange-400" /> Kasir
          </span>
        );
      case 'PELANGGAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" /> Pelanggan
          </span>
        );
      case 'SUPPLIER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Truck className="w-3.5 h-3.5 text-purple-400" /> Supplier
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/15 text-gray-300 border border-gray-500/30">
            {role}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold transition animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#2D1B14] border border-[#4A2E22] p-8 shadow-2xl text-white">
        <div className="absolute -right-8 -top-8 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              <Users className="w-3.5 h-3.5 text-amber-400" /> Kontrol Akses & Hak Pengguna
            </div>
            <h1 className="text-3xl font-black text-[#F7E7CE] tracking-tight">
              Manajemen Pengguna Sistem
            </h1>
            <p className="text-sm text-[#D7C4B7] max-w-xl leading-relaxed">
              Kelola akun seluruh personil Kopi Mahasiswa mulai dari Admin Utama, Owner, Kasir, Pelanggan, 
              hingga Mitra Supplier dalam satu dasbor terpadu.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold px-5 py-3.5 rounded-2xl shadow-lg transition active:scale-95 shrink-0"
          >
            <UserPlus className="w-5 h-5" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-4 space-y-1 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#BCA798]">Total User</span>
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <span className="text-[10px] text-amber-400 block">Semua akun aktif</span>
        </div>

        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-4 space-y-1 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#BCA798]">Admin</span>
          <div className="text-2xl font-black text-rose-400">{stats.admin}</div>
          <span className="text-[10px] text-rose-300 block">Akses Penuh</span>
        </div>

        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-4 space-y-1 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#BCA798]">Owner</span>
          <div className="text-2xl font-black text-amber-400">{stats.owner}</div>
          <span className="text-[10px] text-amber-300 block">Eksekutif</span>
        </div>

        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-4 space-y-1 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#BCA798]">Kasir</span>
          <div className="text-2xl font-black text-orange-400">{stats.kasir}</div>
          <span className="text-[10px] text-orange-300 block">Operasional POS</span>
        </div>

        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-4 space-y-1 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#BCA798]">Pelanggan</span>
          <div className="text-2xl font-black text-emerald-400">{stats.pelanggan}</div>
          <span className="text-[10px] text-emerald-300 block">Member Kedai</span>
        </div>

        <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-4 space-y-1 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#BCA798]">Supplier</span>
          <div className="text-2xl font-black text-purple-400">{stats.supplier}</div>
          <span className="text-[10px] text-purple-300 block">Mitra Bahan Baku</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#241610] border border-[#3E271D] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Role Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'ADMIN', label: 'Admin' },
              { id: 'OWNER', label: 'Owner' },
              { id: 'KASIR', label: 'Kasir' },
              { id: 'PELANGGAN', label: 'Pelanggan' },
              { id: 'SUPPLIER', label: 'Supplier' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRole(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedRole === tab.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-[#1C120C] text-[#C4B2A5] hover:bg-[#2C1D14] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#A89284] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, email, no HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A100B] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#8A7669] focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#241610] border border-[#3E271D] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3E271D] bg-[#1E110A] text-[#BCA798] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-5">Nama & Profil</th>
                <th className="py-4 px-5">Role Akses</th>
                <th className="py-4 px-5">Kontak</th>
                <th className="py-4 px-5">Terdaftar Sejak</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#331F16] text-sm text-[#E2D2C6]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#A89284]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-xs">Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#A89284]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-[#5C4334]" />
                      <span className="text-sm font-semibold text-[#C4B2A5]">
                        Tidak ada pengguna yang cocok dengan kriteria pencarian
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#2C1D14]/70 transition group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-extrabold flex items-center justify-center border border-amber-500/30 uppercase text-sm shrink-0">
                          {user.name ? user.name.slice(0, 2) : 'KM'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-amber-300 transition">
                            {user.name}
                          </div>
                          <div className="text-xs text-[#A89284] flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-[#7B6658]" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      {getRoleBadge(user.role)}
                    </td>

                    <td className="py-4 px-5 text-xs text-[#D7C4B7]">
                      {user.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-amber-400/80" />
                          {user.phone}
                        </span>
                      ) : (
                        <span className="text-[#756154] italic">- Belum diisi -</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-xs text-[#A89284]">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 rounded-xl bg-[#1D110A] hover:bg-amber-500/20 text-[#C4B2A5] hover:text-amber-300 border border-[#3E271D] hover:border-amber-500/40 transition"
                          title="Edit Pengguna"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(user)}
                          className="p-2 rounded-xl bg-[#1D110A] hover:bg-rose-500/20 text-[#C4B2A5] hover:text-rose-400 border border-[#3E271D] hover:border-rose-500/40 transition"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#241610] border border-[#4A2E22] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#3E271D] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#F9EFE7]">Tambah Pengguna Baru</h3>
                  <p className="text-xs text-[#A89284]">Daftarkan akun staf kedai atau pelanggan baru</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8C7668] hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C7668] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">
                  Email Akun <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C7668] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@kopimahasiswa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">
                  Nomor WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8C7668] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">
                    Role Akun <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="PELANGGAN">Pelanggan</option>
                    <option value="KASIR">Kasir</option>
                    <option value="ADMIN">Admin Utama</option>
                    <option value="OWNER">Owner</option>
                    <option value="SUPPLIER">Supplier Mitra</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8C7668] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3E271D]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#180E09] hover:bg-[#2C1D14] text-[#C4B2A5] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit User */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#241610] border border-[#4A2E22] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#3E271D] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#F9EFE7]">Edit Pengguna</h3>
                  <p className="text-xs text-[#A89284]">Perbarui data dan role akun {selectedUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#8C7668] hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C7668] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">Email Akun</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C7668] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">Nomor Telepon / WA</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8C7668] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">Role Pengguna</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="PELANGGAN">Pelanggan</option>
                    <option value="KASIR">Kasir</option>
                    <option value="ADMIN">Admin Utama</option>
                    <option value="OWNER">Owner</option>
                    <option value="SUPPLIER">Supplier Mitra</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#D7C4B7] block mb-1.5">
                    Password Baru <span className="text-xs font-normal text-[#8C7668]">(opsional)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8C7668] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Kosongkan jika tak diubah"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#180E09] border border-[#3E271D] focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3E271D]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#180E09] hover:bg-[#2C1D14] text-[#C4B2A5] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-50"
                >
                  {formLoading ? 'Memperbarui...' : 'Perbarui Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus User */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#241610] border border-[#4A2E22] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-extrabold text-lg text-[#F9EFE7]">Hapus Pengguna?</h3>
              <p className="text-xs text-[#C4B2A5] leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <span className="font-bold text-white">{selectedUser.name}</span> ({selectedUser.email})? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#180E09] hover:bg-[#2C1D14] text-[#C4B2A5] transition flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={formLoading}
                onClick={handleDeleteUser}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex-1 disabled:opacity-50"
              >
                {formLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

