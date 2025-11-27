# Lease Agreement Setup Guide

## Overview
The lease agreement feature allows property owners to upload a PDF lease agreement document (max 5MB) to each property. The system automatically handles file upload, replacement, and deletion.

## Directus Setup Required

### ✅ **No New Collections Needed**
- Directus already has a built-in `directus_files` collection for storing files
- We only need to add **one field** to the existing `properties` collection

### 📋 **Required Field in Properties Collection**

You need to add a `lease_agreement` field to your properties collection:

#### **Field Configuration:**
- **Field Name**: `lease_agreement`
- **Field Type**: `File` (not "Files" - single file only)
- **Allow multiple files**: `No` (single PDF only)
- **Required**: `No` (optional field)
- **Description**: "PDF lease agreement document (max 5MB)"

### 🔐 **Permissions Required**

Landlords must be able to upload/delete files and update their own properties without relying on the admin token. In Directus:

1. Go to **Settings → Access Control → Landlord role**
2. Under **Collections → Properties**:
   - Allow **read** for all items needed by landlords
   - Allow **update** with a filter of `owner` = `$CURRENT_ROLE` (or equivalent condition) so they can edit only their properties
   - Ensure the `lease_agreement` field is included in the allowed fields
3. Under **Collections → Files (directus_files)**:
   - Allow **create** (for uploads)
   - Allow **delete** and **read** (so they can replace/remove their own documents)
4. Save the role

Once these permissions are in place, the API routes can use the landlord's own Directus token for uploads/updates, keeping the system secure without admin credentials.

## Step-by-Step Setup Instructions

### 1. **Access Directus Admin Panel**
- Go to: https://app.pozi.com.na/admin
- Login with your admin credentials

### 2. **Navigate to Properties Collection**
- Click on **"Settings"** in the sidebar
- Click on **"Data Model"**
- Find and click on **"Properties"** collection

### 3. **Add Lease Agreement Field**
1. Click the **"Create Field"** or **"+"** button
2. **Field Name**: Enter `lease_agreement` (exactly as shown, lowercase with underscore)
3. **Field Type**: Select **"File"** (not "Files")
4. **Interface**: Select **"File"** or **"File Image"** (File is fine for PDFs)
5. Click **"Save"**

### 4. **Configure Field Settings**
After creating the field, configure these settings:

- **Allow multiple files**: Make sure this is set to **"No"** (single file only)
- **Required**: Set to **"No"** (optional field)
- **File types**: You can optionally restrict to PDFs only:
  - Go to field settings
  - Under "Validation" or "File Options"
  - Set allowed file types to: `application/pdf`
- **Description**: Add "PDF lease agreement document (max 5MB)" for reference

### 5. **Verify Field Creation**
1. Go to **"Content"** → **"Properties"**
2. Edit any property
3. You should see a new **"Lease Agreement"** field
4. The field should allow uploading a single file

## Field Structure

### **In Directus:**
```
Properties Collection
├── id
├── title
├── description
├── featured_image (File)
├── image_1 (File)
├── image_2 (File)
├── image_3 (File)
├── image_4 (File)
├── lease_agreement (File) ← NEW FIELD
└── ... other fields
```

### **In API Response:**
```json
{
  "id": 1,
  "title": "Property Title",
  "lease_agreement": {
    "id": "file-uuid-123",
    "filename_download": "lease-agreement.pdf"
  },
  // ... other fields
}
```

## Features

### ✅ **Upload Lease Agreement**
- Property owners can upload a PDF lease agreement
- Maximum file size: **5MB**
- File type validation: Only PDF files accepted
- Automatic error message if file is too large (suggests compression)

### ✅ **Replace Lease Agreement**
- When uploading a new lease agreement, the old one is automatically deleted
- No manual cleanup needed
- Old file is removed from Directus storage

### ✅ **Delete Lease Agreement**
- Property owners can delete the lease agreement
- Confirmation dialog prevents accidental deletion
- File is removed from both property record and Directus storage

### ✅ **View/Download Lease Agreement**
- Property owners can view/download the PDF
- Opens in new tab for viewing
- Direct download link available

### ✅ **Automatic Cleanup**
- When a property is deleted, the lease agreement is also automatically deleted
- No orphaned files left in storage

## API Endpoints

### **Upload Lease Agreement**
```
POST /api/properties/[id]/lease-agreement
Content-Type: multipart/form-data
Body: FormData with 'file' field
```

### **Delete Lease Agreement**
```
DELETE /api/properties/[id]/lease-agreement
```

### **Download Lease Agreement**
```
GET /api/files/[file-id]
```

## Testing

### **Test Upload:**
1. Go to any property edit page
2. Scroll to "Lease Agreement" section
3. Click to upload a PDF file
4. Verify file appears after upload
5. Check that old file is deleted if replacing

### **Test Download:**
1. Go to property view page
2. Check sidebar for "Lease Agreement" card
3. Click "Download" button
4. Verify PDF opens/downloads correctly

### **Test Delete:**
1. Go to property edit page
2. Click "Delete" on lease agreement
3. Confirm deletion
4. Verify file is removed

### **Test File Size Validation:**
1. Try uploading a PDF larger than 5MB
2. Verify error message appears
3. Error should suggest compressing the file

## Troubleshooting

### **Lease Agreement Field Not Showing**
1. Verify field exists in Directus Data Model
2. Check field name is exactly `lease_agreement` (lowercase, underscore)
3. Ensure field type is "File" (not "Files")
4. Check field permissions in Directus

### **Upload Fails**
1. Check file size is under 5MB
2. Verify file is a PDF (not other format)
3. Check browser console for error messages
4. Verify user has permission to edit properties

### **File Not Downloading**
1. Check `/api/files/[id]` route is accessible
2. Verify file ID is correct
3. Check Directus file permissions
4. Verify admin token is configured correctly

### **Old File Not Deleted**
1. Check server logs for deletion errors
2. Verify admin token has delete permissions
3. Check Directus file storage permissions

## File Size Recommendations

### **Compressing PDFs:**
If a PDF is larger than 5MB, users can compress it using:
- **Online tools**: SmallPDF, ILovePDF, PDF24
- **Adobe Acrobat**: File → Reduce File Size
- **Command line**: `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=compressed.pdf original.pdf`

### **Typical Lease Agreement Sizes:**
- **Uncompressed**: 2-10MB
- **Compressed**: 500KB - 2MB
- **Recommended**: Keep under 2MB for best performance

## Security Notes

- ✅ Only property owners can upload/delete their own lease agreements
- ✅ Ownership is verified before any file operations
- ✅ Files are stored securely in Directus
- ✅ Download requires authentication via proxy route
- ✅ File type validation prevents malicious uploads

## Next Steps

1. ✅ Add `lease_agreement` field to Properties collection in Directus
2. ✅ Test upload functionality
3. ✅ Test download functionality
4. ✅ Test delete functionality
5. ✅ Test file size validation
6. ✅ Verify automatic cleanup on property deletion

Once the field is added, the lease agreement feature will be fully functional! 🎉

