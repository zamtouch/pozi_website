'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fetchGalleryImages, fetchUniversities, fetchTowns, fetchResidentials, University, Town, Residential } from '@/lib/api';


const popularSearches = [
  'University of Namibia',
  'Namibia University of Science and Technology',
  'International University of Management',
  'Welwitchia University',
];

export default function HeroSearch() {
  const [activeTab, setActiveTab] = useState<'student' | 'graduate'>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedResidential, setSelectedResidential] = useState('');
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [universities, setUniversities] = useState<University[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [residentials, setResidentials] = useState<Residential[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
  const [isLoadingTowns, setIsLoadingTowns] = useState(true);
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

  // Fetch towns from Directus
  useEffect(() => {
    const fetchTownsData = async () => {
      try {
        const townsData = await fetchTowns();
        setTowns(townsData);
      } catch (error) {
        console.error('Error fetching towns:', error);
      } finally {
        setIsLoadingTowns(false);
      }
    };

    fetchTownsData();
  }, []);

  // Fetch residentials when town changes
  useEffect(() => {
    if (selectedTown) {
      const fetchResidentialsData = async () => {
        try {
          const residentialsData = await fetchResidentials(parseInt(selectedTown));
          setResidentials(residentialsData);
        } catch (error) {
          console.error('Error fetching residentials:', error);
        }
      };
      fetchResidentialsData();
    } else {
      setResidentials([]);
      setSelectedResidential('');
    }
  }, [selectedTown]);

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
    const searchParams = new URLSearchParams();
    
    if (activeTab === 'student') {
      // Student search: by university
      if (selectedUniversity) {
        searchParams.set('university', selectedUniversity);
        searchParams.set('type', 'student');
      }
    } else {
      // Graduate search: by town and residential
      if (selectedTown) {
        searchParams.set('town', selectedTown);
        searchParams.set('type', 'graduate');
      }
      if (selectedResidential) {
        searchParams.set('residential', selectedResidential);
      }
    }
    
    if (searchParams.toString()) {
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
        style={{ minHeight: '85vh' }}
      >
        {/* Brand color accents */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" style={{ backgroundColor: 'rgba(214, 226, 92, 0.15)' }}></div>
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

            {/* Search Form Container */}
            <div className="rounded-2xl p-6">
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('student');
                    setSelectedTown('');
                    setSelectedResidential('');
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    activeTab === 'student'
                      ? 'bg-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={activeTab === 'student' ? { color: '#005b42' } : {}}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    I am a Student
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('graduate');
                    setSelectedUniversity('');
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    activeTab === 'graduate'
                      ? 'bg-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={activeTab === 'graduate' ? { color: '#005b42' } : {}}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    I am a Graduate
                  </span>
                </button>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="space-y-4">
                {activeTab === 'student' ? (
                  // Student Search: University
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-semibold text-white mb-2">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Select University
                        </span>
                      </label>
                      <Select
                        options={[
                          { value: '', label: 'Choose a university...' },
                          ...universities.map(uni => ({
                            value: uni.slug,
                            label: uni.name
                          }))
                        ]}
                        value={selectedUniversity}
                        onChange={(e) => setSelectedUniversity(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 text-gray-900 transition-colors"
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          fontSize: '15px',
                          '--hover-border': '#d6e25c',
                          '--focus-border': '#d6e25c',
                        } as React.CSSProperties}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#d6e25c';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#d6e25c';
                        }}
                        onMouseLeave={(e) => {
                          if (document.activeElement !== e.currentTarget) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                        disabled={isLoadingUniversities}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-base font-semibold text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-bold" 
                      style={{ 
                        backgroundColor: '#d6e25c',
                        border: 'none',
                        opacity: 1
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#c4d04a';
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#d6e25c';
                        e.currentTarget.style.opacity = '1';
                      }}
                      disabled={!selectedUniversity || isLoadingUniversities}
                    >
                      {isLoadingUniversities ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                          Loading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search Properties
                        </span>
                      )}
                    </Button>
                  </div>
                ) : (
                  // Graduate Search: Town and Residential
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Select Town
                          </span>
                        </label>
                        <Select
                          options={[
                            { value: '', label: 'Choose a town...' },
                            ...towns.map(town => ({
                              value: town.id.toString(),
                              label: town.town_name
                            }))
                          ]}
                          value={selectedTown}
                          onChange={(e) => setSelectedTown(e.target.value)}
                          className="w-full bg-white border-2 border-gray-200 text-gray-900 hover:border-yellow-400 focus:border-yellow-500 transition-colors"
                          style={{ padding: '14px', borderRadius: '12px', fontSize: '15px' }}
                          disabled={isLoadingTowns}
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-semibold text-white mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Residential Area
                          </span>
                        </label>
                        <Select
                          options={[
                            { value: '', label: selectedTown ? 'Choose residential area...' : 'Select town first' },
                            ...residentials.map(residential => ({
                              value: residential.id.toString(),
                              label: typeof residential.residential_town === 'object' 
                                ? residential.residential_town.town_name 
                                : residential.residential_name
                            }))
                          ]}
                          value={selectedResidential}
                          onChange={(e) => setSelectedResidential(e.target.value)}
                          className="w-full bg-white border-2 border-gray-200 text-gray-900 hover:border-yellow-400 focus:border-yellow-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                          style={{ padding: '14px', borderRadius: '12px', fontSize: '15px' }}
                          disabled={!selectedTown || residentials.length === 0 || isLoadingTowns}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-base font-semibold text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-bold" 
                      style={{ 
                        backgroundColor: '#d6e25c',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#c4d04a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#d6e25c';
                      }}
                      disabled={!selectedTown}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Properties
                      </span>
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Visual Element - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block relative flex items-center justify-center min-h-[400px]">
            {/* Floating Design Image */}
            <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
              <Image 
                src="/design.png" 
                alt="Pozi Design" 
                width={160} 
                height={160} 
                className="drop-shadow-lg animate-float" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
