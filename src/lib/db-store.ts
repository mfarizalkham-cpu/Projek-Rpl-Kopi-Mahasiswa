import prisma from './prisma';
import { hashPassword } from './auth';

export interface StockHistoryMemoryItem {
  id: string;
  ingredientId: string;
  ingredientName?: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

// Stateful In-Memory Fallback Store (for instant out-of-the-box local operation)
let memoryStore: {
  users: any[];
  customers: any[];
  employees: any[];
  suppliers: any[];
  categories: any[];
  ingredients: any[];
  menus: any[];
  recipes: any[];
  orders: any[];
  purchases: any[];
  stockHistory: StockHistoryMemoryItem[];
  reviews: any[];
} = {
  users: [
    { id: 'usr-1', name: 'Admin Utama', email: 'adminkopimahasiswa@gmail.com', password: hashPassword('admin'), role: 'ADMIN', phone: '081234567890' },
    { id: 'usr-2', name: 'Pak Owner', email: 'ownerkopimahasiswa@gmail.com', password: hashPassword('owner'), role: 'OWNER', phone: '081234567891' },
    { id: 'usr-3', name: 'Mbak Kasir', email: 'kasirkopimahasiswa@gmail.com', password: hashPassword('kasir'), role: 'KASIR', phone: '081234567892' },
    { id: 'usr-4', name: 'Budi Mahasiswa', email: 'pelanggankopimahasiswa@gmail.com', password: hashPassword('pelanggan'), role: 'PELANGGAN', phone: '081234567893' },
    { id: 'usr-5', name: 'CV Kopi Jaya', email: 'supplierkopimahasiswa@gmail.com', password: hashPassword('supplier'), role: 'SUPPLIER', phone: '081234567894' },
    { id: 'usr-6', name: 'Siti Lestari', email: 'siti@kopimahasiswa.id', password: hashPassword('siti123'), role: 'PELANGGAN', phone: '081234567895' },
    { id: 'usr-7', name: 'Dimas Anggara', email: 'dimas@kopimahasiswa.id', password: hashPassword('dimas123'), role: 'PELANGGAN', phone: '081234567896' },
    { id: 'usr-8', name: 'Nadia Putri', email: 'nadia@kopimahasiswa.id', password: hashPassword('nadia123'), role: 'PELANGGAN', phone: '081234567897' },
    { id: 'usr-9', name: 'Rian Pratama', email: 'rian@kopimahasiswa.id', password: hashPassword('rian123'), role: 'PELANGGAN', phone: '081234567898' },
    { id: 'usr-10', name: 'Ahmad Fauzi', email: 'ahmad@kopimahasiswa.id', password: hashPassword('ahmad123'), role: 'PELANGGAN', phone: '081234567899' },
  ],
  customers: [
    { id: 'cust-1', userId: 'usr-4', address: 'Asrama Mahasiswa Kampus A No. 12', points: 150, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'cust-2', userId: 'usr-6', address: 'Kost Melati Jl. Kampus No. 5', points: 210, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'cust-3', userId: 'usr-7', address: 'Wisma Mahasiswa Blok B', points: 320, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'cust-4', userId: 'usr-8', address: 'Kost Lavender No. 8', points: 110, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: 'cust-5', userId: 'usr-9', address: 'Griya Asri Kampus Barat', points: 95, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: 'cust-6', userId: 'usr-10', address: 'Asrama Putra Gedung C', points: 60, createdAt: new Date().toISOString() },
  ],
  employees: [
    { id: 'emp-1', userId: 'usr-3', position: 'Senior Barista & Kasir', salary: 3500000 },
  ],
  suppliers: [
    { id: 'sup-1', userId: 'usr-5', name: 'CV Kopi Jaya Supplier', contactName: 'Pak Hadi', phone: '081234567894', email: 'supplierkopimahasiswa@gmail.com', address: 'Jl. Merdeka No. 45, Bandung' },
  ],
  categories: [
    { id: 'cat-1', name: 'Kopi Signature', slug: 'kopi-signature', description: 'Variasi olahan kopi espresso racikan asli Kopi Mahasiswa', imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop' },
    { id: 'cat-2', name: 'Non-Kopi', slug: 'non-kopi', description: 'Minuman segar dan creamy tanpa kandungan kafein', imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop' },
    { id: 'cat-3', name: 'Snack & Pastry', slug: 'snack-pastry', description: 'Camilan renyah dan kue pendamping aktivitas belajar', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop' },
  ],
  ingredients: [
    { id: 'ing-1', name: 'Biji Kopi Arabika Houseblend', unit: 'gram', stock: 5000, minStock: 1000, costPerUnit: 150 },
    { id: 'ing-2', name: 'Susu Fresh Milk UHT', unit: 'ml', stock: 20000, minStock: 5000, costPerUnit: 20 },
    { id: 'ing-3', name: 'Sirup Gula Aren Organik', unit: 'ml', stock: 8000, minStock: 2000, costPerUnit: 30 },
    { id: 'ing-4', name: 'Bubuk Matcha Premium Uji', unit: 'gram', stock: 1500, minStock: 300, costPerUnit: 400 },
    { id: 'ing-5', name: 'Butter Croissant Dough', unit: 'pcs', stock: 25, minStock: 10, costPerUnit: 8000 },
    { id: 'ing-6', name: 'Kopi Gadang', unit: 'gram', stock: 6, minStock: 20, costPerUnit: 0 },
  ],
  menus: [
    { id: 'menu-1', categoryId: 'cat-1', name: 'Es Kopi Susu Gula Aren', description: 'Espresso double shot dipadu susu segar dingin dan racikan gula aren alami khas Nusantara', price: 18000, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop' },
    { id: 'menu-2', categoryId: 'cat-1', name: 'Americano Cold Brew', description: 'Ekstrak kopi Arabika murni dengan es batu segar dan aroma rempah kopi lembut', price: 15000, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop' },
    { id: 'menu-3', categoryId: 'cat-2', name: 'Matcha Creamy Latte', description: 'Bubuk Matcha Uji Kyoto dipadukan susu uht manis nan gurih', price: 22000, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop' },
    { id: 'menu-4', categoryId: 'cat-3', name: 'Butter Croissant Warm', description: 'Pastry renyah dipanggang hangat dengan aroma mentega Perancis yang menggugah selera', price: 16000, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop' },
  ],
  recipes: [
    { id: 'rec-1', menuId: 'menu-1', ingredientId: 'ing-1', quantity: 18 },
    { id: 'rec-2', menuId: 'menu-1', ingredientId: 'ing-2', quantity: 120 },
    { id: 'rec-3', menuId: 'menu-1', ingredientId: 'ing-3', quantity: 30 },
    { id: 'rec-4', menuId: 'menu-2', ingredientId: 'ing-1', quantity: 18 },
    { id: 'rec-5', menuId: 'menu-3', ingredientId: 'ing-4', quantity: 15 },
    { id: 'rec-6', menuId: 'menu-3', ingredientId: 'ing-2', quantity: 150 },
    { id: 'rec-7', menuId: 'menu-4', ingredientId: 'ing-5', quantity: 1 },
  ],
  orders: [
    {
      id: 'ord-1',
      orderNumber: 'KM-261015-1001',
      customerId: 'cust-1',
      customerName: 'Budi Mahasiswa',
      status: 'COMPLETED',
      totalAmount: 36000,
      notes: 'Less ice',
      createdAt: new Date().toISOString(),
      orderItems: [
        { id: 'oi-1', menuId: 'menu-1', quantity: 2, price: 18000, subtotal: 36000, menuName: 'Es Kopi Susu Gula Aren' },
      ],
      payment: { id: 'pay-1', amount: 36000, paymentMethod: 'QRIS', status: 'PAID', paidAt: new Date().toISOString() },
    },
    {
      id: 'ord-2',
      orderNumber: 'KM-261015-1002',
      customerId: 'cust-2',
      customerName: 'Siti Lestari',
      status: 'COMPLETED',
      totalAmount: 38000,
      notes: 'Hangat dipisah',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      orderItems: [
        { id: 'oi-2', menuId: 'menu-3', quantity: 1, price: 22000, subtotal: 22000, menuName: 'Matcha Creamy Latte' },
        { id: 'oi-3', menuId: 'menu-4', quantity: 1, price: 16000, subtotal: 16000, menuName: 'Butter Croissant Warm' },
      ],
      payment: { id: 'pay-2', amount: 38000, paymentMethod: 'QRIS', status: 'PAID', paidAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    },
    {
      id: 'ord-3',
      orderNumber: 'KM-261015-1003',
      customerId: 'cust-3',
      customerName: 'Dimas Anggara',
      status: 'COMPLETED',
      totalAmount: 50000,
      notes: 'Gula aren normal',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      orderItems: [
        { id: 'oi-4', menuId: 'menu-1', quantity: 2, price: 18000, subtotal: 36000, menuName: 'Es Kopi Susu Gula Aren' },
        { id: 'oi-5', menuId: 'menu-2', quantity: 1, price: 15000, subtotal: 15000, menuName: 'Americano Cold Brew' },
      ],
      payment: { id: 'pay-3', amount: 50000, paymentMethod: 'CASH', status: 'PAID', paidAt: new Date(Date.now() - 3600000 * 4).toISOString() },
    },
    {
      id: 'ord-4',
      orderNumber: 'KM-261014-1001',
      customerId: 'cust-5',
      customerName: 'Rian Pratama',
      status: 'COMPLETED',
      totalAmount: 36000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 3).toISOString(),
      orderItems: [
        { id: 'oi-6', menuId: 'menu-1', quantity: 2, price: 18000, subtotal: 36000, menuName: 'Es Kopi Susu Gula Aren' },
      ],
      payment: { id: 'pay-4', amount: 36000, paymentMethod: 'QRIS', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 3).toISOString() },
    },
    {
      id: 'ord-5',
      orderNumber: 'KM-261014-1002',
      customerId: 'cust-4',
      customerName: 'Nadia Putri',
      status: 'COMPLETED',
      totalAmount: 44000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 5).toISOString(),
      orderItems: [
        { id: 'oi-7', menuId: 'menu-3', quantity: 2, price: 22000, subtotal: 44000, menuName: 'Matcha Creamy Latte' },
      ],
      payment: { id: 'pay-5', amount: 44000, paymentMethod: 'QRIS', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 5).toISOString() },
    },
    {
      id: 'ord-6',
      orderNumber: 'KM-261014-1003',
      customerId: 'cust-1',
      customerName: 'Budi Mahasiswa',
      status: 'COMPLETED',
      totalAmount: 38000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 8).toISOString(),
      orderItems: [
        { id: 'oi-8', menuId: 'menu-3', quantity: 1, price: 22000, subtotal: 22000, menuName: 'Matcha Creamy Latte' },
        { id: 'oi-9', menuId: 'menu-4', quantity: 1, price: 16000, subtotal: 16000, menuName: 'Butter Croissant Warm' },
      ],
      payment: { id: 'pay-6', amount: 38000, paymentMethod: 'CASH', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 8).toISOString() },
    },
    {
      id: 'ord-7',
      orderNumber: 'KM-261014-1004',
      customerId: 'cust-6',
      customerName: 'Ahmad Fauzi',
      status: 'COMPLETED',
      totalAmount: 38000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 11).toISOString(),
      orderItems: [
        { id: 'oi-10', menuId: 'menu-1', quantity: 1, price: 18000, subtotal: 18000, menuName: 'Es Kopi Susu Gula Aren' },
        { id: 'oi-11', menuId: 'menu-2', quantity: 1, price: 15000, subtotal: 15000, menuName: 'Americano Cold Brew' },
      ],
      payment: { id: 'pay-7', amount: 38000, paymentMethod: 'QRIS', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 11).toISOString() },
    },
    {
      id: 'ord-8',
      orderNumber: 'KM-261013-1001',
      customerId: 'cust-3',
      customerName: 'Dimas Anggara',
      status: 'COMPLETED',
      totalAmount: 52000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4).toISOString(),
      orderItems: [
        { id: 'oi-12', menuId: 'menu-1', quantity: 2, price: 18000, subtotal: 36000, menuName: 'Es Kopi Susu Gula Aren' },
        { id: 'oi-13', menuId: 'menu-4', quantity: 1, price: 16000, subtotal: 16000, menuName: 'Butter Croissant Warm' },
      ],
      payment: { id: 'pay-8', amount: 52000, paymentMethod: 'BANK_TRANSFER', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4).toISOString() },
    },
    {
      id: 'ord-9',
      orderNumber: 'KM-261013-1002',
      customerId: 'cust-2',
      customerName: 'Siti Lestari',
      status: 'COMPLETED',
      totalAmount: 36000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 7).toISOString(),
      orderItems: [
        { id: 'oi-14', menuId: 'menu-1', quantity: 2, price: 18000, subtotal: 36000, menuName: 'Es Kopi Susu Gula Aren' },
      ],
      payment: { id: 'pay-9', amount: 36000, paymentMethod: 'QRIS', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 7).toISOString() },
    },
    {
      id: 'ord-10',
      orderNumber: 'KM-261012-1001',
      customerId: 'cust-1',
      customerName: 'Budi Mahasiswa',
      status: 'COMPLETED',
      totalAmount: 34000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 2).toISOString(),
      orderItems: [
        { id: 'oi-15', menuId: 'menu-1', quantity: 1, price: 18000, subtotal: 18000, menuName: 'Es Kopi Susu Gula Aren' },
        { id: 'oi-16', menuId: 'menu-4', quantity: 1, price: 16000, subtotal: 16000, menuName: 'Butter Croissant Warm' },
      ],
      payment: { id: 'pay-10', amount: 34000, paymentMethod: 'QRIS', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 2).toISOString() },
    },
    {
      id: 'ord-11',
      orderNumber: 'KM-261012-1002',
      customerId: 'cust-5',
      customerName: 'Rian Pratama',
      status: 'COMPLETED',
      totalAmount: 36000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 5).toISOString(),
      orderItems: [
        { id: 'oi-17', menuId: 'menu-1', quantity: 2, price: 18000, subtotal: 36000, menuName: 'Es Kopi Susu Gula Aren' },
      ],
      payment: { id: 'pay-11', amount: 36000, paymentMethod: 'CASH', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 5).toISOString() },
    },
    {
      id: 'ord-12',
      orderNumber: 'KM-261012-1003',
      customerId: 'cust-4',
      customerName: 'Nadia Putri',
      status: 'COMPLETED',
      totalAmount: 42000,
      notes: '',
      createdAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 9).toISOString(),
      orderItems: [
        { id: 'oi-18', menuId: 'menu-3', quantity: 1, price: 22000, subtotal: 22000, menuName: 'Matcha Creamy Latte' },
        { id: 'oi-19', menuId: 'menu-1', quantity: 1, price: 18000, subtotal: 18000, menuName: 'Es Kopi Susu Gula Aren' },
      ],
      payment: { id: 'pay-12', amount: 42000, paymentMethod: 'QRIS', status: 'PAID', paidAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 9).toISOString() },
    },
  ],
  purchases: [
    {
      id: 'pur-1',
      purchaseNumber: 'PO-260901-001',
      supplierId: 'sup-1',
      supplierName: 'CV Kopi Jaya Supplier',
      totalAmount: 1500000,
      status: 'RECEIVED',
      notes: 'Pengadaan Biji Kopi Arabika 10kg',
      receivedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      items: [
        { id: 'pi-1', ingredientId: 'ing-1', ingredientName: 'Biji Kopi Arabika Houseblend', quantity: 10000, unitCost: 150, subtotal: 1500000 },
      ],
    },
  ],
  stockHistory: [
    { id: 'sh-1', ingredientId: 'ing-1', ingredientName: 'Biji Kopi Arabika Houseblend', type: 'IN', quantity: 10000, reason: 'Pembelian Bahan Baku PO-260901-001', referenceId: 'PO-260901-001', createdAt: new Date(Date.now() - 3600000 * 48).toISOString() },
    { id: 'sh-2', ingredientId: 'ing-1', ingredientName: 'Biji Kopi Arabika Houseblend', type: 'OUT', quantity: 36, reason: 'Penggunaan Resep Pesanan KM-260903-1001', referenceId: 'KM-260903-1001', createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  ],
  reviews: [
    { id: 'rev-1', menuId: 'menu-1', customerId: 'cust-1', customerName: 'Budi Mahasiswa', rating: 5, comment: 'Es Kopi Gula Aren-nya pas banget manisnya dan kopinya kerasa mantap!', createdAt: new Date().toISOString() },
  ]
};

// Database Query Wrapper with Smart Connection Caching (Zero-lag fallback)
let postgresOnline: boolean | null = null;
let lastPostgresCheck = 0;

export async function isPostgresAvailable(): Promise<boolean> {
  const now = Date.now();
  if (postgresOnline === false && now - lastPostgresCheck < 30000) {
    return false;
  }
  if (postgresOnline === true && now - lastPostgresCheck < 10000) {
    return true;
  }
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 1500)),
    ]);
    postgresOnline = true;
    lastPostgresCheck = now;
    return true;
  } catch {
    postgresOnline = false;
    lastPostgresCheck = now;
    return false;
  }
}

export async function getDbUsers() {
  if (await isPostgresAvailable()) {
    try {
      const users = await prisma.user.findMany({ include: { customer: true, employee: true, supplier: true } });
      if (users.length > 0) return users;
    } catch {}
  }
  return memoryStore.users;
}

export async function getDbUserByEmail(email: string) {
  if (await isPostgresAvailable()) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true, employee: true, supplier: true },
      });
      if (user) return user;
    } catch {}
  }
  return memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getDbCategories() {
  if (await isPostgresAvailable()) {
    try {
      const categories = await prisma.category.findMany({ include: { _count: { select: { menus: true } } } });
      if (categories.length > 0) return categories;
    } catch {}
  }
  return memoryStore.categories;
}

export async function getDbMenus() {
  if (await isPostgresAvailable()) {
    try {
      const menus = await prisma.menu.findMany({ include: { category: true, recipes: { include: { ingredient: true } } } });
      if (menus.length > 0) return menus;
    } catch {}
  }
  return memoryStore.menus.map(m => ({
    ...m,
    category: memoryStore.categories.find(c => c.id === m.categoryId),
    recipes: memoryStore.recipes.filter(r => r.menuId === m.id).map(r => ({
      ...r,
      ingredient: memoryStore.ingredients.find(i => i.id === r.ingredientId)
    }))
  }));
}

export async function getDbIngredients() {
  if (await isPostgresAvailable()) {
    try {
      const ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
      if (ingredients.length > 0) return ingredients;
    } catch {}
  }
  return memoryStore.ingredients;
}

export async function getDbSuppliers() {
  if (await isPostgresAvailable()) {
    try {
      const suppliers = await prisma.supplier.findMany();
      if (suppliers.length > 0) return suppliers;
    } catch {}
  }
  return memoryStore.suppliers;
}

export async function getDbOrders() {
  if (await isPostgresAvailable()) {
    try {
      const orders = await prisma.order.findMany({
        include: { orderItems: { include: { menu: true } }, payment: true },
        orderBy: { createdAt: 'desc' },
      });
      if (orders.length > 0) return orders;
    } catch {}
  }
  return memoryStore.orders;
}

export async function getDbPurchases() {
  if (await isPostgresAvailable()) {
    try {
      const purchases = await prisma.purchase.findMany({
        include: { supplier: true, items: { include: { ingredient: true } } },
        orderBy: { createdAt: 'desc' },
      });
      if (purchases.length > 0) return purchases;
    } catch {}
  }
  return memoryStore.purchases;
}

export async function getDbStockHistory() {
  if (await isPostgresAvailable()) {
    try {
      const history = await prisma.stockHistory.findMany({
        include: { ingredient: true },
        orderBy: { createdAt: 'desc' },
      });
      if (history.length > 0) return history;
    } catch {}
  }
  return memoryStore.stockHistory;
}

export async function getDbCustomers() {
  if (await isPostgresAvailable()) {
    try {
      const customers = await prisma.customer.findMany({
        include: {
          user: true,
          orders: {
            include: { payment: true, orderItems: { include: { menu: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (customers.length > 0) return customers;
    } catch {}
  }
  return memoryStore.customers.map((c) => ({
    ...c,
    user: memoryStore.users.find((u) => u.id === c.userId),
    orders: memoryStore.orders.filter((o) => o.customerId === c.id),
  }));
}

export interface DailyCustomerStat {
  dateKey: string;
  formattedDate: string;
  relativeLabel: string;
  uniqueCustomerCount: number;
  customerNames: string[];
  newCustomersRegistered: number;
  newCustomerNames: string[];
  totalOrders: number;
  totalRevenue: number;
}

export interface CustomerStatsSummary {
  totalRegisteredCustomers: number;
  totalAllTimeOrders: number;
  totalAllTimeRevenue: number;
  todayStats: DailyCustomerStat;
  yesterdayStats: DailyCustomerStat;
  dailyStats: DailyCustomerStat[];
  avgDailyCustomers: number;
  avgDailyOrders: number;
  topCustomers: { name: string; points: number; totalSpent: number; totalOrders: number }[];
}

export async function getDbCustomerDailyStats(): Promise<CustomerStatsSummary> {
  const [customers, orders] = await Promise.all([
    getDbCustomers(),
    getDbOrders(),
  ]);

  const toWibDateKey = (dateStr: string | Date): string => {
    const d = new Date(dateStr);
    const wibMs = d.getTime() + 7 * 3600 * 1000;
    return new Date(wibMs).toISOString().slice(0, 10);
  };

  const todayKey = toWibDateKey(new Date());
  const yesterdayKey = toWibDateKey(new Date(Date.now() - 86400000));

  const dateKeysSet = new Set<string>();
  dateKeysSet.add(todayKey);
  dateKeysSet.add(yesterdayKey);

  orders.forEach((o: any) => {
    if (o.createdAt) dateKeysSet.add(toWibDateKey(o.createdAt));
  });

  customers.forEach((c: any) => {
    if (c.createdAt) dateKeysSet.add(toWibDateKey(c.createdAt));
  });

  const sortedDateKeys = Array.from(dateKeysSet).sort((a, b) => b.localeCompare(a));

  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const dailyStats: DailyCustomerStat[] = sortedDateKeys.map((key) => {
    let relativeLabel = '';
    if (key === todayKey) relativeLabel = 'Hari ini';
    else if (key === yesterdayKey) relativeLabel = 'Kemarin';
    else {
      const diffDays = Math.round((new Date(todayKey).getTime() - new Date(key).getTime()) / 86400000);
      relativeLabel = `${diffDays} hari lalu`;
    }

    const dayOrders = orders.filter((o: any) => toWibDateKey(o.createdAt) === key);
    const uniqueCustomerNamesSet = new Set<string>();
    let totalRevenue = 0;

    dayOrders.forEach((o: any) => {
      const name = o.customerName || o.customer?.user?.name || 'Pelanggan Walk-in';
      uniqueCustomerNamesSet.add(name);
      totalRevenue += Number(o.totalAmount || 0);
    });

    const dayCustomers = customers.filter((c: any) => c.createdAt && toWibDateKey(c.createdAt) === key);
    const newCustomerNames = dayCustomers.map((c: any) => c.user?.name || 'Member Baru');

    const [y, m, d] = key.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 5, 0, 0));
    const formattedDate = dateFormatter.format(dateObj);

    return {
      dateKey: key,
      formattedDate,
      relativeLabel,
      uniqueCustomerCount: uniqueCustomerNamesSet.size,
      customerNames: Array.from(uniqueCustomerNamesSet),
      newCustomersRegistered: dayCustomers.length,
      newCustomerNames,
      totalOrders: dayOrders.length,
      totalRevenue,
    };
  });

  const customerSpendMap = new Map<string, { name: string; points: number; totalSpent: number; totalOrders: number }>();
  customers.forEach((c: any) => {
    const name = c.user?.name || 'Member';
    customerSpendMap.set(c.id, {
      name,
      points: c.points || 0,
      totalSpent: 0,
      totalOrders: 0,
    });
  });

  let totalAllTimeRevenue = 0;
  orders.forEach((o: any) => {
    totalAllTimeRevenue += Number(o.totalAmount || 0);
    if (o.customerId && customerSpendMap.has(o.customerId)) {
      const record = customerSpendMap.get(o.customerId)!;
      record.totalSpent += Number(o.totalAmount || 0);
      record.totalOrders += 1;
    }
  });

  const topCustomers = Array.from(customerSpendMap.values())
    .sort((a, b) => b.points - a.points || b.totalOrders - a.totalOrders)
    .slice(0, 5);

  const todayStats = dailyStats.find((d) => d.dateKey === todayKey) || {
    dateKey: todayKey,
    formattedDate: dateFormatter.format(new Date()),
    relativeLabel: 'Hari ini',
    uniqueCustomerCount: 0,
    customerNames: [],
    newCustomersRegistered: 0,
    newCustomerNames: [],
    totalOrders: 0,
    totalRevenue: 0,
  };

  const yesterdayStats = dailyStats.find((d) => d.dateKey === yesterdayKey) || {
    dateKey: yesterdayKey,
    formattedDate: dateFormatter.format(new Date(Date.now() - 86400000)),
    relativeLabel: 'Kemarin',
    uniqueCustomerCount: 0,
    customerNames: [],
    newCustomersRegistered: 0,
    newCustomerNames: [],
    totalOrders: 0,
    totalRevenue: 0,
  };

  const recordedDays = dailyStats.filter((d) => d.totalOrders > 0 || d.newCustomersRegistered > 0);
  const totalDays = Math.max(1, recordedDays.length);
  const totalActiveSum = recordedDays.reduce((acc, curr) => acc + curr.uniqueCustomerCount, 0);
  const totalOrderSum = recordedDays.reduce((acc, curr) => acc + curr.totalOrders, 0);

  return {
    totalRegisteredCustomers: customers.length,
    totalAllTimeOrders: orders.length,
    totalAllTimeRevenue,
    todayStats,
    yesterdayStats,
    dailyStats,
    avgDailyCustomers: Math.round((totalActiveSum / totalDays) * 10) / 10,
    avgDailyOrders: Math.round((totalOrderSum / totalDays) * 10) / 10,
    topCustomers,
  };
}

export async function getDbGeneralStats() {
  const [menus, categories, ingredients, orders, customers] = await Promise.all([
    getDbMenus(),
    getDbCategories(),
    getDbIngredients(),
    getDbOrders(),
    getDbCustomers(),
  ]);

  const lowStock = ingredients.filter((i) => i.stock <= i.minStock);
  const availableMenus = menus.filter((m) => m.isAvailable);

  return {
    totalCustomers: customers.length,
    totalOrders: orders.length,
    totalMenus: menus.length,
    availableMenus: availableMenus.length,
    totalCategories: categories.length,
    totalIngredients: ingredients.length,
    lowStockIngredients: lowStock.map((i) => ({ name: i.name, stock: i.stock, unit: i.unit })),
  };
}

export interface CafeTable {
  id: string;
  tableNumber: string;
  name: string;
  zone: 'INDOOR_AC' | 'OUTDOOR_SMOKING' | 'MEZZANINE_QUIET_ZONE';
  zoneLabel: string;
  capacity: number;
  hasPowerOutlet: boolean;
  powerOutletCount: number;
  isAvailable: boolean;
  features: string[];
}

export interface CafePromo {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  terms: string;
  validUntil: string;
  isActive: boolean;
  badge: string;
}

export interface StoreInfo {
  name: string;
  tagline: string;
  location: {
    address: string;
    landmark: string;
    campusArea: string;
    mapsUrl: string;
  };
  operationalHours: {
    dineIn: string;
    onlineDelivery: string;
    aiBotSupport: string;
  };
  facilities: string[];
  paymentMethods: string[];
  contact: {
    phone: string;
    instagram: string;
    email: string;
  };
}

const defaultTables: CafeTable[] = [
  {
    id: 'tbl-1',
    tableNumber: 'Meja 01',
    name: 'Sofa Corner Bar',
    zone: 'INDOOR_AC',
    zoneLabel: 'Indoor AC (Main Hall)',
    capacity: 4,
    hasPowerOutlet: true,
    powerOutletCount: 4,
    isAvailable: true,
    features: ['Sofa empuk', 'AC dingin', 'Dekat bar & kasir', 'WiFi super kencang'],
  },
  {
    id: 'tbl-2',
    tableNumber: 'Meja 02',
    name: 'Duo Study Table',
    zone: 'INDOOR_AC',
    zoneLabel: 'Indoor AC (Main Hall)',
    capacity: 2,
    hasPowerOutlet: true,
    powerOutletCount: 2,
    isAvailable: false,
    features: ['Meja kompak nugas berdua', 'Colokan langsung di meja', 'Kursi kayu ergonomis'],
  },
  {
    id: 'tbl-3',
    tableNumber: 'Meja 03',
    name: 'Skripsi Focus Pod A',
    zone: 'MEZZANINE_QUIET_ZONE',
    zoneLabel: 'Mezzanine Quiet Zone (Lantai 2)',
    capacity: 6,
    hasPowerOutlet: true,
    powerOutletCount: 6,
    isAvailable: true,
    features: ['Zona Hening Khusus Skripsi/Tugas', 'Colokan per kursi', 'Lampu belajar warm', 'Meja kayu lebar'],
  },
  {
    id: 'tbl-4',
    tableNumber: 'Meja 04',
    name: 'Skripsi Focus Pod B',
    zone: 'MEZZANINE_QUIET_ZONE',
    zoneLabel: 'Mezzanine Quiet Zone (Lantai 2)',
    capacity: 4,
    hasPowerOutlet: true,
    powerOutletCount: 4,
    isAvailable: true,
    features: ['Zona Tenang', 'Colokan 4 port', 'Pemandangan taman kampus'],
  },
  {
    id: 'tbl-5',
    tableNumber: 'Meja 05',
    name: 'Garden Terrace Alpha',
    zone: 'OUTDOOR_SMOKING',
    zoneLabel: 'Outdoor Garden (Smoking Area)',
    capacity: 4,
    hasPowerOutlet: true,
    powerOutletCount: 2,
    isAvailable: true,
    features: ['Area terbuka sejuk', 'Boleh merokok/vaping', 'Dekat tanaman hias', 'Boardgames ready'],
  },
  {
    id: 'tbl-6',
    tableNumber: 'Meja 06',
    name: 'Garden Terrace Beta',
    zone: 'OUTDOOR_SMOKING',
    zoneLabel: 'Outdoor Garden (Smoking Area)',
    capacity: 4,
    hasPowerOutlet: true,
    powerOutletCount: 2,
    isAvailable: false,
    features: ['Area terbuka', 'Cocok untuk diskusi santai', 'Colokan tahan air'],
  },
];

const defaultPromos: CafePromo[] = [
  {
    id: 'prm-1',
    code: 'MHS2026',
    title: 'Special Mahasiswa Promo 2026',
    description: 'Diskon 20% untuk semua varian minuman kopi racikan',
    discount: '20% OFF',
    terms: 'Tunjukkan Kartu Tanda Mahasiswa (KTM) aktif saat pesan atau klaim kode promo ini di checkout.',
    validUntil: '31 Desember 2026',
    isActive: true,
    badge: '🔥 Promo Utama 2026',
  },
  {
    id: 'prm-2',
    code: 'NUGASBEGADANG',
    title: 'Paket Kombo Nugas Begadang',
    description: 'Americano Cold Brew / Kopi Susu Aren + Warm Butter Croissant',
    discount: 'Hemat Rp 6.000 (Cuma Rp 28.000)',
    terms: 'Berlaku setiap hari mulai pukul 18.00 - 04.00 WIB untuk menemani deadline tugasmu.',
    validUntil: 'Sepanjang Semester Ini',
    isActive: true,
    badge: '🌙 Andalan Begadang',
  },
  {
    id: 'prm-3',
    code: 'HAPPYHOUR',
    title: 'Happy Hour Nugas Siang',
    description: 'Beli 2 Minuman Varian Bebas, Dapatkan Gratis 1 Pastry Renyah',
    discount: 'FREE 1 Pastry',
    terms: 'Berlaku Senin s/d Kamis jam 14.00 - 17.00 WIB untuk dine-in maupun takeaway.',
    validUntil: 'Berlaku Selamanya',
    isActive: true,
    badge: '⚡ Happy Hour',
  },
  {
    id: 'prm-4',
    code: 'MEMBERKOPI',
    title: 'Cashback Poin Loyalty Mahasiswa',
    description: 'Setiap belanja Rp 10.000 dapatkan 10 Poin Loyalty. Kumpulkan 100 Poin untuk 1 Cup Kopi Gratis!',
    discount: 'Cashback Poin',
    terms: 'Otomatis masuk ke akun member terdaftar setiap transaksi selesai.',
    validUntil: 'Permanen',
    isActive: true,
    badge: '🎁 Loyalty Reward',
  },
];

const storeInformation: StoreInfo = {
  name: 'Kopi Mahasiswa Campus Hub',
  tagline: 'Rasa Bintang Lima, Harga Pas di Kantong Mahasiswa',
  location: {
    address: 'Gedung Student Center Lt. 1, Kantin Barat Utama Kampus',
    landmark: 'Tepat di depan Perpustakaan Pusat & Gazebo Mahasiswa',
    campusArea: 'Kampus Terpadu, Zona Kuliner Mahasiswa',
    mapsUrl: 'https://maps.google.com/?q=Kopi+Mahasiswa+Campus',
  },
  operationalHours: {
    dineIn: 'Setiap Hari (Senin - Minggu) 08.00 - 23.00 WIB',
    onlineDelivery: 'Pemesanan Web & Pick-up: 08.00 - 23.00 WIB',
    aiBotSupport: '24 Jam Nonstop (24/7 Siaga Barista AI)',
  },
  facilities: [
    '📶 Dedicated High-Speed Free WiFi 100 Mbps (SSID: KopiMahasiswa-HighSpeed)',
    '🔌 Stopkontak Listrik di setiap meja (Indoor AC & Mezzanine Quiet Zone)',
    '🤫 Mezzanine Quiet Zone (Lantai 2 khusus nugas hening, skripsi, & coding)',
    '🌿 Outdoor Garden Smoking Area (Sirkulasi udara terbuka & santai)',
    '🕌 Musholla Bersih ber-AC & Tempat Wudhu Terpisah',
    '🚻 Toilet bersih pria & wanita',
    '🎲 Boardgames & Kartu Uno gratis dimainkan',
    '🖨️ Mini Print Station di Kasir (Print tugas A4 darurat gratis s/d 5 lembar)',
  ],
  paymentMethods: [
    'QRIS Instan (GoPay, OVO, ShopeePay, DANA, LinkAja, BCA, Mandiri, BRI)',
    'CASH / Tunai di Kasir Outlet',
    'Transfer Bank Otomatis',
  ],
  contact: {
    phone: '0812-3456-7890 (WhatsApp Kasir/Barista)',
    instagram: '@kopimahasiswa.id',
    email: 'halo@kopimahasiswa.id',
  },
};

export async function getDbTables(): Promise<CafeTable[]> {
  return defaultTables;
}

export async function getDbPromos(): Promise<CafePromo[]> {
  return defaultPromos.filter((p) => p.isActive);
}

export async function getStoreInfo(): Promise<StoreInfo> {
  return storeInformation;
}

export { memoryStore };
