'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { fetchUniversities, University } from '@/lib/api';
import MapPicker from '@/components/map-picker';

const AMENITIES = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'furnished', label: 'Furnished' },
  { key: 'parking', label: 'Parking' },
  { key: 'security', label: 'Security' },
  { key: 'air_conditioning', label: 'Air Conditioning' },
  { key: 'study_desk', label: 'Study Desk' },
  { key: 'laundry', label: 'Laundry' },
];

const CURRENCIES = ['ZMW', 'NAD', 'ZAR', 'USD', 'EUR'];

interface UploadedImage {
  id: string;
  filename_download: string;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<string, UploadedImage>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_month: '',
    currency: 'ZMW',
    address: '',
    distance_from_campus: '',
    latitude: '',
    longitude: '',
    rooms_available: '',
    total_rooms: '',
    university: '',
    amenities: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUniversitiesData();
    }
  }, [isAuthenticated]);

  const fetchUniversitiesData = async () => {
    try {
      const universitiesData = await fetchUniversities();
      setUniversities(universitiesData);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageUpload = async (field: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image size must be less than 10MB');
      return;
    }

    setUploadingImages(prev => ({ ...prev, [field]: true }));
    setError(null);

    try {
      const token = localStorage.getItem('directus_token');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 Uploading image:', { field, fileName: file.name, fileSize: file.size });

      // Upload directly to Directus files endpoint using admin token from config
      // We need to use the server-side config, so we'll create an API route for this
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: uploadFormData,
      });

      console.log('📤 Upload response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Image uploaded successfully:', data);
        setUploadedImages(prev => ({
          ...prev,
          [field]: {
            id: data.data.id,
            filename_download: data.data.filename_download,
          },
        }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Upload failed:', errorData);
        setError(errorData.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading image');
    } finally {
      setUploadingImages(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleImageDelete = async (field: string) => {
    if (!confirm('Are you sure you want to remove this image?')) {
      return;
    }

    // Delete from Directus if it was uploaded
    const image = uploadedImages[field];
    if (image?.id) {
      try {
        const token = localStorage.getItem('directus_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/upload-image?id=${image.id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          console.warn('Failed to delete image from Directus (non-critical)');
        }
      } catch (err) {
        console.error('Error deleting image from Directus:', err);
      }
    }

    // Remove from state
    setUploadedImages(prev => {
      const newState = { ...prev };
      delete newState[field];
      return newState;
    });
  };

  const getImageUrl = (image: UploadedImage | undefined) => {
    if (!image?.id) return null;
    return `/api/images/${image.id}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Prepare property data with uploaded image IDs
      const propertyData: any = {
        title: formData.title,
        description: formData.description,
        price_per_month: parseFloat(formData.price_per_month) || 0,
        currency: formData.currency,
        address: formData.address,
        rooms_available: parseInt(formData.rooms_available) || 0,
        total_rooms: parseInt(formData.total_rooms) || 0,
        amenities: formData.amenities,
      };

      // Add optional fields
      if (formData.distance_from_campus) {
        propertyData.distance_from_campus = parseInt(formData.distance_from_campus);
      }
      if (formData.latitude) {
        propertyData.latitude = formData.latitude;
      }
      if (formData.longitude) {
        propertyData.longitude = formData.longitude;
      }
      if (formData.university) {
        propertyData.university = parseInt(formData.university);
      }

      // Add image IDs if uploaded
      if (uploadedImages.featured_image?.id) {
        propertyData.featured_image = uploadedImages.featured_image.id;
      }
      if (uploadedImages.image_1?.id) {
        propertyData.image_1 = uploadedImages.image_1.id;
      }
      if (uploadedImages.image_2?.id) {
        propertyData.image_2 = uploadedImages.image_2.id;
      }
      if (uploadedImages.image_3?.id) {
        propertyData.image_3 = uploadedImages.image_3.id;
      }
      if (uploadedImages.image_4?.id) {
        propertyData.image_4 = uploadedImages.image_4.id;
      }

      console.log('📤 Creating property...', propertyData);

      const response = await fetch('/api/properties', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(propertyData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Property created successfully:', data);
        setSuccess(true);
        setTimeout(() => {
          router.push(`/landlord/properties/${data.property.id}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('❌ Create failed:', errorData);
        setError(errorData.error || 'Failed to create property');
      }
    } catch (err: any) {
      console.error('❌ Error creating property:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/landlord/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
            <li>/</li>
            <li><Link href="/landlord/properties" className="hover:text-blue-600">My Properties</Link></li>
            <li>/</li>
            <li className="text-gray-900">List New Property</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">List New Property</h1>
          <p className="mt-2 text-gray-600">Add a new property to your portfolio</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {isSubmitting ? 'Creating property...' : 'Property created successfully! Redirecting...'}
          </div>
        )}

        {/* New Property Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Images */}
          <Card>
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Featured Image */}
                <div>
                  <Label>Featured Image *</Label>
                  <p className="text-sm text-gray-500 mb-3">This is the main image displayed in property listings</p>
                  <div className="flex items-start gap-4">
                    {uploadedImages.featured_image ? (
                      <div className="relative group">
                        <img
                          src={getImageUrl(uploadedImages.featured_image) || ''}
                          alt="Featured"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageDelete('featured_image');
                                    handleImageUpload('featured_image', file);
                                  }
                                }}
                                disabled={uploadingImages.featured_image}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={uploadingImages.featured_image}
                              >
                                {uploadingImages.featured_image ? 'Uploading...' : 'Replace'}
                              </Button>
                            </label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleImageDelete('featured_image')}
                              disabled={uploadingImages.featured_image}
                              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload('featured_image', file);
                          }}
                          disabled={uploadingImages.featured_image}
                        />
                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors">
                          {uploadingImages.featured_image ? (
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-xs text-gray-500">Uploading...</p>
                            </div>
                          ) : (
                            <>
                              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <p className="text-xs text-gray-500 text-center px-2">Add Image</p>
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Additional Images */}
                <div>
                  <Label>Additional Images</Label>
                  <p className="text-sm text-gray-500 mb-3">Add up to 4 additional images</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['image_1', 'image_2', 'image_3', 'image_4'].map((field) => {
                      const image = uploadedImages[field];
                      const isUploading = uploadingImages[field];
                      
                      return (
                        <div key={field} className="relative group">
                          {image ? (
                            <>
                              <img
                                src={getImageUrl(image) || ''}
                                alt={`Image ${field}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex gap-2">
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleImageDelete(field);
                                          handleImageUpload(field, file);
                                        }
                                      }}
                                      disabled={isUploading}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      disabled={isUploading}
                                    >
                                      {isUploading ? '...' : '↻'}
                                    </Button>
                                  </label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleImageDelete(field)}
                                    disabled={isUploading}
                                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <label className="cursor-pointer block">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(field, file);
                                }}
                                disabled={isUploading}
                              />
                              <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors">
                                {isUploading ? (
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-xs text-gray-500">Uploading...</p>
                                  </div>
                                ) : (
                                  <>
                                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <p className="text-xs text-gray-500">Add</p>
                                  </>
                                )}
                              </div>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Cozy 2-bedroom flat near UNAM"
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe your property in detail..."
                ></textarea>
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Full street address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_per_month">Price per Month *</Label>
                  <Input
                    id="price_per_month"
                    name="price_per_month"
                    type="number"
                    step="0.01"
                    value={formData.price_per_month}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <select
                    id="currency"
                    name="currency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Information */}
          <Card>
            <CardHeader>
              <CardTitle>Room Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rooms_available">Rooms Available *</Label>
                  <Input
                    id="rooms_available"
                    name="rooms_available"
                    type="number"
                    value={formData.rooms_available}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="total_rooms">Total Rooms *</Label>
                  <Input
                    id="total_rooms"
                    name="total_rooms"
                    type="number"
                    value={formData.total_rooms}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="university">Nearest University</Label>
                <select
                  id="university"
                  name="university"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.university}
                  onChange={handleChange}
                >
                  <option value="">Select University (Optional)</option>
                  {universities.map(uni => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="distance_from_campus">Distance from Campus (meters)</Label>
                <Input
                  id="distance_from_campus"
                  name="distance_from_campus"
                  type="number"
                  value={formData.distance_from_campus}
                  onChange={handleChange}
                  placeholder="500"
                />
              </div>
              
              {/* Map Picker */}
              <div>
                <Label>Property Location</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Click on the map to set the exact location of your property
                </p>
                <MapPicker
                  latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                  longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                  onLocationSelect={(lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat.toString(),
                      longitude: lng.toString(),
                    }));
                  }}
                  height="400px"
                />
              </div>

              {/* Manual Coordinate Input (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude (auto-filled from map)</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="text"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g., -15.3875"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude (auto-filled from map)</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="text"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g., 28.3228"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {AMENITIES.map(amenity => (
                <div key={amenity.key} className="flex items-center">
                  <input
                    id={`amenity-${amenity.key}`}
                    type="checkbox"
                    className="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    checked={formData.amenities.includes(amenity.key)}
                    onChange={() => handleAmenityToggle(amenity.key)}
                  />
                  <Label htmlFor={`amenity-${amenity.key}`} className="ml-2 text-gray-700">
                    {amenity.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <Button type="submit" disabled={isSubmitting} className="pozi-green">
              {isSubmitting ? 'Creating Property...' : 'Create Property'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/landlord/properties">
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

