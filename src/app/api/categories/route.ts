import { NextResponse } from 'next/server';
import { getDbCategories, memoryStore } from '@/lib/db-store';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const categories = await getDbCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    await requireAuth(['ADMIN']);
    const body = await request.json();
    const { name, description, imageUrl } = body;

    if (!name) {
      return NextResponse.json({ message: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
      const category = await prisma.category.create({
        data: { name, slug, description: description || '', imageUrl: imageUrl || '' },
      });
      return NextResponse.json(category, { status: 201 });
    } catch {
      // Memory fallback
      const newCat = {
        id: `cat-${Date.now()}`,
        name,
        slug,
        description: description || '',
        imageUrl: imageUrl || '',
      };
      memoryStore.categories.push(newCat);
      return NextResponse.json(newCat, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Error' }, { status: err.message === 'UNAUTHORIZED' ? 401 : 403 });
  }
}
