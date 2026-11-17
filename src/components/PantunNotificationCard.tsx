'use client';

import React, { useState, useEffect } from 'react';
import { getRandomPantun, PantunQuote, PANTUN_QUOTES } from '@/lib/pantun';
import { Sparkles, RefreshCw, PartyPopper } from 'lucide-react';

interface PantunNotificationCardProps {
  customerName?: string;
  orderNumber?: string;
}

export default function PantunNotificationCard({ customerName }: PantunNotificationCardProps) {
  const [currentPantun, setCurrentPantun] = useState<PantunQuote | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    setCurrentPantun(getRandomPantun());
  }, []);

  const handleNextPantun = () => {
    setIsRotating(true);
    setTimeout(() => {
      if (!currentPantun) {
        setCurrentPantun(getRandomPantun());
      } else {
        const nextIdx = (currentPantun.id % PANTUN_QUOTES.length);
        setCurrentPantun(PANTUN_QUOTES[nextIdx]);
      }
      setIsRotating(false);
    }, 200);
  };

  if (!currentPantun) return null;

  return (
    <div className="bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-amber-600/10 border-2 border-amber-400/40 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-coffee-800/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10 space-y-4 text-center sm:text-left">
        
        {/* Header Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-coffee-950 flex items-center justify-center font-extrabold shadow-md shrink-0">
              <PartyPopper className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pesan Bahagia & Pantun Kopi
              </span>
              <h3 className="font-extrabold text-coffee-950 dark:text-amber-100 text-base sm:text-lg flex items-center gap-1.5 mt-0.5">
                Spesial Buat Kak {customerName || 'Mahasiswa'}! {currentPantun.emoji}
              </h3>
            </div>
          </div>

          <button
            onClick={handleNextPantun}
            className="bg-white hover:bg-amber-100 text-coffee-900 border border-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isRotating ? 'animate-spin' : ''}`} />
            <span>Pantun Lain</span>
          </button>
        </div>

        {/* Pantun Stanza */}
        <div className="bg-white/80 dark:bg-espresso-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-700/40 shadow-sm space-y-2">
          {currentPantun.pantun.map((line, idx) => (
            <p
              key={idx}
              className={`text-xs sm:text-sm font-semibold text-coffee-950 dark:text-coffee-100 italic transition-all ${
                idx % 2 === 1 ? 'pl-4 text-coffee-800 dark:text-amber-200/90' : 'text-coffee-950 dark:text-amber-100 font-bold'
              }`}
            >
              "{line}"
            </p>
          ))}
        </div>

        {/* Happy Quote Footer */}
        <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-xs text-coffee-950 dark:text-amber-100 font-bold">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
          <span>"{currentPantun.quote}"</span>
        </div>

      </div>
    </div>
  );
}

