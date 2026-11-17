import { NextResponse } from 'next/server';
import { getDbIngredients, getDbStockHistory, memoryStore } from '@/lib/db-store';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const ingredients = await getDbIngredients();
  const stockHistory = await getDbStockHistory();
  return NextResponse.json({ ingredients, stockHistory });
}

export async function POST(request: Request) {
  try {
    await requireAuth(['ADMIN']);
    const body = await request.json();
    const { name, unit, stock, minStock, costPerUnit } = body;

    if (!name || !unit) {
      return NextResponse.json({ message: 'Nama dan Satuan bahan baku wajib diisi' }, { status: 400 });
    }

    try {
      const ingredient = await prisma.ingredient.create({
        data: {
          name,
          unit,
          stock: parseFloat(stock || 0),
          minStock: parseFloat(minStock || 10),
          costPerUnit: parseFloat(costPerUnit || 0),
        },
      });

      // Record stock history if initial stock > 0
      if (parseFloat(stock || 0) > 0) {
        await prisma.stockHistory.create({
          data: {
            ingredientId: ingredient.id,
            type: 'IN',
            quantity: parseFloat(stock),
            reason: 'Inisialisasi Stok Bahan Baru',
          },
        });
      }

      return NextResponse.json(ingredient, { status: 201 });
    } catch {
      // Memory fallback
      const ingId = `ing-${Date.now()}`;
      const newIng = {
        id: ingId,
        name,
        unit,
        stock: parseFloat(stock || 0),
        minStock: parseFloat(minStock || 10),
        costPerUnit: parseFloat(costPerUnit || 0),
      };
      memoryStore.ingredients.push(newIng);

      if (parseFloat(stock || 0) > 0) {
        memoryStore.stockHistory.unshift({
          id: `sh-${Date.now()}`,
          ingredientId: ingId,
          ingredientName: name,
          type: 'IN',
          quantity: parseFloat(stock),
          reason: 'Inisialisasi Stok Bahan Baru',
          referenceId: undefined,
          createdAt: new Date().toISOString(),
        });
      }
      return NextResponse.json(newIng, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}
