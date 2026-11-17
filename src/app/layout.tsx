import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatbotWidget from '@/components/ChatbotWidget';

export const metadata: Metadata = {
  title: 'Kopi Mahasiswa - Sistem E-Commerce F&B',
  description: 'Aplikasi E-Commerce Kopi dan F&B Mahasiswa dengan AI Recommendation, POS Kasir, dan Manajemen Stok Resep Otomatis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('kopi_theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen bg-coffee-50 dark:bg-espresso-950 text-coffee-950 dark:text-coffee-50 transition-colors duration-300">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <ChatbotWidget />
      </body>
    </html>
  );
}

