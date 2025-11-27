import { NextRequest, NextResponse } from 'next/server';
import { httpJson } from '@/lib/auth-utils/http';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/auth-utils/server-auth';

/**
 * Get applications for properties owned by the current landlord
 * GET /api/landlord/applications
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    let token = getAuthToken(request);
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token found' },
        { status: 401 }
      );
    }

    // Get user ID from token
    const meResponse = await fetch(`${config.directus.url}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not verify user' },
        { status: 401 }
      );
    }
    
    const meData = await meResponse.json();
    const userId = meData.data?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');
    const status = searchParams.get('status');

    // First, get all properties owned by this landlord
    const propertiesParams = new URLSearchParams();
    propertiesParams.append('filter[owner][_eq]', userId);
    propertiesParams.append('fields', 'id');
    
    const propertiesResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (propertiesResponse.status < 200 || propertiesResponse.status >= 300) {
      const errorData = JSON.parse(propertiesResponse.body);
      console.error('❌ Failed to fetch properties:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to fetch properties' },
        { status: propertiesResponse.status }
      );
    }

    const propertiesData = JSON.parse(propertiesResponse.body);
    const ownedProperties = propertiesData.data || [];
    const propertyIds = ownedProperties.map((p: any) => p.id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        applications: [],
        count: 0,
      });
    }

    // Build applications query
    const applicationsParams = new URLSearchParams();
    
    // Filter by property IDs owned by landlord
    if (propertyId) {
      // If specific property requested, verify ownership
      if (propertyIds.includes(parseInt(propertyId))) {
        applicationsParams.append('filter[property][_eq]', propertyId);
      } else {
        return NextResponse.json(
          { error: 'Property not found or access denied' },
          { status: 403 }
        );
      }
    } else {
      // Filter by all owned properties using _in operator
      // Directus _in operator expects comma-separated values
      if (propertyIds.length > 0) {
        // Use _in with comma-separated values
        const propertyIdsString = propertyIds.join(',');
        applicationsParams.append('filter[property][_in]', propertyIdsString);
      } else {
        return NextResponse.json({
          success: true,
          applications: [],
          count: 0,
        });
      }
    }

    // Filter by status if provided
    if (status) {
      applicationsParams.append('filter[status][_eq]', status);
    }

    // Fetch full application details including student info, files, and all Collexia tracking fields
    applicationsParams.append('fields', '*,property.*,property.featured_image.*,student.id,student.first_name,student.last_name,student.email,student.phone,student.responsible_first_name,student.responsible_last_name,student.responsible_relationship,student.responsible_email,student.responsible_id_number,student.responsible_cell,student.responsible_occupation,signed_lease_agreement.*,signed_collexia_form.*,pay_slip.*,bank_statement.*,collexia_contract_reference,collexia_student_id,collexia_property_code,collexia_student_registered,collexia_property_registered,collexia_mandate_registered,collexia_integration_date,collexia_integration_status,collexia_error_message');
    applicationsParams.append('sort', '-date_created');
    
    const applicationsResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/applications?${applicationsParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (applicationsResponse.status < 200 || applicationsResponse.status >= 300) {
      const errorData = JSON.parse(applicationsResponse.body);
      console.error('❌ Failed to fetch applications:', errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || 'Failed to fetch applications' },
        { status: applicationsResponse.status }
      );
    }

    const applicationsData = JSON.parse(applicationsResponse.body);
    const applications = applicationsData.data || [];

    console.log('✅ Applications fetched for landlord:', applications.length);

    return NextResponse.json({
      success: true,
      applications: applications,
      count: applications.length,
    });
  } catch (error: any) {
    console.error('Error fetching landlord applications:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

