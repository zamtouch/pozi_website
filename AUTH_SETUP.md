# Authentication System Setup Guide

This guide will help you set up the authentication system for Pozi Student Living.

## 📋 Prerequisites

1. A Directus instance with the following:
   - `users` collection (built-in Directus collection)
   - `verification_tokens` collection (custom collection - see below)
   - User roles configured (Student and Landlord roles)

2. A SendGrid account (for email functionality)

## 🔧 Environment Variables Setup

Create a `.env.local` file in the root of your project with the following variables:

```env
# Directus Configuration (Required)
NEXT_PUBLIC_DIRECTUS_URL=https://your-directus-instance.com
DIRECTUS_TOKEN=your-admin-static-token
# Alternative name for admin token (for compatibility)
DIRECTUS_ADMIN_TOKEN=your-admin-static-token

# Application URLs
NEXT_PUBLIC_APP_URL=https://pozi.com.na
PUBLIC_APP_URL=https://pozi.com.na

# SendGrid Email Configuration (Required for email features)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=no-reply@pozi.com
SENDGRID_FROM_NAME=Pozi Student Living
SENDGRID_TEMPLATE_ID=d-your-verification-template-id
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=d-your-reset-template-id

# Token Configuration (Optional - has defaults)
TOKEN_BYTES=32
TOKEN_HASH_ALGO=sha256
TOKEN_HASH_SECRET=CHANGE_THIS_PEPPER_SECRET
TOKEN_EXPIRY_MINUTES=1440

# Role IDs (Required - get these from your Directus instance)
STUDENT_ROLE_ID=your-student-role-id
LANDLORD_ROLE_ID=your-landlord-role-id
DEFAULT_ROLE_ID=your-default-role-id
```

## 📦 Directus Collections Setup

### 1. `verification_tokens` Collection

Create a custom collection in Directus with the following fields:

- `id` (UUID, Primary Key)
- `user` (UUID, Relationship to `users` collection)
- `token_hash` (String) - Hashed token value
- `purpose` (String) - Enum: `email_verify` or `password_reset`
- `expires_at` (DateTime)
- `used` (Boolean, Default: `false`)
- `used_at` (DateTime, Nullable)

### 2. `users` Collection

Ensure your Directus `users` collection has:
- `token` field (String) - For storing static tokens
- `status` field (Enum: `active`, `inactive`, `unverified`)

## 🎭 User Roles Setup

1. **Student Role**: Create a role for students in Directus
2. **Landlord Role**: Create a role for landlords/property owners in Directus

After creating the roles, copy their UUIDs and add them to your `.env.local` file:
- `STUDENT_ROLE_ID`
- `LANDLORD_ROLE_ID`

## 📧 SendGrid Setup

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key with "Mail Send" permissions
3. Create two dynamic templates:
   - **Verification Email Template**: Should include `{{first_name}}` and `{{link}}` variables
   - **Password Reset Email Template**: Should include `{{first_name}}` and `{{link}}` variables
4. Copy the template IDs (format: `d-xxxxxxxxxxxxx`) to your `.env.local` file

## 🚀 Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your `.env.local` file (see above)

3. Start the development server:
```bash
npm run dev
```

## ✅ Testing the Authentication Flow

1. **Signup Flow**:
   - Navigate to `/auth/register`
   - Fill in the form and select "Student" or "Landlord"
   - Submit the form
   - Check your email for verification link (or check console in dev mode)

2. **Email Verification**:
   - Click the verification link in your email
   - You should be redirected to `/auth/verify?success=true`

3. **Login Flow**:
   - Navigate to `/auth/login`
   - Enter your credentials
   - You should be redirected based on your role:
     - Students → `/student/dashboard`
     - Landlords → `/landlord/dashboard`
     - Admins → `/admin/dashboard`

4. **Password Reset Flow**:
   - Navigate to `/auth/forgot-password`
   - Enter your email
   - Check your email for reset link
   - Use the link to reset your password

## 🔒 Security Notes

1. **Change `TOKEN_HASH_SECRET`**: Use a strong, random secret in production
2. **Use HTTPS**: Always use HTTPS in production
3. **Environment Variables**: Never commit `.env.local` to version control
4. **Directus Token**: Keep your admin token secure and rotate it regularly

## 🐛 Troubleshooting

### Email Not Sending
- Verify `SENDGRID_API_KEY` is set correctly
- Check SendGrid template IDs are correct
- Review server logs for SendGrid errors
- Ensure SendGrid account has sending permissions

### Token Issues
- Ensure `TOKEN_HASH_SECRET` is set (change from default!)
- Verify `verification_tokens` collection exists in Directus
- Check token expiry hasn't passed (default: 24 hours)

### Authentication Fails
- Verify Directus URL and admin token are correct
- Check user status is 'active' (not 'unverified')
- Ensure Directus user has `token` field
- Review API route logs for detailed errors

### Role Issues
- Verify role IDs are correct UUIDs from Directus
- Check that roles exist in Directus
- Ensure role names match expected values (case-insensitive)

## 📚 API Endpoints

All authentication endpoints are under `/api/auth/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create new user account |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/verify` | GET/POST | Verify email with token |
| `/api/auth/validate-token` | POST | Validate stored session token |

## 🎨 Customization

### Role-Based Access

The auth system supports role checking:
- `isStudent` - Check if user is a student
- `isLandlord` - Check if user is a landlord
- `isStaff` - Check if user is staff
- `isAdmin` - Check if user is admin

Example usage:
```tsx
import { useAuth } from '@/lib/auth';

function MyComponent() {
  const { user, isStudent, isLandlord } = useAuth();
  
  if (isStudent) {
    return <StudentDashboard />;
  } else if (isLandlord) {
    return <LandlordDashboard />;
  }
}
```

### Redirect After Login

Update redirect logic in `src/app/auth/login/page.tsx` to customize where users are redirected after login.

## 📝 Notes

- All tokens are hashed before storage using HMAC-SHA256
- Email verification is required before account activation
- Password reset tokens are single-use and expire after 24 hours (configurable)
- Static tokens are stored in localStorage (consider httpOnly cookies for production)

