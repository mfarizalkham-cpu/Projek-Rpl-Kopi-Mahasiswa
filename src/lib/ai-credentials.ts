import prisma from '@/lib/prisma';

export type AIProviderSettingKey = 'GEMINI_API_KEY' | 'XAI_API_KEY';

export async function getAIProviderApiKey(
  settingKey: AIProviderSettingKey,
  environmentKeys: string[]
): Promise<string | undefined> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: settingKey } });
    const databaseKey = setting?.value.trim();
    if (databaseKey) return databaseKey;
  } catch (error) {
    console.error(`Failed to read ${settingKey} from settings database:`, error);
  }

  return environmentKeys
    .map((key) => process.env[key]?.trim())
    .find((value): value is string => Boolean(value));
}

export async function getAIProviderApiKeyStatus(
  settingKey: AIProviderSettingKey,
  environmentKeys: string[]
): Promise<{ configured: boolean; source: 'database' | 'environment' | null }> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: settingKey } });
    if (setting?.value.trim()) return { configured: true, source: 'database' };
  } catch (error) {
    console.error(`Failed to read ${settingKey} status from settings database:`, error);
  }

  const isConfigured = environmentKeys.some((key) => Boolean(process.env[key]?.trim()));
  return {
    configured: isConfigured,
    source: isConfigured ? 'environment' : null,
  };
}
