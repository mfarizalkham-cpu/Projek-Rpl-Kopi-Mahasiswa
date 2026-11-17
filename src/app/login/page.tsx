'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, KeyRound, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      // Redirect based on role
      const role = data.user.role;
      const requestedPath = new URLSearchParams(window.location.search).get('redirect');
      const destination =
        requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
          ? requestedPath
          : role === 'ADMIN'
            ? '/admin/menu'
            : role === 'OWNER'
              ? '/owner/dashboard'
              : role === 'KASIR'
                ? '/kasir/orders'
                : role === 'SUPPLIER'
                  ? '/supplier/purchases'
                  : '/';

      router.replace(destination);

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-0">
      <div className="bg-white rounded-3xl p-8 border border-coffee-200 shadow-xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-coffee-800 to-coffee-600 text-amber-300 flex items-center justify-center mx-auto shadow-md">
            <Coffee className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-coffee-950 tracking-tight">Login Kopi Mahasiswa</h1>
          <p className="text-xs text-coffee-600">Masuk dengan email dan password akunmu. Akses akan disesuaikan dengan role akun.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-coffee-800 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="contoh: adminkopimahasiswa@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-coffee-50 border border-coffee-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-coffee-950 focus:outline-none focus:ring-2 focus:ring-coffee-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-coffee-800 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-coffee-50 border border-coffee-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-coffee-950 focus:outline-none focus:ring-2 focus:ring-coffee-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-coffee-800 hover:bg-coffee-900 text-amber-300 font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses Authentikasi...' : 'Login Ke Sistem'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
