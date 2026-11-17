import { NextResponse } from 'next/server';
import { getDbMenus, memoryStore } from '@/lib/db-store';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SystemNotificationService } from '@/lib/system-notifications';

export async function GET() {
  const menus = await getDbMenus();
  return NextResponse.json(menus);
}

export async function POST(request: Request) {
  try {
    await requireAuth(['ADMIN']);
    const body = await request.json();
    const { categoryId, name, description, price, imageUrl, isAvailable, recipes } = body;

    if (!categoryId || !name || price === undefined) {
      return NextResponse.json({ message: 'Kategori, Nama, dan Harga wajib diisi' }, { status: 400 });
    }

    try {
      const menu = await prisma.menu.create({
        data: {
          categoryId,
          name,
          description: description || '',
          price: parseFloat(price),
          imageUrl: imageUrl || '',
          isAvailable: isAvailable !== undefined ? isAvailable : true,
          recipes: recipes && Array.isArray(recipes) ? {
            create: recipes.map((r: { ingredientId: string; quantity: number }) => ({
              ingredientId: r.ingredientId,
              quantity: parseFloat(r.quantity as any),
            }))
          } : undefined
        },
        include: { category: true, recipes: { include: { ingredient: true } } }
      });

      // Notifikasi Otomatis: Produk Baru Ditambahkan
      SystemNotificationService.notifyNewProduct({
        productId: menu.id,
        name: menu.name,
        price: menu.price,
        categoryName: menu.category?.name,
      }).catch((err) => console.error('Failed to notify new product:', err));

      return NextResponse.json(menu, { status: 201 });
    } catch {
      // Memory fallback
      const menuId = `menu-${Date.now()}`;
      const newMenu = {
        id: menuId,
        categoryId,
        name,
        description: description || '',
        price: parseFloat(price),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop',
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      };
      memoryStore.menus.push(newMenu as any);

      if (recipes && Array.isArray(recipes)) {
        for (const r of recipes) {
          memoryStore.recipes.push({
            id: `rec-${Date.now()}-${Math.random()}`,
            menuId,
            ingredientId: r.ingredientId,
            quantity: parseFloat(r.quantity),
          });
        }
      }

      SystemNotificationService.notifyNewProduct({
        productId: newMenu.id,
        name: newMenu.name,
        price: newMenu.price,
      }).catch((err) => console.error('Failed to notify new product (memory):', err));

      return NextResponse.json(newMenu, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Error' }, { status: 403 });
  }
}
