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

interface ContactMethod {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  action: () => void;
  value: string;
  color: string;
  bgColor: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
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

  // WhatsApp Icon Component
  const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );

  const contactMethods: ContactMethod[] = [
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
      name: 'Phone & WhatsApp',
      icon: WhatsAppIcon,
      description: 'Call us or message us on WhatsApp',
      action: () => {
        // Show both options or default to WhatsApp
        handleWhatsApp();
      },
      value: defaults?.whatsapp || defaults?.phone || '264 81 816 5288',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ];

  const helpResources = [
    {
      name: 'Help Center',
      icon: QuestionMarkCircleIcon,
      description: 'Find answers to frequently asked questions and get help with common issues.',
      action: () => {},
      color: 'from-green-500 to-emerald-500',
      href: '/help-center',
    },
    {
      name: 'How It Works',
      icon: InformationCircleIcon,
      description: 'Learn how to use POZI Student Living to find and apply for properties.',
      action: () => {},
      color: 'from-blue-500 to-cyan-500',
      href: '/how-it-works',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#005b42' }}>
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
                    {method.name === 'Phone & WhatsApp' ? (
                      <div className="space-y-2">
                        {defaults?.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-5 w-5 text-gray-500" />
                            <p className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                              {defaults.phone}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePhone();
                              }}
                              className="ml-2 text-sm text-green-600 hover:text-green-700 underline"
                            >
                              Call
                            </button>
                          </div>
                        )}
                        {defaults?.whatsapp && (
                          <div className="flex items-center gap-2">
                            <WhatsAppIcon className="h-5 w-5 text-gray-500" />
                            <p className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                              {defaults.whatsapp}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsApp();
                              }}
                              className="ml-2 text-sm text-green-600 hover:text-green-700 underline"
                            >
                              WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    ) : method.value && (
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
              const content = (
                <>
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
                </>
              );

              if (resource.href) {
                return (
                  <Link
                    key={index}
                    href={resource.href}
                    className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border border-gray-100 block"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={index}
                  onClick={resource.action}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border border-gray-100"
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-12 mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(to bottom right, #9333ea, #d6e25c)' }}>
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

      </div>
    </div>
  );
}
