/**
 * Templates for WhatsApp and Email notifications
 * Kopi Mahasiswa - Warm Espresso Brand Identity
 */

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// -------------------------------------------------------------
// WHATSAPP TEMPLATES
// -------------------------------------------------------------

export const WhatsAppTemplates = {
  // Notifikasi Pesanan Baru (Untuk Customer)
  newOrderCustomer: (data: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }) => {
    const itemList = data.items
      .map((item) => `• ${item.name} x${item.quantity} (${formatRupiah(item.price * item.quantity)})`)
      .join('\n');

    return `☕ *KOPI MAHASISWA* ☕\n\nHalo Kak *${data.customerName}*,\nTerima kasih telah memesan di Kopi Mahasiswa! Pesanan Anda telah kami terima.\n\n📋 *Detail Pesanan:*\n• No. Pesanan: *#${data.orderNumber}*\n• Metode Bayar: ${data.paymentMethod}\n• Total: *${formatRupiah(data.totalAmount)}*\n\n🛒 *Menu yang Dipesan:*\n${itemList}\n\nKami akan segera memproses pesanan Anda. Pantau terus status pesanan di website kami ya! 🚀`;
  },

  // Notifikasi Pesanan Baru (Untuk Admin)
  newOrderAdmin: (data: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
    itemsCount: number;
  }) => {
    return `🔔 *PESANAN BARU MASUK!* 🔔\n\nHalo Admin Kopi Mahasiswa,\nAda pesanan baru yang baru saja dibuat:\n\n• No. Pesanan: *#${data.orderNumber}*\n• Pelanggan: *${data.customerName}*\n• Total: *${formatRupiah(data.totalAmount)}*\n• Pembayaran: ${data.paymentMethod}\n• Jumlah Menu: ${data.itemsCount} item\n\nSilakan cek panel Kasir / Pesanan untuk verifikasi & persiapan pesanan.`;
  },

  // Notifikasi Pembayaran Berhasil
  paymentSuccess: (data: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
  }) => {
    return `✅ *PEMBAYARAN BERHASIL* ✅\n\nHalo Kak *${data.customerName}*,\nPembayaran sebesar *${formatRupiah(data.totalAmount)}* untuk pesanan *#${data.orderNumber}* via *${data.paymentMethod}* telah kami terima dan terkonfirmasi.\n\nBarista kami saat ini sedang mulai meracik sajian kopi Anda dengan penuh cita rasa. Mohon ditunggu ya! ☕✨`;
  },

  // Notifikasi Status Pesanan Berubah
  orderStatusUpdate: (data: {
    orderNumber: string;
    customerName: string;
    status: string;
    notes?: string;
  }) => {
    let statusText = 'Sedang diproses';
    let emoji = '⏳';

    if (data.status === 'PROCESSING') {
      statusText = 'Sedang Diracik oleh Barista';
      emoji = '☕';
    } else if (data.status === 'READY') {
      statusText = 'SIAP DIAMBIL / SIAP DIKIRIM!';
      emoji = '🎉';
    } else if (data.status === 'COMPLETED') {
      statusText = 'SELESAI. Selamat Menikmati!';
      emoji = '✨';
    } else if (data.status === 'CANCELLED') {
      statusText = 'Dibatalkan';
      emoji = '❌';
    }

    return `${emoji} *UPDATE STATUS PESANAN* ${emoji}\n\nHalo Kak *${data.customerName}*,\nPesanan *#${data.orderNumber}* Anda kini berstatus:\n👉 *${statusText}*\n\n${data.notes ? `Catatan: ${data.notes}\n\n` : ''}Terima kasih telah menemani hari Anda bersama racikan Kopi Mahasiswa!`;
  },

  // Notifikasi Peringatan Stok Hampir Habis (Untuk Admin)
  lowStockAlert: (data: {
    ingredientName: string;
    currentStock: number;
    minStock: number;
    unit: string;
  }) => {
    return `⚠️ *PERINGATAN STOK MENIPIS* ⚠️\n\nPerhatian Admin / Barista Leader,\nBahan baku berikut telah mencapai batas minimum stok:\n\n• Bahan: *${data.ingredientName}*\n• Sisa Stok Saat Ini: *${data.currentStock} ${data.unit}*\n• Batas Minimum Stok: *${data.minStock} ${data.unit}*\n\nHarap segera lakukan pembelian ulang (Purchasing) kepada Supplier agar proses operasional kedai tetap berjalan lancar!`;
  },

  // Pesan Uji Coba (Test)
  testMessage: (targetName: string = 'Admin') => {
    return `🔔 *TEST NOTIFIKASI WHATSAPP - KOPI MAHASISWA*\n\nHalo *${targetName}*,\nIni adalah pesan uji coba (Test Message) dari Panel Notifikasi Kopi Mahasiswa.\n\nStatus Koneksi: *BERHASIL TERHUBUNG* ✅\nSistem notifikasi WhatsApp Business API Anda telah aktif dan siap digunakan untuk otomatisasi pesanan dan inventaris kedai! ☕🚀`;
  },
};

// -------------------------------------------------------------
// EMAIL HTML TEMPLATES (Warm Espresso Theme)
// -------------------------------------------------------------

const emailHeader = (title: string, subtitle?: string) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #120D0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5EBE1;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #120D0A; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #24140D; border: 1px solid #3E2419; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #2D1B14 0%, #4A2711 100%); padding: 32px 28px; text-align: center; border-bottom: 2px solid #C88A58;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFF; letter-spacing: 1px;">
                ☕ KOPI MAHASISWA
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #E6CCB2; text-transform: uppercase; letter-spacing: 2px;">
                Cita Rasa Terbaik untuk Pejuang Skripsi & Mahasiswa
              </p>
              ${subtitle ? `<p style="margin: 14px 0 0; font-size: 15px; font-weight: 600; color: #F5A623;">${subtitle}</p>` : ''}
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
`;

const emailFooter = () => `
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1A0D08; padding: 24px 28px; text-align: center; border-top: 1px solid #351C12;">
              <p style="margin: 0; font-size: 12px; color: #9C8274;">
                Website Resmi Kopi Mahasiswa • F&B E-Commerce & POS System
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #735C50;">
                Email ini dikirimkan secara otomatis oleh sistem. Harap tidak membalas email ini secara langsung.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const EmailTemplates = {
  // Email Pesanan Baru
  newOrder: (data: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }) => {
    const itemRows = data.items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #3E2419;">
          <td style="padding: 12px 0; color: #F5EBE1; font-size: 14px;"><strong>${item.name}</strong></td>
          <td style="padding: 12px 0; color: #D4A373; font-size: 14px; text-align: center;">${item.quantity}x</td>
          <td style="padding: 12px 0; color: #FFF; font-size: 14px; text-align: right;">${formatRupiah(item.price * item.quantity)}</td>
        </tr>
      `
      )
      .join('');

    return (
      emailHeader('Konfirmasi Pesanan Baru - Kopi Mahasiswa', 'Pesanan Anda Berhasil Diterima') +
      `
      <p style="font-size: 16px; margin: 0 0 16px; color: #FFF;">Halo <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #D6C2B4; margin: 0 0 24px;">
        Terima kasih telah memesan di Kopi Mahasiswa! Pesanan Anda dengan nomor referensi <strong>#${data.orderNumber}</strong> saat ini telah masuk ke sistem kami.
      </p>

      <div style="background-color: #2F1B12; border: 1px solid #4A2B1D; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="color: #9C8274; font-size: 13px; padding-bottom: 6px;">Nomor Pesanan</td>
            <td style="color: #FFF; font-weight: bold; font-size: 13px; text-align: right; padding-bottom: 6px;">#${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="color: #9C8274; font-size: 13px; padding-bottom: 6px;">Metode Pembayaran</td>
            <td style="color: #FFF; font-size: 13px; text-align: right; padding-bottom: 6px;">${data.paymentMethod}</td>
          </tr>
          <tr>
            <td style="color: #9C8274; font-size: 13px;">Status Pembayaran</td>
            <td style="color: ${data.paymentStatus === 'PAID' ? '#4ADE80' : '#FBBF24'}; font-weight: bold; font-size: 13px; text-align: right;">${data.paymentStatus}</td>
          </tr>
        </table>
      </div>

      <h3 style="color: #E6CCB2; font-size: 15px; margin: 0 0 12px; border-bottom: 1px solid #3E2419; padding-bottom: 8px;">
        Rincian Pesanan
      </h3>
      <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
        <thead>
          <tr style="color: #9C8274; font-size: 12px; text-transform: uppercase;">
            <th align="left" style="padding-bottom: 8px;">Menu</th>
            <th align="center" style="padding-bottom: 8px;">Qty</th>
            <th align="right" style="padding-bottom: 8px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr>
            <td colspan="2" style="padding: 16px 0 0; font-size: 15px; font-weight: bold; color: #FFF;">Total Pembayaran</td>
            <td style="padding: 16px 0 0; font-size: 18px; font-weight: bold; color: #F5A623; text-align: right;">${formatRupiah(data.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 30px;">
        <a href="http://localhost:3000/orders" style="display: inline-block; background: linear-gradient(135deg, #C88A58 0%, #9F5F32 100%); color: #FFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Lihat Status Pesanan
        </a>
      </div>
      ` +
      emailFooter()
    );
  },

  // Email Pembayaran Berhasil
  paymentSuccess: (data: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
  }) => {
    return (
      emailHeader('Pembayaran Dikonfirmasi - Kopi Mahasiswa', 'Pembayaran Sukses Terverifikasi') +
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; background: rgba(74, 222, 128, 0.15); border: 2px solid #4ADE80; border-radius: 50%; font-size: 32px; color: #4ADE80;">
          ✓
        </div>
      </div>
      <p style="font-size: 16px; margin: 0 0 16px; color: #FFF; text-align: center;">
        Halo <strong>${data.customerName}</strong>!
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #D6C2B4; text-align: center; margin: 0 0 24px;">
        Pembayaran untuk pesanan <strong>#${data.orderNumber}</strong> sebesar <strong style="color: #F5A623;">${formatRupiah(data.totalAmount)}</strong> telah berhasil kami terima.
      </p>

      <div style="background-color: #2F1B12; border: 1px solid #4A2B1D; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="color: #9C8274; font-size: 13px; padding-bottom: 6px;">Metode Pembayaran:</td>
            <td style="color: #FFF; font-weight: bold; font-size: 13px; text-align: right; padding-bottom: 6px;">${data.paymentMethod}</td>
          </tr>
          <tr>
            <td style="color: #9C8274; font-size: 13px;">Status:</td>
            <td style="color: #4ADE80; font-weight: bold; font-size: 13px; text-align: right;">LUNAS (PAID)</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #D6C2B4; text-align: center;">
        Barista kami sedang menyiapkan pesanan Anda dengan bahan-bahan pilihan. Anda akan menerima notifikasi segera saat sajian siap!
      </p>
      ` +
      emailFooter()
    );
  },

  // Email Perubahan Status Pesanan
  orderStatusChange: (data: {
    orderNumber: string;
    customerName: string;
    status: string;
  }) => {
    return (
      emailHeader('Update Status Pesanan - Kopi Mahasiswa', `Status: ${data.status}`) +
      `
      <p style="font-size: 16px; margin: 0 0 16px; color: #FFF;">Halo <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #D6C2B4; margin: 0 0 24px;">
        Pesanan Anda dengan nomor referensi <strong>#${data.orderNumber}</strong> saat ini telah diperbarui:
      </p>
      <div style="background-color: #2F1B12; border: 1px solid #C88A58; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 12px; color: #C88A58; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">STATUS PESANAN</span>
        <span style="font-size: 20px; font-weight: 800; color: #FFF;">${data.status}</span>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #D6C2B4; margin: 0 0 24px;">
        Terima kasih atas kepercayaan Anda memesan di Kopi Mahasiswa!
      </p>
      ` +
      emailFooter()
    );
  },

  // Email Peringatan Stok Menipis (Untuk Admin)
  lowStockAlert: (data: {
    ingredientName: string;
    currentStock: number;
    minStock: number;
    unit: string;
  }) => {
    return (
      emailHeader('⚠️ PERINGATAN INVENTARIS: Stok Bahan Baku Menipis', 'Peringatan Operasional Kedai') +
      `
      <p style="font-size: 16px; margin: 0 0 16px; color: #FFF;">Perhatian <strong>Tim Manajemen Kedai</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #D6C2B4; margin: 0 0 24px;">
        Sistem mendeteksi bahwa stok bahan baku berikut telah berada pada atau di bawah batas ambang minimum (minimum threshold):
      </p>

      <div style="background-color: #381B12; border: 1px solid #DC2626; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="color: #D6C2B4; font-size: 14px; padding-bottom: 8px;">Nama Bahan:</td>
            <td style="color: #FFF; font-weight: bold; font-size: 15px; text-align: right; padding-bottom: 8px;">${data.ingredientName}</td>
          </tr>
          <tr>
            <td style="color: #D6C2B4; font-size: 14px; padding-bottom: 8px;">Sisa Stok Saat Ini:</td>
            <td style="color: #F87171; font-weight: bold; font-size: 15px; text-align: right; padding-bottom: 8px;">${data.currentStock} ${data.unit}</td>
          </tr>
          <tr>
            <td style="color: #D6C2B4; font-size: 14px;">Batas Minimum:</td>
            <td style="color: #FBBF24; font-weight: bold; font-size: 15px; text-align: right;">${data.minStock} ${data.unit}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="http://localhost:3000/admin/inventory" style="display: inline-block; background: #DC2626; color: #FFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Buka Kelola Stok & Supplier
        </a>
      </div>
      ` +
      emailFooter()
    );
  },

  // Email Uji Coba (Test Email)
  testEmail: (recipientName: string = 'Admin') => {
    return (
      emailHeader('🧪 Test Notifikasi Email - Kopi Mahasiswa', 'Uji Coba Pengiriman Berhasil') +
      `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; background: rgba(59, 130, 246, 0.15); border: 2px solid #3B82F6; border-radius: 50%; font-size: 32px; color: #60A5FA;">
          ✉️
        </div>
      </div>
      <p style="font-size: 16px; margin: 0 0 16px; color: #FFF; text-align: center;">
        Halo <strong>${recipientName}</strong>!
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #D6C2B4; text-align: center; margin: 0 0 24px;">
        Ini adalah email uji coba dari <strong>Panel Pengaturan Notifikasi Kopi Mahasiswa</strong>. Jika Anda menerima email ini, berarti konfigurasi SMTP atau Resend API Anda telah berjalan dengan sukses!
      </p>
      <div style="background-color: #2F1B12; border: 1px solid #4A2B1D; border-radius: 10px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #4ADE80; font-weight: bold;">
          ✓ KONEKSI SISTEM EMAIL AKTIF & SIAP PAKAI
        </p>
      </div>
      ` +
      emailFooter()
    );
  },
};

