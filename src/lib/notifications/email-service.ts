import nodemailer from 'nodemailer';
import { SendResult } from './types';

export class EmailService {
  /**
   * Validasi format email sederhana
   */
  public static isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Cek kesiapan & koneksi penyedia email (Resend API atau SMTP)
   */
  public static async checkConnection(): Promise<{ isConnected: boolean; provider: string; message: string }> {
    const resendKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Prioritas 1: Resend API
    if (resendKey && resendKey.trim().length > 0) {
      try {
        const res = await fetch('https://api.resend.com/api-keys', {
          headers: {
            Authorization: `Bearer ${resendKey}`,
          },
        });
        if (res.ok) {
          return {
            isConnected: true,
            provider: 'Resend API',
            message: 'Terhubung ke Resend API (Kunci API Valid)',
          };
        } else {
          return {
            isConnected: false,
            provider: 'Resend API',
            message: 'RESEND_API_KEY terdeteksi tetapi tidak valid atau kuota habis',
          };
        }
      } catch (err: any) {
        return {
          isConnected: false,
          provider: 'Resend API',
          message: `Gagal memverifikasi Resend: ${err.message}`,
        };
      }
    }

    // Prioritas 2: SMTP
    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        await transporter.verify();
        return {
          isConnected: true,
          provider: `SMTP (${smtpHost})`,
          message: `Koneksi SMTP ke ${smtpHost}:${process.env.SMTP_PORT || '587'} berhasil diverifikasi.`,
        };
      } catch (err: any) {
        return {
          isConnected: false,
          provider: `SMTP (${smtpHost})`,
          message: `Koneksi SMTP gagal diverifikasi: ${err.message}`,
        };
      }
    }

    return {
      isConnected: false,
      provider: 'None',
      message: 'Kredensial email belum dikonfigurasi (atur RESEND_API_KEY atau SMTP di file .env)',
    };
  }

  /**
   * Kirim email menggunakan Resend API atau Nodemailer SMTP
   */
  public static async sendEmail(to: string, subject: string, htmlContent: string): Promise<SendResult> {
    const recipient = to.trim();

    if (!this.isValidEmail(recipient)) {
      return {
        success: false,
        error: `Format alamat email tidak valid: "${to}"`,
      };
    }

    const resendKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromAddress = process.env.SMTP_FROM || 'Kopi Mahasiswa <no-reply@kopimahasiswa.id>';

    // Metode A: Resend API
    if (resendKey && resendKey.trim().length > 0) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress.includes('<') ? fromAddress : `Kopi Mahasiswa <${fromAddress}>`,
            to: [recipient],
            subject: subject,
            html: htmlContent,
          }),
        });

        const data = await response.json();

        if (response.ok && data.id) {
          return {
            success: true,
            messageId: data.id,
          };
        } else {
          return {
            success: false,
            error: data.message || JSON.stringify(data) || 'Gagal mengirim email via Resend API',
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: `Kesalahan jaringan saat memanggil Resend API: ${err.message}`,
        };
      }
    }

    // Metode B: Nodemailer SMTP
    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const info = await transporter.sendMail({
          from: fromAddress,
          to: recipient,
          subject: subject,
          html: htmlContent,
        });

        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (err: any) {
        return {
          success: false,
          error: `Gagal mengirim email via SMTP: ${err.message}`,
        };
      }
    }

    return {
      success: false,
      error: 'Kredensial email (RESEND_API_KEY atau SMTP_USER & SMTP_PASS) belum dikonfigurasi di file .env server.',
    };
  }
}

