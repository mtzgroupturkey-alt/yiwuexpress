# Footer Address Translation Fix

## ✅ STATUS: FIXED

Footer now displays company address according to website language.

---

## Problem

The footer was showing the same company address on all language versions of the website:

- Visit `/en/` → Footer shows: "China, Zhejiang, China" ✅
- Visit `/ru/` → Footer shows: "China, Zhejiang, China" ❌ (should show Russian)
- Visit `/zh/` → Footer shows: "China, Zhejiang, China" ❌ (should show Chinese)

Even though translations were saved in `/admin/settings/company`, the footer wasn't using them.

---

## Root Cause

Two issues:

1. **API didn't include translations:** The `/api/settings` endpoint wasn't fetching translations from the database
2. **Footer didn't localize:** The footer component wasn't detecting the current locale and selecting the appropriate translation

---

## Solution

### 1. Updated `/api/settings` Endpoint

Added `translations` to the database query:

**Before:**
```typescript
const settings = await prisma.systemSettings.findFirst()
// ❌ No translations included
```

**After:**
```typescript
const settings = await prisma.systemSettings.findFirst({
  include: { translations: true }, // ✅ Include translations
})
```

### 2. Updated Footer Component

Added locale detection and translation lookup:

**Changes made:**

1. **Import `useLocale` hook:**
```typescript
import { useTranslations, useLocale } from 'next-intl'
```

2. **Get current locale:**
```typescript
const locale = useLocale() // Returns 'en', 'ru', or 'zh'
```

3. **Add translation helper function:**
```typescript
const getLocalizedValue = (key: string, fallback: string) => {
  // Try current locale first
  const localeTrans = translations.find(
    (t: any) => t.locale === locale && t.key === key
  )
  if (localeTrans && localeTrans.value) return localeTrans.value
  
  // Fallback to English
  const enTrans = translations.find(
    (t: any) => t.locale === 'en' && t.key === key
  )
  if (enTrans && enTrans.value) return enTrans.value
  
  // Last resort: use main field
  return fallback
}
```

4. **Use localized address:**
```typescript
setContactInfo({
  address: getLocalizedValue('companyAddress', data.settings.companyAddress || 'China'),
  phone: data.settings.companyPhone || '+86 579 8555 1234',
  email: data.settings.companyEmail || 'info@globaltrade.com'
})
```

5. **Re-fetch on locale change:**
```typescript
useEffect(() => {
  // ... fetch settings
}, [locale]) // ✅ Dependency on locale
```

---

## How It Works Now

### Complete Flow:

1. **User visits `/ru/` (Russian website)**
   - Footer component mounts
   - `useLocale()` returns `'ru'`

2. **Footer fetches settings:**
   - API call: `GET /api/settings`
   - API returns: `{ settings: { companyAddress: 'China', translations: [...] } }`

3. **Translations array looks like:**
```typescript
[
  { locale: 'en', key: 'companyAddress', value: '123 Trade Street, Yiwu, China' },
  { locale: 'ru', key: 'companyAddress', value: 'ул. Торговая 123, Иу, Китай' },
  { locale: 'zh', key: 'companyAddress', value: '中国浙江省义乌市贸易街123号' }
]
```

4. **Footer calls `getLocalizedValue('companyAddress', ...)`:**
   - Searches for: `locale='ru'` AND `key='companyAddress'`
   - Finds: `{ locale: 'ru', key: 'companyAddress', value: 'ул. Торговая 123, Иу, Китай' }`
   - Returns: `'ул. Торговая 123, Иу, Китай'`

5. **Footer displays:**
   - 📍 **Address:** ул. Торговая 123, Иу, Китай ✅ (Russian)

6. **User switches to Chinese (`/zh/`):**
   - `locale` changes to `'zh'`
   - `useEffect` triggers (dependency: `[locale]`)
   - Footer re-fetches settings
   - `getLocalizedValue` now returns Chinese address
   - Footer updates to show: 中国浙江省义乌市贸易街123号 ✅

---

## Translation Priority (Fallback Chain)

```
1. Try requested locale (e.g., 'ru')
   ↓ If found: Use this ✅
   
2. Else, try English locale ('en')
   ↓ If found: Use English ✅
   
3. Else, use main field from SystemSettings.companyAddress
   ↓ Last resort fallback ✅
```

This ensures the footer always displays something, never blank.

---

## Testing

### Test 1: English Address

**Steps:**
1. Visit: `http://localhost:3001/en/`
2. Scroll to footer
3. Look at the address in "Get In Touch" section

**Expected:**
- 📍 **Address:** 123 Trade Street, Yiwu, Zhejiang, China (or whatever you saved in EN tab)

### Test 2: Russian Address

**Steps:**
1. Visit: `http://localhost:3001/ru/`
2. Scroll to footer
3. Look at the address

**Expected:**
- 📍 **Адрес:** ул. Торговая 123, Иу, Чжэцзян, Китай (Russian address from admin)

### Test 3: Chinese Address

**Steps:**
1. Visit: `http://localhost:3001/zh/`
2. Scroll to footer
3. Look at the address

**Expected:**
- 📍 **地址:** 中国浙江省义乌市贸易街123号 (Chinese address from admin)

### Test 4: Language Switching

**Steps:**
1. Start at: `http://localhost:3001/en/`
2. Scroll to footer → Note the address (English)
3. Switch language to Russian (language dropdown)
4. URL changes to `/ru/`
5. Scroll to footer

**Expected:**
- Address automatically updates to Russian text ✅
- No page refresh needed (React state update)

### Test 5: Fallback Behavior

**Steps:**
1. Go to: `http://localhost:3001/admin/settings/company`
2. Fill ONLY English address (leave RU and ZH empty)
3. Save
4. Visit: `http://localhost:3001/ru/`
5. Check footer address

**Expected:**
- Shows English address as fallback ✅
- Not blank

---

## Database Verification

Check translations in database:

```sql
-- Get company address translations
SELECT * FROM "SystemSettingTranslation"
WHERE "key" = 'companyAddress'
AND "systemSettingId" = (SELECT id FROM "SystemSettings" LIMIT 1)
ORDER BY locale;
```

**Expected result:**
```
| locale | key             | value                                  |
|--------|-----------------|----------------------------------------|
| en     | companyAddress  | 123 Trade Street, Yiwu, Zhejiang, China |
| ru     | companyAddress  | ул. Торговая 123, Иу, Чжэцзян, Китай   |
| zh     | companyAddress  | 中国浙江省义乌市贸易街123号               |
```

---

## API Response Example

**Request:**
```
GET /api/settings
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "id": "setting-123",
    "companyName": "Global Trade",
    "companyAddress": "China",
    "companyPhone": "+86 579 8555 1234",
    "companyEmail": "info@globaltrade.com",
    "translations": [
      {
        "id": "trans-1",
        "systemSettingId": "setting-123",
        "locale": "en",
        "key": "companyAddress",
        "value": "123 Trade Street, Yiwu, Zhejiang, China"
      },
      {
        "id": "trans-2",
        "systemSettingId": "setting-123",
        "locale": "ru",
        "key": "companyAddress",
        "value": "ул. Торговая 123, Иу, Чжэцзян, Китай"
      },
      {
        "id": "trans-3",
        "systemSettingId": "setting-123",
        "locale": "zh",
        "key": "companyAddress",
        "value": "中国浙江省义乌市贸易街123号"
      }
    ]
  }
}
```

---

## Files Changed

### Modified:

1. **`app/api/settings/route.ts`**
   - Added `include: { translations: true }` to database query
   - API now returns translations array

2. **`components/footer.tsx`**
   - Added `useLocale` import
   - Added `locale` variable to get current language
   - Added `getLocalizedValue` helper function
   - Updated contact info state to use localized address
   - Changed `useEffect` dependency to `[locale]` to refetch on language change

---

## Browser Console Verification

### Check Network Request

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Visit `/ru/`
4. Find request: `settings`
5. Click on it → **Preview** tab

**Expected response:**
```json
{
  "success": true,
  "settings": {
    "companyAddress": "China",
    "translations": [
      { "locale": "ru", "key": "companyAddress", "value": "ул. Торговая 123..." }
    ]
  }
}
```

### Check State Update

1. Open **React DevTools** (if installed)
2. Find `Footer` component
3. Look at `contactInfo` state

**Expected:**
- English site: `address: "123 Trade Street..."`
- Russian site: `address: "ул. Торговая 123..."`
- Chinese site: `address: "中国浙江省义乌市..."`

---

## Success Criteria

✅ Footer shows English address on `/en/` pages  
✅ Footer shows Russian address on `/ru/` pages  
✅ Footer shows Chinese address on `/zh/` pages  
✅ Address updates automatically when switching languages  
✅ Fallback to English if translation missing  
✅ Fallback to main field if no translations at all  
✅ No console errors  
✅ API includes translations in response

---

## Future Enhancements

### Also Localize Company Name & Description

Currently only address is localized. You could also localize:

```typescript
setCompanyName(getLocalizedValue('companyName', data.settings.companyName))
```

Add similar logic for:
- Company description (if displayed in footer)
- Company name (displayed in footer logo section)

### Cache Settings

Add caching to reduce API calls:

```typescript
import { useQuery } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['settings', locale],
  queryFn: () => fetch('/api/settings').then(r => r.json()),
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
})
```

---

## Troubleshooting

### Problem: Address doesn't change when switching language

**Cause:** useEffect not running on locale change

**Solution:** Check that dependency array includes `[locale]`:
```typescript
useEffect(() => {
  // ... fetch logic
}, [locale]) // ✅ Must include locale
```

### Problem: Shows English address for all languages

**Cause:** Translations not saved in database

**Solution:**
1. Go to `/admin/settings/company`
2. Fill in RU and ZH address fields
3. Click Save
4. Reload website

### Problem: Console error: "Cannot read property 'find' of undefined"

**Cause:** `translations` array is undefined

**Solution:** Add fallback:
```typescript
const translations = data.settings.translations || []
```

---

**Last Updated:** 2026-08-14  
**Status:** ✅ Fixed and Ready for Testing  
**Impact:** Footer now shows localized company address based on website language
