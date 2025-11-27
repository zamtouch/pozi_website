# Collexia Payment Collection Integration

This document describes the Collexia payment collection integration for Pozi Student Living platform.

## Overview

When a property application is approved by a landlord, the system automatically:
1. Registers the student in Collexia
2. Registers the property in Collexia
3. Creates a payment mandate for automatic rent collection

## Required Directus User Fields

For the integration to work, students must have the following fields in the Directus `users` collection:

### Required Fields
- `account_number` (String) - Student's bank account number
- `bank_id` (Integer) - Bank ID code (see Bank IDs below)

### Optional but Recommended Fields
- `account_type` (Integer) - Account type (defaults to 1 if not provided)
  - 1 = Current (Cheque)
  - 2 = Savings
  - 3 = Transmission
- `id_number` (String) - Student's ID number
- `id_type` (Integer) - ID type (defaults to 1 if not provided)
  - 1 = RSA ID
  - 2 = Passport
  - 3 = Temp ID
  - 4 = Business

### Bank IDs (Namibia)
- 64 = Bank Windhoek
- 65 = FNB Namibia
- 66 = TrustCo Bank
- 67 = Bank Atlántico
- 68 = BankBIC
- 69 = Bank of Namibia
- 70 = Letshego Bank Namibia
- 71 = Nedbank Namibia
- 72 = Standard Bank Namibia

## Adding Fields to Directus

1. Go to Directus Admin Panel: https://app.pozi.com.na/admin
2. Navigate to Settings → Data Model
3. Find the `users` collection
4. Add the following fields:
   - `account_number` (String, Required for students)
   - `bank_id` (Integer, Required for students)
   - `account_type` (Integer, Optional, Default: 1)
   - `id_number` (String, Optional)
   - `id_type` (Integer, Optional, Default: 1)

## Application Collection Fields

The `applications` collection should have:
- `collexia_contract_reference` (String, Optional) - Stores the contract reference from Collexia after mandate registration

## Environment Variables

Add to your `.env` file:

```env
# Collexia API endpoint (defaults to https://collexia.pozi.com.na)
COLLEXIA_API_URL=https://collexia.pozi.com.na
# Or use NEXT_PUBLIC_COLLEXIA_API_URL for client-side access
NEXT_PUBLIC_COLLEXIA_API_URL=https://collexia.pozi.com.na
```

## How It Works

### Application Approval Flow

1. **Landlord approves application** via `/api/landlord/applications/[id]` endpoint
2. **System fetches full application data** including student and property details
3. **Collexia Integration** (if status is 'approved'):
   - Validates student has required bank account information
   - Registers student in Collexia with unique ID: `POZI-{user_id}`
   - Registers property in Collexia with code: `PROP-{property_id}`
   - Creates mandate for monthly rent collection (12 months, starting next month)
   - Saves contract reference to application record

### Mandate Configuration

- **Frequency**: Monthly (code: 4)
- **Installments**: 12 months
- **Start Date**: First day of next month
- **Tracking Days**: 3 days
- **MAG ID**: 46 (Endo)

## Error Handling

The integration is **non-blocking** - if Collexia registration fails:
- The application is still approved
- An error is logged
- A warning is returned in the API response
- Manual registration may be required

## API Response

When approving an application, the response includes:

```json
{
  "success": true,
  "message": "Application approved successfully",
  "application": { ... },
  "collexia": {
    "success": true,
    "student": { ... },
    "property": { ... },
    "mandate": { ... },
    "contract_reference": "31281117385028"
  }
}
```

If Collexia integration fails:

```json
{
  "success": true,
  "message": "Application approved successfully",
  "application": { ... },
  "collexia": {
    "success": false,
    "error": "Student bank account information is missing...",
    "warning": "Application approved but Collexia mandate registration failed. Please register manually."
  }
}
```

## Testing

1. Ensure student has `account_number` and `bank_id` in their profile
2. Approve an application via the landlord dashboard
3. Check server logs for Collexia integration status
4. Verify contract reference is saved to application record
5. Check Collexia dashboard for registered mandate

## Manual Registration

If automatic registration fails, you can manually register via:
- Collexia API endpoint: `https://collexia.pozi.com.na/api/v1/mandates/register`
- Use Postman collection in `/postman` folder
- Or use the Collexia admin panel

## Support

For issues:
1. Check server logs for detailed error messages
2. Verify student has required bank account fields
3. Verify Collexia API endpoint is accessible
4. Check Collexia API status

