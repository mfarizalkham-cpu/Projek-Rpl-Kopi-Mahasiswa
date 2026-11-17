import { NextResponse } from 'next/server';
import { SystemNotificationService } from '@/lib/system-notifications';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as any;
    const isReadParam = searchParams.get('isRead');
    const limitParam = searchParams.get('limit');

    let isRead: boolean | undefined = undefined;
    if (isReadParam === 'true') isRead = true;
    if (isReadParam === 'false') isRead = false;

    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Ambil session user saat ini untuk penyesuaian hak akses (Admin, Kasir, Owner, Pelanggan)
    const session = await getAuthSession();

    const data = await SystemNotificationService.getNotifications({
      category: category || 'ALL',
      isRead,
      limit,
      userRole: session?.role || null,
      userId: session?.id || null,
      customerName: session?.name || null,
    });

    return NextResponse.json({
      success: true,
      currentUserRole: session?.role || 'GUEST',
      ...data,
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil notifikasi' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, markAll, ids } = body;

    if (markAll) {
      await SystemNotificationService.markAllAsRead(ids);
      return NextResponse.json({
        success: true,
        message: 'Seluruh notifikasi telah ditandai sebagai sudah dibaca',
      });
    }

    if (id) {
      await SystemNotificationService.markAsRead(id);
      return NextResponse.json({
        success: true,
        message: 'Notifikasi ditandai sebagai sudah dibaca',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Parameter id atau markAll dibutuhkan' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in PATCH /api/notifications:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui status notifikasi' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      await SystemNotificationService.clearAllNotifications();
      return NextResponse.json({
        success: true,
        message: 'Semua riwayat notifikasi berhasil dibersihkan',
      });
    }

    if (id) {
      await SystemNotificationService.deleteNotification(id);
      return NextResponse.json({
        success: true,
        message: 'Notifikasi berhasil dihapus',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Parameter id atau all=true dibutuhkan' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in DELETE /api/notifications:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus notifikasi' },
      { status: 500 }
    );
  }
}
