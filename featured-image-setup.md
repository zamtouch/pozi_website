# Featured Image Setup Guide

## New Image Structure

### 🎯 **Property Card Images**
- **Main Image**: Uses `featured_image` field (single file)
- **Fallback**: Uses first image from `photos` array
- **Final Fallback**: Uses placeholder image

### 🖼️ **Property Detail Page Images**
- **Gallery**: Uses `featured_image` + all images from `photos` array
- **Order**: Featured image first, then additional photos
- **Deduplication**: Avoids showing the same image twice

## Required Directus Setup

### 1. **Add Featured Image Field**
You need to add a `featured_image` field to your properties collection:

1. **Go to Directus Admin Panel**
   - URL: https://app.pozi.com.na/admin
   - Navigate to: Settings → Data Model → Properties collection

2. **Create Featured Image Field**
   - Field Name: `featured_image`
   - Field Type: `File`
   - Allow multiple files: No (single image only)
   - File types: Images only (optional)

### 2. **Configure Photos Field**
Ensure the `photos` field is properly configured:

- Field Name: `photos`
- Field Type: `Files` or `M2A` (Many-to-Any)
- Allow multiple files: Yes
- File types: Images only (optional)

## Data Structure

### **Property Object Structure**
```json
{
  "id": 1,
  "title": "Property Title",
  "featured_image": "file-id-123", // Main image for property card
  "photos": ["file-id-456", "file-id-789", "file-id-101"], // Additional images for gallery
  // ... other fields
}
```

### **Image URL Construction**
- Featured Image: `https://app.pozi.com.na/assets/{featured_image}`
- Photo Gallery: `https://app.pozi.com.na/assets/{photo-id}`

## Implementation Details

### **PropertyCard Component**
```javascript
// Priority order for main image:
1. featured_image (if exists)
2. photos[0] (if exists)
3. placeholder image
```

### **Property Detail Page**
```javascript
// All images for gallery:
1. featured_image (first)
2. photos[0], photos[1], photos[2], etc. (additional)
3. No duplicates
```

## Steps to Add Images

### **For Each Property:**

1. **Upload Featured Image**
   - Go to Content → Properties
   - Edit the property
   - Upload main image to `featured_image` field
   - This will be the main image shown on property cards

2. **Upload Additional Photos**
   - Add more images to `photos` field
   - These will be shown in the property detail page gallery
   - Can be 1, 2, 3, 4+ images as needed

3. **Save Property**
   - Save the property
   - Images will automatically appear on the website

## Expected Results

### **Property Cards**
- Show the featured image as the main background
- Smooth hover effects
- Fallback to placeholder if no images

### **Property Detail Pages**
- Featured image as the main/hero image
- Gallery with all additional photos
- Image carousel or grid layout

### **Console Logs**
```
Property 1 - Featured Image: file-id-123 Photos: ["file-id-456", "file-id-789"] Main Photo URL: https://app.pozi.com.na/assets/file-id-123
```

## Benefits of This Structure

1. **Clear Separation**: Featured image for cards, photos for detail pages
2. **Performance**: Only loads featured image for property cards
3. **Flexibility**: Can have different images for cards vs detail pages
4. **Fallback System**: Graceful degradation if images are missing
5. **No Duplicates**: Smart deduplication in gallery

## Troubleshooting

### **Images Not Showing**
1. Check that `featured_image` field exists in Directus
2. Verify images are uploaded to the correct fields
3. Check browser console for image URLs
4. Test image URLs directly in browser

### **Wrong Image Showing**
1. Verify `featured_image` is set (not null)
2. Check that photos array contains correct file IDs
3. Clear browser cache
4. Check console logs for image priority

### **Performance Issues**
1. Optimize image sizes before uploading
2. Use WebP or AVIF formats
3. Consider lazy loading for gallery images
4. Implement image compression






