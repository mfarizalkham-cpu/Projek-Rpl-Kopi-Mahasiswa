export type NotificationType =
  | 'ORDER_NEW'
  | 'PAYMENT_SUCCESS'
  | 'ORDER_PROCESSING'
  | 'ORDER_READY'
  | 'ORDER_COMPLETED'
  | 'LOW_STOCK'
  | 'ACCOUNT_REGISTER'
  | 'TEST_NOTIFICATION';

export interface NotificationSettings {
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

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  whatsappEnabled: true,
  emailEnabled: true,
  adminWhatsApp: process.env.WHATSAPP_ADMIN_PHONE || '081234567890',
  adminEmail: process.env.ADMIN_EMAIL || 'adminkopimahasiswa@gmail.com',
  events: {
    orderNew: true,
    paymentSuccess: true,
    orderProcessing: true,
    orderCompleted: true,
    lowStock: true,
    accountRegister: true,
  },
};

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

