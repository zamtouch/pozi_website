import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { AuthProvider } from '@/lib/auth';
import CleanupOrphanedFiles from '@/components/cleanup-orphaned-files';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StudentRent - Find Student Housing Near Your University',
  description: 'Discover verified student accommodation near universities. Simple search, direct applications, and student-first experience.',
  keywords: ['student housing', 'university accommodation', 'student rentals', 'campus housing'],
  authors: [{ name: 'StudentRent Team' }],
  creator: 'StudentRent',
  publisher: 'StudentRent',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://studentrent.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'StudentRent - Find Student Housing Near Your University',
    description: 'Discover verified student accommodation near universities. Simple search, direct applications, and student-first experience.',
    url: 'https://studentrent.com',
    siteName: 'StudentRent',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudentRent - Find Student Housing Near Your University',
    description: 'Discover verified student accommodation near universities. Simple search, direct applications, and student-first experience.',
    creator: '@studentrent',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-white text-gray-900 antialiased">
        <AuthProvider>
          <CleanupOrphanedFiles />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}