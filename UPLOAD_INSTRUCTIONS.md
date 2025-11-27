# Property Upload Scripts

This directory contains scripts to upload properties from the JSON file to your Directus API.

## Prerequisites

1. **Node.js** installed on your system
2. **Directus API Token** - You need to get this from your Directus admin panel
3. **Properties JSON file** at `C:\Users\Chitalu\Downloads\properties.json`

## Getting Your Directus API Token

1. Go to your Directus admin panel: `https://app.pozi.com.na/admin`
2. Log in with your admin credentials
3. Go to Settings → Access Tokens
4. Create a new token with full permissions
5. Copy the token

## Upload Methods

### Method 1: PowerShell Script (Recommended)
```powershell
# Set your Directus token
$env:DIRECTUS_TOKEN = "your_token_here"

# Run the upload script
.\upload-properties.ps1
```

### Method 2: Batch File
```cmd
# Set your Directus token
set DIRECTUS_TOKEN=your_token_here

# Run the upload script
upload-properties.bat
```

### Method 3: Direct Node.js
```cmd
# Set your Directus token
set DIRECTUS_TOKEN=your_token_here

# Run the upload script
node upload-properties-batch.js
```

## Available Scripts

### 1. `upload-properties-batch.js` (Recommended)
- Uploads properties in batches of 5
- Includes data validation and cleaning
- Provides detailed error reporting
- Saves results to `upload-results.json`

### 2. `upload-properties-advanced.js`
- Advanced validation and error handling
- Authentication fallback
- More detailed logging

### 3. `upload-properties.js`
- Simple upload script
- Basic error handling

## What the Scripts Do

1. **Read** the properties JSON file
2. **Validate** each property for required fields
3. **Clean** the data (convert strings to numbers, handle nulls)
4. **Upload** properties to Directus API one by one
5. **Track** successes and failures
6. **Generate** a detailed report

## Expected Data Structure

The scripts expect properties with these fields:
- `title` (required)
- `description` (required)
- `price_per_month` (required)
- `currency` (required)
- `address` (required)
- `rooms_available` (required)
- `total_rooms` (required)
- `university` (required)
- `distance_from_campus` (optional)
- `latitude` (optional)
- `longitude` (optional)
- `amenities` (optional array)
- `featured_image` (optional)
- `image_1`, `image_2`, `image_3`, `image_4` (optional)
- `approved` (boolean)
- `featured` (boolean)

## Error Handling

The scripts will:
- ✅ **Continue** uploading even if some properties fail
- 📝 **Log** all errors with details
- 💾 **Save** detailed results to `upload-results.json`
- ⚠️ **Validate** data before uploading
- 🔄 **Retry** failed uploads (manual)

## Troubleshooting

### Common Issues

1. **"DIRECTUS_TOKEN not set"**
   - Set the environment variable: `set DIRECTUS_TOKEN=your_token`

2. **"Properties file not found"**
   - Make sure the file is at: `C:\Users\Chitalu\Downloads\properties.json`

3. **"Authentication failed"**
   - Check your API token is correct
   - Ensure the token has proper permissions

4. **"Validation errors"**
   - Check the `upload-results.json` file for details
   - Fix the data in your JSON file and re-run

5. **"Network errors"**
   - Check your internet connection
   - Verify the Directus URL is accessible

### Getting Help

1. Check the `upload-results.json` file for detailed error information
2. Look at the console output for specific error messages
3. Verify your Directus API is accessible: `https://app.pozi.com.na`

## Results

After running, you'll get:
- ✅ **Console output** with real-time progress
- 📊 **Summary** of successful/failed uploads
- 💾 **upload-results.json** with detailed results
- 🔍 **Error details** for any failed uploads

## Next Steps

After successful upload:
1. Check your Directus admin panel to see the uploaded properties
2. Verify the properties display correctly in your app
3. Test the university relationships are working
4. Check that images are accessible (if any)
