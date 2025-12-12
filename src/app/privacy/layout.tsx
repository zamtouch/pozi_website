import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Pozi Student Housing',
  description: 'Read Pozi\'s Privacy Policy to understand how we collect, use, and protect your personal information. We are committed to safeguarding your privacy and data security.',
  keywords: ['privacy policy', 'data protection', 'student housing privacy', 'pozi privacy'],
  openGraph: {
    title: 'Privacy Policy | Pozi Student Housing',
    description: 'Read Pozi\'s Privacy Policy to understand how we collect, use, and protect your personal information.',
    url: 'https://pozi.com.na/privacy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | Pozi Student Housing',
    description: 'Read Pozi\'s Privacy Policy to understand how we collect, use, and protect your personal information.',
  },
  alternates: {
    canonical: '/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}





