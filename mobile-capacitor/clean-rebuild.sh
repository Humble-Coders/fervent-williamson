#!/bin/bash

# CutQ Android App - Clean and Rebuild Script

echo "🧹 CutQ Android App - Clean & Rebuild"
echo "======================================"
echo ""

# Set JAVA_HOME for Mac
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home

echo "✅ JAVA_HOME set to: $JAVA_HOME"
echo ""

# Sync Capacitor
echo "🔄 Step 1: Syncing Capacitor..."
npx cap sync android
echo ""

# Clean build
echo "🧹 Step 2: Cleaning build..."
cd android
./gradlew clean
cd ..
echo ""

# Uninstall old app from device (if connected)
echo "📱 Step 3: Uninstalling old app from device (if connected)..."
cd android
./gradlew uninstallAll 2>/dev/null || echo "No device connected or app not installed"
cd ..
echo ""

echo "✅ Clean complete!"
echo ""
echo "📱 Next steps:"
echo "1. Open Android Studio: npm run open:android"
echo "2. Click 'Sync Project with Gradle Files' (elephant icon)"
echo "3. Build → Rebuild Project"
echo "4. Run the app"
echo ""
echo "Or build directly:"
echo "cd android && ./gradlew assembleDebug"
echo ""

