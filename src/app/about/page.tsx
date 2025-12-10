'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/api';

const aboutBackgroundImage = '/about_pozi.webp';

const stats = [
  { number: '2,500+', label: 'Students Helped' },
  { number: '10+', label: 'Universities' },
  { number: '500+', label: 'Properties Listed' },
  { number: '98%', label: 'Satisfaction Rate' },
];

const features = [
  {
    title: 'Verified Properties',
    description: 'Every listing is thoroughly verified to ensure quality and authenticity for our students.',
  },
  {
    title: 'University Proximity',
    description: 'Find properties close to your university campus with our smart location filtering.',
  },
  {
    title: 'Transparent Pricing',
    description: 'No hidden fees or surprises. See exactly what you\'ll pay upfront.',
  },
  {
    title: '24/7 Support',
    description: 'Our dedicated support team is always here to help with any questions or concerns.',
  },
  {
    title: 'Safe & Secure',
    description: 'Your safety is our top priority. We verify every listing and property owner.',
  },
  {
    title: 'Easy Booking',
    description: 'Simple, streamlined booking process designed with students in mind.',
  },
];

interface TeamMember {
  id: number;
  status: string;
  name: string;
  role: string;
  image: string | { id: string } | null;
  order: number;
}

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch('/api/team', {
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setTeam(data.data);
          }
        } else {
          console.error('Failed to fetch team members');
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeam();
  }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative" style={{ backgroundImage: `url(${aboutBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl mx-auto text-center">
        
            <h1 className="text-5xl md:text-6xl font-light text-white mb-8 leading-tight">
             Your Pozi
              <span className="block font-medium text-green-300">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Connecting Namibian students with quality accommodation near their universities. 
              Professional, reliable, and designed specifically for the student experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search">
              <Button size="lg" className="text-white px-8 py-4 rounded-lg font-medium" style={{ backgroundColor: '#005b42' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#004a35'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#005b42'; }}>
                Find Your Home
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20" style={{ backgroundColor: '#fce7f3' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Trusted by Students Nationwide
            </h2>
            <p className="text-lg text-gray-600 font-light">
              Our impact speaks for itself
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-light mb-2" style={{ color: '#005b42' }}>
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Why Students Choose Us
            </h2>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
              We understand the unique challenges of finding quality student accommodation
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-8 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-200">
                <h3 className="text-xl font-medium text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div>
            
                <h2 className="text-4xl font-light text-gray-900 mb-6">
                  Born from Experience
                </h2>
              </div>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-light">
                <p>
                  We started POZI because we've been there - scrambling to find housing before semester starts, 
                  dealing with unreliable landlords, and paying too much for substandard accommodation.
                </p>
                <p>
                  As former UNAM and NUST students, we understand the challenges. That's why we built a platform 
                  that prioritizes transparency, safety, and affordability for Namibian students.
                </p>
                <p>
                  Every feature is designed with student needs in mind. Because finding your home shouldn't be 
                  harder than your studies.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/search">
                <Button size="lg" className="text-white px-8 py-4 rounded-lg font-medium" style={{ backgroundColor: '#005b42' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#004a35'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#005b42'; }}>
                    Start Searching
                </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#005b42' }}>
                <div className="w-40 h-40 mx-auto mb-8 flex items-center justify-center">
                  <Image
                    src="/student_first.png"
                    alt="Student"
                    width={128}
                    height={128}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-medium text-white mb-4">Student-First Design</h3>
                <p className="text-white/90 leading-relaxed font-light mb-8">
                  Every feature is designed with student needs and preferences in mind
                </p>
                <div className="flex justify-center space-x-12">
                  <div className="text-center">
                    <div className="text-2xl font-light text-white">99%</div>
                    <div className="text-sm text-white/80 font-medium">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-white">24/7</div>
                    <div className="text-sm text-white/80 font-medium">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Photo Section */}
  

      {/* Team Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
              The passionate Namibians behind POZI, dedicated to improving student housing
            </p>
          </div>
          {isLoadingTeam ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-600">Loading team members...</p>
            </div>
          ) : team.length > 0 ? (
            <div className="grid gap-12 md:grid-cols-2">
              {team.map((member) => {
                // Extract image ID - handle both string and object formats
                const imageId = typeof member.image === 'string' 
                  ? member.image 
                  : member.image?.id || null;
                
                return (
                  <div key={member.id} className="text-center p-10 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-200">
                    <div className="w-64 h-64 bg-gray-100 rounded-full mx-auto mb-8 flex items-center justify-center overflow-hidden">
                      {imageId ? (
                        <Image
                          src={getImageUrl(imageId)}
                          alt={member.name}
                          width={256}
                          height={256}
                          className="w-full h-full object-cover rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-32 h-32 bg-green-600 rounded-full"></div>
                      )}
                    </div>
                    <h3 className="text-2xl font-medium text-gray-900 mb-3">{member.name}</h3>
                    <p className="text-lg font-medium" style={{ color: '#005b42' }}>{member.role}</p>
                </div>
                );
              })}
              </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No team members found.</p>
          </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20" style={{ backgroundColor: '#005b42' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center rounded-2xl p-16">
            <h2 className="text-4xl font-light text-white mb-6">
              Ready to Find Your Perfect Home?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-light">
              Join thousands of Namibian students who've already found their dream accommodation. 
              Your perfect room is just a click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search">
              <Button size="lg" className="text-gray-900 px-8 py-4 rounded-lg font-medium" style={{ backgroundColor: '#d6e25c' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c4d04a'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d6e25c'; }}>
                Start Searching Now
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}