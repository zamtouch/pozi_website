# Email Debugging Guide

## Issue: Account Created But No Email Received

### Possible Causes:

1. **Email is in Spam/Junk Folder**
   - Check your spam/junk folder
   - Check promotions tab (Gmail)
   - Add `sales@zamtouch.co.zm` to your contacts

2. **Email Sending Failed Silently**
   - Check your Next.js dev server console for error messages
   - Look for "SendGrid email sending failed" in the logs
   - The signup still succeeds even if email fails

3. **SendGrid Configuration Issues**
   - API key might be invalid or expired
   - Template ID might be incorrect
   - From email might not be verified in SendGrid

4. **Email Address Issues**
   - Email address might be invalid
   - Email domain might be blocking emails
   - Email provider might be filtering emails

## Debugging Steps:

### 1. Check Server Logs

When you create an account, check your Next.js dev server console. You should see either:
- ✅ `Verification email sent successfully` - Email was sent
- ❌ `SendGrid email sending failed` - Email failed (check error details)

### 2. Test SendGrid Directly

Run the test script:
```powershell
node test-sendgrid.js your-email@example.com
```

This will test if SendGrid is working correctly.

### 3. Check Development Mode

In development mode, the API response includes a `verification_link` field. You can:
- Check the browser console/network tab after signup
- Use that link directly to verify your account
- This works even if email sending fails

### 4. Verify SendGrid Settings

1. Go to: https://app.sendgrid.com
2. Check **Settings → Sender Authentication**
   - Verify `sales@zamtouch.co.zm` is verified
3. Check **Settings → API Keys**
   - Verify your API key has "Mail Send" permissions
4. Check **Email API → Dynamic Templates**
   - Verify template ID `d-c303a652cb1a4ca597a8f5474d97c122` exists
   - Verify template has variables: `{{first_name}}` and `{{link}}`

### 5. Check SendGrid Activity

1. Go to: https://app.sendgrid.com/activity
2. Look for recent email sends
3. Check if emails are being sent but bounced/filtered

## Quick Fixes:

### Fix 1: Use Verification Link from Response

In development, the API returns a `verification_link` in the response. You can:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Create an account
4. Find the `/api/auth/signup` request
5. Check the response for `verification_link`
6. Copy and paste that link in your browser

### Fix 2: Check Email in Spam

- Check spam/junk folder
- Check promotions tab (Gmail)
- Search for "Support Team" or "zamtouch"

### Fix 3: Verify SendGrid From Email

The from email `sales@zamtouch.co.zm` must be verified in SendGrid:
1. Go to SendGrid → Settings → Sender Authentication
2. Verify the domain or single sender
3. If not verified, emails will fail

## Common Error Messages:

### "SENDGRID_TEMPLATE_ID is required"
- **Fix**: Add `SENDGRID_TEMPLATE_ID` to `.env.local`

### "SENDGRID_API_KEY is required"
- **Fix**: Add `SENDGRID_API_KEY` to `.env.local`

### "Authentication failed" (401)
- **Fix**: Check your SendGrid API key is correct

### "Permission denied" (403)
- **Fix**: Check API key has "Mail Send" permissions

### "Bad Request" (400)
- **Fix**: Check template ID is correct and template exists

## Testing:

Run the test script with your email:
```powershell
node test-sendgrid.js your-email@example.com
```

This will send a test email and show any errors.

