import { NextResponse } from 'next/server';
import { setAuthSession, verifyPassword } from '@/lib/auth';
import { getDbUserByEmail } from '@/lib/db-store';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const user = await getDbUserByEmail(email);

    if (!user) {
      return NextResponse.json({ message: 'Email atau password salah' }, { status: 401 });
    }

    // Verify password
    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: 'Email atau password salah' }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      phone: user.phone,
      customerId: (user as any).customer?.id || null,
      supplierId: (user as any).supplier?.id || null,
      employeeId: (user as any).employee?.id || null,
    };

    await setAuthSession(sessionUser);

    return NextResponse.json({ message: 'Login berhasil', user: sessionUser });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Terjadi kesalahan login' }, { status: 500 });
  }
}
