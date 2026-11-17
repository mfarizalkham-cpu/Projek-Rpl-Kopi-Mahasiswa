import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getAIProviderApiKeyStatus, AIProviderSettingKey } from '@/lib/ai-credentials';

const VALID_MODELS = ['gemini', 'grok'];
const API_KEY_SETTINGS: Record<string, { settingKey: AIProviderSettingKey; environmentKeys: string[] }> = {
  geminiApiKey: { settingKey: 'GEMINI_API_KEY', environmentKeys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'AI_API_KEY'] },
  grokApiKey: { settingKey: 'XAI_API_KEY', environmentKeys: ['XAI_API_KEY', 'GROK_API_KEY'] },
};

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth(['ADMIN']);
    const [activeSetting, legacySetting, gemini, grok] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'AI_ACTIVE_MODEL' } }),
      prisma.setting.findUnique({ where: { key: 'active_ai_model' } }),
      getAIProviderApiKeyStatus('GEMINI_API_KEY', API_KEY_SETTINGS.geminiApiKey.environmentKeys),
      getAIProviderApiKeyStatus('XAI_API_KEY', API_KEY_SETTINGS.grokApiKey.environmentKeys),
    ]);

    const setting = activeSetting || legacySetting;
    const activeModel = setting?.value === 'grok' ? 'grok' : 'gemini';

    return NextResponse.json({
      model: activeModel,
      updatedAt: setting?.updatedAt || null,
      apiKeys: { gemini, grok },
      availableModels: [
        {
          id: 'gemini',
          name: 'Google Gemini',
          subName: 'Gemini 2.5 / Flash',
          provider: 'Google AI',
          description: 'Cepat, cerdas dalam multimodal, optimal untuk rekomendasi F&B real-time dan analisis preferensi rasa.',
          tag: 'Kecepatan Kilat & Hemat Biaya',
        },
        {
          id: 'grok',
          name: 'xAI Grok',
          subName: process.env.GROK_MODEL || 'Grok 4.7',
          provider: 'xAI',
          description: 'Model percakapan xAI untuk rekomendasi menu dan bantuan bisnis dengan konteks data Kopi Mahasiswa.',
          tag: 'xAI Responses API',
        },
      ],
    });
  } catch (error: any) {
    const status = error?.message === 'UNAUTHORIZED' ? 401 : error?.message === 'FORBIDDEN' ? 403 : 500;
    console.error('Error fetching AI model setting:', error);
    return NextResponse.json(
      { error: status === 401 || status === 403 ? 'Akses ditolak' : 'Gagal memuat pengaturan model AI' },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth(['ADMIN']);

    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Format pengaturan tidak valid' }, { status: 400 });
    }
    const { model } = body;

    if (!model || !VALID_MODELS.includes(model)) {
      return NextResponse.json(
        { error: `Model tidak valid. Pilih salah satu dari: ${VALID_MODELS.join(', ')}` },
        { status: 400 }
      );
    }

    const submittedKeys: { settingKey: AIProviderSettingKey; value: string }[] = [];
    for (const [field, { settingKey }] of Object.entries(API_KEY_SETTINGS)) {
      const submittedKey = body[field];
      if (submittedKey !== undefined && typeof submittedKey !== 'string') {
        return NextResponse.json({ error: `Format ${field} tidak valid` }, { status: 400 });
      }
      if (typeof submittedKey === 'string' && submittedKey.trim()) {
        if (submittedKey.length > 4096) {
          return NextResponse.json({ error: `Nilai ${field} terlalu panjang` }, { status: 400 });
        }
        submittedKeys.push({ settingKey, value: submittedKey.trim() });
      }
    }

    const writes = submittedKeys.map(({ settingKey, value }) =>
      prisma.setting.upsert({
        where: { key: settingKey },
        update: { value },
        create: { key: settingKey, value },
      })
    );
    writes.push(
      prisma.setting.upsert({
        where: { key: 'AI_ACTIVE_MODEL' },
        update: { value: model },
        create: { key: 'AI_ACTIVE_MODEL', value: model },
      }),
      prisma.setting.upsert({
        where: { key: 'active_ai_model' },
        update: { value: model },
        create: { key: 'active_ai_model', value: model },
      })
    );

    const savedSettings = await prisma.$transaction(writes);
    const updatedSetting = savedSettings[submittedKeys.length];

    if (!updatedSetting) {
      throw new Error('Pengaturan model AI tidak berhasil disimpan');
    }

    const [gemini, grok] = await Promise.all([
      getAIProviderApiKeyStatus('GEMINI_API_KEY', API_KEY_SETTINGS.geminiApiKey.environmentKeys),
      getAIProviderApiKeyStatus('XAI_API_KEY', API_KEY_SETTINGS.grokApiKey.environmentKeys),
    ]);
    await prisma.setting.deleteMany({
      where: { key: { in: ['OPENAI_API_KEY', 'DEEPSEEK_API_KEY'] } },
    });

    return NextResponse.json({
      success: true,
      model: updatedSetting.value,
      updatedAt: updatedSetting.updatedAt,
      apiKeys: { gemini, grok },
      message: `Model AI aktif berhasil diperbarui ke ${model.toUpperCase()}`,
    });
  } catch (error: any) {
    const status = error?.message === 'UNAUTHORIZED' ? 401 : error?.message === 'FORBIDDEN' ? 403 : 500;
    console.error('Error updating AI model setting:', error);
    return NextResponse.json(
      { error: status === 401 || status === 403 ? 'Akses ditolak' : error?.message || 'Gagal menyimpan pengaturan model AI' },
      { status }
    );
  }
}
