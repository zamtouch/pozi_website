# Directus Data Updates Needed

## Property 1 Updates Required:

### 1. Update Description
**Current**: "Beautiful 2-bedroom apartment within walking distance of University of Zambia. Fully furnished with modern amenities."

**New**: "Beautiful 2-bedroom apartment within walking distance of University of Zambia. Fully furnished with modern amenities including high-speed Wi-Fi, air conditioning, and secure parking. Perfect for students who want comfort and convenience."

### 2. Set Approved Status
**Current**: `approved: 0`
**New**: `approved: 1` (so it shows on the website)

### 3. Add University Data
**Current**: `university: null`
**New**: Need to create university relationship or add university data

## Property 2 Updates Required:

### 1. Add Amenities
**Current**: `amenities: null`
**New**: Add some amenities like `["wifi", "furnished"]` or similar

## Steps to Update in Directus:

1. **Go to Directus Admin Panel**
2. **Navigate to Content → Properties**
3. **Edit Property 1 (ID: 1)**:
   - Update description to the longer version
   - Set `approved` to `1`
   - Add university relationship if possible
4. **Edit Property 2 (ID: 2)**:
   - Add amenities array with some values

## Alternative: Update via API

You can also update the data programmatically using Directus API calls.

