import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { memoryStore } from '@/lib/db-store';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = params;
    const body = await request.json();
    const { status } = body; // RECEIVED | CANCELLED

    if (!status || !['RECEIVED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    try {
      const existing = await prisma.purchase.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) return NextResponse.json({ message: 'Pembelian tidak ditemukan' }, { status: 404 });
      if (existing.status === 'RECEIVED') {
        return NextResponse.json({ message: 'Pembelian sudah pernah diterima sebelumnya' }, { status: 400 });
      }

      // Execute DB Transaction
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.purchase.update({
          where: { id },
          data: {
            status,
            receivedAt: status === 'RECEIVED' ? new Date() : null,
          },
        });

        if (status === 'RECEIVED') {
          for (const item of existing.items) {
            // Increase stock
            await tx.ingredient.update({
              where: { id: item.ingredientId },
              data: {
                stock: { increment: item.quantity },
              },
            });

            // Log stock history IN
            await tx.stockHistory.create({
              data: {
                ingredientId: item.ingredientId,
                type: 'IN',
                quantity: item.quantity,
                reason: `Penerimaan Pembelian Bahan Baku ${existing.purchaseNumber}`,
                referenceId: existing.purchaseNumber,
              },
            });
          }
        }
        return updated;
      });

      return NextResponse.json(result);
    } catch {
      // Memory fallback
      const pur = memoryStore.purchases.find((p) => p.id === id);
      if (!pur) return NextResponse.json({ message: 'Pembelian tidak ditemukan' }, { status: 404 });
      if (pur.status === 'RECEIVED') {
        return NextResponse.json({ message: 'Pembelian sudah pernah diterima sebelumnya' }, { status: 400 });
      }

      pur.status = status;
      if (status === 'RECEIVED') {
        pur.receivedAt = new Date().toISOString();
        for (const item of pur.items) {
          const ing = memoryStore.ingredients.find((i) => i.id === item.ingredientId);
          if (ing) {
            ing.stock += item.quantity;
            memoryStore.stockHistory.unshift({
              id: `sh-${Date.now()}-${Math.random()}`,
              ingredientId: ing.id,
              ingredientName: ing.name,
              type: 'IN',
              quantity: item.quantity,
              reason: `Penerimaan Pembelian Bahan Baku ${pur.purchaseNumber}`,
              referenceId: pur.purchaseNumber,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
      return NextResponse.json(pur);
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}
