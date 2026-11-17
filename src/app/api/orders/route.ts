import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getDbOrders, memoryStore } from '@/lib/db-store';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Silakan login untuk melihat pesanan.' }, { status: 401 });
  }

  const allOrders = await getDbOrders();

  if (session?.role === 'PELANGGAN') {
    const customerOrders = allOrders.filter(
      (o: any) => o.customerId === session.customerId || o.customerName === session.name
    );
    return NextResponse.json(customerOrders);
  }

  if (['ADMIN', 'OWNER', 'KASIR'].includes(session.role)) {
    return NextResponse.json(allOrders);
  }

  return NextResponse.json({ message: 'Akses pesanan tidak diizinkan.' }, { status: 403 });
}
