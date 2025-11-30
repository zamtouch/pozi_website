'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from '@/components/property-card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { searchProperties, fetchProperties, fetchUniversities, Property, University } from '@/lib/api';


// University options will be loaded dynamically from API

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [selectedUniversity, setSelectedUniversity] = useState(searchParams.get('university') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
  const [selectedUniversityData, setSelectedUniversityData] = useState<University | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (university: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          setIsLoading(true);
          try {
            let results: Property[] = [];
            
            if (university) {
              results = await searchProperties('', university, []);
            } else {
              results = await fetchProperties();
            }
            
            setProperties(results);
          } catch (error) {
            console.error('Error searching properties:', error);
            setProperties([]);
          } finally {
            setIsLoading(false);
          }
        }, 300); // 300ms delay
      };
    })(),
    []
  );

  // Fetch universities on component mount
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

  // Update selected university data when university selection changes
  useEffect(() => {
    if (selectedUniversity && universities.length > 0) {
      const universityData = universities.find(uni => uni.slug === selectedUniversity);
      setSelectedUniversityData(universityData || null);
    } else {
      setSelectedUniversityData(null);
    }
  }, [selectedUniversity, universities]);

  // Fetch properties on component mount and when search params change
  useEffect(() => {
    debouncedSearch(selectedUniversity);
  }, [selectedUniversity, debouncedSearch]);

  const handleSearch = () => {
    debouncedSearch(selectedUniversity);
  };

  const clearFilters = () => {
    setSelectedUniversity('');
    setSortBy('relevance');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-12 w-full">
          {/* Filters Sidebar */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    {showFilters ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* University Filter */}
                <div>
                  <Select
                    label="University"
                    options={[
                      { value: '', label: 'All Universities' },
                      ...universities.map(uni => ({
                        value: uni.slug,
                        label: uni.name
                      }))
                    ]}
                    value={selectedUniversity}
                    onChange={(e) => {
                      setSelectedUniversity(e.target.value);
                      // Trigger immediate search when university changes
                      setTimeout(() => {
                        debouncedSearch(e.target.value);
                      }, 0);
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button onClick={handleSearch} className="w-full">
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-10 w-full order-1 lg:order-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
              <div>
                <h1 className="h2">Search Results</h1>
                <p className="text-gray-600">
                  {properties.length} properties found
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Select
                  options={[
                    { value: 'relevance', label: 'Most Relevant' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'distance', label: 'Distance from Campus' },
                    { value: 'newest', label: 'Newest First' },
                  ]}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                />
              </div>
            </div>

            {/* Active Filters */}
            {selectedUniversity && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    University: {universities.find(u => u.slug === selectedUniversity)?.name || selectedUniversity}
                  </Badge>
                </div>
              </div>
            )}

            {/* Properties Grid */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, index) => (
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
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {properties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    universityData={selectedUniversityData}
                  />
                ))}
              </div>
            )}

            {/* Load More */}
            {properties.length > 0 && (
              <div className="text-center mt-8">
                <Button size="lg" variant="outline">
                  Load More Properties
                </Button>
              </div>
            )}

            {/* No Results */}
            {properties.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">No properties found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
