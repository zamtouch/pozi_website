import type { Metadata } from 'next';
import './globals.css';
import ConditionalLayout from '@/components/layout/conditional-layout';
import { AuthProvider } from '@/lib/auth';
import CleanupOrphanedFiles from '@/components/cleanup-orphaned-files';

export const metadata: Metadata = {
  title: 'Pozi | Your Campus. Your Crew. Your Pozi.',
  description: 'Discover verified student accommodation near universities. Simple search, direct applications, and student-first experience.',
  keywords: ['student housing', 'university accommodation', 'student rentals', 'campus housing'],
  authors: [{ name: 'Pozi Team' }],
  creator: 'Pozi',
  publisher: 'Pozi',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pozi.com.na'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pozi | Your Campus. Your Crew. Your Pozi.',
    description: 'Discover verified student accommodation near universities. Simple search, direct applications, and student-first experience.',
    url: 'https://pozi.com.na',
    siteName: 'Pozi',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pozi | Your Campus. Your Crew. Your Pozi.',
    description: 'Discover verified student accommodation near universities. Simple search, direct applications, and student-first experience.',
    creator: '@pozi',
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
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <AuthProvider>
          <CleanupOrphanedFiles />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}