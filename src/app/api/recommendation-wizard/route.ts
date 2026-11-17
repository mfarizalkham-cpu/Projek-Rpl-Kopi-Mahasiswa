import { NextResponse } from 'next/server';
import { getDbMenus } from '@/lib/db-store';

export async function POST(req: Request) {
  try {
    const { mood, taste, temperature, maxPrice } = await req.json();

    const menus = await getDbMenus();
    const availableMenus = menus.filter((m) => m.isAvailable);

    if (availableMenus.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Smart scoring algorithm
    const scoredMenus = availableMenus.map((menu) => {
      let score = 50; // base score
      const lowerName = menu.name.toLowerCase();
      const lowerDesc = menu.description.toLowerCase();
      const catName = (menu.category?.name || '').toLowerCase();
      const reasons: string[] = [];

      // MOOD MATCHING
      if (mood === 'nugas') {
        if (lowerName.includes('americano') || lowerName.includes('espresso') || lowerDesc.includes('kafein') || lowerDesc.includes('fokus')) {
          score += 45;
          reasons.push('Kandungan kafein optimal untuk bikin kamu melek & fokus nugas');
        } else if (lowerName.includes('gula aren') || lowerName.includes('kopi')) {
          score += 30;
          reasons.push('Energi manis & kopi pas untuk teman nugas malam');
        }
      } else if (mood === 'santai') {
        if (catName.includes('non-kopi') || lowerName.includes('matcha') || lowerName.includes('latte') || lowerName.includes('tea')) {
          score += 45;
          reasons.push('Pilihan non-kopi yang menenangkan dan ramah untuk lambung');
        } else if (lowerName.includes('latte') || lowerName.includes('creamy')) {
          score += 30;
          reasons.push('Tekstur lembut & creamy cocok untuk bersantai');
        }
      } else if (mood === 'cemilan') {
        if (catName.includes('pastry') || catName.includes('snack') || lowerName.includes('croissant') || lowerName.includes('kue')) {
          score += 50;
          reasons.push('Pastry hangat & renyah pendamping minuman favoritmu');
        }
      } else if (mood === 'hemat') {
        if (menu.price <= 18000) {
          score += 40;
          reasons.push('Harga super ramah kantong mahasiswa!');
        }
      }

      // TASTE MATCHING
      if (taste === 'bold') {
        if (lowerName.includes('americano') || lowerDesc.includes('pahit') || lowerDesc.includes('bold') || lowerDesc.includes('espresso')) {
          score += 30;
          reasons.push('Sensasi rasa kopi hitam bold tanpa pemanis buatan');
        }
      } else if (taste === 'sweet') {
        if (lowerName.includes('gula aren') || lowerDesc.includes('manis') || lowerName.includes('caramel') || lowerName.includes('chocolate')) {
          score += 30;
          reasons.push('Perpaduan manis gula aren organik alami yang pas');
        }
      } else if (taste === 'creamy') {
        if (lowerName.includes('matcha') || lowerName.includes('latte') || lowerDesc.includes('susu') || lowerDesc.includes('creamy')) {
          score += 30;
          reasons.push('Tekstur susu creamy lembut meluncur di lidah');
        }
      }

      // TEMPERATURE MATCHING
      if (temperature === 'cold') {
        if (lowerName.includes('es') || lowerName.includes('cold') || lowerDesc.includes('dingin') || lowerDesc.includes('segar')) {
          score += 20;
          reasons.push('Disajikan dingin menyegarkan di cuaca panas');
        }
      } else if (temperature === 'hot') {
        if (lowerName.includes('hot') || lowerName.includes('warm') || lowerDesc.includes('hangat')) {
          score += 20;
          reasons.push('Disajikan hangat pas untuk suasana dingin / malam');
        }
      }

      // Price filter threshold
      if (maxPrice && menu.price > maxPrice) {
        score -= 40;
      }

      // Clamp match percentage to max 99%
      const matchPercentage = Math.min(99, Math.max(65, score));

      return {
        ...menu,
        matchPercentage,
        reason: reasons[0] || 'Rekomendasi terbaik berdasarkan selera & mood kamu saat ini!',
      };
    });

    // Sort by match percentage descending
    scoredMenus.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json({
      recommendations: scoredMenus.slice(0, 3).map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        description: m.description,
        imageUrl: m.imageUrl,
        categoryName: m.category?.name || 'Signature',
        isAvailable: m.isAvailable,
        matchPercentage: m.matchPercentage,
        reason: m.reason,
      })),
    });
  } catch (error: any) {
    console.error('Error in recommendation wizard API:', error);
    return NextResponse.json({ message: 'Gagal mengambil rekomendasi' }, { status: 500 });
  }
}
