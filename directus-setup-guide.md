# Directus CMS Setup Guide for Properties Collection

## Required Fields for Properties Collection

### Basic Property Information
- `id` (Auto-increment, Primary Key)
- `title` (String, Required)
- `description` (Text, Required)
- `price_per_month` (Integer, Required)
- `currency` (String, Default: "ZMW")
- `address` (String, Required)
- `distance_from_campus` (Integer, Optional)
- `rooms_available` (Integer, Required)
- `total_rooms` (Integer, Required)
- `approved` (Boolean, Default: false)
- `featured` (Boolean, Default: false)

### Amenity Fields (Boolean, Default: false)
- `wifi` - Wi-Fi availability
- `furnished` - Furnished property
- `parking` - Parking availability
- `security` - Security features
- `air_conditioning` - Air conditioning
- `study_desk` - Study desk availability

### Media Fields
- `photos` (Files, Multiple files allowed)

### University Relationship
- `university` (Many-to-One relationship to universities collection)

### Timestamps
- `date_created` (DateTime, Auto-generated)
- `date_updated` (DateTime, Auto-generated)

## Step-by-Step Setup Instructions

### 1. Access Directus Admin Panel
- Go to: https://pozi2.omaridigital.com/admin
- Login with your credentials

### 2. Navigate to Data Model
- Click on "Settings" in the sidebar
- Click on "Data Model"
- Find "Properties" collection

### 3. Add Missing Fields
If any of the above fields are missing, add them:

1. Click "Create Field" or "+" button
2. Choose field type (Boolean for amenities, String for text, etc.)
3. Set field name exactly as listed above
4. Configure field settings:
   - **Boolean fields**: Default value = false
   - **String fields**: Set as required if marked
   - **Integer fields**: Set as required if marked
   - **Files field**: Allow multiple files for photos

### 4. Update Existing Properties
For each existing property:
1. Go to "Content" → "Properties"
2. Edit each property
3. Set the amenity toggles to true/false based on what the property offers
4. Ensure `approved` is set to true for properties you want to show
5. Set `featured` to true for properties you want to highlight

### 5. Test the API
Use the test script provided to verify everything is working.

## API Endpoints to Test

- `GET /items/properties` - Get all properties
- `GET /items/properties?filter[approved]=true` - Get approved properties
- `GET /items/properties?filter[featured]=true` - Get featured properties
- `GET /items/properties?filter[wifi]=true` - Get properties with Wi-Fi
- `GET /items/properties?filter[approved]=true&filter[wifi]=true&filter[furnished]=true` - Combined filters

## Troubleshooting

### If properties don't show:
1. Check that `approved` field is set to true
2. Verify all required fields are filled
3. Check browser console for API errors
4. Test API endpoints directly

### If amenities don't display:
1. Ensure boolean amenity fields exist
2. Check that amenity fields are set to true/false (not null)
3. Verify field names match exactly (case-sensitive)

### If images don't load:
1. Check that `photos` field is configured for multiple files
2. Verify images are uploaded to the photos field
3. Check Directus file permissions

