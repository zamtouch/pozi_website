/**
 * Update profile documents
 * PATCH /api/profile/update-documents
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
    const { id_certified_copy, payslip, bank_statement_6months } = body;

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

    // Get current user data to find old file IDs before updating
    const currentUserResponse = await httpJson(
      'GET',
      `${config.directus.url}/users/${encodeURIComponent(userId)}?fields=id_certified_copy,payslip,bank_statement_6months`,
      null,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    const oldFileIds: string[] = [];
    if (currentUserResponse.status >= 200 && currentUserResponse.status < 300) {
      const currentUserData = JSON.parse(currentUserResponse.body);
      const currentUser = currentUserData.data;
      
      // Collect old file IDs that will be replaced
      if (id_certified_copy && currentUser.id_certified_copy && currentUser.id_certified_copy !== id_certified_copy) {
        oldFileIds.push(currentUser.id_certified_copy);
      }
      if (payslip && currentUser.payslip && currentUser.payslip !== payslip) {
        oldFileIds.push(currentUser.payslip);
      }
      if (bank_statement_6months && currentUser.bank_statement_6months && currentUser.bank_statement_6months !== bank_statement_6months) {
        oldFileIds.push(currentUser.bank_statement_6months);
      }
    }

    // Update user documents
    const updateData: any = {};
    if (id_certified_copy) updateData.id_certified_copy = id_certified_copy;
    if (payslip) updateData.payslip = payslip;
    if (bank_statement_6months) updateData.bank_statement_6months = bank_statement_6months;

    const updateResponse = await httpJson(
      'PATCH',
      `${config.directus.url}/users/${encodeURIComponent(userId)}`,
      updateData,
      [`Authorization: Bearer ${config.directus.token}`]
    );

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      const error = JSON.parse(updateResponse.body);
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Failed to update documents' },
        { status: updateResponse.status }
      );
    }

    // Delete old files after successful update (cleanup orphaned files)
    if (oldFileIds.length > 0) {
      console.log(`🗑️ Cleaning up ${oldFileIds.length} old file(s) after document update`);
      for (const oldFileId of oldFileIds) {
        try {
          const deleteResponse = await fetch(`${config.directus.url}/files/${oldFileId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${config.directus.token}`,
            },
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Deleted orphaned file: ${oldFileId}`);
          } else {
            console.warn(`⚠️ Failed to delete orphaned file: ${oldFileId}`);
          }
        } catch (error: any) {
          console.error(`❌ Error deleting orphaned file ${oldFileId}:`, error.message);
        }
      }
    }

    if (updateResponse.status < 200 || updateResponse.status >= 300) {
      const error = JSON.parse(updateResponse.body);
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Failed to update documents' },
        { status: updateResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documents updated successfully',
    });
  } catch (error: any) {
    console.error('Update documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

