import { SendResult } from './types';

export class WhatsAppService {
  /**
   * Mengambil konfigurasi WhatsApp dari environment variable saat runtime.
   * Mendukung Meta Cloud API dan WhatsApp Gateway Fonnte.
   */
  public static getConfig() {
    const fonnteToken = (
      process.env.FONNTE_TOKEN ||
      process.env.WHATSAPP_FONNTE_TOKEN ||
      ''
    ).trim();

    const metaToken = (
      process.env.WHATSAPP_API_TOKEN ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      ''
    ).trim();

    const phoneNumberId = (
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      ''
    ).trim();

    const businessAccountId = (
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
      ''
    ).trim();

    // Provider prioritas: jika Fonnte terisi, atau Meta terisi
    let provider: 'FONNTE' | 'META' | 'NONE' = 'NONE';
    if (fonnteToken) {
      provider = 'FONNTE';
    } else if (metaToken && phoneNumberId) {
      provider = 'META';
    }

    return {
      provider,
      fonnteToken,
      token: metaToken,
      phoneNumberId,
      businessAccountId,
    };
  }

  /**
   * Format nomor telepon ke standar internasional WhatsApp resmi (E.164 tanpa tanda +).
   * Mengubah awalan nomor Indonesia:
   * - 08123456789 -> 628123456789
   * - +62 812-3456-789 -> 628123456789
   * - 8123456789 -> 628123456789
   */
  public static formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Hapus seluruh karakter non-digit (spasi, tanda plus, strip, tanda kurung)
    let cleaned = phone.replace(/[^0-9]/g, '');

    // Konversi format awalan Indonesia
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }

    // Koreksi jika pengguna menulis 6208... menjadi 628...
    if (cleaned.startsWith('620')) {
      cleaned = '62' + cleaned.substring(3);
    }

    return cleaned;
  }

  /**
   * Validasi format nomor telepon WhatsApp
   */
  public static isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return formatted.length >= 10 && formatted.length <= 16 && formatted.startsWith('62');
  }

  /**
   * Format detail pesan error dari Meta Cloud API agar terbaca jelas oleh user
   */
  private static parseMetaError(errObj: any): string {
    if (!errObj) return 'Terjadi kesalahan tidak diketahui dari Meta API';

    const metaErr = errObj.error || errObj;
    const code = metaErr.code;
    const subcode = metaErr.error_subcode;
    const message = metaErr.message || 'Meta API request failed';
    const details = metaErr.error_data?.details;

    let humanHint = '';
    if (code === 190) {
      humanHint = ' [Solusi: Access Token Meta kedaluwarsa atau tidak valid. Silakan buat token baru di Meta for Developers]';
    } else if (code === 131030) {
      humanHint = ' [Solusi: Nomor tujuan belum didaftarkan di "To" Test Numbers pada dashboard Meta App]';
    } else if (code === 100) {
      humanHint = ' [Solusi: Phone Number ID tidak valid atau parameter payload salah]';
    } else if (code === 131047) {
      humanHint = ' [Solusi: Diperlukan pesan Template karena sudah melewati batas 24-hour window pelanggan]';
    }

    const codeStr = code ? `(Code: ${code}${subcode ? `, Subcode: ${subcode}` : ''})` : '';
    const detailStr = details ? ` - Detail: ${details}` : '';

    return `Meta API Error ${codeStr}: ${message}${detailStr}${humanHint}`;
  }

  /**
   * Cek status koneksi WhatsApp (Mendukung Fonnte atau Meta Cloud API)
   */
  public static async checkConnection(): Promise<{ isConnected: boolean; message: string; provider: string; details?: any }> {
    const { provider, fonnteToken, token, phoneNumberId, businessAccountId } = this.getConfig();

    // 1. Cek Fonnte jika token terisi
    if (fonnteToken) {
      try {
        const response = await fetch('https://api.fonnte.com/device', {
          method: 'POST',
          headers: {
            Authorization: fonnteToken,
          },
        });
        const data = await response.json();

        if (data.status) {
          const deviceName = data.name || data.device || 'Fonnte WhatsApp Device';
          const deviceStatus = data.device_status || 'Connect';
          return {
            isConnected: deviceStatus.toLowerCase() === 'connect',
            provider: 'Fonnte WhatsApp API',
            message: `Terhubung ke Fonnte Gateway: ${deviceName} (${data.device || ''}) - Status: ${deviceStatus}`,
            details: data,
          };
        } else {
          return {
            isConnected: false,
            provider: 'Fonnte WhatsApp API',
            message: `Fonnte Error: ${data.reason || 'Koneksi perangkat WhatsApp belum aktif'}`,
            details: data,
          };
        }
      } catch (err: any) {
        return {
          isConnected: false,
          provider: 'Fonnte WhatsApp API',
          message: `Gagal memverifikasi Fonnte API: ${err.message}`,
        };
      }
    }

    // 2. Cek Meta WhatsApp Cloud API jika kredensial terisi
    if (token && phoneNumberId) {
      try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.id) {
          const verifiedName = data.verified_name || data.display_phone_number || 'Akun Resmi Meta WhatsApp';
          const phone = data.display_phone_number ? ` (${data.display_phone_number})` : '';
          const quality = data.quality_rating ? ` • Rating Kualitas: ${data.quality_rating}` : '';

          return {
            isConnected: true,
            provider: 'Meta WhatsApp Cloud API',
            message: `Terhubung resmi ke Meta Cloud API: ${verifiedName}${phone}${quality}`,
            details: {
              id: data.id,
              verified_name: data.verified_name,
              display_phone_number: data.display_phone_number,
              business_account_id: businessAccountId || undefined,
            },
          };
        } else {
          const parsedErr = this.parseMetaError(data);
          return {
            isConnected: false,
            provider: 'Meta WhatsApp Cloud API',
            message: parsedErr,
            details: data,
          };
        }
      } catch (err: any) {
        return {
          isConnected: false,
          provider: 'Meta WhatsApp Cloud API',
          message: `Gagal menghubungi server Meta Graph API: ${err.message}`,
        };
      }
    }

    // 3. Jika belum dikonfigurasi
    return {
      isConnected: false,
      provider: 'None',
      message: 'Kredensial WhatsApp belum lengkap. Silakan isi FONNTE_TOKEN (Fonnte API) atau WHATSAPP_API_TOKEN di file .env server.',
    };
  }

  /**
   * Kirim pesan teks WhatsApp (Mendukung Fonnte atau Meta Cloud API)
   */
  public static async sendMessage(to: string, message: string): Promise<SendResult> {
    const { fonnteToken, token, phoneNumberId } = this.getConfig();

    const formattedRecipient = this.formatPhoneNumber(to);
    if (!this.isValidPhoneNumber(formattedRecipient)) {
      return {
        success: false,
        error: `Format nomor WhatsApp tidak valid: "${to}". Gunakan nomor Indonesia (cth: 08123456789 atau 628123456789).`,
      };
    }

    // Prioritas 1: Jika FONNTE_TOKEN tersedia
    if (fonnteToken) {
      try {
        const formData = new URLSearchParams();
        formData.append('target', formattedRecipient);
        formData.append('message', message);
        formData.append('countryCode', '62');

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: fonnteToken,
          },
          body: formData,
        });

        const data = await response.json();

        if (data.status) {
          return {
            success: true,
            messageId: Array.isArray(data.id) ? data.id[0] : data.id || 'fonnte-success',
          };
        } else {
          return {
            success: false,
            error: `Fonnte Error: ${data.reason || 'Gagal mengirim pesan via Fonnte'}`,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: `Kesalahan jaringan saat memanggil Fonnte API: ${err.message}`,
        };
      }
    }

    // Prioritas 2: Jika Meta Cloud API tersedia
    if (token && phoneNumberId) {
      try {
        const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
        
        const payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedRecipient,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.messages?.[0]?.id) {
          return {
            success: true,
            messageId: data.messages[0].id,
          };
        } else {
          const errorDetail = this.parseMetaError(data);
          return {
            success: false,
            error: errorDetail,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: `Kesalahan jaringan saat memanggil Meta WhatsApp API: ${err.message}`,
        };
      }
    }

    return {
      success: false,
      error: 'Kredensial WhatsApp belum dikonfigurasi. Silakan isi FONNTE_TOKEN atau WHATSAPP_API_TOKEN di file .env server.',
    };
  }
}
