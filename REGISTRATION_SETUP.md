# Registration Setup & Testing Guide

## ✅ Setup Status

### Fields in Directus
All required fields have been created in the `directus_users` collection:
- ✅ `responsible_first_name`
- ✅ `responsible_last_name`
- ✅ `responsible_relationship`
- ✅ `responsible_email`
- ✅ `responsible_id_number`
- ✅ `responsible_cell`
- ✅ `responsible_occupation`
- ✅ `id_certified_copy` (File field)
- ✅ `payslip` (File field)
- ✅ `bank_statement_6months` (File field)

### API Endpoints
- ✅ `/api/auth/signup` - User registration endpoint
- ✅ `/api/auth/register-upload` - Public file upload endpoint for registration

### Permissions
Permissions are managed through Directus admin panel. The setup script attempted to set permissions, but manual verification is recommended.

## 🧪 Testing Checklist

### 1. Start the Development Server
```bash
cd web
npm run dev
```

### 2. Test Student Registration
1. Navigate to: `https://pozi.com.na/auth/register`
2. Select "Student" as user type
3. Fill in basic information:
   - First Name
   - Last Name
   - Email
   - Password (min 8 characters)
   - Confirm Password
4. Fill in "Person Responsible for Rent Details":
   - Name
   - Surname
   - Relationship to tenant
   - Email Address
   - ID Number
   - Cell
   - Occupation
5. Upload required documents (PDF format, max 5MB each):
   - ID Number Certified Copy
   - Payslip
   - 6 Months Bank Statement
6. Check "I agree to terms"
7. Click "Create account"

### 3. Test Landlord Registration
1. Navigate to: `https://pozi.com.na/auth/register`
2. Select "Landlord / Property Owner" as user type
3. Fill in basic information only (no additional fields should appear)
4. Check "I agree to terms"
5. Click "Create account"

### 4. Verify Data in Directus
1. Go to: `https://app.pozi.com.na/admin`
2. Navigate to: Content → Users
3. Find the newly created user
4. Verify all fields are populated correctly:
   - Basic fields (email, first_name, last_name)
   - Student-specific fields (if student)
   - File attachments (if student)

## 🔐 Permission Verification

### Required Permissions in Directus

#### For User Creation (Admin/System)
- **Collection**: `directus_users`
- **Action**: `create`
- **Fields**: `*` (all fields)
- **Role**: Admin (null role)

#### For File Uploads
- **Collection**: `directus_files`
- **Action**: `create`
- **Fields**: `*` (all fields)
- **Role**: Admin (null role)

#### For Users to Read Their Own Data
- **Collection**: `directus_users`
- **Action**: `read`
- **Fields**: `*` (all fields)
- **Role**: Student, Property Owner, etc.
- **Permissions Filter**: `{ id: { _eq: "$CURRENT_USER" } }`

### Manual Permission Setup
If permissions need adjustment:
1. Go to: `https://app.pozi.com.na/admin`
2. Navigate to: Settings → Roles & Permissions
3. Select the role (Student, Property Owner, etc.)
4. Find `directus_users` collection
5. Ensure:
   - **Read**: Allowed with filter `id = $CURRENT_USER`
   - **Update**: Allowed with filter `id = $CURRENT_USER`
   - **Create**: Not needed (users can't create other users)

## 🐛 Troubleshooting

### Issue: Fields not showing in registration form
**Solution**: Run `node setup-student-fields.js` to create missing fields

### Issue: File upload fails
**Check**:
1. File is PDF format
2. File size < 5MB
3. Directus admin token is configured
4. Files collection has create permissions

### Issue: User creation fails with 422 error
**Check**:
1. All required fields are filled
2. Email is unique
3. Password meets requirements (min 8 characters)
4. File IDs are valid UUIDs

### Issue: Student fields not saving
**Check**:
1. Fields exist in Directus (run test script)
2. User type is "student"
3. API is receiving the data (check server logs)
4. Directus permissions allow creating users with these fields

## 📝 Notes

- File uploads happen **before** user creation
- Files are uploaded to Directus using admin token
- User is created with status `unverified` initially
- Email verification is required to activate account
- All student-specific fields are optional in schema but required in form validation

## ✅ Ready to Go!

The registration system is fully implemented and ready for testing. All fields exist in Directus, API endpoints are configured, and the UI is modern and functional.

**Next Steps**:
1. Start the dev server: `npm run dev`
2. Test registration at: `https://pozi.com.na/auth/register`
3. Verify data in Directus admin panel
4. Check email verification flow













