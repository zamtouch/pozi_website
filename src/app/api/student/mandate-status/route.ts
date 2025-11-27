/**
 * Get mandate status for student applications
 * GET /api/student/mandate-status
 * Query params: application_id (optional - if not provided, returns all student's mandates)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-utils/server-auth';
import { config } from '@/lib/config';
import { collexiaService } from '@/lib/collexia-service';
import { httpJson } from '@/lib/auth-utils/http';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID
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
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('application_id');

    // Check if user is a landlord (for viewing their approved applications)
    const meDataResponse = await fetch(`${config.directus.url}/users/me?fields=role.id,role.name`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    let isLandlord = false;
    if (meDataResponse.ok) {
      const meDataFull = await meDataResponse.json();
      const roleName = (meDataFull.data?.role?.name || '').toLowerCase();
      isLandlord = roleName.includes('landlord') || roleName.includes('owner');
    }

    // Fetch applications with Collexia contract references
    const applicationsParams = new URLSearchParams();
    
    if (isLandlord) {
      // For landlords: get applications for their properties
      // First get their properties
      const propertiesParams = new URLSearchParams();
      propertiesParams.append('filter[owner][_eq]', userId);
      propertiesParams.append('fields', 'id');
      
      const propertiesResponse = await httpJson(
        'GET',
        `${config.directus.url}/items/properties?${propertiesParams.toString()}`,
        null,
        [`Authorization: Bearer ${config.directus.token}`]
      );
      
      if (propertiesResponse.status >= 200 && propertiesResponse.status < 300) {
        const propertiesData = JSON.parse(propertiesResponse.body);
        const propertyIds = (propertiesData.data || []).map((p: any) => p.id);
        
        if (propertyIds.length > 0) {
          if (applicationId) {
            applicationsParams.append('filter[id][_eq]', applicationId);
            applicationsParams.append('filter[property][_in]', propertyIds.join(','));
          } else {
            applicationsParams.append('filter[property][_in]', propertyIds.join(','));
            applicationsParams.append('filter[status][_eq]', 'approved');
          }
        } else {
          return NextResponse.json({
            success: true,
            mandates: [],
            count: 0,
          });
        }
      }
    } else {
      // For students: get their own applications
      applicationsParams.append('filter[student][_eq]', userId);
      if (applicationId) {
        applicationsParams.append('filter[id][_eq]', applicationId);
      }
    }
    
    applicationsParams.append('fields', 'id,status,collexia_contract_reference,property.*,property.title,property.address');
    applicationsParams.append('sort', '-date_created');

    const applicationsResponse = await httpJson(
      'GET',
      `${config.directus.url}/items/applications?${applicationsParams.toString()}`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (applicationsResponse.status < 200 || applicationsResponse.status >= 300) {
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: applicationsResponse.status }
      );
    }

    const applicationsData = JSON.parse(applicationsResponse.body);
    const applications = applicationsData.data || [];

    // Filter applications that have Collexia contract references
    const mandatesWithStatus = await Promise.all(
      applications
        .filter((app: any) => app.collexia_contract_reference)
        .map(async (app: any) => {
          try {
            const statusResult = await collexiaService.checkMandateStatus(app.collexia_contract_reference);
            return {
              application_id: app.id,
              application_status: app.status,
              property: app.property,
              contract_reference: app.collexia_contract_reference,
              mandate_status: statusResult.success ? statusResult.data : null,
              mandate_error: statusResult.success ? null : statusResult.message,
            };
          } catch (error: any) {
            return {
              application_id: app.id,
              application_status: app.status,
              property: app.property,
              contract_reference: app.collexia_contract_reference,
              mandate_status: null,
              mandate_error: error.message,
            };
          }
        })
    );

    return NextResponse.json({
      success: true,
      mandates: mandatesWithStatus,
      count: mandatesWithStatus.length,
    });
  } catch (error: any) {
    console.error('Error fetching mandate status:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

