import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works | Pozi Student Housing',
  description: 'Learn how Pozi works step by step. Discover how property owners list rooms, students search for accommodation, and how our debit order system simplifies rental payments.',
  keywords: ['how pozi works', 'student housing process', 'property listing', 'debit order', 'rental payments'],
  openGraph: {
    title: 'How It Works | Pozi Student Housing',
    description: 'Learn how Pozi works step by step. Discover how property owners list rooms, students search for accommodation, and how our debit order system simplifies rental payments.',
    url: 'https://pozi.com.na/how-it-works',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'How It Works | Pozi Student Housing',
    description: 'Learn how Pozi works step by step. Discover how property owners list rooms, students search for accommodation, and how our debit order system simplifies rental payments.',
  },
  alternates: {
    canonical: '/how-it-works',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

