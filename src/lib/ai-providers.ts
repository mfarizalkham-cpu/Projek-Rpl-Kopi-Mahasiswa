import prisma from '@/lib/prisma';
import { getDbMenus, getStoreInfo, getDbPromos } from '@/lib/db-store';
import { getRealtimeBusinessStats, RealtimeBusinessStats } from './ai-analytics';
import { detectUserIntent, generateSmartDatabaseAnswer } from './ai-intent';
import { getAIProviderApiKey } from './ai-credentials';

export type AIModelType = 'gemini' | 'grok';

export async function getActiveAIModel(): Promise<AIModelType> {
  try {
    const setting =
      (await prisma.setting.findUnique({ where: { key: 'AI_ACTIVE_MODEL' } })) ||
      (await prisma.setting.findUnique({ where: { key: 'active_ai_model' } }));
    if (setting?.value === 'gemini' || setting?.value === 'grok') {
      return setting.value;
    }
  } catch (err) {
    console.warn('Could not read active_ai_model from DB, defaulting to gemini:', err);
  }
  return 'gemini';
}

/**
 * Membangun System Prompt yang lengkap dengan konteks data database real-time
 */
export function buildSystemPrompt(
  menus: any[],
  storeInfo: any,
  promos: any[],
  businessStats: RealtimeBusinessStats,
  userRole: string = 'PELANGGAN'
): string {
  const activeMenusSummary = businessStats.activeMenusList
    .map((m) => `- ${m.name} (${m.priceFormatted}, Kategori: ${m.categoryName}): ${m.description}`)
    .join('\n');

  const topMenusText =
    businessStats.topSellingMenus.length > 0
      ? businessStats.topSellingMenus
          .map(
            (m, idx) =>
              `${idx + 1}. ${m.name}: terjual ${m.quantity} item (Total: Rp ${m.totalAmount.toLocaleString('id-ID')})`
          )
          .join('\n')
      : 'Belum ada data penjualan pesanan lunas.';

  const stockSummary = businessStats.ingredientsStock
    .map(
      (ing) =>
        `- ${ing.name}: ${ing.stock.toLocaleString('id-ID')} ${ing.unit} (Min: ${ing.minStock} ${ing.unit})${
          ing.isLowStock ? ' [HAMPIR HABIS]' : ' [AMAN]'
        }`
    )
    .join('\n');

  return `Kamu adalah "Barista & Assistant AI" resmi dari website KOPI MAHASISWA (F&B E-Commerce & POS).
Tugasmu adalah membantu Owner, Admin, Kasir, Pelanggan, dan Supplier sesuai hak akses masing-masing.

STATUS PENGGUNA SAAT INI:
- Role Akun: "${userRole.toUpperCase()}"
- Hak Akses: ${
    userRole === 'OWNER' || userRole === 'ADMIN'
      ? 'Akses penuh ke seluruh laporan finansial bisnis, pendapatan, keuntungan, transaksi, dan stok inventori.'
      : userRole === 'KASIR'
      ? 'Akses operasional pesanan kasir, ketersediaan menu, dan transaksi kasir.'
      : 'Akses terbatas pelanggan (menu, rekomendasi minuman, promo diskon, fasilitas, dan status pesanan milik sendiri).'
  }

DATA RESMI DATABASE MYSQL REAL-TIME (SUMBER KEBENARAN TUNGGAL):
1. DATA PESANAN & TRANSAKSI:
   • Total Seluruh Pesanan: ${businessStats.totalOrdersCount} pesanan
   • Total Transaksi Lunas: ${businessStats.totalPaidTransactions} transaksi
   • Pesanan Selesai (Completed): ${businessStats.completedOrdersCount} pesanan
   • Pesanan Sedang Diproses (Processing): ${businessStats.processingOrdersCount} pesanan
   • Pesanan Menunggu Pembayaran (Pending): ${businessStats.pendingOrdersCount} pesanan
   • Pesanan Hari Ini: ${businessStats.todayOrdersCount} pesanan (${businessStats.todayPaidTransactions} lunas)

2. DATA FINANSIAL & LAPORAN BISNIS:
   • Total Pendapatan Lunas: ${businessStats.totalRevenueFormatted}
   • Pendapatan Hari Ini: ${businessStats.todayRevenueFormatted}
   • Estimasi Biaya Bahan (HPP): ${businessStats.totalHppFormatted}
   • Total Keuntungan Kotor: ${businessStats.grossProfitFormatted} (Margin: ${businessStats.profitMarginPercent})

3. DATA DASBOR TERPADU & KATALOG (SESUAI KARTU DASBOR):
   • TOTAL MENU: ${businessStats.totalMenusCount} item (semua aktif dan siap dipesan)
   • KATEGORI MENU: ${businessStats.totalCategoriesCount} kategori (${businessStats.categoriesList.map(c => c.name).join(', ')})
   • BAHAN BAKU: ${businessStats.totalIngredientsCount} bahan di inventori
   • Daftar Menu Aktif:
${activeMenusSummary}

4. DATA MENU TERLARIS (BEST SELLER):
${topMenusText}

5. DATA STOK BAHAN BAKU:
${stockSummary}

6. DATA MANAJEMEN PENGGUNA SISTEM:
   • Total Pengguna Terdaftar: ${businessStats.totalUsersCount} user
   • Admin Utama: ${businessStats.adminUsersCount} orang
   • Owner: ${businessStats.ownerUsersCount} orang
   • Kasir: ${businessStats.kasirUsersCount} orang
   • Pelanggan: ${businessStats.pelangganUsersCount} orang
   • Supplier Mitra: ${businessStats.supplierUsersCount} orang

7. FASILITAS KEDAI & TOKO:
   • Alamat: ${storeInfo.address}
   • Jam Operasional: ${storeInfo.openingHours}
   • Fasilitas: WiFi 100 Mbps, colokan listrik tiap meja, ruangan full AC, Mezzanine Quiet Zone Lt. 2.
   • Promo Aktif: Kode voucher \`MHS2026\` (Diskon 20% all coffee).

ATURAN PERILAKU DAN RESPON AI (SANGAT KETAT):
1. Jawablah pertanyaan pengguna sesuai maksud dan konteks pertanyaannya.
2. Jika pengguna bertanya tentang laporan bisnis (pendapatan, laba, total pesanan, menu aktif, stok), gunakan angka aktual di atas.
3. JANGAN mengarang angka, harga, stok, pendapatan, transaksi, maupun keuntungan.
4. JANGAN memberikan rekomendasi menu ketika pengguna sedang meminta laporan bisnis.
5. Jika pengguna dengan role PELANGGAN bertanya tentang laporan keuangan rahasia kedai (seperti total pendapatan atau keuntungan), tolak secara sopan bahwa data finansial bersifat rahasia Owner/Admin.
6. Format angka nominal uang WAJIB dalam format Rupiah (contoh: ${businessStats.totalRevenueFormatted}).
7. Gunakan bahasa Indonesia yang ramah, profesional, dan mudah dimengerti.
8. Jika pengguna bertanya jumlah atau total dengan kata seperti "berapa", "total", atau "jumlah", jawab singkat dengan angka total yang diminta saja. Jangan sertakan daftar item, nama, ID, atau rincian tambahan kecuali pengguna juga meminta rincian.
9. Jika pengguna meminta "daftar", "list", "rincian", "apa saja", atau "siapa saja", tampilkan rincian relevan secara terstruktur, termasuk kategori, harga, dan ketersediaan menu jika tersedia.
10. Untuk pertanyaan tentang satu item tertentu (misalnya harga menu), jawab langsung detail item itu saja menggunakan data resmi.
11. ATURAN KHUSUS IDENTITAS PENGGUNA BERDASARKAN ROLE:
Jika pengguna bertanya "siapa saya", "siapa aku", "saya siapa", "aku siapa", atau menanyakan identitas dirinya, kamu WAJIB mendeteksi role aktif pengguna (${userRole.toUpperCase()}) dan memberikan jawaban pembuka yang sesuai:
- Jika role ADMIN: Buka dengan "Saya adalah admin utama Kopi Mahasiswa" dan jelaskan secara panjang, lengkap, dan berwibawa tentang hak akses penuh operasional, manajemen katalog, resep, inventori stok, POS kasir, manajemen pengguna, dan konfigurasi sistem.
- Jika role OWNER: Buka dengan "Saya adalah owner Kopi Mahasiswa" dan jelaskan secara panjang, lengkap, dan berwibawa tentang otoritas tertinggi bisnis, pemantauan omzet finansial (${businessStats.totalRevenueFormatted}), laba kotor (${businessStats.grossProfitFormatted}), margin keuntungan (${businessStats.profitMarginPercent}), strategi ekspansi, dan keputusan bisnis.
- Jika role KASIR: Buka dengan "Saya adalah kasir Kopi Mahasiswa" dan jelaskan secara panjang, lengkap, dan berwibawa tentang operasional POS kasir, verifikasi pembayaran QRIS/Tunai, manajemen alur status pesanan, dan koordinasi dengan barista.
- Jika role PELANGGAN: Buka dengan "Saya adalah pelanggan setia Kopi Mahasiswa" dan jelaskan secara panjang, lengkap, dan berwibawa tentang pengalaman menikmati menu kopi favorit, promo MHS2026, kemudahan pemesanan, dan fasilitas kedai.
- Jika role SUPPLIER: Buka dengan "Saya adalah supplier mitra Kopi Mahasiswa" dan jelaskan secara panjang, lengkap, dan berwibawa tentang rantai pasokan bahan baku, pemrosesan Purchase Orders, dan ketepatan stok bahan.
12. ATURAN DATA DASBOR TERPADU (TOTAL MENU, KATEGORI MENU, BAHAN BAKU):
Jika pengguna bertanya tentang total menu, kategori menu, atau bahan baku, gunakan angka data dasbor resmi berikut. Untuk pertanyaan jumlah, berikan angka saja; rincian hanya jika diminta:
- Total Menu: ${businessStats.totalMenusCount} item
- Kategori Menu: ${businessStats.totalCategoriesCount} kategori
- Bahan Baku: ${businessStats.totalIngredientsCount} bahan.
13. ATURAN DATA MANAJEMEN PENGGUNA SISTEM:
Untuk pertanyaan jumlah pengguna, jawab hanya total yang ditanyakan dari data resmi: ${businessStats.totalUsersCount} user (${businessStats.adminUsersCount} Admin, ${businessStats.ownerUsersCount} Owner, ${businessStats.kasirUsersCount} Kasir, ${businessStats.pelangganUsersCount} Pelanggan, ${businessStats.supplierUsersCount} Supplier). Jangan tampilkan semua rincian role kecuali diminta.`;
}

/**
 * Panggil API Google Gemini
 */
export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: { sender: string; text: string }[] = []
): Promise<string> {
  const apiKey = await getAIProviderApiKey('GEMINI_API_KEY', [
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'AI_API_KEY',
  ]);

  if (!apiKey || !apiKey.trim()) {
    throw new Error('API Key Google Gemini belum dikonfigurasi');
  }

  const modelId = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const conversationText = history
    .slice(-4)
    .map((h) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
    .join('\n');

  const fullPrompt = `${systemPrompt}\n\nRiwayat Percakapan Sebelumnya:\n${conversationText}\n\nPertanyaan Pengguna Sekarang: "${userMessage}"\n\nJawablah sebagai Barista & Assistant AI Kopi Mahasiswa:`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!answer) {
    throw new Error('Gemini API mengembalikan respon kosong');
  }

  return answer.trim();
}

/**
 * Panggil xAI Responses API
 */
export async function callGrok(
  systemPrompt: string,
  userMessage: string,
  history: { sender: string; text: string }[] = []
): Promise<string> {
  const apiKey = await getAIProviderApiKey('XAI_API_KEY', ['XAI_API_KEY', 'GROK_API_KEY']);
  if (!apiKey) throw new Error('API Key xAI Grok belum dikonfigurasi');

  const input = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4).map((message) => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text,
    })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROK_MODEL || 'grok-4.7',
      input,
      temperature: 0.3,
      max_output_tokens: 800,
      store: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`xAI Grok API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const answer = data?.output
    ?.flatMap((item: { content?: { type?: string; text?: string }[] }) => item.content || [])
    .find((part: { type?: string }) => part.type === 'output_text')?.text;
  if (!answer) throw new Error('xAI Grok API mengembalikan respon kosong');
  return answer.trim();
}

/**
 * Proses pesan pengguna dengan model AI yang sedang aktif
 */
export async function processChatWithActiveModel(
  userMessage: string,
  history: { sender: 'bot' | 'user'; text: string }[] = [],
  userRole: string = 'PELANGGAN',
  businessStats?: RealtimeBusinessStats
): Promise<{ reply: string; activeModel: AIModelType; source: 'gemini' | 'grok' | 'fallback' }> {
  const activeModel = await getActiveAIModel();
  const menus = await getDbMenus();
  const storeInfo = getStoreInfo();
  const promos = await getDbPromos();
  const stats = businessStats || (await getRealtimeBusinessStats());
  const systemPrompt = buildSystemPrompt(menus, storeInfo, promos, stats, userRole);

  try {
    let reply = '';
    let source: 'gemini' | 'grok' = 'gemini';

    switch (activeModel) {
      case 'grok':
        reply = await callGrok(systemPrompt, userMessage, history);
        source = 'grok';
        break;
      case 'gemini':
      default:
        reply = await callGemini(systemPrompt, userMessage, history);
        source = 'gemini';
        break;
    }

    return {
      reply,
      activeModel,
      source,
    };
  } catch (error: any) {
    console.warn(`[AI-Service] Panggilan model ${activeModel} gagal (${error?.message}). Menggunakan Smart MySQL Database Engine.`);
    const intent = detectUserIntent(userMessage);
    const dbAnswer = generateSmartDatabaseAnswer(intent, stats, userRole, userMessage);
    return {
      reply: dbAnswer.answer || dbAnswer.reply,
      activeModel,
      source: 'fallback',
    };
  }
}
