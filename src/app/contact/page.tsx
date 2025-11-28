'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GlobeAltIcon, 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon, 
  PhoneIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  ClockIcon
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact information...</p>
        </div>
      </div>
    );
  }

  const contactMethods = [
    {
      name: 'Live Chat',
      icon: GlobeAltIcon,
      description: 'Chat with our support team in real-time',
      action: () => openLink(defaults?.live_chat_link),
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      badge: '2 mins Reply',
      badgeColor: 'bg-red-500',
    },
    {
      name: 'WhatsApp',
      icon: ChatBubbleLeftRightIcon,
      description: 'Message us on WhatsApp for quick support',
      action: handleWhatsApp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      badge: '2 mins Reply',
      badgeColor: 'bg-green-500',
    },
    {
      name: 'Email',
      icon: EnvelopeIcon,
      description: 'Send us an email and we\'ll get back to you',
      action: handleEmail,
      value: defaults?.email || 'hello@pozi.com.na',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      name: 'Phone',
      icon: PhoneIcon,
      description: 'Give us a call during business hours',
      action: handlePhone,
      value: defaults?.phone || '+264 81 816 5288',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ];

  const helpResources = [
    {
      name: 'Help Center',
      icon: QuestionMarkCircleIcon,
      description: 'Find answers to frequently asked questions and get help with common issues.',
      action: () => openLink(defaults?.help_center_link),
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'How It Works',
      icon: InformationCircleIcon,
      description: 'Learn how to use POZI Student Living to find and apply for properties.',
      action: () => openLink(defaults?.how_it_works_link),
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Hero Section with Gradient */}
      <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)'
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Have questions? We're here to help! Choose your preferred way to reach us.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Methods Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pick the method that works best for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div
                  key={index}
                  onClick={method.action}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border border-gray-100"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  {/* Badge */}
                  {method.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`${method.badgeColor} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md`}>
                        {method.badge}
                      </span>
                    </div>
                  )}

                  <div className="relative p-8">
                    {/* Icon */}
                    <div className={`inline-flex p-4 ${method.bgColor} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-8 w-8 ${method.iconColor}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                      {method.name}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {method.description}
                    </p>
                    {method.value && (
                      <p className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {method.value}
                      </p>
                    )}
                  </div>

                  {/* Hover Effect Border */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${method.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Help Resources */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Help & Resources
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to get started
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {helpResources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <div
                  key={index}
                  onClick={resource.action}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border border-gray-100"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${resource.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className="relative p-8">
                    {/* Icon */}
                    <div className={`inline-flex p-4 bg-gradient-to-br ${resource.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                      {resource.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {resource.description}
                    </p>
                  </div>

                  {/* Hover Effect Border */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${resource.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-12 mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <ClockIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Business Hours</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-gray-700">
                  <span className="font-semibold text-gray-900">Monday - Friday:</span> 8:00 AM - 6:00 PM
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-gray-700">
                  <span className="font-semibold text-gray-900">Saturday:</span> 9:00 AM - 2:00 PM
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <p className="text-gray-700">
                  <span className="font-semibold text-gray-900">Sunday:</span> Closed
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
              <p className="text-gray-700 leading-relaxed">
                Our support team is available during business hours to assist you with any questions or concerns. 
                For urgent matters outside business hours, please use our WhatsApp or email, and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <span>Back to Home</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
