/**
 * AI Service Shared Module — Kopi Mahasiswa
 * Ekuivalen dengan includes/ai_service.php pada arsitektur sistem
 * Menyediakan logika bersama komunikasi AI, penegakan RBAC, dan isolasi data per role.
 */

import { SessionUser } from '@/lib/auth';
import { getRealtimeBusinessStats, RealtimeBusinessStats, UserQueryContext } from '@/lib/ai-analytics';
import { detectUserIntent, generateSmartDatabaseAnswer, RecognizedIntent } from '@/lib/ai-intent';
import { getActiveAIModel, processChatWithActiveModel } from '@/lib/ai-providers';
import { getDbCategories, getDbIngredients, getDbMenus, getDbOrders } from '@/lib/db-store';

export interface AIChatRequestPayload {
  message: string;
  role?: string;
  history?: { sender: 'bot' | 'user'; text: string }[];
  cart?: any[];
  user?: SessionUser | null;
}

export interface AIChatResponsePayload {
  success: boolean;
  intent: string;
  source: string;
  role: string;
  data: any;
  answer: string;
  reply: string;
  active_model?: string;
  recommendedMenus?: any[];
  quickActions?: { label: string; prompt: string }[];
  error?: string;
}

/**
 * Validasi Hak Akses Role (RBAC) & Permission Check
 */
export function checkAIPermission(role: string, targetAssistant: 'ADMIN' | 'CUSTOMER' | 'KASIR' | 'SUPPLIER' | 'OWNER'): boolean {
  const r = (role || 'PELANGGAN').toUpperCase();
  switch (targetAssistant) {
    case 'ADMIN':
      return r === 'ADMIN';
    case 'OWNER':
      return r === 'OWNER';
    case 'KASIR':
      return r === 'KASIR' || r === 'ADMIN' || r === 'OWNER';
    case 'SUPPLIER':
      return r === 'SUPPLIER' || r === 'ADMIN' || r === 'OWNER';
    case 'CUSTOMER':
      return true; // Semua pengguna atau pelanggan dapat mengakses customer belanja AI
    default:
      return true;
  }
}

/**
 * Core Dispatcher AI Request per Role
 */
export async function executeRoleAIRequest(
  targetRole: 'ADMIN' | 'CUSTOMER' | 'KASIR' | 'SUPPLIER' | 'OWNER',
  message: string,
  history: { sender: 'bot' | 'user'; text: string }[] = [],
  user?: SessionUser | null,
  cart?: any[],
  pathname?: string
): Promise<AIChatResponsePayload> {
  const rawRole = (user?.role || targetRole || 'PELANGGAN').toUpperCase();

  // 1. Permission Check
  if (!checkAIPermission(rawRole, targetRole)) {
    return {
      success: false,
      intent: 'PERMISSION_DENIED',
      source: 'rbac',
      role: rawRole,
      data: { allowed: false, requiredRole: targetRole },
      answer: `🔒 **Akses Ditolak**: Anda tidak memiliki hak akses (*permission*) untuk menggunakan ${targetRole} AI Assistant.`,
      reply: `🔒 **Akses Ditolak**: Anda tidak memiliki hak akses (*permission*) untuk menggunakan ${targetRole} AI Assistant.`,
    };
  }

  // 2. Fetch Isolated Context from Database
  const queryContext: UserQueryContext = {
    userId: user?.id,
    role: targetRole,
    customerId: user?.customerId,
    supplierId: user?.supplierId,
    cart: cart || [],
  };

  const [businessStats, activeModel, dashboardMenus, dashboardCategories, dashboardIngredients] = await Promise.all([
    getRealtimeBusinessStats(queryContext),
    getActiveAIModel(),
    getDbMenus(),
    getDbCategories(),
    getDbIngredients(),
  ]);

  businessStats.totalMenusCount = dashboardMenus.length;
  businessStats.activeMenusCount = dashboardMenus.filter((menu) => menu.isAvailable).length;
  businessStats.totalCategoriesCount = dashboardCategories.length;
  businessStats.totalIngredientsCount = dashboardIngredients.length;
  businessStats.ingredientsStock = [...dashboardIngredients]
    .sort((left, right) => left.name.localeCompare(right.name, 'id', { sensitivity: 'base' }))
    .map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    stock: ingredient.stock,
    unit: ingredient.unit,
    minStock: ingredient.minStock,
    isLowStock: ingredient.stock <= ingredient.minStock,
    }));
  businessStats.lowStockIngredients = businessStats.ingredientsStock
    .filter((ingredient) => ingredient.isLowStock)
    .map(({ name, stock, unit, minStock }) => ({ name, stock, unit, minStock }));

  if (targetRole === 'OWNER') {
    const ownerDashboardOrders = await getDbOrders();
    const revenueOrders = ownerDashboardOrders.filter(
      (order) => order.payment?.status === 'PAID' || order.status === 'COMPLETED'
    );
    const ownerDashboardRevenue = revenueOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    businessStats.totalOrdersCount = ownerDashboardOrders.length;
    businessStats.totalRevenue = ownerDashboardRevenue;
    businessStats.totalRevenueFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(ownerDashboardRevenue);
  }

  // 3. Detect Intent (dengan mempertimbangkan posisi halaman saat ini)
  const intent: RecognizedIntent = detectUserIntent(message, pathname);

  // 4. Prioritize Database Answers for deterministic, high-accuracy queries
  const prioritizedIntents = [
    'USER_IDENTITY',
    'DASHBOARD_SUMMARY',
    'CATEGORY_INFORMATION',
    'ACTIVE_MENU_COUNT',
    'USER_MANAGEMENT_INFO',
    'ORDER_COUNT',
    'ORDER_STATUS',
    'PAYMENT_STATUS',
    'INVENTORY_STOCK',
    'ADMIN_ORDER_VS_PO',
    'ADMIN_CUSTOMER_INFO',
    'ADMIN_STORE_OPERATION',
    'CUSTOMER_MY_ORDER_STATUS',
    'CUSTOMER_MY_CART',
    'CUSTOMER_MY_ORDER_HISTORY',
    'KASIR_SALES_SUMMARY',
    'KASIR_OPERATIONAL_INFO',
    'SUPPLIER_PO_COUNT',
    'SUPPLIER_LATEST_PO',
    'SUPPLIER_PROCUREMENT_SUMMARY',
    'SUPPLIER_PO_DETAILS',
    'OWNER_OMZET',
    'OWNER_CRITICAL_STOCK',
    'OWNER_PO_CONDITIONS',
    'OWNER_BUSINESS_SUMMARY',
  ];

  if (prioritizedIntents.includes(intent.category)) {
    const dbAnswer = generateSmartDatabaseAnswer(intent, businessStats, targetRole, message);
    return {
      success: true,
      intent: intent.category,
      source: 'database-smart-engine',
      role: targetRole,
      active_model: activeModel,
      data: {
        ...dbAnswer.data,
        role: targetRole,
      },
      answer: dbAnswer.answer,
      reply: dbAnswer.reply,
      recommendedMenus: dbAnswer.recommendedMenus,
      quickActions: dbAnswer.quickActions,
    };
  }

  try {
    const aiResult = await processChatWithActiveModel(message, history, targetRole, businessStats);
    let aiText = aiResult.reply;

    if (!aiText || !aiText.trim() || aiResult.source === 'fallback') {
      const fallbackAnswer = generateSmartDatabaseAnswer(intent, businessStats, targetRole, message);
      return {
        success: true,
        intent: intent.category,
        source: 'smart-mysql-engine',
        role: targetRole,
        active_model: aiResult.activeModel,
        data: fallbackAnswer.data,
        answer: fallbackAnswer.answer,
        reply: fallbackAnswer.reply,
        recommendedMenus: fallbackAnswer.recommendedMenus,
        quickActions: fallbackAnswer.quickActions,
      };
    }

    return {
      success: true,
      intent: intent.category,
      source: `ai-model-${aiResult.activeModel}`,
      role: targetRole,
      active_model: aiResult.activeModel,
      data: { model: aiResult.activeModel },
      answer: aiText,
      reply: aiText,
      recommendedMenus: businessStats.activeMenusList.slice(0, 3),
      quickActions: generateDefaultQuickActions(targetRole),
    };
  } catch (err: any) {
    // Graceful fallback to smart MySQL database answer
    const fallbackAnswer = generateSmartDatabaseAnswer(intent, businessStats, targetRole, message);
    return {
      success: true,
      intent: intent.category,
      source: 'mysql-fallback',
      role: targetRole,
      active_model: activeModel,
      data: fallbackAnswer.data,
      answer: fallbackAnswer.answer,
      reply: fallbackAnswer.reply,
      recommendedMenus: fallbackAnswer.recommendedMenus,
      quickActions: fallbackAnswer.quickActions,
    };
  }
}

/**
 * Default Quick Action suggestions per role
 */
export function generateDefaultQuickActions(role: string): { label: string; prompt: string }[] {
  const r = (role || 'PELANGGAN').toUpperCase();
  switch (r) {
    case 'ADMIN':
      return [
        { label: '⚖️ Beda Order vs PO', prompt: 'Apa perbedaan pesanan Customer dan Purchase Order?' },
        { label: '👥 Pelanggan Pemesan', prompt: 'Siapa pelanggan yang melakukan pemesanan?' },
        { label: '🏪 Kondisi Operasional', prompt: 'Bantu jelaskan kondisi operasional toko' },
        { label: '👥 Manajemen Pengguna', prompt: 'Berapa total pengguna sistem?' },
      ];
    case 'CUSTOMER':
    case 'PELANGGAN':
      return [
        { label: '📦 Status Pesanan Saya', prompt: 'Bagaimana status pesanan saya?' },
        { label: '🛒 Cek Keranjang Belanja', prompt: 'Apa saja produk dalam keranjang saya?' },
        { label: '📜 Riwayat Pesanan', prompt: 'Tolong jelaskan riwayat pesanan saya' },
        { label: '🏷️ Promo Diskon', prompt: 'Apakah ada promo?' },
      ];
    case 'KASIR':
      return [
        { label: '📊 Ringkasan Penjualan', prompt: 'Bagaimana ringkasan aktivitas penjualan?' },
        { label: '💳 Jumlah Transaksi', prompt: 'Berapa jumlah transaksi yang tercatat?' },
        { label: '📋 Info Operasional', prompt: 'Apa saja informasi operasional yang perlu saya perhatikan?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Menu apa paling laris?' },
      ];
    case 'SUPPLIER':
      return [
        { label: '📦 Berapa PO Saya?', prompt: 'Berapa Purchase Order yang saya miliki?' },
        { label: '⏳ Status PO Terbaru', prompt: 'Bagaimana status PO terbaru?' },
        { label: '🚚 Ringkasan Pengadaan', prompt: 'Tampilkan ringkasan pengadaan' },
        { label: '📋 Detail PO Saya', prompt: 'Apa saja detail PO saya?' },
      ];
    case 'OWNER':
      return [
        { label: '💵 Berapa Omzet Toko?', prompt: 'Berapa omzet toko?' },
        { label: '🏆 Menu Paling Laris', prompt: 'Produk apa yang paling laris?' },
        { label: '⚠️ Cek Stok Kritis', prompt: 'Produk apa yang stoknya habis?' },
        { label: '🚚 Kondisi Pengadaan', prompt: 'Bagaimana kondisi pengadaan barang?' },
        { label: '📊 Ringkasan Bisnis', prompt: 'Berikan ringkasan kondisi bisnis' },
      ];
    default:
      return [
        { label: '☕ Rekomendasi Menu', prompt: 'Apa rekomendasi minuman?' },
        { label: '🏷️ Promo Diskon', prompt: 'Apakah ada promo?' },
        { label: '📋 Menu Kopi', prompt: 'Berapa total menu?' },
      ];
  }
}
