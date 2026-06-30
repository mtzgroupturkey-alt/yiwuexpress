# 🧪 QUICK TEST GUIDE - NEW MOBILE DESIGN

## 🚀 How to Test the New Design

### **Step 1: Start the Development Server**

```bash
cd mobile
npm start
```

Or use the existing start script:
```bash
npm run start
```

### **Step 2: Choose Your Testing Platform**

#### **Option A: iOS Simulator**
```bash
npm run ios
```

#### **Option B: Android Emulator**
```bash
npm run android
```

#### **Option C: Physical Device (Recommended)**
1. Install **Expo Go** app on your phone
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code shown in terminal
3. App will load on your device

#### **Option D: Web Browser (Quick Preview)**
```bash
npm run web
```
Then open: http://localhost:8081

---

## ✅ WHAT TO TEST

### **1. Header Section**
- [ ] YIWU EXPRESS logo displays correctly
- [ ] Notification bell shows badge (5)
- [ ] Avatar icon appears on right
- [ ] Location selector shows "Ship from: Yiwu, China"

### **2. Search Bar**
- [ ] Search placeholder text is visible
- [ ] Mic icon (🎤) appears on right
- [ ] Camera icon (📷) appears on right
- [ ] Tap search bar → suggestions dropdown appears
- [ ] Suggestions show:
  - Recent Searches (3 items)
  - Trending Searches with 🔥 emoji (3 items)
- [ ] Tap suggestion chip → fills search input
- [ ] Tap outside → suggestions disappear

### **3. Quick Actions**
- [ ] "Track Package" button (navy blue)
- [ ] "My Quotes" button (golden yellow)
- [ ] Both buttons are tappable

### **4. Category Pills**
- [ ] All categories show with emojis:
  - 📦 All
  - 🚢 Shipping
  - 📋 Customs
  - 🏭 Warehousing
  - 🔍 Sourcing
- [ ] Active category has navy background
- [ ] Inactive categories have gray background
- [ ] Scrolls horizontally smoothly

### **5. Filter & View Bar**
- [ ] "Popular Services" text on left
- [ ] Grid icon (⊞) and List icon (☰) on right
- [ ] Active view has navy background
- [ ] Inactive view has gray background
- [ ] Tap Grid → shows 2-column layout
- [ ] Tap List → shows single-column layout

### **6. Service Cards - Grid View**
- [ ] 2 cards per row
- [ ] Cards have rounded corners (look modern)
- [ ] Each card shows:
  - Large emoji (🚢, 📋, 🏭, 🔍, or 📦)
  - Heart icon (❤️) top-right
  - Type badge top-left (SHIPPING, CUSTOMS, etc.)
  - Star rating (⭐ 4.5)
  - Review count ((128))
  - Service name (2 lines max)
  - Price ($149.99)
  - Duration (🕒 2-3 days)
  - "Quote" button (navy)
- [ ] Tap heart → turns red (favorite)
- [ ] Tap heart again → turns gray (unfavorite)
- [ ] Tap card → goes to service detail
- [ ] Tap "Quote" → goes to quote request

### **7. Service Cards - List View**
- [ ] 1 card per row (full width)
- [ ] Each card shows:
  - Service name (left side)
  - Heart icon (top-right)
  - Type badge and duration
  - Description (2 lines)
  - Price (left bottom)
  - "Quote" button (right bottom)
- [ ] Same heart functionality as grid
- [ ] Same navigation as grid

### **8. Floating Action Button (FAB)**
- [ ] Golden button appears bottom-right
- [ ] Shows QR/Scan icon
- [ ] Floats above content
- [ ] Has shadow/elevation
- [ ] Tap → goes to Track page

### **9. Bottom Navigation**
- [ ] Shows 5 tabs:
  - 🏠 Home
  - 🛒 Products
  - 📦 Services
  - 📋 Orders (with red badge showing "2")
  - 👤 Profile
- [ ] Active tab is golden color
- [ ] Inactive tabs are gray
- [ ] Tap each tab → navigates correctly
- [ ] "Track" tab is gone (moved to FAB)

### **10. Visual Design**
- [ ] Cards have soft shadows (look elevated)
- [ ] Rounded corners everywhere (modern look)
- [ ] Colors are consistent:
  - Navy: #1a3a5c
  - Gold: #c9a84c
  - Background: #F5F7FA
- [ ] Text is readable
- [ ] Touch targets are easy to tap
- [ ] Spacing looks balanced

---

## 📱 SCREEN SIZE TESTING

### **Test on Multiple Devices:**

1. **Small Phone** (iPhone SE, small Android)
   - Cards should fit
   - Text should be readable
   - No horizontal scrolling (except categories)
   - FAB doesn't cover content

2. **Medium Phone** (iPhone 13, Pixel)
   - Optimal layout
   - All elements visible
   - Good spacing

3. **Large Phone** (iPhone Pro Max, Galaxy S23+)
   - Cards may be larger
   - More breathing room
   - FAB positioned correctly

4. **Tablet** (iPad)
   - May show 2 columns still
   - Larger cards
   - Good spacing

---

## 🐛 COMMON ISSUES TO CHECK

### **If Search Suggestions Don't Appear:**
- Make sure you tapped inside the search bar
- Check if `showSearchSuggestions` state is working
- Try tapping outside to close, then tap again

### **If Grid View Shows 1 Column:**
- Check that `numColumns={2}` is set when viewMode is 'grid'
- Try toggling to List and back to Grid
- Force refresh the app

### **If FAB Doesn't Appear:**
- Check it's not hidden behind bottom tabs
- Look in bottom-right corner
- Try scrolling up/down
- Check if FloatingTrackButton is rendered

### **If Heart Icon Doesn't Toggle:**
- Tap directly on the heart
- Check if state is updating
- Try in both grid and list views

### **If Styles Look Wrong:**
- Hard refresh: Shake device → "Reload"
- Or restart dev server
- Clear cache and reload

---

## 🎯 QUICK COMPARISON TEST

### **Before vs After:**

| Feature | Before | After | Test |
|---------|--------|-------|------|
| Tabs Count | 6 tabs | 5 tabs + FAB | ✓ |
| Card Layout | List only | Grid + List toggle | ✓ |
| Categories | Text only | Emoji + text | ✓ |
| Favorites | None | Heart icons | ✓ |
| Search | Basic | Multi-modal + suggestions | ✓ |
| Notifications | None | Bell with badge | ✓ |
| Location | None | "Ship from: Yiwu, China" | ✓ |
| Card Corners | 12px | 16-20px | ✓ |
| Shadows | Basic | Soft & layered | ✓ |

---

## 📊 PERFORMANCE CHECK

### **Things to Monitor:**

1. **Load Time**
   - Home screen should load quickly
   - No lag when switching views
   - Smooth animations

2. **Scrolling**
   - Smooth vertical scrolling
   - Smooth horizontal category scrolling
   - No janky animations

3. **Touch Response**
   - Buttons respond immediately
   - No delayed taps
   - Heart toggle is instant

4. **Memory Usage**
   - App doesn't crash
   - No excessive battery drain
   - No overheating

---

## 🎨 VISUAL DESIGN CHECKLIST

### **Modern Look:**
- [ ] Rounded corners on all cards (16-20px)
- [ ] Soft shadows visible (not harsh)
- [ ] Good color contrast
- [ ] Consistent spacing
- [ ] Professional appearance

### **Brand Consistency:**
- [ ] Navy blue primary color
- [ ] Golden yellow accent color
- [ ] YIWU EXPRESS branding visible
- [ ] Logistics focus maintained

### **Mobile Optimization:**
- [ ] Text is readable (not too small)
- [ ] Buttons are easy to tap
- [ ] No horizontal scrolling (except categories)
- [ ] Content fits screen width
- [ ] FAB doesn't cover important content

---

## 📝 FEEDBACK TO PROVIDE

### **What to Note:**

1. **What works well:**
   - Which features do you like?
   - What feels smooth and intuitive?
   - Any delightful interactions?

2. **What needs improvement:**
   - Anything confusing?
   - Any UI elements too small/large?
   - Any colors that don't work?
   - Any layout issues?

3. **Bugs found:**
   - What were you doing when it broke?
   - Can you reproduce it?
   - Which device/platform?

4. **Feature requests:**
   - What's missing?
   - What would make it better?
   - Any workflow improvements?

---

## 🚀 QUICK START COMMANDS

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies (if not done)
npm install

# Start development server
npm start

# Or run on specific platform
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser
```

---

## 📞 NEED HELP?

### **Common Issues:**

**Q: Metro bundler error?**  
A: Clear cache: `npx expo start -c`

**Q: Module not found?**  
A: Reinstall: `rm -rf node_modules && npm install`

**Q: Styles not updating?**  
A: Hard reload: Shake device → Reload

**Q: FAB not visible?**  
A: Check if it's behind bottom tabs, try scrolling

**Q: Grid view not working?**  
A: Toggle to List and back, or reload app

---

## ✅ TESTING COMPLETE CHECKLIST

Once you've tested everything:

- [ ] Header elements work
- [ ] Search and suggestions work
- [ ] Categories filter correctly
- [ ] View toggle works (Grid/List)
- [ ] Cards display properly
- [ ] Favorites toggle works
- [ ] Navigation works (all tabs + FAB)
- [ ] Visual design looks good
- [ ] Performance is smooth
- [ ] No crashes or errors
- [ ] Tested on at least 2 devices
- [ ] Ready to provide feedback

---

**HAPPY TESTING! 🎉**

*If you find any issues, note them down with:*
- *What happened*
- *What you expected*
- *Device/platform used*
- *Steps to reproduce*
