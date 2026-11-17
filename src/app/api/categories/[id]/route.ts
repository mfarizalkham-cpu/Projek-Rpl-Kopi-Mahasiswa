import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { memoryStore } from '@/lib/db-store';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = params;
    const body = await request.json();
    const { name, description, imageUrl } = body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : undefined;

    try {
      const updated = await prisma.category.update({
        where: { id },
        data: { name, slug, description, imageUrl },
      });
      return NextResponse.json(updated);
    } catch {
      const idx = memoryStore.categories.findIndex((c) => c.id === id);
      if (idx !== -1) {
        if (name) memoryStore.categories[idx].name = name;
        if (slug) memoryStore.categories[idx].slug = slug;
        if (description !== undefined) memoryStore.categories[idx].description = description;
        if (imageUrl !== undefined) memoryStore.categories[idx].imageUrl = imageUrl;
        return NextResponse.json(memoryStore.categories[idx]);
      }
      return NextResponse.json({ message: 'Kategori tidak ditemukan' }, { status: 404 });
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
      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ message: 'Kategori berhasil dihapus' });
    } catch {
      const idx = memoryStore.categories.findIndex((c) => c.id === id);
      if (idx !== -1) {
        memoryStore.categories.splice(idx, 1);
        return NextResponse.json({ message: 'Kategori berhasil dihapus' });
      }
      return NextResponse.json({ message: 'Kategori tidak ditemukan' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}
