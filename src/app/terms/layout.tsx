import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Pozi Student Housing',
  description: 'Read Pozi\'s Terms & Conditions to understand the rules and guidelines for using our student housing platform. Learn about your rights and responsibilities.',
  keywords: ['terms and conditions', 'terms of service', 'student housing terms', 'pozi terms'],
  openGraph: {
    title: 'Terms & Conditions | Pozi Student Housing',
    description: 'Read Pozi\'s Terms & Conditions to understand the rules and guidelines for using our student housing platform.',
    url: 'https://pozi.com.na/terms',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms & Conditions | Pozi Student Housing',
    description: 'Read Pozi\'s Terms & Conditions to understand the rules and guidelines for using our student housing platform.',
  },
  alternates: {
    canonical: '/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

