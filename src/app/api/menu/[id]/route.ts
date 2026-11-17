import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { memoryStore } from '@/lib/db-store';
import prisma from '@/lib/prisma';
import { SystemNotificationService } from '@/lib/system-notifications';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = params;
    const body = await request.json();
    const { categoryId, name, description, price, imageUrl, isAvailable, recipes } = body;

    try {
      const oldMenu = await prisma.menu.findUnique({ where: { id } });
      if (!oldMenu) {
        return NextResponse.json({ message: 'Menu tidak ditemukan' }, { status: 404 });
      }

      const updated = await prisma.menu.update({
        where: { id },
        data: {
          categoryId,
          name,
          description,
          price: price !== undefined ? parseFloat(price) : undefined,
          imageUrl,
          isAvailable,
        },
      });

      // 1. Notifikasi Perubahan Status Ketersediaan (Tersedia / Habis)
      if (isAvailable !== undefined && isAvailable !== oldMenu.isAvailable) {
        SystemNotificationService.notifyProductAvailability({
          productId: updated.id,
          name: updated.name,
          isAvailable: updated.isAvailable,
        }).catch((err) => console.error('Failed to notify availability change:', err));
      }

      // 2. Notifikasi Perubahan Informasi Produk (Nama, Harga, Deskripsi, Gambar)
      const changeParts: string[] = [];
      if (name && name !== oldMenu.name) changeParts.push(`nama diubah ke "${name}"`);
      if (price !== undefined && parseFloat(price) !== oldMenu.price) {
        changeParts.push(`harga diubah ke ${SystemNotificationService.formatRupiah(parseFloat(price))}`);
      }
      if (description !== undefined && description !== oldMenu.description) changeParts.push('deskripsi diperbarui');
      if (imageUrl !== undefined && imageUrl !== oldMenu.imageUrl) changeParts.push('foto produk diperbarui');

      if (changeParts.length > 0) {
        SystemNotificationService.notifyProductUpdated({
          productId: updated.id,
          name: updated.name,
          changes: changeParts.join(', '),
          price: updated.price,
        }).catch((err) => console.error('Failed to notify product update:', err));
      }

      return NextResponse.json(updated);
    } catch {
      const idx = memoryStore.menus.findIndex((m) => m.id === id);
      if (idx !== -1) {
        const oldMenu = { ...memoryStore.menus[idx] };
        if (categoryId) memoryStore.menus[idx].categoryId = categoryId;
        if (name) memoryStore.menus[idx].name = name;
        if (description !== undefined) memoryStore.menus[idx].description = description;
        if (price !== undefined) memoryStore.menus[idx].price = parseFloat(price);
        if (imageUrl !== undefined) memoryStore.menus[idx].imageUrl = imageUrl;
        if (isAvailable !== undefined) memoryStore.menus[idx].isAvailable = isAvailable;

        if (isAvailable !== undefined && isAvailable !== oldMenu.isAvailable) {
          SystemNotificationService.notifyProductAvailability({
            productId: id,
            name: memoryStore.menus[idx].name,
            isAvailable: memoryStore.menus[idx].isAvailable,
          }).catch((err) => console.error('Failed to notify availability (mem):', err));
        }

        const changeParts: string[] = [];
        if (name && name !== oldMenu.name) changeParts.push(`nama diubah ke "${name}"`);
        if (price !== undefined && parseFloat(price) !== oldMenu.price) {
          changeParts.push(`harga diubah ke ${SystemNotificationService.formatRupiah(parseFloat(price))}`);
        }
        if (changeParts.length > 0) {
          SystemNotificationService.notifyProductUpdated({
            productId: id,
            name: memoryStore.menus[idx].name,
            changes: changeParts.join(', '),
            price: memoryStore.menus[idx].price,
          }).catch((err) => console.error('Failed to notify update (mem):', err));
        }

        return NextResponse.json(memoryStore.menus[idx]);
      }
      return NextResponse.json({ message: 'Menu tidak ditemukan' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = params;

    try {
      const existing = await prisma.menu.findUnique({ where: { id } });
      const menuName = existing?.name || 'Produk';

      await prisma.menu.delete({ where: { id } });

      // Notifikasi Otomatis: Produk Dihapus
      SystemNotificationService.notifyProductDeleted({
        productId: id,
        name: menuName,
      }).catch((err) => console.error('Failed to notify product deletion:', err));

      return NextResponse.json({ message: 'Menu berhasil dihapus' });
    } catch {
      const idx = memoryStore.menus.findIndex((m) => m.id === id);
      if (idx !== -1) {
        const menuName = memoryStore.menus[idx].name;
        memoryStore.menus.splice(idx, 1);

        SystemNotificationService.notifyProductDeleted({
          productId: id,
          name: menuName,
        }).catch((err) => console.error('Failed to notify product deletion (mem):', err));

        return NextResponse.json({ message: 'Menu berhasil dihapus' });
      }
      return NextResponse.json({ message: 'Menu tidak ditemukan' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}
