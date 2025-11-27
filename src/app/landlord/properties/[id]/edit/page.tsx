'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { fetchUniversities, University } from '@/lib/api';
import MapPicker from '@/components/map-picker';

interface Property {
  id: number;
  title: string;
  description: string;
  price_per_month: string;
  currency: string;
  address: string;
  distance_from_campus?: number;
  latitude?: string;
  longitude?: string;
  rooms_available: number;
  total_rooms: number;
  approved: boolean | number;
  featured: boolean | number;
  amenities?: string[];
  university?: {
    id: number;
    name: string;
  } | null;
  featured_image?: {
    id: string;
    filename_download: string;
  } | null;
  image_1?: {
    id: string;
    filename_download: string;
  } | null;
  image_2?: {
    id: string;
    filename_download: string;
  } | null;
  image_3?: {
    id: string;
    filename_download: string;
  } | null;
  image_4?: {
    id: string;
    filename_download: string;
  } | null;
  lease_agreement?: {
    id: string;
    filename_download: string;
  } | null;
}

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

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [deletingImages, setDeletingImages] = useState<Record<string, boolean>>({});
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());
  const [uploadingLeaseAgreement, setUploadingLeaseAgreement] = useState(false);
  const [deletingLeaseAgreement, setDeletingLeaseAgreement] = useState(false);
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
    if (params.id && isAuthenticated) {
      fetchProperty();
      fetchUniversitiesData();
    }
  }, [params.id, isAuthenticated]);

  const fetchProperty = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/properties/${params.id}`, {
        method: 'GET',
        credentials: 'include',
        headers,
        cache: 'no-store', // Ensure we get fresh data
      });

      if (response.ok) {
        const data = await response.json();
        const prop = data.property;
        console.log('📥 Property data loaded:', {
          id: prop.id,
          title: prop.title,
          hasFeaturedImage: !!prop.featured_image?.id,
          hasImage1: !!prop.image_1?.id,
          hasImage2: !!prop.image_2?.id,
          hasImage3: !!prop.image_3?.id,
          hasImage4: !!prop.image_4?.id,
          hasLeaseAgreement: !!prop.lease_agreement?.id,
        });
        setProperty(prop);
        
        // Populate form with existing data
        setFormData({
          title: prop.title || '',
          description: prop.description || '',
          price_per_month: prop.price_per_month || '',
          currency: prop.currency || 'ZMW',
          address: prop.address || '',
          distance_from_campus: prop.distance_from_campus?.toString() || '',
          latitude: prop.latitude?.toString() || '',
          longitude: prop.longitude?.toString() || '',
          rooms_available: prop.rooms_available?.toString() || '',
          total_rooms: prop.total_rooms?.toString() || '',
          university: prop.university?.id?.toString() || '',
          amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load property');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

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

  const getImageUrl = (image: Property['featured_image']) => {
    if (!image?.id) return null;
    // Use our proxy API route to handle authentication
    // Add cache-busting parameter to ensure fresh images after updates
    return `/api/images/${image.id}?t=${imageCacheKey}`;
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
      uploadFormData.append('field', field);

      // Don't set Content-Type header - browser will set it automatically with boundary for FormData
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 Uploading image:', { field, fileName: file.name, fileSize: file.size });

      const response = await fetch(`/api/properties/${params.id}/images`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: uploadFormData,
      });

      console.log('📤 Upload response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Image uploaded successfully:', data);
        // Update cache key to force image refresh
        setImageCacheKey(Date.now());
        // Refresh property data to show new image (without showing loading spinner)
        await fetchProperty(false);
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
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setDeletingImages(prev => ({ ...prev, [field]: true }));
    setError(null);

    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/properties/${params.id}/images?field=${field}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Image deleted successfully:', data);
        // Update cache key to force image refresh
        setImageCacheKey(Date.now());
        // Refresh property data to remove deleted image (without showing loading spinner)
        await fetchProperty(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Delete failed:', errorData);
        setError(errorData.error || 'Failed to delete image');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting image');
    } finally {
      setDeletingImages(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleLeaseAgreementUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File size (${fileSizeMB}MB) exceeds the maximum allowed size of 5MB. Please compress the PDF and try again.`);
      return;
    }

    setUploadingLeaseAgreement(true);
    setError(null);

    try {
      const token = localStorage.getItem('directus_token');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 Uploading lease agreement:', { fileName: file.name, fileSize: file.size });

      const response = await fetch(`/api/properties/${params.id}/lease-agreement`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: uploadFormData,
      });

      console.log('📤 Upload response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Lease agreement uploaded successfully:', data);
        // Refresh property data to show new lease agreement (without showing loading spinner)
        await fetchProperty(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Upload failed:', errorData);
        setError(errorData.error || 'Failed to upload lease agreement');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading lease agreement');
    } finally {
      setUploadingLeaseAgreement(false);
    }
  };

  const handleLeaseAgreementDelete = async () => {
    if (!confirm('Are you sure you want to delete the lease agreement?')) {
      return;
    }

    setDeletingLeaseAgreement(true);
    setError(null);

    try {
      const token = localStorage.getItem('directus_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/properties/${params.id}/lease-agreement`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Lease agreement deleted successfully:', data);
        // Refresh property data to remove deleted lease agreement (without showing loading spinner)
        await fetchProperty(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Delete failed:', errorData);
        setError(errorData.error || 'Failed to delete lease agreement');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting lease agreement');
    } finally {
      setDeletingLeaseAgreement(false);
    }
  };

  const getLeaseAgreementUrl = (leaseAgreement: { id: string; filename_download?: string } | null | undefined) => {
    if (!leaseAgreement?.id) return null;
    return `/api/files/${leaseAgreement.id}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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

      // Prepare update data
      const updateData: any = {
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
        updateData.distance_from_campus = parseInt(formData.distance_from_campus);
      }
      if (formData.latitude) {
        updateData.latitude = formData.latitude;
      }
      if (formData.longitude) {
        updateData.longitude = formData.longitude;
      }
      if (formData.university) {
        updateData.university = parseInt(formData.university);
      }

      const response = await fetch(`/api/properties/${params.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/landlord/properties/${params.id}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update property');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/landlord/properties">Back to Properties</Link>
            </Button>
          </div>
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
            <li><Link href={`/landlord/properties/${params.id}`} className="hover:text-blue-600">View Property</Link></li>
            <li>/</li>
            <li className="text-gray-900">Edit</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
          <p className="mt-2 text-gray-600">Update your property listing details</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {uploadingImages && Object.values(uploadingImages).some(v => v) 
              ? 'Image uploaded successfully!' 
              : deletingImages && Object.values(deletingImages).some(v => v)
              ? 'Image deleted successfully!'
              : 'Property updated successfully! Redirecting...'}
          </div>
        )}

        {/* Edit Form */}
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
                    {property?.featured_image?.id ? (
                      <div className="relative group">
                        <img
                          src={getImageUrl(property.featured_image) || ''}
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
                                  if (file) handleImageUpload('featured_image', file);
                                }}
                                disabled={uploadingImages.featured_image || deletingImages.featured_image}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={uploadingImages.featured_image || deletingImages.featured_image}
                              >
                                {uploadingImages.featured_image ? 'Uploading...' : 'Replace'}
                              </Button>
                            </label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleImageDelete('featured_image')}
                              disabled={uploadingImages.featured_image || deletingImages.featured_image}
                              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                            >
                              {deletingImages.featured_image ? 'Deleting...' : 'Delete'}
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
                      const image = property?.[field as keyof Property] as Property['featured_image'];
                      const isUploading = uploadingImages[field];
                      const isDeleting = deletingImages[field];
                      
                      return (
                        <div key={field} className="relative group">
                          {image?.id ? (
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
                                        if (file) handleImageUpload(field, file);
                                      }}
                                      disabled={isUploading || isDeleting}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      disabled={isUploading || isDeleting}
                                    >
                                      {isUploading ? '...' : '↻'}
                                    </Button>
                                  </label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleImageDelete(field)}
                                    disabled={isUploading || isDeleting}
                                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                  >
                                    {isDeleting ? '...' : '×'}
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
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe your property in detail..."
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_per_month">Price per Month *</Label>
                  <Input
                    id="price_per_month"
                    name="price_per_month"
                    type="number"
                    value={formData.price_per_month}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rooms */}
          <Card>
            <CardHeader>
              <CardTitle>Room Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="university">Near University</Label>
                <select
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a university</option>
                  {universities.map(uni => (
                    <option key={uni.id} value={uni.id.toString()}>
                      {uni.name} - {uni.city}, {uni.country}
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
                  min="0"
                  placeholder="900"
                />
              </div>

              {/* Map Picker */}
              <div>
                <Label>Property Location</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Click on the map to set the exact location of your property, or drag the marker to adjust
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
                    placeholder="-22.56100"
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
                    placeholder="17.06500"
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
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AMENITIES.map(amenity => (
                  <label key={amenity.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.key)}
                      onChange={() => handleAmenityToggle(amenity.key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{amenity.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lease Agreement */}
          <Card>
            <CardHeader>
              <CardTitle>Lease Agreement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {property?.lease_agreement?.id ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">{property.lease_agreement.filename_download}</p>
                        <p className="text-sm text-gray-500">PDF Document</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={getLeaseAgreementUrl(property.lease_agreement) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </a>
                      </Button>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLeaseAgreementUpload(file);
                          }}
                          disabled={uploadingLeaseAgreement || deletingLeaseAgreement}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingLeaseAgreement || deletingLeaseAgreement}
                        >
                          {uploadingLeaseAgreement ? 'Uploading...' : 'Replace'}
                        </Button>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLeaseAgreementDelete}
                        disabled={uploadingLeaseAgreement || deletingLeaseAgreement}
                        className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                      >
                        {deletingLeaseAgreement ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLeaseAgreementUpload(file);
                      }}
                      disabled={uploadingLeaseAgreement}
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      {uploadingLeaseAgreement ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-700 mb-1">Upload Lease Agreement PDF</p>
                          <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status (Read-only) */}
          {property && (
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Approval Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      property.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {property.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  {property.featured && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Featured:</span>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        Featured
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Status changes are managed by administrators.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/landlord/properties/${params.id}`}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
