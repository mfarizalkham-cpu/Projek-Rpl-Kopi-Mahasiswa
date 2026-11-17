import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { executeRoleAIRequest } from '@/lib/ai-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    const body = await req.json().catch(() => null);

    if (!body || !body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Pesan pertanyaan tidak boleh kosong' },
        { status: 400 }
      );
    }

    const result = await executeRoleAIRequest(
      'OWNER',
      body.message.trim(),
      body.history || [],
      session,
      body.cart || []
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem Owner AI' },
      { status: 500 }
    );
  }
}

