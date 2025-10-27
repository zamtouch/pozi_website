# PowerShell script to upload properties to Directus
# Make sure to set your Directus API token before running

Write-Host "🚀 Starting Property Upload Process" -ForegroundColor Green

# Check if Directus token is set
if (-not $env:DIRECTUS_TOKEN) {
    Write-Host "❌ DIRECTUS_TOKEN environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set your Directus API token first:" -ForegroundColor Yellow
    Write-Host "`$env:DIRECTUS_TOKEN = 'your_token_here'" -ForegroundColor Cyan
    Write-Host "Or run: set DIRECTUS_TOKEN=your_token_here" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Directus token found" -ForegroundColor Green

# Check if properties file exists
$propertiesFile = "C:\Users\Chitalu\Downloads\properties.json"
if (-not (Test-Path $propertiesFile)) {
    Write-Host "❌ Properties file not found at: $propertiesFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Properties file found" -ForegroundColor Green

# Run the upload script
Write-Host "📤 Starting upload process..." -ForegroundColor Yellow
node upload-properties-batch.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Upload process completed successfully!" -ForegroundColor Green
} else {
    Write-Host "💥 Upload process failed!" -ForegroundColor Red
    Write-Host "Check the upload-results.json file for detailed error information." -ForegroundColor Yellow
}
