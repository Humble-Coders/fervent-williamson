# CutQ Android App

This is the Android app for CutQ that wraps the web application (www.cutq.store) in a native WebView using Capacitor.

## Prerequisites

- Node.js and npm installed
- Android Studio installed
- Java Development Kit (JDK) 17 or higher
- Android SDK

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add Android platform (already done):
```bash
npm run add:android
```

## Development

### Open in Android Studio
```bash
npm run open:android
```

This will open the Android project in Android Studio where you can:
- Build the app
- Run on emulator or physical device
- Debug the application
- Generate signed APK/AAB for release

### Sync Changes
After making changes to the web assets or configuration:
```bash
npm run sync
```

## Building the App

### In Android Studio:

1. **Run on Emulator/Device:**
   - Click the "Run" button (green play icon)
   - Select your target device/emulator
   - Wait for the build to complete

2. **Generate Debug APK:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK will be in: `android/app/build/outputs/apk/debug/`

3. **Generate Release APK:**
   - Build → Generate Signed Bundle / APK
   - Follow the wizard to create/use a keystore
   - APK will be in: `android/app/build/outputs/apk/release/`

### Via Command Line:

```bash
cd android
./gradlew assembleDebug    # For debug APK
./gradlew assembleRelease  # For release APK (requires signing)
```

## Configuration

The app configuration is in `capacitor.config.json`:

- **appId**: `com.cutq.store` - The unique identifier for the app
- **appName**: `CutQ` - The display name of the app
- **server.url**: `https://www.cutq.store` - The website URL to load

## App Details

- **Package Name**: com.cutq.store
- **App Name**: CutQ
- **Target Website**: https://www.cutq.store
- **Platform**: Android (Capacitor 7.4.4)

## Troubleshooting

### Gradle Sync Issues
If you encounter Gradle sync issues in Android Studio:
1. File → Invalidate Caches / Restart
2. Clean and rebuild the project

### WebView Not Loading
- Check internet connection
- Verify the server URL in `capacitor.config.json`
- Check Android permissions in `AndroidManifest.xml`

### Build Errors
- Ensure you have the correct Android SDK version installed
- Check that JDK 17 or higher is configured in Android Studio

## Next Steps

1. Open the project in Android Studio
2. Wait for Gradle sync to complete
3. Click the Run button to build and install on a device/emulator
4. The app will open and load www.cutq.store in a WebView

## Useful Commands

```bash
npm run sync              # Sync web assets and configuration
npm run open:android      # Open in Android Studio
npm run build:android     # Sync and open in Android Studio
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/studio)

