import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function POST(req: Request) {
  try {
    const { channel, recipient } = await req.json();

    if (!channel || (channel !== 'WHATSAPP' && channel !== 'EMAIL')) {
      return NextResponse.json(
        { success: false, error: 'Channel harus WHATSAPP atau EMAIL' },
        { status: 400 }
      );
    }

    if (!recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Penerima (nomor HP atau email) wajib diisi' },
        { status: 400 }
      );
    }

    const result = await NotificationService.sendTestNotification(channel, recipient.trim());

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Pesan uji coba ${channel} berhasil dikirim ke ${recipient}!`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || `Gagal mengirim uji coba notifikasi ${channel}.`,
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('Error in POST /api/notifications/test:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}

