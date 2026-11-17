import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAIProviderApiKey, AIProviderSettingKey } from '@/lib/ai-credentials';

const API_KEY_SETTINGS: Record<string, { settingKey: AIProviderSettingKey; environmentKeys: string[] }> = {
  gemini: {
    settingKey: 'GEMINI_API_KEY',
    environmentKeys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'AI_API_KEY'],
  },
  grok: {
    settingKey: 'XAI_API_KEY',
    environmentKeys: ['XAI_API_KEY', 'GROK_API_KEY'],
  },
};

export async function POST(request: Request) {
  try {
    await requireAuth(['ADMIN']);
    const body = await request.json().catch(() => null);
    const provider = body?.provider;
    const config = typeof provider === 'string' ? API_KEY_SETTINGS[provider] : undefined;

    if (!config) {
      return NextResponse.json({ error: 'Provider AI tidak valid.' }, { status: 400 });
    }

    const apiKey = await getAIProviderApiKey(config.settingKey, config.environmentKeys);
    if (!apiKey) {
      return NextResponse.json({ error: 'API key provider ini belum dikonfigurasi.' }, { status: 404 });
    }

    return NextResponse.json(
      { apiKey },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    const status = error?.message === 'UNAUTHORIZED' ? 401 : error?.message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      { error: status === 401 || status === 403 ? 'Akses ditolak.' : 'Gagal menampilkan API key.' },
      { status, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
