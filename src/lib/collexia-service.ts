/**
 * Collexia Payment Collection Service
 * Handles integration with Collexia API for student rental payment collection
 */

interface CollexiaStudent {
  student_id: string;
  full_name: string;
  email: string;
  phone?: string;
  id_number?: string;
  id_type?: number;
  account_number: string;
  account_type?: number;
  bank_id: number;
  directus_user_id?: string; // Optional: Store Directus user ID for mapping
}

interface CollexiaProperty {
  property_code: string;
  property_name: string;
  address?: string;
  monthly_rent: number;
}

interface MandateRegistration {
  student_id: string;
  property_id: string | number;
  monthly_rent: number;
  start_date: string; // Format: YYYYMMDD
  frequency_code: number; // 1=Weekly, 3=Fortnightly, 4=Monthly, 5=Monthly by Rule
  no_of_installments: number;
  tracking_days?: number;
  mag_id?: number;
}

interface CollexiaResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  timestamp?: string;
  fullError?: any;
}

class CollexiaService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to production Collexia API endpoint
    // Default: https://collexia.pozi.com.na (production server)
    // For local dev, set COLLEXIA_API_URL=https://pozi.com.na in .env.local
    // Can be overridden via COLLEXIA_API_URL or NEXT_PUBLIC_COLLEXIA_API_URL
    this.baseUrl = process.env.COLLEXIA_API_URL || 
                   process.env.NEXT_PUBLIC_COLLEXIA_API_URL || 
                   'https://collexia.pozi.com.na';
    console.log('🔧 CollexiaService initialized with baseUrl:', this.baseUrl);
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔧 COLLEXIA_API_URL env var:', process.env.COLLEXIA_API_URL || 'not set');
    console.log('🔧 NEXT_PUBLIC_COLLEXIA_API_URL env var:', process.env.NEXT_PUBLIC_COLLEXIA_API_URL || 'not set');
  }

  /**
   * Register or update a student in Collexia
   */
  async registerStudent(student: CollexiaStudent): Promise<CollexiaResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/students`;
      console.log(`📡 Registering student at: ${url}`);
      console.log(`📋 Student data:`, { student_id: student.student_id, full_name: student.full_name, email: student.email });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log(`📡 Response status: ${response.status}`);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('❌ Failed to parse response:', text);
        return {
          success: false,
          message: `Invalid response from Collexia API: ${text.substring(0, 200)}`,
          errors: { status: response.status, body: text },
        };
      }

      if (!response.ok) {
        console.error('❌ Collexia API error:', data);
        return {
          success: false,
          message: data.message || `Failed to register student (HTTP ${response.status})`,
          errors: data.errors || data,
        };
      }

      console.log('✅ Student registered successfully:', data);
      return {
        success: true,
        message: data.message || 'Student registered successfully',
        data: data.data,
      };
    } catch (error: any) {
      console.error('❌ Collexia registerStudent error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        baseUrl: this.baseUrl,
        code: error.code,
        cause: error.cause,
      });
      
      // Provide helpful error message based on error type
      let errorMessage = `Failed to register student: ${error.message}`;
      if (error.message === 'fetch failed' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage = `Cannot connect to Collexia API at ${this.baseUrl}. Please verify the server is running and accessible. Test: ${this.baseUrl}/api/v1/health`;
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.message.includes('certificate')) {
        errorMessage = `SSL certificate error connecting to ${this.baseUrl}. This may be a certificate validation issue.`;
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = `Request to Collexia API timed out. The server at ${this.baseUrl} may be slow or unreachable.`;
      }
      
      return {
        success: false,
        message: errorMessage,
        errors: error,
      };
    }
  }

  /**
   * Register or update a property in Collexia
   */
  async registerProperty(property: CollexiaProperty): Promise<CollexiaResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/properties`;
      console.log(`📡 Registering property at: ${url}`);
      console.log(`📋 Property data:`, { property_code: property.property_code, property_name: property.property_name });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(property),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log(`📡 Response status: ${response.status}`);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('❌ Failed to parse response:', text);
        return {
          success: false,
          message: `Invalid response from Collexia API: ${text.substring(0, 200)}`,
          errors: { status: response.status, body: text },
        };
      }

      if (!response.ok) {
        console.error('❌ Collexia API error:', data);
        return {
          success: false,
          message: data.message || `Failed to register property (HTTP ${response.status})`,
          errors: data.errors || data,
        };
      }

      console.log('✅ Property registered successfully:', data);
      return {
        success: true,
        message: data.message || 'Property registered successfully',
        data: data.data,
      };
    } catch (error: any) {
      console.error('❌ Collexia registerProperty error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        baseUrl: this.baseUrl,
        code: error.code,
        cause: error.cause,
        errno: error.errno,
        syscall: error.syscall,
      });
      
      // Provide helpful error message based on error type
      let errorMessage = `Failed to register property: ${error.message}`;
      if (error.message === 'fetch failed' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage = `Cannot connect to Collexia API at ${this.baseUrl}. Please verify the server is running and accessible. Test: ${this.baseUrl}/api/v1/health`;
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.message.includes('certificate')) {
        errorMessage = `SSL certificate error connecting to ${this.baseUrl}. This may be a certificate validation issue.`;
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = `Request to Collexia API timed out. The server at ${this.baseUrl} may be slow or unreachable.`;
      }
      
      return {
        success: false,
        message: errorMessage,
        errors: error,
      };
    }
  }

  /**
   * Register a mandate for payment collection
   */
  async registerMandate(mandate: MandateRegistration): Promise<CollexiaResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/mandates/register`;
      console.log(`📡 Registering mandate at: ${url}`);
      console.log(`📋 Mandate data:`, { 
        student_id: mandate.student_id, 
        property_id: mandate.property_id,
        monthly_rent: mandate.monthly_rent,
        start_date: mandate.start_date,
      });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mandate),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log(`📡 Response status: ${response.status}`);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('❌ Failed to parse response:', text);
        return {
          success: false,
          message: `Invalid response from Collexia API: ${text.substring(0, 200)}`,
          errors: { status: response.status, body: text },
        };
      }

      if (!response.ok) {
        console.error('❌ Collexia API error response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          fullResponse: JSON.stringify(data, null, 2),
        });
        console.error('❌ Full error object:', JSON.stringify(data, null, 2));
        console.error('❌ Error keys:', Object.keys(data || {}));
        console.error('❌ Error errors field:', data.errors);
        console.error('❌ Error errors type:', typeof data.errors);
        
        // Extract detailed error message
        let errorMessage = data.message || `Failed to register mandate (HTTP ${response.status})`;
        
        // Log the exact error structure for debugging
        if (data.errors) {
          console.error('❌ Errors field content:', JSON.stringify(data.errors, null, 2));
        }
        
        // Handle different error formats from Collexia API
        if (data.errors) {
          if (typeof data.errors === 'string') {
            errorMessage = data.errors;
          } else if (Array.isArray(data.errors)) {
            // Extract error messages from array
            const errorMessages = data.errors.map((err: any) => {
              if (typeof err === 'string') return err;
              if (err.message) return err.message;
              if (err.detail) return err.detail;
              if (err.summary) return err.summary;
              return JSON.stringify(err);
            });
            errorMessage = errorMessages.join('; ');
          } else if (typeof data.errors === 'object') {
            // Try to extract meaningful error messages
            if (data.errors.summary) {
              errorMessage = data.errors.summary;
            } else if (data.errors.detail) {
              errorMessage = data.errors.detail;
            } else if (data.errors.message) {
              errorMessage = data.errors.message;
            } else {
              errorMessage = JSON.stringify(data.errors);
            }
          }
        }
        
        // If error message is still generic, try to get more details from the data object
        if (errorMessage === `Failed to register mandate (HTTP ${response.status})` && data) {
          if (data.summary) errorMessage = data.summary;
          else if (data.detail) errorMessage = data.detail;
          else if (typeof data === 'string') errorMessage = data;
          else if (Array.isArray(data) && data.length > 0) {
            errorMessage = data.map((item: any) => {
              if (typeof item === 'string') return item;
              if (item.summary) return item.summary;
              if (item.detail) return item.detail;
              return JSON.stringify(item);
            }).join('; ');
          }
        }
        
        console.error('❌ Extracted error message:', errorMessage);
        console.error('❌ Full error data being returned:', JSON.stringify({
          message: errorMessage,
          errors: data.errors || data,
          originalData: data
        }, null, 2));
        
        return {
          success: false,
          message: errorMessage,
          errors: data.errors || data,
          fullError: data, // Include full error for detailed logging
        };
      }

      console.log('✅ Mandate registered successfully:', data);
      return {
        success: true,
        message: data.message || 'Mandate registered successfully',
        data: data.data,
      };
    } catch (error: any) {
      console.error('❌ Collexia registerMandate error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        baseUrl: this.baseUrl,
        code: error.code,
        cause: error.cause,
      });
      
      // Provide helpful error message based on error type
      let errorMessage = `Failed to register mandate: ${error.message}`;
      if (error.message === 'fetch failed' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage = `Cannot connect to Collexia API at ${this.baseUrl}. Please verify the server is running and accessible. Test: ${this.baseUrl}/api/v1/health`;
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.message.includes('certificate')) {
        errorMessage = `SSL certificate error connecting to ${this.baseUrl}. This may be a certificate validation issue.`;
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = `Request to Collexia API timed out. The server at ${this.baseUrl} may be slow or unreachable.`;
      }
      
      return {
        success: false,
        message: errorMessage,
        errors: error,
      };
    }
  }

  /**
   * Check mandate status
   */
  async checkMandateStatus(contractReference: string): Promise<CollexiaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/mandates/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contract_reference: contractReference }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to check mandate status',
          errors: data.errors || data,
        };
      }

      return {
        success: true,
        message: data.message || 'Mandate status retrieved successfully',
        data: data.data,
      };
    } catch (error: any) {
      console.error('❌ Collexia checkMandateStatus error:', error);
      return {
        success: false,
        message: `Failed to check mandate status: ${error.message}`,
        errors: error,
      };
    }
  }

  /**
   * Check if student exists in external Collexia API
   * Uses mandate enquiry to check if student has any existing mandates
   */
  async checkStudentExists(studentId: string): Promise<boolean> {
    try {
      // The external Collexia API doesn't have a direct student lookup
      // We need to check via the local API which can query the external API
      // For now, we'll rely on registration to handle duplicates gracefully
      // The local API will return an error if student already exists, which we'll handle
      console.log('ℹ️ Student existence check: Will rely on registration to detect duplicates');
      return false; // Assume doesn't exist, let registration handle duplicates
    } catch (error: any) {
      console.error('❌ Collexia checkStudentExists error:', error);
      return false;
    }
  }

  /**
   * Check if property exists in external Collexia API
   * Properties aren't directly queryable, so we rely on registration to handle duplicates
   */
  async checkPropertyExists(propertyCode: string): Promise<boolean> {
    try {
      // Properties aren't directly queryable in external Collexia API
      // We'll rely on registration to handle duplicates
      console.log('ℹ️ Property existence check: Will rely on registration to detect duplicates');
      return false; // Assume doesn't exist, let registration handle duplicates
    } catch (error: any) {
      console.error('❌ Collexia checkPropertyExists error:', error);
      return false;
    }
  }

  /**
   * Get student by ID from Collexia API
   * Returns the student data
   */
  async getStudentById(studentId: string): Promise<CollexiaResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/students/${studentId}`;
      console.log(`📡 Fetching student from Collexia: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 Response status: ${response.status}`);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('❌ Failed to parse response:', text);
        return {
          success: false,
          message: `Invalid response from Collexia API: ${text.substring(0, 200)}`,
          errors: { status: response.status, body: text },
        };
      }

      if (!response.ok) {
        console.error('❌ Collexia API error:', data);
        return {
          success: false,
          message: data.message || `Failed to get student (HTTP ${response.status})`,
          errors: data.errors || data,
        };
      }

      console.log('✅ Student fetched successfully:', data);
      return {
        success: true,
        message: data.message || 'Student fetched successfully',
        data: data.data,
      };
    } catch (error: any) {
      console.error('❌ Collexia getStudentById error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        baseUrl: this.baseUrl,
        code: error.code,
        cause: error.cause,
      });
      
      return {
        success: false,
        message: `Failed to get student: ${error.message}`,
        errors: error,
      };
    }
  }

  /**
   * Get property by code from Collexia API
   * Returns the property data including its internal ID
   */
  async getPropertyByCode(propertyCode: string): Promise<CollexiaResponse> {
    try {
      const url = `${this.baseUrl}/api/v1/properties/${propertyCode}`;
      console.log(`📡 Fetching property from Collexia: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 Response status: ${response.status}`);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('❌ Failed to parse response:', text);
        return {
          success: false,
          message: `Invalid response from Collexia API: ${text.substring(0, 200)}`,
          errors: { status: response.status, body: text },
        };
      }

      if (!response.ok) {
        console.error('❌ Collexia API error:', data);
        return {
          success: false,
          message: data.message || `Failed to get property (HTTP ${response.status})`,
          errors: data.errors || data,
        };
      }

      console.log('✅ Property fetched successfully:', data);
      return {
        success: true,
        message: data.message || 'Property fetched successfully',
        data: data.data,
      };
    } catch (error: any) {
      console.error('❌ Collexia getPropertyByCode error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        baseUrl: this.baseUrl,
        code: error.code,
        cause: error.cause,
      });
      
      return {
        success: false,
        message: `Failed to get property: ${error.message}`,
        errors: error,
      };
    }
  }
}

export const collexiaService = new CollexiaService();
export type { CollexiaStudent, CollexiaProperty, MandateRegistration, CollexiaResponse };

