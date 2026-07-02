# 🔧 TextType Troubleshooting Guide

## Issue: TextType Animation Not Showing in Top Bar

### 🎯 Quick Diagnosis Steps

#### Step 1: Restart Server
```bash
# Stop current server (Ctrl+C)
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

#### Step 2: Clear Browser Cache
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

#### Step 3: Check Test Pages

Visit these URLs to test TextType in isolation:

1. **Simple Test Page:**
   ```
   http://localhost:3001/test-simple-texttype
   ```
   - Should show 3 TextType examples
   - Should see typing animation
   - Check console for debug logs

2. **Full Test Page:**
   ```
   http://localhost:3001/test-texttype
   ```
   - 5 different TextType variations
   - Should all be typing

3. **Main Page:**
   ```
   http://localhost:3001/
   ```
   - Look at top bar
   - Must be on desktop view (>768px width)

---

## 🔍 Debugging Checklist

### Check #1: Console Logs
Open DevTools (F12) → Console tab

**You should see:**
```
TextType mounted: {textArray: Array(3), isVisible: true, ...}
TextType state changed: {displayedText: "W", ...}
TextType state changed: {displayedText: "WE", ...}
```

**If you DON'T see these logs:**
- TextType component is not rendering
- Check if import is correct
- Check if component is inside the DOM

---

### Check #2: Screen Size
The top bar has `hidden md:block` class

**To verify:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set width to > 768px
4. Refresh page

**If on mobile/small screen:**
- Top bar will be hidden
- This is by design
- Test on desktop or expand browser width

---

### Check #3: Scroll Position
The top bar hides when you scroll down

**To verify:**
1. Scroll to very top of page
2. Top bar should be visible
3. Scroll down → top bar slides up
4. Scroll back up → top bar appears

---

### Check #4: TextType Props
Open: `web/components/layout/MainHeader.tsx`

**Verify TextType has these props:**
```jsx
<TextType
  text={[...]}  // Array of strings
  typingSpeed={75}
  showCursor={true}
  cursorCharacter="|"
  loop={true}
  className="text-white/60 text-[10px] ..."
/>
```

---

### Check #5: GSAP Loading
Check if GSAP is loaded:

1. Open Console (F12)
2. Type: `gsap`
3. Press Enter

**Should see:**
```
Object {version: "3.15.0", ...}
```

**If undefined:**
```bash
cd web
npm install gsap
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Text Shows But Doesn't Type

**Symptom:** Static text appears instead of typing animation

**Possible Causes:**
1. JavaScript error preventing animation
2. useEffect not running
3. State not updating

**Solutions:**
```jsx
// Solution A: Add key prop to force remount
<TextType
  key="welcome-message"
  text={[...]}
  {...props}
/>

// Solution B: Add initialDelay
<TextType
  initialDelay={100}  // Wait 100ms before starting
  text={[...]}
  {...props}
/>
```

---

### Issue 2: Cursor Not Blinking

**Symptom:** Cursor "|" visible but not blinking

**Possible Cause:** GSAP animation not initializing

**Solution:**
```bash
# Reinstall GSAP
cd web
npm uninstall gsap
npm install gsap
# Restart server
```

---

### Issue 3: Text Too Small / Not Visible

**Symptom:** Can't see the text

**Solution:**
```jsx
// Temporarily increase font size for testing
className="text-white text-2xl"  // Instead of text-[10px]
```

---

### Issue 4: Overflow Hidden Cutting Text

**Symptom:** Text gets cut off

**Solution:** Already fixed - removed `overflow-hidden` from motion.div

---

### Issue 5: Component Not Mounting

**Symptom:** No console logs, no text, nothing

**Check:**
1. Is TextType imported?
   ```jsx
   import TextType from '@/components/ui/TextType'
   ```

2. Does the file exist?
   ```
   web/components/ui/TextType.tsx  ✅
   web/components/ui/TextType.css  ✅
   ```

3. Check for TypeScript errors:
   ```bash
   cd web
   npm run build
   ```

---

## 🧪 Test Cases

### Test Case 1: Isolated Component
Create a simple page:

```jsx
'use client'
import TextType from '@/components/ui/TextType'

export default function Test() {
  return (
    <div style={{ background: '#1a3a5c', padding: '50px' }}>
      <TextType
        text={["HELLO", "WORLD"]}
        className="text-white text-3xl"
        typingSpeed={100}
      />
    </div>
  )
}
```

Save as: `web/app/test-isolated/page.tsx`
Visit: `http://localhost:3001/test-isolated`

**Expected:** See "HELLO" typing, then deleting, then "WORLD"

---

### Test Case 2: Without Variable Speed
Remove variable speed to simplify:

```jsx
<TextType
  text={["TEST MESSAGE"]}
  typingSpeed={75}
  showCursor={true}
  cursorCharacter="|"
  loop={false}
  className="text-white text-2xl"
  // Remove these:
  // variableSpeedEnabled={true}
  // variableSpeedMin={110}
  // variableSpeedMax={175}
/>
```

---

### Test Case 3: Single Message, No Loop
Simplest possible test:

```jsx
<TextType
  text="HELLO WORLD"
  loop={false}
  className="text-white text-3xl"
/>
```

---

## 📋 Verification Checklist

- [ ] Server restarted
- [ ] Browser cache cleared
- [ ] Screen width > 768px
- [ ] Scrolled to top of page
- [ ] Console shows TextType logs
- [ ] No JavaScript errors in console
- [ ] GSAP is installed and loaded
- [ ] TextType.tsx file exists
- [ ] TextType.css file exists
- [ ] Import statement is correct
- [ ] Test pages work (`/test-simple-texttype`)

---

## 🔄 Reset to Working State

If nothing works, try this complete reset:

```bash
# 1. Stop server
Ctrl+C

# 2. Clean install
cd web
rm -rf node_modules
rm package-lock.json
npm install

# 3. Verify GSAP
npm list gsap
# Should show: gsap@3.15.0

# 4. Rebuild
npm run build

# 5. Start dev server
npm run dev

# 6. Hard refresh browser
Ctrl+Shift+R
```

---

## 📞 What to Check If Still Not Working

### Check Browser DevTools:

1. **Elements Tab:**
   - Find the top bar element
   - Look for `<TextType>` or its rendered output
   - Check if it's in the DOM

2. **Console Tab:**
   - Look for TextType debug logs
   - Look for any red errors
   - Check for GSAP errors

3. **Network Tab:**
   - Check if TextType.tsx loads
   - Check if GSAP loads
   - Look for 404 errors

4. **React DevTools:**
   - Find TextType component
   - Check its props
   - Check its state

---

## 💡 Alternative: Use TopBar Instead

The TopBar component already has TextType working!

**Check if TopBar is visible:**
- TopBar is always visible (doesn't hide on scroll)
- Located at: `web/components/layout/TopBar.tsx`
- Imported in: Check your layout files

**To use TopBar:**
```jsx
import { TopBar } from '@/components/layout/TopBar'

// In your layout:
<TopBar />
<MainHeader />
```

---

## 📝 Debug Output Template

When asking for help, provide this information:

```
1. Browser: Chrome/Firefox/Safari
2. Screen Width: 1920px / 1024px / etc.
3. Console Logs: [paste TextType logs]
4. Errors: [paste any red errors]
5. Test Pages Work: Yes/No
   - /test-simple-texttype: 
   - /test-texttype: 
6. GSAP Installed: Yes/No
7. npm list gsap output: [paste]
8. Can see static text: Yes/No
9. Scroll position: Top/Middle/Bottom
```

---

## ✅ Success Indicators

**When it's working, you'll see:**
1. ✅ Console logs: "TextType mounted", "TextType state changed"
2. ✅ Text appearing character by character
3. ✅ Blinking cursor "|"
4. ✅ Text deleting after pause
5. ✅ Next message appearing
6. ✅ Loop continuing infinitely
7. ✅ Sparkle icon "✦" visible

---

**Last Updated:** December 2024
**Status:** Troubleshooting Guide - Use test pages first!
