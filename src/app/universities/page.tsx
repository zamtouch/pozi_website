'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Mock data - in real app, this would come from Directus API
const universities = [
  {
    id: '1',
    name: 'University of Zambia',
    slug: 'unza',
    city: 'Lusaka',
    country: 'Zambia',
    latitude: -15.4167,
    longitude: 28.2833,
    image: '/placeholder-property.svg',
    propertyCount: 24,
    averagePrice: 2200,
  },
  {
    id: '2',
    name: 'Copperbelt University',
    slug: 'cbu',
    city: 'Kitwe',
    country: 'Zambia',
    latitude: -12.8167,
    longitude: 28.2000,
    image: '/placeholder-property.svg',
    propertyCount: 18,
    averagePrice: 1900,
  },
  {
    id: '3',
    name: 'Mulungushi University',
    slug: 'mulungushi',
    city: 'Kabwe',
    country: 'Zambia',
    latitude: -14.4333,
    longitude: 28.4500,
    image: '/placeholder-property.svg',
    propertyCount: 12,
    averagePrice: 1500,
  },
  {
    id: '4',
    name: 'University of Namibia',
    slug: 'unam',
    city: 'Windhoek',
    country: 'Namibia',
    latitude: -22.5609,
    longitude: 17.0658,
    image: '/placeholder-property.svg',
    propertyCount: 15,
    averagePrice: 2800,
  },
  {
    id: '5',
    name: 'University of Cape Town',
    slug: 'uct',
    city: 'Cape Town',
    country: 'South Africa',
    latitude: -33.9577,
    longitude: 18.4612,
    image: '/placeholder-property.svg',
    propertyCount: 32,
    averagePrice: 4500,
  },
  {
    id: '6',
    name: 'University of the Witwatersrand',
    slug: 'wits',
    city: 'Johannesburg',
    country: 'South Africa',
    latitude: -26.1908,
    longitude: 28.0306,
    image: '/placeholder-property.svg',
    propertyCount: 28,
    averagePrice: 4200,
  },
];

export default function UniversitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  const countries = ['All Countries', 'Zambia', 'Namibia', 'South Africa', 'Botswana', 'Zimbabwe'];
  
  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         uni.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = !selectedCountry || selectedCountry === 'All Countries' || uni.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="h1">Find Student Housing by University</h1>
          <p className="lead max-w-2xl mx-auto">
            Browse accommodation options near your university. 
            Connect with verified property owners and find your perfect student home.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Input
                    placeholder="Search universities or cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-300 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors duration-200 bg-white"
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Button variant="outline" className="w-full">
                    Advanced Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredUniversities.length} universities found
          </p>
        </div>

        {/* Universities Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUniversities.map((university) => (
            <Card key={university.id} hover className="group">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-t-2xl">
                  <img
                    src={university.image}
                    alt={university.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                
                {/* Property Count Badge */}
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary">
                    {university.propertyCount} properties
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-ink text-lg mb-1">
                    {university.name}
                  </h3>
                  <p className="text-gray-600">
                    {university.city}, {university.country}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average rent:</span>
                    <span className="font-semibold text-ink">
                      ZMW {university.averagePrice.toLocaleString()}/month
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Properties available:</span>
                    <span className="font-semibold text-ink">
                      {university.propertyCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={`/search?university=${university.slug}`}>
                      View Properties
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredUniversities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">No universities found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedCountry('');
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-brand-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">
                Don't see your university?
              </h2>
              <p className="text-brand-100 mb-6 max-w-2xl mx-auto">
                We're constantly adding new universities and properties. 
                Let us know which university you'd like to see on our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg">
                  Request University
                </Button>
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  List Your Property
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


