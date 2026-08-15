# Language Switcher Fix

## Problem

The language switcher was not working correctly. When users selected a language, it would add a query parameter `?locale=zh` to the URL instead of actually changing the URL path to `/zh`, and the website content would not change to the selected language.

**Before Fix:**
- Click Chinese → URL becomes: `http://localhost:3005/en?locale=zh`
- Website stays in English ❌

**Expected Behavior:**
- Click Chinese → URL becomes: `http://localhost:3005/zh/`
- Website changes to Chinese ✅

---

## Root Cause

The `switchLocale` function in multiple components was using incorrect navigation methods:

### Old (Broken) Implementation:
```typescript
// In navbar.tsx
const switchLocale = (newLocale: string) => {
  router.push(pathname, { locale: newLocale as any })
}

// In TwoRowNavbar.tsx
const switchLocale = (next: string) => {
  if (isLocalizedPath) {
    intlRouter.replace(pathname, { locale: next })
  } else {
    const url = new URL(window.location.href)
    url.searchParams.set('locale', next)
    nativeRouter.push(url.pathname + url.search)
  }
}

// In MobileMenu.tsx
onClick={() => intlRouter.replace(pathname, { locale: 'en' })}
```

**Issue:** The `next-intl` router methods were not properly updating the URL path with the locale prefix.

---

## Solution

Updated all language switcher implementations to use direct URL navigation with the locale prefix in the path.

### New (Fixed) Implementation:
```typescript
// In navbar.tsx & TwoRowNavbar.tsx
const switchLocale = (newLocale: string) => {
  // Get the current pathname without the locale prefix
  const currentPath = pathname
  
  // Redirect to the new locale path
  window.location.href = `/${newLocale}${currentPath}`
}

// In MobileMenu.tsx
onClick={() => {
  window.location.href = `/en${pathname}`
  onClose()
}}
```

---

## Files Updated

### 1. ✅ `components/navbar.tsx`
- **Line ~34:** Updated `switchLocale` function
- **Used in:** Desktop language dropdown (3 buttons: EN, RU, ZH)
- **Used in:** Mobile menu language selector

### 2. ✅ `components/layout/TwoRowNavbar.tsx`
- **Line ~51:** Updated `switchLocale` function
- **Used in:** Alternative navbar language dropdown

### 3. ✅ `components/layout/MobileMenu.tsx`
- **Lines 135, 143, 151:** Updated onClick handlers for language buttons
- **Used in:** Mobile slide-out menu language selector

---

## How It Works Now

### Current Setup (from `i18n/routing.ts`):
```typescript
export const routing = defineRouting({
  locales: ['en', 'ru', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always'  // ← Locale is always in URL path
});
```

### URL Structure:
- English: `http://localhost:3005/en/`
- Russian: `http://localhost:3005/ru/`
- Chinese: `http://localhost:3005/zh/`

### Language Switch Flow:

1. **User clicks Russian flag** 🇷🇺
2. **JavaScript executes:** `window.location.href = '/ru' + currentPath`
3. **Browser navigates to:** `/ru/products` (if on products page)
4. **Next.js App Router:**
   - Detects locale from URL path (`ru`)
   - Loads Russian translations
   - Renders page in Russian ✅

---

## Testing the Fix

### Test 1: Desktop Language Switcher
1. Open website: `http://localhost:3005/en/`
2. Click the language dropdown in the navbar (top-right)
3. Click Chinese (🇨🇳 中文)
4. **Expected:** URL changes to `http://localhost:3005/zh/` and content is in Chinese

### Test 2: Mobile Language Switcher
1. Open website on mobile or resize browser to mobile size
2. Open the hamburger menu
3. Scroll to "Preferences" section at bottom
4. Click Chinese button
5. **Expected:** Menu closes, URL changes to `/zh/`, content is in Chinese

### Test 3: Navigation Persistence
1. Switch to Russian
2. Navigate to different pages (products, services, contact)
3. **Expected:** All pages stay in Russian, URLs have `/ru/` prefix

### Test 4: Deep Links
1. Manually type: `http://localhost:3005/zh/products`
2. **Expected:** Page loads in Chinese
3. Switch to English using language switcher
4. **Expected:** URL becomes `/en/products`, content in English

---

## Language Support

| Language | Code | Flag | URL Example |
|----------|------|------|-------------|
| English | `en` | 🇺🇸 | `/en/products` |
| Russian | `ru` | 🇷🇺 | `/ru/products` |
| Chinese | `zh` | 🇨🇳 | `/zh/products` |

---

## Locations of Language Switchers

### Desktop View:
1. **Main Navbar** (`navbar.tsx`)
   - Top-right corner
   - Dropdown with 3 options
   - Shows current language with flag

2. **Two-Row Navbar** (`TwoRowNavbar.tsx`)
   - Alternative navbar layout
   - Globe icon with language code
   - Dropdown menu

### Mobile View:
1. **Mobile Menu** (`MobileMenu.tsx`)
   - Inside hamburger menu
   - "Language" section with 3 buttons
   - Grid layout: EN | RU | ZH

2. **Navbar Mobile** (`navbar.tsx`)
   - "Preferences" section at bottom of mobile menu
   - 3 buttons with flags and labels

---

## Why Use `window.location.href`?

We use direct browser navigation instead of Next.js router because:

1. **Reliability:** Browser navigation always works with locale prefixes
2. **Simplicity:** No need to handle edge cases or router quirks
3. **Full Reload:** Ensures all translations are loaded fresh
4. **SEO-Friendly:** URLs are clean with locale in path (e.g., `/zh/products`)

**Trade-off:** Page reloads instead of client-side navigation, but this is acceptable for language changes (which should be infrequent).

---

## Configuration Files

The language switching relies on these configuration files:

### 1. `i18n/routing.ts`
```typescript
export const routing = defineRouting({
  locales: ['en', 'ru', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always'
});
```

### 2. `i18n/navigation.ts`
```typescript
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
```

### 3. `i18n/request.ts`
Handles server-side locale detection and message loading.

### 4. Translation Files:
```
messages/
├── en.json  # English translations
├── ru.json  # Russian translations
└── zh.json  # Chinese translations
```

---

## Related Components

### LocaleLink Component
All internal links use `LocaleLink` instead of Next.js `Link` to automatically include the locale prefix:

```typescript
import { LocaleLink } from '@/components/LocaleLink'

// Automatically becomes /en/products or /ru/products based on current locale
<LocaleLink href="/products">Products</LocaleLink>
```

### useLocale Hook
Get the current locale in any component:

```typescript
import { useLocale } from 'next-intl'

const locale = useLocale() // Returns: 'en', 'ru', or 'zh'
```

---

## Common Issues & Solutions

### Issue 1: Language doesn't change after clicking
**Cause:** JavaScript error or old cached version  
**Solution:** 
- Hard refresh: `Ctrl + F5`
- Clear browser cache
- Check browser console for errors

### Issue 2: URL shows `?locale=zh` instead of `/zh/`
**Cause:** Old code still loaded  
**Solution:**
- Restart development server: `npm run dev`
- Clear `.next` cache: `rm -rf .next && npm run build`

### Issue 3: Translations not showing
**Cause:** Translation files missing or incomplete  
**Solution:**
- Check `messages/` folder has `en.json`, `ru.json`, `zh.json`
- Verify translation keys exist in all files
- Restart dev server

### Issue 4: 404 error after switching language
**Cause:** Route doesn't exist for that locale  
**Solution:**
- Ensure all routes are in `app/[locale]/` directory
- Check middleware.ts includes all routes

---

## Production Deployment

After deploying this fix:

1. **Clear CDN cache** if using one (Cloudflare, etc.)
2. **Test all language switches** on production URL
3. **Verify SEO:**
   - Check `<html lang="xx">` attribute changes
   - Verify `hreflang` tags in page head
   - Test with Google Search Console

---

## Maintenance

### Adding a New Language

To add a new language (e.g., Spanish):

1. **Update routing:**
   ```typescript
   // i18n/routing.ts
   locales: ['en', 'ru', 'zh', 'es']
   ```

2. **Create translation file:**
   ```bash
   # Copy from English as template
   cp messages/en.json messages/es.json
   # Then translate the content
   ```

3. **Add to language switcher:**
   ```typescript
   // In navbar.tsx, add:
   <button onClick={() => switchLocale('es')}>
     <span>🇪🇸</span>
     <span>Español</span>
   </button>
   ```

4. **Restart server and test**

---

## Summary

✅ **Fixed:** Language switcher now correctly changes URL and content  
✅ **Method:** Direct browser navigation with locale prefix in path  
✅ **Components:** Updated navbar, TwoRowNavbar, and MobileMenu  
✅ **Result:** Users can switch between English, Russian, and Chinese seamlessly

**Test Command:**
```bash
npm run dev
# Then visit: http://localhost:3005/en/
# Click language switcher and verify URL changes to /ru/ or /zh/
```

---

**Last Updated:** 2026-08-14  
**Status:** ✅ Fixed and Tested  
**Impact:** Language switching now works correctly across entire website
