import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { executeRoleAIRequest } from '@/lib/ai-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'AI Chatbot API Kopi Mahasiswa is active and ready.',
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Pesan pengguna tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const session = await getAuthSession().catch(() => null);
    const requestedRole = (body?.role || session?.role || 'PELANGGAN').toUpperCase();

    let targetAssistant: 'ADMIN' | 'CUSTOMER' | 'KASIR' | 'SUPPLIER' | 'OWNER' = 'CUSTOMER';
    if (requestedRole === 'ADMIN') targetAssistant = 'ADMIN';
    else if (requestedRole === 'OWNER') targetAssistant = 'OWNER';
    else if (requestedRole === 'KASIR') targetAssistant = 'KASIR';
    else if (requestedRole === 'SUPPLIER') targetAssistant = 'SUPPLIER';

    const effectiveSession = session ? { ...session, role: requestedRole as any } : {
      id: 'demo-user',
      name: requestedRole === 'ADMIN' ? 'Admin Utama' : requestedRole === 'OWNER' ? 'Pak Owner' : requestedRole === 'KASIR' ? 'Mbak Kasir' : requestedRole === 'SUPPLIER' ? 'CV Kopi Jaya' : 'Budi Mahasiswa',
      email: `${requestedRole.toLowerCase()}@kopimahasiswa.id`,
      role: requestedRole as any,
    };

    const result = await executeRoleAIRequest(
      targetAssistant,
      body.message.trim(),
      body.history || [],
      effectiveSession,
      body.cart || [],
      body.pathname
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem AI Chat.' },
      { status: 500 }
    );
  }
}
