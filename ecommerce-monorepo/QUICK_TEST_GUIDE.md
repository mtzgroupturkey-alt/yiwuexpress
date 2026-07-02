# ⚡ Quick Test Guide - TextType Animation

## 🎯 3-Minute Test Plan

### ✅ Step 1: Restart Server (30 seconds)
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

### ✅ Step 2: Test URLs (2 minutes)

**Test 1:** http://localhost:3001/test-minimal
**Expected:** Text "HELLO WORLD - THIS IS TYPING" types out
**Result:** ☐ Works ☐ Fails

**Test 2:** http://localhost:3001/test-simple-texttype  
**Expected:** See 3 TextType examples typing
**Result:** ☐ Works ☐ Fails

**Test 3:** http://localhost:3001/
**Expected:** Top bar shows typing animation
**IMPORTANT:** Desktop view only (width > 768px)
**Result:** ☐ Works ☐ Fails

### ✅ Step 3: Hard Refresh (10 seconds)
```
Press: Ctrl + Shift + R
```

---

## 📱 Desktop View Check

**If you can't see top bar on main page:**

1. Press **F12** (DevTools)
2. Press **Ctrl+Shift+M** (device toolbar)
3. Click **"Responsive"** dropdown
4. Select **"Desktop"** or set width to **1920px**
5. **Refresh page**

---

## ✅ Quick Checklist

- [ ] Server running on port 3001
- [ ] test-minimal shows typing
- [ ] test-simple-texttype shows typing
- [ ] Main page desktop view (>768px)
- [ ] Scrolled to top of page
- [ ] Hard refresh done (Ctrl+Shift+R)

---

## 🎯 What Success Looks Like

**On main page top bar:**
```
✦ W|
✦ WE|  
✦ WEL|
✦ WELCOME TO DROMKOK — PREMIUM SOURCING|
(pauses 2.6 seconds)
(deletes)
✦ GLOBAL TRADE SOLUTIONS — QUALITY YOU CAN TRUST|
(continues looping)
```

---

## ❌ If Not Working

**Quick Fix:**
```bash
# Clean restart
cd web
Ctrl+C (stop server)
npm run dev
# Then: Ctrl+Shift+R in browser
```

**Still not working?**
Report:
1. Which test page fails (1, 2, or 3)
2. What you see (nothing/static text/error)
3. Console errors (F12 → Console → copy/paste)

---

## 📝 Test Results Template

```
Test 1 (test-minimal): PASS / FAIL
Test 2 (test-simple-texttype): PASS / FAIL  
Test 3 (main page): PASS / FAIL

Screen width: ___ px
Browser: Chrome/Firefox/Safari
Console errors: Yes / No

If errors, paste here:
[paste console errors]
```

---

**That's it! Test and report results.** 🚀
