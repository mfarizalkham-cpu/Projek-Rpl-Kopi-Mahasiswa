import { RealtimeBusinessStats } from './ai-analytics';

export type IntentCategory =
  | 'BUSINESS_REVENUE'
  | 'BUSINESS_PROFIT'
  | 'ORDER_COUNT'
  | 'ACTIVE_MENU_COUNT'
  | 'CATEGORY_INFORMATION'
  | 'USER_MANAGEMENT_INFO'
  | 'DASHBOARD_SUMMARY'
  | 'BEST_SELLING_MENU'
  | 'INVENTORY_STOCK'
  | 'ORDER_STATUS'
  | 'PAYMENT_STATUS'
  | 'MENU_INFORMATION'
  | 'PROMOTION_INFORMATION'
  | 'USER_IDENTITY'
  | 'ADMIN_CUSTOMER_INFO'
  | 'ADMIN_ORDER_VS_PO'
  | 'ADMIN_STORE_OPERATION'
  | 'CUSTOMER_MY_ORDER_STATUS'
  | 'CUSTOMER_MY_CART'
  | 'CUSTOMER_MY_ORDER_HISTORY'
  | 'KASIR_SALES_SUMMARY'
  | 'KASIR_OPERATIONAL_INFO'
  | 'SUPPLIER_PO_COUNT'
  | 'SUPPLIER_LATEST_PO'
  | 'SUPPLIER_PROCUREMENT_SUMMARY'
  | 'SUPPLIER_PO_DETAILS'
  | 'OWNER_OMZET'
  | 'OWNER_CRITICAL_STOCK'
  | 'OWNER_PO_CONDITIONS'
  | 'OWNER_BUSINESS_SUMMARY'
  | 'GENERAL_CONVERSATION'
  | 'UNKNOWN_INTENT';

export interface RecognizedIntent {
  category: IntentCategory;
  isBusinessQuery: boolean;
  isTodayQuery: boolean;
  targetMenuName?: string;
  confidence: number;
}

/**
 * Normalisasi string teks bahasa Indonesia untuk pencocokan kata yang andal
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCountOnlyQuestion(userMessage: string): boolean {
  const clean = normalizeText(userMessage);
  const asksForCount = /\b(berapa|total|jumlah)\b/.test(clean);
  const asksForDetails = /\b(daftar|list|rincian|apa saja|siapa saja)\b/.test(clean);
  return asksForCount && !asksForDetails;
}

/**
 * Deteksi Intent Pertanyaan Pengguna
 */
export function detectUserIntent(userMessage: string, pathname?: string): RecognizedIntent {
  const clean = normalizeText(userMessage);

  // Cek apakah menanyakan data hari ini
  const isToday =
    clean.includes('hari ini') ||
    clean.includes('today') ||
    clean.includes('saat ini') ||
    clean.includes('sekarang');

  // Cek apakah posisi pengguna berada di halaman manajemen pengguna admin
  const isUserPage =
    typeof pathname === 'string' &&
    (pathname.includes('/admin/users') || pathname.includes('users'));

  // 0. USER_IDENTITY ("siapa saya", "siapa aku", "saya siapa", "aku siapa")
  if (
    clean === 'siapa saya' ||
    clean.includes('siapa saya') ||
    clean === 'siapa aku' ||
    clean.includes('siapa aku') ||
    clean === 'saya siapa' ||
    clean.includes('saya siapa') ||
    clean === 'aku siapa' ||
    clean.includes('aku siapa') ||
    clean.includes('siapa diriku') ||
    clean.includes('siapakah saya') ||
    clean.includes('siapakah aku') ||
    clean.includes('siapa pemilik sistem ini') ||
    clean.includes('siapa pemilik sistem') ||
    clean.includes('pemilik sistem ini siapa') ||
    clean.includes('tebak siapa saya')
  ) {
    return {
      category: 'USER_IDENTITY',
      isBusinessQuery: false,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  // 0.1 USER_MANAGEMENT_INFO (Manajemen Pengguna Sistem, Total User, Role & Daftar Akun)
  if (
    clean === 'berapa total user' ||
    clean.includes('total user') ||
    clean.includes('berapa user') ||
    clean.includes('jumlah user') ||
    clean.includes('ada berapa user') ||
    clean.includes('user apa saja') ||
    clean.includes('daftar user') ||
    clean.includes('siapa saja user') ||
    (/\b(apa saja|daftar|list|rincian|tampilkan|sebutkan)\b/.test(clean) && /\b(user|pengguna|akun)\b/.test(clean)) ||
    clean.includes('data user') ||
    clean.includes('user sistem') ||
    clean.includes('manajemen user') ||
    clean.includes('manajemen pengguna') ||
    clean.includes('manajemen pengguna sistem') ||
    clean.includes('total pengguna') ||
    clean.includes('berapa pengguna') ||
    clean.includes('jumlah pengguna') ||
    clean.includes('ada berapa pengguna') ||
    clean.includes('daftar pengguna') ||
    clean.includes('siapa saja pengguna') ||
    clean.includes('data pengguna') ||
    clean.includes('pengguna sistem') ||
    clean.includes('berapa admin') ||
    clean.includes('berapa owner') ||
    clean.includes('berapa kasir') ||
    clean.includes('berapa pelanggan') ||
    clean.includes('berapa supplier') ||
    clean.includes('role pengguna') ||
    clean.includes('hak akses pengguna') ||
    clean.includes('kontrol akses') ||
    clean.includes('kelola user') ||
    clean.includes('kelola pengguna') ||
    clean.includes('tambah user') ||
    clean.includes('tambah pengguna') ||
    clean.includes('daftar akun') ||
    clean.includes('akun pengguna') ||
    clean === 'user' ||
    clean === 'users' ||
    clean === 'pengguna' ||
    clean === 'data user' ||
    clean === 'data pengguna' ||
    (isUserPage && (
      clean.includes('total') ||
      clean.includes('ringkasan') ||
      clean.includes('semua') ||
      clean.includes('halaman ini') ||
      clean.includes('di sini') ||
      clean.includes('akun') ||
      clean.includes('personil') ||
      clean.includes('rekap') ||
      clean.includes('status')
    ))
  ) {
    return {
      category: 'USER_MANAGEMENT_INFO',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  // 0.2 DASHBOARD_SUMMARY (menanyakan ringkasan dasbor: "total menu dll", "ringkasan dasbor", "data dasbor")
  if (
    clean.includes('total menu dll') ||
    clean.includes('menu dll') ||
    clean.includes('ringkasan dasbor') ||
    clean.includes('data dasbor') ||
    clean.includes('ringkasan admin') ||
    clean.includes('rekap dasbor') ||
    clean.includes('dasbor terpadu') ||
    (clean.includes('total menu') && (clean.includes('kategori') || clean.includes('bahan')))
  ) {
    return {
      category: 'DASHBOARD_SUMMARY',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  // 0.2 CATEGORY_INFORMATION (kategori menu, berapa kategori, ada berapa kategori, kategori apa saja)
  if (
    clean.includes('kategori menu') ||
    clean.includes('kategori produk') ||
    clean.includes('berapa kategori') ||
    clean.includes('total kategori') ||
    clean.includes('jumlah kategori') ||
    clean.includes('ada berapa kategori') ||
    clean.includes('kategori apa saja') ||
    (/\b(apa saja|daftar|list|rincian)\b/.test(clean) && /\bkategori(?:nya)?\b/.test(clean)) ||
    clean === 'kategori' ||
    clean === 'kategori menu' ||
    clean.startsWith('kategori ')
  ) {
    return {
      category: 'CATEGORY_INFORMATION',
      isBusinessQuery: false,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // ==============================================================
  // 5 ROLE AI ASSISTANTS DETECTION (ADMIN, CUSTOMER, KASIR, SUPPLIER, OWNER)
  // ==============================================================

  // A. ADMIN AI ASSISTANT INTENTS
  if (
    clean.includes('perbedaan pesanan customer dan purchase order') ||
    clean.includes('perbedaan pesanan dan purchase order') ||
    clean.includes('beda pesanan dan po') ||
    clean.includes('beda pesanan customer dan po') ||
    clean.includes('perbedaan pesanan dan po') ||
    clean.includes('purchase order vs pesanan') ||
    clean.includes('beda customer dan purchase order') ||
    clean.includes('perbedaan po dan pesanan')
  ) {
    return {
      category: 'ADMIN_ORDER_VS_PO',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  if (
    clean.includes('siapa pelanggan yang melakukan pemesanan') ||
    clean.includes('pelanggan yang melakukan pemesanan') ||
    clean.includes('siapa pelanggan yang pesan') ||
    clean.includes('informasi pelanggan yang memesan') ||
    clean.includes('ringkasan pesanan pelanggan') ||
    clean.includes('data pelanggan pemesan') ||
    clean.includes('pelanggan pemesan')
  ) {
    return {
      category: 'ADMIN_CUSTOMER_INFO',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  if (
    clean.includes('bantu jelaskan kondisi operasional toko') ||
    clean.includes('kondisi operasional toko') ||
    clean.includes('status operasional toko') ||
    clean.includes('kondisi operasional kedai') ||
    clean.includes('operasional kedai hari ini') ||
    clean.includes('kondisi operasional')
  ) {
    return {
      category: 'ADMIN_STORE_OPERATION',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // B. CUSTOMER AI ASSISTANT INTENTS
  if (
    clean.includes('bagaimana status pesanan saya') ||
    clean.includes('status pesanan saya') ||
    clean.includes('cek pesanan saya') ||
    clean.includes('status order saya') ||
    clean.includes('pesanan saya sudah selesai') ||
    clean.includes('pesanan saya sedang apa') ||
    clean.includes('posisi pesanan saya')
  ) {
    return {
      category: 'CUSTOMER_MY_ORDER_STATUS',
      isBusinessQuery: false,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  if (
    clean.includes('produk dalam keranjang saya') ||
    clean.includes('apa saja produk dalam keranjang saya') ||
    clean.includes('isi keranjang saya') ||
    clean.includes('keranjang belanja saya') ||
    clean.includes('cek keranjang saya') ||
    clean.includes('keranjang saya')
  ) {
    return {
      category: 'CUSTOMER_MY_CART',
      isBusinessQuery: false,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  // Payment status and transaction queries
  if (
    clean.includes('pembayaran') ||
    clean.includes('pembayaran lunas') ||
    clean.includes('transaksi lunas') ||
    clean.includes('cek pembayaran')
  ) {
    return {
      category: 'PAYMENT_STATUS',
      isBusinessQuery: true,
      isTodayQuery: isToday,
      confidence: 0.95,
    };
  }

  if (
    clean.includes('tolong jelaskan riwayat pesanan saya') ||
    clean.includes('riwayat pesanan saya') ||
    clean.includes('histori pesanan saya') ||
    clean.includes('pesanan saya sebelumnya') ||
    clean.includes('daftar pesanan saya') ||
    clean.includes('riwayat belanja saya')
  ) {
    return {
      category: 'CUSTOMER_MY_ORDER_HISTORY',
      isBusinessQuery: false,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // C. KASIR AI ASSISTANT INTENTS
  if (
    clean.includes('bagaimana ringkasan aktivitas penjualan') ||
    clean.includes('ringkasan aktivitas penjualan') ||
    clean.includes('berapa jumlah transaksi yang tercatat') ||
    clean.includes('jumlah transaksi yang tercatat') ||
    clean.includes('ringkasan penjualan kasir') ||
    clean.includes('aktivitas penjualan kasir')
  ) {
    return {
      category: 'KASIR_SALES_SUMMARY',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  if (
    clean.includes('informasi operasional yang perlu saya perhatikan') ||
    clean.includes('informasi operasional kasir') ||
    clean.includes('antrean pesanan kasir') ||
    clean.includes('pesanan yang perlu disajikan') ||
    clean.includes('pesanan siap saji')
  ) {
    return {
      category: 'KASIR_OPERATIONAL_INFO',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // D. SUPPLIER AI ASSISTANT INTENTS
  if (
    clean.includes('berapa purchase order yang saya miliki') ||
    clean.includes('berapa po yang saya miliki') ||
    clean.includes('jumlah po saya') ||
    clean.includes('purchase order saya') ||
    clean.includes('total po saya') ||
    clean.includes('berapa po supplier')
  ) {
    return {
      category: 'SUPPLIER_PO_COUNT',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  if (
    clean.includes('bagaimana status po terbaru') ||
    clean.includes('status po terbaru') ||
    clean.includes('status po terakhir') ||
    clean.includes('status purchase order terbaru') ||
    clean.includes('po terbaru saya')
  ) {
    return {
      category: 'SUPPLIER_LATEST_PO',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  if (
    clean.includes('apa saja detail po saya') ||
    clean.includes('detail po saya') ||
    clean.includes('rincian po saya') ||
    clean.includes('isi po saya') ||
    clean.includes('detail purchase order saya')
  ) {
    return {
      category: 'SUPPLIER_PO_DETAILS',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  if (
    clean.includes('tampilkan ringkasan pengadaan') ||
    clean.includes('ringkasan pengadaan') ||
    clean.includes('ringkasan po supplier') ||
    clean.includes('pengadaan supplier')
  ) {
    return {
      category: 'SUPPLIER_PROCUREMENT_SUMMARY',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // E. OWNER AI ASSISTANT INTENTS
  if (
    clean === 'berapa omzet toko' ||
    clean.includes('berapa omzet toko') ||
    clean.includes('omzet toko') ||
    clean.includes('total omset toko') ||
    clean.includes('omset toko') ||
    clean.includes('omzet kedai')
  ) {
    return {
      category: 'OWNER_OMZET',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 1.0,
    };
  }

  if (
    clean.includes('produk apa yang stoknya habis') ||
    clean.includes('produk apa yang stok habis') ||
    clean.includes('bahan apa yang stoknya habis') ||
    clean.includes('bahan apa yang habis') ||
    clean.includes('bahan apa yang menipis') ||
    clean.includes('apa bahan yang menipis') ||
    clean.includes('bahan yang menipis') ||
    clean.includes('stok menipis') ||
    clean.includes('stok yang menipis') ||
    clean.includes('bahan baku yang menipis') ||
    clean.includes('stok hampir habis') ||
    clean.includes('alert stok') ||
    clean.includes('stok kritis') ||
    clean.includes('pantau stok kritis') ||
    clean.includes('stok menipis atau habis')
  ) {
    return {
      category: 'OWNER_CRITICAL_STOCK',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  if (
    clean.includes('bagaimana kondisi pengadaan barang') ||
    clean.includes('kondisi pengadaan barang') ||
    clean.includes('berapa total nilai purchase order') ||
    clean.includes('total nilai purchase order') ||
    clean.includes('total nilai po') ||
    clean.includes('kondisi purchase order')
  ) {
    return {
      category: 'OWNER_PO_CONDITIONS',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  if (
    clean === 'ringkasan bisnis' ||
    clean.includes('ringkasan bisnis') ||
    clean.includes('berikan ringkasan kondisi bisnis') ||
    clean.includes('ringkasan kondisi bisnis') ||
    clean.includes('kondisi bisnis kedai') ||
    clean.includes('analisis kondisi bisnis') ||
    clean.includes('kesehatan bisnis kedai')
  ) {
    return {
      category: 'OWNER_BUSINESS_SUMMARY',
      isBusinessQuery: true,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // 1. ACTIVE_MENU_COUNT (Berapa varian menu aktif, jumlah menu tersedia, produk aktif)
  if (
    clean.includes('menu aktif') ||
    clean.includes('varian menu') ||
    clean.includes('produk aktif') ||
    clean.includes('menu yang aktif') ||
    clean.includes('menu yang tersedia') ||
    clean.includes('jumlah menu') ||
    clean.includes('total menu') ||
    clean.includes('ada berapa menu') ||
    clean.includes('berapa varian') ||
    clean.includes('berapa produk aktif') ||
    /\b(berapa|jumlah|total|ada berapa)\s+(varian\s+)?(menu|produk)(\s+yang)?\s+(aktif|tersedia|ada)\b/i.test(clean) ||
    /\b(varian\s+menu\s+aktif|menu\s+aktif\s+tersedia)\b/i.test(clean)
  ) {
    return {
      category: 'ACTIVE_MENU_COUNT',
      isBusinessQuery: false, // Pelanggan dan Owner sama-sama boleh tahu menu aktif
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // 2. ORDER_COUNT (Berapa total pesanan, jumlah transaksi, ada berapa order)
  if (
    clean.includes('total pesanan') ||
    clean.includes('jumlah pesanan') ||
    clean.includes('berapa pesanan') ||
    clean.includes('ada berapa pesanan') ||
    clean.includes('berapa order') ||
    clean.includes('total order') ||
    clean.includes('ada berapa order') ||
    clean.includes('jumlah order') ||
    clean.includes('jumlah transaksi') ||
    clean.includes('total transaksi') ||
    clean.includes('berapa transaksi') ||
    clean.includes('rekap transaksi') ||
    clean.includes('performa penjualan') ||
    /\b(berapa|total|jumlah|ada berapa)\s+(total\s+)?(pesanan|order|transaksi)\b/i.test(clean)
  ) {
    // Jika secara spesifik menanyakan status "selesai" atau "diproses", arahkan ke ORDER_STATUS
    if (
      clean.includes('selesai') ||
      clean.includes('diproses') ||
      clean.includes('pending') ||
      clean.includes('belum selesai')
    ) {
      return {
        category: 'ORDER_STATUS',
        isBusinessQuery: true,
        isTodayQuery: isToday,
        confidence: 0.95,
      };
    }

    return {
      category: 'ORDER_COUNT',
      isBusinessQuery: true,
      isTodayQuery: isToday,
      confidence: 0.95,
    };
  }

  // 3. BUSINESS_REVENUE (Berapa total pendapatan, omzet hari ini, pemasukan cafe)
  if (
    clean.includes('pendapatan') ||
    clean.includes('omset') ||
    clean.includes('omzet') ||
    clean.includes('pemasukan') ||
    clean.includes('hasil penjualan') ||
    /\b(total|berapa|laporan|cek)\s+(total\s+)?(pendapatan|omset|omzet|pemasukan)\b/i.test(clean)
  ) {
    return {
      category: 'BUSINESS_REVENUE',
      isBusinessQuery: true,
      isTodayQuery: isToday,
      confidence: 0.95,
    };
  }

  // 4. BUSINESS_PROFIT (Berapa keuntungan, laba bisnis, profit cafe)
  if (
    clean.includes('keuntungan') ||
    clean.includes('laba') ||
    clean.includes('profit') ||
    clean.includes('margin keuntungan') ||
    /\b(berapa|total|apakah\s+cafe\s+mendapatkan)\s+(keuntungan|laba|profit)\b/i.test(clean)
  ) {
    return {
      category: 'BUSINESS_PROFIT',
      isBusinessQuery: true,
      isTodayQuery: isToday,
      confidence: 0.95,
    };
  }

  // 5. BEST_SELLING_MENU (Menu apa paling laris, best seller cafe, paling banyak terjual)
  if (
    clean.includes('paling laris') ||
    clean.includes('terlaris') ||
    clean.includes('best seller') ||
    clean.includes('paling banyak terjual') ||
    clean.includes('banyak terjual') ||
    clean.includes('paling laku') ||
    clean.includes('paling banyak dibeli') ||
    clean.includes('menu favorit') ||
    /\b(menu|produk|makanan|minuman)\s+(apa\s+)?(paling\s+)?(laris|laku|banyak\s+terjual|best\s+seller)\b/i.test(clean)
  ) {
    return {
      category: 'BEST_SELLING_MENU',
      isBusinessQuery: false,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // 6. ORDER_STATUS (Berapa pesanan selesai, pesanan diproses, status pesanan)
  if (
    clean.includes('pesanan selesai') ||
    clean.includes('pesanan yang selesai') ||
    clean.includes('sudah selesai') ||
    clean.includes('pesanan diproses') ||
    clean.includes('sedang diproses') ||
    clean.includes('pesanan belum selesai') ||
    clean.includes('status pesanan')
  ) {
    return {
      category: 'ORDER_STATUS',
      isBusinessQuery: true,
      isTodayQuery: isToday,
      confidence: 0.95,
    };
  }

  // 7. INVENTORY_STOCK (Berapa total stok, stok Americano tersisa berapa, barang hampir habis, bahan baku)
  if (
    clean.includes('stok') ||
    clean.includes('persediaan') ||
    clean.includes('hampir habis') ||
    clean.includes('stok menipis') ||
    clean.includes('sisa bahan') ||
    clean.includes('bahan baku') ||
    clean.includes('total bahan') ||
    clean.includes('berapa bahan') ||
    clean.includes('inventori') ||
    clean.includes('daftar bahan') ||
    clean.includes('list bahan') ||
    clean.includes('rincian bahan') ||
    clean.includes('jenis bahan') ||
    (clean.includes('jenis itu') && /\b(apa saja|daftar|list|rincian)\b/.test(clean))
  ) {
    let targetMenu = '';
    if (clean.includes('americano')) targetMenu = 'Americano Cold Brew';
    else if (clean.includes('aren') || clean.includes('kopi susu')) targetMenu = 'Es Kopi Susu Gula Aren';
    else if (clean.includes('matcha')) targetMenu = 'Matcha Creamy Latte';
    else if (clean.includes('croissant') || clean.includes('pastry')) targetMenu = 'Butter Croissant Warm';

    return {
      category: 'INVENTORY_STOCK',
      isBusinessQuery: true,
      isTodayQuery: false,
      targetMenuName: targetMenu,
      confidence: 0.95,
    };
  }

  // 8. MENU_INFORMATION (Harga menu, apa saja menu kopi, apakah ada Matcha Latte, perbedaan)
  if (
    clean.includes('perbedaan') ||
    clean.includes('beda') ||
    clean.includes('bedanya') ||
    clean.includes('harga') ||
    clean.includes('menu kopi') ||
    clean.includes('katalog') ||
    clean.includes('daftar menu') ||
    clean.includes('apa saja menunya') ||
    clean.includes('apa saja menu') ||
    clean.includes('menu apa saja') ||
    clean.includes('list menu') ||
    (/\b(apa saja|daftar|list|rincian)\b/.test(clean) && /\b\d+\s+(item|menu|produk)\b/.test(clean)) ||
    clean.includes('jual apa') ||
    clean.includes('ada menu apa') ||
    clean.includes('apakah ada') ||
    clean.includes('rekomendasi minuman') ||
    clean.includes('rekomendasi kopi') ||
    clean.includes('rekomendasi menu') ||
    clean.includes('saran minuman')
  ) {
    let targetMenu = '';
    if (clean.includes('americano')) targetMenu = 'Americano Cold Brew';
    else if (clean.includes('aren') || clean.includes('kopi susu')) targetMenu = 'Es Kopi Susu Gula Aren';
    else if (clean.includes('matcha')) targetMenu = 'Matcha Creamy Latte';
    else if (clean.includes('croissant') || clean.includes('pastry')) targetMenu = 'Butter Croissant Warm';

    return {
      category: 'MENU_INFORMATION',
      isBusinessQuery: false,
      isTodayQuery: false,
      targetMenuName: targetMenu,
      confidence: 0.95,
    };
  }

  // 9. PROMOTION_INFORMATION (Apakah ada promo, diskon hari ini, kode voucher)
  if (
    clean.includes('promo') ||
    clean.includes('diskon') ||
    clean.includes('voucher') ||
    clean.includes('potongan') ||
    clean.includes('mhs2026') ||
    clean.includes('kode promo') ||
    clean.includes('cara pakai promo')
  ) {
    return {
      category: 'PROMOTION_INFORMATION',
      isBusinessQuery: false,
      isTodayQuery: false,
      confidence: 0.95,
    };
  }

  // 10. GENERAL_CONVERSATION (Sapaan, salam, terima kasih, perkenalan)
  const greetings = [
    'halo',
    'hai',
    'hello',
    'hi',
    'selamat pagi',
    'selamat siang',
    'selamat sore',
    'selamat malam',
    'pagi',
    'siang',
    'malam',
    'terima kasih',
    'makasih',
    'thanks',
    'thank you',
    'siapa kamu',
    'siapa anda',
    'kamu siapa',
    'tes',
    'test',
  ];

  if (greetings.some((g) => clean === g || clean.startsWith(g + ' ') || clean.endsWith(' ' + g))) {
    return {
      category: 'GENERAL_CONVERSATION',
      isBusinessQuery: false,
      isTodayQuery: false,
      confidence: 0.9,
    };
  }

  // 11. UNKNOWN_INTENT: Pertanyaan tidak dikenali (TIDAK BOLEH diberi greeting otomatis!)
  return {
    category: 'UNKNOWN_INTENT',
    isBusinessQuery: false,
    isTodayQuery: false,
    confidence: 0.3,
  };
}

/**
 * Menghasilkan jawaban cerdas terverifikasi database MySQL untuk setiap kategori intent
 */
export function generateSmartDatabaseAnswer(
  intent: RecognizedIntent,
  stats: RealtimeBusinessStats,
  userRole: string,
  userMessage: string
): {
  success: boolean;
  intent: IntentCategory;
  source: string;
  data: any;
  answer: string;
  reply: string;
  recommendedMenus?: any[];
  quickActions?: { label: string; prompt: string }[];
} {
  const roleUpper = (userRole || 'PELANGGAN').toUpperCase();
  const isOwnerOrAdmin = roleUpper === 'OWNER' || roleUpper === 'ADMIN';

  // --- CEK KEAMANAN AKSES ROLE FINANSIAL ---
  if (
    (intent.category === 'BUSINESS_REVENUE' || intent.category === 'BUSINESS_PROFIT') &&
    !isOwnerOrAdmin
  ) {
    const text =
      `🔒 **Akses Terbatas: Data Finansial Internal**\n\n` +
      `Mohon maaf Kak, informasi laporan pendapatan dan keuangan kedai bersifat rahasia dan hanya dapat diakses oleh akun **Owner** atau **Admin** Kopi Mahasiswa. 😊\n\n` +
      `💡 *Tips: Kakak dapat menguji akses ini dengan beralih ke role **Owner** atau **Admin** melalui **Demo Role Switcher** di bilah atas.*\n\n` +
      `Ada yang bisa saya bantu seputar katalog menu kopi, promo diskon mahasiswa, rekomendasi minuman, atau fasilitas kedai? ☕✨`;

    return {
      success: true,
      intent: intent.category,
      source: 'mysql-rbac',
      data: { access: 'restricted', requiredRoles: ['OWNER', 'ADMIN'] },
      answer: text,
      reply: text,
      quickActions: [
        { label: '☕ Rekomendasi Minuman', prompt: 'Apa rekomendasi minuman?' },
        { label: '🏷️ Promo MHS2026', prompt: 'Apakah ada promo?' },
        { label: '📋 Menu Kopi', prompt: 'Apa saja menu kopi?' },
        { label: '🪑 Varian Menu Aktif', prompt: 'Berapa varian menu aktif?' },
      ],
    };
  }

  // ==========================================
  // 0. DASHBOARD_SUMMARY (Total Menu, Kategori Menu, Bahan Baku, Pengguna Sistem)
  // ==========================================
  if (intent.category === 'DASHBOARD_SUMMARY') {
    const cleanMessage = normalizeText(userMessage);
    const asksForOverallSummary =
      cleanMessage.includes('ringkasan bisnis') ||
      cleanMessage.includes('ringkasan keseluruhan') ||
      cleanMessage.includes('ringkasan dasbor') ||
      cleanMessage.includes('ringkasan dashboard') ||
      cleanMessage.includes('data dasbor terpadu') ||
      cleanMessage.includes('data dashboard terpadu');

    if (!asksForOverallSummary) {
      const requestedTotals: string[] = [];
      const data: Record<string, number> = {};

      if (/\b(menu|katalog)\b/.test(cleanMessage)) {
        requestedTotals.push(`${stats.totalMenusCount} menu`);
        data.total_menu = stats.totalMenusCount;
      }
      if (/\b(kategori|category)\b/.test(cleanMessage)) {
        requestedTotals.push(`${stats.totalCategoriesCount} kategori`);
        data.total_categories = stats.totalCategoriesCount;
      }
      if (/\b(bahan|inventori|stok)\b/.test(cleanMessage)) {
        requestedTotals.push(`${stats.totalIngredientsCount} bahan baku`);
        data.total_ingredients = stats.totalIngredientsCount;
      }
      if (/\b(pengguna|user|akun)\b/.test(cleanMessage)) {
        requestedTotals.push(`${stats.totalUsersCount} pengguna`);
        data.total_users = stats.totalUsersCount;
      }

      if (requestedTotals.length > 0) {
        const text = `Total saat ini: ${requestedTotals.join(', ')}. ☕`;

        return {
          success: true,
          intent: 'DASHBOARD_SUMMARY',
          source: 'mysql',
          data,
          answer: text,
          reply: text,
        };
      }
    }

    const text =
      `📊 **Data Dasbor Terpadu Kopi Mahasiswa:**\n\n` +
      `Berdasarkan data terkini yang tersinkronisasi langsung dari database sistem:\n\n` +
      `1. ☕ **TOTAL MENU**: **${stats.totalMenusCount} item** (semua aktif & siap dipesan)\n` +
      `   • ${stats.activeMenusList.map((m) => `${m.name} (${m.priceFormatted})`).join(', ')}\n\n` +
      `2. 🗂️ **KATEGORI MENU**: **${stats.totalCategoriesCount} kategori**\n` +
      `   • ${stats.categoriesList.map((c) => `**${c.name}** (${c.menusCount} menu)`).join(', ')}\n\n` +
      `3. 📦 **BAHAN BAKU**: **${stats.totalIngredientsCount} bahan** di inventori\n` +
      `   • ${stats.ingredientsStock.map((i) => `${i.name}: ${i.stock.toLocaleString('id-ID')} ${i.unit}`).join(', ')}\n\n` +
      `4. 👥 **MANAJEMEN PENGGUNA**: **${stats.totalUsersCount} pengguna sistem**\n` +
      `   • ${stats.adminUsersCount} Admin, ${stats.ownerUsersCount} Owner, ${stats.kasirUsersCount} Kasir, ${stats.pelangganUsersCount} Pelanggan, ${stats.supplierUsersCount} Supplier\n\n` +
      `Seluruh data di atas selalu terhubung secara real-time dengan katalog kasir, stok gudang, dan sistem kontrol pengguna kedai! ☕✨`;

    return {
      success: true,
      intent: 'DASHBOARD_SUMMARY',
      source: 'mysql',
      data: {
        total_menu: stats.totalMenusCount,
        total_categories: stats.totalCategoriesCount,
        total_ingredients: stats.totalIngredientsCount,
        total_users: stats.totalUsersCount,
        categories: stats.categoriesList,
        menus: stats.activeMenusList,
        ingredients: stats.ingredientsStock,
        users: stats.usersList,
      },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 3),
      quickActions: [
        { label: '👥 Manajemen Pengguna', prompt: 'Berapa total pengguna sistem?' },
        { label: '📋 Lihat Katalog Menu', prompt: 'Berapa total menu?' },
        { label: '🗂️ Cek Kategori Menu', prompt: 'Berapa kategori menu?' },
        { label: '📦 Cek Status Stok', prompt: 'Berapa bahan baku?' },
      ],
    };
  }

  // ==========================================
  // 0.1 CATEGORY_INFORMATION (Kategori Menu: 3 Kategori)
  // ==========================================
  if (intent.category === 'CATEGORY_INFORMATION') {
    if (isCountOnlyQuestion(userMessage)) {
      const text = `Saat ini terdapat ${stats.totalCategoriesCount} kategori menu. ☕`;
      return {
        success: true,
        intent: 'CATEGORY_INFORMATION',
        source: 'mysql',
        data: { total_categories: stats.totalCategoriesCount },
        answer: text,
        reply: text,
      };
    }

    const categoriesDetails = stats.categoriesList
      .map((category, index) => {
        const defaultDescriptions: Record<string, string> = {
          'kopi signature': 'Variasi olahan kopi espresso racikan asli Kopi Mahasiswa',
          'non-kopi': 'Minuman segar dan creamy tanpa kandungan kafein',
          'snack & pastry': 'Camilan renyah dan kue pendamping aktivitas belajar',
        };
        const description =
          category.description.trim() ||
          defaultDescriptions[category.name.toLowerCase()] ||
          'Deskripsi kategori belum tersedia.';
        return `${index + 1}. 🗂️ **${category.name}** — ${description}`;
      })
      .join('\n');

    const text =
      `Berikut rincian ${stats.totalCategoriesCount} kategori produk Kopi Mahasiswa:\n\n` +
      `${categoriesDetails}\n\n` +
      `Silakan kelola kategori melalui halaman Kategori Produk di panel admin. ☕`;

    return {
      success: true,
      intent: 'CATEGORY_INFORMATION',
      source: 'mysql',
      data: {
        total_categories: stats.totalCategoriesCount,
        categories: stats.categoriesList,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '☕ Lihat Total Menu', prompt: 'Berapa total menu?' },
        { label: '📦 Cek Bahan Baku', prompt: 'Berapa bahan baku?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
      ],
    };
  }

  // ==========================================
  // 0.2 USER_MANAGEMENT_INFO (Manajemen Pengguna: Total User, Role & Daftar Akun)
  // ==========================================
  if (intent.category === 'USER_MANAGEMENT_INFO') {
    if (isCountOnlyQuestion(userMessage)) {
      const cleanMessage = normalizeText(userMessage);
      const roleCounts = [
        { pattern: /\b(admin|administrator)\b/, label: 'admin', count: stats.adminUsersCount },
        { pattern: /\b(owner)\b/, label: 'owner', count: stats.ownerUsersCount },
        { pattern: /\b(kasir)\b/, label: 'kasir', count: stats.kasirUsersCount },
        { pattern: /\b(pelanggan|customer|member)\b/, label: 'pelanggan', count: stats.pelangganUsersCount },
        { pattern: /\b(supplier)\b/, label: 'supplier', count: stats.supplierUsersCount },
      ];
      const requestedRole = roleCounts.find(({ pattern }) => pattern.test(cleanMessage));
      const text = requestedRole
        ? `Saat ini terdapat ${requestedRole.count} akun ${requestedRole.label}. ☕`
        : `Total pengguna sistem saat ini ${stats.totalUsersCount} akun. ☕`;

      return {
        success: true,
        intent: 'USER_MANAGEMENT_INFO',
        source: 'mysql',
        data: requestedRole
          ? { role: requestedRole.label, count: requestedRole.count }
          : { total_users: stats.totalUsersCount },
        answer: text,
        reply: text,
      };
    }

    if (stats.usersList.length === 0) {
      const text =
        `Maaf, data pengguna belum tersedia saat ini. Silakan cek langsung di ` +
        `[Manajemen Pengguna](/admin/users). ☕`;
      return {
        success: true,
        intent: 'USER_MANAGEMENT_INFO',
        source: 'mysql',
        data: { total_users: stats.totalUsersCount, users: [] },
        answer: text,
        reply: text,
      };
    }

    const userRoleBadge = (role: string) => {
      switch (role) {
        case 'ADMIN':
          return 'Admin';
        case 'OWNER':
          return 'Owner';
        case 'KASIR':
          return 'Kasir';
        case 'PELANGGAN':
          return 'Pelanggan';
        case 'SUPPLIER':
          return 'Supplier';
        default:
          return role;
      }
    };

    const userListFormatted = stats.usersList
      .map((user) => `• **${user.name}** (${userRoleBadge(user.role)}) — \`${user.email}\``)
      .join('\n');

    const text =
      `👥 **Daftar Pengguna Kopi Mahasiswa (${stats.totalUsersCount} akun):**\n\n` +
      `${userListFormatted}\n\n` +
      `Silakan kelola akun melalui halaman [Manajemen Pengguna](/admin/users). ☕`;

    return {
      success: true,
      intent: 'USER_MANAGEMENT_INFO',
      source: 'mysql',
      data: {
        total_users: stats.totalUsersCount,
        stats: {
          total: stats.totalUsersCount,
          admin: stats.adminUsersCount,
          owner: stats.ownerUsersCount,
          kasir: stats.kasirUsersCount,
          pelanggan: stats.pelangganUsersCount,
          supplier: stats.supplierUsersCount,
        },
        users: stats.usersList,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '👥 Berapa Total User?', prompt: 'Berapa total user?' },
        { label: '🛡️ Role & Hak Akses', prompt: 'Apa saja role dan hak akses pengguna?' },
        { label: '📋 Daftar Pengguna', prompt: 'Siapa saja pengguna di sistem?' },
        { label: '🏪 Kondisi Operasional', prompt: 'Bantu jelaskan kondisi operasional toko' },
      ],
    };
  }

  // ==============================================================
  // A. ADMIN AI ASSISTANT HANDLERS
  // ==============================================================

  // A1. ADMIN_ORDER_VS_PO (Perbedaan Pesanan Customer vs Purchase Order)
  if (intent.category === 'ADMIN_ORDER_VS_PO') {
    const text =
      `📋 **Perbedaan Mendasar Pesanan Customer vs Purchase Order (PO):**\n\n` +
      `1. 🛒 **Pesanan Customer (Customer Orders)**:\n` +
      `   • **Definisi**: Transaksi penjualan menu minuman atau makanan jadi dari kedai kepada pembeli/pelanggan.\n` +
      `   • **Arus Kas**: **Pemasukan (Cash Inflow)** yang menghasilkan omzet pendapatan usaha (${stats.totalRevenueFormatted}).\n` +
      `   • **Status Alur**: \`PENDING\` ➔ \`CONFIRMED\` ➔ \`PROCESSING\` (diracik barista) ➔ \`READY\` ➔ \`COMPLETED\`.\n` +
      `   • **Data Saat Ini**: Tercatat **${stats.totalOrdersCount} pesanan pelanggan** (${stats.totalPaidTransactions} transaksi lunas).\n\n` +
      `2. 📦 **Purchase Order (PO) Supplier**:\n` +
      `   • **Definisi**: Surat pesanan resmi pengadaan bahan baku mentah (biji kopi, susu fresh milk, sirup aren, dough pastry) yang diajukan kedai ke supplier mitra.\n` +
      `   • **Arus Kas**: **Pengeluaran Modal (Cash Outflow / HPP)** untuk menjamin ketersediaan stok inventori gudang.\n` +
      `   • **Status Alur**: \`PENDING\` (menunggu konfirmasi supplier) ➔ \`RECEIVED\` (bahan diterima di gudang) ➔ \`CANCELLED\`.\n` +
      `   • **Data Saat Ini**: Tercatat **${stats.totalPurchasesCount} Purchase Order** dengan total nilai pengadaan **${stats.totalPurchasesAmountFormatted}**.\n\n` +
      `Keduanya terintegrasi langsung di sistem: Pesanan Customer memotong stok bahan baku resep, sedangkan Purchase Order menambah kembali stok inventori saat barang diterima. ☕📦`;

    return {
      success: true,
      intent: 'ADMIN_ORDER_VS_PO',
      source: 'mysql',
      data: {
        total_orders: stats.totalOrdersCount,
        total_purchases: stats.totalPurchasesCount,
        purchases_amount: stats.totalPurchasesAmount,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '👥 Pelanggan Pemesan', prompt: 'Siapa pelanggan yang melakukan pemesanan?' },
        { label: '🏪 Kondisi Operasional', prompt: 'Bantu jelaskan kondisi operasional toko' },
        { label: '📦 Ringkasan Pengadaan', prompt: 'Bagaimana kondisi pengadaan barang?' },
      ],
    };
  }

  // A2. ADMIN_CUSTOMER_INFO (Pelanggan yang memesan)
  if (intent.category === 'ADMIN_CUSTOMER_INFO') {
    if (isCountOnlyQuestion(userMessage)) {
      const cleanMessage = normalizeText(userMessage);
      const isOrderCount = /\b(pesanan|order|transaksi)\b/.test(cleanMessage);
      const text = isOrderCount
        ? `Total pesanan yang tercatat saat ini ${stats.totalOrdersCount} pesanan. ☕`
        : `Saat ini terdapat ${stats.pelangganUsersCount} akun pelanggan. ☕`;

      return {
        success: true,
        intent: 'ADMIN_CUSTOMER_INFO',
        source: 'mysql',
        data: isOrderCount
          ? { total_orders: stats.totalOrdersCount }
          : { total_customers: stats.pelangganUsersCount },
        answer: text,
        reply: text,
      };
    }

    const text =
      `👥 **Informasi Pelanggan & Pesanan di Kopi Mahasiswa:**\n\n` +
      `Berdasarkan pencatatan database transaksi toko:\n\n` +
      `• **Total Akun Pelanggan Terdaftar**: **${stats.pelangganUsersCount} akun member**\n` +
      `• **Total Transaksi Pesanan**: **${stats.totalOrdersCount} pesanan**\n` +
      `• **Akun Utama Member**: **Budi Mahasiswa** (*pelanggankopimahasiswa@gmail.com*), memiliki **150 poin reward** dan histori transaksi aktif.\n\n` +
      `Pesanan di Kopi Mahasiswa dapat dilakukan oleh member terdaftar maupun pelanggan umum (*Guest Order* di kasir). Setiap transaksi terekam otomatis dengan detail waktu, item menu, total nominal, serta status pembayaran QRIS atau Tunai. ☕📊`;

    return {
      success: true,
      intent: 'ADMIN_CUSTOMER_INFO',
      source: 'mysql',
      data: {
        total_customers: stats.pelangganUsersCount,
        total_orders: stats.totalOrdersCount,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '⚖️ Beda Order vs PO', prompt: 'Apa perbedaan pesanan Customer dan Purchase Order?' },
        { label: '🏪 Kondisi Operasional', prompt: 'Bantu jelaskan kondisi operasional toko' },
        { label: '👥 Manajemen Pengguna', prompt: 'Berapa total pengguna sistem?' },
      ],
    };
  }

  // A3. ADMIN_STORE_OPERATION (Kondisi operasional toko)
  if (intent.category === 'ADMIN_STORE_OPERATION') {
    const text =
      `🏪 **Laporan Kondisi Operasional Toko Kopi Mahasiswa:**\n\n` +
      `1. ☕ **Katalog & Resep**: Terdapat **${stats.totalMenusCount} menu** aktif siap saji di **${stats.totalCategoriesCount} kategori**.\n` +
      `2. 📦 **Inventori & Bahan**: Memiliki **${stats.totalIngredientsCount} bahan baku** di gudang. Stok biji kopi dan bahan utama dalam kondisi terkontrol.\n` +
      `3. 🛒 **Penjualan & Kasir**: Tercatat **${stats.totalOrdersCount} pesanan** dengan omzet **${stats.totalRevenueFormatted}**.\n` +
      `4. 🚚 **Rantai Pasok Supplier**: Berjalan dengan **${stats.totalPurchasesCount} Purchase Order** senilai **${stats.totalPurchasesAmountFormatted}**.\n` +
      `5. 👥 **Personil & Hak Akses**: Dikelola oleh **${stats.totalUsersCount} personil** (${stats.adminUsersCount} Admin, ${stats.ownerUsersCount} Owner, ${stats.kasirUsersCount} Kasir, ${stats.pelangganUsersCount} Member, ${stats.supplierUsersCount} Supplier).\n\n` +
      `Seluruh sistem berjalan normal dan siap melayani pesanan berikutnya! ☕✨`;

    return {
      success: true,
      intent: 'ADMIN_STORE_OPERATION',
      source: 'mysql',
      data: {
        menus: stats.totalMenusCount,
        ingredients: stats.totalIngredientsCount,
        orders: stats.totalOrdersCount,
        revenue: stats.totalRevenue,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '⚖️ Beda Order vs PO', prompt: 'Apa perbedaan pesanan Customer dan Purchase Order?' },
        { label: '👥 Pelanggan Pemesan', prompt: 'Siapa pelanggan yang melakukan pemesanan?' },
        { label: '📊 Ringkasan Dasbor', prompt: 'Ringkasan dasbor total menu dll' },
      ],
    };
  }

  // ==============================================================
  // B. CUSTOMER AI ASSISTANT HANDLERS (Asisten Belanja Pribadi)
  // ==============================================================

  // B1. CUSTOMER_MY_ORDER_STATUS (Status pesanan saya)
  if (intent.category === 'CUSTOMER_MY_ORDER_STATUS') {
    const cust = stats.customerContext;
    let text = '';

    if (cust && cust.recentOrders && cust.recentOrders.length > 0) {
      const latest = cust.recentOrders[0];
      const statusLabel =
        latest.status === 'COMPLETED' ? '✅ Selesai (Completed)' :
        latest.status === 'PROCESSING' ? '☕ Sedang Diracik Barista' :
        latest.status === 'READY' ? '🔔 Siap Diambil di Meja Bar' :
        latest.status === 'CONFIRMED' ? '📋 Pesanan Telah Dikonfirmasi' :
        latest.status === 'CANCELLED' ? '❌ Dibatalkan' : '⏳ Menunggu Pembayaran';

      text =
        `Halo Kak **${cust.customerName}**! ☕✨\n\n` +
        `Berikut status pesanan terbaru Kakak:\n` +
        `• **Nomor Pesanan**: \`${latest.orderNumber}\`\n` +
        `• **Status Saat Ini**: **${statusLabel}**\n` +
        `• **Menu Dipesan**: ${latest.itemsSummary}\n` +
        `• **Total Pembayaran**: **${latest.totalAmountFormatted}** (${latest.paymentMethod} - Status: ${latest.paymentStatus})\n\n` +
        (latest.status === 'COMPLETED'
          ? `Pesanan Kakak telah selesai disajikan. Selamat menikmati kopi racikan kami ya Kak! 😊☕`
          : `Barista kami sedang mempersiapkan pesanan Kakak dengan sepenuh hati. Silakan tunggu sebentar ya! ☕✨`);
    } else {
      text =
        `Halo Kak! 😊\n\n` +
        `Saat ini belum ada riwayat pesanan aktif atas nama akun Kakak. Yuk pilih racikan kopi favorit dari menu katalog kami! Ada promo diskon 20% dengan kode \`MHS2026\`. ☕✨`;
    }

    return {
      success: true,
      intent: 'CUSTOMER_MY_ORDER_STATUS',
      source: 'mysql-customer-isolation',
      data: { customer: cust },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 3),
      quickActions: [
        { label: '🛒 Cek Keranjang Belanja', prompt: 'Apa saja produk dalam keranjang saya?' },
        { label: '📜 Riwayat Pesanan', prompt: 'Tolong jelaskan riwayat pesanan saya' },
        { label: '☕ Produk Tersedia', prompt: 'Produk apa saja yang tersedia?' },
      ],
    };
  }

  // B2. CUSTOMER_MY_CART (Produk dalam keranjang saya)
  if (intent.category === 'CUSTOMER_MY_CART') {
    const cust = stats.customerContext;
    let text = '';

    if (cust && cust.cartItems && cust.cartItems.length > 0) {
      const itemList = cust.cartItems
        .map((it, idx) => `${idx + 1}. **${it.name}** x${it.quantity} — Rp${it.subtotal.toLocaleString('id-ID')}`)
        .join('\n');

      text =
        `🛒 **Isi Keranjang Belanja Kakak:**\n\n` +
        `${itemList}\n\n` +
        `• **Total Belanja Sementara**: **${cust.cartTotalFormatted}**\n\n` +
        `💡 *Tips Hemat:* Jangan lupa masukkan kode kupon **\`MHS2026\`** di halaman checkout untuk mendapatkan diskon langsung 20%! Siap untuk memesan sekarang? ☕✨`;
    } else {
      text =
        `🛒 **Keranjang Belanja Kakak Masih Kosong!**\n\n` +
        `Kakak belum memasukkan menu ke keranjang. Rekomendasi racikan terbaik untuk menemani aktivitas hari ini:\n` +
        `• **Es Kopi Susu Gula Aren** (Rp 18.000) — Best seller manis gurih\n` +
        `• **Matcha Creamy Latte** (Rp 22.000) — Creamy lembut ramah lambung\n` +
        `• **Americano Cold Brew** (Rp 15.000) — Ekstrak kopi murni kaya kafein\n\n` +
        `Klik tombol katalog di bawah untuk menambahkan menu ke keranjang ya Kak! ☕😊`;
    }

    return {
      success: true,
      intent: 'CUSTOMER_MY_CART',
      source: 'cart-context',
      data: { cart: cust?.cartItems || [] },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 3),
      quickActions: [
        { label: '📋 Produk Tersedia', prompt: 'Produk apa saja yang tersedia?' },
        { label: '📦 Status Pesanan Saya', prompt: 'Bagaimana status pesanan saya?' },
        { label: '🏷️ Promo Diskon MHS2026', prompt: 'Apakah ada promo?' },
      ],
    };
  }

  // B3. CUSTOMER_MY_ORDER_HISTORY (Riwayat pesanan saya)
  if (intent.category === 'CUSTOMER_MY_ORDER_HISTORY') {
    const cust = stats.customerContext;
    let text = '';

    if (cust && cust.recentOrders && cust.recentOrders.length > 0) {
      const orderHistoryList = cust.recentOrders
        .map(
          (o, idx) =>
            `${idx + 1}. \`${o.orderNumber}\` (${o.totalAmountFormatted}) — Status: **${o.status}**\n   *Item: ${o.itemsSummary}*`
        )
        .join('\n\n');

      text =
        `📜 **Riwayat Belanja Kak ${cust.customerName}:**\n\n` +
        `• **Total Pesanan**: **${cust.totalOrdersCount} pesanan**\n` +
        `• **Reward Points**: **${cust.points} poin** 🎁\n\n` +
        `Daftar riwayat transaksi Kakak:\n` +
        `${orderHistoryList}\n\n` +
        `Terima kasih sudah menjadi bagian dari komunitas mahasiswa pencinta kopi di Kopi Mahasiswa! ☕✨`;
    } else {
      text =
        `📜 **Riwayat Belanja Masih Kosong**\n\n` +
        `Akun Kakak belum memiliki riwayat pesanan sebelumnya. Dapatkan poin reward dan penawaran spesial di setiap pemesanan pertama Kakak! 😊☕`;
    }

    return {
      success: true,
      intent: 'CUSTOMER_MY_ORDER_HISTORY',
      source: 'mysql-customer-isolation',
      data: { customer: cust },
      answer: text,
      reply: text,
      quickActions: [
        { label: '☕ Produk Tersedia', prompt: 'Produk apa saja yang tersedia?' },
        { label: '🛒 Cek Keranjang', prompt: 'Apa saja produk dalam keranjang saya?' },
        { label: '🏷️ Promo Diskon', prompt: 'Apakah ada promo?' },
      ],
    };
  }

  // ==============================================================
  // C. KASIR AI ASSISTANT HANDLERS (Dukungan Operasional POS)
  // ==============================================================

  // C1. KASIR_SALES_SUMMARY (Ringkasan aktivitas penjualan & jumlah transaksi)
  if (intent.category === 'KASIR_SALES_SUMMARY') {
    const text =
      `☕💳 **Ringkasan Aktivitas Penjualan Kasir Kopi Mahasiswa:**\n\n` +
      `Berdasarkan data Point of Sale (POS) terkini:\n` +
      `• **Total Seluruh Transaksi**: **${stats.totalOrdersCount} pesanan** tercatat di sistem\n` +
      `• **Transaksi Lunas (Paid)**: **${stats.totalPaidTransactions} transaksi** (Total Omset: **${stats.totalRevenueFormatted}**)\n` +
      `• **Pesanan Hari Ini**: **${stats.todayOrdersCount} pesanan** (${stats.todayPaidTransactions} lunas — Omset hari ini: **${stats.todayRevenueFormatted}**)\n` +
      `• **Status Pesanan Selesai**: **${stats.completedOrdersCount} pesanan disajikan**\n` +
      `• **Pesanan Sedang Diproses/Antre**: **${stats.processingOrdersCount + stats.pendingOrdersCount} pesanan**\n\n` +
      `Pastikan selalu mengecek konfirmasi bukti transfer QRIS atau menghitung uang pas tunai sebelum menyelesaikan transaksi di layar kasir. Semangat bertugas! ☕💪`;

    return {
      success: true,
      intent: 'KASIR_SALES_SUMMARY',
      source: 'mysql',
      data: {
        total_transactions: stats.totalOrdersCount,
        paid_transactions: stats.totalPaidTransactions,
        revenue: stats.totalRevenue,
        today_orders: stats.todayOrdersCount,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '📋 Info Operasional', prompt: 'Apa saja informasi operasional yang perlu saya perhatikan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
        { label: '📦 Cek Bahan Baku', prompt: 'Berapa bahan baku?' },
      ],
    };
  }

  // C2. KASIR_OPERATIONAL_INFO (Informasi operasional yang perlu diperhatikan kasir)
  if (intent.category === 'KASIR_OPERATIONAL_INFO') {
    const lowStockWarning =
      stats.lowStockIngredients.length > 0
        ? `⚠️ **Perhatian Stok Menipis**: ${stats.lowStockIngredients.map((i) => `${i.name} (sisa ${i.stock} ${i.unit})`).join(', ')}.`
        : `✅ **Stok Bahan Baku Aman**: Seluruh bahan resep mencukupi untuk disajikan.`;

    const text =
      `📋 **Informasi Operasional Kasir & Barista:**\n\n` +
      `1. 🛒 **Antrean Pesanan Aktif**:\n` +
      `   • Menunggu Konfirmasi/Bayar: **${stats.pendingOrdersCount} pesanan**\n` +
      `   • Sedang Diracik Barista: **${stats.processingOrdersCount} pesanan**\n` +
      `   • Total pesanan selesai hari ini: **${stats.completedOrdersCount} pesanan**\n\n` +
      `2. 📦 **Ketersediaan Menu & Stok Racikan**:\n` +
      `   ${lowStockWarning}\n\n` +
      `3. 💳 **Metode Pembayaran Tersedia**: QRIS otomatis, Tunai (Cash), dan Transfer Bank.\n` +
      `4. 🏷️ **Promo Mahasiswa**: Ingatkan pelanggan mengenai kupon diskon \`MHS2026\` (Potongan 20%) untuk mahasiswa.\n\n` +
      `Segera beritahukan barista bila ada pesanan yang sudah berstatus LUNAS agar dapat segera diracik! ☕🚀`;

    return {
      success: true,
      intent: 'KASIR_OPERATIONAL_INFO',
      source: 'mysql',
      data: {
        pending: stats.pendingOrdersCount,
        processing: stats.processingOrdersCount,
        completed: stats.completedOrdersCount,
        lowStock: stats.lowStockIngredients,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '📊 Ringkasan Penjualan', prompt: 'Bagaimana ringkasan aktivitas penjualan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
        { label: '📋 Varian Menu Aktif', prompt: 'Berapa total menu?' },
      ],
    };
  }

  // ==============================================================
  // D. SUPPLIER AI ASSISTANT HANDLERS (Informasi Pengadaan & PO)
  // ==============================================================

  // D1. SUPPLIER_PO_COUNT (Jumlah Purchase Order saya)
  if (intent.category === 'SUPPLIER_PO_COUNT') {
    const supp = stats.supplierContext;
    let text = '';

    if (supp) {
      text =
        `🚚 **Informasi Purchase Order Supplier — ${supp.supplierName}:**\n\n` +
        `Berdasarkan data pengadaan bahan baku yang terdaftar atas akun Anda:\n` +
        `• **Total Purchase Order (PO)**: **${supp.totalPurchasesCount} pesanan pengadaan**\n` +
        `• **PO Menunggu Pengiriman (\`PENDING\`)**: **${supp.pendingPurchasesCount} pesanan**\n` +
        `• **PO Sudah Diterima di Gudang (\`RECEIVED\`)**: **${supp.receivedPurchasesCount} pesanan**\n` +
        `• **Total Nilai Pengadaan Anda**: **${supp.totalPurchasesAmountFormatted}**\n\n` +
        `Kemitraan Anda memastikan biji kopi dan bahan baku resep Kopi Mahasiswa selalu dalam kondisi prima dan segar. ☕📦`;
    } else {
      text =
        `🚚 **Informasi Pengadaan Supplier Kedai:**\n\n` +
        `Secara keseluruhan, toko Kopi Mahasiswa memiliki **${stats.totalPurchasesCount} Purchase Order** senilai **${stats.totalPurchasesAmountFormatted}** dengan rincian **${stats.pendingPurchasesCount} PO Pending** dan **${stats.receivedPurchasesCount} PO Selesai Diterima**.`;
    }

    return {
      success: true,
      intent: 'SUPPLIER_PO_COUNT',
      source: 'mysql-supplier-isolation',
      data: { supplier: supp, total_purchases: stats.totalPurchasesCount },
      answer: text,
      reply: text,
      quickActions: [
        { label: '📦 Status PO Terbaru', prompt: 'Bagaimana status PO terbaru?' },
        { label: '📋 Detail PO Saya', prompt: 'Apa saja detail PO saya?' },
        { label: '🚚 Ringkasan Pengadaan', prompt: 'Tampilkan ringkasan pengadaan' },
      ],
    };
  }

  // D2. SUPPLIER_LATEST_PO (Status PO terbaru)
  if (intent.category === 'SUPPLIER_LATEST_PO') {
    const supp = stats.supplierContext;
    let text = '';

    if (supp && supp.recentPurchases && supp.recentPurchases.length > 0) {
      const latest = supp.recentPurchases[0];
      const statusLabel =
        latest.status === 'RECEIVED' ? '✅ Sudah Diterima di Gudang Kedai' :
        latest.status === 'PENDING' ? '⏳ Menunggu Pengiriman & Konfirmasi' : '❌ Dibatalkan';

      text =
        `🚚 **Status Purchase Order (PO) Terbaru — ${supp.supplierName}:**\n\n` +
        `• **Nomor PO**: \`${latest.purchaseNumber}\`\n` +
        `• **Status Saat Ini**: **${statusLabel}**\n` +
        `• **Rincian Bahan Baku**: ${latest.itemsSummary}\n` +
        `• **Total Nilai PO**: **${latest.totalAmountFormatted}**\n` +
        (latest.notes ? `• **Catatan Khusus**: *"${latest.notes}"*\n\n` : `\n`) +
        (latest.status === 'PENDING'
          ? `Mohon dipersiapkan pengiriman bahan baku sesuai pesanan di atas ke alamat kedai Kopi Mahasiswa ya Pak/Bu. Terima kasih! 📦✨`
          : `Bahan baku pada pesanan ini sudah diverifikasi dan masuk ke inventori gudang. Terima kasih atas kerja samanya! ☕🤝`);
    } else {
      text =
        `Saat ini belum ada data Purchase Order aktif untuk akun supplier Anda. Tim pengadaan Kopi Mahasiswa akan segera menerbitkan PO saat stok bahan baku mendekati batas minimum. ☕📦`;
    }

    return {
      success: true,
      intent: 'SUPPLIER_LATEST_PO',
      source: 'mysql-supplier-isolation',
      data: { supplier: supp },
      answer: text,
      reply: text,
      quickActions: [
        { label: '📊 Berapa PO Saya?', prompt: 'Berapa Purchase Order yang saya miliki?' },
        { label: '📋 Detail PO Saya', prompt: 'Apa saja detail PO saya?' },
        { label: '🚚 Ringkasan Pengadaan', prompt: 'Tampilkan ringkasan pengadaan' },
      ],
    };
  }

  // D3. SUPPLIER_PO_DETAILS & PROCUREMENT_SUMMARY
  if (intent.category === 'SUPPLIER_PO_DETAILS' || intent.category === 'SUPPLIER_PROCUREMENT_SUMMARY') {
    const supp = stats.supplierContext;
    let text = '';

    if (supp && supp.recentPurchases && supp.recentPurchases.length > 0) {
      const poList = supp.recentPurchases
        .map(
          (p, idx) =>
            `${idx + 1}. **\`${p.purchaseNumber}\`** — **${p.totalAmountFormatted}** [Status: ${p.status}]\n   • *Bahan: ${p.itemsSummary}*${p.notes ? ` (Catatan: ${p.notes})` : ''}`
        )
        .join('\n\n');

      text =
        `📋 **Ringkasan Detail Pengadaan — ${supp.supplierName}:**\n\n` +
        `• **Kontak Mitra**: ${supp.contactName} (${supp.phone})\n` +
        `• **Total Transaksi Pengadaan**: **${supp.totalPurchasesCount} PO** (Akumulasi: **${supp.totalPurchasesAmountFormatted}**)\n\n` +
        `Daftar Purchase Order yang terhubung:\n` +
        `${poList}\n\n` +
        `Data ini disinkronkan langsung dari tabel \`purchases\` database Kopi Mahasiswa. 🚚📦`;
    } else {
      const globalPoList = stats.recentPurchasesList
        .map(
          (p, idx) =>
            `${idx + 1}. **\`${p.purchaseNumber}\`** (${p.supplierName}) — **${p.totalAmountFormatted}** [${p.status}]\n   • *Item: ${p.itemsSummary}*`
        )
        .join('\n\n');

      text =
        `📋 **Ringkasan Pengadaan Bahan Baku Kedai Kopi Mahasiswa:**\n\n` +
        `• **Total Seluruh PO**: **${stats.totalPurchasesCount} pesanan pengadaan**\n` +
        `• **Total Nilai Pengadaan**: **${stats.totalPurchasesAmountFormatted}**\n` +
        `• **PO Pending**: ${stats.pendingPurchasesCount} pesanan | **PO Selesai**: ${stats.receivedPurchasesCount} pesanan\n\n` +
        `Daftar Purchase Order terbaru:\n` +
        `${globalPoList}\n\n` +
        `Data ini memantau alur suplai biji kopi dan bahan baku resep dari seluruh mitra supplier. 🚚📦`;
    }

    return {
      success: true,
      intent: intent.category,
      source: 'mysql-supplier-isolation',
      data: { supplier: supp, purchases: stats.recentPurchasesList },
      answer: text,
      reply: text,
      quickActions: [
        { label: '📊 Berapa PO Saya?', prompt: 'Berapa Purchase Order yang saya miliki?' },
        { label: '📦 Status PO Terbaru', prompt: 'Bagaimana status PO terbaru?' },
        { label: '☕ Cek Stok Bahan', prompt: 'Berapa bahan baku?' },
      ],
    };
  }

  // ==============================================================
  // E. OWNER AI ASSISTANT HANDLERS (Analisis Bisnis & Omzet)
  // ==============================================================

  // E1. OWNER_OMZET (Berapa omzet toko)
  if (intent.category === 'OWNER_OMZET') {
    const text = `Total pendapatan saat ini yaitu ${stats.totalRevenueFormatted} ☕`;

    return {
      success: true,
      intent: 'OWNER_OMZET',
      source: 'mysql',
      data: {
        total_revenue: stats.totalRevenue,
        today_revenue: stats.todayRevenue,
        hpp: stats.totalHpp,
        gross_profit: stats.grossProfit,
        margin: stats.profitMarginPercent,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '🏆 Menu Paling Laris', prompt: 'Produk apa yang paling laris?' },
        { label: '⚠️ Cek Stok Kritis', prompt: 'Produk apa yang stoknya habis?' },
        { label: '🚚 Kondisi Pengadaan', prompt: 'Bagaimana kondisi pengadaan barang?' },
        { label: '📊 Ringkasan Bisnis', prompt: 'Berikan ringkasan kondisi bisnis' },
      ],
    };
  }

  // E2. OWNER_CRITICAL_STOCK (Produk/bahan yang stoknya habis atau menipis)
  if (intent.category === 'OWNER_CRITICAL_STOCK') {
    const stockDetailsHref = '/owner/dashboard';
    const countOnly = isCountOnlyQuestion(userMessage);
    let text = '';

    if (stats.ingredientsStock.length === 0) {
      text =
        `Data inventori belum tersedia untuk memastikan jumlah alert stok. ` +
        `Silakan cek [Owner Dashboard](${stockDetailsHref}) atau modul Stok & Inventori Bahan. ☕`;
    } else if (countOnly) {
      text = `Alert stok menipis saat ini yaitu ${stats.lowStockIngredients.length} Bahan ☕`;
    } else if (stats.lowStockIngredients.length > 0) {
      const items = stats.lowStockIngredients
        .map((ingredient) =>
          `• **Nama Bahan**: ${ingredient.name}\n` +
          `  **Stok Saat Ini**: ${ingredient.stock.toLocaleString('id-ID')} ${ingredient.unit}\n` +
          `  **Batas Minimum (Min)**: ${ingredient.minStock.toLocaleString('id-ID')} ${ingredient.unit}\n` +
          `  **Status**: Perlu Pengadaan Segera (Need Reorder)`
        )
        .join('\n\n');

      text =
        `⚠️ **Bahan dengan Alert Stok Menipis (${stats.lowStockIngredients.length}):**\n\n` +
        `${items}\n\n` +
        `Silakan tinjau [Stok & Inventori Bahan](/admin/inventory) atau [Owner Dashboard](${stockDetailsHref}) untuk tindak lanjut pengadaan. ☕`;
    } else {
      text =
        `Saat ini tidak ada alert stok menipis. Seluruh ${stats.totalIngredientsCount} bahan baku berada di atas batas minimum. ` +
        `Silakan cek [Owner Dashboard](${stockDetailsHref}) atau modul Stok & Inventori Bahan untuk rincian inventori. ☕`;
    }

    return {
      success: true,
      intent: 'OWNER_CRITICAL_STOCK',
      source: 'mysql',
      data: {
        low_stock_count: stats.lowStockIngredients.length,
        low_stock: stats.lowStockIngredients,
        total_ingredients: stats.totalIngredientsCount,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '💵 Cek Omzet Toko', prompt: 'Berapa omzet toko?' },
        { label: '🚚 Kondisi Pengadaan', prompt: 'Bagaimana kondisi pengadaan barang?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Produk apa yang paling laris?' },
      ],
    };
  }

  // E3. OWNER_PO_CONDITIONS (Kondisi pengadaan barang & total nilai PO)
  if (intent.category === 'OWNER_PO_CONDITIONS') {
    const poList = stats.recentPurchasesList
      .map(
        (p, idx) =>
          `${idx + 1}. **\`${p.purchaseNumber}\`** (${p.supplierName}) — **${p.totalAmountFormatted}** [${p.status}]\n   • *Bahan: ${p.itemsSummary}*`
      )
      .join('\n\n');

    const text =
      `📦🚚 **Laporan Kondisi Pengadaan Bahan Baku (Purchase Order):**\n\n` +
      `Ringkasan pengeluaran modal ke supplier mitra:\n` +
      `• **Total Nilai Seluruh PO**: **${stats.totalPurchasesAmountFormatted}**\n` +
      `• **Akumulasi Purchase Order**: **${stats.totalPurchasesCount} PO**\n` +
      `• **PO Berstatus Menunggu (\`PENDING\`)**: **${stats.pendingPurchasesCount} pesanan**\n` +
      `• **PO Selesai Diterima (\`RECEIVED\`)**: **${stats.receivedPurchasesCount} pesanan**\n\n` +
      `Rincian Purchase Order:\n` +
      `${poList}\n\n` +
      `*Catatan Owner:* Aktivitas Purchase Order ini berbeda dengan penjualan customer. PO adalah biaya modal pengadaan stok bahan baku untuk kelancaran operasional kedai. 📊☕`;

    return {
      success: true,
      intent: 'OWNER_PO_CONDITIONS',
      source: 'mysql',
      data: {
        total_purchases_amount: stats.totalPurchasesAmount,
        total_purchases_count: stats.totalPurchasesCount,
        purchases: stats.recentPurchasesList,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '💵 Cek Omzet Toko', prompt: 'Berapa omzet toko?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Produk apa yang paling laris?' },
        { label: '📊 Ringkasan Bisnis', prompt: 'Berikan ringkasan kondisi bisnis' },
      ],
    };
  }

  // E4. OWNER_BUSINESS_SUMMARY (Ringkasan kondisi bisnis)
  if (intent.category === 'OWNER_BUSINESS_SUMMARY') {
    const topMenu = stats.topSellingMenus[0]?.name || 'Es Kopi Susu Gula Aren';
    const text =
      `👑📊 **Executive Summary — Kondisi Bisnis Kopi Mahasiswa:**\n\n` +
      `1. 💵 **Kesehatan Finansial & Omzet**:\n` +
      `   • Total Omzet Selesai: **${stats.totalRevenueFormatted}**\n` +
      `   • Laba Kotor Usaha: **${stats.grossProfitFormatted}**\n` +
      `   • Margin Keuntungan: **${stats.profitMarginPercent}** (Kategori sangat efisien & sehat)\n\n` +
      `2. 🛒 **Aktivitas Penjualan & Menu**:\n` +
      `   • Total Transaksi: **${stats.totalOrdersCount} pesanan**\n` +
      `   • Menu Juara (Best Seller): **${topMenu}**\n` +
      `   • Katalog Menu Aktif: **${stats.totalMenusCount} item** di **${stats.totalCategoriesCount} kategori**\n\n` +
      `3. 📦 **Kondisi Inventori & Rantai Pasok**:\n` +
      `   • Total Bahan Baku: **${stats.totalIngredientsCount} jenis bahan**\n` +
      `   • Total Nilai Pengadaan Supplier: **${stats.totalPurchasesAmountFormatted}** (${stats.totalPurchasesCount} PO)\n` +
      `   • Status Bahan Baku: ${stats.lowStockIngredients.length > 0 ? `⚠️ ${stats.lowStockIngredients.length} bahan menipis` : '✅ Semua bahan aman'}\n\n` +
      `4. 👥 **Ekosistem Pengguna**:\n` +
      `   • Terdaftar **${stats.totalUsersCount} user** aktif (1 Admin, 1 Owner, 1 Kasir, 1 Member, 1 Supplier)\n\n` +
      `Secara keseluruhan, bisnis Kopi Mahasiswa beroperasi secara optimal dan stabil! ☕🚀`;

    return {
      success: true,
      intent: 'OWNER_BUSINESS_SUMMARY',
      source: 'mysql',
      data: {
        revenue: stats.totalRevenue,
        profit: stats.grossProfit,
        margin: stats.profitMarginPercent,
        orders: stats.totalOrdersCount,
        top_menu: topMenu,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '💵 Cek Omzet Toko', prompt: 'Berapa omzet toko?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Produk apa yang paling laris?' },
        { label: '⚠️ Cek Stok Kritis', prompt: 'Produk apa yang stoknya habis?' },
        { label: '🚚 Kondisi Pengadaan', prompt: 'Bagaimana kondisi pengadaan barang?' },
      ],
    };
  }

  // ==========================================
  // 1. ACTIVE_MENU_COUNT (Total Menu: 5 Item)
  // ==========================================
  if (intent.category === 'ACTIVE_MENU_COUNT') {
    if (isCountOnlyQuestion(userMessage)) {
      const text = `Varian menu aktif saat ini yaitu ${stats.activeMenusCount} Menu ☕`;
      return {
        success: true,
        intent: 'ACTIVE_MENU_COUNT',
        source: 'mysql',
        data: { active_menus_count: stats.activeMenusCount, total_menus_count: stats.totalMenusCount },
        answer: text,
        reply: text,
      };
    }

    const menuList = stats.activeMenusList
      .map((m, idx) => `${idx + 1}. **${m.name}** (${m.priceFormatted}) — *Kategori: ${m.categoryName}*`)
      .join('\n');

    const text =
      `Berdasarkan data dasbor Kopi Mahasiswa, saat ini terdapat **TOTAL MENU: ${stats.totalMenusCount} item** (semuanya berstatus aktif dan siap dipesan di katalog):\n\n` +
      `${menuList}\n\n` +
      `Semua varian menu di atas berstatus **Tersedia (Ready)** dan bahan bakunya lengkap di inventaris kedai. ☕✨`;

    return {
      success: true,
      intent: 'ACTIVE_MENU_COUNT',
      source: 'mysql',
      data: {
        active_menus_count: stats.activeMenusCount,
        total_menus_count: stats.totalMenusCount,
        menus: stats.activeMenusList,
      },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 3),
      quickActions: [
        { label: '🗂️ Kategori Menu', prompt: 'Berapa kategori menu?' },
        { label: '📦 Cek Bahan Baku', prompt: 'Berapa bahan baku?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
      ],
    };
  }

  // ==========================================
  // 2. ORDER_COUNT (Total Pesanan / Transaksi)
  // ==========================================
  if (intent.category === 'ORDER_COUNT') {
    if (isCountOnlyQuestion(userMessage)) {
      const asksForToday = /\b(hari ini|today)\b/.test(normalizeText(userMessage));
      const count = asksForToday ? stats.todayOrdersCount : stats.totalOrdersCount;
      const text =
        userRole === 'OWNER' && !asksForToday
          ? `Total pesanan saat ini yaitu ${count} Trx ☕`
          : `Total pesanan${asksForToday ? ' hari ini' : ' saat ini'} ${count} pesanan. ☕`;
      return {
        success: true,
        intent: 'ORDER_COUNT',
        source: 'mysql',
        data: asksForToday
          ? { today_orders: count }
          : { total_orders: count },
        answer: text,
        reply: text,
      };
    }

    if (intent.isTodayQuery) {
      const text =
        `Berdasarkan pencatatan database hari ini:\n\n` +
        `• **Total Pesanan Hari Ini**: **${stats.todayOrdersCount} pesanan**\n` +
        `• **Transaksi Lunas Hari Ini**: **${stats.todayPaidTransactions} transaksi** (${stats.todayRevenueFormatted})\n` +
        `• **Akumulasi Seluruh Pesanan**: **${stats.totalOrdersCount} pesanan** (Total Omset: ${stats.totalRevenueFormatted})\n\n` +
        (stats.todayOrdersCount === 0
          ? `*Catatan: Belum ada pesanan baru yang masuk pada tanggal hari ini. Sistem siap menerima pesanan berikutnya!* ☕`
          : `*Data tersinkronisasi langsung dari tabel \`orders\` dan \`payments\` database.*`);

      return {
        success: true,
        intent: 'ORDER_COUNT',
        source: 'mysql',
        data: {
          today_orders: stats.todayOrdersCount,
          today_paid_transactions: stats.todayPaidTransactions,
          today_revenue: stats.todayRevenue,
          total_orders: stats.totalOrdersCount,
        },
        answer: text,
        reply: text,
        quickActions: [
          { label: '💵 Total Pendapatan', prompt: 'Berapa total pendapatan?' },
          { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
          { label: '⏳ Pesanan Selesai', prompt: 'Berapa pesanan yang sudah selesai?' },
        ],
      };
    }

    const text =
      `Total pesanan yang tercatat di database Kopi Mahasiswa saat ini adalah **${stats.totalOrdersCount} pesanan**.\n\n` +
      `Rincian status pesanan:\n` +
      `• **Transaksi Lunas (Paid)**: **${stats.totalPaidTransactions} transaksi** (Total Omset: ${stats.totalRevenueFormatted})\n` +
      `• **Pesanan Selesai (Completed)**: **${stats.completedOrdersCount} pesanan**\n` +
      `• **Pesanan Sedang Diproses (Processing)**: **${stats.processingOrdersCount} pesanan**\n` +
      `• **Pesanan Menunggu (Pending)**: **${stats.pendingOrdersCount} pesanan**\n\n` +
      `Data ini diambil secara real-time dari tabel \`orders\` database MySQL. 📊`;

    return {
      success: true,
      intent: 'ORDER_COUNT',
      source: 'mysql',
      data: {
        total_orders: stats.totalOrdersCount,
        total_paid_transactions: stats.totalPaidTransactions,
        completed_orders: stats.completedOrdersCount,
        processing_orders: stats.processingOrdersCount,
        pending_orders: stats.pendingOrdersCount,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '💵 Total Pendapatan', prompt: 'Berapa total pendapatan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
        { label: '⏳ Pesanan Selesai', prompt: 'Berapa pesanan yang sudah selesai?' },
        { label: '📦 Cek Stok Barang', prompt: 'Berapa total stok?' },
      ],
    };
  }

  // ==========================================
  // 3. BUSINESS_REVENUE (Total Pendapatan)
  // ==========================================
  if (intent.category === 'BUSINESS_REVENUE') {
    if (userRole === 'OWNER' && !intent.isTodayQuery) {
      const ownerDashboardText = `Total pendapatan saat ini yaitu ${stats.totalRevenueFormatted} ☕`;

      return {
        success: true,
        intent: 'BUSINESS_REVENUE',
        source: 'owner-dashboard-data',
        data: {
          total_revenue: stats.totalRevenue,
          total_revenue_formatted: stats.totalRevenueFormatted,
        },
        answer: ownerDashboardText,
        reply: ownerDashboardText,
      };
    }

    if (intent.isTodayQuery) {
      const text =
        `Pendapatan Kopi Mahasiswa untuk hari ini adalah **${stats.todayRevenueFormatted}** dari **${stats.todayPaidTransactions} transaksi lunas**.\n\n` +
        `• **Akumulasi Seluruh Pendapatan**: **${stats.totalRevenueFormatted}** (${stats.totalPaidTransactions} transaksi lunas)\n\n` +
        `Data ini dihitung langsung dari tabel pembayaran (\`payments\`) dengan status \`PAID\`.`;

      return {
        success: true,
        intent: 'BUSINESS_REVENUE',
        source: 'mysql',
        data: {
          today_revenue: stats.todayRevenue,
          today_revenue_formatted: stats.todayRevenueFormatted,
          total_revenue: stats.totalRevenue,
          total_revenue_formatted: stats.totalRevenueFormatted,
        },
        answer: text,
        reply: text,
        quickActions: [
          { label: '💰 Cek Keuntungan', prompt: 'Berapa keuntungan?' },
          { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
          { label: '📊 Total Pesanan', prompt: 'Berapa total pesanan?' },
        ],
      };
    }

    const text =
      `Total pendapatan Kopi Mahasiswa saat ini adalah **${stats.totalRevenueFormatted}**.\n\n` +
      `Pendapatan tersebut berasal dari **${stats.totalPaidTransactions} transaksi** yang sudah lunas dan tercatat di database.\n\n` +
      `• **Pendapatan Keseluruhan**: ${stats.totalRevenueFormatted}\n` +
      `• **Status Pembayaran**: Terverifikasi Lunas (\`PAID\`)\n\n` +
      `Saya siap membantu menganalisis laporan penjualan lainnya.`;

    return {
      success: true,
      intent: 'BUSINESS_REVENUE',
      source: 'mysql',
      data: {
        total_revenue: stats.totalRevenue,
        total_revenue_formatted: stats.totalRevenueFormatted,
        total_paid_transactions: stats.totalPaidTransactions,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '💰 Cek Keuntungan', prompt: 'Berapa keuntungan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
        { label: '📊 Total Pesanan', prompt: 'Berapa total pesanan?' },
        { label: '📦 Cek Stok Barang', prompt: 'Berapa total stok?' },
      ],
    };
  }

  // ==========================================
  // 4. BUSINESS_PROFIT (Keuntungan / Laba)
  // ==========================================
  if (intent.category === 'BUSINESS_PROFIT') {
    const text =
      `Total keuntungan kotor (*gross profit*) Kopi Mahasiswa saat ini adalah **${stats.grossProfitFormatted}**.\n\n` +
      `Rincian kalkulasi laba berdasarkan data transaksi dan resep bahan baku di database:\n` +
      `• **Total Pendapatan (Omset)**: ${stats.totalRevenueFormatted}\n` +
      `• **Estimasi Biaya Bahan Baku (HPP)**: ${stats.totalHppFormatted}\n` +
      `• **Laba Kotor (Gross Profit)**: **${stats.grossProfitFormatted}**\n` +
      `• **Margin Keuntungan**: ~${stats.profitMarginPercent}\n\n` +
      `Data ini dihitung secara real-time dari seluruh pesanan berstatus lunas dikurangi pengeluaran bahan baku resep di database. 📈✨`;

    return {
      success: true,
      intent: 'BUSINESS_PROFIT',
      source: 'mysql',
      data: {
        total_revenue: stats.totalRevenue,
        total_hpp: stats.totalHpp,
        gross_profit: stats.grossProfit,
        gross_profit_formatted: stats.grossProfitFormatted,
        profit_margin: stats.profitMarginPercent,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '💵 Total Pendapatan', prompt: 'Berapa total pendapatan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
        { label: '📊 Total Pesanan', prompt: 'Berapa total pesanan?' },
      ],
    };
  }

  // ==========================================
  // 5. BEST_SELLING_MENU (Menu Terlaris)
  // ==========================================
  if (intent.category === 'BEST_SELLING_MENU') {
    if (stats.topSellingMenus.length === 0) {
      const text = `Belum ada data penjualan pesanan lunas di database untuk menentukan peringkat menu terlaris.`;
      return {
        success: true,
        intent: 'BEST_SELLING_MENU',
        source: 'mysql',
        data: { top_menus: [] },
        answer: text,
        reply: text,
      };
    }

    const rankList = stats.topSellingMenus
      .map(
        (m, idx) =>
          `${idx + 1}. **${m.name}** — Terjual **${m.quantity} item** (Total: Rp ${m.totalAmount.toLocaleString('id-ID')})`
      )
      .join('\n');

    const topMenu = stats.topSellingMenus[0];
    const text =
      `Berdasarkan data transaksi penjualan riil di database, menu paling laris saat ini adalah:\n\n` +
      `${rankList}\n\n` +
      `Produk **${topMenu.name}** menjadi menu terfavorit pelanggan Kopi Mahasiswa dengan kontribusi penjualan terbanyak! 🏆☕`;

    return {
      success: true,
      intent: 'BEST_SELLING_MENU',
      source: 'mysql',
      data: {
        best_seller: topMenu.name,
        rankings: stats.topSellingMenus,
      },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 3),
      quickActions: [
        { label: '💵 Total Pendapatan', prompt: 'Berapa total pendapatan?' },
        { label: '💰 Cek Keuntungan', prompt: 'Berapa keuntungan?' },
        { label: '📊 Total Pesanan', prompt: 'Berapa total pesanan?' },
      ],
    };
  }

  // ==========================================
  // 6. ORDER_STATUS (Pesanan Selesai / Diproses)
  // ==========================================
  if (intent.category === 'ORDER_STATUS') {
    const text = stats.totalOrdersCount === 0
      ? `Belum ada data pesanan yang tercatat. Silakan cek [Pusat Notifikasi & Laporan Sistem](/admin/notifications) atau [Dashboard Overview](/admin). ☕`
      : `Ringkasan status pesanan berdasarkan data sistem:\n\n` +
        `• **Selesai (Completed)**: ${stats.completedOrdersCount} pesanan\n` +
        `• **Sedang Diproses / Diracik (Confirmed & Processing)**: ${stats.processingOrdersCount} pesanan\n` +
        `• **Siap Disajikan (Ready)**: ${stats.readyOrdersCount} pesanan\n` +
        `• **Menunggu Pembayaran (Pending)**: ${stats.pendingOrdersCount} pesanan\n` +
        `• **Dibatalkan (Cancelled)**: ${stats.cancelledOrdersCount} pesanan\n\n` +
        `• **Total Akumulasi Pesanan**: ${stats.totalOrdersCount} pesanan\n\n` +
        `Data dapat ditinjau di [Pusat Notifikasi & Laporan Sistem](/admin/notifications). ☕`;

    return {
      success: true,
      intent: 'ORDER_STATUS',
      source: 'mysql',
      data: {
        completed_orders: stats.completedOrdersCount,
        processing_orders: stats.processingOrdersCount,
        ready_orders: stats.readyOrdersCount,
        pending_orders: stats.pendingOrdersCount,
        cancelled_orders: stats.cancelledOrdersCount,
        total_orders: stats.totalOrdersCount,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '📊 Total Pesanan', prompt: 'Berapa total pesanan?' },
        { label: '💵 Total Pendapatan', prompt: 'Berapa total pendapatan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
      ],
    };
  }

  if (intent.category === 'PAYMENT_STATUS') {
    if (!isOwnerOrAdmin && roleUpper !== 'KASIR') {
      const text = `Maaf, rincian pembayaran hanya dapat diakses oleh Admin, Owner, atau Kasir. Silakan hubungi Admin jika membutuhkan laporan transaksi. ☕`;
      return {
        success: true,
        intent: 'PAYMENT_STATUS',
        source: 'mysql-rbac',
        data: { access: 'restricted' },
        answer: text,
        reply: text,
      };
    }

    const paymentList = stats.recentPaymentsList
      .map((payment, index) =>
        `${index + 1}. **#${payment.orderNumber}** — ${payment.status}, ` +
        `Rp${payment.amount.toLocaleString('id-ID')} via ${payment.paymentMethod}`
      )
      .join('\n');
    const text = stats.totalPaymentsCount === 0
      ? `Belum ada data pembayaran yang tercatat. Silakan cek [Pusat Notifikasi & Laporan Sistem](/admin/notifications) atau [Dashboard Overview](/admin). ☕`
      : `Ringkasan pembayaran berdasarkan data transaksi:\n\n` +
        `• **Total Pembayaran**: ${stats.totalPaymentsCount}\n` +
        `• **Lunas (Paid)**: ${stats.totalPaidTransactions}\n` +
        `• **Menunggu (Pending)**: ${stats.pendingPaymentsCount}\n` +
        `• **Gagal (Failed)**: ${stats.failedPaymentsCount}\n` +
        `• **Dibatalkan (Cancelled)**: ${stats.cancelledPaymentsCount}\n\n` +
        `Detail hingga 10 pembayaran terbaru:\n${paymentList}\n\n` +
        `Lihat [Pusat Notifikasi & Laporan Sistem](/admin/notifications) untuk informasi lebih lanjut. ☕`;

    return {
      success: true,
      intent: 'PAYMENT_STATUS',
      source: 'mysql',
      data: {
        total_payments: stats.totalPaymentsCount,
        paid_payments: stats.totalPaidTransactions,
        pending_payments: stats.pendingPaymentsCount,
        failed_payments: stats.failedPaymentsCount,
        cancelled_payments: stats.cancelledPaymentsCount,
        recent_payments: stats.recentPaymentsList,
      },
      answer: text,
      reply: text,
    };
  }

  // ==========================================
  // 7. INVENTORY_STOCK (Stok Gudang / Menu)
  // ==========================================
  if (intent.category === 'INVENTORY_STOCK') {
    // Jika menanyakan stok menu tertentu (misal: "Berapa stok Americano?")
    if (intent.targetMenuName) {
      const targetEstimate = stats.menuPortionEstimates.find((m) =>
        m.menuName.toLowerCase().includes(intent.targetMenuName!.toLowerCase())
      );

      if (targetEstimate) {
        const text =
          `Stok **${targetEstimate.menuName}** saat ini berstatus **${
            targetEstimate.isAvailable ? 'Tersedia (Ready)' : 'Habis / Perlu Restock'
          }**.\n\n` +
          `Berdasarkan ketersediaan bahan baku di database:\n` +
          `• **Harga Jual**: ${targetEstimate.priceFormatted}\n` +
          `• **Kapasitas Penyajian**: Sanggup menyajikan hingga **~${targetEstimate.maxPortionsCanMake} porsi**\n` +
          `• **Bahan Pembatas**: ${targetEstimate.limitingIngredient || 'Stok Bahan Baku Aman'}\n\n` +
          `Pelanggan dapat langsung memesan menu ini melalui kasir maupun aplikasi web! ☕`;

        return {
          success: true,
          intent: 'INVENTORY_STOCK',
          source: 'mysql',
          data: {
            menu_name: targetEstimate.menuName,
            is_available: targetEstimate.isAvailable,
            max_portions: targetEstimate.maxPortionsCanMake,
            price: targetEstimate.price,
          },
          answer: text,
          reply: text,
          quickActions: [
            { label: '💵 Berapa Harganya?', prompt: `Berapa harga ${targetEstimate.menuName}?` },
            { label: '📦 Cek Semua Stok', prompt: 'Berapa total stok?' },
          ],
        };
      }
    }

    if (isCountOnlyQuestion(userMessage)) {
      const text = `Saat ini terdapat ${stats.totalIngredientsCount} jenis bahan baku di inventori. ☕`;
      return {
        success: true,
        intent: 'INVENTORY_STOCK',
        source: 'mysql',
        data: { total_ingredients: stats.totalIngredientsCount },
        answer: text,
        reply: text,
      };
    }

    // List-only questions should only return the requested ingredient names.
    const stockList = stats.ingredientsStock
      .map((ing, idx) => `${idx + 1}. **${ing.name}**`)
      .join('\n');

    const text =
      `Daftar bahan baku:\n\n${stockList} ☕`;

    return {
      success: true,
      intent: 'INVENTORY_STOCK',
      source: 'mysql',
      data: {
        total_ingredients: stats.totalIngredientsCount,
        ingredients_count: stats.ingredientsStock.length,
        ingredients: stats.ingredientsStock,
        low_stock_count: stats.lowStockIngredients.length,
      },
      answer: text,
      reply: text,
      quickActions: [
        { label: '☕ Stok Americano', prompt: 'Berapa stok Americano?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
        { label: '💵 Total Pendapatan', prompt: 'Berapa total pendapatan?' },
      ],
    };
  }

  // ==========================================
  // 8. MENU_INFORMATION
  // ==========================================
  if (intent.category === 'MENU_INFORMATION') {
    // 8a. Perbedaan Matcha Latte dan Matcha Creamy Latte
    if (
      userMessage.toLowerCase().includes('perbedaan') ||
      userMessage.toLowerCase().includes('beda') ||
      (userMessage.toLowerCase().includes('matcha latte') && userMessage.toLowerCase().includes('creamy'))
    ) {
      const text =
        `Perbedaan antara **Matcha Latte biasa** dan **Matcha Creamy Latte** di Kopi Mahasiswa terletak pada formulasi bahan dan racikannya:\n\n` +
        `1. **Matcha Creamy Latte (Menu Resmi Kopi Mahasiswa — Rp 22.000)**:\n` +
        `   • Menggunakan **100% Bubuk Matcha Premium asal Uji, Kyoto** dengan aroma harum alami khas Jepang.\n` +
        `   • Dipadukan dengan **Susu Fresh Milk UHT** segar berkualitas dan formula creamy rahasia barista, menghasilkan rasa manis legit, lembut (*velvety*), dan sama sekali tidak pahit.\n` +
        `   • Bebas kafein kopi, sangat ramah lambung dan cocok dinikmati saat santai nugas sore/malam.\n\n` +
        `2. **Matcha Latte Standar Umum**:\n` +
        `   • Biasanya menggunakan bubuk matcha lokal dengan susu cair standar tanpa racikan *creamy blend*, sehingga rasa cenderung lebih encer dan kadang menyisakan rasa agak sepat/pahit.\n\n` +
        `Mau coba **Matcha Creamy Latte** kami hari ini, Kak? Rasanya dijamin nagih dan bikin rileks! 🍵✨`;

      return {
        success: true,
        intent: 'MENU_INFORMATION',
        source: 'mysql',
        data: { subject: 'Matcha Creamy Latte vs Matcha Latte' },
        answer: text,
        reply: text,
        recommendedMenus: stats.activeMenusList.filter((m) => m.name.toLowerCase().includes('matcha')),
        quickActions: [
          { label: '💰 Berapa Harganya?', prompt: 'Berapa harga Matcha Creamy Latte?' },
          { label: '🏷️ Cek Promo', prompt: 'Apakah ada promo?' },
        ],
      };
    }

    // 8b. Harga menu spesifik (misal: Americano)
    if (intent.targetMenuName) {
      const matched = stats.activeMenusList.find((m) =>
        m.name.toLowerCase().includes(intent.targetMenuName!.toLowerCase())
      );

      if (matched) {
        const text =
          `Harga untuk **${matched.name}** adalah **${matched.priceFormatted}** per porsi.\n\n` +
          `• **Deskripsi**: ${matched.description}\n` +
          `• **Status**: ${matched.isAvailable ? 'Tersedia & Siap Dipesan ✅' : 'Stok Sedang Habis ✕'}\n` +
          `• **Promo Mahasiswa**: Gunakan kode \`MHS2026\` untuk diskon 20% menjadi **Rp ${(matched.price * 0.8).toLocaleString('id-ID')}**!\n\n` +
          `Kakak bisa langsung memesannya dengan klik tombol **"Beli"** di bawah ini! 😊`;

        return {
          success: true,
          intent: 'MENU_INFORMATION',
          source: 'mysql',
          data: { menu: matched },
          answer: text,
          reply: text,
          recommendedMenus: [matched],
          quickActions: [
            { label: '🏷️ Cek Kode Promo', prompt: 'Apakah ada promo?' },
            { label: '☕ Menu Kopi Lainnya', prompt: 'Apa saja menu kopi?' },
          ],
        };
      }
    }

    if (/\b(daftar|list|rincian|apa saja|siapa saja)\b/.test(normalizeText(userMessage))) {
      const menuList = stats.activeMenusList
        .map(
          (menu, index) =>
            `${index + 1}. **${menu.name}** — ${menu.categoryName}, ${menu.priceFormatted} — ` +
            `${menu.isAvailable ? 'Tersedia' : 'Tidak tersedia'}`
        )
        .join('\n');
      const text = `Berikut daftar menu Kopi Mahasiswa:\n\n${menuList} ☕`;

      return {
        success: true,
        intent: 'MENU_INFORMATION',
        source: 'mysql',
        data: { menus: stats.activeMenusList },
        answer: text,
        reply: text,
        recommendedMenus: stats.activeMenusList.slice(0, 3),
      };
    }

    // 8c. Apa saja menu kopi
    if (userMessage.toLowerCase().includes('kopi')) {
      const coffeeMenus = stats.activeMenusList.filter(
        (m) =>
          m.categoryName.toLowerCase().includes('kopi') ||
          m.name.toLowerCase().includes('kopi') ||
          m.name.toLowerCase().includes('americano')
      );

      const list = coffeeMenus
        .map((m, idx) => `${idx + 1}. **${m.name}** — **${m.priceFormatted}**\n   *${m.description}*`)
        .join('\n\n');

      const text =
        `☕ **Pilihan Menu Kopi Signature Kopi Mahasiswa:**\n\n` +
        `${list}\n\n` +
        `Semua kopi diracik segar dari biji kopi Arabika Houseblend Nusantara pilihan! Kakak bisa langsung klik **"Beli"** pada kartu menu di bawah.`;

      return {
        success: true,
        intent: 'MENU_INFORMATION',
        source: 'mysql',
        data: { coffee_menus: coffeeMenus },
        answer: text,
        reply: text,
        recommendedMenus: coffeeMenus,
        quickActions: [
          { label: '⚡ Kopi Tahan Ngantuk', prompt: 'Berapa harga Americano?' },
          { label: '🏷️ Promo Diskon 20%', prompt: 'Apakah ada promo?' },
        ],
      };
    }

    // 8d. Rekomendasi Minuman
    const text =
      `Berikut rekomendasi minuman terbaik dari Barista Kopi Mahasiswa sesuai kebutuhanmu hari ini: ☕✨\n\n` +
      `1. ⚡ **Untuk Nugas Begadang / Konsentrasi Tinggi**: **Americano Cold Brew** (Rp 15.000)\n` +
      `   Ekstrak Arabika murni dengan es batu segar yang mantap mengusir kantuk tanpa bikin kembung.\n\n` +
      `2. 🤎 **Paling Favorit & Best Seller**: **Es Kopi Susu Gula Aren** (Rp 18.000)\n` +
      `   Espresso double shot dipadu susu segar dingin dan racikan gula aren alami khas Nusantara. Manisnya pas!\n\n` +
      `3. 🍵 **Pilihan Bebas Kafein & Ramah Lambung**: **Matcha Creamy Latte** (Rp 22.000)\n` +
      `   Matcha Uji Kyoto creamy yang manis gurih, sempurna untuk meredakan stres tugas kuliah.\n\n` +
      `4. 🥐 **Camilan Teman Belajar**: **Butter Croissant Warm** (Rp 16.000)\n` +
      `   Pastry renyah wangi mentega Perancis hangat.\n\n` +
      `Kakak lagi ingin suasana rasa yang mana nih? 😊`;

    return {
      success: true,
      intent: 'MENU_INFORMATION',
      source: 'mysql',
      data: { recommendations: stats.activeMenusList.slice(0, 4) },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 3),
      quickActions: [
        { label: '⚡ Beli Americano', prompt: 'Berapa harga Americano?' },
        { label: '🏷️ Promo Diskon', prompt: 'Apakah ada promo?' },
        { label: '🪑 Varian Menu Aktif', prompt: 'Berapa varian menu aktif?' },
      ],
    };
  }

  // ==========================================
  // 9. PROMOTION_INFORMATION
  // ==========================================
  if (intent.category === 'PROMOTION_INFORMATION') {
    const text =
      `🎉 **Promo & Diskon Spesial Mahasiswa 2026 di Kopi Mahasiswa!**\n\n` +
      `• **Kode Voucher**: \`MHS2026\`\n` +
      `• **Besaran Diskon**: **Potongan 20%** untuk seluruh menu minuman kopi!\n` +
      `• **Syarat**: Berlaku untuk civitas akademika & mahasiswa.\n\n` +
      `Contoh perhitungan setelah diskon:\n` +
      `• **Es Kopi Susu Gula Aren**: Dari Rp 18.000 jadi hanya **Rp 14.400**\n` +
      `• **Americano Cold Brew**: Dari Rp 15.000 jadi hanya **Rp 12.000**\n\n` +
      `Gunakan kodenya saat melakukan checkout di keranjang belanja ya Kak! 🏷️✨`;

    return {
      success: true,
      intent: 'PROMOTION_INFORMATION',
      source: 'mysql',
      data: { promo_code: 'MHS2026', discount_percent: 20 },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 2),
      quickActions: [
        { label: '☕ Pesan Kopi Susu Aren', prompt: 'Berapa harga Es Kopi Susu Gula Aren?' },
        { label: '📋 Varian Menu Aktif', prompt: 'Berapa varian menu aktif?' },
      ],
    };
  }

  // ==========================================
  // 10. USER_IDENTITY ("Siapa Saya" - Respons Dinamis Berdasarkan Role)
  // ==========================================
  if (intent.category === 'USER_IDENTITY') {
    const r = (userRole || 'PELANGGAN').toUpperCase();
    let text = '';
    let quickActions: { label: string; prompt: string }[] = [];

    if (r === 'ADMIN') {
      text =
        `Saya adalah admin utama Kopi Mahasiswa, penanggung jawab operasional teknis dan pengelola penuh seluruh sistem Kopi Mahasiswa! ☕🛡️\n\n` +
        `Sebagai pemegang otoritas Admin Utama, saya memiliki kendali dan tanggung jawab penuh atas:\n\n` +
        `1. 📋 **Manajemen Katalog & Resep Menu**:\n` +
        `   Mengelola ketersediaan ${stats.activeMenusCount} varian menu aktif, penetapan harga produk, racikan bahan baku presisi, hingga peluncuran varian menu kopi dan minuman kreasi baru.\n\n` +
        `2. 📦 **Pengawasan Stok & Inventori Real-time**:\n` +
        `   Memantau stok bahan baku secara ketat, mengantisipasi bahan yang menipis, melakukan pengadaan ke supplier terpercaya, dan memastikan barista tidak pernah kehabisan biji kopi berkualitas.\n\n` +
        `3. 🛒 **Kontrol Transaksi & POS Kasir**:\n` +
        `   Mengawasi alur pesanan dari pelanggan, verifikasi pembayaran instan (QRIS & Tunai), memastikan kecepatan penyajian, serta memantau total ${stats.totalOrdersCount} pesanan dengan perputaran omzet mencapai ${stats.totalRevenueFormatted}.\n\n` +
        `4. 🔔 **Sistem Notifikasi Terintegrasi**:\n` +
        `   Menjaga sistem notifikasi otomatis WhatsApp Fonnte, Email, dan dashboard agar seluruh pesanan masuk, progres racikan, dan pembaruan stok terlaporkan secara real-time ke admin dan pelanggan.\n\n` +
        `5. 🤖 **Konfigurasi Kecerdasan Buatan (AI Assistant)**:\n` +
        `   Mengatur integrasi model AI (Gemini dan Grok) agar selalu siap menjawab pertanyaan analitik dan memberikan rekomendasi terbaik.\n\n` +
        `6. 👥 **Manajemen Pengguna & Kontrol Akses (User Management)**:\n` +
        `   Mengelola seluruh akun ${stats.totalUsersCount} pengguna sistem (Admin, Owner, Kasir, Pelanggan, Supplier), mengatur peran & hak akses, serta mereset kredensial keamanan akun staf.\n\n` +
        `Ada pengelolaan katalog, pembaruan stok, akun pengguna, atau konfigurasi sistem yang ingin kita tinjau hari ini? Saya siap mengeksekusi instruksi Anda! 🚀☕`;

      quickActions = [
        { label: '📊 Cek Laporan Bisnis', prompt: 'Berapa total pendapatan dan pesanan?' },
        { label: '📦 Cek Stok Inventori', prompt: 'Bagaimana status stok bahan baku?' },
        { label: '📋 Varian Menu Aktif', prompt: 'Berapa varian menu aktif?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa yang paling laris?' },
      ];
    } else if (r === 'OWNER') {
      text =
        `Saya MOCHAMMAD FARIZAL KHAM adalah owner Kopi Mahasiswa, pemilik bisnis dan pengambil keputusan strategis tertinggi di Kopi Mahasiswa! 👑📊\n\n` +
        `Sebagai Owner Kopi Mahasiswa, peran dan wewenang strategis saya mencakup:\n` +
        `1. 💵 Monitoring Performa Finansial & Omzet Bisnis.\n` +
        `2. Analisis Margin Keuntungan & Efisiensi Biaya (HPP). ☕`;

      quickActions = [
        { label: '💵 Total Pendapatan & Laba', prompt: 'Berapa total pendapatan dan keuntungan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
        { label: '📊 Total Transaksi Pesanan', prompt: 'Berapa total pesanan?' },
        { label: '📦 Status Stok Bahan', prompt: 'Bagaimana status stok bahan baku?' },
      ];
    } else if (r === 'KASIR') {
      text =
        `Saya adalah kasir Kopi Mahasiswa, garda terdepan pelayanan transaksi dan operasional kasir (Point of Sale) Kopi Mahasiswa! ☕💳\n\n` +
        `Sebagai Kasir di Kopi Mahasiswa, tanggung jawab dan tugas utama saya meliputi:\n\n` +
        `1. 🛒 **Penerimaan & Input Pesanan Pelanggan (POS)**:\n` +
        `   Melayani pemesanan langsung dari pengunjung kedai maupun pesanan online, memastikan setiap pilihan menu, varian es/panas, dan catatan khusus tercatat dengan presisi.\n\n` +
        `2. 💳 **Verifikasi Pembayaran Cepat & Aman**:\n` +
        `   Memproses pembayaran QRIS instan, transfer bank, maupun uang tunai (Cash) dengan perhitungan kembalian yang akurat dan otomatis memperbarui status transaksi menjadi LUNAS.\n\n` +
        `3. ☕ **Manajemen Alur Status Pesanan & Koordinasi Barista**:\n` +
        `   Mengawal siklus pesanan mulai dari Dikonfirmasi (\`CONFIRMED\`), Diteruskan ke Barista (\`PROCESSING\`), Siap Diambil (\`READY\`), hingga diserahkan ke pelanggan (\`COMPLETED\`).\n\n` +
        `4. 📋 **Pengecekan Ketersediaan Menu & Stok Kasir**:\n` +
        `   Memastikan menu yang dipesan pelanggan berstatus tersedia di katalog dan memberikan rekomendasi kopi terbaik bagi pelanggan yang bingung memilih.\n\n` +
        `5. 😊 **Pelayanan Ramah & Pengalaman Pelanggan Terbaik**:\n` +
        `   Menyambut setiap mahasiswa dan pelanggan dengan senyuman hangat, memastikan waktu tunggu racikan efisien, dan memberikan pengalaman nongkrong yang menyenangkan.\n\n` +
        `Ada pesanan yang perlu diverifikasi atau status antrean yang ingin diperiksa, Kak Barista/Kasir? Siap melayani! 🛎️☕`;

      quickActions = [
        { label: '⏳ Pesanan Diproses', prompt: 'Berapa pesanan yang sedang diproses?' },
        { label: '📊 Total Pesanan Masuk', prompt: 'Berapa total pesanan?' },
        { label: '📋 Cek Menu Tersedia', prompt: 'Berapa varian menu aktif?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
      ];
    } else if (r === 'SUPPLIER') {
      text =
        `Saya adalah supplier mitra Kopi Mahasiswa, penyedia rantai pasok bahan baku berkualitas bagi kedai Kopi Mahasiswa! 🚚📦\n\n` +
        `Sebagai Supplier Mitra Kopi Mahasiswa, peran penting saya dalam ekosistem kedai adalah:\n\n` +
        `1. 🌾 **Penyediaan Bahan Baku Kualitas Premium**:\n` +
        `   Memasok biji kopi pilihan (Arabika Gayo & Robusta berkualitas), susu segar pasteurisasi, gula aren murni, sirup perisa, hingga kemasan ramah lingkungan untuk kedai.\n\n` +
        `2. 📝 **Pemrosesan Pengadaan Bahan (Purchase Orders / PO)**:\n` +
        `   Menerima dan memverifikasi pesanan pengadaan dari tim admin, memastikan ketersediaan kuantitas bahan yang diminta, dan menyiapkan invoice pengiriman.\n\n` +
        `3. 🚚 **Ketepatan Jadwal Pengiriman & Logistik**:\n` +
        `   Menjaga ketepatan waktu distribusi bahan ke outlet Kopi Mahasiswa agar proses operasional barista tidak pernah terhenti karena kekurangan bahan.\n\n` +
        `4. 📦 **Jaminan Mutu & Standar Keamanan Pangan**:\n` +
        `   Memastikan seluruh bahan baku yang dikirim memenuhi standar kesegaran, kebersihan, dan tanggal kedaluwarsa yang aman.\n\n` +
        `5. 🤝 **Kemitraan Jangka Panjang yang Terpercaya**:\n` +
        `   Mendukung kelancaran rantai pasok kopi mahasiswa dengan transparansi harga dan pasokan yang konsisten sepanjang musim.\n\n` +
        `Ada pemesanan pengadaan bahan baku atau konfirmasi pengiriman yang ingin dicek hari ini? Mari kita koordinasikan! 📦☕`;

      quickActions = [
        { label: '📦 Status Stok Bahan', prompt: 'Bagaimana status stok bahan baku?' },
        { label: '📋 Varian Menu Aktif', prompt: 'Berapa varian menu aktif?' },
        { label: '📊 Total Pesanan Kedai', prompt: 'Berapa total pesanan?' },
      ];
    } else {
      // Default PELANGGAN
      text =
        `Saya adalah pelanggan setia Kopi Mahasiswa, penikmat kopi berkualitas dan bagian dari komunitas Kopi Mahasiswa! ☕✨\n\n` +
        `Sebagai Pelanggan Kopi Mahasiswa, saya menikmati berbagai layanan dan fasilitas istimewa di sini:\n\n` +
        `1. ☕ **Menikmati Ragam Racikan Kopi Signature & Pastry**:\n` +
        `   Menikmati ${stats.activeMenusCount} varian menu lezat—mulai dari Es Kopi Susu Gula Aren yang manis creamy, Americano Cold Brew segar berenergi, hingga Butter Croissant hangat yang renyah.\n\n` +
        `2. 🏷️ **Akses Promo & Diskon Spesial Mahasiswa**:\n` +
        `   Mendapatkan potongan harga khusus mahasiswa menggunakan kode voucher \`MHS2026\` untuk diskon 20% all-coffee agar tetap hemat saat nugas.\n\n` +
        `3. 📱 **Kemudahan Pemesanan Digital & Pelacakan Pesanan**:\n` +
        `   Memilih menu favorit, pesan online lewat website, bayar mudah dengan QRIS, serta memantau status pembuatan pesanan secara real-time dari meja.\n\n` +
        `4. 🪑 **Fasilitas Nongkrong & Tempat Nugas Ternyaman**:\n` +
        `   Memanfaatkan akses WiFi berkecepatan 100 Mbps, colokan listrik di setiap meja, ruangan full AC, serta lantai Mezzanine yang tenang untuk fokus belajar.\n\n` +
        `5. 🌟 **Koleksi Poin & Pengalaman Komunitas**:\n` +
        `   Mengumpulkan poin loyalitas dari setiap transaksi dan menjadi bagian dari budaya ngopi produktif mahasiswa Indonesia.\n\n` +
        `Ada menu kopi yang ingin dipesan atau info promo yang ingin diketahui hari ini, Kak? Yuk nikmati secangkir kopi terbaik! 😊☕`;

      quickActions = [
        { label: '☕ Rekomendasi Minuman', prompt: 'Apa rekomendasi minuman?' },
        { label: '🏷️ Promo MHS2026', prompt: 'Apakah ada promo?' },
        { label: '📋 Varian Menu Aktif', prompt: 'Berapa varian menu aktif?' },
        { label: '💵 Harga Americano', prompt: 'Berapa harga Americano?' },
      ];
    }

    return {
      success: true,
      intent: 'USER_IDENTITY',
      source: 'identity_engine',
      data: { role: r },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 3),
      quickActions,
    };
  }

  // ==========================================
  // 11. GENERAL_CONVERSATION (Sapaan Ramah)
  // ==========================================
  if (intent.category === 'GENERAL_CONVERSATION') {
    const text =
      `Halo Kak! Selamat datang di **Kopi Mahasiswa**! ☕✨\n\n` +
      `Saya **Barista & Assistant AI** resmi yang terhubung langsung dengan sistem database kedai kami.\n\n` +
      `Ada yang bisa saya bantu hari ini?\n` +
      `• 📊 **Laporan Bisnis**: Total pesanan, varian menu aktif, pendapatan, keuntungan, atau stok barang.\n` +
      `• ☕ **Katalog & Rekomendasi**: Cek harga menu, rekomendasi kopi tahan ngantuk, dan promo \`MHS2026\`.\n` +
      `• 🪑 **Fasilitas Kedai**: Info WiFi 100 Mbps, colokan listrik tiap meja, dan area nugas Mezzanine.\n\n` +
      `Silakan ketik pertanyaan atau klik salah satu menu pintasan di bawah! 😊`;

    return {
      success: true,
      intent: 'GENERAL_CONVERSATION',
      source: 'assistant',
      data: { greeting: true },
      answer: text,
      reply: text,
      recommendedMenus: stats.activeMenusList.slice(0, 2),
      quickActions:
        isOwnerOrAdmin
          ? [
              { label: '📊 Total Pesanan', prompt: 'Berapa total pesanan?' },
              { label: '📋 Varian Menu Aktif', prompt: 'Berapa varian menu aktif?' },
              { label: '💵 Total Pendapatan', prompt: 'Berapa total pendapatan?' },
              { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
            ]
          : [
              { label: '☕ Rekomendasi Minuman', prompt: 'Apa rekomendasi minuman?' },
              { label: '🏷️ Promo MHS2026', prompt: 'Apakah ada promo?' },
              { label: '📋 Varian Menu Aktif', prompt: 'Berapa varian menu aktif?' },
              { label: '⚡ Harga Americano', prompt: 'Berapa harga Americano?' },
            ],
    };
  }

  // ==========================================
  // 11. UNKNOWN_INTENT (Permintaan Klarifikasi Cerdas)
  // ==========================================
  const clarificationText = isOwnerOrAdmin
    ? `Maaf, data yang dibutuhkan belum dapat saya pastikan dari konteks saat ini. Silakan cek langsung di [Katalog & Resep Menu](/admin/menu) atau [Dashboard Overview](/admin). ☕`
    : `Mohon maaf Kak, saya belum memahami secara spesifik maksud dari pertanyaan:\n` +
      `*"${userMessage}"*\n\n` +
      `Agar saya dapat mengambilkan data yang tepat dari database kedai, apakah yang Kakak maksud berkaitan dengan:\n` +
      `1. 📊 **Laporan Bisnis & Penjualan** (*Contoh: "Berapa total pesanan?", "Berapa total pendapatan?", "Berapa keuntungan?"*)\n` +
      `2. 📋 **Katalog Menu & Produk** (*Contoh: "Berapa varian menu aktif?", "Berapa harga Americano?", "Menu apa paling laris?"*)\n` +
      `3. 📦 **Inventori & Bahan** (*Contoh: "Berapa total stok?", "Berapa stok Americano?"*)\n` +
      `4. 🏷️ **Promo & Diskon** (*Contoh: "Apakah ada promo hari ini?"*)\n\n` +
      `Silakan ajukan pertanyaan yang lebih spesifik, saya siap membantu! 😊`;

  return {
    success: true,
    intent: 'UNKNOWN_INTENT',
    source: 'clarification',
    data: { raw_query: userMessage },
    answer: clarificationText,
    reply: clarificationText,
    quickActions: [
      { label: '📊 Berapa Total Pesanan?', prompt: 'Berapa total pesanan?' },
      { label: '📋 Berapa Varian Menu Aktif?', prompt: 'Berapa varian menu aktif?' },
      { label: '💵 Berapa Total Pendapatan?', prompt: 'Berapa total pendapatan?' },
      { label: '🏆 Menu Apa Paling Laris?', prompt: 'Menu apa paling laris?' },
    ],
  };
}
