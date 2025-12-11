'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import HeroSearch from '@/components/hero-search';
import PropertyCard from '@/components/property-card';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CheckmarkIcon from '@/components/ui/checkmark-icon';
import SmileyFaceIcon from '@/components/ui/smiley-face-icon';
import GraduationCapIcon from '@/components/ui/graduation-cap-icon';
import { fetchFeaturedProperties, fetchGalleryImages, Property } from '@/lib/api';


const features = [
  {
    title: 'Verified listings',
    description: 'All properties reviewed before going live.',
    icon: <Image src="/verified.png" alt="Verified" width={128} height={128} />,
  },
  {
    title: 'Direct applications',
    description: 'Contact owners and apply in minutes.',
    icon: <Image src="/direct.png" alt="Application" width={128} height={128} />,
  },
  {
    title: 'Student-first',
    description: 'Built for campus-life convenience.',
    icon: <Image src="/student_first.png" alt="Student" width={128} height={128} />,
  },
];

export default function Home() {
  const [homeBackgroundImage, setHomeBackgroundImage] = useState<string>('student-bg.webp');
  const [isLoadingHomeImage, setIsLoadingHomeImage] = useState(true);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);

  // App demo images from public folder
  const appDemoImages = [
    '/app_demo/pozi_demo1.webp',
    '/app_demo/pozi_demo2.webp',
  ];
  const [currentAppImageIndex, setCurrentAppImageIndex] = useState(0);

  // Fetch home background image and featured properties from Directus
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch background image
        const homeImages = await fetchGalleryImages('home');
        if (homeImages.length > 0) {
          setHomeBackgroundImage(homeImages[0]);
        }

        // Fetch featured properties (max 4)
        const properties = await fetchFeaturedProperties();
        // console.log('Fetched featured properties count:', properties.length);
        // console.log('Featured properties:', properties);
        setFeaturedProperties(properties);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Keep fallback values
        setHomeBackgroundImage('student-bg.webp');
        setFeaturedProperties([]);
      } finally {
        setIsLoadingHomeImage(false);
        setIsLoadingProperties(false);
      }
    };

    fetchData();
  }, []);

  // Cycle through properties for mobile mockup
  useEffect(() => {
    if (featuredProperties.length > 1) {
      const interval = setInterval(() => {
        setCurrentPropertyIndex((prev) => (prev + 1) % featuredProperties.length);
      }, 3000); // Change every 3 seconds
      return () => clearInterval(interval);
    }
  }, [featuredProperties]);

  // Cycle through app demo images for mobile mockup
  useEffect(() => {
    if (appDemoImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentAppImageIndex((prev) => (prev + 1) % appDemoImages.length);
      }, 3000); // Change every 3 seconds
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <main>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Pozi',
            description: 'Student housing platform connecting students with verified accommodation near universities',
            url: 'https://pozi.com.na',
            logo: 'https://pozi.com.na/logo.png',
            sameAs: [
              'https://www.tiktok.com/@mypozi',
              'https://www.instagram.com/mypozi_',
              'https://x.com/mypozi_',
              'https://www.linkedin.com/company/110116143',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              availableLanguage: 'English',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Pozi',
            url: 'https://pozi.com.na',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://pozi.com.na/search?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      {/* Hero Section */}
      <HeroSearch />

      {/* Featured Properties */}
      <section className="py-10 md:py-14 lg:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900">Featured Properties</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Discover student accommodations near major learning centers and universities.
            </p>
          </div>
          
          {isLoadingProperties ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No featured properties available at the moment.</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for new listings!</p>
            </div>
          )}
          
          <div className="text-center">
            <a 
              href="/search" 
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-900 rounded-xl transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              View All Properties
            </a>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* App Preview */}
            <div className="text-center lg:text-left" style={{ paddingBottom: '100px' }}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl mb-6" style={{ color: '#005b42' }}>
                <span className="font-light">Find your home</span><br></br>{' '}
                <span className="font-bold">on the go</span>
              </h2>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Download our mobile app for the best student housing experience. 
                Search, save and apply to properties directly from your phone.
              </p>
              
              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors duration-200 shadow-lg"
                  style={{ backgroundColor: '#005b42', color: 'white' }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-white/90">Download on the</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </a>
                
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors duration-200"
                  style={{ backgroundColor: '#005b42', color: 'white' }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-white/90">GET IT ON</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            
            {/* Phone Mockup */}
            <div className="relative flex justify-center">
              <div className="relative inline-block">
                {appDemoImages.length > 0 ? (
                  <div className="relative inline-block" style={{ border: '10px solid #000000', borderRadius: '30px', overflow: 'hidden' }}>
                    <img
                      key={currentAppImageIndex}
                      src={appDemoImages[currentAppImageIndex]}
                      alt={`App demo screenshot ${currentAppImageIndex + 1}`}
                      className="block"
                      style={{ display: 'block', height: '85vh', width: 'auto' }}
                    />
                        
                        {/* Image Carousel Dots */}
                    {appDemoImages.length > 1 && (
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                        {appDemoImages.map((_, index) => (
                            <div 
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              index === currentAppImageIndex ? 'bg-white' : 'bg-white/40'
                              }`}
                            />
                          ))}
                      </div>
                    )}
                        </div>
                ) : (
                  <div className="bg-gray-200 flex items-center justify-center p-8" style={{ border: '10px solid #000000' }}>
                    <p className="text-gray-500">No images available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Why choose Pozi? */}
      <section 
        className="py-16 md:py-20 lg:py-24 relative overflow-visible"
        style={{ backgroundColor: '#fce7f3', marginTop: '-30vh' }} // Light pink background
      >
        {/* Curved Top Edge - Creates wave effect that overlaps previous section */}
        <div className="absolute top-0 left-0 w-full" style={{ height: '120px', marginTop: '-60px', zIndex: 1 }}>
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ display: 'block' }}
          >
            <path
              d="M0,120 C240,60 480,60 720,80 C960,100 1200,60 1320,70 C1380,75 1410,70 1440,60 L1440,120 L0,120 Z"
              fill="#fce7f3"
            />
          </svg>
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold" style={{ color: '#005b42' }}>Why choose Pozi?</h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
              We make finding student accommodation simple, safe and student-focused
            </p>
          </div>
          
          <div className="grid gap-12 md:gap-16 md:grid-cols-3 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              return (
                <div key={index} className="text-center space-y-4">
                  <div className="w-40 h-40 mx-auto flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-semibold" style={{ color: '#005b42' }}>{feature.title}</h3>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 lg:py-24 pozi-green relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight">
              Ready to find your perfect student home?
            </h2>
            <p className="text-lg md:text-xl text-green-100 leading-relaxed">
              Join thousands of students who found their ideal accommodation through Pozi Student Living
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" variant="secondary" asChild>
              <a href="/search">Start Searching</a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white border-white text-green-600 hover:bg-gray-50" asChild>
              <a href="/auth/register">List Your Property</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}