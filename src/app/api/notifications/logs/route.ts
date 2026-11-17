import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const whereClause: any = {};
    if (channel && (channel === 'WHATSAPP' || channel === 'EMAIL')) {
      whereClause.channel = channel;
    }
    if (status && (status === 'SUCCESS' || status === 'FAILED' || status === 'PENDING')) {
      whereClause.status = status;
    }

    const logs = await prisma.notificationLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    const totalCount = await prisma.notificationLog.count({ where: whereClause });
    const successCount = await prisma.notificationLog.count({
      where: { ...whereClause, status: 'SUCCESS' },
    });
    const failedCount = await prisma.notificationLog.count({
      where: { ...whereClause, status: 'FAILED' },
    });

    return NextResponse.json({
      success: true,
      logs,
      summary: {
        total: totalCount,
        success: successCount,
        failed: failedCount,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications/logs:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memuat log notifikasi' },
      { status: 500 }
    );
  }
}

