import prisma from '@/lib/prisma';

export interface NotificationFilter {
  category?: 'ALL' | 'ORDER' | 'PAYMENT' | 'INVENTORY' | 'PRODUCT' | 'SYSTEM';
  isRead?: boolean;
  limit?: number;
  userRole?: string | null;
  userId?: string | null;
  customerName?: string | null;
}

export class SystemNotificationService {
  /**
   * Format mata uang Rupiah
   */
  public static formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // =========================================================================
  // 1. AKTIVITAS KATALOG PRODUK
  // =========================================================================

  /**
   * Notifikasi Admin menambahkan produk baru
   * Target: Pelanggan (produk baru), Admin, Owner
   */
  public static async notifyNewProduct(data: {
    productId: string;
    name: string;
    price: number;
    categoryName?: string;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          title: `☕ Produk Baru: ${data.name}`,
          message: `Menu baru "${data.name}" telah hadir di Kopi Mahasiswa (${this.formatRupiah(data.price)})${data.categoryName ? ` kategori ${data.categoryName}` : ''}. Yuk, coba sekarang!`,
          category: 'PRODUCT',
          type: 'PRODUCT_NEW',
          link: '/',
          metadata: JSON.stringify({
            productId: data.productId,
            name: data.name,
            price: data.price,
            categoryName: data.categoryName,
            targetRoles: ['PELANGGAN', 'ADMIN', 'OWNER'],
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create new product notification:', err);
    }
  }

  /**
   * Notifikasi Admin mengubah nama, harga, deskripsi, atau gambar produk
   * Target: Admin, Owner, Pelanggan
   */
  public static async notifyProductUpdated(data: {
    productId: string;
    name: string;
    changes: string;
    price?: number;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          title: `📝 Perubahan Menu: ${data.name}`,
          message: `Informasi menu "${data.name}" telah diperbarui (${data.changes}).`,
          category: 'PRODUCT',
          type: 'PRODUCT_UPDATED',
          link: '/admin/menu',
          metadata: JSON.stringify({
            productId: data.productId,
            name: data.name,
            changes: data.changes,
            price: data.price,
            targetRoles: ['ADMIN', 'OWNER', 'PELANGGAN'],
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create product updated notification:', err);
    }
  }

  /**
   * Notifikasi Admin menghapus produk
   * Target: Admin, Owner
   */
  public static async notifyProductDeleted(data: {
    productId: string;
    name: string;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          title: `🗑️ Menu Dihapus: ${data.name}`,
          message: `Menu "${data.name}" telah dihapus dari daftar katalog Kopi Mahasiswa.`,
          category: 'PRODUCT',
          type: 'PRODUCT_DELETED',
          link: '/admin/menu',
          metadata: JSON.stringify({
            productId: data.productId,
            name: data.name,
            targetRoles: ['ADMIN', 'OWNER'],
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create product deleted notification:', err);
    }
  }

  /**
   * Notifikasi Perubahan Status Ketersediaan Produk (Tersedia / Habis)
   * Target: Admin, Owner, Kasir, Pelanggan
   */
  public static async notifyProductAvailability(data: {
    productId: string;
    name: string;
    isAvailable: boolean;
  }) {
    try {
      const title = data.isAvailable
        ? `✅ Menu Tersedia Kembali: ${data.name}`
        : `⛔ Menu Habis: ${data.name}`;
      const message = data.isAvailable
        ? `Menu "${data.name}" kini sudah tersedia kembali dan siap dipesan!`
        : `Menu "${data.name}" saat ini berstatus habis / sementara tidak tersedia.`;

      return await prisma.notification.create({
        data: {
          title,
          message,
          category: 'PRODUCT',
          type: 'PRODUCT_STATUS',
          link: '/',
          metadata: JSON.stringify({
            productId: data.productId,
            name: data.name,
            isAvailable: data.isAvailable,
            targetRoles: ['ADMIN', 'OWNER', 'KASIR', 'PELANGGAN'],
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create product availability notification:', err);
    }
  }

  // =========================================================================
  // 2. AKTIVITAS STOK
  // =========================================================================

  /**
   * Notifikasi Stok Bahan Baku Menipis atau Habis
   * Target: Admin, Owner, Kasir (bila habis)
   */
  public static async notifyLowStock(data: {
    ingredientId: string;
    name: string;
    currentStock: number;
    minStock: number;
    unit: string;
  }) {
    try {
      const isOutOfStock = data.currentStock <= 0;
      const type = isOutOfStock ? 'OUT_OF_STOCK' : 'LOW_STOCK';
      const title = isOutOfStock
        ? `🚨 Stok Habis: ${data.name}`
        : `⚠️ Peringatan Stok Menipis: ${data.name}`;

      // Hindari duplikasi notifikasi bahan yang sama dalam 15 menit terakhir
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const existing = await prisma.notification.findFirst({
        where: {
          category: 'INVENTORY',
          type,
          title,
          createdAt: { gte: fifteenMinutesAgo },
        },
      });

      if (existing) return;

      const message = isOutOfStock
        ? `Bahan baku "${data.name}" telah HABIS (0 ${data.unit}). Segera lakukan pembelian atau pengadaan ke supplier!`
        : `Bahan baku "${data.name}" tersisa ${data.currentStock} ${data.unit} (di bawah batas minimum ${data.minStock} ${data.unit}). Segera lakukan pengadaan!`;

      return await prisma.notification.create({
        data: {
          title,
          message,
          category: 'INVENTORY',
          type,
          link: '/admin/inventory',
          metadata: JSON.stringify({
            ingredientId: data.ingredientId,
            name: data.name,
            stock: data.currentStock,
            minStock: data.minStock,
            unit: data.unit,
            targetRoles: isOutOfStock ? ['ADMIN', 'OWNER', 'KASIR'] : ['ADMIN', 'OWNER'],
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create low stock notification:', err);
    }
  }

  /**
   * Notifikasi Stok Bertambah / Restock
   * Target: Admin, Owner
   */
  public static async notifyStockRestocked(data: {
    ingredientId: string;
    name: string;
    addedStock: number;
    newStock: number;
    unit: string;
    reason?: string;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          title: `📦 Stok Diperbarui: ${data.name}`,
          message: `Stok "${data.name}" bertambah +${data.addedStock} ${data.unit}. Stok saat ini: ${data.newStock} ${data.unit}${data.reason ? ` (${data.reason})` : ''}.`,
          category: 'INVENTORY',
          type: 'STOCK_RESTOCKED',
          link: '/admin/inventory',
          metadata: JSON.stringify({
            ingredientId: data.ingredientId,
            name: data.name,
            addedStock: data.addedStock,
            newStock: data.newStock,
            unit: data.unit,
            targetRoles: ['ADMIN', 'OWNER'],
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create restock notification:', err);
    }
  }

  // =========================================================================
  // 3. AKTIVITAS PESANAN
  // =========================================================================

  /**
   * Notifikasi Pesanan Baru Masuk
   * Target: Admin, Kasir, Owner
   */
  public static async notifyNewOrder(data: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    itemsCount: number;
    paymentMethod: string;
    customerUserId?: string | null;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          userId: data.customerUserId || null,
          title: `🛒 Pesanan Baru Masuk #${data.orderNumber}`,
          message: `Pelanggan "${data.customerName}" memesan ${data.itemsCount} item senilai ${this.formatRupiah(data.totalAmount)} via ${data.paymentMethod}. Menunggu verifikasi & racikan kasir/barista.`,
          category: 'ORDER',
          type: 'ORDER_NEW',
          link: '/kasir/orders',
          metadata: JSON.stringify({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            totalAmount: data.totalAmount,
            customerName: data.customerName,
            customerUserId: data.customerUserId || null,
            targetRoles: ['ADMIN', 'KASIR', 'OWNER'],
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create new order notification:', err);
    }
  }

  /**
   * Notifikasi Perubahan Status Pesanan
   * Target: Pelanggan (notifikasi pesanan miliknya), Kasir, Admin
   */
  public static async notifyOrderStatus(data: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    status: string;
    customerUserId?: string | null;
  }) {
    try {
      let title = `☕ Status Pesanan #${data.orderNumber}: ${data.status}`;
      let message = `Pesanan #${data.orderNumber} (${data.customerName}) telah diperbarui statusnya menjadi "${data.status}".`;
      let targetRoles: string[] = ['ADMIN', 'KASIR'];

      if (data.status === 'CONFIRMED') {
        title = `📋 Pesanan Dikonfirmasi #${data.orderNumber}`;
        message = `Pesanan #${data.orderNumber} telah dikonfirmasi kasir dan siap diracik barista.`;
        targetRoles = ['PELANGGAN', 'KASIR', 'ADMIN'];
      } else if (data.status === 'PROCESSING') {
        title = `☕ Sedang Diracik Barista #${data.orderNumber}`;
        message = `Pesanan #${data.orderNumber} sedang diracik dengan teliti oleh barista Kopi Mahasiswa.`;
        targetRoles = ['PELANGGAN', 'KASIR'];
      } else if (data.status === 'READY') {
        title = `🎉 Pesanan Siap Disajikan #${data.orderNumber}`;
        message = `Pesanan #${data.orderNumber} sudah siap! Silakan ambil di kasir/barista.`;
        targetRoles = ['PELANGGAN', 'KASIR', 'ADMIN'];
      } else if (data.status === 'COMPLETED') {
        title = `✨ Pesanan Selesai #${data.orderNumber}`;
        message = `Pesanan #${data.orderNumber} telah selesai diserahkan. Selamat menikmati kopi racikan kami!`;
        targetRoles = ['PELANGGAN', 'KASIR', 'ADMIN', 'OWNER'];
      } else if (data.status === 'CANCELLED') {
        title = `❌ Pesanan Dibatalkan #${data.orderNumber}`;
        message = `Pesanan #${data.orderNumber} telah dibatalkan.`;
        targetRoles = ['PELANGGAN', 'KASIR', 'ADMIN'];
      }

      return await prisma.notification.create({
        data: {
          userId: data.customerUserId || null,
          title,
          message,
          category: 'ORDER',
          type: `ORDER_${data.status}`,
          link: data.customerUserId ? '/orders' : '/kasir/orders',
          metadata: JSON.stringify({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            customerName: data.customerName,
            customerUserId: data.customerUserId || null,
            status: data.status,
            targetRoles,
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create status notification:', err);
    }
  }

  /**
   * Notifikasi Pembayaran Berhasil
   */
  public static async notifyPaymentSuccess(data: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
    customerUserId?: string | null;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          userId: data.customerUserId || null,
          title: `💳 Pembayaran Terverifikasi #${data.orderNumber}`,
          message: `Pembayaran sebesar ${this.formatRupiah(data.totalAmount)} via ${data.paymentMethod} untuk pesanan #${data.orderNumber} (${data.customerName}) telah LUNAS.`,
          category: 'PAYMENT',
          type: 'PAYMENT_SUCCESS',
          link: data.customerUserId ? '/orders' : '/kasir/orders',
          metadata: JSON.stringify({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            totalAmount: data.totalAmount,
            customerName: data.customerName,
            customerUserId: data.customerUserId || null,
            targetRoles: ['ADMIN', 'KASIR', 'OWNER', 'PELANGGAN'],
          }),
        },
      });
    } catch (err) {
      console.error('Failed to create payment notification:', err);
    }
  }

  // =========================================================================
  // 4. QUERY DAN FILTER NOTIFIKASI DENGAN HAK AKSES PER ROLE
  // =========================================================================

  /**
   * Mengambil notifikasi dengan filter kategori & role pengguna
   */
  public static async getNotifications(filters: NotificationFilter = {}) {
    const { category, isRead, limit = 50, userRole, userId, customerName } = filters;
    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    // Ambil raw list notifikasi
    const rawItems = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit * 2, // Ambil sedikit lebih banyak untuk difilter per role jika diperlukan
    });

    // Filter berdasarkan role penerima
    const filteredItems = rawItems.filter((item) => {
      // Jika admin, menerima produk, stok, pesanan, payment, system
      if (!userRole || userRole === 'ADMIN') {
        return true;
      }

      let meta: any = null;
      try {
        if (item.metadata) meta = JSON.parse(item.metadata);
      } catch {}

      const targetRoles: string[] = meta?.targetRoles || [];

      // Jika role adalah OWNER
      if (userRole === 'OWNER') {
        if (targetRoles.includes('OWNER')) return true;
        if (['PRODUCT', 'INVENTORY', 'SYSTEM'].includes(item.category)) return true;
        if (item.type === 'ORDER_COMPLETED' || item.type === 'PAYMENT_SUCCESS') return true;
        return false;
      }

      // Jika role adalah KASIR
      if (userRole === 'KASIR') {
        if (targetRoles.includes('KASIR')) return true;
        if (['ORDER', 'PAYMENT'].includes(item.category)) return true;
        if (item.type === 'PRODUCT_STATUS' || item.type === 'OUT_OF_STOCK') return true;
        return false;
      }

      // Jika role adalah PELANGGAN
      if (userRole === 'PELANGGAN') {
        // Notifikasi produk baru atau ketersediaan produk
        if (item.category === 'PRODUCT') return true;

        // Notifikasi pesanan milik pelanggan ini
        if (item.userId && userId && item.userId === userId) return true;
        if (meta?.customerUserId && userId && meta.customerUserId === userId) return true;
        if (meta?.customerName && customerName && meta.customerName.toLowerCase() === customerName.toLowerCase()) return true;

        return false;
      }

      // Fallback publik/tamu
      return item.category === 'PRODUCT';
    }).slice(0, limit);

    // Hitung statistik untuk filtered items
    const unreadCount = filteredItems.filter((n) => !n.isRead).length;
    const orderCount = filteredItems.filter((n) => n.category === 'ORDER').length;
    const productCount = filteredItems.filter((n) => n.category === 'PRODUCT').length;
    const inventoryCount = filteredItems.filter((n) => n.category === 'INVENTORY').length;
    const paymentCount = filteredItems.filter((n) => n.category === 'PAYMENT').length;

    return {
      notifications: filteredItems,
      stats: {
        total: filteredItems.length,
        unread: unreadCount,
        order: orderCount,
        product: productCount,
        inventory: inventoryCount,
        payment: paymentCount,
      },
    };
  }

  /**
   * Tandai notifikasi sebagai dibaca
   */
  public static async markAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Tandai seluruh notifikasi sebagai dibaca
   */
  public static async markAllAsRead(ids?: string[]) {
    if (ids && ids.length > 0) {
      return await prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { isRead: true },
      });
    }

    return await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Hapus notifikasi tunggal
   */
  public static async deleteNotification(id: string) {
    return await prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Hapus notifikasi banyak atau semua
   */
  public static async clearAllNotifications(ids?: string[]) {
    if (ids && ids.length > 0) {
      return await prisma.notification.deleteMany({
        where: { id: { in: ids } },
      });
    }
    return await prisma.notification.deleteMany({});
  }
}
