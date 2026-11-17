'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, Phone, Mail, MapPin, User } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) setSuppliers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contactName, phone, email, address }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchSuppliers();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-coffee-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-coffee-950 flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-600" /> Manajemen Supplier Bahan Baku
          </h1>
          <p className="text-xs text-coffee-600">Daftar mitra pemasok biji kopi, susu, sirup, dan bahan baku cafe.</p>
        </div>

        <button
          onClick={() => {
            setName('');
            setContactName('');
            setPhone('');
            setEmail('');
            setAddress('');
            setShowModal(true);
          }}
          className="bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah Supplier Baru
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-coffee-500">Memuat supplier...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((sup) => (
            <div key={sup.id} className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-coffee-950 text-base">{sup.name}</h3>
                  <span className="text-xs text-coffee-500 flex items-center gap-1">
                    <User className="w-3 h-3 text-coffee-400" /> {sup.contactName}
                  </span>
                </div>
              </div>

              <div className="bg-coffee-50 rounded-2xl p-3.5 space-y-1.5 text-xs text-coffee-700 border border-coffee-100">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" /> {sup.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" /> {sup.email}
                </p>
                <p className="flex items-start gap-2 pt-1 border-t border-coffee-200/60">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" /> {sup.address || 'Alamat tidak diisi'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-coffee-950">Tambah Supplier Baru</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Nama Perusahaan / Supplier</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Kopi Nusantara Jaya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Nama Contact Person (Sales)</label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Budi"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-800 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="sales@supplier.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-coffee-800 mb-1">Alamat Kantor / Gudang</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap supplier"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-coffee-50 border border-coffee-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-700"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
