#!/bin/bash

# CutQ Android App - Build and Run Script

echo "🚀 CutQ Android App Builder"
echo "============================"
echo ""

# Check if Android Studio is installed
if ! command -v studio &> /dev/null && ! [ -d "/Applications/Android Studio.app" ]; then
    echo "⚠️  Android Studio not found. Please install Android Studio first."
    echo "   Download from: https://developer.android.com/studio"
    exit 1
fi

# Menu
echo "Select an option:"
echo "1. Open in Android Studio (Recommended)"
echo "2. Build Debug APK"
echo "3. Build Release APK (requires keystore)"
echo "4. Sync Capacitor"
echo "5. Install on connected device"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "📱 Opening Android project in Android Studio..."
        npm run open:android
        ;;
    2)
        echo "🔨 Building Debug APK..."
        cd android
        ./gradlew assembleDebug
        echo ""
        echo "✅ Debug APK built successfully!"
        echo "📦 Location: android/app/build/outputs/apk/debug/app-debug.apk"
        ;;
    3)
        echo "🔨 Building Release APK..."
        cd android
        ./gradlew assembleRelease
        echo ""
        echo "✅ Release APK built successfully!"
        echo "📦 Location: android/app/build/outputs/apk/release/app-release.apk"
        ;;
    4)
        echo "🔄 Syncing Capacitor..."
        npm run sync
        echo "✅ Sync complete!"
        ;;
    5)
        echo "📲 Installing on connected device..."
        cd android
        ./gradlew installDebug
        echo "✅ App installed successfully!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✨ Done!"

