import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';
import { memoryStore } from '@/lib/db-store';
import prisma from '@/lib/prisma';
import { SystemNotificationService } from '@/lib/system-notifications';
import { NotificationService } from '@/lib/notifications/notification-service';
import { WhatsAppService } from '@/lib/notifications/whatsapp-service';
import { SendResult } from '@/lib/notifications/types';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    const body = await request.json();
    const { items, customerName, customerPhone, notes, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Keranjang belanja kosong' }, { status: 400 });
    }

    if (typeof customerPhone !== 'string' || !WhatsAppService.isValidPhoneNumber(customerPhone)) {
      return NextResponse.json(
        { message: 'Nomor WhatsApp tidak valid. Gunakan nomor Indonesia, contoh 08123456789.' },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();
    const name = customerName || session?.name || 'Mahasiswa Pengunjung';
    const method = paymentMethod || 'QRIS';

    // 1. Fetch fresh menu items from DB (Server side validation!)
    let validatedItems: { menuId: string; quantity: number; price: number; subtotal: number; menuName: string }[] = [];
    let serverTotalAmount = 0;

    try {
      // Direct Prisma Database Transaction
      const menuIds = items.map((i: any) => i.menuId);
      const dbMenus = await prisma.menu.findMany({
        where: { id: { in: menuIds }, isAvailable: true },
      });

      for (const cartItem of items) {
        const dbMenu = dbMenus.find((m) => m.id === cartItem.menuId);
        if (!dbMenu) {
          return NextResponse.json(
            { message: `Menu "${cartItem.name || cartItem.menuId}" sedang tidak tersedia / tidak ditemukan` },
            { status: 400 }
          );
        }
        const qty = Math.max(1, parseInt(cartItem.quantity));
        const price = dbMenu.price; // Fresh price from DB!
        const subtotal = price * qty;
        serverTotalAmount += subtotal;

        validatedItems.push({
          menuId: dbMenu.id,
          quantity: qty,
          price,
          subtotal,
          menuName: dbMenu.name,
        });
      }

      // Save Order & OrderItem using DB Transaction
      const createdOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: session?.customerId || null,
            customerName: name,
            status: 'PENDING',
            totalAmount: serverTotalAmount,
            notes: notes || '',
            orderItems: {
              create: validatedItems.map((vi) => ({
                menuId: vi.menuId,
                quantity: vi.quantity,
                price: vi.price,
                subtotal: vi.subtotal,
              })),
            },
            payment: {
              create: {
                amount: serverTotalAmount,
                paymentMethod: method as any,
                status: 'PENDING',
              },
            },
          },
          include: {
            orderItems: { include: { menu: true } },
            payment: true,
            customer: { include: { user: true } },
          },
        });
        return order;
      });

      // Catat ke Pusat Notifikasi Status Pesanan & Sistem (In-App Database)
      SystemNotificationService.notifyNewOrder({
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        customerName: createdOrder.customerName || name,
        totalAmount: createdOrder.totalAmount,
        itemsCount: createdOrder.orderItems.length,
        paymentMethod: createdOrder.payment?.paymentMethod || method,
        customerUserId: session?.id || null,
      }).catch((e) => console.error('System notification error:', e));

      const whatsapp = await sendCheckoutReceipt({
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        customerName: createdOrder.customerName || name,
        customerPhone,
        totalAmount: createdOrder.totalAmount,
        paymentMethod: createdOrder.payment?.paymentMethod || method,
        items: validatedItems,
      });

      return NextResponse.json({ message: 'Checkout berhasil', order: createdOrder, whatsapp }, { status: 201 });
    } catch {
      // Memory Store Fallback
      validatedItems = [];
      serverTotalAmount = 0;

      for (const cartItem of items) {
        const dbMenu = memoryStore.menus.find((m) => m.id === cartItem.menuId && m.isAvailable);
        if (!dbMenu) {
          return NextResponse.json(
            { message: `Menu "${cartItem.name || cartItem.menuId}" sedang tidak tersedia / tidak ditemukan` },
            { status: 400 }
          );
        }
        const qty = Math.max(1, parseInt(cartItem.quantity));
        const price = dbMenu.price; // Fresh price from server memory!
        const subtotal = price * qty;
        serverTotalAmount += subtotal;

        validatedItems.push({
          menuId: dbMenu.id,
          quantity: qty,
          price,
          subtotal,
          menuName: dbMenu.name,
        });
      }

      const orderId = `ord-${Date.now()}`;
      const newOrder = {
        id: orderId,
        orderNumber,
        customerId: session?.customerId || 'cust-1',
        customerName: name,
        status: 'PENDING',
        totalAmount: serverTotalAmount,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        orderItems: validatedItems.map((vi, idx) => ({
          id: `oi-${orderId}-${idx}`,
          menuId: vi.menuId,
          quantity: vi.quantity,
          price: vi.price,
          subtotal: vi.subtotal,
          menuName: vi.menuName,
        })),
        payment: {
          id: `pay-${orderId}`,
          amount: serverTotalAmount,
          paymentMethod: method,
          status: 'PENDING',
          paidAt: null,
        },
      };

      memoryStore.orders.unshift(newOrder as any);
      const whatsapp = await sendCheckoutReceipt({
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        customerPhone,
        totalAmount: newOrder.totalAmount,
        paymentMethod: newOrder.payment.paymentMethod,
        items: validatedItems,
      });

      return NextResponse.json({ message: 'Checkout berhasil', order: newOrder, whatsapp }, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Terjadi kesalahan checkout' }, { status: 500 });
  }
}

async function sendCheckoutReceipt(order: {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  items: Array<{ quantity: number; price: number; menuName: string }>;
}): Promise<SendResult> {
  try {
    return await NotificationService.notifyCheckoutOrder(order);
  } catch (error) {
    console.error('WhatsApp receipt failed after order creation:', error);
    return {
      success: false,
      error: 'Pesanan tersimpan, tetapi struk WhatsApp gagal dikirim.',
    };
  }
}
