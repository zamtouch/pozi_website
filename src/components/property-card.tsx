import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDistance, calculateDistance, formatDistanceFromUniversity } from '@/lib/utils';
import { getImageUrl, Property, University } from '@/lib/api';

interface PropertyCardProps {
  property: Property;
  universityData?: University | null;
  className?: string;
}

export default function PropertyCard({ property, universityData, className }: PropertyCardProps) {
  const {
    id,
    title,
    description,
    price_per_month,
    currency,
    address,
    distance_from_campus,
    rooms_available,
    total_rooms,
    featured_image,
    image_1,
    image_2,
    image_3,
    image_4,
    photos,
    amenities,
    approved,
    featured,
    university,
  } = property;

  // Handle amenities array format from Directus
  const amenitiesList = (() => {
    const amenitiesArray = amenities;
    
    if (!amenitiesArray || !Array.isArray(amenitiesArray)) {
      return [];
    }

    // Map amenity keys to display names
    const amenityMap: { [key: string]: string } = {
      'wifi': 'Wi-Fi',
      'furnished': 'Furnished',
      'parking': 'Parking',
      'security': 'Security',
      'air_conditioning': 'Air Conditioning',
      'study_desk': 'Study Desk'
    };

    return amenitiesArray
      .map(amenity => amenityMap[amenity] || amenity)
      .filter(Boolean);
  })();

  // Use featured_image as the main property image, fallback to image_1, then first photo, then placeholder
  const mainPhoto = (() => {
    if (featured_image) {
      return featured_image; // featured_image is already a full URL from API
    }
    
    if (image_1) {
      return getImageUrl(image_1);
    }
    
    const normalizedPhotos = Array.isArray(photos) ? photos : [];
    if (normalizedPhotos[0]) {
      return getImageUrl(normalizedPhotos[0]);
    }
    
    return '/placeholder-property.svg';
  })();
  
  // Calculate distance from university if university data is available
  const distanceFromUniversity = (() => {
    if (!universityData || !property.latitude || !property.longitude) {
      return null;
    }
    
    const distance = calculateDistance(
      property.latitude,
      property.longitude,
      universityData.latitude,
      universityData.longitude
    );
    
    return distance > 0 ? distance : null;
  })();

  // Debug: Log photo information (uncomment for debugging)
  // console.log(`Property ${id} - Featured Image:`, featured_image, 'Main Photo URL:', mainPhoto);
  const availableText = rooms_available === 1 ? 'room' : 'rooms';
  const totalText = total_rooms === 1 ? 'room' : 'rooms';

  return (
    <Card hover className={className}>
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden rounded-t-2xl bg-gray-100">
          <Image
            src={mainPhoto}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = '/placeholder-property.svg';
            }}
          />
        </div>
        
     

        {/* Price Badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(parseFloat(price_per_month), currency)}
            </span>
            <span className="text-sm text-gray-500">/mo</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 text-base sm:text-lg leading-tight">
          {title}
        </h3>

     

        {/* Location & Distance */}
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-2 text-xs sm:text-sm">{address}</span>
          </div>
          
          {distanceFromUniversity && (
            <div className="flex items-center text-sm text-green-600 font-medium">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{formatDistanceFromUniversity(distanceFromUniversity)} from {universityData?.name}</span>
            </div>
          )}
          
          {!distanceFromUniversity && distance_from_campus && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{formatDistance(distance_from_campus)} from campus</span>
            </div>
          )}
        </div>

        {/* Room Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              {rooms_available} {availableText} available
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              {total_rooms} {totalText} total
            </span>
          </div>
        </div>

    
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {university?.name}
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/property/${id}`}>
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
