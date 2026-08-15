# DROMKOK Mobile APK Build Guide

## Prerequisites

Before building the APK, ensure you have:

1. ✅ Node.js installed (v18 or later)
2. ✅ npm installed
3. ✅ Expo account (free account is sufficient)
4. ✅ Internet connection for EAS build service

## Current Configuration Status

✅ App configured for production (`ENVIRONMENT: 'production'`)
✅ API URL set to: `https://www.dromkok.com`
✅ App branding: **DROMKOK**
✅ Package name: `com.dromkok.app`
✅ EAS build configuration ready

## Step-by-Step Build Process

### 1. Install EAS CLI (One-time setup)

Open Command Prompt and run:

```cmd
npm install -g eas-cli
```

This installs the Expo Application Services command-line tool globally.

### 2. Navigate to Mobile Directory

```cmd
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
```

### 3. Login to Expo Account

```cmd
eas login
```

**Options:**
- If you have an Expo account: Enter your email and password
- If you don't have an account: Create one at https://expo.dev/signup
- Free account is sufficient for building APKs

### 4. Configure EAS Project (First-time only)

```cmd
eas build:configure
```

This will:
- Link your project to your Expo account
- Create/update the `eas.json` configuration
- Generate a unique project ID

### 5. Build the APK

```cmd
eas build --platform android --profile preview
```

**What this does:**
- Uses the "preview" profile (configured to build APK, not AAB)
- Builds on Expo's cloud servers (free for open-source projects)
- Build time: approximately 10-15 minutes
- You'll receive a download link when complete

**Alternative (Production build):**
```cmd
eas build --platform android --profile production
```

### 6. Download the APK

When build completes:
1. You'll see a URL in the terminal: `https://expo.dev/accounts/[your-account]/projects/dromkok-app/builds/[build-id]`
2. Open the URL in your browser
3. Click **"Download"** button
4. The APK will be downloaded to your Downloads folder

**Or visit:** https://expo.dev/accounts/[your-username]/projects/dromkok-app/builds

## Build Profiles Explained

### `preview` (Recommended for testing)
- Builds APK file (`.apk`)
- Can be installed directly on Android devices
- Internal distribution only
- Faster build process

### `production` (For Play Store)
- Builds APK file (`.apk`)
- Optimized for production
- Can be distributed via Play Store or directly

### `development` (For development)
- Includes developer tools
- Requires Expo Go app or development client

## Installing the APK on Android Device

### Method 1: Direct Installation
1. Download APK from EAS dashboard
2. Transfer APK file to your Android device
3. Open the APK file on your device
4. Allow "Install from Unknown Sources" if prompted
5. Install and launch the app

### Method 2: Share via Link
1. After build completes, copy the share link from EAS dashboard
2. Open link on Android device
3. Click "Download" and install

## Troubleshooting

### Error: "Not logged in"
```cmd
eas login
```
Re-authenticate with your Expo account.

### Error: "Project not configured"
```cmd
eas build:configure
```
Run the configuration wizard again.

### Error: "Build failed"
1. Check build logs in the EAS dashboard
2. Common issues:
   - Missing dependencies in package.json
   - Invalid app.json configuration
   - Network issues

### Build takes too long
- Normal build time: 10-15 minutes
- If > 30 minutes, check EAS status: https://status.expo.dev/

## Build Status Tracking

### Check Build Status
```cmd
eas build:list
```

### View Build Details
```cmd
eas build:view [build-id]
```

### Cancel Build
```cmd
eas build:cancel
```

## Alternative: Local Build (Advanced)

If you prefer to build locally without EAS:

1. Install Android Studio and SDK tools
2. Run:
```cmd
npx expo prebuild
npx expo run:android --variant release
```

**Note:** Local builds require complex Android SDK setup. EAS is recommended.

## App Version Management

To update app version before building:

Edit `mobile/app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // <-- Update here
    "android": {
      "versionCode": 2   // <-- Increment this
    }
  }
}
```

## Quick Build Script

We've created a helper script for you:

```cmd
c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile\build-apk.bat
```

This script will:
1. Check if EAS CLI is installed
2. Navigate to mobile directory
3. Start the build process

## Next Steps After First Build

1. **Test the APK** on multiple Android devices
2. **Share with beta testers** using the EAS share link
3. **Update version numbers** for new builds
4. **Monitor crashes** using Expo's built-in error tracking

## Support Resources

- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- Build Dashboard: https://expo.dev/accounts/[username]/projects/dromkok-app

## Build Cost

- **Free tier:** 30 builds per month (shared across all projects)
- **Paid plans:** Available for higher limits
- Check: https://expo.dev/pricing

---

**Ready to build?** Run the commands in order or use the `build-apk.bat` script!
