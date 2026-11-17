'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings2, 
  History, 
  ExternalLink,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';

interface NotificationSettings {
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  adminWhatsApp: string;
  adminEmail: string;
  events: {
    orderNew: boolean;
    paymentSuccess: boolean;
    orderProcessing: boolean;
    orderCompleted: boolean;
    lowStock: boolean;
    accountRegister: boolean;
  };
}

interface ConnectionStatus {
  whatsapp: {
    isConnected: boolean;
    provider?: string;
    message: string;
    details?: any;
  };
  email: {
    isConnected: boolean;
    provider: string;
    message: string;
  };
}

interface NotificationLogItem {
  id: string;
  channel: 'WHATSAPP' | 'EMAIL';
  type: string;
  recipient: string;
  title?: string | null;
  message: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  error?: string | null;
  createdAt: string;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    whatsappEnabled: true,
    emailEnabled: true,
    adminWhatsApp: '',
    adminEmail: '',
    events: {
      orderNew: true,
      paymentSuccess: true,
      orderProcessing: true,
      orderCompleted: true,
      lowStock: true,
      accountRegister: true,
    },
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, success: 0, failed: 0 });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Testing states
  const [testWaPhone, setTestWaPhone] = useState('');
  const [testingWa, setTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Log filter
  const [logChannelFilter, setLogChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'EMAIL'>('ALL');
  const [selectedLog, setSelectedLog] = useState<NotificationLogItem | null>(null);
  const [showFonnteGuide, setShowFonnteGuide] = useState(false);

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        fetch('/api/notifications/settings'),
        fetch('/api/notifications/logs?limit=50'),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) {
          setSettings(data.settings);
          setTestWaPhone(data.settings.adminWhatsApp || '');
          setTestEmailAddr(data.settings.adminEmail || '');
        }
        if (data.status) {
          setConnectionStatus(data.status);
        }
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
        if (logsData.summary) {
          setSummary(logsData.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    } finally {
      setLoading(false);
      setRefreshingStatus(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('Gagal menyimpan pengaturan notifikasi.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    const target = testWaPhone || settings.adminWhatsApp;
    if (!target) {
      alert('Masukkan nomor WhatsApp tujuan uji coba terlebih dahulu.');
      return;
    }

    setTestingWa(true);
    setWaTestResult(null);

    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'WHATSAPP',
          recipient: target,
        }),
      });

      const data = await res.json();
      setWaTestResult({
        success: data.success,
        message: data.message || data.error,
      });

      fetchLogs();
    } catch (err: any) {
      setWaTestResult({
        success: false,
        message: err.message || 'Gagal menghubungi server',
      });
    } finally {
      setTestingWa(false);
    }
  };

  const handleTestEmail = async () => {
    const target = testEmailAddr || settings.adminEmail;
    if (!target) {
      alert('Masukkan alamat email tujuan uji coba terlebih dahulu.');
      return;
    }

    setTestingEmail(true);
    setEmailTestResult(null);

    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL',
          recipient: target,
        }),
      });

      const data = await res.json();
      setEmailTestResult({
        success: data.success,
        message: data.message || data.error,
      });

      fetchLogs();
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: err.message || 'Gagal menghubungi server',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const channelParam = logChannelFilter !== 'ALL' ? `&channel=${logChannelFilter}` : '';
      const res = await fetch(`/api/notifications/logs?limit=50${channelParam}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to refresh logs:', err);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-amber-200/80 text-sm">Memuat Pengaturan Notifikasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3E2519] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bell className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-amber-50 tracking-tight">
                Pengaturan Notifikasi (WhatsApp & Email)
              </h1>
              <p className="text-sm text-[#A89284] mt-0.5">
                Konfigurasi integrasi WhatsApp (Fonnte / Meta Cloud API) dan Email (Resend / SMTP) untuk kedai Kopi Mahasiswa.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/admin/notifications"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-700/80 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Bell className="w-3.5 h-3.5" /> Buka Pusat Notifikasi
          </Link>
          <button
            onClick={() => {
              setRefreshingStatus(true);
              loadData();
            }}
            disabled={refreshingStatus}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#26160F] hover:bg-[#341F16] border border-[#48291B] text-amber-200 text-xs font-semibold rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingStatus ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Connection Status Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Gateway Status (Fonnte / Meta) */}
        <div className="p-5 rounded-2xl bg-[#1D110B] border border-[#3A2216] flex items-start gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                WhatsApp API Gateway
                {connectionStatus?.whatsapp.isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Terhubung ({connectionStatus.whatsapp.provider || 'WhatsApp'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                    <AlertTriangle className="w-3 h-3" /> Belum Terhubung
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-[#9B8476] mt-1 line-clamp-2">
              {connectionStatus?.whatsapp.message || 'Mengecek provider WhatsApp...'}
            </p>
            <div className="mt-2 text-[11px] text-amber-300/70 flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Mendukung <strong>Fonnte (FONNTE_TOKEN)</strong> &amp; <strong>Meta Cloud API</strong> di <code>.env</code></span>
            </div>
          </div>
        </div>

        {/* Email API / SMTP Status */}
        <div className="p-5 rounded-2xl bg-[#1D110B] border border-[#3A2216] flex items-start gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                Layanan Email (Resend / SMTP)
                {connectionStatus?.email.isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                    <AlertTriangle className="w-3 h-3" /> Belum Terhubung
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-[#9B8476] mt-1 line-clamp-2">
              {connectionStatus?.email.message || 'Mengecek konfigurasi email...'}
            </p>
            <div className="mt-2 text-[11px] text-amber-300/70 flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Provider: {connectionStatus?.email.provider || 'Resend / SMTP'} di <code>.env</code></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: WhatsApp Settings */}
          <div className="p-6 rounded-2xl bg-[#1F120C] border border-[#3E2419] space-y-5">
            <div className="flex items-center justify-between border-b border-[#361E14] pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-base">Saluran WhatsApp</h3>
                  <p className="text-xs text-[#9C8274]">Pengiriman pesan otomatis ke nomor HP pengguna & admin</p>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsappEnabled}
                  onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#382015] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Admin Phone Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-amber-200 uppercase tracking-wider block">
                Nomor WhatsApp Admin (Penerima Notifikasi Kedai)
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={settings.adminWhatsApp}
                onChange={(e) => setSettings({ ...settings, adminWhatsApp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#140A06] border border-[#48291B] text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-600"
              />
              <p className="text-[11px] text-[#8C7467]">
                Notifikasi pesanan masuk dan peringatan stok menipis akan dikirim ke nomor ini.
              </p>
            </div>

            {/* Test WhatsApp Box */}
            <div className="pt-3 border-t border-[#361E14] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-400" /> Uji Coba Pengiriman WhatsApp
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik nomor HP uji coba..."
                  value={testWaPhone}
                  onChange={(e) => setTestWaPhone(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#140A06] border border-[#48291B] text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={testingWa}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {testingWa ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Test WA
                </button>
              </div>

              {waTestResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    waTestResult.success
                      ? 'bg-emerald-950/40 border border-emerald-600/30 text-emerald-300'
                      : 'bg-red-950/40 border border-red-600/30 text-red-300'
                  }`}
                >
                  {waTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="font-mono leading-relaxed">{waTestResult.message}</span>
                </div>
              )}

              {/* Fonnte & Meta Guide Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowFonnteGuide(!showFonnteGuide)}
                  className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 transition-colors underline"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showFonnteGuide ? 'Tutup Panduan WhatsApp Gateway' : 'Panduan WhatsApp Fonnte & Meta Cloud API'}
                </button>

                {showFonnteGuide && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-[#140A06] border border-[#3A2216] text-[11px] text-[#C4AEA0] space-y-2">
                    <p className="font-bold text-amber-300">Opsi 1: WhatsApp Fonnte (Mudah &amp; Populer di Indonesia):</p>
                    <ol className="list-decimal list-inside space-y-1 text-[#B0998B] leading-relaxed">
                      <li>Buka <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">fonnte.com <ExternalLink className="w-2.5 h-2.5" /></a> dan buat akun.</li>
                      <li>Scan QR WhatsApp di menu Device Fonnte.</li>
                      <li>Salin Token Fonnte $\rightarrow$ tempel ke <code>FONNTE_TOKEN=&quot;...&quot;</code> di file <code>.env</code>.</li>
                    </ol>

                    <p className="font-bold text-amber-300 pt-1">Opsi 2: Meta WhatsApp Cloud API Resmi:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[#B0998B] leading-relaxed">
                      <li>Buka <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">developers.facebook.com <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
                      <li>Isi <code>WHATSAPP_API_TOKEN</code> dan <code>WHATSAPP_PHONE_NUMBER_ID</code> di <code>.env</code>.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Email Settings */}
          <div className="p-6 rounded-2xl bg-[#1F120C] border border-[#3E2419] space-y-5">
            <div className="flex items-center justify-between border-b border-[#361E14] pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-base">Saluran Email</h3>
                  <p className="text-xs text-[#9C8274]">Pengiriman email konfirmasi HTML responsif ke pelanggan & admin</p>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#382015] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Admin Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-amber-200 uppercase tracking-wider block">
                Alamat Email Admin (Penerima Laporan)
              </label>
              <input
                type="email"
                placeholder="Contoh: adminkopimahasiswa@gmail.com"
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#140A06] border border-[#48291B] text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-600"
              />
              <p className="text-[11px] text-[#8C7467]">
                Laporan pesanan baru dan peringatan stok inventaris akan dialirkan ke alamat ini.
              </p>
            </div>

            {/* Test Email Box */}
            <div className="pt-3 border-t border-[#361E14] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-400" /> Uji Coba Pengiriman Email
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Ketik email tujuan uji coba..."
                  value={testEmailAddr}
                  onChange={(e) => setTestEmailAddr(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#140A06] border border-[#48291B] text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {testingEmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Test Email
                </button>
              </div>

              {emailTestResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    emailTestResult.success
                      ? 'bg-emerald-950/40 border border-emerald-600/30 text-emerald-300'
                      : 'bg-red-950/40 border border-red-600/30 text-red-300'
                  }`}
                >
                  {emailTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{emailTestResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card: Event Subscriptions */}
        <div className="p-6 rounded-2xl bg-[#1F120C] border border-[#3E2419] space-y-4">
          <div className="flex items-center gap-3 border-b border-[#361E14] pb-4">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Settings2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Pilih Jenis Notifikasi yang Dikirimkan</h3>
              <p className="text-xs text-[#9C8274]">
                Tentukan kondisi kejadian di website yang akan memicu pengiriman notifikasi otomatis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#150B07] border border-[#361E14] hover:border-amber-600/40 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={settings.events.orderNew}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    events: { ...settings.events, orderNew: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-[#4A2D1F] text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-white block">🛒 Pesanan Baru Masuk</span>
                <span className="text-xs text-[#8F7768] mt-0.5 block">
                  Kirim ke pelanggan dan admin saat checkout dibuat.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#150B07] border border-[#361E14] hover:border-amber-600/40 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={settings.events.paymentSuccess}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    events: { ...settings.events, paymentSuccess: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-[#4A2D1F] text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-white block">💳 Pembayaran Berhasil</span>
                <span className="text-xs text-[#8F7768] mt-0.5 block">
                  Kirim konfirmasi pelunasan saat transaksi lunas.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#150B07] border border-[#361E14] hover:border-amber-600/40 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={settings.events.orderProcessing}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    events: { ...settings.events, orderProcessing: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-[#4A2D1F] text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-white block">☕ Pesanan Diracik Barista</span>
                <span className="text-xs text-[#8F7768] mt-0.5 block">
                  Kirim update status ke pelanggan saat mulai diracik.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#150B07] border border-[#361E14] hover:border-amber-600/40 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={settings.events.orderCompleted}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    events: { ...settings.events, orderCompleted: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-[#4A2D1F] text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-white block">🎉 Pesanan Selesai / Siap</span>
                <span className="text-xs text-[#8F7768] mt-0.5 block">
                  Kirim kabar siap diambil / disajikan kepada pelanggan.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#150B07] border border-[#361E14] hover:border-amber-600/40 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={settings.events.lowStock}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    events: { ...settings.events, lowStock: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-[#4A2D1F] text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-white block">⚠️ Peringatan Stok Menipis</span>
                <span className="text-xs text-[#8F7768] mt-0.5 block">
                  Kirim alert darurat ke admin saat bahan baku &le; batas minimum.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#150B07] border border-[#361E14] hover:border-amber-600/40 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={settings.events.accountRegister}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    events: { ...settings.events, accountRegister: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-[#4A2D1F] text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-white block">👤 Pendaftaran Akun Baru</span>
                <span className="text-xs text-[#8F7768] mt-0.5 block">
                  Kirim email sambutan selamat datang kepada member baru.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Check className="w-4 h-4" /> Pengaturan notifikasi berhasil diperbarui!
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg hover:shadow-amber-900/30 transition-all flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Simpan Perubahan Pengaturan
          </button>
        </div>
      </form>

      {/* Section: Logs Audit Trail */}
      <div className="pt-6 border-t border-[#3E2519] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Riwayat Pengiriman Pesan (Log Eksternal)</h2>
              <p className="text-xs text-[#9B8476]">
                Rekaman riwayat pesan WhatsApp dan Email yang dipicu oleh website
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#180E09] p-1 rounded-xl border border-[#3A2216] text-xs">
              <button
                onClick={() => setLogChannelFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  logChannelFilter === 'ALL' ? 'bg-amber-600 text-white shadow-sm' : 'text-[#8C7467] hover:text-white'
                }`}
              >
                Semua ({summary.total})
              </button>
              <button
                onClick={() => setLogChannelFilter('WHATSAPP')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  logChannelFilter === 'WHATSAPP' ? 'bg-emerald-600 text-white shadow-sm' : 'text-[#8C7467] hover:text-white'
                }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setLogChannelFilter('EMAIL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  logChannelFilter === 'EMAIL' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#8C7467] hover:text-white'
                }`}
              >
                Email
              </button>
            </div>

            <button
              onClick={fetchLogs}
              title="Refresh Riwayat Log"
              className="p-2 bg-[#20130C] hover:bg-[#2C1910] border border-[#3E2419] text-amber-300 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-2xl bg-[#1B100A] border border-[#3A2216] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#351F14] bg-[#22140D] text-[#A89284] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Saluran</th>
                  <th className="py-3 px-4">Jenis Notifikasi</th>
                  <th className="py-3 px-4">Penerima</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ringkasan Pesan</th>
                  <th className="py-3 px-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D1A10]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#8C7467]">
                      Belum ada riwayat pengiriman pesan eksternal di database.
                    </td>
                  </tr>
                ) : (
                  logs
                    .filter((item) => logChannelFilter === 'ALL' || item.channel === logChannelFilter)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-[#23150E] transition-colors">
                        <td className="py-3.5 px-4 text-[#C4AEA0] font-mono text-[11px] whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.channel === 'WHATSAPP' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                              <Mail className="w-3 h-3" /> Email
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-white font-semibold">
                          <span className="px-2 py-0.5 rounded bg-[#2D1B13] border border-[#482A1C] text-[11px]">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#DED0C5] font-mono">
                          {item.recipient}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> SUKSES
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/20" title={item.error || 'Gagal'}>
                              <XCircle className="w-3 h-3" /> GAGAL
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#A89284] max-w-[240px] truncate">
                          {item.message}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(item)}
                            className="px-2.5 py-1 rounded bg-[#2C1910] hover:bg-[#3D2317] text-amber-200 text-[11px] font-medium transition-colors"
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#21130C] border border-[#4A2B1D] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D2317] pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Rincian Log Pengiriman
                <span className="text-xs px-2 py-0.5 rounded bg-[#321C12] text-amber-300">
                  {selectedLog.type}
                </span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#998071] hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#180D08] p-3 rounded-xl border border-[#331B10]">
                <div>
                  <span className="text-[#877163] block">Saluran:</span>
                  <span className="text-white font-bold">{selectedLog.channel}</span>
                </div>
                <div>
                  <span className="text-[#877163] block">Status:</span>
                  <span className={`font-bold ${selectedLog.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <span className="text-[#877163] block">Penerima:</span>
                  <span className="text-white font-mono">{selectedLog.recipient}</span>
                </div>
                <div>
                  <span className="text-[#877163] block">Waktu:</span>
                  <span className="text-white font-mono">{formatDate(selectedLog.createdAt)}</span>
                </div>
              </div>

              {selectedLog.error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200">
                  <span className="font-bold block mb-1">Pesan Error Provider:</span>
                  <p className="font-mono text-[11px] break-words">{selectedLog.error}</p>
                </div>
              )}

              <div>
                <span className="text-[#877163] block mb-1.5 font-semibold">Isi Pesan:</span>
                <pre className="p-3.5 rounded-xl bg-[#140A06] border border-[#351F14] text-[#F3E7DC] font-sans text-xs whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {selectedLog.message}
                </pre>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#351E14] hover:bg-[#48291B] text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
