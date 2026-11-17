import prisma from '@/lib/prisma';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  NotificationType,
  SendResult,
} from './types';
import { WhatsAppService } from './whatsapp-service';
import { EmailService } from './email-service';
import { WhatsAppTemplates, EmailTemplates } from './templates';

const SETTINGS_KEY = 'notification_settings';

export class NotificationService {
  /**
   * Mengambil pengaturan notifikasi dari database
   */
  public static async getSettings(): Promise<NotificationSettings> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: SETTINGS_KEY },
      });

      if (!setting || !setting.value) {
        return DEFAULT_NOTIFICATION_SETTINGS;
      }

      const parsed = JSON.parse(setting.value);
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
        events: {
          ...DEFAULT_NOTIFICATION_SETTINGS.events,
          ...(parsed.events || {}),
        },
      };
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  /**
   * Menyimpan pengaturan notifikasi ke database
   */
  public static async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const current = await this.getSettings();
    const updated: NotificationSettings = {
      ...current,
      ...settings,
      events: {
        ...current.events,
        ...(settings.events || {}),
      },
    };

    await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: SETTINGS_KEY, value: JSON.stringify(updated) },
    });

    return updated;
  }

  /**
   * Sends and records the customer-facing WhatsApp receipt after checkout.
   */
  public static async notifyCheckoutOrder(order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    paymentMethod: string;
    items: Array<{
      quantity: number;
      price: number;
      menuName: string;
    }>;
  }): Promise<SendResult> {
    const settings = await this.getSettings();
    if (!settings.whatsappEnabled || !settings.events.orderNew) {
      return {
        success: false,
        error: 'Pengiriman WhatsApp pesanan dinonaktifkan di pengaturan notifikasi.',
      };
    }

    const message = WhatsAppTemplates.newOrderCustomer({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      items: order.items.map((item) => ({
        name: item.menuName,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    const result = await WhatsAppService.sendMessage(order.customerPhone, message);
    await this.logNotification({
      channel: 'WHATSAPP',
      type: 'ORDER_NEW',
      recipient: order.customerPhone,
      title: `Struk Pesanan #${order.orderNumber}`,
      message,
      status: result.success ? 'SUCCESS' : 'FAILED',
      error: result.error,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });

    return result;
  }

  /**
   * Mencatat riwayat pengiriman notifikasi ke NotificationLog
   */
  public static async logNotification(data: {
    channel: 'WHATSAPP' | 'EMAIL';
    type: NotificationType;
    recipient: string;
    title?: string;
    message: string;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
    metadata?: any;
  }) {
    try {
      return await prisma.notificationLog.create({
        data: {
          channel: data.channel,
          type: data.type,
          recipient: data.recipient,
          title: data.title || null,
          message: data.message,
          status: data.status,
          error: data.error || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
    } catch (err) {
      console.error('Failed to write to notificationLog:', err);
    }
  }

  /**
   * Mengirim notifikasi Pesanan Baru (ke Pelanggan dan ke Admin)
   */
  public static async notifyNewOrder(order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentMethod: string;
    customer?: {
      name?: string | null;
      phone?: string | null;
      email?: string | null;
      user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
    } | null;
    items?: Array<{
      quantity: number;
      price: number;
      menu?: { name: string } | null;
    }>;
  }) {
    try {
      const settings = await this.getSettings();
      if (!settings.events.orderNew) return;

      const customerName =
        order.customer?.name ||
        order.customer?.user?.name ||
        'Pelanggan Setia';
      const customerPhone = order.customer?.phone || order.customer?.user?.phone;
      const customerEmail = order.customer?.email || order.customer?.user?.email;

      const items = (order.items || []).map((i) => ({
        name: i.menu?.name || 'Menu Kopi',
        quantity: i.quantity,
        price: i.price,
      }));

      // 1. Kirim ke Pelanggan (WhatsApp)
      if (settings.whatsappEnabled && customerPhone) {
        const waText = WhatsAppTemplates.newOrderCustomer({
          orderNumber: order.orderNumber,
          customerName,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          items,
        });

        const res = await WhatsAppService.sendMessage(customerPhone, waText);
        await this.logNotification({
          channel: 'WHATSAPP',
          type: 'ORDER_NEW',
          recipient: customerPhone,
          title: 'Notifikasi Pesanan Baru (Pelanggan)',
          message: waText,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { orderId: order.id, orderNumber: order.orderNumber },
        });
      }

      // 2. Kirim ke Pelanggan (Email)
      if (settings.emailEnabled && customerEmail) {
        const html = EmailTemplates.newOrder({
          orderNumber: order.orderNumber,
          customerName,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: 'PENDING',
          items,
        });

        const res = await EmailService.sendEmail(
          customerEmail,
          `Konfirmasi Pesanan #${order.orderNumber} - Kopi Mahasiswa`,
          html
        );

        await this.logNotification({
          channel: 'EMAIL',
          type: 'ORDER_NEW',
          recipient: customerEmail,
          title: `Pesanan #${order.orderNumber} Diterima`,
          message: `Email rincian pes #${order.orderNumber} ke ${customerEmail}`,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { orderId: order.id, orderNumber: order.orderNumber },
        });
      }

      // 3. Kirim ke Admin (WhatsApp)
      if (settings.whatsappEnabled && settings.adminWhatsApp) {
        const waAdminText = WhatsAppTemplates.newOrderAdmin({
          orderNumber: order.orderNumber,
          customerName,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          itemsCount: items.length,
        });

        const res = await WhatsAppService.sendMessage(settings.adminWhatsApp, waAdminText);
        await this.logNotification({
          channel: 'WHATSAPP',
          type: 'ORDER_NEW',
          recipient: settings.adminWhatsApp,
          title: 'Notifikasi Pesanan Baru (Admin)',
          message: waAdminText,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { orderId: order.id, role: 'ADMIN' },
        });
      }

      // 4. Kirim ke Admin (Email)
      if (settings.emailEnabled && settings.adminEmail) {
        const htmlAdmin = EmailTemplates.newOrder({
          orderNumber: order.orderNumber,
          customerName: `${customerName} (Melalui Website)`,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: 'PENDING',
          items,
        });

        const res = await EmailService.sendEmail(
          settings.adminEmail,
          `[PESANAN BARU] #${order.orderNumber} oleh ${customerName}`,
          htmlAdmin
        );

        await this.logNotification({
          channel: 'EMAIL',
          type: 'ORDER_NEW',
          recipient: settings.adminEmail,
          title: `[ADMIN ALERT] Pesanan Baru #${order.orderNumber}`,
          message: `Pemberitahuan pesanan baru #${order.orderNumber} untuk Admin`,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { orderId: order.id, role: 'ADMIN' },
        });
      }
    } catch (err: any) {
      console.error('Failed to notify new order:', err);
    }
  }

  /**
   * Mengirim notifikasi Pembayaran Berhasil
   */
  public static async notifyPaymentSuccess(order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentMethod: string;
    customer?: {
      name?: string | null;
      phone?: string | null;
      email?: string | null;
      user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
    } | null;
  }) {
    try {
      const settings = await this.getSettings();
      if (!settings.events.paymentSuccess) return;

      const customerName =
        order.customer?.name || order.customer?.user?.name || 'Pelanggan Setia';
      const customerPhone = order.customer?.phone || order.customer?.user?.phone;
      const customerEmail = order.customer?.email || order.customer?.user?.email;

      // WA Pelanggan
      if (settings.whatsappEnabled && customerPhone) {
        const waText = WhatsAppTemplates.paymentSuccess({
          orderNumber: order.orderNumber,
          customerName,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
        });

        const res = await WhatsAppService.sendMessage(customerPhone, waText);
        await this.logNotification({
          channel: 'WHATSAPP',
          type: 'PAYMENT_SUCCESS',
          recipient: customerPhone,
          title: 'Konfirmasi Pembayaran Sukses',
          message: waText,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { orderId: order.id },
        });
      }

      // Email Pelanggan
      if (settings.emailEnabled && customerEmail) {
        const html = EmailTemplates.paymentSuccess({
          orderNumber: order.orderNumber,
          customerName,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
        });

        const res = await EmailService.sendEmail(
          customerEmail,
          `Pembayaran Berhasil untuk Pesanan #${order.orderNumber} - Kopi Mahasiswa`,
          html
        );

        await this.logNotification({
          channel: 'EMAIL',
          type: 'PAYMENT_SUCCESS',
          recipient: customerEmail,
          title: `Pembayaran Berhasil #${order.orderNumber}`,
          message: `Konfirmasi pembayaran pesanan #${order.orderNumber}`,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { orderId: order.id },
        });
      }
    } catch (err: any) {
      console.error('Failed to notify payment success:', err);
    }
  }

  /**
   * Mengirim notifikasi Perubahan Status Pesanan
   */
  public static async notifyOrderStatus(
    order: {
      id: string;
      orderNumber: string;
      customer?: {
        name?: string | null;
        phone?: string | null;
        email?: string | null;
        user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
      } | null;
    },
    status: string,
    notes?: string
  ) {
    try {
      const settings = await this.getSettings();

      if (status === 'PROCESSING' && !settings.events.orderProcessing) return;
      if (status === 'COMPLETED' && !settings.events.orderCompleted) return;

      const customerName =
        order.customer?.name || order.customer?.user?.name || 'Pelanggan Setia';
      const customerPhone = order.customer?.phone || order.customer?.user?.phone;
      const customerEmail = order.customer?.email || order.customer?.user?.email;

      const notifType: NotificationType =
        status === 'PROCESSING'
          ? 'ORDER_PROCESSING'
          : status === 'COMPLETED'
          ? 'ORDER_COMPLETED'
          : 'ORDER_READY';

      // WA Pelanggan
      if (settings.whatsappEnabled && customerPhone) {
        const waText = WhatsAppTemplates.orderStatusUpdate({
          orderNumber: order.orderNumber,
          customerName,
          status,
          notes,
        });

        const res = await WhatsAppService.sendMessage(customerPhone, waText);
        await this.logNotification({
          channel: 'WHATSAPP',
          type: notifType,
          recipient: customerPhone,
          title: `Status Pesanan #${order.orderNumber}: ${status}`,
          message: waText,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { orderId: order.id, status },
        });
      }

      // Email Pelanggan
      if (settings.emailEnabled && customerEmail) {
        const html = EmailTemplates.orderStatusChange({
          orderNumber: order.orderNumber,
          customerName,
          status,
        });

        const res = await EmailService.sendEmail(
          customerEmail,
          `Update Status Pesanan #${order.orderNumber}: ${status} - Kopi Mahasiswa`,
          html
        );

        await this.logNotification({
          channel: 'EMAIL',
          type: notifType,
          recipient: customerEmail,
          title: `Status Pesanan: ${status}`,
          message: `Pemberitahuan perubahan status pesanan #${order.orderNumber} menjadi ${status}`,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { orderId: order.id, status },
        });
      }
    } catch (err: any) {
      console.error('Failed to notify order status:', err);
    }
  }

  /**
   * Mengirim notifikasi Peringatan Stok Menipis ke Admin
   */
  public static async notifyLowStock(ingredient: {
    id: string;
    name: string;
    stock: number;
    minStock: number;
    unit: string;
  }) {
    try {
      const settings = await this.getSettings();
      if (!settings.events.lowStock) return;

      // WA ke Admin
      if (settings.whatsappEnabled && settings.adminWhatsApp) {
        const waText = WhatsAppTemplates.lowStockAlert({
          ingredientName: ingredient.name,
          currentStock: ingredient.stock,
          minStock: ingredient.minStock,
          unit: ingredient.unit,
        });

        const res = await WhatsAppService.sendMessage(settings.adminWhatsApp, waText);
        await this.logNotification({
          channel: 'WHATSAPP',
          type: 'LOW_STOCK',
          recipient: settings.adminWhatsApp,
          title: `Peringatan Stok: ${ingredient.name}`,
          message: waText,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { ingredientId: ingredient.id, stock: ingredient.stock },
        });
      }

      // Email ke Admin
      if (settings.emailEnabled && settings.adminEmail) {
        const html = EmailTemplates.lowStockAlert({
          ingredientName: ingredient.name,
          currentStock: ingredient.stock,
          minStock: ingredient.minStock,
          unit: ingredient.unit,
        });

        const res = await EmailService.sendEmail(
          settings.adminEmail,
          `[PERINGATAN STOK MENIPIS] Bahan Baku: ${ingredient.name}`,
          html
        );

        await this.logNotification({
          channel: 'EMAIL',
          type: 'LOW_STOCK',
          recipient: settings.adminEmail,
          title: `Peringatan Stok Menipis: ${ingredient.name}`,
          message: `Stok bahan baku ${ingredient.name} tersisa ${ingredient.stock} ${ingredient.unit} (Min: ${ingredient.minStock})`,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { ingredientId: ingredient.id, stock: ingredient.stock },
        });
      }
    } catch (err: any) {
      console.error('Failed to notify low stock:', err);
    }
  }

  /**
   * Mengirim Test Notifikasi (WhatsApp atau Email)
   */
  public static async sendTestNotification(
    channel: 'WHATSAPP' | 'EMAIL',
    recipient: string
  ): Promise<SendResult> {
    try {
      if (channel === 'WHATSAPP') {
        const message = WhatsAppTemplates.testMessage('Admin Kopi Mahasiswa');
        const res = await WhatsAppService.sendMessage(recipient, message);

        await this.logNotification({
          channel: 'WHATSAPP',
          type: 'TEST_NOTIFICATION',
          recipient,
          title: 'Test Notifikasi WhatsApp',
          message,
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { test: true },
        });

        return res;
      } else {
        const html = EmailTemplates.testEmail('Admin Kopi Mahasiswa');
        const res = await EmailService.sendEmail(
          recipient,
          '🧪 Test Notifikasi Email - Kopi Mahasiswa',
          html
        );

        await this.logNotification({
          channel: 'EMAIL',
          type: 'TEST_NOTIFICATION',
          recipient,
          title: 'Test Notifikasi Email',
          message: 'Pesan uji coba sistem notifikasi email Kopi Mahasiswa',
          status: res.success ? 'SUCCESS' : 'FAILED',
          error: res.error,
          metadata: { test: true },
        });

        return res;
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Terjadi kesalahan sistem saat mengirim test notifikasi',
      };
    }
  }
}
