# Quick Build Commands Reference

## 🚀 Fastest Way to Build

### Option 1: Use the Script (Recommended)
```cmd
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
build-apk.bat
```

### Option 2: Manual Commands
```cmd
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
eas build --platform android --profile preview
```

---

## 📦 One-Time Setup (First Build Only)

```cmd
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

---

## 🔧 Common Commands

### Check build status
```cmd
eas build:list
```

### View specific build details
```cmd
eas build:view [build-id]
```

### Cancel running build
```cmd
eas build:cancel
```

### Check who you're logged in as
```cmd
eas whoami
```

### Logout
```cmd
eas logout
```

---

## 📱 Build Profiles

### Preview Build (Testing/Beta)
```cmd
eas build --platform android --profile preview
```
- Output: APK file
- Distribution: Internal
- Best for: Testing, beta distribution

### Production Build (Release)
```cmd
eas build --platform android --profile production
```
- Output: APK file
- Distribution: Play Store or direct
- Best for: Public release

---

## 🌐 Where to Download

After build completes:

1. **Dashboard URL**: https://expo.dev/accounts/[username]/projects/dromkok-app/builds
2. **Direct download** from terminal link
3. **Email notification** (if enabled in Expo settings)

---

## ⚡ Quick Troubleshooting

### Not logged in?
```cmd
eas login
```

### Build failed?
```cmd
eas build:list
eas build:view [failed-build-id]
```

### Update dependencies
```cmd
npm install
```

### Clear cache
```cmd
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 📊 Build Time

- **Average**: 10-15 minutes
- **First build**: May take 15-20 minutes
- **Subsequent builds**: Usually faster (cached dependencies)

---

## 💰 Build Limits

- **Free tier**: 30 builds/month
- **Monitor usage**: https://expo.dev/accounts/[username]/settings/billing

---

## 🎯 Current App Config

- **App Name**: DROMKOK
- **Package**: com.dromkok.app
- **Version**: 1.0.0
- **API URL**: https://www.dromkok.com
- **Environment**: Production

---

## 📝 Before Next Build

Update version in `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",      // Increment this
    "android": {
      "versionCode": 2       // Increment this too
    }
  }
}
```

---

## 🆘 Support

- **Docs**: https://docs.expo.dev/build/introduction/
- **Forums**: https://forums.expo.dev/
- **Status**: https://status.expo.dev/

---

**Ready to build?** → Run `build-apk.bat` or `eas build --platform android --profile preview`
