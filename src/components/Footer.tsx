'use client';

import { usePathname } from 'next/navigation';
import { Coffee, Heart, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-coffee-950 text-coffee-200 border-t border-coffee-800 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Coffee className="w-6 h-6" />
              <span className="font-extrabold text-lg tracking-tight text-white">KOPI MAHASISWA</span>
            </div>
            <p className="text-xs text-coffee-300 leading-relaxed">
              Sistem E-Commerce & POS resmi kedai Kopi Mahasiswa. Racikan biji kopi Nusantara kualitas terbaik dengan harga ramah kantong mahasiswa.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3 uppercase tracking-wider">Jam Operasional</h4>
            <ul className="text-xs text-coffee-300 space-y-1.5">
              <li>Senin - Jumat: 08.00 - 23.00 WIB</li>
              <li>Sabtu - Minggu: 09.00 - 24.00 WIB</li>
              <li className="text-amber-400 font-semibold mt-2">Open Order Online 24 Jam</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3 uppercase tracking-wider">Lokasi Outlet</h4>
            <div className="text-xs text-coffee-300 space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                Gedung Student Center Lt. 1, Area Kampus Utama
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                0812-3456-7890
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                halo@kopimahasiswa.id
              </p>
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3 uppercase tracking-wider">Fitur Unggulan</h4>
            <ul className="text-xs text-coffee-300 space-y-1.5">
              <li>✓ AI Menu Recommendation</li>
              <li>✓ Real-time Inventory & Stock Tracking</li>
              <li>✓ Instant QRIS & Cashier Checkout</li>
              <li>✓ Supplier Procurement System</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-coffee-800/80 pt-6 text-center text-xs text-coffee-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Kopi Mahasiswa. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for Universitas & Mahasiswa Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
