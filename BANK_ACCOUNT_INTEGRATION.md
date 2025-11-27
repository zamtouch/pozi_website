# Bank Account Information Integration

## Implementation Summary

Bank account information has been integrated into the **profile completion flow** (not registration) to ensure students provide this information before applying for properties.

## ✅ What Was Implemented

### 1. Profile Completion Check Updated
- Added `account_number` and `bank_id` as **required fields** for profile completion
- Students must provide these before their profile is considered 100% complete
- Profile completion percentage now includes bank account fields

### 2. Complete Profile Page Enhanced
- Added "Bank Account Information" section with:
  - **Bank Account Number** (required)
  - **Bank** dropdown (required) - All Namibia banks listed
  - **Account Type** (optional) - Current/Savings/Transmission
  - **ID Number** (optional) - For mandate
  - **ID Type** (optional) - RSA ID/Passport/Temp ID/Business

### 3. Automatic Redirect Flow
- When students log in, profile completion is checked
- If bank account info is missing, they're redirected to `/student/complete-profile`
- They cannot access the dashboard until profile is complete
- They cannot apply for properties until profile is complete

## 🔄 User Flow

1. **Student registers** → Account created (no bank info required yet)
2. **Student logs in** → Profile completion checked
3. **If incomplete** → Redirected to complete profile page
4. **Student fills bank account info** → Profile becomes 100% complete
5. **Student can now** → Access dashboard and apply for properties
6. **When application approved** → Collexia mandate automatically created

## 📋 Fields Added to Directus

All fields were automatically created via `setup-collexia-fields.js`:

### In `directus_users` collection:
- ✅ `account_number` (String)
- ✅ `bank_id` (Integer) - Dropdown with bank options
- ✅ `account_type` (Integer) - Dropdown: 1=Current, 2=Savings, 3=Transmission
- ✅ `id_number` (String)
- ✅ `id_type` (Integer) - Dropdown: 1=RSA ID, 2=Passport, 3=Temp ID, 4=Business

### In `applications` collection:
- ✅ `collexia_contract_reference` (String) - Auto-populated when mandate is registered

## 🎯 Why This Approach?

### ✅ Advantages:
1. **Non-intrusive registration** - Doesn't make signup longer
2. **Follows existing pattern** - Uses the same profile completion flow
3. **Clear user journey** - Students know what's missing
4. **Required when needed** - Bank info only needed when applying
5. **Automatic validation** - Can't apply without complete profile

### ❌ Why Not Registration?
- Registration form is already long (responsible person fields)
- Bank info might not be available immediately
- Better UX to collect it when needed
- Follows progressive disclosure principle

## 🔍 Testing Checklist

1. ✅ Register a new student account
2. ✅ Log in as student
3. ✅ Should be redirected to complete profile page
4. ✅ Fill in bank account information
5. ✅ Submit profile
6. ✅ Should be redirected to dashboard
7. ✅ Profile completion should show 100%
8. ✅ Can now apply for properties
9. ✅ When application approved, Collexia mandate should be created automatically

## 📝 Notes

- Bank account fields are **required for profile completion** but **optional in Directus** (nullable)
- This allows existing users to continue using the system
- New students will be prompted to complete their profile including bank info
- The system gracefully handles missing bank info during Collexia integration (logs warning, doesn't fail approval)

