# Testing Homepage Product Card Translations

## What Was Fixed

Product cards on the homepage (Featured Products and New Arrivals sections) were not showing translated product names and descriptions when the website language was changed to Russian or Chinese.

## Changes Made

1. **FeaturedProducts.tsx** - Added `useLocale()` hook and pass `locale` parameter to API
2. **NewArrivals.tsx** - Added `useLocale()` hook and pass `locale` parameter to API
3. Both components include `locale` in React Query cache keys for proper invalidation

## How to Test

### Prerequisites

1. Make sure you have products with translations in the database:
   - Go to `/admin/products`
   - Edit a product
   - Click "Auto-Translate" button to generate Russian and Chinese translations
   - Save the product
   - Repeat for several products (at least 8 for proper testing)

### Test Steps

#### 1. Test Featured Products Section

1. **Start dev server:**
   ```bash
   cd ecommerce-monorepo/web
   npm run dev
   ```

2. **Open homepage in English:**
   - Navigate to `http://localhost:3001/en/`
   - Scroll to "Featured Products" section
   - **VERIFY:** Product names appear in English

3. **Switch to Russian:**
   - Click language switcher → Select "Русский"
   - URL should change to `/ru/`
   - Scroll to "Рекомендуемые товары" (Featured Products)
   - **VERIFY:** Product names appear in Russian
   - **VERIFY:** Product descriptions appear in Russian

4. **Switch to Chinese:**
   - Click language switcher → Select "中文"
   - URL should change to `/zh/`
   - Scroll to "推荐产品" (Featured Products)
   - **VERIFY:** Product names appear in Chinese
   - **VERIFY:** Product descriptions appear in Chinese

#### 2. Test New Arrivals Section

1. **English:**
   - Navigate to `http://localhost:3001/en/`
   - Scroll to "New Arrivals" section
   - **VERIFY:** Product names appear in English

2. **Russian:**
   - Navigate to `http://localhost:3001/ru/`
   - Scroll to "Новинки" (New Arrivals)
   - **VERIFY:** Product names appear in Russian
   - **VERIFY:** Product descriptions appear in Russian

3. **Chinese:**
   - Navigate to `http://localhost:3001/zh/`
   - Scroll to "新品上市" (New Arrivals)
   - **VERIFY:** Product names appear in Chinese
   - **VERIFY:** Product descriptions appear in Chinese

#### 3. Test Cache Invalidation

1. **Open homepage in English:**
   - Navigate to `http://localhost:3001/en/`
   - Note the product names (they should be in English)

2. **Switch to Russian:**
   - Change URL to `/ru/`
   - **VERIFY:** Products immediately show Russian names (no refresh needed)
   - **VERIFY:** React Query refetches data with `locale=ru` parameter

3. **Switch to Chinese:**
   - Change URL to `/zh/`
   - **VERIFY:** Products immediately show Chinese names (no refresh needed)
   - **VERIFY:** React Query refetches data with `locale=zh` parameter

#### 4. Test Network Requests

1. **Open browser DevTools → Network tab**

2. **Load English homepage:**
   - Navigate to `http://localhost:3001/en/`
   - **VERIFY:** Request to `/api/products?featured=true&limit=8&locale=en`
   - **VERIFY:** Request to `/api/products?sort=newest&limit=8&locale=en`

3. **Switch to Russian:**
   - Navigate to `http://localhost:3001/ru/`
   - **VERIFY:** Request to `/api/products?featured=true&limit=8&locale=ru`
   - **VERIFY:** Request to `/api/products?sort=newest&limit=8&locale=ru`

4. **Switch to Chinese:**
   - Navigate to `http://localhost:3001/zh/`
   - **VERIFY:** Request to `/api/products?featured=true&limit=8&locale=zh`
   - **VERIFY:** Request to `/api/products?sort=newest&limit=8&locale=zh`

### Expected Results

✅ **English (`/en/`):**
- Featured Products section shows English product names
- New Arrivals section shows English product names
- API requests include `locale=en` parameter

✅ **Russian (`/ru/`):**
- "Рекомендуемые товары" section shows Russian product names
- "Новинки" section shows Russian product names
- API requests include `locale=ru` parameter

✅ **Chinese (`/zh/`):**
- "推荐产品" section shows Chinese product names
- "新品上市" section shows Chinese product names
- API requests include `locale=zh` parameter

### Fallback Behavior

If a product doesn't have a translation for the requested locale:
1. API tries the requested locale (e.g., `ru`)
2. Falls back to English (`en`)
3. Falls back to legacy fields (`product.name`, `product.description`)

This ensures products always display something, never blank.

## Troubleshooting

### Problem: Products still show English in other languages

**Solution:**
1. Check if products have translations in database:
   ```sql
   SELECT * FROM "ProductTranslation" WHERE locale IN ('ru', 'zh');
   ```
2. If empty, use Auto-Translate feature in admin panel
3. Clear React Query cache: Hard refresh (Ctrl+Shift+R) or clear browser cache

### Problem: Language switch doesn't update product cards

**Solution:**
1. Check React Query cache keys include `locale`
2. Verify `useLocale()` hook returns correct locale
3. Check Network tab for API requests with correct `locale` parameter

### Problem: Some products show English, some show translated

**Solution:**
- This is expected! Not all products have translations
- Use Auto-Translate in admin panel to create translations
- Products without translations fall back to English

## Production Testing

Once deployed to production (`dromkok.com`):

1. **Test English:** https://dromkok.com/en/
2. **Test Russian:** https://dromkok.com/ru/
3. **Test Chinese:** https://dromkok.com/zh/

**VERIFY:**
- Product cards show correct language on homepage
- Language switcher updates product cards immediately
- No console errors
- Fast page load times (caching works)

## Related Files

- `ecommerce-monorepo/web/components/home/FeaturedProducts.tsx`
- `ecommerce-monorepo/web/components/home/NewArrivals.tsx`
- `ecommerce-monorepo/web/app/api/products/route.ts`
- `ecommerce-monorepo/web/lib/utils/localize.ts`
- `ecommerce-monorepo/web/PRODUCT_CARDS_TRANSLATION_FIX.md`

## Success Criteria

✅ Featured Products section displays product names in selected language
✅ New Arrivals section displays product names in selected language
✅ Language switcher immediately updates product card content
✅ API requests include correct `locale` parameter
✅ React Query cache invalidates on language change
✅ Fallback to English works when translations missing
✅ No console errors or warnings
✅ Works on both development and production environments
