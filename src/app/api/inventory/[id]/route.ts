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
    const { name, unit, minStock, costPerUnit, adjustmentType, adjustmentQty, reason } = body;

    // Handle Manual Stock Adjustment (IN / OUT)
    if (adjustmentType && adjustmentQty) {
      const qty = parseFloat(adjustmentQty);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ message: 'Jumlah penyesuaian harus bernilai positif' }, { status: 400 });
      }

      try {
        const current = await prisma.ingredient.findUnique({ where: { id } });
        if (!current) return NextResponse.json({ message: 'Bahan baku tidak ditemukan' }, { status: 404 });

        let newStock = current.stock;
        if (adjustmentType === 'IN') {
          newStock += qty;
        } else if (adjustmentType === 'OUT') {
          if (current.stock < qty) {
            return NextResponse.json({ message: 'Stok tidak mencukupi untuk pengurangan' }, { status: 400 });
          }
          newStock -= qty;
        }

        const updated = await prisma.ingredient.update({
          where: { id },
          data: { stock: newStock },
        });

        await prisma.stockHistory.create({
          data: {
            ingredientId: id,
            type: adjustmentType === 'IN' ? 'IN' : 'OUT',
            quantity: qty,
            reason: reason || `Manual Stock ${adjustmentType}`,
          },
        });

        // Notifikasi Otomatis Aktivitas Stok:
        if (adjustmentType === 'IN') {
          SystemNotificationService.notifyStockRestocked({
            ingredientId: updated.id,
            name: updated.name,
            addedStock: qty,
            newStock: updated.stock,
            unit: updated.unit,
            reason: reason || 'Penyesuaian stok masuk',
          }).catch((err) => console.error('Failed to notify restock:', err));
        } else if (updated.stock <= updated.minStock) {
          SystemNotificationService.notifyLowStock({
            ingredientId: updated.id,
            name: updated.name,
            currentStock: updated.stock,
            minStock: updated.minStock,
            unit: updated.unit,
          }).catch((err) => console.error('Failed to notify low stock:', err));
        }

        return NextResponse.json(updated);
      } catch {
        // Memory fallback
        const ing = memoryStore.ingredients.find((i) => i.id === id);
        if (!ing) return NextResponse.json({ message: 'Bahan baku tidak ditemukan' }, { status: 404 });

        if (adjustmentType === 'IN') {
          ing.stock += qty;
          SystemNotificationService.notifyStockRestocked({
            ingredientId: ing.id,
            name: ing.name,
            addedStock: qty,
            newStock: ing.stock,
            unit: ing.unit,
            reason: reason || 'Penyesuaian stok masuk',
          }).catch((err) => console.error('Failed to notify restock (mem):', err));
        } else if (adjustmentType === 'OUT') {
          if (ing.stock < qty) {
            return NextResponse.json({ message: 'Stok tidak mencukupi untuk pengurangan' }, { status: 400 });
          }
          ing.stock -= qty;
          if (ing.stock <= ing.minStock) {
            SystemNotificationService.notifyLowStock({
              ingredientId: ing.id,
              name: ing.name,
              currentStock: ing.stock,
              minStock: ing.minStock,
              unit: ing.unit,
            }).catch((err) => console.error('Failed to notify low stock (mem):', err));
          }
        }

        memoryStore.stockHistory.unshift({
          id: `sh-${Date.now()}`,
          ingredientId: id,
          ingredientName: ing.name,
          type: adjustmentType === 'IN' ? 'IN' : 'OUT',
          quantity: qty,
          reason: reason || `Manual Stock ${adjustmentType}`,
          referenceId: undefined,
          createdAt: new Date().toISOString(),
        });

        return NextResponse.json(ing);
      }
    }

    // Normal Info Edit
    try {
      const updated = await prisma.ingredient.update({
        where: { id },
        data: {
          name,
          unit,
          minStock: minStock !== undefined ? parseFloat(minStock) : undefined,
          costPerUnit: costPerUnit !== undefined ? parseFloat(costPerUnit) : undefined,
        },
      });

      if (updated.stock <= updated.minStock) {
        SystemNotificationService.notifyLowStock({
          ingredientId: updated.id,
          name: updated.name,
          currentStock: updated.stock,
          minStock: updated.minStock,
          unit: updated.unit,
        }).catch((err) => console.error('Failed to notify low stock:', err));
      }

      return NextResponse.json(updated);
    } catch {
      const ing = memoryStore.ingredients.find((i) => i.id === id);
      if (ing) {
        if (name) ing.name = name;
        if (unit) ing.unit = unit;
        if (minStock !== undefined) ing.minStock = parseFloat(minStock);
        if (costPerUnit !== undefined) ing.costPerUnit = parseFloat(costPerUnit);

        if (ing.stock <= ing.minStock) {
          SystemNotificationService.notifyLowStock({
            ingredientId: ing.id,
            name: ing.name,
            currentStock: ing.stock,
            minStock: ing.minStock,
            unit: ing.unit,
          }).catch((err) => console.error('Failed to notify low stock (mem):', err));
        }

        return NextResponse.json(ing);
      }
      return NextResponse.json({ message: 'Bahan baku tidak ditemukan' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}
