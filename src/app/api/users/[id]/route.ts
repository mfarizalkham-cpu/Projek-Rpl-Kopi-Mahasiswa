import { NextResponse } from 'next/server';
import { requireAuth, getAuthSession, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN', 'OWNER']);
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        customer: true,
        employee: true,
        supplier: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error('Error fetching user:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil data pengguna' },
      { status: err.message === 'UNAUTHORIZED' ? 401 : err.message === 'FORBIDDEN' ? 403 : 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = params;
    const body = await req.json();
    const { name, email, role, phone, password } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { customer: true, employee: true, supplier: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek jika email berubah dan sudah dipakai user lain
    if (email && email.toLowerCase().trim() !== existingUser.email.toLowerCase()) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (emailTaken) {
        return NextResponse.json(
          { success: false, error: 'Email tersebut sudah digunakan oleh akun lain.' },
          { status: 400 }
        );
      }
    }

    // Cek proteksi admin terakhir
    if (existingUser.role === 'ADMIN' && role && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Tidak dapat mengubah role Admin terakhir. Sistem membutuhkan minimal 1 Admin.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (password && password.trim().length > 0) {
      updateData.password = hashPassword(password.trim());
    }

    const targetRole = role || existingUser.role;
    updateData.role = targetRole;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Update relasi profil jika role berganti
      if (targetRole !== existingUser.role) {
        if (targetRole === 'PELANGGAN' && !existingUser.customer) {
          await tx.customer.create({ data: { userId: id } });
        } else if (['KASIR', 'ADMIN', 'OWNER'].includes(targetRole)) {
          if (!existingUser.employee) {
            await tx.employee.create({
              data: { userId: id, position: targetRole },
            });
          } else {
            await tx.employee.update({
              where: { userId: id },
              data: { position: targetRole },
            });
          }
        } else if (targetRole === 'SUPPLIER' && !existingUser.supplier) {
          await tx.supplier.create({
            data: {
              userId: id,
              name: user.name,
              contactName: user.name,
              phone: user.phone || '081234567890',
              email: user.email,
              address: 'Alamat Supplier Mitra',
            },
          });
        }
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui pengguna' },
      { status: err.message === 'UNAUTHORIZED' ? 401 : err.message === 'FORBIDDEN' ? 403 : 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = params;

    const session = await getAuthSession();
    if (session?.id === id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // Jangan izinkan hapus jika admin terakhir
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Tidak dapat menghapus Admin terakhir di sistem.' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Pengguna ${user.name} berhasil dihapus.`,
    });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus pengguna' },
      { status: err.message === 'UNAUTHORIZED' ? 401 : err.message === 'FORBIDDEN' ? 403 : 500 }
    );
  }
}

