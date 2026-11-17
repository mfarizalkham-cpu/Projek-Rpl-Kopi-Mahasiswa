# Kopi Mahasiswa

Aplikasi web pemesanan dan pengelolaan kedai kopi yang dirancang untuk mendukung kebutuhan pelanggan dan operasional bisnis Kopi Mahasiswa.

## Identitas Mahasiswa

| Informasi | Keterangan |
|---|---|
| Nama | Mochammad farizal kham |
| NIM | 41257118 |
| Kelas / Kelompok | TI - 1B - 2025 |
| Tema Topik Kelompok | Kopi Mahasiswa |

## Deskripsi Aplikasi

**Kopi Mahasiswa** adalah aplikasi web berbasis Next.js dan React dengan Tailwind CSS untuk antarmuka, serta Prisma sebagai ORM untuk pengelolaan data. Desain visualnya mengusung tema *Warm Espresso & Cream* dan menyediakan dukungan *Dark Mode* serta *Light Mode*.

Fitur utama aplikasi meliputi:

- **Katalog menu** untuk kategori Kopi, Non-Kopi, Snack, dan Toppings.
- **Pemilihan meja interaktif** untuk membantu pelanggan memilih meja yang tersedia.
- **Pemesanan dan checkout** untuk memilih menu, meninjau pesanan, dan melanjutkan proses pembayaran.
- **Manajemen stok dan resep (BOM)** untuk mengelola bahan baku, stok, dan kebutuhan bahan pada menu.
- **Dashboard analitik admin** untuk memantau data operasional dan performa penjualan.

## Login dan Logout

Pengguna masuk melalui halaman `/login` dengan email dan password akun yang terdaftar. Sistem mengarahkan pengguna sesuai role **Admin**, **Owner**, **Kasir**, **Pelanggan**, atau **Supplier**. Tidak ada login otomatis atau tombol pengisian kredensial demo. Halaman khusus role dilindungi sesi login, dan pelanggan harus login untuk melihat pesanan miliknya.

Gunakan tombol **Logout** di navigasi untuk mengakhiri sesi. Untuk akun lokal, pastikan pengguna dengan role yang diperlukan sudah tersedia di database.

### Akun Demo Lokal

| Role | Email login | Password |
|---|---|---|
| Admin | `adminkopimahasiswa@gmail.com` | `admin` |
| Owner | `ownerkopimahasiswa@gmail.com` | `owner` |
| Kasir | `kasirkopimahasiswa@gmail.com` | `kasir` |
| Pelanggan | `pelanggankopimahasiswa@gmail.com` | `pelanggan` |
| Supplier | `supplierkopimahasiswa@gmail.com` | `supplier` |

> Akun dan password ini hanya untuk demo lokal. Ganti password dan gunakan akun yang aman sebelum aplikasi dipublikasikan atau dipakai di production.

### Integrasi AI Real-Time

- **Barista AI Chatbot** membantu pelanggan mendapatkan rekomendasi menu dan informasi ketersediaan meja secara langsung.
- Panel **AI Engine Switcher** di halaman admin menyediakan pengaturan provider Google Gemini dan xAI Grok, termasuk konfigurasi API Key secara dinamis.

Untuk mengaktifkan Grok, masukkan `XAI_API_KEY` melalui `.env` atau panel pengaturan AI admin. Model default-nya `grok-4.7` dan dapat diubah melalui `GROK_MODEL`. API key tersimpan tersembunyi secara default dan hanya dapat ditampilkan oleh Admin melalui kontrol **Tampilkan API key tersimpan**.

> **Catatan konfigurasi:** Schema Prisma saat ini menggunakan MySQL. SQLite belum tercermin dalam konfigurasi kode.

## Video Dokumentasi & Demo

| Dokumentasi | Tautan |
|---|---|
| Video Progres 1 | [Link Video Progres 1](https://youtube.com/...) |
| Video Progres 2 | [Link Video Progres 2](https://youtube.com/...) |
| Video Final Demo | [Link Video Final Demo](https://youtube.com/...) |

## Petunjuk Instalasi (Setup Instruction)

### Prasyarat

- Node.js dan npm
- Git
- Database yang sesuai dengan datasource pada `prisma/schema.prisma`

### Langkah Instalasi

1. Clone repository:

   ```bash
   git clone https://github.com/mfarizalkham-cpu/Projek-Rpl-Kopi-Mahasiswa.git
   cd Projek-Rpl-Kopi-Mahasiswa
   ```

2. Pasang dependency:

   ```bash
   npm install
   ```

3. Salin `.env.example` menjadi `.env`, lalu isi variabel koneksi database dan konfigurasi lain yang diperlukan:

   **Windows PowerShell**

   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux**

   ```bash
   cp .env.example .env
   ```

   Ganti `JWT_SECRET` dengan nilai acak minimal 32 karakter, pastikan `DATABASE_URL` sesuai dengan provider database yang digunakan, dan tambahkan API Key provider untuk fitur AI eksternal bila diperlukan.

4. Terapkan schema Prisma ke database:

   ```bash
   npx prisma db push
   ```

5. Jalankan server development:

   ```bash
   npm run dev
   ```

6. Buka [http://localhost:3000](http://localhost:3000) di browser.

> **Penting:** Schema Prisma saat ini menggunakan MySQL, sehingga `DATABASE_URL` harus menunjuk ke database MySQL. Fitur Xkiro AI dan SQLite belum tercermin dalam konfigurasi kode saat ini.
