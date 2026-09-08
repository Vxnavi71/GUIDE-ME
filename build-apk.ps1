# GUIDE ME - Automated APK Build Script for Windows
# Packages the React frontend with Capacitor into a standalone Android APK

param (
    [switch]$Release = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         GUIDE ME - Android APK Build Pipeline            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Locate Java (Android Studio JBR or JAVA_HOME)
$jbrPaths = @(
    "C:\Program Files\Android\Android Studio\jbr",
    "$env:ProgramFiles\Android\Android Studio\jbr",
    "$env:JAVA_HOME"
)
$effectiveJava = $null
foreach ($p in $jbrPaths) {
    if ($p -and (Test-Path "$p\bin\java.exe")) {
        $effectiveJava = $p
        break
    }
}

if (-not $effectiveJava) {
    Write-Error "Could not find a valid Java Runtime. Please ensure Android Studio JBR is installed."
}

$env:JAVA_HOME = $effectiveJava
Write-Host "[+] Using Java runtime from: $env:JAVA_HOME" -ForegroundColor Green

# 2. Locate Android SDK
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Users\ASUS\AppData\Local\Android\Sdk",
    "$env:ANDROID_HOME",
    "$env:ANDROID_SDK_ROOT"
)
$effectiveSdk = $null
foreach ($s in $sdkPaths) {
    if ($s -and (Test-Path "$s\platforms")) {
        $effectiveSdk = $s
        break
    }
}

if (-not $effectiveSdk) {
    Write-Error "Could not find a valid Android SDK. Please ensure Android SDK is installed."
}

$env:ANDROID_HOME = $effectiveSdk
$env:ANDROID_SDK_ROOT = $effectiveSdk
Write-Host "[+] Using Android SDK from: $env:ANDROID_HOME" -ForegroundColor Green

# 3. Build Web Bundle
$rootDir = $PSScriptRoot
$frontendDir = Join-Path $rootDir "frontend"
$androidDir = Join-Path $frontendDir "android"

Write-Host "`n[+] Step 1/3: Compiling React Vite production bundle..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    npm run build
} finally {
    Pop-Location
}

# 4. Sync Capacitor Web Assets to Android
Write-Host "`n[+] Step 2/3: Syncing web assets to native Android project..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    npx cap sync android
} finally {
    Pop-Location
}

# 5. Compile Android APK with Gradle
Write-Host "`n[+] Step 3/3: Building Android APK with Gradle..." -ForegroundColor Yellow
Push-Location $androidDir
try {
    $gradleTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }
    .\gradlew.bat $gradleTask
} finally {
    Pop-Location
}

# 6. Locate and Copy Output APK
$apkRelativePath = if ($Release) {
    "app\build\outputs\apk\release\app-release-unsigned.apk"
} else {
    "app\build\outputs\apk\debug\app-debug.apk"
}

$sourceApk = Join-Path $androidDir $apkRelativePath
$destApk = Join-Path $rootDir "GuideMe-v1.0.apk"

if (Test-Path $sourceApk) {
    Copy-Item -Path $sourceApk -Destination $destApk -Force
    $fileSizeMb = [math]::Round(((Get-Item $destApk).Length / 1MB), 2)
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host " BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host " Generated APK: $destApk ($fileSizeMb MB)" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green

    Write-Host "`n[+] Cloud Backend & Device Sharing:" -ForegroundColor Cyan
    Write-Host " • Pre-configured Production Backend: https://guide-me-kja5.onrender.com/api/v1" -ForegroundColor Yellow
    Write-Host " • Cloud Database: Neon.tech PostgreSQL (eu-central-1)" -ForegroundColor Yellow
    Write-Host " • Completely standalone: No PC, localhost, or Wi-Fi pairing required!" -ForegroundColor Green
    Write-Host "`n[+] How to share and install:" -ForegroundColor Cyan
    Write-Host " 1. Send 'GuideMe-v1.0.apk' to any Android phone (WhatsApp, Google Drive, Bluetooth, or USB)."
    Write-Host " 2. Tap the APK to install on your phone (enable 'Install unknown apps' if prompted)."
    Write-Host " 3. Launch GuideMe - register or log in and start using it immediately!"
} else {
    Write-Error "Failed to find built APK at: $sourceApk"
}
