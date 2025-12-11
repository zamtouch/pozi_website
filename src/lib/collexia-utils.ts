/**
 * Collexia API utility functions for approval flow
 */

const COLLEXIA_BASE_URL = process.env.NEXT_PUBLIC_COLLEXIA_URL || 'https://collexia.pozi.com.na';

export interface CollexiaStudent {
  student_id: string;
  full_name: string;
  email: string;
  phone?: string;
  id_number?: string;
  id_type?: number;
  account_number: string;
  account_type?: number;
  bank_id: number;
}

export interface CollexiaProperty {
  property_code: string;
  property_name: string;
  address?: string;
  monthly_rent: number;
}

export interface CollexiaMandateData {
  student_id: string;
  property_id: string | number;
  monthly_rent: number;
  start_date: string; // YYYYMMDD format
  frequency_code: number; // 1 = Monthly
  no_of_installments: number;
  mag_id?: number;
  tracking_days?: number;
}

/**
 * Get student from Collexia by ID
 */
export async function getCollexiaStudent(studentId: string): Promise<{
  found: boolean;
  student_id?: string;
  student_data?: CollexiaStudent;
}> {
  try {
    const response = await fetch(`${COLLEXIA_BASE_URL}/api/v1/students/${studentId}`, {
      method: 'GET',
      redirect: 'follow'
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        found: true,
        student_id: result.data.student_id,
        student_data: result.data
      };
    } else {
      return {
        found: false,
        student_id: studentId
      };
    }
  } catch (error) {
    console.error('Error getting Collexia student:', error);
    return {
      found: false,
      student_id: studentId
    };
  }
}

/**
 * Create student in Collexia
 */
export async function createCollexiaStudent(studentData: CollexiaStudent): Promise<{
  success: boolean;
  student_id?: string;
  error?: any;
}> {
  try {
    const response = await fetch(`${COLLEXIA_BASE_URL}/api/v1/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData),
      redirect: 'follow'
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        student_id: studentData.student_id
      };
    } else {
      return {
        success: false,
        error: result
      };
    }
  } catch (error) {
    console.error('Error creating Collexia student:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Get property from Collexia by property code
 */
export async function getCollexiaProperty(propertyCode: string): Promise<{
  found: boolean;
  property_id?: string | number;
  property_data?: any;
}> {
  try {
    const response = await fetch(`${COLLEXIA_BASE_URL}/api/v1/properties/${propertyCode}`, {
      method: 'GET',
      redirect: 'follow'
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        found: true,
        property_id: result.data.id || result.data.property_id || propertyCode,
        property_data: result.data
      };
    } else {
      return {
        found: false
      };
    }
  } catch (error) {
    console.error('Error getting Collexia property:', error);
    return {
      found: false
    };
  }
}

/**
 * Create property in Collexia
 */
export async function createCollexiaProperty(propertyData: CollexiaProperty): Promise<{
  success: boolean;
  property_id?: string | number;
  error?: any;
}> {
  try {
    const response = await fetch(`${COLLEXIA_BASE_URL}/api/v1/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData),
      redirect: 'follow'
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Get property again to get the property_id
      const getResult = await getCollexiaProperty(propertyData.property_code);
      return {
        success: true,
        property_id: getResult.property_id || propertyData.property_code
      };
    } else {
      return {
        success: false,
        error: result
      };
    }
  } catch (error) {
    console.error('Error creating Collexia property:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Create mandate in Collexia
 */
export async function createCollexiaMandate(mandateData: CollexiaMandateData): Promise<{
  success: boolean;
  mandate_data?: any;
  error?: any;
}> {
  try {
    const response = await fetch(`${COLLEXIA_BASE_URL}/api/v1/mandates/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mandateData),
      redirect: 'follow'
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        mandate_data: result.data
      };
    } else {
      return {
        success: false,
        error: result
      };
    }
  } catch (error) {
    console.error('Error creating Collexia mandate:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Ensure student exists in Collexia (get or create)
 */
export async function ensureCollexiaStudent(
  studentId: string,
  studentData: CollexiaStudent
): Promise<{
  success: boolean;
  student_id: string;
  error?: any;
}> {
  // Try to get student first
  let studentResult = await getCollexiaStudent(studentId);

  if (!studentResult.found) {
    // Create student if not found
    const createResult = await createCollexiaStudent(studentData);
    if (!createResult.success) {
      return {
        success: false,
        student_id: studentId,
        error: createResult.error
      };
    }
    // Get student again to verify
    studentResult = await getCollexiaStudent(studentId);
    if (!studentResult.found) {
      return {
        success: false,
        student_id: studentId,
        error: 'Student was created but could not be retrieved'
      };
    }
  }

  return {
    success: true,
    student_id: studentResult.student_id || studentId
  };
}

/**
 * Ensure property exists in Collexia (get or create)
 */
export async function ensureCollexiaProperty(
  propertyCode: string,
  propertyData: CollexiaProperty
): Promise<{
  success: boolean;
  property_id: string | number;
  error?: any;
}> {
  // Try to get property first
  let propertyResult = await getCollexiaProperty(propertyCode);

  if (!propertyResult.found) {
    // Create property if not found
    const createResult = await createCollexiaProperty(propertyData);
    if (!createResult.success) {
      return {
        success: false,
        property_id: propertyCode,
        error: createResult.error
      };
    }
    propertyResult = {
      found: true,
      property_id: createResult.property_id || propertyCode
    };
  }

  return {
    success: true,
    property_id: propertyResult.property_id || propertyCode
  };
}















