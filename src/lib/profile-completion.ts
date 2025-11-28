/**
 * Profile completion utility
 * Calculates profile completion percentage and checks if profile is complete
 */

export interface ProfileCompletionData {
  // Basic info (always required)
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  
  // Student-specific fields
  responsible_first_name?: string | null;
  responsible_last_name?: string | null;
  responsible_relationship?: string | null;
  responsible_email?: string | null;
  responsible_id_number?: string | null;
  responsible_cell?: string | null;
  responsible_occupation?: string | null;
  
  // File uploads (students only)
  id_certified_copy?: string | null;
  payslip?: string | null;
  bank_statement_6months?: string | null;
  
  // Bank account information (for Collexia payment collection)
  account_number?: string | null;
  bank_id?: number | null;
  account_type?: number | null;
  id_number?: string | null;
  id_type?: number | null;
  
  // User role/type
  role?: string | { name?: string } | null;
}

export interface ProfileCompletionResult {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(user: ProfileCompletionData): ProfileCompletionResult {
  const missingFields: string[] = [];
  let totalFields = 0;
  let completedFields = 0;
  
  // Normalize role - handle multiple possible formats
  let roleName = '';
  if (typeof user.role === 'object') {
    // Try multiple properties
    const roleObj = user.role as any;
    roleName = roleObj?.name || 
               roleObj?.id || 
               roleObj?.title ||
               String(user.role) || 
               '';
  } else if (typeof user.role === 'string') {
    roleName = user.role;
  } else if (user.role) {
    roleName = String(user.role);
  }
  
  const normalizedRoleName = (roleName?.toLowerCase() || '').trim();
  // More aggressive student detection - check for 'student' anywhere in the role name
  const isStudent = normalizedRoleName.includes('student') || 
                   normalizedRoleName === 'student' ||
                   normalizedRoleName.startsWith('student');
  
  // Debug logging
  console.log('🔍 calculateProfileCompletion - Role check:', {
    role: user.role,
    roleName,
    normalizedRoleName,
    isStudent,
    roleType: typeof user.role,
    willCheckBankFields: isStudent,
    roleKeys: typeof user.role === 'object' ? Object.keys(user.role || {}) : 'N/A',
  });
  
  // Basic info (always required)
  totalFields += 4;
  if (!user.first_name?.trim()) missingFields.push('First Name');
  else completedFields++;
  
  if (!user.last_name?.trim()) missingFields.push('Last Name');
  else completedFields++;
  
  if (!user.email?.trim()) missingFields.push('Email');
  else completedFields++;
  
  if (!user.phone?.trim()) missingFields.push('Phone Number');
  else completedFields++;
  
  // Student-specific fields
  if (isStudent) {
    // Responsible person fields (7 fields)
    totalFields += 7;
    if (!user.responsible_first_name?.trim()) missingFields.push('Responsible Person First Name');
    else completedFields++;
    
    if (!user.responsible_last_name?.trim()) missingFields.push('Responsible Person Last Name');
    else completedFields++;
    
    if (!user.responsible_relationship?.trim()) missingFields.push('Responsible Person Relationship');
    else completedFields++;
    
    if (!user.responsible_email?.trim()) missingFields.push('Responsible Person Email');
    else completedFields++;
    
    if (!user.responsible_id_number?.trim()) missingFields.push('Responsible Person ID Number');
    else completedFields++;
    
    if (!user.responsible_cell?.trim()) missingFields.push('Responsible Person Cell');
    else completedFields++;
    
    if (!user.responsible_occupation?.trim()) missingFields.push('Responsible Person Occupation');
    else completedFields++;
    
    // File uploads (3 files)
    totalFields += 3;
    if (!user.id_certified_copy) missingFields.push('ID Certified Copy');
    else completedFields++;
    
    if (!user.payslip) missingFields.push('Payslip');
    else completedFields++;
    
    if (!user.bank_statement_6months) missingFields.push('6 Months Bank Statement');
    else completedFields++;
    
    // Bank account information (required for Collexia payment collection)
    totalFields += 2; // account_number and bank_id are required
    
    // Check account_number - must be non-empty string
    const accountNumberValue = user.account_number;
    const hasAccountNumber = accountNumberValue !== null && 
                            accountNumberValue !== undefined && 
                            accountNumberValue !== '' &&
                            String(accountNumberValue).trim().length > 0;
    
    // Check bank_id - must be a valid number (not null, undefined, or empty)
    const bankIdValue = user.bank_id;
    const hasBankId = bankIdValue !== null && 
                     bankIdValue !== undefined && 
                     String(bankIdValue).trim() !== '' &&
                     !isNaN(Number(bankIdValue)) &&
                     Number(bankIdValue) > 0;
    
    console.log('🔍 Bank account check (STUDENT):', {
      account_number: accountNumberValue,
      bank_id: bankIdValue,
      account_number_type: typeof accountNumberValue,
      bank_id_type: typeof bankIdValue,
      hasAccountNumber,
      hasBankId,
      willAddToMissing: !hasAccountNumber || !hasBankId,
    });
    
    if (!hasAccountNumber) {
      missingFields.push('Bank Account Number');
      console.log('❌ Missing: Bank Account Number');
    } else {
      completedFields++;
      console.log('✅ Has: Bank Account Number');
    }
    
    if (!hasBankId) {
      missingFields.push('Bank');
      console.log('❌ Missing: Bank');
    } else {
      completedFields++;
      console.log('✅ Has: Bank');
    }
    
    console.log('📊 After bank check:', {
      totalFields,
      completedFields,
      missingFieldsCount: missingFields.length,
      missingFields: missingFields,
    });
    
    // Optional bank fields (not counted in completion but helpful)
    // account_type, id_number, id_type are optional
  }
  
  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  const isComplete = percentage === 100 && missingFields.length === 0;
  
  console.log('📊 Final calculation:', {
    totalFields,
    completedFields,
    percentage,
    isComplete,
    missingFieldsCount: missingFields.length,
    missingFields,
    isStudent,
  });
  
  return {
    percentage,
    isComplete,
    missingFields,
  };
}

/**
 * Check if user can apply for properties (profile must be 100% complete)
 */
export function canApplyForProperties(user: ProfileCompletionData): boolean {
  const result = calculateProfileCompletion(user);
  return result.isComplete;
}









