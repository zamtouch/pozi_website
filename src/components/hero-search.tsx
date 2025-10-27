'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
        className="flex items-center relative"
        style={{ minHeight: '75vh' }}
      >
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
                Find student housing near your university
              </h1>
              <p className="text-base sm:text-lg text-white/90 max-w-lg leading-relaxed">
                Discover verified accommodation options with simple search, 
                direct applications, and student-first experience.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4 text-white">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Search by university or city"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search by university or city"
                  className="w-full bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/30 focus:border-white/50 h-12 text-base"
                />
                <Button type="submit" className="w-full sm:w-auto h-12 text-base font-medium">
                  Search
                </Button>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
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
                  label="Filter by University"
                  variant="white"
                  className="w-full bg-white/20 border-white/30 text-white"
                  style={{ padding: '12px', borderRadius: '8px' }}
                />
                <Button variant="outline" className="w-full h-12 border-white/30 text-white hover:bg-white/20 hover:border-white/50">
                  Advanced Filters
                </Button>
              </div>
            </form>

            {/* Mobile Verified Badge */}
            <div className="lg:hidden flex items-center justify-center pt-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Verified Properties Checked</span>
              </div>
            </div>
          </div>

          {/* Visual Element - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block relative flex items-center justify-center min-h-[400px]">
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 rounded-2xl bg-white shadow-lg border border-gray-100 p-6 w-56 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Verified</p>
                  <p className="text-xs text-gray-500">Property checked</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 rounded-2xl bg-white shadow-lg border border-gray-100 p-6 w-56 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Quick Apply</p>
                  <p className="text-xs text-gray-500">Apply in minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
