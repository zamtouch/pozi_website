'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import SmileyIcon from '@/components/ui/smiley-icon';
import { fetchGalleryImages, fetchUniversities, University } from '@/lib/api';


const popularSearches = [
  'University of Namibia',
  'Namibia University of Science and Technology',
  'International University of Management',
  'Welwitchia University',
];

export default function HeroSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
  const router = useRouter();

  // Fetch images from Directus
  useEffect(() => {
    const fetchSliderImages = async () => {
      try {
        const imageUrls = await fetchGalleryImages('slider');
        setSliderImages(imageUrls.slice(0, 2)); // Get first two images
      } catch (error) {
        console.error('Error fetching slider images:', error);
        // Fallback to default image
        setSliderImages(['student2.webp']);
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchSliderImages();
  }, []);

  // Fetch universities from Directus
  useEffect(() => {
    const fetchUniversitiesData = async () => {
      try {
        const universitiesData = await fetchUniversities();
        setUniversities(universitiesData);
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setIsLoadingUniversities(false);
      }
    };

    fetchUniversitiesData();
  }, []);

  // Rotate images every 5 seconds
  useEffect(() => {
    if (sliderImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const university = selectedUniversity;
    
    if (query || university) {
      const searchParams = new URLSearchParams();
      if (query) searchParams.set('q', query);
      if (university) searchParams.set('university', university);
      
      router.push(`/search?${searchParams.toString()}`);
    }
  };

  // Get current background image
  const getCurrentBackgroundImage = () => {
    if (sliderImages.length === 0) return 'student2.webp';
    return sliderImages[currentImageIndex];
  };

  return (
    <>
      {/* Ken Burns Animation Styles */}
      <style jsx>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          25% {
            transform: scale(1.05) translate(-2%, -1%);
          }
          50% {
            transform: scale(1.1) translate(-1%, -2%);
          }
          75% {
            transform: scale(1.05) translate(1%, -1%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }
        
        @keyframes kenBurnsReverse {
          0% {
            transform: scale(1) translate(0, 0);
          }
          25% {
            transform: scale(1.05) translate(2%, 1%);
          }
          50% {
            transform: scale(1.1) translate(1%, 2%);
          }
          75% {
            transform: scale(1.05) translate(-1%, 1%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }
      `}</style>
      
      <section 
        className="flex items-center relative overflow-hidden"
        style={{ minHeight: '75vh' }}
      >
        {/* Brand color accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-300/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none z-0"></div>
        {/* Ken Burns Background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${getCurrentBackgroundImage()})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            animation: `${currentImageIndex % 2 === 0 ? 'kenBurns' : 'kenBurnsReverse'} 25s ease-in-out infinite`
          }}
        />
      {/* Loading overlay */}
      {isLoadingImages && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
          <div className="bg-white/90 rounded-lg p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading images...</p>
          </div>
        </div>
      )}

      {/* Image indicators */}
      {sliderImages.length > 1 && !isLoadingImages && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 items-center min-h-[65vh] py-8 lg:py-0">
          {/* Content */}
          <div className="space-y-4 sm:space-y-6 flex flex-col justify-center max-w-2xl lg:max-w-none">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight leading-tight" style={{ color:'rgba(255, 255, 255, 0.9)' }}>
                Your Campus. Your Crew. Your Pozi.
              </h1>
              <p className="text-base sm:text-lg text-white/90 max-w-lg leading-relaxed">
                Discover verified accommodation options with simple search, 
                direct applications, and student-first experience.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4 text-white">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Select
                  options={[
                    { value: '', label: 'Select University' },
                    ...universities.map(uni => ({
                      value: uni.slug,
                      label: uni.name
                    }))
                  ]}
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  variant="white"
                  className="w-full bg-white/20 border-white/30 text-white"
                  style={{ padding: '12px', borderRadius: '8px' }}
                />
                <Button type="submit" className="w-full sm:w-auto h-12 text-base font-medium">
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Visual Element - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block relative flex items-center justify-center min-h-[400px]">
            {/* Floating Smiley Icon */}
            <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
              <SmileyIcon size={80} color="pink" className="drop-shadow-lg animate-float" />
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
