import { NextResponse } from 'next/server';
import { getDbPurchases, memoryStore } from '@/lib/db-store';
import { requireAuth } from '@/lib/auth';
import { generatePurchaseNumber } from '@/lib/utils';
import prisma from '@/lib/prisma';

export async function GET() {
  const purchases = await getDbPurchases();
  return NextResponse.json(purchases);
}

export async function POST(request: Request) {
  try {
    await requireAuth(['ADMIN']);
    const body = await request.json();
    const { supplierId, notes, items } = body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Supplier dan item pembelian wajib dipilih' }, { status: 400 });
    }

    const purchaseNumber = generatePurchaseNumber();
    let totalAmount = 0;
    const purchaseItemsData = items.map((i: any) => {
      const qty = parseFloat(i.quantity);
      const cost = parseFloat(i.unitCost);
      const subtotal = qty * cost;
      totalAmount += subtotal;
      return {
        ingredientId: i.ingredientId,
        quantity: qty,
        unitCost: cost,
        subtotal,
      };
    });

    try {
      const purchase = await prisma.purchase.create({
        data: {
          purchaseNumber,
          supplierId,
          totalAmount,
          status: 'PENDING',
          notes: notes || '',
          items: {
            create: purchaseItemsData,
          },
        },
        include: { supplier: true, items: { include: { ingredient: true } } },
      });
      return NextResponse.json(purchase, { status: 201 });
    } catch {
      // Memory fallback
      const sup = memoryStore.suppliers.find((s) => s.id === supplierId);
      const purId = `pur-${Date.now()}`;
      const newPurchase = {
        id: purId,
        purchaseNumber,
        supplierId,
        supplierName: sup?.name || 'Supplier',
        totalAmount,
        status: 'PENDING',
        notes: notes || '',
        createdAt: new Date().toISOString(),
        items: purchaseItemsData.map((pi: any, idx: number) => {
          const ing = memoryStore.ingredients.find((ig) => ig.id === pi.ingredientId);
          return {
            id: `pi-${purId}-${idx}`,
            ingredientId: pi.ingredientId,
            ingredientName: ing?.name || 'Bahan',
            quantity: pi.quantity,
            unitCost: pi.unitCost,
            subtotal: pi.subtotal,
          };
        }),
      };
      memoryStore.purchases.unshift(newPurchase as any);
      return NextResponse.json(newPurchase, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}
