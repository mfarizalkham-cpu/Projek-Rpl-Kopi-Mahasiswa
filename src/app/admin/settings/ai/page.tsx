'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  Check, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

type APIKeyField = 'geminiApiKey' | 'grokApiKey';
type APIKeyStatus = { configured: boolean; source: 'database' | 'environment' | null };

interface ModelOption {
  id: string;
  name: string;
  subName: string;
  provider: string;
  badge: string;
  tagline: string;
  description: string;
  features: string[];
  colorBorder: string;
  colorBg: string;
  colorIcon: string;
}

const AI_MODELS: ModelOption[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    subName: 'Gemini 2.5 / Flash',
    provider: 'Google AI',
    badge: 'Direkomendasikan (Default)',
    tagline: 'Ultra Fast & Multimodal Precision',
    description: 'Model generasi mutakhir Google dengan respon sangat cepat (sub-second), sangat akurat dalam mencocokkan menu katalog dan rekomendasi selera pelanggan.',
    features: [
      'Latency ultra rendah (< 1 detik)',
      'Optimal untuk rekomendasi katalog & pairing kopi',
      'Integrasi native Gemini API / Interactions'
    ],
    colorBorder: 'border-amber-500/60',
    colorBg: 'bg-amber-500/10',
    colorIcon: 'text-amber-400',
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    subName: 'Grok 4.7',
    provider: 'xAI',
    badge: 'xAI Responses API',
    tagline: 'Percakapan Kontekstual & Analitis',
    description: 'Model xAI untuk percakapan, rekomendasi menu, dan bantuan analitik dengan konteks bisnis Kopi Mahasiswa.',
    features: [
      'Menggunakan xAI Responses API',
      'Menerima instruksi sistem dan riwayat percakapan',
      'Request tidak disimpan oleh provider (store: false)'
    ],
    colorBorder: 'border-sky-500/60',
    colorBg: 'bg-sky-500/10',
    colorIcon: 'text-sky-400',
  },
];

export default function AdminAiSettingsPage() {
  const [selectedModel, setSelectedModel] = useState<string>('gemini');
  const [currentActiveModel, setCurrentActiveModel] = useState<string>('gemini');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<APIKeyField, string>>({
    geminiApiKey: '',
    grokApiKey: '',
  });
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<'gemini' | 'grok', APIKeyStatus>>({
    gemini: { configured: false, source: null },
    grok: { configured: false, source: null },
  });
  const [visibleKeys, setVisibleKeys] = useState<Record<APIKeyField, boolean>>({
    geminiApiKey: false,
    grokApiKey: false,
  });
  const [revealedApiKeys, setRevealedApiKeys] = useState<Partial<Record<APIKeyField, string>>>({});
  const [visibleSavedKeys, setVisibleSavedKeys] = useState<Partial<Record<APIKeyField, boolean>>>({});
  const [revealingKey, setRevealingKey] = useState<APIKeyField | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchCurrentSetting();
  }, []);

  const fetchCurrentSetting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/ai');
      if (res.ok) {
        const data = await res.json();
        if (data.model) {
          setSelectedModel(data.model);
          setCurrentActiveModel(data.model);
        }
        if (data.apiKeys) setApiKeyStatus(data.apiKeys);
        if (data.updatedAt) {
          setUpdatedAt(new Date(data.updatedAt).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }));
        }
      } else {
        const data = await res.json();
        setNotification({ type: 'error', message: data.error || 'Gagal memuat pengaturan AI.' });
      }
    } catch (err) {
      console.error('Failed to load AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setNotification(null);
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, ...apiKeys }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentActiveModel(selectedModel);
        setApiKeys({ geminiApiKey: '', grokApiKey: '' });
        setRevealedApiKeys({});
        setVisibleSavedKeys({});
        if (data.apiKeys) setApiKeyStatus(data.apiKeys);
        setNotification({
          type: 'success',
          message: `${data.message || `Model AI berhasil dialihkan ke ${selectedModel.toUpperCase()}`}. Kolom API Key yang diisi telah disimpan; kolom kosong tetap dipertahankan.`,
        });
        if (data.updatedAt) {
          setUpdatedAt(new Date(data.updatedAt).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }));
        }
      } else {
        throw new Error(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menyimpan pengaturan.',
      });
    } finally {
      setSaving(false);
    }
  };

  const revealSavedApiKey = async (field: APIKeyField, provider: 'gemini' | 'grok') => {
    if (revealedApiKeys[field]) {
      setVisibleSavedKeys((previous) => ({ ...previous, [field]: !previous[field] }));
      return;
    }

    setRevealingKey(field);
    setNotification(null);
    try {
      const response = await fetch('/api/settings/ai/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menampilkan API key.');
      if (typeof data.apiKey !== 'string' || !data.apiKey) {
        throw new Error('API key tidak tersedia.');
      }

      setRevealedApiKeys((previous) => ({ ...previous, [field]: data.apiKey }));
      setVisibleSavedKeys((previous) => ({ ...previous, [field]: true }));
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'Gagal menampilkan API key.',
      });
    } finally {
      setRevealingKey(null);
    }
  };

  const activeModelDetails = AI_MODELS.find((m) => m.id === currentActiveModel) || AI_MODELS[0];
  const hasNewApiKeys = Object.values(apiKeys).some((key) => key.trim().length > 0);
  const apiKeyFields: {
    id: APIKeyField;
    provider: 'gemini' | 'grok';
    label: string;
    placeholder: string;
  }[] = [
    { id: 'geminiApiKey', provider: 'gemini', label: 'Google Gemini API Key', placeholder: 'AIzaSy...' },
    { id: 'grokApiKey', provider: 'grok', label: 'xAI Grok API Key', placeholder: 'xai-...' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#2D1B14] border border-[#4A2E22] p-8 shadow-2xl text-white">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Bot className="w-3.5 h-3.5" /> Pusat Kontrol AI Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F7E7CE]">
              Pengaturan Model AI (Barista & Chatbot)
            </h1>
            <p className="text-sm text-[#D7C4B7] max-w-2xl leading-relaxed">
              Tentukan model Artificial Intelligence yang menggerakkan Barista AI Kopi Mahasiswa, AI Recommendation, 
              dan respon interaktif pada e-commerce & kasir.
            </p>
          </div>

          <div className="bg-[#1F120D] border border-[#432A1F] rounded-2xl p-4 shrink-0 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-amber-300/80 block font-bold">
                Model Sedang Aktif
              </span>
              <span className="text-lg font-black text-white block">
                {activeModelDetails.name}
              </span>
              <span className="text-xs text-[#C8B2A2]">
                {activeModelDetails.subName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border shadow-md transition-all animate-in fade-in duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border-red-500/40 text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="text-sm leading-relaxed">{notification.message}</div>
        </div>
      )}

      {/* Radio Card Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold uppercase tracking-wider text-[#EAD8CD] flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> Pilih Provider & Arsitektur Model AI:
          </label>
          {updatedAt && (
            <span className="text-xs text-[#A89284]">
              Terakhir diperbarui: <span className="text-white font-medium">{updatedAt}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AI_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            const isCurrentActive = currentActiveModel === model.id;

            return (
              <div
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between border-2 ${
                  isSelected
                    ? `${model.colorBorder} ${model.colorBg} shadow-xl scale-[1.02] ring-2 ring-amber-400/20`
                    : 'border-[#3D261C] bg-[#241610] hover:border-[#5C3B2B] hover:bg-[#2A1A13]'
                }`}
              >
                {/* Active Indicator Pin */}
                {isCurrentActive && (
                  <div className="absolute top-4 right-4 bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE AKTIF
                  </div>
                )}

                <div className="space-y-4">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border transition ${
                        isSelected
                          ? 'bg-[#2D1B14] border-amber-400 shadow-md'
                          : 'bg-[#1A100B] border-[#432A1F]'
                      }`}
                    >
                      {model.id === 'gemini' && <Zap className={`w-6 h-6 ${model.colorIcon}`} />}
                      {model.id === 'grok' && <Bot className={`w-6 h-6 ${model.colorIcon}`} />}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-lg text-[#F9EFE7] leading-tight flex items-center gap-2">
                        {model.name}
                      </h3>
                      <p className="text-xs font-semibold text-amber-400/90">{model.subName}</p>
                    </div>
                  </div>

                  <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#1B0F0A] text-[#D8C2B3] border border-[#3E271D]">
                    {model.badge}
                  </span>

                  <p className="text-xs text-[#D1BEB0] leading-relaxed">
                    {model.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-[#3B251B]">
                    {model.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-[#BCA798]">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radio selection circle */}
                <div className="mt-6 pt-4 border-t border-[#3B251B] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#B8A394]">
                    {isSelected ? 'Dipilih' : 'Klik untuk memilih'}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500 text-[#1F120D]'
                        : 'border-[#553628] bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider API Credentials */}
      <section className="rounded-3xl border border-[#E6D6C9] bg-[#FAF5EF] p-6 shadow-xl dark:border-[#4A2E22] dark:bg-[#2D1B14] sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#38251B] dark:text-[#F7E7CE]">Konfigurasi Kredensial API Key</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#70594A] dark:text-[#C6B0A0]">
              Key tersimpan tetap tersembunyi secara default. Admin dapat menampilkannya secara eksplisit; hindari
              membuka key di perangkat bersama.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {apiKeyFields.map((field) => {
            const status = apiKeyStatus[field.provider];
            return (
              <div key={field.id} className="space-y-2">
                <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
                  <label htmlFor={field.id} className="text-xs font-bold text-[#4A3325] dark:text-[#EAD8CD]">
                    {field.label}
                  </label>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      status.configured
                        ? 'border-emerald-600/30 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-amber-600/30 bg-amber-100 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                    }`}
                  >
                    {status.configured ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {status.configured
                      ? `Terkonfigurasi${status.source === 'environment' ? ' (env)' : ''}`
                      : 'Belum diatur'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id={field.id}
                    type={visibleKeys[field.id] ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={apiKeys[field.id]}
                    onChange={(event) =>
                      setApiKeys((previous) => ({ ...previous, [field.id]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    disabled={loading || saving}
                    className="w-full rounded-xl border border-[#D4BFAE] bg-white px-4 py-3 pr-12 text-sm text-[#38251B] outline-none transition placeholder:text-[#9A8475] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 dark:border-[#553628] dark:bg-[#1A100B] dark:text-[#F9EFE7] dark:placeholder:text-[#806B5D]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleKeys((previous) => ({ ...previous, [field.id]: !previous[field.id] }))
                    }
                    aria-label={visibleKeys[field.id] ? `Sembunyikan ${field.label}` : `Tampilkan ${field.label}`}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#BCA798] transition hover:text-amber-300"
                  >
                    {visibleKeys[field.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {status.configured && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => revealSavedApiKey(field.id, field.provider)}
                      disabled={revealingKey !== null}
                      className="text-xs font-semibold text-amber-700 underline decoration-amber-500/50 underline-offset-2 hover:text-amber-900 disabled:opacity-50 dark:text-amber-300 dark:hover:text-amber-200"
                    >
                      {revealingKey === field.id
                        ? 'Memuat API key...'
                        : revealedApiKeys[field.id]
                          ? visibleSavedKeys[field.id]
                            ? 'Sembunyikan API key tersimpan'
                            : 'Tampilkan API key tersimpan'
                          : 'Tampilkan API key tersimpan'}
                    </button>
                    {revealedApiKeys[field.id] && (
                      <input
                        type={visibleSavedKeys[field.id] ? 'text' : 'password'}
                        value={revealedApiKeys[field.id]}
                        readOnly
                        aria-label={`${field.label} tersimpan`}
                        className="w-full rounded-xl border border-[#D4BFAE] bg-[#F3ECE5] px-4 py-3 text-sm text-[#38251B] dark:border-[#553628] dark:bg-[#1A100B] dark:text-[#F9EFE7]"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Action Bar */}
      <div className="bg-[#2D1B14] border border-[#4A2E22] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
          <div className="text-xs text-[#D8C4B5] leading-relaxed">
            Perubahan model akan langsung aktif secara global tanpa perlu melakukan restart server. 
            Semua request AI selanjutnya akan dialihkan ke model <strong className="text-white uppercase">{selectedModel}</strong>.
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchCurrentSetting}
            disabled={loading || saving}
            className="px-4 py-3 rounded-2xl bg-[#1E120B] hover:bg-[#281810] border border-[#432A1F] text-xs font-bold text-[#EAD8CD] transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (selectedModel === currentActiveModel && !hasNewApiKeys)}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              saving
                ? 'bg-amber-600/50 text-amber-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#20120A] hover:shadow-amber-500/25'
            }`}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" /> Simpan Perubahan Model AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Environment & API Key Status Card */}
      <div className="bg-[#22150E] border border-[#3C251A] rounded-2xl p-6 text-xs text-[#C6B0A0] space-y-3">
        <div className="flex items-center gap-2 text-[#F7E7CE] font-bold text-sm">
          <Terminal className="w-4 h-4 text-amber-400" /> Informasi Konfigurasi API Engine:
        </div>
        <p className="leading-relaxed">
          API Key yang tersimpan di database diprioritaskan. Jika belum ada, sistem menggunakan API Key environment yang tersedia.
          Nilai rahasia tidak pernah dikirim kembali ke browser; status hanya menampilkan sumber konfigurasi.
        </p>
      </div>
    </div>
  );
}
