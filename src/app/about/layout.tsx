import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Pozi | Student Housing Platform',
  description: 'Learn about Pozi - the student-first platform connecting students with verified accommodation near universities. Discover our mission, values, and commitment to making student housing simple.',
  keywords: ['about pozi', 'student housing platform', 'university accommodation', 'student rentals'],
  openGraph: {
    title: 'About Pozi | Student Housing Platform',
    description: 'Learn about Pozi - the student-first platform connecting students with verified accommodation near universities.',
    url: 'https://pozi.com.na/about',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About Pozi | Student Housing Platform',
    description: 'Learn about Pozi - the student-first platform connecting students with verified accommodation near universities.',
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


