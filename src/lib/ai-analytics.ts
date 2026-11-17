import prisma from '@/lib/prisma';

export interface RealtimeBusinessStats {
  // 1. Pesanan (Orders)
  totalOrdersCount: number;
  todayOrdersCount: number;
  totalPaidTransactions: number;
  todayPaidTransactions: number;
  completedOrdersCount: number;
  processingOrdersCount: number;
  readyOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrdersCount: number;
  totalPaymentsCount: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  cancelledPaymentsCount: number;
  recentPaymentsList: {
    orderNumber: string;
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: Date;
  }[];

  // 2. Keuangan (Financials)
  totalRevenue: number;
  totalRevenueFormatted: string;
  todayRevenue: number;
  todayRevenueFormatted: string;
  totalHpp: number;
  totalHppFormatted: string;
  grossProfit: number;
  grossProfitFormatted: string;
  profitMarginPercent: string;

  // 3. Menu Aktif (Active Menus) & Kategori
  activeMenusCount: number;
  totalMenusCount: number;
  totalCategoriesCount: number;
  categoriesList: {
    id: string;
    name: string;
    slug: string;
    description: string;
    menusCount: number;
  }[];
  activeMenusList: {
    id: string;
    name: string;
    price: number;
    priceFormatted: string;
    categoryName: string;
    description: string;
    isAvailable: boolean;
  }[];

  // 4. Menu Terlaris (Best Seller)
  topSellingMenus: {
    name: string;
    quantity: number;
    totalAmount: number;
    price: number;
  }[];

  // 5. Inventori & Stok Bahan Baku (Ingredients Stock)
  totalIngredientsCount: number;
  ingredientsStock: {
    id: string;
    name: string;
    stock: number;
    unit: string;
    minStock: number;
    isLowStock: boolean;
  }[];
  lowStockIngredients: {
    name: string;
    stock: number;
    unit: string;
    minStock: number;
  }[];

  // 6. Estimasi Kapasitas Porsi Menu Berdasarkan Resep Bahan
  menuPortionEstimates: {
    menuName: string;
    isAvailable: boolean;
    price: number;
    priceFormatted: string;
    maxPortionsCanMake: number;
    limitingIngredient?: string;
  }[];

  // 7. Pengguna Sistem (Users Management)
  totalUsersCount: number;
  adminUsersCount: number;
  ownerUsersCount: number;
  kasirUsersCount: number;
  pelangganUsersCount: number;
  supplierUsersCount: number;
  usersList: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string;
    createdAt: Date;
  }[];

  // 8. Pengadaan & Purchase Orders (PO) Supplier
  totalPurchasesCount: number;
  totalPurchasesAmount: number;
  totalPurchasesAmountFormatted: string;
  pendingPurchasesCount: number;
  receivedPurchasesCount: number;
  cancelledPurchasesCount: number;
  recentPurchasesList: {
    id: string;
    purchaseNumber: string;
    supplierName: string;
    supplierId: string;
    totalAmount: number;
    totalAmountFormatted: string;
    status: string;
    notes?: string | null;
    itemsCount: number;
    itemsSummary: string;
    createdAt: Date;
  }[];

  // 9. Konteks Khusus Pelanggan (Customer Data Isolation)
  customerContext?: {
    customerId: string;
    customerName: string;
    points: number;
    totalOrdersCount: number;
    recentOrders: {
      orderNumber: string;
      status: string;
      totalAmount: number;
      totalAmountFormatted: string;
      itemsSummary: string;
      paymentStatus: string;
      paymentMethod: string;
      createdAt: Date;
    }[];
    cartItems: {
      menuId: string;
      name: string;
      price: number;
      quantity: number;
      subtotal: number;
    }[];
    cartTotalAmount: number;
    cartTotalFormatted: string;
  };

  // 10. Konteks Khusus Supplier (Supplier Data Isolation)
  supplierContext?: {
    supplierId: string;
    supplierName: string;
    contactName: string;
    phone: string;
    totalPurchasesCount: number;
    pendingPurchasesCount: number;
    receivedPurchasesCount: number;
    totalPurchasesAmount: number;
    totalPurchasesAmountFormatted: string;
    recentPurchases: {
      purchaseNumber: string;
      status: string;
      totalAmount: number;
      totalAmountFormatted: string;
      itemsSummary: string;
      notes?: string | null;
      createdAt: Date;
    }[];
  };
}

export interface UserQueryContext {
  userId?: string | null;
  role?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  cart?: any[];
}

/**
 * Mengambil data analisis bisnis real-time langsung dari database MySQL via Prisma
 */
export async function getRealtimeBusinessStats(userContext?: UserQueryContext): Promise<RealtimeBusinessStats> {
  try {
    // Penentuan tanggal hari ini pada zona waktu lokal (00:00:00)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Query 1: Ambil semua pesanan dengan relasi payment dan orderItems
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        payment: true,
        orderItems: {
          include: {
            menu: {
              include: {
                recipes: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalOrdersCount = orders.length;
    let todayOrdersCount = 0;
    let totalPaidTransactions = 0;
    let todayPaidTransactions = 0;

    let totalRevenue = 0;
    let todayRevenue = 0;
    let totalHpp = 0;

    let completedOrdersCount = 0;
    let processingOrdersCount = 0;
    let readyOrdersCount = 0;
    let pendingOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let totalPaymentsCount = 0;
    let pendingPaymentsCount = 0;
    let failedPaymentsCount = 0;
    let cancelledPaymentsCount = 0;
    const recentPaymentsList: RealtimeBusinessStats['recentPaymentsList'] = [];

    const menuSalesMap: {
      [menuName: string]: { quantity: number; totalAmount: number; price: number };
    } = {};

    for (const order of orders) {
      const orderCreatedAt = new Date(order.createdAt);
      const isToday = orderCreatedAt >= todayStart;

      if (isToday) {
        todayOrdersCount++;
      }

      // Hitung status pesanan
      if (order.status === 'COMPLETED') completedOrdersCount++;
      else if (order.status === 'PROCESSING' || order.status === 'CONFIRMED') processingOrdersCount++;
      else if (order.status === 'READY') readyOrdersCount++;
      else if (order.status === 'PENDING') pendingOrdersCount++;
      else if (order.status === 'CANCELLED') cancelledOrdersCount++;

      if (order.payment) {
        totalPaymentsCount++;
        if (order.payment.status === 'PENDING') pendingPaymentsCount++;
        else if (order.payment.status === 'FAILED') failedPaymentsCount++;
        else if (order.payment.status === 'CANCELLED') cancelledPaymentsCount++;

        if (recentPaymentsList.length < 10) {
          recentPaymentsList.push({
            orderNumber: order.orderNumber,
            amount: order.payment.amount,
            paymentMethod: order.payment.paymentMethod,
            status: order.payment.status,
            createdAt: order.payment.createdAt,
          });
        }
      }

      // Validasi pembayaran lunas (PAID)
      const isPaid = order.payment?.status === 'PAID';
      if (isPaid) {
        const orderAmount = order.payment ? order.payment.amount : order.totalAmount;
        totalRevenue += orderAmount;
        totalPaidTransactions++;

        if (isToday) {
          todayRevenue += orderAmount;
          todayPaidTransactions++;
        }

        // Hitung kuantitas penjualan per menu & HPP bahan baku
        for (const item of order.orderItems) {
          const menuName = item.menu.name;
          if (!menuSalesMap[menuName]) {
            menuSalesMap[menuName] = {
              quantity: 0,
              totalAmount: 0,
              price: item.price,
            };
          }
          menuSalesMap[menuName].quantity += item.quantity;
          menuSalesMap[menuName].totalAmount += item.subtotal || item.price * item.quantity;

          // Hitung HPP dari resep bahan baku
          let itemCost = 0;
          if (item.menu.recipes && item.menu.recipes.length > 0) {
            for (const rec of item.menu.recipes) {
              const ingCost = rec.ingredient?.costPerUnit || 0;
              itemCost += rec.quantity * ingCost;
            }
          }
          totalHpp += itemCost * item.quantity;
        }
      }
    }

    // Urutkan peringkat menu terlaris
    const topSellingMenus = Object.entries(menuSalesMap)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        totalAmount: data.totalAmount,
        price: data.price,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const grossProfit = totalRevenue - totalHpp;
    const profitMarginPercent =
      totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%';

    // Query 2: Ambil seluruh menu dari database MySQL untuk menghitung varian menu aktif
    const allMenus = await prisma.menu.findMany({
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const totalMenusCount = allMenus.length;
    const activeMenus = allMenus.filter((m) => m.isAvailable === true);
    const activeMenusCount = activeMenus.length;

    const activeMenusList = activeMenus.map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      priceFormatted: 'Rp' + m.price.toLocaleString('id-ID'),
      categoryName: m.category?.name || 'Kopi Signature',
      description: m.description,
      isAvailable: m.isAvailable,
    }));

    // Query 3: Ambil seluruh kategori dari tabel categories
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { menus: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    const totalCategoriesCount = categories.length;
    const categoriesList = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      menusCount: c._count.menus,
    }));

    // Query 4: Ambil seluruh inventaris bahan baku dari tabel ingredients
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
    const totalIngredientsCount = ingredients.length;

    const ingredientsStock = ingredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      stock: ing.stock,
      unit: ing.unit,
      minStock: ing.minStock,
      isLowStock: ing.stock <= ing.minStock,
    }));

    const lowStockIngredients = ingredientsStock.filter((ing) => ing.isLowStock);

    // Kalkulasi kapasitas porsi yang dapat disajikan tiap menu
    const menuPortionEstimates = allMenus.map((m) => {
      let maxPortions = 999999;
      let limitingIngredient = '';

      if (!m.recipes || m.recipes.length === 0) {
        maxPortions = m.isAvailable ? 100 : 0;
      } else {
        for (const rec of m.recipes) {
          const ingStock = rec.ingredient?.stock || 0;
          const needed = rec.quantity || 1;
          const possible = Math.floor(ingStock / needed);
          if (possible < maxPortions) {
            maxPortions = possible;
            limitingIngredient = rec.ingredient?.name || '';
          }
        }
      }

      if (maxPortions === 999999) maxPortions = 0;

      return {
        menuName: m.name,
        isAvailable: m.isAvailable && maxPortions > 0,
        price: m.price,
        priceFormatted: 'Rp' + m.price.toLocaleString('id-ID'),
        maxPortionsCanMake: maxPortions,
        limitingIngredient,
      };
    });

    // Query 5: Ambil seluruh data pengguna sistem dari tabel users
    const [
      totalUsersCount,
      adminUsersCount,
      ownerUsersCount,
      kasirUsersCount,
      pelangganUsersCount,
      supplierUsersCount,
      usersListRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.user.count({ where: { role: 'KASIR' } }),
      prisma.user.count({ where: { role: 'PELANGGAN' } }),
      prisma.user.count({ where: { role: 'SUPPLIER' } }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const usersList = usersListRaw.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '-',
      createdAt: u.createdAt,
    }));

    // Query 6: Ambil seluruh data Pengadaan & Purchase Order (PO) dari tabel purchases
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPurchasesCount = purchases.length;
    const totalPurchasesAmount = purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const pendingPurchasesCount = purchases.filter((p) => p.status === 'PENDING').length;
    const receivedPurchasesCount = purchases.filter((p) => p.status === 'RECEIVED').length;
    const cancelledPurchasesCount = purchases.filter((p) => p.status === 'CANCELLED').length;

    const recentPurchasesList = purchases.slice(0, 10).map((p) => ({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      supplierName: p.supplier?.name || 'Supplier Mitra',
      supplierId: p.supplierId,
      totalAmount: p.totalAmount,
      totalAmountFormatted: 'Rp' + (p.totalAmount || 0).toLocaleString('id-ID'),
      status: p.status,
      notes: p.notes,
      itemsCount: p.items.length,
      itemsSummary: p.items.map((it) => `${it.quantity} ${it.ingredient?.unit || ''} ${it.ingredient?.name || ''}`).join(', '),
      createdAt: p.createdAt,
    }));

    // Query 7: Konteks Khusus Pelanggan (Customer Data Isolation)
    let customerContext: RealtimeBusinessStats['customerContext'] = undefined;
    const activeRole = (userContext?.role || '').toUpperCase();
    if (userContext?.customerId || activeRole === 'PELANGGAN' || activeRole === 'CUSTOMER' || userContext?.userId) {
      let customerRecord = null;
      if (userContext?.customerId) {
        customerRecord = await prisma.customer.findUnique({
          where: { id: userContext.customerId },
          include: { user: true },
        });
      } else if (userContext?.userId) {
        customerRecord = await prisma.customer.findUnique({
          where: { userId: userContext.userId },
          include: { user: true },
        });
      }

      if (!customerRecord) {
        customerRecord = await prisma.customer.findFirst({
          include: { user: true },
        });
      }

      if (customerRecord) {
        const custOrders = await prisma.order.findMany({
          where: { customerId: customerRecord.id },
          include: { payment: true, orderItems: { include: { menu: true } } },
          orderBy: { createdAt: 'desc' },
        });

        const rawCart = Array.isArray(userContext?.cart) ? userContext.cart : [];
        const cartItems = rawCart.map((c: any) => ({
          menuId: c.menuId || c.id || '',
          name: c.name || 'Menu Kopi',
          price: Number(c.price) || 0,
          quantity: Number(c.quantity) || 1,
          subtotal: (Number(c.price) || 0) * (Number(c.quantity) || 1),
        }));
        const cartTotalAmount = cartItems.reduce((acc: number, item: any) => acc + item.subtotal, 0);

        customerContext = {
          customerId: customerRecord.id,
          customerName: customerRecord.user?.name || 'Pelanggan',
          points: customerRecord.points || 0,
          totalOrdersCount: custOrders.length,
          recentOrders: custOrders.map((o) => ({
            orderNumber: o.orderNumber,
            status: o.status,
            totalAmount: o.totalAmount,
            totalAmountFormatted: 'Rp' + o.totalAmount.toLocaleString('id-ID'),
            itemsSummary: o.orderItems.map((oi) => `${oi.quantity}x ${oi.menu.name}`).join(', '),
            paymentStatus: o.payment?.status || 'PENDING',
            paymentMethod: o.payment?.paymentMethod || 'QRIS',
            createdAt: o.createdAt,
          })),
          cartItems,
          cartTotalAmount,
          cartTotalFormatted: 'Rp' + cartTotalAmount.toLocaleString('id-ID'),
        };
      }
    }

    // Query 8: Konteks Khusus Supplier (Supplier Data Isolation)
    let supplierContext: RealtimeBusinessStats['supplierContext'] = undefined;
    if (userContext?.supplierId || activeRole === 'SUPPLIER' || userContext?.userId) {
      let supplierRecord = null;
      if (userContext?.supplierId) {
        supplierRecord = await prisma.supplier.findUnique({
          where: { id: userContext.supplierId },
        });
      } else if (userContext?.userId) {
        supplierRecord = await prisma.supplier.findUnique({
          where: { userId: userContext.userId },
        });
      }

      if (!supplierRecord) {
        supplierRecord = await prisma.supplier.findFirst();
      }

      if (supplierRecord) {
        const suppPurchases = await prisma.purchase.findMany({
          where: { supplierId: supplierRecord.id },
          include: { items: { include: { ingredient: true } } },
          orderBy: { createdAt: 'desc' },
        });

        const suppTotalAmount = suppPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

        supplierContext = {
          supplierId: supplierRecord.id,
          supplierName: supplierRecord.name,
          contactName: supplierRecord.contactName,
          phone: supplierRecord.phone,
          totalPurchasesCount: suppPurchases.length,
          pendingPurchasesCount: suppPurchases.filter((p) => p.status === 'PENDING').length,
          receivedPurchasesCount: suppPurchases.filter((p) => p.status === 'RECEIVED').length,
          totalPurchasesAmount: suppTotalAmount,
          totalPurchasesAmountFormatted: 'Rp' + suppTotalAmount.toLocaleString('id-ID'),
          recentPurchases: suppPurchases.map((p) => ({
            purchaseNumber: p.purchaseNumber,
            status: p.status,
            totalAmount: p.totalAmount,
            totalAmountFormatted: 'Rp' + (p.totalAmount || 0).toLocaleString('id-ID'),
            itemsSummary: p.items.map((i) => `${i.quantity} ${i.ingredient?.unit || ''} ${i.ingredient?.name || ''}`).join(', '),
            notes: p.notes,
            createdAt: p.createdAt,
          })),
        };
      }
    }

    return {
      totalOrdersCount,
      todayOrdersCount,
      totalPaidTransactions,
      todayPaidTransactions,
      completedOrdersCount,
      processingOrdersCount,
      readyOrdersCount,
      pendingOrdersCount,
      cancelledOrdersCount,
      totalPaymentsCount,
      pendingPaymentsCount,
      failedPaymentsCount,
      cancelledPaymentsCount,
      recentPaymentsList,
      totalRevenue,
      totalRevenueFormatted: 'Rp' + totalRevenue.toLocaleString('id-ID'),
      todayRevenue,
      todayRevenueFormatted: 'Rp' + todayRevenue.toLocaleString('id-ID'),
      totalHpp,
      totalHppFormatted: 'Rp' + totalHpp.toLocaleString('id-ID'),
      grossProfit,
      grossProfitFormatted: 'Rp' + grossProfit.toLocaleString('id-ID'),
      profitMarginPercent,
      activeMenusCount,
      totalMenusCount,
      totalCategoriesCount,
      categoriesList,
      totalIngredientsCount,
      activeMenusList,
      topSellingMenus,
      ingredientsStock,
      lowStockIngredients,
      menuPortionEstimates,
      totalUsersCount,
      adminUsersCount,
      ownerUsersCount,
      kasirUsersCount,
      pelangganUsersCount,
      supplierUsersCount,
      usersList,
      totalPurchasesCount,
      totalPurchasesAmount,
      totalPurchasesAmountFormatted: 'Rp' + totalPurchasesAmount.toLocaleString('id-ID'),
      pendingPurchasesCount,
      receivedPurchasesCount,
      cancelledPurchasesCount,
      recentPurchasesList,
      customerContext,
      supplierContext,
    };
  } catch (error) {
    console.error('Error in getRealtimeBusinessStats:', error);
    return {
      totalOrdersCount: 0,
      todayOrdersCount: 0,
      totalPaidTransactions: 0,
      todayPaidTransactions: 0,
      completedOrdersCount: 0,
      processingOrdersCount: 0,
      readyOrdersCount: 0,
      pendingOrdersCount: 0,
      cancelledOrdersCount: 0,
      totalPaymentsCount: 0,
      pendingPaymentsCount: 0,
      failedPaymentsCount: 0,
      cancelledPaymentsCount: 0,
      recentPaymentsList: [],
      totalRevenue: 0,
      totalRevenueFormatted: 'Rp0',
      todayRevenue: 0,
      todayRevenueFormatted: 'Rp0',
      totalHpp: 0,
      totalHppFormatted: 'Rp0',
      grossProfit: 0,
      grossProfitFormatted: 'Rp0',
      profitMarginPercent: '0%',
      activeMenusCount: 0,
      totalMenusCount: 0,
      totalCategoriesCount: 0,
      categoriesList: [],
      totalIngredientsCount: 0,
      activeMenusList: [],
      topSellingMenus: [],
      ingredientsStock: [],
      lowStockIngredients: [],
      menuPortionEstimates: [],
      totalUsersCount: 0,
      adminUsersCount: 0,
      ownerUsersCount: 0,
      kasirUsersCount: 0,
      pelangganUsersCount: 0,
      supplierUsersCount: 0,
      usersList: [],
      totalPurchasesCount: 0,
      totalPurchasesAmount: 0,
      totalPurchasesAmountFormatted: 'Rp0',
      pendingPurchasesCount: 0,
      receivedPurchasesCount: 0,
      cancelledPurchasesCount: 0,
      recentPurchasesList: [],
      customerContext: undefined,
      supplierContext: undefined,
    };
  }
}
