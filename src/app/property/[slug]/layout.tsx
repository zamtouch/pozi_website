import type { Metadata } from 'next';
import { fetchProperties } from '@/lib/api';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const properties = await fetchProperties();
    const propertyId = parseInt(params.slug as string);
    const property = properties.find(p => p.id === propertyId);

    if (property) {
      const title = `${property.title} | Pozi Student Housing`;
      const description = property.description 
        ? `${property.description.substring(0, 160)}...`
        : `View ${property.title} - verified student accommodation near ${property.university?.name || 'universities'}. ${property.rooms_available} rooms available.`;

      return {
        title,
        description,
        keywords: [
          'student housing',
          'university accommodation',
          property.university?.name || '',
          typeof property.town === 'object' && property.town !== null ? property.town.town_name : '',
          property.title,
        ].filter(Boolean),
        openGraph: {
          title,
          description,
          url: `https://pozi.com.na/property/${property.id}`,
          type: 'website',
          images: property.featured_image ? [
            {
              url: `https://pozi.com.na/api/images/${property.featured_image}`,
              width: 1200,
              height: 630,
              alt: property.title,
            },
          ] : [],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
        },
        alternates: {
          canonical: `/property/${property.id}`,
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata for property:', error);
  }

  // Fallback metadata
  return {
    title: 'Property | Pozi Student Housing',
    description: 'View property details on Pozi Student Housing',
  };
}

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

