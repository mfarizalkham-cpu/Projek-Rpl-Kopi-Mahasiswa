import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getAIRecommendations } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    const recommendations = await getAIRecommendations(session?.id);
    return NextResponse.json(recommendations);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Error AI recommendation' }, { status: 500 });
  }
}
