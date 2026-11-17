'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Sparkles, Check, ArrowRight, RotateCcw, ShoppingBag, Flame, Snowflake, Coffee, Smile, BookOpen, Heart, DollarSign } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface RecommendedItem {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string | null;
  categoryName: string;
  isAvailable: boolean;
  matchPercentage: number;
  reason: string;
}

interface RecommendationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: RecommendedItem) => void;
}

export default function RecommendationWizardModal({ isOpen, onClose, onAddToCart }: RecommendationWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [mood, setMood] = useState<string>('');
  const [taste, setTaste] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<RecommendedItem[]>([]);
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setMood('');
    setTaste('');
    setTemperature('');
    setResults([]);
  };

  const handleFetchRecommendations = async (selectedTemp: string) => {
    setLoading(true);
    setStep(4); // Result step
    try {
      const res = await fetch('/api/recommendation-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          taste,
          temperature: selectedTemp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.recommendations || []);
      }
    } catch (err) {
      console.error('Error getting recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemCartAdd = (item: RecommendedItem) => {
    onAddToCart(item);
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-gradient-to-b from-white via-coffee-50/40 to-white rounded-3xl max-w-2xl w-full shadow-2xl border border-amber-500/20 overflow-hidden relative animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-coffee-950 via-coffee-900 to-amber-950 text-white p-5 px-6 flex items-center justify-between shadow-md relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-coffee-950 flex items-center justify-center font-extrabold shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-wide text-white">Smart Menu Matcher AI</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Solusi Kebingungan
                </span>
              </div>
              <p className="text-xs text-coffee-200 font-light">Temukan menu racikan paling cocok untukmu dalam 3 langkah mudah!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={handleReset}
                title="Mulai Ulang"
                className="p-2 text-amber-300 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Ulang</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-coffee-300 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          {step < 4 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-coffee-800">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* STEP 1: MOOD & AKTIVITAS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center max-w-md mx-auto space-y-2">
                <span className="text-xs font-extrabold text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Langkah 1 dari 3
                </span>
                <h4 className="text-2xl font-extrabold text-coffee-950">Lagi mau ngapain atau gimana mood kamu sekarang? 🤔</h4>
                <p className="text-xs text-coffee-600">Pilih situasi kamu saat ini biar Barista AI bisa mencocokkan dosis kopi/minuman yang tepat.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setMood('nugas');
                    setStep(2);
                  }}
                  className="group relative p-5 bg-white rounded-2xl border-2 border-coffee-100 hover:border-amber-500 hover:shadow-xl transition-all duration-300 text-left flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition duration-300">
                    <BookOpen className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h5 className="font-bold text-coffee-950 text-base group-hover:text-amber-600 transition">Butuh Melek Nugas 💻</h5>
                    <p className="text-xs text-coffee-600 mt-1">Lagi nugas dikejar deadline, butuh dorongan kafein ekstra & fokus 100%.</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMood('santai');
                    setStep(2);
                  }}
                  className="group relative p-5 bg-white rounded-2xl border-2 border-coffee-100 hover:border-amber-500 hover:shadow-xl transition-all duration-300 text-left flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition duration-300">
                    <Smile className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <h5 className="font-bold text-coffee-950 text-base group-hover:text-amber-600 transition">Santai & Refreshing 😌</h5>
                    <p className="text-xs text-coffee-600 mt-1">Nongkrong sama temen, butuh minuman yang manis segar & rileks.</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMood('cemilan');
                    setStep(2);
                  }}
                  className="group relative p-5 bg-white rounded-2xl border-2 border-coffee-100 hover:border-amber-500 hover:shadow-xl transition-all duration-300 text-left flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-900 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition duration-300">
                    <Coffee className="w-6 h-6 text-orange-700" />
                  </div>
                  <div>
                    <h5 className="font-bold text-coffee-950 text-base group-hover:text-amber-600 transition">Lapar / Butuh Cemilan 🥐</h5>
                    <p className="text-xs text-coffee-600 mt-1">Perut keroncongan butuh pastry hangat & camilan ganjal perut.</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMood('hemat');
                    setStep(2);
                  }}
                  className="group relative p-5 bg-white rounded-2xl border-2 border-coffee-100 hover:border-amber-500 hover:shadow-xl transition-all duration-300 text-left flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition duration-300">
                    <DollarSign className="w-6 h-6 text-purple-700" />
                  </div>
                  <div>
                    <h5 className="font-bold text-coffee-950 text-base group-hover:text-amber-600 transition">Cari Promo Hemat 💰</h5>
                    <p className="text-xs text-coffee-600 mt-1">Dompet pas-pasan, pengen menu paling murah tapi tetep enak & puas.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREFERENSI RASA */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center max-w-md mx-auto space-y-2">
                <span className="text-xs font-extrabold text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Langkah 2 dari 3
                </span>
                <h4 className="text-2xl font-extrabold text-coffee-950">Lagi kepengen profil rasa yang seperti apa? 👅</h4>
                <p className="text-xs text-coffee-600">Pilih rasa yang paling sesuai dengan lidah kamu hari ini.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setTaste('bold');
                    setStep(3);
                  }}
                  className="group p-5 bg-white rounded-2xl border-2 border-coffee-100 hover:border-amber-500 hover:shadow-xl transition duration-300 text-center space-y-3"
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-coffee-900 text-amber-300 flex items-center justify-center text-2xl font-extrabold group-hover:scale-110 transition">
                    ☕
                  </div>
                  <h5 className="font-bold text-coffee-950 text-sm group-hover:text-amber-600">Pahit Mantap / Bold</h5>
                  <p className="text-[11px] text-coffee-600">Dominan rasa kopi murni tanpa banyak campuran gula.</p>
                </button>

                <button
                  onClick={() => {
                    setTaste('sweet');
                    setStep(3);
                  }}
                  className="group p-5 bg-white rounded-2xl border-2 border-coffee-100 hover:border-amber-500 hover:shadow-xl transition duration-300 text-center space-y-3"
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-2xl font-extrabold group-hover:scale-110 transition">
                    🍯
                  </div>
                  <h5 className="font-bold text-coffee-950 text-sm group-hover:text-amber-600">Manis Pas (Gula Aren)</h5>
                  <p className="text-[11px] text-coffee-600">Manis alami dari racikan gula aren organik Nusantara.</p>
                </button>

                <button
                  onClick={() => {
                    setTaste('creamy');
                    setStep(3);
                  }}
                  className="group p-5 bg-white rounded-2xl border-2 border-coffee-100 hover:border-amber-500 hover:shadow-xl transition duration-300 text-center space-y-3"
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-2xl font-extrabold group-hover:scale-110 transition">
                    🍵
                  </div>
                  <h5 className="font-bold text-coffee-950 text-sm group-hover:text-amber-600">Creamy & Soft</h5>
                  <p className="text-[11px] text-coffee-600">Susu UHT gurih creamy meluncur lembut di lidah.</p>
                </button>
              </div>

              <div className="flex justify-start">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-coffee-600 hover:text-coffee-950 underline"
                >
                  ← Kemballi ke Langkah 1
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUHU & PEMESANAN */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center max-w-md mx-auto space-y-2">
                <span className="text-xs font-extrabold text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Langkah Terakhir (3 dari 3)
                </span>
                <h4 className="text-2xl font-extrabold text-coffee-950">Mau disajikan dalam kondisi Es atau Hangat? ❄️🔥</h4>
                <p className="text-xs text-coffee-600">Satu langkah lagi untuk melihat racikan terbaik pilihan AI!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setTemperature('cold');
                    handleFetchRecommendations('cold');
                  }}
                  className="group p-6 bg-white rounded-2xl border-2 border-coffee-100 hover:border-blue-500 hover:shadow-xl transition duration-300 text-left flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                    <Snowflake className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="font-bold text-coffee-950 text-base group-hover:text-blue-600">Dingin / Dengan Es 🧊</h5>
                    <p className="text-xs text-coffee-600 mt-1">Es segar yang bikin dahaga hilang seketika.</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setTemperature('hot');
                    handleFetchRecommendations('hot');
                  }}
                  className="group p-6 bg-white rounded-2xl border-2 border-coffee-100 hover:border-amber-600 hover:shadow-xl transition duration-300 text-left flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                    <Flame className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="font-bold text-coffee-950 text-base group-hover:text-amber-700">Panas / Hangat ☕</h5>
                    <p className="text-xs text-coffee-600 mt-1">Disajikan hangat dengan aroma kopi harum menenangkan.</p>
                  </div>
                </button>
              </div>

              <div className="flex justify-start">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-coffee-600 hover:text-coffee-950 underline"
                >
                  ← Kembali ke Langkah 2
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RECOMMENDATION RESULTS */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {loading ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <div>
                    <h4 className="font-bold text-coffee-950 text-base">Sedang Meracik Rekomendasi Menu...</h4>
                    <p className="text-xs text-coffee-500">Barista AI sedang menghitung menu paling cocok dengan selera kamu!</p>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-sm font-bold text-coffee-800">Maaf, belum ada rekomendasi yang sesuai.</p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-coffee-800 text-white rounded-xl text-xs font-bold"
                  >
                    Coba Pilihan Lain
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-extrabold text-coffee-950 flex items-center gap-2">
                        🎉 Ini 3 Menu Terbaik Hasil Racikan AI Untukmu!
                      </h4>
                      <p className="text-xs text-coffee-600">Dipilih secara presisi berdasarkan mood & preferensi rasa kamu.</p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Cari Lagi
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl p-4 border-2 ${
                          idx === 0 ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-lg' : 'border-coffee-100 shadow-sm'
                        } flex flex-col justify-between hover:shadow-md transition relative overflow-hidden group`}
                      >
                        {idx === 0 && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-coffee-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl shadow">
                            ★ TOP MATCH 1
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="relative h-36 w-full rounded-xl overflow-hidden bg-coffee-100">
                            <Image
                              src={item.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600'}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" /> {item.matchPercentage}% Cocok
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-coffee-500 uppercase tracking-wider block">
                              {item.categoryName}
                            </span>
                            <h5 className="font-extrabold text-coffee-950 text-sm leading-snug">{item.name}</h5>
                            <p className="text-[11px] text-coffee-600 line-clamp-2 mt-1">{item.description}</p>
                          </div>

                          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2 text-[11px] text-amber-900 font-medium">
                            💡 {item.reason}
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-coffee-50 flex items-center justify-between">
                          <span className="font-extrabold text-coffee-950 text-sm">{formatRupiah(item.price)}</span>
                          <button
                            onClick={() => handleItemCartAdd(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm ${
                              addedItemIds[item.id]
                                ? 'bg-emerald-600 text-white'
                                : 'bg-coffee-800 hover:bg-coffee-900 text-white'
                            }`}
                          >
                            {addedItemIds[item.id] ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Masuk Cart
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" /> Beli
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
