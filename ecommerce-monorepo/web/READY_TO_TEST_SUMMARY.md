# ✅ Product Cards Translation - Ready to Test

## What Was Fixed

Product cards on the homepage were showing English text even when the website was in Russian or Chinese. This is now fixed!

## Changes Completed

✅ **FeaturedProducts.tsx** - Now passes `locale` parameter to API
✅ **NewArrivals.tsx** - Now passes `locale` parameter to API  
✅ Both components include `locale` in React Query cache keys
✅ API endpoint already had localization logic (no changes needed)
✅ Documentation created

## Test Now

### 1. Start Dev Server

```bash
cd ecommerce-monorepo/web
npm run dev
```

### 2. Test English (Baseline)

Open: `http://localhost:3001/en/`

**VERIFY:**
- Featured Products section shows English product names
- New Arrivals section shows English product names

### 3. Test Russian

Open: `http://localhost:3001/ru/`

**VERIFY:**
- "Рекомендуемые товары" section shows Russian product names
- "Новые поступления" section shows Russian product names
- Product descriptions are in Russian

### 4. Test Chinese

Open: `http://localhost:3001/zh/`

**VERIFY:**
- "推荐产品" section shows Chinese product names
- "新品上市" section shows Chinese product names
- Product descriptions are in Chinese

### 5. Test Language Switching

1. Start at: `http://localhost:3001/en/`
2. Click language switcher → Select "Русский"
3. URL changes to `/ru/`
4. **VERIFY:** Product cards immediately update to Russian (no page refresh needed)

## Important Notes

### Products Need Translations

For products to display in Russian/Chinese, they must have translations in the database.

**How to add translations:**

1. Go to: `http://localhost:3001/admin/products`
2. Click "Edit" on any product
3. Click "✨ Auto-Translate" button (this generates Russian and Chinese from English)
4. Click "Save"
5. Repeat for all products

### Fallback Behavior

If a product doesn't have a Russian/Chinese translation:
- It will display in English (fallback)
- This is expected behavior
- Not a bug!

## Network Verification

Open browser DevTools → Network tab:

**English (`/en/`):**
- Request: `/api/products?featured=true&limit=8&locale=en`
- Response: Products with English names

**Russian (`/ru/`):**
- Request: `/api/products?featured=true&limit=8&locale=ru`
- Response: Products with Russian names

**Chinese (`/zh/`):**
- Request: `/api/products?featured=true&limit=8&locale=zh`
- Response: Products with Chinese names

## Success Criteria

✅ Featured Products show correct language  
✅ New Arrivals show correct language  
✅ Language switcher updates products immediately  
✅ API requests include `locale=XX` parameter  
✅ No console errors  
✅ Fallback to English works when translation missing

## Troubleshooting

### Products Still Showing English?

**Solution 1:** Add translations using Auto-Translate in admin panel

**Solution 2:** Hard refresh browser (Ctrl + Shift + R)

**Solution 3:** Restart dev server:
```bash
cd ecommerce-monorepo/web
npm run dev
```

### Language Switch Doesn't Update Products?

**Check:**
1. URL actually changes (e.g., `/en/` → `/ru/`)
2. Network tab shows new API request with `locale=ru`
3. React Query cache key includes locale

**Solution:** This should work automatically - the fix includes locale in cache keys

## Files Changed

1. `components/home/FeaturedProducts.tsx` - Added locale parameter
2. `components/home/NewArrivals.tsx` - Added locale parameter

## Documentation

- **This file** - Quick testing guide
- `PRODUCT_CARDS_TRANSLATION_FIX.md` - Detailed fix explanation
- `TEST_HOMEPAGE_TRANSLATIONS.md` - Comprehensive testing procedures

## Next Steps

1. **Test locally** using steps above
2. **Add translations** to products using Auto-Translate
3. **Deploy to production** if tests pass
4. **Test on production:** https://dromkok.com/en/, /ru/, /zh/

## Questions?

- How does localization work? → See `PRODUCT_CARDS_TRANSLATION_FIX.md`
- Need detailed test cases? → See `TEST_HOMEPAGE_TRANSLATIONS.md`
- Want to understand the code? → See `lib/utils/localize.ts`

---

**Status:** ✅ Implementation Complete  
**Date:** 2026-08-14  
**Ready:** Yes - Start Testing Now!
