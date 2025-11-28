'use client';

import { useState, useEffect } from 'react';
import HeroSearch from '@/components/hero-search';
import PropertyCard from '@/components/property-card';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchFeaturedProperties, fetchGalleryImages, Property } from '@/lib/api';


const features = [
  {
    title: 'Verified listings',
    description: 'All properties reviewed before going live.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Direct applications',
    description: 'Contact owners and apply in minutes.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Student-first',
    description: 'Built for campus-life convenience.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
];

export default function Home() {
  const [homeBackgroundImage, setHomeBackgroundImage] = useState<string>('student-bg.webp');
  const [isLoadingHomeImage, setIsLoadingHomeImage] = useState(true);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);

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

  return (
    <main>
      {/* Hero Section */}
      <HeroSearch />

      {/* Featured Properties */}
      <section className="py-10 md:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900">Featured Properties</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Discover student accommodations near major learning centers
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
            <Button asChild size="lg">
              <a href="/search">View All Properties</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-16" style={{ backgroundColor: '#005b42' }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* App Preview */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Mobile App Available
              </div>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                Find Your Home
                <span className="block font-medium text-green-200">
                  On the Go
                </span>
              </h2>
              <p className="text-lg text-white/90 mb-8 font-light leading-relaxed">
                Download our mobile app for the best student housing experience. 
                Search, save, and apply to properties directly from your phone.
              </p>
              
              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-600">Download on the</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </a>
                
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center bg-white/10 border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-white/80">Get it on</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            
            {/* Phone Mockup */}
            <div className="relative flex justify-center">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-80 h-[600px] bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden">
                    {/* Status Bar */}
                    <div className="bg-gray-900 text-white text-xs px-4 py-2 flex justify-between items-center">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 bg-white rounded-sm"></div>
                        <div className="w-6 h-3 border border-white rounded-sm"></div>
                      </div>
                    </div>
                    
                    {/* App Content - Property Detail View */}
                    <div className="h-full bg-white">
                      {/* Property Image with Fade Effect */}
                      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {featuredProperties.length > 0 ? (
                          <div 
                            key={currentPropertyIndex}
                            className="w-full h-full bg-cover bg-center animate-fadeIn" 
                            style={{ 
                              backgroundImage: `url(${featuredProperties[currentPropertyIndex]?.featured_image || '/placeholder-house.jpg'})` 
                            }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                            
                            {/* Property Badge */}
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                              <span className="text-xs font-medium text-gray-900">Featured</span>
                            </div>
                            
                            {/* Heart Icon */}
                            <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-gray-300 rounded"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center">
                              <div className="w-8 h-8 bg-white rounded-lg"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Image Carousel Dots */}
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                          {[0, 1, 2, 3].map((dot, index) => (
                            <div 
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === 0 ? 'bg-white' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Property Details Card */}
                      <div className="p-5 bg-white">
                        {/* Address with University */}
                        <div className="mb-3">
                          <h3 className="font-semibold text-gray-900 text-base mb-1 transition-all duration-500 animate-fadeIn">
                            {featuredProperties.length > 0 ? featuredProperties[currentPropertyIndex]?.address : "123 Student Street, Windhoek"}
                          </h3>
                          <p className="text-sm text-gray-500 transition-all duration-500 animate-fadeIn">
                            {featuredProperties.length > 0 ? featuredProperties[currentPropertyIndex]?.university?.name || "Near University" : "Near UNAM"}
                          </p>
                        </div>
                        
                        {/* Property Features - Modern Icons */}
                        <div className="flex items-center gap-6 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {featuredProperties.length > 0 ? featuredProperties[currentPropertyIndex]?.rooms_available : "2"}
                              </div>
                              <div className="text-xs text-gray-500">Beds</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">1</div>
                              <div className="text-xs text-gray-500">Bath</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">1</div>
                              <div className="text-xs text-gray-500">Parking</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Price Section - Clean Single Price */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 mb-4 border border-green-100">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">Monthly Rent</h4>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-gray-600">Verified</span>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 transition-all duration-500 animate-fadeIn">
                              N${featuredProperties.length > 0 ? parseInt(featuredProperties[currentPropertyIndex]?.price_per_month || "0").toLocaleString() : "2,500"}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">per month</div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <button className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                            </svg>
                            Save Property
                          </button>
                          
                          <button className="w-full bg-white border-2 border-green-600 text-green-600 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-50 transition-all duration-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                            </svg>
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-600 text-sm animate-bounce shadow-lg">
                  ✨
                </div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs animate-pulse shadow-lg">
                  📱
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        style={{ 
          backgroundImage: `url(${homeBackgroundImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          minHeight: '50vh', 
          backgroundAttachment: 'fixed',
          transition: 'background-image 1s ease-in-out'
        }} 
        className="py-10 md:py-14 lg:py-16 bg-gray-50 relative"
      >
        {/* Loading overlay */}
        {isLoadingHomeImage && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <div className="bg-white/90 rounded-lg p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading background...</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white">Why choose Pozi Student Living?</h2>
            <p className="text-lg text-white max-w-2xl mx-auto">
              We make finding student accommodation simple, safe, and student-focused
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto text-green-600">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-white">{feature.title}</CardTitle>

                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-14 lg:py-16 pozi-green">
        <div className="mx-auto max-w-7xl px-4 text-center space-y-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">
              Ready to find your perfect student home?
            </h2>
            <p className="text-xl text-green-100">
              Join thousands of students who found their ideal accommodation through Pozi Student Living
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="/search">Start Searching</a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
              <a href="/auth/register">List Your Property</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}