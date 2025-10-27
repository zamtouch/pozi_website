import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'NAD'): string {
  // Format the number with commas for thousands separator
  const formattedNumber = new Intl.NumberFormat('en-NA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  
  // Return with N$ prefix
  return `N$${formattedNumber}`;
}

export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${distance}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number | string, 
  lon1: number | string, 
  lat2: number | string, 
  lon2: number | string
): number {
  // Convert to numbers if they're strings
  const lat1Num = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
  const lon1Num = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
  const lat2Num = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
  const lon2Num = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;

  // Check if coordinates are valid
  if (isNaN(lat1Num) || isNaN(lon1Num) || isNaN(lat2Num) || isNaN(lon2Num)) {
    return 0;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2Num - lat1Num) * Math.PI / 180;
  const dLon = (lon2Num - lon1Num) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Num * Math.PI / 180) * Math.cos(lat2Num * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Format distance for display
export function formatDistanceFromUniversity(distance: number): string {
  if (distance === 0) return '';
  if (distance < 1) return `${Math.round(distance * 1000)}m away`;
  return `${distance}km away`;
}

