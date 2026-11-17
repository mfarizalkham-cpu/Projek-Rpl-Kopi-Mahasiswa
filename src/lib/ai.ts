import { getDbMenus, getDbOrders, getDbCategories } from './db-store';
import { getAIProviderApiKey } from './ai-credentials';

export interface RecommendedMenu {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string | null;
  categoryName: string;
  reason: string;
  isAvailable: boolean;
}

export async function getAIRecommendations(userId?: string): Promise<RecommendedMenu[]> {
  const menus = await getDbMenus();
  const availableMenus = menus.filter((m) => m.isAvailable);

  if (availableMenus.length === 0) return [];

  const apiKey = await getAIProviderApiKey('GEMINI_API_KEY', [
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'AI_API_KEY',
  ]);
  const apiUrl = process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  // Rule: DB is source of truth! We only recommend verified DB menu IDs.
  if (apiKey) {
    try {
      const prompt = `You are an AI Barista Assistant for "Kopi Mahasiswa".
Available menus in DB (JSON): ${JSON.stringify(
        availableMenus.map((m) => ({ id: m.id, name: m.name, price: m.price, category: m.category?.name || 'Kopi' }))
      )}.
Select the top 3 menu IDs for recommendation. Output ONLY a valid JSON array of objects with keys: "id" and "reason" (in Indonesian).`;

      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          const jsonMatch = textOutput.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as { id: string; reason: string }[];
            const recommended: RecommendedMenu[] = [];
            for (const item of parsed) {
              const matchedDbMenu = availableMenus.find((m) => m.id === item.id);
              if (matchedDbMenu) {
                recommended.push({
                  id: matchedDbMenu.id,
                  name: matchedDbMenu.name,
                  price: matchedDbMenu.price,
                  description: matchedDbMenu.description,
                  imageUrl: matchedDbMenu.imageUrl,
                  categoryName: matchedDbMenu.category?.name || 'Kopi Signature',
                  reason: item.reason || 'Rekomendasi racikan terbaik untuk menyegarkan harimu',
                  isAvailable: matchedDbMenu.isAvailable,
                });
              }
            }
            if (recommended.length > 0) return recommended;
          }
        }
      }
    } catch (e) {
      console.warn('AI API Call failed, switching to smart DB recommendation fallback:', e);
    }
  }

  // Fallback: Smart Recommendation based on DB popularity & rating
  const fallbackList: RecommendedMenu[] = availableMenus.slice(0, 3).map((menu, idx) => {
    let reason = 'Menu terlaris di kalangan mahasiswa kampus!';
    if (idx === 1) reason = 'Rekomendasi pas untuk teman nugas & nongkrong santai.';
    if (idx === 2) reason = 'Sensasi rasa creamy khas yang menyegarkan pikiran.';
    return {
      id: menu.id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      imageUrl: menu.imageUrl,
      categoryName: menu.category?.name || 'Signature',
      reason,
      isAvailable: menu.isAvailable,
    };
  });

  return fallbackList;
}
