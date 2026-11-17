import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod, PurchaseStatus, StockType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'kopi-mahasiswa-secret-key-2026';

function hashPassword(password: string): string {
  return crypto.createHmac('sha256', SECRET_KEY).update(password).digest('hex');
}

export async function main() {
  console.log('Seeding Kopi Mahasiswa database...');

  // 1. Clean existing records if any
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.recipe.deleteMany(),
    prisma.purchaseItem.deleteMany(),
    prisma.purchase.deleteMany(),
    prisma.stockHistory.deleteMany(),
    prisma.ingredient.deleteMany(),
    prisma.menu.deleteMany(),
    prisma.category.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // 2. Users & Roles
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Utama',
      email: 'adminkopimahasiswa@gmail.com',
      password: hashPassword('admin'),
      role: Role.ADMIN,
      phone: '081234567890',
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      name: 'Pak Owner',
      email: 'ownerkopimahasiswa@gmail.com',
      password: hashPassword('owner'),
      role: Role.OWNER,
      phone: '081234567891',
    },
  });

  const kasirUser = await prisma.user.create({
    data: {
      name: 'Mbak Kasir',
      email: 'kasirkopimahasiswa@gmail.com',
      password: hashPassword('kasir'),
      role: Role.KASIR,
      phone: '081234567892',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: 'Budi Mahasiswa',
      email: 'pelanggankopimahasiswa@gmail.com',
      password: hashPassword('pelanggan'),
      role: Role.PELANGGAN,
      phone: '081234567893',
    },
  });

  const supplierUser = await prisma.user.create({
    data: {
      name: 'CV Kopi Jaya',
      email: 'supplierkopimahasiswa@gmail.com',
      password: hashPassword('supplier'),
      role: Role.SUPPLIER,
      phone: '081234567894',
    },
  });

  // Create Customer & Employee profiles
  const customerProfile = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      address: 'Asrama Mahasiswa Kampus A No. 12',
      points: 150,
    },
  });

  await prisma.employee.create({
    data: {
      userId: kasirUser.id,
      position: 'Senior Barista & Kasir',
      salary: 3500000,
    },
  });

  const supplierProfile = await prisma.supplier.create({
    data: {
      userId: supplierUser.id,
      name: 'CV Kopi Jaya Supplier',
      contactName: 'Pak Hadi',
      phone: '081234567894',
      email: 'supplierkopimahasiswa@gmail.com',
      address: 'Jl. Merdeka No. 45, Bandung',
    },
  });

  // 3. Categories
  const catKopi = await prisma.category.create({
    data: {
      name: 'Kopi Signature',
      slug: 'kopi-signature',
      description: 'Variasi olahan kopi espresso racikan asli Kopi Mahasiswa',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop',
    },
  });

  const catNonKopi = await prisma.category.create({
    data: {
      name: 'Non-Kopi',
      slug: 'non-kopi',
      description: 'Minuman segar dan creamy tanpa kandungan kafein',
      imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop',
    },
  });

  const catSnack = await prisma.category.create({
    data: {
      name: 'Snack & Pastry',
      slug: 'snack-pastry',
      description: 'Camilan renyah dan kue pendamping aktivitas belajar',
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop',
    },
  });

  // 4. Ingredients (Bahan Baku)
  const ingEspresso = await prisma.ingredient.create({
    data: {
      name: 'Biji Kopi Arabika Houseblend',
      unit: 'gram',
      stock: 5000,
      minStock: 1000,
      costPerUnit: 150,
    },
  });

  const ingSusu = await prisma.ingredient.create({
    data: {
      name: 'Susu Fresh Milk UHT',
      unit: 'ml',
      stock: 20000,
      minStock: 5000,
      costPerUnit: 20,
    },
  });

  const ingGulaAren = await prisma.ingredient.create({
    data: {
      name: 'Sirup Gula Aren Organik',
      unit: 'ml',
      stock: 8000,
      minStock: 2000,
      costPerUnit: 30,
    },
  });

  const ingMatcha = await prisma.ingredient.create({
    data: {
      name: 'Bubuk Matcha Premium Uji',
      unit: 'gram',
      stock: 1500,
      minStock: 300,
      costPerUnit: 400,
    },
  });

  const ingCroissant = await prisma.ingredient.create({
    data: {
      name: 'Croissant Dough Butter',
      unit: 'pcs',
      stock: 25,
      minStock: 10,
      costPerUnit: 8000,
    },
  });

  await prisma.ingredient.create({
    data: {
      name: 'Kopi Gadang',
      unit: 'gram',
      stock: 6,
      minStock: 20,
    },
  });

  // 5. Menus
  const menuEsKopiGulaAren = await prisma.menu.create({
    data: {
      categoryId: catKopi.id,
      name: 'Es Kopi Susu Gula Aren',
      description: 'Espresso double shot dipadu susu segar dingin dan racikan gula aren alami khas Nusantara',
      price: 18000,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop',
    },
  });

  const menuAmericano = await prisma.menu.create({
    data: {
      categoryId: catKopi.id,
      name: 'Americano Cold Brew',
      description: 'Ekstrak kopi Arabika murni dengan es batu segar dan aroma rempah kopi lembut',
      price: 15000,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop',
    },
  });

  const menuMatchaLatte = await prisma.menu.create({
    data: {
      categoryId: catNonKopi.id,
      name: 'Matcha Creamy Latte',
      description: 'Bubuk Matcha Uji Kyoto dipadukan susu uht manis nan gurih',
      price: 22000,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop',
    },
  });

  const menuCroissant = await prisma.menu.create({
    data: {
      categoryId: catSnack.id,
      name: 'Butter Croissant Warm',
      description: 'Pastry renyah dipanggang hangat dengan aroma mentega Perancis yang menggugah selera',
      price: 16000,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop',
    },
  });

  // 6. Recipes
  await prisma.recipe.createMany({
    data: [
      { menuId: menuEsKopiGulaAren.id, ingredientId: ingEspresso.id, quantity: 18 },
      { menuId: menuEsKopiGulaAren.id, ingredientId: ingSusu.id, quantity: 120 },
      { menuId: menuEsKopiGulaAren.id, ingredientId: ingGulaAren.id, quantity: 30 },
      { menuId: menuAmericano.id, ingredientId: ingEspresso.id, quantity: 18 },
      { menuId: menuMatchaLatte.id, ingredientId: ingMatcha.id, quantity: 15 },
      { menuId: menuMatchaLatte.id, ingredientId: ingSusu.id, quantity: 150 },
      { menuId: menuCroissant.id, ingredientId: ingCroissant.id, quantity: 1 },
    ],
  });

  // 7. Orders & Payments (Completed sample data)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'KM-260903-1001',
      customerId: customerProfile.id,
      customerName: customerUser.name,
      status: OrderStatus.COMPLETED,
      totalAmount: 36000,
      notes: 'Es batu sedikit saja',
      orderItems: {
        create: [
          {
            menuId: menuEsKopiGulaAren.id,
            quantity: 2,
            price: 18000,
            subtotal: 36000,
          },
        ],
      },
      payment: {
        create: {
          amount: 36000,
          paymentMethod: PaymentMethod.QRIS,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'KM-260903-1002',
      customerId: customerProfile.id,
      customerName: customerUser.name,
      status: OrderStatus.PROCESSING,
      totalAmount: 38000,
      notes: 'Dipacking aman',
      orderItems: {
        create: [
          { menuId: menuMatchaLatte.id, quantity: 1, price: 22000, subtotal: 22000 },
          { menuId: menuCroissant.id, quantity: 1, price: 16000, subtotal: 16000 },
        ],
      },
      payment: {
        create: {
          amount: 38000,
          paymentMethod: PaymentMethod.CASH,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      },
    },
  });

  // 8. Purchases
  await prisma.purchase.create({
    data: {
      purchaseNumber: 'PO-260901-001',
      supplierId: supplierProfile.id,
      totalAmount: 1500000,
      status: PurchaseStatus.RECEIVED,
      notes: 'Pengadaan Biji Kopi Arabika 10kg',
      receivedAt: new Date(),
      items: {
        create: [
          {
            ingredientId: ingEspresso.id,
            quantity: 10000,
            unitCost: 150,
            subtotal: 1500000,
          },
        ],
      },
    },
  });

  // 9. Stock History
  await prisma.stockHistory.create({
    data: {
      ingredientId: ingEspresso.id,
      type: StockType.IN,
      quantity: 10000,
      reason: 'Pembelian Bahan Baku PO-260901-001',
      referenceId: 'PO-260901-001',
    },
  });

  // 10. Sample Review
  await prisma.review.create({
    data: {
      menuId: menuEsKopiGulaAren.id,
      customerId: customerProfile.id,
      rating: 5,
      comment: 'Es Kopi Gula Aren-nya pas banget manisnya dan kopinya kerasa mantap!',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
