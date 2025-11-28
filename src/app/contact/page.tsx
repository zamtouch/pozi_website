'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  GlobeAltIcon, 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon, 
  PhoneIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DefaultsData {
  id: number;
  live_chat_link?: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  help_center_link?: string;
  how_it_works_link?: string;
}

export default function ContactPage() {
  const [defaults, setDefaults] = useState<DefaultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/defaults');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        setDefaults(data.data);
      }
    } catch (error) {
      console.error('Error loading defaults:', error);
      // Set fallback defaults
      setDefaults({
        id: 1,
        live_chat_link: 'https://google.com',
        email: 'hello@pozi.com.na',
        whatsapp: '264 81 816 5288',
        phone: '264 81 816 5288',
        help_center_link: 'https://pozi.com.na',
        how_it_works_link: 'https://pozi.com.na',
      });
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url: string | undefined) => {
    if (!url) return;
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    if (defaults?.email) {
      window.location.href = `mailto:${defaults.email}`;
    }
  };

  const handlePhone = () => {
    if (defaults?.phone) {
      window.location.href = `tel:${defaults.phone.replace(/\s/g, '')}`;
    }
  };

  const handleWhatsApp = () => {
    if (defaults?.whatsapp) {
      const whatsappNumber = defaults.whatsapp.replace(/\s/g, '');
      window.open(`https://wa.me/${whatsappNumber}`, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions? We're here to help! Get in touch with our support team.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Help Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Help & Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openLink(defaults?.help_center_link)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Help Center</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Find answers to frequently asked questions and get help with common issues.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openLink(defaults?.how_it_works_link)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <InformationCircleIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">How It Works</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Learn how to use POZI Student Living to find and apply for properties.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Us Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-8">If you have any queries, feel free to contact us</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Chat */}
            <Card className="relative border-2 border-red-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openLink(defaults?.live_chat_link)}>
              <CardHeader>
                <div className="absolute top-4 left-4">
                  <Badge variant="error" className="text-xs">2 mins Reply</Badge>
                </div>
                <div className="flex flex-col items-center pt-8">
                  <div className="p-4 bg-red-50 rounded-full mb-4">
                    <GlobeAltIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Live Chat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm text-center">
                  Chat with our support team in real-time
                </p>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card className="relative border-2 border-green-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleWhatsApp}>
              <CardHeader>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500 text-white text-xs">2 mins Reply</Badge>
                </div>
                <div className="flex flex-col items-center pt-8">
                  <div className="p-4 bg-green-50 rounded-full mb-4">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Chat on WhatsApp</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm text-center">
                  Message us on WhatsApp for quick support
                </p>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleEmail}>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-yellow-50 rounded-full mb-4">
                    <EnvelopeIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Email Us</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm text-center mb-2">
                  {defaults?.email || 'hello@pozi.com.na'}
                </p>
                <p className="text-gray-500 text-xs text-center">
                  Send us an email and we'll get back to you
                </p>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handlePhone}>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <PhoneIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Call Us</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm text-center mb-2">
                  {defaults?.phone || '+264 81 816 5288'}
                </p>
                <p className="text-gray-500 text-xs text-center">
                  Give us a call during business hours
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Monday - Friday:</span> 8:00 AM - 6:00 PM
              </p>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Saturday:</span> 9:00 AM - 2:00 PM
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Sunday:</span> Closed
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">
                Our support team is available during business hours to assist you with any questions or concerns. 
                For urgent matters outside business hours, please use our WhatsApp or email, and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}



import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  GlobeAltIcon, 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon, 
  PhoneIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DefaultsData {
  id: number;
  live_chat_link?: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  help_center_link?: string;
  how_it_works_link?: string;
}

export default function ContactPage() {
  const [defaults, setDefaults] = useState<DefaultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/defaults');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        setDefaults(data.data);
      }
    } catch (error) {
      console.error('Error loading defaults:', error);
      // Set fallback defaults
      setDefaults({
        id: 1,
        live_chat_link: 'https://google.com',
        email: 'hello@pozi.com.na',
        whatsapp: '264 81 816 5288',
        phone: '264 81 816 5288',
        help_center_link: 'https://pozi.com.na',
        how_it_works_link: 'https://pozi.com.na',
      });
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url: string | undefined) => {
    if (!url) return;
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    if (defaults?.email) {
      window.location.href = `mailto:${defaults.email}`;
    }
  };

  const handlePhone = () => {
    if (defaults?.phone) {
      window.location.href = `tel:${defaults.phone.replace(/\s/g, '')}`;
    }
  };

  const handleWhatsApp = () => {
    if (defaults?.whatsapp) {
      const whatsappNumber = defaults.whatsapp.replace(/\s/g, '');
      window.open(`https://wa.me/${whatsappNumber}`, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions? We're here to help! Get in touch with our support team.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Help Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Help & Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openLink(defaults?.help_center_link)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Help Center</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Find answers to frequently asked questions and get help with common issues.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openLink(defaults?.how_it_works_link)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <InformationCircleIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">How It Works</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Learn how to use POZI Student Living to find and apply for properties.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Us Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-8">If you have any queries, feel free to contact us</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Chat */}
            <Card className="relative border-2 border-red-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openLink(defaults?.live_chat_link)}>
              <CardHeader>
                <div className="absolute top-4 left-4">
                  <Badge variant="error" className="text-xs">2 mins Reply</Badge>
                </div>
                <div className="flex flex-col items-center pt-8">
                  <div className="p-4 bg-red-50 rounded-full mb-4">
                    <GlobeAltIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Live Chat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm text-center">
                  Chat with our support team in real-time
                </p>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card className="relative border-2 border-green-500 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleWhatsApp}>
              <CardHeader>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500 text-white text-xs">2 mins Reply</Badge>
                </div>
                <div className="flex flex-col items-center pt-8">
                  <div className="p-4 bg-green-50 rounded-full mb-4">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Chat on WhatsApp</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm text-center">
                  Message us on WhatsApp for quick support
                </p>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleEmail}>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-yellow-50 rounded-full mb-4">
                    <EnvelopeIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Email Us</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm text-center mb-2">
                  {defaults?.email || 'hello@pozi.com.na'}
                </p>
                <p className="text-gray-500 text-xs text-center">
                  Send us an email and we'll get back to you
                </p>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handlePhone}>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <PhoneIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Call Us</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm text-center mb-2">
                  {defaults?.phone || '+264 81 816 5288'}
                </p>
                <p className="text-gray-500 text-xs text-center">
                  Give us a call during business hours
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Monday - Friday:</span> 8:00 AM - 6:00 PM
              </p>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Saturday:</span> 9:00 AM - 2:00 PM
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Sunday:</span> Closed
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">
                Our support team is available during business hours to assist you with any questions or concerns. 
                For urgent matters outside business hours, please use our WhatsApp or email, and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

