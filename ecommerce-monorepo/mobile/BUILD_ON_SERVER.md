# Build APK on Server (39.175.57.2)

## Step-by-Step Server Commands

Run these commands one by one on your server via SSH.

---

## Step 1: Connect to Server

From your local machine:

```cmd
ssh djdn@39.175.57.2
```

Enter your password when prompted.

---

## Step 2: Navigate to Mobile Directory

```bash
cd /www/wwwroot/www.dromkok.com/web/../mobile
```

Or if mobile folder is in a different location:

```bash
cd /www/wwwroot/www.dromkok.com
cd ../ecommerce-monorepo/mobile
```

If mobile folder doesn't exist on server, you need to upload it first:

```bash
# On your local machine (in Windows cmd)
scp -r "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/
```

---

## Step 3: Verify Node.js Version

```bash
node --version
```

Required: Node.js v18 or later

If not installed or wrong version:

```bash
# Install Node.js 18 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

---

## Step 4: Install Dependencies

```bash
npm install
```

This will install all required packages (~2-3 minutes).

---

## Step 5: Install EAS CLI Globally

```bash
npm install -g eas-cli
```

Verify installation:

```bash
eas --version
```

---

## Step 6: Login to Expo Account

```bash
eas login
```

**You will be prompted for:**
- Email: [your Expo account email]
- Password: [your Expo account password]

**Don't have an Expo account?**
- Go to https://expo.dev/signup
- Create a free account
- Then run `eas login` again

---

## Step 7: Configure Project (First-time only)

```bash
eas build:configure
```

Press Enter to accept defaults when prompted.

This creates/updates `eas.json` configuration.

---

## Step 8: Start APK Build

```bash
eas build --platform android --profile preview
```

**What happens:**
1. Your code is uploaded to Expo servers
2. Build starts on Expo's cloud infrastructure
3. You'll see build progress in terminal
4. Build takes 10-15 minutes

**Important:** Keep your SSH session open, or use `screen` to run in background:

```bash
# Run in background (optional)
screen -S apkbuild
eas build --platform android --profile preview
# Press Ctrl+A then D to detach
# Reconnect later with: screen -r apkbuild
```

---

## Step 9: Wait for Build to Complete

You'll see output like:

```
✔ Build finished successfully
Build artifact: https://expo.dev/artifacts/eas/xxxxxxxxxxxx.apk
```

**Copy this URL!**

---

## Step 10: Download APK to Server

```bash
# Download APK to server
wget -O dromkok-app-1.0.0.apk "https://expo.dev/artifacts/eas/[your-build-id].apk"
```

Replace `[your-build-id]` with the actual URL from step 9.

Verify download:

```bash
ls -lh dromkok-app-1.0.0.apk
```

You should see a file ~45-60 MB.

---

## Step 11: Download APK to Your Computer

From a **new terminal on your Windows machine**:

```cmd
scp djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/mobile/dromkok-app-1.0.0.apk C:\Users\YourName\Downloads\
```

Or use an SFTP client like FileZilla.

---

## Alternative: Direct Download from Expo Dashboard

Instead of steps 10-11, you can:

1. Visit: https://expo.dev
2. Login with your account
3. Go to: Projects → dromkok-app → Builds
4. Click the latest build
5. Click **Download** button
6. APK downloads directly to your browser

---

## Verify Build Status Anytime

```bash
# List all builds
eas build:list

# View specific build details
eas build:view [build-id]
```

---

## Complete Server Command Sequence

Copy and paste these commands (update paths as needed):

```bash
# 1. Navigate to mobile directory
cd /www/wwwroot/www.dromkok.com/mobile

# 2. Install dependencies (first time only)
npm install

# 3. Install EAS CLI (first time only)
npm install -g eas-cli

# 4. Login to Expo (first time only)
eas login

# 5. Configure project (first time only)
eas build:configure

# 6. Build APK
eas build --platform android --profile preview

# 7. Wait for completion (~10-15 minutes)
# You'll get a download URL when done

# 8. Download APK from URL provided
wget -O dromkok-app.apk "PASTE_URL_HERE"

# 9. Verify file
ls -lh dromkok-app.apk
```

---

## If Mobile Folder Not on Server

### Upload mobile folder from Windows:

```cmd
# From your local Windows machine
cd c:\wamp64\www\yiwuexpress

# Upload entire mobile folder
scp -r "ecommerce-monorepo\mobile" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/

# Then connect to server and continue with Step 3
```

---

## Troubleshooting

### "Command not found: eas"

```bash
npm install -g eas-cli
```

### "Node version too old"

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### "Permission denied"

```bash
sudo npm install -g eas-cli
```

### "Build failed"

Check logs:
```bash
eas build:list
eas build:view [failed-build-id]
```

### "Not logged in"

```bash
eas logout
eas login
```

---

## Quick Reference Card

```bash
# Essential commands
eas login                                    # Login to Expo
eas build:configure                          # Configure project
eas build --platform android --profile preview  # Build APK
eas build:list                               # List builds
eas whoami                                   # Check login status
```

---

## Expected Timeline

| Step | Duration |
|------|----------|
| Upload mobile folder to server | 2-5 minutes |
| Install dependencies | 2-3 minutes |
| Login and configure | 1-2 minutes |
| Build on Expo servers | 10-15 minutes |
| Download APK | 1-2 minutes |
| **Total** | **~20-25 minutes** |

---

## Next Steps After Download

1. Transfer APK to Android device
2. Enable "Unknown Sources" in Android settings
3. Install APK
4. Launch DROMKOK app
5. Test login and features

---

**Need help?** Check the build logs or visit https://expo.dev/accounts/[username]/projects/dromkok-app/builds
