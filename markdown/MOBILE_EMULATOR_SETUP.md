# Mobile Emulator Network Configuration Guide

## Problem
The mobile app (iOS/Android emulator) was unable to connect to the backend API because:
1. Emulators have isolated network stacks
2. They cannot reach your Mac's local IP address (192.168.1.33)
3. They need special routing to reach the host machine

## Solution Implemented

### 1. Frontend Configuration (Next.js)
**File**: `frontend-nextjs/src/config/env.ts`

Added automatic detection of emulator environment:
- **Android Emulator**: Uses `10.0.2.2` (special alias to reach host)
- **iOS Simulator**: Uses `localhost` (shares Mac's network stack)

The app now automatically detects if it's running in Capacitor and routes API calls correctly.

### 2. Backend Configuration (Node.js)
**File**: `api-backend-nodejs/.env.dev.local`

Updated CORS_ORIGIN to allow requests from:
- `http://10.0.2.2:3000` - Android emulator
- `http://localhost:5001` - iOS simulator

## How to Test

### Android Emulator
1. Rebuild the app: `npm run build:android`
2. Run on emulator
3. Check browser console (DevTools) - should see: "📱 Android Emulator detected - using 10.0.2.2"
4. API calls should now work

### iOS Simulator
1. Rebuild the app: `npm run build:ios`
2. Run on simulator
3. Check browser console - should see: "📱 iOS Simulator detected - using localhost"
4. API calls should now work

## Important Notes

- **Backend must be running** on port 5001: `npm run dev` in `api-backend-nodejs/`
- **Next.js must be running** on port 3000: `npm run dev` in `frontend-nextjs/`
- The emulator detection is automatic - no manual configuration needed
- CORS is configured to allow requests with no origin (mobile apps don't send origin header)

## Troubleshooting

If still getting network errors:

1. **Check backend is running**: `curl http://localhost:5001/health`
2. **Check Next.js is running**: `curl http://localhost:3000`
3. **Verify emulator can reach host**:
   - Android: `adb shell ping 10.0.2.2`
   - iOS: `ping localhost`
4. **Check browser console** in emulator for API URL being used
5. **Restart emulator** if changes don't take effect

## Architecture

```
Mobile App (Capacitor WebView)
    ↓
Next.js Frontend (Port 3000)
    ↓
Backend API (Port 5001)
    ↓
Database
```

The app detects emulator environment and routes:
- Android: `10.0.2.2:5001/api/v1`
- iOS: `localhost:5001/api/v1`

