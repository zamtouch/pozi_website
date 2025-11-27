# Property Images Setup Guide

## Current Status
- ✅ **37 files** available in your Directus system
- ❌ **Property photos** are currently `null` for both properties
- ✅ **Image handling code** is ready and will work once photos are added

## How Property Images Work

### 1. **Data Flow**
```
Directus CMS → photos field → PropertyCard component → Image display
```

### 2. **Current Implementation**
- **Photos Field**: Stores array of file IDs from Directus
- **Image URL**: Constructed using `getImageUrl()` function
- **Fallback**: Uses `/placeholder-property.svg` when no photos available
- **Error Handling**: Falls back to placeholder if image fails to load

### 3. **Image URL Construction**
```javascript
const mainPhoto = normalizedPhotos[0] ? getImageUrl(normalizedPhotos[0]) : '/placeholder-property.svg';
```

The `getImageUrl()` function creates URLs like:
`https://app.pozi.com.na/assets/{file-id}`

## Steps to Add Property Images

### Option 1: Via Directus Admin Panel (Recommended)

1. **Go to Directus Admin Panel**
   - URL: https://app.pozi.com.na/admin
   - Login with your credentials

2. **Navigate to Properties**
   - Go to "Content" → "Properties"
   - Click on a property to edit it

3. **Upload Images**
   - Find the "photos" field
   - Upload property images (JPG, PNG, WebP recommended)
   - The field should allow multiple files
   - Save the property

4. **Verify Setup**
   - Check that the photos field now contains file IDs
   - Test the property card display

### Option 2: Check Photos Field Configuration

If the photos field isn't working properly:

1. **Go to Data Model**
   - Settings → Data Model → Properties collection

2. **Check Photos Field**
   - Field name: `photos`
   - Field type: `Files` or `M2A` (Many-to-Any)
   - Allow multiple files: Yes
   - File types: Images only (optional)

3. **Update Field if Needed**
   - Change field type to "Files"
   - Enable multiple files
   - Set allowed file types to images

## Testing Images

### 1. **Check Console Logs**
The PropertyCard component now logs photo information:
```
Property 1 photos: [file-id-1, file-id-2] Normalized: [file-id-1, file-id-2] Main photo URL: https://app.pozi.com.na/assets/file-id-1
```

### 2. **Test Image URLs**
You can test image URLs directly:
```
https://app.pozi.com.na/assets/{file-id}
```

### 3. **Verify Display**
- Property cards should show actual images instead of placeholders
- Images should have hover zoom effect
- Fallback to placeholder if image fails

## Troubleshooting

### Images Not Showing
1. Check that photos field contains file IDs (not null)
2. Verify file IDs exist in Directus files collection
3. Check browser console for image loading errors
4. Test image URLs directly in browser

### Permission Issues
1. Ensure files are publicly accessible
2. Check Directus file permissions
3. Verify API access to files

### Performance
1. Use optimized image formats (WebP, AVIF)
2. Consider image compression
3. Implement lazy loading for multiple images

## Expected Result

After adding images:
- Property cards will display actual property photos
- Images will have smooth hover effects
- Fallback system will handle missing/broken images
- Console will show proper image URLs and data






