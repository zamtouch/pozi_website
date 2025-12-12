import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center & FAQ | Pozi Student Housing',
  description: 'Find answers to frequently asked questions about Pozi. Learn about our services, debit order system, property listings, and how to get started as a student or property owner.',
  keywords: ['pozi faq', 'help center', 'student housing questions', 'property owner questions', 'debit order faq'],
  openGraph: {
    title: 'Help Center & FAQ | Pozi Student Housing',
    description: 'Find answers to frequently asked questions about Pozi. Learn about our services, debit order system, property listings, and how to get started.',
    url: 'https://pozi.com.na/help-center',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Help Center & FAQ | Pozi Student Housing',
    description: 'Find answers to frequently asked questions about Pozi. Learn about our services, debit order system, property listings, and how to get started.',
  },
  alternates: {
    canonical: '/help-center',
  },
};

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

