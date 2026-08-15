# Test Language Switcher - Quick Guide

## 🧪 How to Test the Fix

### Start the Development Server
```bash
cd ecommerce-monorepo/web
npm run dev
```

Open: `http://localhost:3005/en/`

---

## ✅ Test Cases

### Test 1: Desktop Language Switcher (Main Navbar)

**Steps:**
1. Look at top-right corner of the page
2. Click the language dropdown (shows current language with flag)
3. Click "Русский" (Russian flag 🇷🇺)

**Expected Results:**
- ✅ URL changes from `/en/` to `/ru/`
- ✅ Page content changes to Russian
- ✅ Navigation items are in Russian
- ✅ Language dropdown now shows "RU"

**Before Fix:**
- ❌ URL became `/en?locale=ru`
- ❌ Content stayed in English

---

### Test 2: Chinese Language

**Steps:**
1. From any page (in English), click language dropdown
2. Click "中文" (Chinese flag 🇨🇳)

**Expected Results:**
- ✅ URL changes to `/zh/`
- ✅ All text changes to Chinese characters
- ✅ Product names, categories, buttons all in Chinese

---

### Test 3: Mobile Menu Language Switcher

**Steps:**
1. Resize browser to mobile size (or use mobile device)
2. Click hamburger menu (three lines icon)
3. Scroll to bottom of menu
4. Find "Preferences" section with "Language"
5. Click "RU" button

**Expected Results:**
- ✅ Menu closes automatically
- ✅ URL changes to `/ru/`
- ✅ Content is in Russian

---

### Test 4: Navigation Persistence

**Steps:**
1. Switch to Russian (URL: `/ru/`)
2. Click "Products" in navigation
3. Check URL and content

**Expected Results:**
- ✅ URL is `/ru/products` (not `/en/products`)
- ✅ Product page is in Russian
- ✅ All navigation stays in Russian

**Test on multiple pages:**
- ✅ `/ru/` (homepage)
- ✅ `/ru/products` (products page)
- ✅ `/ru/about` (about page)
- ✅ `/ru/contact` (contact page)
- ✅ `/ru/services` (services page)

---

### Test 5: Deep Link with Locale

**Steps:**
1. Manually type in browser: `http://localhost:3005/zh/products`
2. Press Enter

**Expected Results:**
- ✅ Page loads in Chinese
- ✅ Language switcher shows "ZH" as selected
- ✅ All content is in Chinese

---

### Test 6: Language Switching Between All Languages

**Steps:**
1. Start at English: `/en/products`
2. Switch to Russian → `/ru/products`
3. Switch to Chinese → `/zh/products`
4. Switch back to English → `/en/products`

**Expected Results:**
- ✅ Each switch changes URL correctly
- ✅ Content changes to selected language
- ✅ No `?locale=` query parameters in URL
- ✅ Selected language is highlighted in dropdown

---

### Test 7: Language Switch on Different Pages

**Test Homepage:**
- English `/en/` → Russian `/ru/` ✅
- Hero slider text changes ✅
- Category names change ✅

**Test Product Page:**
- `/en/products/some-product` → `/zh/products/some-product` ✅
- Product description in Chinese ✅
- "Add to Cart" button in Chinese ✅

**Test Checkout:**
- `/en/checkout` → `/ru/checkout` ✅
- Form labels in Russian ✅
- Buttons in Russian ✅

---

## 🐛 Common Issues to Check

### Issue: URL shows `?locale=zh`
**Status:** ❌ NOT FIXED - Old code still running  
**Fix:** Restart dev server: `npm run dev`

### Issue: Language dropdown not visible
**Status:** Check if you're on mobile (hidden on mobile in main navbar)  
**Fix:** Use mobile menu language buttons instead

### Issue: Content not changing
**Status:** Check browser console for errors  
**Fix:** 
- Hard refresh: `Ctrl + F5`
- Check translation files exist in `messages/` folder

---

## 📊 Quick Checklist

Before marking as complete, verify:

- [ ] Desktop language dropdown works (3 options)
- [ ] Mobile menu language buttons work (3 buttons)
- [ ] URLs change to `/en/`, `/ru/`, `/zh/` format
- [ ] No `?locale=` query parameters in URL
- [ ] Content actually changes language
- [ ] Navigation stays in selected language
- [ ] Language persists across page navigation
- [ ] Deep links work (typing `/zh/products` directly)
- [ ] All 3 languages work (EN, RU, ZH)
- [ ] Selected language is highlighted in UI

---

## 🎯 Success Criteria

**The fix is successful if:**

✅ Clicking Russian flag changes URL from `/en/` to `/ru/`  
✅ Page content changes to Russian text  
✅ Navigation to other pages stays in Russian  
✅ Language dropdown shows "RU" as selected  
✅ Same behavior for all languages (EN, RU, ZH)  

**The fix FAILS if:**

❌ URL has `?locale=` query parameter  
❌ Content doesn't change language  
❌ Language resets after navigation  
❌ Console shows JavaScript errors  

---

## 🔍 Debug Mode

If issues occur, open browser console (F12) and check:

1. **Check for errors:**
   - Look for red error messages
   - Check Network tab for failed requests

2. **Verify current locale:**
   ```javascript
   // In browser console:
   window.location.pathname
   // Should show: /en/... or /ru/... or /zh/...
   ```

3. **Check language switcher click:**
   - Click language option
   - Watch console for any errors
   - Verify URL changes immediately

---

## 📝 Test Report Template

```
LANGUAGE SWITCHER TEST REPORT
Date: 2026-08-14
Tester: [Your Name]

Desktop Language Switcher:
- [ ] EN → RU: PASS / FAIL
- [ ] EN → ZH: PASS / FAIL
- [ ] RU → EN: PASS / FAIL
- [ ] RU → ZH: PASS / FAIL
- [ ] ZH → EN: PASS / FAIL
- [ ] ZH → RU: PASS / FAIL

Mobile Language Switcher:
- [ ] EN → RU: PASS / FAIL
- [ ] EN → ZH: PASS / FAIL
- [ ] All buttons work: PASS / FAIL

URL Format:
- [ ] No ?locale= in URL: PASS / FAIL
- [ ] Locale in path (/en/, /ru/, /zh/): PASS / FAIL

Content Translation:
- [ ] Navigation changes language: PASS / FAIL
- [ ] Page content changes: PASS / FAIL
- [ ] Buttons/labels change: PASS / FAIL

Overall Status: PASS / FAIL
Notes: [Any issues or observations]
```

---

## 🚀 Quick Test (30 seconds)

**Fastest way to verify the fix works:**

1. Open `http://localhost:3005/en/`
2. Click language dropdown → Click "中文" 
3. Check URL: Should be `/zh/` ✅
4. Check content: Should be in Chinese ✅
5. **DONE!** If both work, the fix is successful.

---

**Ready to test? Start your dev server and follow Test 1!**

```bash
npm run dev
# Open: http://localhost:3005/en/
# Click language switcher
# Verify URL changes to /ru/ or /zh/
```
