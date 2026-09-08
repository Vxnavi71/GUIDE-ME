#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "      GUIDE ME - Android APK Build Pipeline (Git Bash)    "
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$ROOT_DIR/frontend"
ANDROID_DIR="$FRONTEND_DIR/android"

# Locate Java Runtime
if [ -d "C:/Program Files/Android/Android Studio/jbr" ]; then
    export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
elif [ -d "/c/Program Files/Android/Android Studio/jbr" ]; then
    export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
fi

echo "[+] Using JAVA_HOME: $JAVA_HOME"
export PATH="$JAVA_HOME/bin:$PATH"

# Locate Android SDK
if [ -d "C:/Users/ASUS/AppData/Local/Android/Sdk" ]; then
    export ANDROID_HOME="C:/Users/ASUS/AppData/Local/Android/Sdk"
    export ANDROID_SDK_ROOT="C:/Users/ASUS/AppData/Local/Android/Sdk"
fi

echo "[+] Using ANDROID_HOME: $ANDROID_HOME"

# Step 1: Build React/Vite web bundle
echo ""
echo "[+] Step 1/3: Compiling React Vite production bundle..."
cd "$FRONTEND_DIR"
npm run build

# Step 2: Sync web assets to Capacitor Android project
echo ""
echo "[+] Step 2/3: Syncing web assets to native Android project..."
npx cap sync android

# Step 3: Compile Android APK using Gradle
echo ""
echo "[+] Step 3/3: Building Android APK with Gradle..."
cd "$ANDROID_DIR"
cmd.exe /c "gradlew.bat assembleDebug"

# Step 4: Copy output APK to root
SOURCE_APK="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
DEST_APK="$ROOT_DIR/GuideMe-v1.0.apk"

if [ -f "$SOURCE_APK" ]; then
    cp -f "$SOURCE_APK" "$DEST_APK"
    # Also copy to parent workspace root for convenience
    cp -f "$SOURCE_APK" "$ROOT_DIR/../GuideMe-v1.0.apk"
    echo ""
    echo "=========================================================="
    echo " BUILD SUCCESSFUL!"
    echo " Generated APK: $DEST_APK"
    echo " Pre-configured Backend: https://guide-me-kja5.onrender.com/api/v1"
    echo " Database: Neon.tech PostgreSQL (eu-central-1)"
    echo "=========================================================="
else
    echo "[-] Error: Built APK not found at $SOURCE_APK"
    exit 1
fi
