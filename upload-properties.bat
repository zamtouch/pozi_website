@echo off
echo 🚀 Starting Property Upload Process

REM Check if Directus token is set
if "%DIRECTUS_TOKEN%"=="" (
    echo ❌ DIRECTUS_TOKEN environment variable is not set!
    echo Please set your Directus API token first:
    echo set DIRECTUS_TOKEN=your_token_here
    pause
    exit /b 1
)

echo ✅ Directus token found

REM Check if properties file exists
if not exist "C:\Users\Chitalu\Downloads\properties.json" (
    echo ❌ Properties file not found at: C:\Users\Chitalu\Downloads\properties.json
    pause
    exit /b 1
)

echo ✅ Properties file found

REM Run the upload script
echo 📤 Starting upload process...
node upload-properties-batch.js

if %ERRORLEVEL% equ 0 (
    echo 🎉 Upload process completed successfully!
) else (
    echo 💥 Upload process failed!
    echo Check the upload-results.json file for detailed error information.
)

pause
