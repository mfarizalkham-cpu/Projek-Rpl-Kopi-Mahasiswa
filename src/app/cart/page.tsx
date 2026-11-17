'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ShieldCheck, CreditCard, QrCode, Banknote, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import PantunNotificationCard from '@/components/PantunNotificationCard';

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'CASH' | 'BANK_TRANSFER'>('QRIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  useEffect(() => {
    loadCart();
    loadCustomerDetails();
  }, []);

  const loadCustomerDetails = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return;

      const data = await res.json();
      if (data.user?.name) setCustomerName(data.user.name);
      if (data.user?.phone) setCustomerPhone(data.user.phone);
    } catch (err) {
      console.error('Gagal memuat informasi akun pelanggan:', err);
    }
  };

  const loadCart = () => {
    try {
      const items = JSON.parse(localStorage.getItem('kopi_cart') || '[]');
      setCart(items);
    } catch {
      setCart([]);
    }
  };

  const updateQuantity = (menuId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.menuId === menuId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    setCart(updated);
    localStorage.setItem('kopi_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (menuId: string) => {
    const updated = cart.filter((item) => item.menuId !== menuId);
    setCart(updated);
    localStorage.setItem('kopi_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  // Estimated frontend total for display only (Server re-calculates 100%)
  const clientSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ menuId: i.menuId, quantity: i.quantity })),
          customerName,
          customerPhone,
          notes,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal melakukan checkout');
      }

      // Clear local cart on success
      localStorage.removeItem('kopi_cart');
      window.dispatchEvent(new Event('cart-updated'));
      setSuccessOrder({ ...data.order, whatsapp: data.whatsapp });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-espresso-950 rounded-3xl border border-coffee-200 dark:border-coffee-700/60 shadow-xl text-center space-y-6 transition-colors duration-300">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-700">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-coffee-950 dark:text-amber-100">Pesanan & Pembayaran Berhasil!</h2>
          <p className="text-xs text-coffee-600 dark:text-coffee-300">Nomor Transaksi: <span className="font-bold text-coffee-950 dark:text-amber-300">{successOrder.orderNumber}</span></p>
        </div>

        {/* Pantun & Happy Quote Notification */}
        <PantunNotificationCard customerName={successOrder.customerName} orderNumber={successOrder.orderNumber} />

        <div className="bg-coffee-50 dark:bg-espresso-900 p-4 rounded-2xl text-left border border-coffee-100 dark:border-coffee-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-coffee-600 dark:text-coffee-400">Pemesan:</span>
            <span className="font-bold text-coffee-950 dark:text-amber-100">{successOrder.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-coffee-600 dark:text-coffee-400">Status Pesanan:</span>
            <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold px-2 py-0.5 rounded uppercase text-[10px]">{successOrder.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-coffee-600 dark:text-coffee-400">Metode Pembayaran:</span>
            <span className="font-bold text-coffee-950 dark:text-amber-100">{successOrder.payment?.paymentMethod || paymentMethod}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-coffee-200 dark:border-coffee-800 text-sm">
            <span className="font-bold text-coffee-900 dark:text-coffee-200">Total Pembayaran:</span>
            <span className="font-extrabold text-coffee-950 dark:text-amber-300">{formatRupiah(successOrder.totalAmount)}</span>
          </div>
        </div>

        <div className={`p-3 rounded-xl text-xs text-left ${
          successOrder.whatsapp?.success
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300'
        }`}>
          {successOrder.whatsapp?.success
            ? `Struk berhasil dikirim ke WhatsApp ${customerPhone}.`
            : `Pesanan berhasil dibuat, tetapi struk WhatsApp belum terkirim. ${successOrder.whatsapp?.error || 'Periksa konfigurasi WhatsApp di server.'}`}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            href="/orders"
            className="w-full py-3 bg-coffee-800 hover:bg-coffee-900 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition text-center"
          >
            Lacak Pesanan Saya
          </Link>
          <Link
            href="/"
            className="w-full py-3 bg-coffee-100 hover:bg-coffee-200 dark:bg-espresso-850 dark:hover:bg-espresso-800 text-coffee-900 dark:text-amber-300 font-bold text-xs rounded-xl border border-coffee-200 dark:border-coffee-700 transition text-center"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-white dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700 hover:bg-coffee-50 dark:hover:bg-espresso-800 transition text-coffee-800 dark:text-amber-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-coffee-950 dark:text-amber-100">Keranjang Belanja</h1>
          <p className="text-xs text-coffee-600 dark:text-coffee-300">Periksa ulang daftar pesananmu sebelum melanjutkan checkout.</p>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white dark:bg-espresso-900 rounded-3xl p-12 text-center border border-coffee-200 dark:border-coffee-800 space-y-4 max-w-md mx-auto shadow-sm">
          <ShoppingBag className="w-12 h-12 text-coffee-300 dark:text-coffee-600 mx-auto" />
          <h3 className="text-lg font-bold text-coffee-950 dark:text-amber-100">Keranjangmu Masih Kosong</h3>
          <p className="text-xs text-coffee-600 dark:text-coffee-400">Pilih racikan kopi dan camilan lezat dari katalog kami dulu ya!</p>
          <Link
            href="/"
            className="inline-block bg-coffee-800 hover:bg-coffee-900 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow"
          >
            Lihat Katalog Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Item List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-espresso-900 rounded-3xl p-6 border border-coffee-200 dark:border-coffee-800 shadow-sm space-y-4">
              <h2 className="font-bold text-coffee-950 dark:text-amber-100 text-base border-b border-coffee-100 dark:border-coffee-800 pb-3">Daftar Menu Dipilih</h2>

              <div className="divide-y divide-coffee-100 dark:divide-coffee-800">
                {cart.map((item) => (
                  <div key={item.menuId} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-coffee-100 dark:bg-espresso-800 shrink-0">
                        <Image
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-coffee-950 dark:text-amber-100 text-sm">{item.name}</h4>
                        <span className="text-xs font-semibold text-coffee-700 dark:text-amber-400 block">{formatRupiah(item.price)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Qty Controls */}
                      <div className="flex items-center gap-2 bg-coffee-50 dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.menuId, -1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-espresso-800 text-coffee-900 dark:text-coffee-100 hover:bg-coffee-200 dark:hover:bg-espresso-700 flex items-center justify-center transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs w-5 text-center text-coffee-950 dark:text-amber-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuId, 1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-espresso-800 text-coffee-900 dark:text-coffee-100 hover:bg-coffee-200 dark:hover:bg-espresso-700 flex items-center justify-center transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <span className="font-extrabold text-coffee-950 dark:text-amber-300 text-sm min-w-[80px] text-right">
                        {formatRupiah(item.price * item.quantity)}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.menuId)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note alert */}
            <div className="bg-amber-50 dark:bg-espresso-850 border border-amber-200/80 dark:border-amber-500/30 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Keamanan Server:</strong> Seluruh harga menu dan total tagihan dikalkulasi secara otomatis langsung dari database server saat checkout.
              </span>
            </div>
          </div>

          {/* Order Summary & Checkout Form */}
          <div className="space-y-6">
            <form onSubmit={handleCheckout} className="bg-white dark:bg-espresso-900 rounded-3xl p-6 border border-coffee-200 dark:border-coffee-800 shadow-sm space-y-5">
              <h2 className="font-bold text-coffee-950 dark:text-amber-100 text-base border-b border-coffee-100 dark:border-coffee-800 pb-3">Ringkasan & Informasi</h2>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 mb-1">Nama Pemesan / No. Meja</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi (Meja 04)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-coffee-50 dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700 rounded-xl px-3 py-2 text-xs text-coffee-950 dark:text-white placeholder-coffee-400 dark:placeholder-coffee-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 mb-1">Nomor WhatsApp untuk Struk</label>
                  <input
                    id="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-coffee-50 dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700 rounded-xl px-3 py-2 text-xs text-coffee-950 dark:text-white placeholder-coffee-400 dark:placeholder-coffee-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  />
                  <p className="text-[10px] text-coffee-500 dark:text-coffee-400 mt-1">Struk pesanan akan otomatis dikirim ke nomor ini.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 mb-1">Catatan Tambahan (Opsional)</label>
                  <textarea
                    placeholder="Contoh: Takaran gula 50%, es batu sedikit"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-coffee-50 dark:bg-espresso-850 border border-coffee-200 dark:border-coffee-700 rounded-xl px-3 py-2 text-xs text-coffee-950 dark:text-white placeholder-coffee-400 dark:placeholder-coffee-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-800 dark:text-coffee-200 mb-2">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'QRIS'
                          ? 'bg-coffee-900 text-amber-300 border-coffee-900 dark:bg-amber-600 dark:text-white dark:border-amber-500 shadow'
                          : 'bg-coffee-50 dark:bg-espresso-850 text-coffee-700 dark:text-coffee-300 border-coffee-200 dark:border-coffee-700 hover:bg-coffee-100 dark:hover:bg-espresso-800'
                        }`}
                    >
                      <QrCode className="w-4 h-4" /> QRIS
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'CASH'
                          ? 'bg-coffee-900 text-amber-300 border-coffee-900 dark:bg-amber-600 dark:text-white dark:border-amber-500 shadow'
                          : 'bg-coffee-50 dark:bg-espresso-850 text-coffee-700 dark:text-coffee-300 border-coffee-200 dark:border-coffee-700 hover:bg-coffee-100 dark:hover:bg-espresso-800'
                        }`}
                    >
                      <Banknote className="w-4 h-4" /> Tunai
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'BANK_TRANSFER'
                          ? 'bg-coffee-900 text-amber-300 border-coffee-900 dark:bg-amber-600 dark:text-white dark:border-amber-500 shadow'
                          : 'bg-coffee-50 dark:bg-espresso-850 text-coffee-700 dark:text-coffee-300 border-coffee-200 dark:border-coffee-700 hover:bg-coffee-100 dark:hover:bg-espresso-800'
                        }`}
                    >
                      <CreditCard className="w-4 h-4" /> Transfer
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-coffee-100 dark:border-coffee-800 space-y-2">
                <div className="flex justify-between text-xs text-coffee-600 dark:text-coffee-400">
                  <span>Subtotal Menu</span>
                  <span className="font-semibold text-coffee-900 dark:text-amber-100">{formatRupiah(clientSubtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-coffee-600 dark:text-coffee-400">
                  <span>Pajak & Layanan</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Gratis (Rp 0)</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-coffee-950 dark:text-amber-300 pt-2 border-t border-coffee-100 dark:border-coffee-800">
                  <span>Total Tagihan</span>
                  <span>{formatRupiah(clientSubtotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-coffee-800 to-coffee-900 hover:from-coffee-900 hover:to-coffee-950 dark:from-amber-600 dark:to-amber-700 text-amber-300 dark:text-white font-extrabold text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? 'Memproses Checkout Server...' : 'Konfirmasi & Checkout Now'}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}