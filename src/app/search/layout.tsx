import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Student Properties | Pozi',
  description: 'Search for verified student accommodation near your university. Filter by location, amenities, price, and more. Find your perfect student housing today.',
  keywords: ['search student housing', 'student property search', 'university accommodation search', 'student rentals search'],
  openGraph: {
    title: 'Search Student Properties | Pozi',
    description: 'Search for verified student accommodation near your university. Filter by location, amenities, price, and more.',
    url: 'https://pozi.com.na/search',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Search Student Properties | Pozi',
    description: 'Search for verified student accommodation near your university. Filter by location, amenities, price, and more.',
  },
  alternates: {
    canonical: '/search',
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


