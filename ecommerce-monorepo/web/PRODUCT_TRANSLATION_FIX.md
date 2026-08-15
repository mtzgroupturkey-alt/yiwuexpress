# Product Translation Fix

## Problem

When editing a product at `/admin/products/[id]/edit`:
1. Auto-translate button generates translations for Russian and Chinese
2. Translations appear in the form
3. **BUT** when saving, translations were not persisting to the database
4. When reopening the product, translations were gone

**Root Cause:** The GET endpoint wasn't fetching translations from the database, so they appeared empty even after being saved.

---

## Solution

Updated the API endpoint to include translations in both:
1. **GET** - When loading a product for editing
2. **PUT** - When returning the updated product

### Files Fixed:

✅ **`app/api/admin/products/[id]/route.ts`**
- Added `translations: true` to the `include` clause in GET endpoint
- Added `translations: true` to the `include` clause after PUT update

---

## How Product Translations Work

### Database Structure

The system uses a **dual-write** approach (Expand-and-Contract pattern):

```typescript
Product {
  id: string
  name: string          // ← Legacy field (English only)
  description: string   // ← Legacy field (English only)
  // ... other fields
}

ProductTranslation {
  id: string
  productId: string
  locale: 'en' | 'ru' | 'zh'
  name: string
  description: string
}
```

**Why dual-write?**
- `Product.name` and `Product.description` are **legacy fields** (Phase 1)
- They're kept in sync with the **English** (`en`) translation
- This ensures non-migrated code paths still work
- New code reads from `ProductTranslation` table

---

## Translation Flow

### 1. Loading Product for Edit (GET)

**Before Fix:**
```typescript
// ❌ Translations not included
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    attributeValues: { include: { attribute: true } }
    // ❌ translations missing!
  }
})
```

**After Fix:**
```typescript
// ✅ Translations included
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    attributeValues: { include: { attribute: true } },
    translations: true  // ✅ Now fetches all translations
  }
})
```

**Result:**
- API now returns `translations` array:
  ```json
  {
    "id": "product-123",
    "name": "Product Name",
    "translations": [
      { "locale": "en", "name": "Product Name", "description": "..." },
      { "locale": "ru", "name": "Название продукта", "description": "..." },
      { "locale": "zh", "name": "产品名称", "description": "..." }
    ]
  }
  ```

### 2. Frontend Loads Translations

**In `page.tsx` (lines ~171-183):**
```typescript
// Seed translation state: prefer existing translation rows,
// fall back to legacy name/description for 'en'
const initialTranslations: TranslationPayload = {
  en: { name: product.name || '', description: product.description || '' },
  ru: { name: '', description: '' },
  zh: { name: '', description: '' }
}

if (product.translations && Array.isArray(product.translations)) {
  product.translations.forEach((t: any) => {
    const currentLocale = t.locale as 'en' | 'ru' | 'zh'
    if (['en', 'ru', 'zh'].includes(currentLocale)) {
      initialTranslations[currentLocale] = {
        name: t.name || '',
        description: t.description || ''
      }
    }
  })
}

setTranslations(initialTranslations)
```

### 3. User Clicks "Auto-Translate"

**In `ProductTranslationForm.tsx`:**
- Detects English (`en`) has content
- Calls auto-translate API for Russian and Chinese
- Updates form state with translated text
- User can edit before saving

### 4. Saving Product (PUT)

**In `page.tsx` onSubmit (lines ~204-230):**
```typescript
const productData = {
  ...data,
  // Dual-write: English translation synced to legacy fields
  name: translations.en.name,
  description: translations.en.description || null,
  translations,  // ← All translations sent to API
  // ... other fields
}

const response = await fetch(`/api/admin/products/${params.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(productData)
})
```

**In API route (lines ~128-156):**
```typescript
// Normalize translations from frontend
const incomingTranslations = Array.isArray(translations)
  ? translations
  : Object.entries(translations).map(([locale, value]) => ({
      locale,
      name: value?.name,
      description: value?.description ?? null
    }))

// Dual-write: English to legacy fields
const englishEntry = incomingTranslations.find((t) => t.locale === 'en')
if (englishEntry) {
  productData.name = englishEntry.name
  productData.description = englishEntry.description
}

// Upsert all translations
const translationUpserts = incomingTranslations
  .filter((t) => t.locale)
  .map((t) => ({
    where: { productId_locale: { productId: id, locale: t.locale } },
    create: { productId: id, locale: t.locale, name: t.name ?? '', description: t.description ?? null },
    update: { name: t.name ?? '', description: t.description ?? null }
  }))

// Atomic transaction: update product + all translations
await prisma.$transaction([
  prisma.product.update({ where: { id }, data: productData }),
  ...translationUpserts.map((u) => prisma.productTranslation.upsert(u))
])
```

### 5. Return Updated Product

**Before Fix:**
```typescript
// ❌ Translations not included in response
const productWithAttributes = await prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    attributeValues: { include: { attribute: true } }
  }
})
```

**After Fix:**
```typescript
// ✅ Translations included in response
const productWithAttributes = await prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    attributeValues: { include: { attribute: true } },
    translations: true  // ✅ Returns all saved translations
  }
})
```

---

## Testing the Fix

### Test 1: Save and Reload Translations

**Steps:**
1. Go to `/admin/products`
2. Click "Edit" on any product
3. In the translation form, click "✨ Auto-Translate"
4. Wait for Russian and Chinese translations to appear
5. Click "Update Product"
6. Go back to products list
7. Click "Edit" on the same product again

**Expected Result:**
- ✅ Russian and Chinese translations are still there
- ✅ Not empty anymore
- ✅ Same text you saved

**Before Fix:**
- ❌ Translations were empty after reload
- ❌ Had to auto-translate every time

### Test 2: Manual Translation Edit

**Steps:**
1. Edit a product
2. Switch to "RU" tab in translation form
3. Manually type Russian text
4. Switch to "ZH" tab
5. Manually type Chinese text
6. Save product
7. Reload page

**Expected Result:**
- ✅ Your manually typed translations are preserved
- ✅ Exact text you entered is shown

### Test 3: Update Existing Translation

**Steps:**
1. Edit a product that already has translations
2. Modify the Russian name
3. Save
4. Reload

**Expected Result:**
- ✅ Russian name shows your new text
- ✅ Other languages unchanged

### Test 4: Database Verification

**Check in database:**
```sql
SELECT * FROM "ProductTranslation" 
WHERE "productId" = 'your-product-id';
```

**Expected Result:**
```
| id | productId | locale | name | description |
|----|-----------|--------|------|-------------|
| 1  | prod-123  | en     | Product Name | English description |
| 2  | prod-123  | ru     | Название | Русское описание |
| 3  | prod-123  | zh     | 产品名称 | 中文描述 |
```

---

## Frontend Translation Component

### ProductTranslationForm Component

Location: `components/admin/ProductTranslationForm.tsx`

**Features:**
- Tabbed interface (EN, RU, ZH)
- Auto-translate button
- Name and description fields for each language
- Validation (English required)

**Props:**
```typescript
interface ProductTranslationFormProps {
  initialValues: TranslationPayload  // { en: {...}, ru: {...}, zh: {...} }
  onChange: (translations: TranslationPayload) => void
  disabled?: boolean
}
```

**Usage in Edit Page:**
```tsx
<ProductTranslationForm
  initialValues={translations}
  onChange={setTranslations}
  disabled={submitting}
/>
```

---

## API Endpoints

### GET `/api/admin/products/[id]`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "sku": "SKU-001",
    "name": "Product Name",
    "description": "English description",
    "price": 99.99,
    "translations": [
      {
        "id": "trans-1",
        "locale": "en",
        "name": "Product Name",
        "description": "English description"
      },
      {
        "id": "trans-2",
        "locale": "ru",
        "name": "Название продукта",
        "description": "Русское описание"
      },
      {
        "id": "trans-3",
        "locale": "zh",
        "name": "产品名称",
        "description": "中文描述"
      }
    ],
    "category": {...},
    "attributeValues": [...]
  }
}
```

### PUT `/api/admin/products/[id]`

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "English description",
  "translations": {
    "en": {
      "name": "Product Name",
      "description": "English description"
    },
    "ru": {
      "name": "Название продукта",
      "description": "Русское описание"
    },
    "zh": {
      "name": "产品名称",
      "description": "中文描述"
    }
  },
  "price": 99.99,
  "stock": 100
  // ... other fields
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "name": "Product Name",
    "translations": [
      { "locale": "en", "name": "Product Name", "description": "..." },
      { "locale": "ru", "name": "Название продукта", "description": "..." },
      { "locale": "zh", "name": "产品名称", "description": "..." }
    ],
    // ... full product data
  },
  "message": "Product updated successfully"
}
```

---

## Prisma Schema

```prisma
model Product {
  id                String               @id @default(cuid())
  name              String               // ← Legacy field (synced with en translation)
  description       String?              // ← Legacy field (synced with en translation)
  translations      ProductTranslation[] // ← New translation table
  // ... other fields
}

model ProductTranslation {
  id          String  @id @default(cuid())
  productId   String
  locale      String  // 'en', 'ru', or 'zh'
  name        String
  description String?
  
  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([productId, locale])
  @@index([productId])
  @@index([locale])
}
```

---

## Common Issues & Solutions

### Issue 1: Translations not showing after save

**Cause:** GET endpoint not fetching translations  
**Solution:** ✅ Fixed - Added `translations: true` to include

**Before:**
```typescript
include: { category: true }
```

**After:**
```typescript
include: { category: true, translations: true }
```

### Issue 2: Translations not saving at all

**Cause:** PUT endpoint not processing translations  
**Solution:** Already working correctly - uses `prisma.$transaction` to save all translations atomically

### Issue 3: English translation not syncing to legacy fields

**Cause:** Missing dual-write logic  
**Solution:** Already implemented:
```typescript
const englishEntry = incomingTranslations.find((t) => t.locale === 'en')
if (englishEntry) {
  productData.name = englishEntry.name
  productData.description = englishEntry.description
}
```

### Issue 4: Auto-translate not working

**Cause:** API key or endpoint issue  
**Solution:** Check auto-translate API configuration (separate from this fix)

---

## Migration Path (Expand-and-Contract)

### Phase 1: Dual Write (Current)
- ✅ Write to both `Product.name` and `ProductTranslation` table
- ✅ Old code reads from `Product.name`
- ✅ New code reads from `ProductTranslation`
- ✅ Both code paths work

### Phase 2: Migrate Reads (Future)
- All code updated to read from `ProductTranslation`
- `Product.name` still written for safety

### Phase 3: Drop Legacy (Future)
- Remove `Product.name` and `Product.description` columns
- Only `ProductTranslation` table used

**Currently in Phase 1** - Safe to deploy, no breaking changes.

---

## Summary

✅ **Fixed:** GET endpoint now includes translations  
✅ **Fixed:** PUT response now includes translations  
✅ **Result:** Translations persist and reload correctly  
✅ **Tested:** Auto-translate → Save → Reload → Still there  

### What Changed:
1. Added `translations: true` to GET endpoint include
2. Added `translations: true` to PUT response include
3. Created comprehensive documentation

### User Impact:
- ✅ Translations now save permanently
- ✅ No need to re-translate every time
- ✅ Edit page shows existing translations
- ✅ Auto-translate button works as expected

---

**Last Updated:** 2026-08-14  
**Status:** ✅ Fixed and Tested  
**Impact:** Product translations now persist correctly to database
