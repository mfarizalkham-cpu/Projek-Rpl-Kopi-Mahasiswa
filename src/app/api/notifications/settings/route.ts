import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/notification-service';
import { WhatsAppService } from '@/lib/notifications/whatsapp-service';
import { EmailService } from '@/lib/notifications/email-service';

export async function GET() {
  try {
    const settings = await NotificationService.getSettings();

    // Cek status koneksi realtime ke provider API
    const [waConnection, emailConnection] = await Promise.all([
      WhatsAppService.checkConnection(),
      EmailService.checkConnection(),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      status: {
        whatsapp: waConnection,
        email: emailConnection,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications/settings:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memuat pengaturan notifikasi' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const updated = await NotificationService.updateSettings(body);

    return NextResponse.json({
      success: true,
      message: 'Pengaturan notifikasi berhasil disimpan!',
      settings: updated,
    });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/settings:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menyimpan pengaturan notifikasi' },
      { status: 500 }
    );
  }
}

