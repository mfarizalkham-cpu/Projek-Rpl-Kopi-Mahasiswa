import { NextResponse } from 'next/server';
import { getDbSuppliers, memoryStore } from '@/lib/db-store';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const suppliers = await getDbSuppliers();
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  try {
    await requireAuth(['ADMIN']);
    const body = await request.json();
    const { name, contactName, phone, email, address } = body;

    if (!name || !phone || !email) {
      return NextResponse.json({ message: 'Nama supplier, Telepon, dan Email wajib diisi' }, { status: 400 });
    }

    try {
      const supplier = await prisma.supplier.create({
        data: {
          name,
          contactName: contactName || name,
          phone,
          email,
          address: address || '',
        },
      });
      return NextResponse.json(supplier, { status: 201 });
    } catch {
      // Memory fallback
      const newSup = {
        id: `sup-${Date.now()}`,
        name,
        contactName: contactName || name,
        phone,
        email,
        address: address || '',
      };
      memoryStore.suppliers.push(newSup);
      return NextResponse.json(newSup, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 403 });
  }
}
