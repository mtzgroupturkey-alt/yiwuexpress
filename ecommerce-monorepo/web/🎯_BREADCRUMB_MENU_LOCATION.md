# 🎯 WHERE TO FIND BREADCRUMB SETTINGS

## 📍 ADMIN SIDEBAR MENU

```
┌──────────────────────────────────┐
│  ADMIN PANEL SIDEBAR             │
├──────────────────────────────────┤
│                                   │
│  📊 Dashboard                    │
│  📦 Products                     │
│  📝 Quotes                       │
│  🚢 Shipments                    │
│  👥 Users                        │
│  ⚙️  Settings  ◄─ CLICK HERE!    │
│     ├─ 🎬 Hero Slider            │
│     ├─ ⭐ Featured Products      │
│     ├─ ✨ New Arrivals           │
│     ├─ 🖼️  Breadcrumb Backgrounds │ ◄─ HERE IT IS!
│     ├─ 🏢 Company Info           │
│     ├─ ⚙️  System Settings       │
│     ├─ 🔔 Notifications          │
│     ├─ 🛡️  Permissions           │
│     └─ 💾 Backup & Export        │
│                                   │
└──────────────────────────────────┘
```

---

## 🎯 STEP-BY-STEP ACCESS

### Step 1: Login
```
http://localhost:3005/admin
```
Enter your admin credentials

### Step 2: Find Settings
Look at the left sidebar
Find the **⚙️ Settings** menu item

### Step 3: Expand Settings
Click on **⚙️ Settings**
The submenu will expand showing all options

### Step 4: Click Breadcrumb Backgrounds
Click on **🖼️ Breadcrumb Backgrounds**
This is the 4th item in the submenu

---

## 🔗 DIRECT LINK

If you're already logged in as admin:

```
http://localhost:3005/admin/settings/breadcrumb
```

---

## 🖼️ WHAT YOU'LL SEE

```
┌──────────────────────────────────────────────────┐
│  BREADCRUMB SETTINGS                      [+ Add] │
├──────────────────────────────────────────────────┤
│  Manage background images for breadcrumbs        │
│  across your store                               │
├──────────────────────────────────────────────────┤
│                                                   │
│  [Static Pages] [Shop Default] [Categories]      │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ Page          Image      Title     Status  │ │
│  ├────────────────────────────────────────────┤ │
│  │ (Your breadcrumb settings will appear here)│ │
│  └────────────────────────────────────────────┘ │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## ✅ VERIFICATION

### You're in the right place if you see:
- ✅ "Breadcrumb Settings" as the page title
- ✅ "Manage background images for breadcrumbs" subtitle
- ✅ Three tabs: Static Pages, Shop Default, Categories
- ✅ An "[+ Add]" button in the top right

---

## 🔄 IF YOU DON'T SEE IT

### 1. Hard Refresh Browser
**Windows:** Press `Ctrl + Shift + R`

### 2. Clear Cache
**Chrome:** `Ctrl + Shift + Delete` → Clear cache

### 3. Restart Dev Server
```bash
# In terminal, press Ctrl+C to stop
# Then restart:
npm run dev
```

### 4. Check You're on Correct Port
```
http://localhost:3005/admin
```
(Not 3000, not 3001 - use 3005)

---

## 🎨 MENU ICON

The breadcrumb menu item shows:
- **Icon:** 🖼️ Image icon
- **Label:** Breadcrumb Backgrounds
- **Position:** 4th in Settings submenu

---

## 🎯 QUICK ACCESS PATH

```
Admin Login
    ↓
Dashboard
    ↓
Settings (sidebar) ← Click
    ↓
Breadcrumb Backgrounds ← Click
    ↓
Breadcrumb Settings Page ✅
```

---

## 📱 MOBILE ADMIN VIEW

If using mobile/tablet:
1. Click hamburger menu (≡)
2. Find Settings
3. Tap to expand
4. Tap "Breadcrumb Backgrounds"

---

## 🆘 STILL CAN'T FIND IT?

### Check These:
1. ✅ You're logged in as ADMIN (not regular user)
2. ✅ Development server is running
3. ✅ You're on port 3005
4. ✅ Browser cache is cleared
5. ✅ Settings menu is expanded

### Still Having Issues?
The file was updated in:
```
web/app/admin/layout.tsx
```

Make sure this file has been saved and the server restarted.

---

## 🎉 SUCCESS!

Once you see the "Breadcrumb Settings" page, you're ready to:
1. Add shop default background
2. Add static page backgrounds
3. Add category backgrounds
4. Customize colors and titles
5. Make your store beautiful!

---

**Location:** Admin Panel → Settings → Breadcrumb Backgrounds
**URL:** `http://localhost:3005/admin/settings/breadcrumb`
**Fixed:** ✅ June 27, 2026
