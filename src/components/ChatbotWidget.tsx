'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Bot, Sparkles, ShoppingBag, Plus, Check, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface RecommendedMenu {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  categoryName?: string;
  description?: string;
}

interface QuickAction {
  label: string;
  prompt: string;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  isError?: boolean;
  recommendedMenus?: RecommendedMenu[];
  quickActions?: QuickAction[];
}

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetNotification, setResetNotification] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});
  const [userRole, setUserRole] = useState<string>('PELANGGAN');
  const [userName, setUserName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ambil role pengguna aktif dari API Auth
  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserRole(data.user.role || 'PELANGGAN');
          setUserName(data.user.name || '');
          return data.user.role;
        }
      }
    } catch {}
    setUserRole('PELANGGAN');
    return 'PELANGGAN';
  };

  const getQuickActionsForRole = (role: string): QuickAction[] => {
    const r = role.toUpperCase();
    if (r === 'ADMIN') {
      const isUsersPage = pathname?.includes('/admin/users') || pathname?.includes('users');
      if (isUsersPage) {
        return [
          { label: '👥 Berapa Total User?', prompt: 'Berapa total user?' },
          { label: '🛡️ Role & Hak Akses', prompt: 'Apa saja role dan hak akses pengguna?' },
          { label: '📋 Daftar Pengguna', prompt: 'Siapa saja user di sistem?' },
          { label: '⚖️ Beda Order vs PO', prompt: 'Apa perbedaan pesanan Customer dan Purchase Order?' },
          { label: '🏪 Kondisi Operasional', prompt: 'Bantu jelaskan kondisi operasional toko' },
        ];
      }
      return [
        { label: '👥 Berapa Total User?', prompt: 'Berapa total user?' },
        { label: '⚖️ Beda Order vs PO', prompt: 'Apa perbedaan pesanan Customer dan Purchase Order?' },
        { label: '👥 Pelanggan Pemesan', prompt: 'Siapa pelanggan yang melakukan pemesanan?' },
        { label: '🏪 Kondisi Operasional', prompt: 'Bantu jelaskan kondisi operasional toko' },
        { label: '☕ Total Menu', prompt: 'Berapa total menu?' },
      ];
    }

    if (r === 'OWNER') {
      return [
        { label: '💵 Berapa Omzet Toko?', prompt: 'Berapa omzet toko?' },
        { label: '🏆 Produk Paling Laris', prompt: 'Produk apa yang paling laris?' },
        { label: '⚠️ Stok Kritis', prompt: 'Produk apa yang stoknya habis?' },
        { label: '🚚 Kondisi Pengadaan', prompt: 'Bagaimana kondisi pengadaan barang?' },
        { label: '📊 Ringkasan Bisnis', prompt: 'Berikan ringkasan kondisi bisnis' },
      ];
    }

    if (r === 'KASIR') {
      return [
        { label: '📊 Ringkasan Penjualan', prompt: 'Bagaimana ringkasan aktivitas penjualan?' },
        { label: '💳 Jumlah Transaksi', prompt: 'Berapa jumlah transaksi yang tercatat?' },
        { label: '📋 Info Operasional Kasir', prompt: 'Apa saja informasi operasional yang perlu saya perhatikan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
      ];
    }

    if (r === 'SUPPLIER') {
      return [
        { label: '📦 Berapa PO Saya?', prompt: 'Berapa Purchase Order yang saya miliki?' },
        { label: '⏳ Status PO Terbaru', prompt: 'Bagaimana status PO terbaru?' },
        { label: '🚚 Ringkasan Pengadaan', prompt: 'Tampilkan ringkasan pengadaan' },
        { label: '📋 Detail PO Saya', prompt: 'Apa saja detail PO saya?' },
      ];
    }

    // Default Customer / Pelanggan
    return [
      { label: '📦 Status Pesanan Saya', prompt: 'Bagaimana status pesanan saya?' },
      { label: '🛒 Cek Keranjang Belanja', prompt: 'Apa saja produk dalam keranjang saya?' },
      { label: '📋 Produk Tersedia', prompt: 'Produk apa saja yang tersedia?' },
      { label: '📜 Riwayat Pesanan', prompt: 'Tolong jelaskan riwayat pesanan saya' },
      { label: '🏷️ Promo Diskon', prompt: 'Apakah ada promo?' },
    ];
  };

  const buildWelcomeMessage = (role: string): Message => {
    const r = role.toUpperCase();
    let introText = '';

    if (r === 'ADMIN') {
      const isUsersPage = pathname?.includes('/admin/users') || pathname?.includes('users');
      if (isUsersPage) {
        introText =
          `Halo **Admin Utama**! ☕🛡️ Selamat datang di **Manajemen Pengguna Sistem**.\n\n` +
          `AI Assistant tersinkronisasi langsung dengan data 6 kartu panel dasbor:\n` +
          `• 👥 **Total User**: Mengetahui jumlah seluruh akun personil aktif terdaftar.\n` +
          `• 🛡️ **Role & Kontrol Akses**: Meninjau status Admin, Owner, Kasir, Pelanggan, dan Supplier.\n` +
          `• 📋 **Daftar Akun**: Menampilkan nama personil, email resmi, dan kontak aktif.\n\n` +
          `Silakan tanyakan *"berapa total user"*, *"daftar pengguna"*, atau pilih pintasan di bawah! 😊`;
      } else {
        introText =
          `Halo **Admin Utama**! ☕🛡️ Selamat datang di **Admin AI Assistant — Kopi Mahasiswa**.\n\n` +
          `Fokus: **Pengelolaan & Pengawasan Sistem** terintegrasi database real-time:\n` +
          `• 👥 **Pelanggan & Pesanan**: Memantau seluruh pesanan pelanggan & data customer.\n` +
          `• ⚖️ **Order vs PO**: Membedakan pesanan customer (omzet) dengan Purchase Order supplier (HPP).\n` +
          `• 🏪 **Operasional Toko**: Ringkasan lengkap katalog menu, inventori stok, dan transaksi.\n` +
          `• 👥 **Manajemen Pengguna**: Kontrol akses seluruh personil kedai.\n\n` +
          `Silakan ketik pertanyaan atau klik tombol pintasan di bawah! 😊`;
      }
    } else if (r === 'OWNER') {
      introText =
        `Halo **Pak/Bu Owner**! 👑📊 Selamat datang di **Owner AI Assistant — Kopi Mahasiswa**.\n\n` +
        `Fokus: **Analisis Bisnis & Pengawasan Usaha**:\n` +
        `• 💵 **Omzet Penjualan**: Total pendapatan transaksi selesai, HPP, & laba kotor.\n` +
        `• 🏆 **Performa Menu**: Peringkat menu paling laris (best seller).\n` +
        `• ⚠️ **Stok Kritis**: Memantau bahan baku yang menipis atau habis.\n` +
        `• 🚚 **Pengadaan Supplier**: Ringkasan Purchase Order (PO) & total nilai pengadaan.\n` +
        `• 📈 **Evaluasi Margin**: Kesehatan finansial kedai secara menyeluruh.\n\n` +
        `Ada analisis bisnis atau keputusan strategis yang ingin ditinjau, Boss? 📈☕`;
    } else if (r === 'KASIR') {
      introText =
        `Halo **Kasir Kopi Mahasiswa**! ☕💵 Selamat datang di **Kasir AI Assistant**.\n\n` +
        `Fokus: **Dukungan Operasional Transaksi & Point of Sale (POS)**:\n` +
        `• 📊 **Aktivitas Penjualan**: Rekap transaksi harian lunas (QRIS & Tunai).\n` +
        `• ⏳ **Alur Antrean**: Memantau pesanan yang perlu diracik dan disajikan.\n` +
        `• 📦 **Ketersediaan Menu**: Memastikan bahan menu mencukupi untuk disajikan.\n\n` +
        `Semangat melayani pelanggan kedai hari ini! ☕💪`;
    } else if (r === 'SUPPLIER') {
      introText =
        `Halo **Mitra Supplier**! 🚚📦 Selamat datang di **Supplier AI Assistant**.\n\n` +
        `Fokus: **Informasi Pengadaan & Purchase Order (PO)**:\n` +
        `• 📦 **Purchase Order Anda**: Jumlah dan status PO aktif untuk pengiriman bahan baku.\n` +
        `• ⏳ **Status PO Terbaru**: Rincian kuantitas bahan, nilai PO, dan status penerimaan.\n` +
        `• 🚚 **Isolasi Data**: Data pengadaan terlindungi dan terhubung khusus untuk akun mitra Anda.\n\n` +
        `Ada detail pengadaan yang ingin Anda cek hari ini? 📦🤝`;
    } else {
      introText =
        `Halo Kak! ☕🛍️ Selamat datang di **Customer AI Assistant — Kopi Mahasiswa**!\n\n` +
        `Fokus: **Asisten Belanja Pribadi Pelanggan**:\n` +
        `• 📦 **Pesanan Saya**: Cek status racikan pesanan aktif & nomor order.\n` +
        `• 🛒 **Keranjang Belanja**: Pantau item di keranjang & total belanja.\n` +
        `• 📜 **Riwayat Belanja**: Catatan pesanan sebelumnya & poin reward.\n` +
        `• 🏷️ **Promo Mahasiswa**: Diskon 20% all coffee dengan kode voucher \`MHS2026\`.\n\n` +
        `Ada menu kopi yang ingin dinikmati hari ini? 😊✨`;
    }

    return {
      id: 'welcome-1',
      sender: 'bot',
      text: introText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      quickActions: getQuickActionsForRole(role),
    };
  };

  // Listen to external open events (e.g., from Navbar or Hero buttons)
  useEffect(() => {
    const handleOpenChat = () => {
      fetchUserRole();
      setIsOpen(true);
    };
    window.addEventListener('open-chatbot', handleOpenChat);
    return () => window.removeEventListener('open-chatbot', handleOpenChat);
  }, []);

  // Inisialisasi chat dan auth
  useEffect(() => {
    fetchUserRole().then((currentRole) => {
      try {
        const savedHistory = localStorage.getItem('kopibot_chat_history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
      setMessages([buildWelcomeMessage(currentRole)]);
    });
  }, []);

  // Update welcome message if role changed and only 1 message
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome-1') {
      setMessages([buildWelcomeMessage(userRole)]);
    }
  }, [userRole]);

  // Sync messages to localStorage whenever updated
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('kopibot_chat_history', JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserRole();
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const recentHistory = messages.slice(-8).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      // Pastikan role tersinkronisasi langsung dengan auth session backend saat ini
      let currentRole = userRole;
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user?.role) {
            currentRole = meData.user.role;
            setUserRole(currentRole);
            if (meData.user.name) setUserName(meData.user.name);
          }
        }
      } catch {}

      let cartItems = [];
      try {
        cartItems = JSON.parse(localStorage.getItem('kopi_cart') || '[]');
      } catch {}

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          role: currentRole,
          cart: cartItems,
          history: [...recentHistory, { sender: 'user', text: query.trim() }],
          pathname: pathname,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && (data.answer || data.reply)) {
        const responseText = data.answer || data.reply;
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: responseText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          recommendedMenus: data.recommendedMenus,
          quickActions: data.quickActions || getQuickActionsForRole(userRole),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMessage = data?.error || 'Gagal memproses pesan ke backend AI.';
        const botErrMsg: Message = {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          isError: true,
          text: `⚠️ **Terjadi Kesalahan Sistem:**\n${errorMessage}\n\nSilakan coba tanyakan kembali atau periksa status koneksi database kedai.`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          quickActions: getQuickActionsForRole(userRole),
        };
        setMessages((prev) => [...prev, botErrMsg]);
      }
    } catch (err: any) {
      console.error('Fetch error in ChatbotWidget:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          isError: true,
          text: '⚠️ **Gangguan Jaringan:**\nKoneksi ke backend server gagal. Pastikan server lokal aktif dan coba kirim kembali pesan Anda.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          quickActions: getQuickActionsForRole(userRole),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Reset Chat Handler
  const handleResetChat = () => {
    localStorage.removeItem('kopibot_chat_history');
    const resetMsg: Message = {
      ...buildWelcomeMessage(userRole),
      id: `welcome-reset-${Date.now()}`,
      text: `✨ **Histori percakapan telah dibersihkan!**\n\nHalo kembali! 👋 Ada yang ingin ditanyakan seputar laporan bisnis, varian menu aktif, atau promo Kopi Mahasiswa?`,
    };
    setMessages([resetMsg]);
    setShowConfirmReset(false);
    setResetNotification(true);
    setTimeout(() => setResetNotification(false), 3000);
  };

  const handleAddToCart = (menu: RecommendedMenu) => {
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

      setAddedItemIds((prev) => ({ ...prev, [menu.id]: true }));
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [menu.id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  // Text Formatter: Supports bold (**text**), code (`code`), and italics (*text*)
  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\[[^\]]+\]\(\/(?:admin\/notifications|admin\/menu|admin\/users|admin)\/?\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
      return (
        <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
          {parts.map((part, pIdx) => {
            const linkMatch = part.match(/^\[([^\]]+)\]\((\/(?:admin\/notifications|admin\/menu|admin\/users|admin)\/?)\)$/);
            if (linkMatch) {
              return (
                <a
                  key={pIdx}
                  href={linkMatch[2]}
                  className="font-bold text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
                >
                  {linkMatch[1]}
                </a>
              );
            }
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-coffee-950 dark:text-amber-300">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code
                  key={pIdx}
                  className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono font-bold border border-amber-300/40 dark:border-amber-700/50"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="italic text-coffee-700 dark:text-amber-200/90">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* 1. Floating Action Icon Button */}
      {!isOpen && (
        <div className="relative group">
          <div className="absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap bg-coffee-950/95 dark:bg-espresso-850/95 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl border border-amber-500/30 backdrop-blur-md">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tanya Barista & Assistant AI
            </span>
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-coffee-950/95 dark:bg-espresso-850/95 border-t border-r border-amber-500/30 rotate-45"></div>
          </div>

          <button
            onClick={() => {
              fetchUserRole();
              setIsOpen(true);
            }}
            className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 dark:from-amber-600 dark:via-coffee-900 dark:to-espresso-950 text-coffee-950 dark:text-amber-300 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-amber-200 dark:border-amber-500/50 shadow-amber-500/30 hover:shadow-amber-500/50"
            aria-label="Buka Chat Barista & Assistant AI Kopi Mahasiswa"
            title="Tanya Barista & Assistant AI Kopi Mahasiswa"
          >
            <span className="absolute -inset-1 rounded-full bg-amber-400/40 dark:bg-amber-400/20 blur-md animate-pulse"></span>
            <div className="relative z-10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-coffee-950 dark:text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-espresso-950 rounded-full animate-ping"></span>
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-espresso-950 rounded-full shadow-sm"></span>
          </button>
        </div>
      )}

      {/* 2. Modern Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[440px] h-[620px] max-h-[85vh] bg-white dark:bg-espresso-950 rounded-3xl shadow-2xl border-2 border-amber-500/30 dark:border-amber-500/40 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 backdrop-blur-xl transition-colors duration-300">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-coffee-950 via-coffee-900 to-amber-950 dark:from-espresso-950 dark:via-espresso-900 dark:to-coffee-950 text-white p-4 px-5 flex items-center justify-between shadow-lg relative border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 text-coffee-950 flex items-center justify-center shadow-lg border border-amber-200">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-coffee-950 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide text-white flex items-center gap-2">
                  {userRole === 'ADMIN' && 'Admin AI Assistant'}
                  {userRole === 'OWNER' && 'Owner AI Assistant'}
                  {userRole === 'KASIR' && 'Kasir AI Assistant'}
                  {userRole === 'SUPPLIER' && 'Supplier AI Assistant'}
                  {userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KASIR' && userRole !== 'SUPPLIER' && 'Customer AI Assistant'}
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> 5-Role AI
                  </span>
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                    {userRole === 'ADMIN' && '🛡️ Pengelolaan & Pengawasan'}
                    {userRole === 'OWNER' && '👑 Analisis Bisnis & Omzet'}
                    {userRole === 'KASIR' && '💵 Operasional POS & Kasir'}
                    {userRole === 'SUPPLIER' && '🚚 Pengadaan & Purchase Order'}
                    {userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'KASIR' && userRole !== 'SUPPLIER' && '🛍️ Asisten Belanja Pribadi'}
                  </span>
                  <p className="text-[11px] text-coffee-200 font-medium">Kopi Mahasiswa</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirmReset(true)}
                title="Reset Histori Chat"
                className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-coffee-300 hover:text-white hover:bg-white/10 rounded-xl transition"
                aria-label="Tutup Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Confirm Reset Popup Overlay */}
            {showConfirmReset && (
              <div className="absolute inset-0 bg-coffee-950/95 dark:bg-espresso-950/95 backdrop-blur-md p-5 flex flex-col justify-center items-center text-center z-20 animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
                  <Trash2 className="w-6 h-6 animate-bounce" />
                </div>
                <h4 className="font-extrabold text-base text-white">Reset Histori Percakapan?</h4>
                <p className="text-xs text-coffee-200 mt-1 mb-4 max-w-xs">
                  Semua riwayat chat dengan Barista AI akan dibersihkan kembali ke awal.
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-4 py-2 bg-coffee-800 hover:bg-coffee-700 text-coffee-200 rounded-xl text-xs font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleResetChat}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Ya, Bersihkan Chat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Toast Notification Banner */}
          {resetNotification && (
            <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-semibold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Histori chat berhasil dibersihkan!
              </span>
              <button onClick={() => setResetNotification(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-grow p-4 sm:p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-amber-50/30 via-white to-coffee-50/30 dark:from-espresso-950 dark:via-espresso-900 dark:to-espresso-950 text-sm scrollbar-thin scrollbar-thumb-coffee-200 dark:scrollbar-thumb-coffee-800 transition-colors duration-300">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex gap-2.5 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Bot Avatar Icon */}
                  {msg.sender === 'bot' && (
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-md border ${
                        msg.isError
                          ? 'bg-red-950 text-red-400 border-red-500/40'
                          : 'bg-gradient-to-tr from-coffee-900 to-amber-950 dark:from-amber-600 dark:to-coffee-900 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {msg.isError ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 shadow-sm text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-coffee-900 via-coffee-800 to-amber-950 dark:from-amber-700 dark:via-amber-800 dark:to-coffee-900 text-white rounded-tr-none border border-amber-500/30'
                        : msg.isError
                        ? 'bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 rounded-tl-none shadow-sm'
                        : 'bg-white dark:bg-espresso-850 border border-coffee-100/90 dark:border-coffee-700/60 text-coffee-950 dark:text-coffee-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {formatText(msg.text)}

                    {/* Recommended Menu Cards */}
                    {msg.recommendedMenus && msg.recommendedMenus.length > 0 && (
                      <div className="mt-3.5 space-y-2 border-t border-coffee-100 dark:border-coffee-800 pt-3">
                        <p className="text-[11px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Menu Terkait (Klik Beli untuk Masuk Keranjang):
                        </p>

                        {msg.recommendedMenus.map((menu) => (
                          <div
                            key={menu.id}
                            className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 dark:from-espresso-900 dark:via-espresso-850 dark:to-espresso-900 p-3 rounded-2xl border border-amber-300/60 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-md transition group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {menu.imageUrl ? (
                                <img
                                  src={menu.imageUrl}
                                  alt={menu.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-coffee-200 dark:border-coffee-700 shrink-0 group-hover:scale-105 transition"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-espresso-800 flex items-center justify-center text-coffee-800 dark:text-amber-300 font-bold text-sm shrink-0">
                                  ☕
                                </div>
                              )}
                              <div className="truncate">
                                <h4 className="font-extrabold text-xs text-coffee-950 dark:text-coffee-50 truncate">
                                  {menu.name}
                                </h4>
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mt-0.5">
                                  {formatRupiah(menu.price)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddToCart(menu)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all shrink-0 shadow-sm active:scale-95 ${
                                addedItemIds[menu.id]
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-coffee-900 hover:bg-coffee-950 dark:bg-amber-600 dark:hover:bg-amber-700 text-amber-300 dark:text-white border border-amber-500/30'
                              }`}
                            >
                              {addedItemIds[menu.id] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-white" /> Ditambahkan
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" /> Beli
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span
                      className={`text-[10px] block mt-2 text-right font-medium ${
                        msg.sender === 'user' ? 'text-coffee-200' : 'text-coffee-400 dark:text-coffee-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {/* Quick Action Suggestion Pills */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pl-10 max-w-full">
                    {msg.quickActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSendMessage(action.prompt)}
                        className="text-xs bg-white hover:bg-amber-100/80 text-coffee-900 border border-amber-300/80 hover:border-amber-400 dark:bg-espresso-850 dark:hover:bg-espresso-800 dark:text-amber-200 dark:border-amber-500/40 px-3.5 py-1.5 rounded-full font-semibold transition shadow-xs hover:scale-105 active:scale-95 flex items-center gap-1"
                      >
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2.5 text-coffee-600 dark:text-coffee-400 text-xs pl-1 animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-coffee-900 dark:bg-amber-600 text-amber-300 dark:text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-espresso-850 border border-amber-300/60 dark:border-amber-500/30 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 text-coffee-800 dark:text-coffee-200 font-medium">
                  <span>Barista AI membaca database MySQL</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-300"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Action Status Bar */}
          <div className="px-4 py-1.5 bg-coffee-50/80 dark:bg-espresso-900 border-t border-coffee-100 dark:border-coffee-800 flex items-center justify-between text-[11px] text-coffee-600 dark:text-coffee-400 font-medium">
            <span className="flex items-center gap-1 text-coffee-700 dark:text-amber-400 font-semibold">
              <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" /> Terhubung Real-Time Database MySQL
            </span>
            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-coffee-600 dark:text-coffee-400 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" /> Bersihkan Chat
            </button>
          </div>

          {/* Footer Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-espresso-950 border-t border-coffee-100 dark:border-coffee-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                userRole === 'OWNER' || userRole === 'ADMIN'
                  ? 'Tanya total pesanan, varian menu aktif, pendapatan...'
                  : 'Tanya varian menu aktif, harga kopi, promo...'
              }
              className="flex-grow text-xs sm:text-sm px-4 py-2.5 bg-coffee-50/80 dark:bg-espresso-850 rounded-2xl border border-coffee-200 dark:border-coffee-700 focus:outline-none focus:ring-2 focus:ring-amber-500/60 text-coffee-950 dark:text-white placeholder-coffee-400 dark:placeholder-coffee-500 font-medium transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-coffee-950 via-coffee-900 to-amber-950 dark:from-amber-600 dark:via-coffee-900 dark:to-espresso-950 text-amber-300 dark:text-white flex items-center justify-center shadow-md hover:opacity-95 active:scale-95 transition disabled:opacity-40 disabled:scale-100 shrink-0 border border-amber-500/30"
              title="Kirim Pertanyaan (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
