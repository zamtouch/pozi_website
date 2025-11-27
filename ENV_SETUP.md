# Environment Variables Setup Guide

This guide will help you configure all environment variables for the Pozi Student Living authentication system.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

1. **Create .env.local file and fetch roles in one step:**
   ```powershell
   node create-env-file.js YOUR_DIRECTUS_ADMIN_TOKEN
   ```

2. **Or create the file first, then fetch roles:**
   ```powershell
   # Step 1: Create .env.local
   node create-env-file.js
   
   # Step 2: Fetch and set role IDs
   node setup-roles.js YOUR_DIRECTUS_ADMIN_TOKEN
   ```

### Option 2: Manual Setup

1. The `.env.local` file has been created with all required variables
2. Open `.env.local` and fill in your credentials (see sections below)

## 📋 Required Credentials

### 1. Directus Configuration

**DIRECTUS_TOKEN / DIRECTUS_ADMIN_TOKEN**
- Get from: Directus Admin Panel → Settings → Access Tokens → Create Token
- Select "Admin" role
- Copy the token and paste it in `.env.local`

**NEXT_PUBLIC_DIRECTUS_URL**
- Already set to: `https://app.pozi.com.na`
- Change if your Directus instance is different

### 2. SendGrid Email Configuration

**SENDGRID_API_KEY**
- Get from: https://app.sendgrid.com/settings/api_keys
- Create a new API key with "Mail Send" permissions
- Copy and paste in `.env.local`

**SENDGRID_TEMPLATE_ID**
- Create a dynamic template in SendGrid for email verification
- Template should include variables: `{{first_name}}` and `{{link}}`
- Copy the template ID (format: `d-xxxxxxxxxxxxx`)

**SENDGRID_PASSWORD_RESET_TEMPLATE_ID**
- Create a dynamic template in SendGrid for password reset
- Template should include variables: `{{first_name}}` and `{{link}}`
- Copy the template ID (format: `d-xxxxxxxxxxxxx`)

**SENDGRID_FROM_EMAIL & SENDGRID_FROM_NAME**
- Already set to: `no-reply@pozi.com` and `Pozi Student Living`
- Update if needed

### 3. Role IDs

**STUDENT_ROLE_ID & LANDLORD_ROLE_ID**
- **Easiest way**: Run `node setup-roles.js YOUR_ADMIN_TOKEN`
- **Manual way**: 
  1. Go to Directus Admin Panel → Settings → Roles & Permissions
  2. Find or create "Student" role
  3. Find or create "Property Owner" or "Landlord" role
  4. Copy the UUID for each role
  5. Paste in `.env.local`

**DEFAULT_ROLE_ID**
- Usually the same as `STUDENT_ROLE_ID`
- Will be set automatically by the setup script

### 4. Token Configuration (Optional)

These have sensible defaults but can be customized:

- **TOKEN_HASH_SECRET**: Change this to a strong random string in production
- **TOKEN_EXPIRY_MINUTES**: Default is 1440 (24 hours)

## ✅ Verification

After setting up your `.env.local` file, verify it's working:

1. **Check Directus connection:**
   ```powershell
   node setup-roles.js YOUR_ADMIN_TOKEN
   ```
   This should successfully fetch roles from Directus.

2. **Test the application:**
   ```powershell
   npm run dev
   ```
   Visit `http://localhost:3000/auth/register` and try creating an account.

## 🔒 Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Change `TOKEN_HASH_SECRET`** - Use a strong random string in production
3. **Keep tokens secure** - Don't share your Directus admin token
4. **Use different tokens for production** - Don't use dev tokens in production

## 📝 Example .env.local Structure

```env
# Directus
NEXT_PUBLIC_DIRECTUS_URL=https://app.pozi.com.na
DIRECTUS_TOKEN=abc123xyz...
DIRECTUS_ADMIN_TOKEN=abc123xyz...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SendGrid
SENDGRID_API_KEY=SG.abc123...
SENDGRID_FROM_EMAIL=no-reply@pozi.com
SENDGRID_FROM_NAME=Pozi Student Living
SENDGRID_TEMPLATE_ID=d-abc123...
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=d-xyz789...

# Roles
STUDENT_ROLE_ID=8c6d96e1-6299-4e02-ab5c-daa77297aad3
LANDLORD_ROLE_ID=6124e6d0-f5c8-4f8a-80f2-8f748ff7e585
DEFAULT_ROLE_ID=8c6d96e1-6299-4e02-ab5c-daa77297aad3

# Token Config
TOKEN_HASH_SECRET=your-strong-random-secret-here
```

## 🐛 Troubleshooting

### "Role IDs not configured" error
- Run `node setup-roles.js YOUR_ADMIN_TOKEN` to fetch role IDs
- Or manually add them to `.env.local`

### "DIRECTUS_TOKEN not set" error
- Make sure `.env.local` exists in the project root
- Check that `DIRECTUS_TOKEN` is set in `.env.local`
- Restart your dev server after updating `.env.local`

### SendGrid errors
- Verify `SENDGRID_API_KEY` is correct
- Check template IDs are correct (format: `d-xxxxxxxxxxxxx`)
- Ensure SendGrid account has sending permissions

## 📚 Related Files

- `setup-roles.js` - Fetches roles from Directus and updates `.env.local`
- `create-env-file.js` - Creates `.env.local` with all required variables
- `src/lib/config.ts` - Reads environment variables
- `AUTH_SETUP.md` - Complete authentication setup guide

