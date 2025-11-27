/**
 * Update profile information
 * PATCH /api/profile/update
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-utils/server-auth';
import { config } from '@/lib/config';
import { httpJson } from '@/lib/auth-utils/http';

export async function PATCH(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      phone,
      responsible_first_name,
      responsible_last_name,
      responsible_relationship,
      responsible_email,
      responsible_id_number,
      responsible_cell,
      responsible_occupation,
      // Bank account information (for Collexia)
      account_number,
      bank_id,
      account_type,
      id_number,
      id_type,
    } = body;

    // Get user ID
    const meResponse = await fetch(`${config.directus.url}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to verify user' },
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

    // Update user profile fields
    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone || null;
    if (responsible_first_name !== undefined) updateData.responsible_first_name = responsible_first_name || null;
    if (responsible_last_name !== undefined) updateData.responsible_last_name = responsible_last_name || null;
    if (responsible_relationship !== undefined) updateData.responsible_relationship = responsible_relationship || null;
    if (responsible_email !== undefined) updateData.responsible_email = responsible_email || null;
    if (responsible_id_number !== undefined) updateData.responsible_id_number = responsible_id_number || null;
    if (responsible_cell !== undefined) updateData.responsible_cell = responsible_cell || null;
    if (responsible_occupation !== undefined) updateData.responsible_occupation = responsible_occupation || null;
    
    // Bank account information (for Collexia payment collection)
    if (account_number !== undefined) updateData.account_number = account_number || null;
    if (bank_id !== undefined) updateData.bank_id = bank_id || null;
    if (account_type !== undefined) updateData.account_type = account_type || null;
    if (id_number !== undefined) updateData.id_number = id_number || null;
    if (id_type !== undefined) updateData.id_type = id_type || null;
    
    console.log('🔍 Updating profile with data:', {
      has_account_number: !!updateData.account_number,
      has_bank_id: !!updateData.bank_id,
      account_number: updateData.account_number,
      bank_id: updateData.bank_id,
      account_type: updateData.account_type,
      id_number: updateData.id_number,
      id_type: updateData.id_type,
    });

    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/users/${encodeURIComponent(userId)}`,
      updateData,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      const error = JSON.parse(updateResponse.body);
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Failed to update profile' },
        { status: updateResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

