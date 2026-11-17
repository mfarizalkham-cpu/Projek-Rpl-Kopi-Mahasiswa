import { NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireAuth(['ADMIN', 'OWNER']);

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const where: any = {};
    if (role && role !== 'ALL') {
      where.role = role;
    }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { email: { contains: search.trim() } },
        { phone: { contains: search.trim() } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const [totalUsers, adminCount, ownerCount, kasirCount, pelangganCount, supplierCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.user.count({ where: { role: 'KASIR' } }),
      prisma.user.count({ where: { role: 'PELANGGAN' } }),
      prisma.user.count({ where: { role: 'SUPPLIER' } }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      stats: {
        total: totalUsers,
        admin: adminCount,
        owner: ownerCount,
        kasir: kasirCount,
        pelanggan: pelangganCount,
        supplier: supplierCount,
      },
    });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil data pengguna' },
      { status: err.message === 'UNAUTHORIZED' ? 401 : err.message === 'FORBIDDEN' ? 403 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Nama, Email, Password, dan Role wajib diisi.' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email tersebut sudah terdaftar di sistem.' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password.trim());

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role,
          phone: phone ? phone.trim() : null,
        },
      });

      // Hubungkan relasi sesuai role
      if (role === 'PELANGGAN') {
        await tx.customer.create({
          data: { userId: user.id },
        });
      } else if (role === 'KASIR' || role === 'ADMIN' || role === 'OWNER') {
        await tx.employee.create({
          data: {
            userId: user.id,
            position: role,
          },
        });
      } else if (role === 'SUPPLIER') {
        await tx.supplier.create({
          data: {
            userId: user.id,
            name: user.name,
            contactName: user.name,
            phone: user.phone || '081234567890',
            email: user.email,
            address: 'Alamat Supplier Mitra',
          },
        });
      }

      return user;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pengguna baru berhasil ditambahkan.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating user:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menambahkan pengguna baru' },
      { status: err.message === 'UNAUTHORIZED' ? 401 : err.message === 'FORBIDDEN' ? 403 : 500 }
    );
  }
}

