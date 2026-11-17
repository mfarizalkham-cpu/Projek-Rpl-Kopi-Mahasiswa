export interface PantunQuote {
  id: number;
  pantun: string[];
  quote: string;
  emoji: string;
}

export const PANTUN_QUOTES: PantunQuote[] = [
  {
    id: 1,
    pantun: [
      'Jalan-jalan ke Kota Kediri,',
      'Jangan lupa membeli roti.',
      'Terima kasih sudah memesan kopi,',
      'Semoga hari ini nugas penuh energi! ☕⚡'
    ],
    quote: 'Kafein sudah meluncur, semangat nugas tak boleh hancur!',
    emoji: '☕'
  },
  {
    id: 2,
    pantun: [
      'Makan nasi lauknya ikan,',
      'Dimakan hangat di bawah pohon.',
      'Kopi lezat sudah dipesankan,',
      'Semoga revisi skripsi cepat di-ACC dosen! 🎓✨'
    ],
    quote: 'Satu tegukan Kopi Mahasiswa, selangkah lebih dekat menuju gelar sarjana!',
    emoji: '🎓'
  },
  {
    id: 3,
    pantun: [
      'Pagi hari minum es tebu,',
      'Rasanya manis bikin bahagia.',
      'Pembayaranmu sudah sukses Kakku,',
      'Senyum terus ya, kamu luar biasa! 😊💛'
    ],
    quote: 'Kopi manis, senyummu makin manis, harimu bakal makin fantastis!',
    emoji: '😊'
  },
  {
    id: 4,
    pantun: [
      'Burung nuri terbang ke awan,',
      'Singgah sebentar di pohon kelapa.',
      'Kopi Mahasiswa racikan idaman,',
      'Tugas menumpuk tak terasa apa-apa! 💻🚀'
    ],
    quote: 'Deadline mengejar? Tenang, kafein kami siap jadi superhero nugasmu!',
    emoji: '🚀'
  },
  {
    id: 5,
    pantun: [
      'Ke pasar beli gula aren,',
      'Singgah sebentar beli alpukat.',
      'Penampilanmu hari ini makin keren,',
      'Minum kopi ini bikin fokus makin meningkat! ☕😎'
    ],
    quote: 'Kopi enak, kantong hemat, gaya tetap paling keren se-kampus!',
    emoji: '😎'
  },
  {
    id: 6,
    pantun: [
      'Beli kuaci di warung Pak Mamat,',
      'Dimakan santai sambil membaca.',
      'Terima kasih pembayaran sudah hemat,',
      'Semoga rezekimu mengalir deras bak samudra! 💸✨'
    ],
    quote: 'Transaksi lancar, hati gembira, dompet tetap aman bersahaja!',
    emoji: '💸'
  }
];

export function getRandomPantun(): PantunQuote {
  const randomIndex = Math.floor(Math.random() * PANTUN_QUOTES.length);
  return PANTUN_QUOTES[randomIndex];
}
