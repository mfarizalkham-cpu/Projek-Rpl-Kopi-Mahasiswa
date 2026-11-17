import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { memoryStore } from '@/lib/db-store';
import prisma from '@/lib/prisma';
import { SystemNotificationService } from '@/lib/system-notifications';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['KASIR', 'ADMIN']);
    const { id } = params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: { include: { user: true } },
          orderItems: {
            include: {
              menu: {
                include: {
                  recipes: {
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
          payment: true,
        },
      });

      if (!order) return NextResponse.json({ message: 'Pesanan tidak ditemukan' }, { status: 404 });

      const checkedLowStockIngredients: any[] = [];

      // Execute Status Update & Automatic Recipe Stock Deduction in DB Transaction
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Update payment status if requested
        if (paymentStatus && order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: paymentStatus,
              paidAt: paymentStatus === 'PAID' ? new Date() : order.payment.paidAt,
            },
          });
        }

        const newOrderStatus = status || order.status;

        // Check if transition to COMPLETED happens (Automatic Stock Deduction!)
        if (newOrderStatus === 'COMPLETED' && order.status !== 'COMPLETED') {
          for (const item of order.orderItems) {
            const menu = item.menu;
            if (menu && menu.recipes) {
              for (const recipe of menu.recipes) {
                const totalIngredientNeeded = recipe.quantity * item.quantity;
                const ingredient = recipe.ingredient;

                if (ingredient) {
                  // Non-negative stock check
                  if (ingredient.stock < totalIngredientNeeded) {
                    throw new Error(
                      `Stok bahan baku "${ingredient.name}" tidak mencukupi (Tersedia: ${ingredient.stock} ${ingredient.unit}, Dibutuhkan: ${totalIngredientNeeded} ${ingredient.unit})`
                    );
                  }

                  // Deduct stock automatically
                  const updatedIng = await tx.ingredient.update({
                    where: { id: ingredient.id },
                    data: { stock: { decrement: totalIngredientNeeded } },
                  });

                  if (updatedIng.stock <= updatedIng.minStock) {
                    checkedLowStockIngredients.push(updatedIng);
                  }

                  // Log StockHistory OUT
                  await tx.stockHistory.create({
                    data: {
                      ingredientId: ingredient.id,
                      type: 'OUT',
                      quantity: totalIngredientNeeded,
                      reason: `Penggunaan Resep Pesanan Selesai ${order.orderNumber} (${menu.name} x${item.quantity})`,
                      referenceId: order.orderNumber,
                    },
                  });
                }
              }
            }
          }
        }

        const result = await tx.order.update({
          where: { id },
          data: { status: newOrderStatus },
          include: {
            customer: { include: { user: true } },
            orderItems: { include: { menu: true } },
            payment: true,
          },
        });

        return result;
      });

      // Notifikasi Real-time Pusat Status Pesanan & Sistem (In-App)
      try {
        const customerUserId = updatedOrder.customer?.userId || (updatedOrder.customer as any)?.user?.id || null;

        // 1. Pembayaran Berhasil
        if (paymentStatus === 'PAID' && order.payment?.status !== 'PAID') {
          SystemNotificationService.notifyPaymentSuccess({
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            customerName: updatedOrder.customerName || 'Pelanggan',
            totalAmount: updatedOrder.totalAmount,
            paymentMethod: updatedOrder.payment?.paymentMethod || 'QRIS',
            customerUserId,
          }).catch((err) => console.error('Notif payment err:', err));
        }

        // 2. Pembaruan Status Pesanan
        if (status && status !== order.status) {
          SystemNotificationService.notifyOrderStatus({
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            customerName: updatedOrder.customerName || 'Pelanggan',
            status,
            customerUserId,
          }).catch((err) => console.error('Notif status err:', err));
        }

        // 3. Peringatan Stok Menipis (Inventaris)
        for (const lowIng of checkedLowStockIngredients) {
          SystemNotificationService.notifyLowStock({
            ingredientId: lowIng.id,
            name: lowIng.name,
            currentStock: lowIng.stock,
            minStock: lowIng.minStock,
            unit: lowIng.unit,
          }).catch((err) => console.error('Notif low stock err:', err));
        }
      } catch (notifErr) {
        console.error('Trigger notification error:', notifErr);
      }

      return NextResponse.json(updatedOrder);
    } catch (dbErr: any) {
      // If error is stock insufficiency, return bad request message
      if (dbErr.message && dbErr.message.includes('Stok bahan baku')) {
        return NextResponse.json({ message: dbErr.message }, { status: 400 });
      }

      // Memory Fallback
      const order = memoryStore.orders.find((o) => o.id === id || o.orderNumber === id);
      if (!order) return NextResponse.json({ message: 'Pesanan tidak ditemukan' }, { status: 404 });

      if (paymentStatus && order.payment) {
        order.payment.status = paymentStatus;
        if (paymentStatus === 'PAID') order.payment.paidAt = new Date().toISOString();
      }

      const newOrderStatus = status || order.status;

      // Handle stock deduction in memory
      if (newOrderStatus === 'COMPLETED' && order.status !== 'COMPLETED') {
        for (const item of order.orderItems) {
          const recipes = memoryStore.recipes.filter((r) => r.menuId === item.menuId);
          for (const recipe of recipes) {
            const ing = memoryStore.ingredients.find((i) => i.id === recipe.ingredientId);
            if (ing) {
              const needed = recipe.quantity * item.quantity;
              if (ing.stock < needed) {
                return NextResponse.json(
                  {
                    message: `Stok bahan baku "${ing.name}" tidak mencukupi (Tersedia: ${ing.stock} ${ing.unit}, Dibutuhkan: ${needed} ${ing.unit})`,
                  },
                  { status: 400 }
                );
              }
              ing.stock -= needed;
              memoryStore.stockHistory.unshift({
                id: `sh-${Date.now()}-${Math.random()}`,
                ingredientId: ing.id,
                ingredientName: ing.name,
                type: 'OUT',
                quantity: needed,
                reason: `Penggunaan Resep Pesanan Selesai ${order.orderNumber} (${item.menuName} x${item.quantity})`,
                referenceId: order.orderNumber,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }

      order.status = newOrderStatus;
      return NextResponse.json(order);
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}
