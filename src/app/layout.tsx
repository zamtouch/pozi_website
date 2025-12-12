import type { Metadata } from 'next';
import Script from 'next/script';
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
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-X0870TDHVF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X0870TDHVF');
          `}
        </Script>
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