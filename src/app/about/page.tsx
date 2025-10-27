import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

const team = [
  {
    name: 'Tendai Mhaka',
    role: 'Founder & CEO',
    bio: 'Former UNAM student who experienced the housing struggle firsthand. Passionate about solving student accommodation challenges.',
  },
  {
    name: 'Sarah Nangolo',
    role: 'Head of Operations',
    bio: 'NUST graduate with extensive experience in property management and student services across Namibia.',
  },
  {
    name: 'David Shikongo',
    role: 'Lead Developer',
    bio: 'Tech enthusiast and UNAM alumnus, building the platform that makes finding student housing effortless.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative" style={{ backgroundImage: `url(${aboutBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium text-sm">About us | Pozi Living</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-8 leading-tight">
              Student Housing
              <span className="block font-medium text-green-300">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Connecting Namibian students with quality accommodation near their universities. 
              Professional, reliable, and designed specifically for the student experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium">
                Find Your Home
              </Button>
              <Button size="lg" variant="outline" className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-lg font-medium">
                List Your Property
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
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
                <div className="text-4xl font-light text-green-600 mb-2">
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Our Story
                </div>
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
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium">
                  Get Started
                </Button>
                <Button size="lg" variant="outline" className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-lg font-medium">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full mx-auto mb-8 flex items-center justify-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg"></div>
                </div>
                <h3 className="text-2xl font-medium text-gray-900 mb-4">Student-First Design</h3>
                <p className="text-gray-600 leading-relaxed font-light mb-8">
                  Every feature is designed with student needs and preferences in mind
                </p>
                <div className="flex justify-center space-x-12">
                  <div className="text-center">
                    <div className="text-2xl font-light text-green-600">99%</div>
                    <div className="text-sm text-gray-600 font-medium">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-green-600">24/7</div>
                    <div className="text-sm text-gray-600 font-medium">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          <div className="grid gap-8 md:grid-cols-3">
            {team.map((member, index) => (
              <div key={index} className="text-center p-8 border border-gray-200 rounded-lg">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-600 rounded-full"></div>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{member.name}</h3>
                <p className="text-green-600 font-medium mb-4">{member.role}</p>
                <p className="text-gray-600 leading-relaxed font-light">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center bg-white border border-gray-200 rounded-2xl p-16">
            <h2 className="text-4xl font-light text-gray-900 mb-6">
              Ready to Find Your Perfect Home?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-light">
              Join thousands of Namibian students who've already found their dream accommodation. 
              Your perfect room is just a click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium">
                Start Searching Now
              </Button>
              <Button size="lg" variant="outline" className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-lg font-medium">
                List Your Property
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}