'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from '@/components/property-card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { searchProperties, fetchProperties, fetchUniversities, fetchTowns, fetchResidentials, Property, University, Town, Residential } from '@/lib/api';


// University options will be loaded dynamically from API

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'student' | 'graduate'>('student');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedResidential, setSelectedResidential] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [residentials, setResidentials] = useState<Residential[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
  const [isLoadingTowns, setIsLoadingTowns] = useState(true);
  const [selectedUniversityData, setSelectedUniversityData] = useState<University | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (type: 'student' | 'graduate', university?: string, town?: string, residential?: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          setIsLoading(true);
          try {
            let results: Property[] = [];
            
            if (type === 'student') {
              if (university) {
                results = await searchProperties('', university, []);
              } else {
                results = await fetchProperties();
              }
            } else {
              // Graduate search by town and residential
              const townId = town ? parseInt(town) : undefined;
              const residentialId = residential ? parseInt(residential) : undefined;
              results = await searchProperties('', undefined, [], townId, residentialId);
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

  // Fetch towns on component mount
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

  // Update selected university data when university selection changes
  useEffect(() => {
    if (selectedUniversity && universities.length > 0) {
      const universityData = universities.find(uni => uni.slug === selectedUniversity);
      setSelectedUniversityData(universityData || null);
    } else {
      setSelectedUniversityData(null);
    }
  }, [selectedUniversity, universities]);

  // Initialize from URL params
  useEffect(() => {
    const type = searchParams.get('type');
    const university = searchParams.get('university');
    const town = searchParams.get('town');
    const residential = searchParams.get('residential');
    
    if (type === 'graduate') {
      setActiveTab('graduate');
      if (town) setSelectedTown(town);
      if (residential) setSelectedResidential(residential);
    } else {
      setActiveTab('student');
      if (university) setSelectedUniversity(university);
    }
  }, [searchParams]);

  // Fetch properties on component mount and when search params change
  useEffect(() => {
    debouncedSearch(activeTab, selectedUniversity || undefined, selectedTown || undefined, selectedResidential || undefined);
  }, [activeTab, selectedUniversity, selectedTown, selectedResidential, debouncedSearch]);

  const handleSearch = () => {
    debouncedSearch(activeTab, selectedUniversity || undefined, selectedTown || undefined, selectedResidential || undefined);
  };

  const clearFilters = () => {
    setSelectedUniversity('');
    setSelectedTown('');
    setSelectedResidential('');
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
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('student');
                      setSelectedTown('');
                      setSelectedResidential('');
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'student'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Student
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('graduate');
                      setSelectedUniversity('');
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'graduate'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Graduate
                    </span>
                  </button>
                </div>

                {activeTab === 'student' ? (
                  /* University Filter */
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        University
                      </span>
                    </label>
                    <Select
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
                      }}
                      className="w-full border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors rounded-lg"
                      disabled={isLoadingUniversities}
                    />
                  </div>
                ) : (
                  /* Town and Residential Filters */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Town
                        </span>
                      </label>
                      <Select
                        options={[
                          { value: '', label: 'All Towns' },
                          ...towns.map(town => ({
                            value: town.id.toString(),
                            label: town.town_name
                          }))
                        ]}
                        value={selectedTown}
                        onChange={(e) => {
                          setSelectedTown(e.target.value);
                        }}
                        className="w-full border-2 border-gray-200 hover:border-purple-400 focus:border-purple-500 transition-colors rounded-lg"
                        disabled={isLoadingTowns}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Residential Area
                        </span>
                      </label>
                      <Select
                        options={[
                          { value: '', label: selectedTown ? 'All Residential Areas' : 'Select Town first' },
                          ...residentials.map(residential => ({
                            value: residential.id.toString(),
                            label: typeof residential.residential_town === 'object' 
                              ? residential.residential_town.town_name 
                              : residential.residential_name
                          }))
                        ]}
                        value={selectedResidential}
                        onChange={(e) => {
                          setSelectedResidential(e.target.value);
                        }}
                        className="w-full border-2 border-gray-200 hover:border-purple-400 focus:border-purple-500 transition-colors rounded-lg disabled:bg-gray-100"
                        disabled={!selectedTown || residentials.length === 0}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <Button 
                    onClick={handleSearch} 
                    className={`w-full h-12 font-semibold shadow-md hover:shadow-lg transition-all ${
                      activeTab === 'student' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Apply Filters
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full h-11 border-2 hover:bg-gray-50 font-medium"
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
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {activeTab === 'student' && selectedUniversity && (
                  <Badge variant="secondary">
                    University: {universities.find(u => u.slug === selectedUniversity)?.name || selectedUniversity}
                  </Badge>
                )}
                {activeTab === 'graduate' && selectedTown && (
                  <Badge variant="secondary">
                    Town: {towns.find(t => t.id.toString() === selectedTown)?.town_name || selectedTown}
                  </Badge>
                )}
                {activeTab === 'graduate' && selectedResidential && (
                  <Badge variant="secondary">
                    Residential: {residentials.find(r => r.id.toString() === selectedResidential)?.residential_name || selectedResidential}
                  </Badge>
                )}
              </div>
            </div>

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
