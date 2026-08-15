# Test Product Translation Fix

## Quick Test (2 minutes)

### Step 1: Edit a Product
1. Go to `http://localhost:3005/admin/products`
2. Click "Edit" on any product
3. You'll see the translation form with tabs: **EN | RU | ZH**

### Step 2: Use Auto-Translate
1. Make sure the **EN (English)** tab has a product name and description
2. Click the **"✨ Auto-Translate"** button
3. Wait 2-3 seconds
4. Switch to **RU** tab → Should show Russian translation
5. Switch to **ZH** tab → Should show Chinese translation

### Step 3: Save
1. Click **"Update Product"** button at the bottom
2. Wait for "Product updated successfully!" message
3. You'll be redirected to the products list

### Step 4: Reload and Verify (THE IMPORTANT PART!)
1. Find the same product again
2. Click **"Edit"** on it
3. Check the translation tabs:
   - **EN tab** → Should show English text ✅
   - **RU tab** → Should show Russian text ✅
   - **ZH tab** → Should show Chinese text ✅

**Before Fix:**
- ❌ RU and ZH tabs would be EMPTY
- ❌ Had to auto-translate every time

**After Fix:**
- ✅ All translations are preserved
- ✅ Exact text you saved is shown

---

## Detailed Test Cases

### Test Case 1: Auto-Translate and Save

**Steps:**
1. Edit product: `http://localhost:3005/admin/products/[id]/edit`
2. Ensure EN tab has content:
   - Name: "Wireless Bluetooth Headphones"
   - Description: "High-quality wireless headphones..."
3. Click "✨ Auto-Translate"
4. Check RU tab:
   - Name should be: "Беспроводные Bluetooth наушники"
   - Description should be in Russian
5. Check ZH tab:
   - Name should be: "无线蓝牙耳机"
   - Description should be in Chinese
6. Click "Update Product"
7. Wait for success message
8. Go back to products list
9. Edit the same product again
10. Check all three tabs

**Expected Result:**
- ✅ EN tab: Original English text
- ✅ RU tab: Russian translation (same as before save)
- ✅ ZH tab: Chinese translation (same as before save)

---

### Test Case 2: Manual Translation Entry

**Steps:**
1. Edit a product
2. Go to RU tab
3. Manually type:
   - Name: "Тестовый продукт"
   - Description: "Это тестовое описание"
4. Go to ZH tab
5. Manually type:
   - Name: "测试产品"
   - Description: "这是测试描述"
6. Save product
7. Reload page
8. Check translations

**Expected Result:**
- ✅ Your manually typed text is preserved
- ✅ Exactly what you entered

---

### Test Case 3: Update Only One Language

**Steps:**
1. Edit a product that has all 3 translations
2. Go to RU tab
3. Change the Russian name to something else
4. Don't touch EN or ZH tabs
5. Save
6. Reload
7. Check all tabs

**Expected Result:**
- ✅ RU tab: Shows your new text
- ✅ EN tab: Unchanged (original text)
- ✅ ZH tab: Unchanged (original text)

---

### Test Case 4: Empty Translation

**Steps:**
1. Edit a product
2. Go to RU tab
3. Clear the name field (leave it empty)
4. Save
5. Reload

**Expected Result:**
- ✅ RU name is empty (as you set it)
- ✅ EN and ZH are unchanged

---

### Test Case 5: New Product with Translations

**Steps:**
1. Go to `/admin/products/new`
2. Fill out EN tab:
   - Name: "New Test Product"
   - Description: "This is a new product"
3. Click "✨ Auto-Translate"
4. Verify RU and ZH tabs have content
5. Fill out other required fields (SKU, price, etc.)
6. Click "Create Product"
7. Find the product in the list
8. Edit it
9. Check translations

**Expected Result:**
- ✅ All three translations saved correctly
- ✅ Can see them when editing

---

## Database Verification

If you want to verify in the database directly:

### Check ProductTranslation Table

```bash
# In your terminal (if using psql)
psql -U postgres -d ecommerce

# Or use Prisma Studio
cd ecommerce-monorepo/web
npx prisma studio
```

**In Prisma Studio:**
1. Click "ProductTranslation" in the left sidebar
2. Find rows where `productId` matches your product
3. You should see 3 rows (one for each locale):

```
| id   | productId | locale | name                           | description    |
|------|-----------|--------|--------------------------------|----------------|
| abc1 | prod-123  | en     | Wireless Bluetooth Headphones  | High-quality...|
| abc2 | prod-123  | ru     | Беспроводные Bluetooth наушники| Высокое...     |
| abc3 | prod-123  | zh     | 无线蓝牙耳机                     | 高品质...      |
```

---

## API Response Verification

### Check GET Response

**Test manually:**
```bash
curl http://localhost:3005/api/admin/products/[your-product-id]
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "name": "Wireless Bluetooth Headphones",
    "description": "High-quality...",
    "translations": [
      {
        "id": "trans-1",
        "locale": "en",
        "name": "Wireless Bluetooth Headphones",
        "description": "High-quality..."
      },
      {
        "id": "trans-2",
        "locale": "ru",
        "name": "Беспроводные Bluetooth наушники",
        "description": "Высокое качество..."
      },
      {
        "id": "trans-3",
        "locale": "zh",
        "name": "无线蓝牙耳机",
        "description": "高品质..."
      }
    ]
  }
}
```

**Before Fix:**
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "name": "Wireless Bluetooth Headphones",
    "translations": []  // ❌ Empty!
  }
}
```

---

## Browser Console Check

### Open DevTools
1. Press `F12` in your browser
2. Go to **Network** tab
3. Edit a product
4. Find the GET request to `/api/admin/products/[id]`
5. Click on it
6. Click **Preview** tab
7. Expand `data` → `translations`

**Should see:**
```
translations: Array(3)
  0: {id: "...", locale: "en", name: "...", description: "..."}
  1: {id: "...", locale: "ru", name: "...", description: "..."}
  2: {id: "...", locale: "zh", name: "...", description: "..."}
```

---

## Common Issues

### Issue: Translations still empty after reload

**Possible Causes:**
1. Server not restarted after code changes
2. Cache issue
3. Database connection issue

**Solutions:**
```bash
# 1. Restart dev server
cd ecommerce-monorepo/web
npm run dev

# 2. Clear Next.js cache
rm -rf .next
npm run dev

# 3. Check database
npx prisma studio
# Look at ProductTranslation table
```

### Issue: Auto-translate button doesn't work

**This is a separate issue** - The fix here is about **saving** translations, not generating them.

If auto-translate doesn't work:
- Check the auto-translate API configuration
- Check browser console for errors
- Try manually entering translations instead

### Issue: Only English shows, RU/ZH empty

**Check:**
1. Did you click "Save" after auto-translating?
2. Did you wait for the success message?
3. Check browser console for errors during save

**Try:**
```bash
# Check server logs
cd ecommerce-monorepo/web
npm run dev
# Watch the terminal for errors
```

---

## Success Criteria

The fix is successful if:

✅ Auto-translate generates RU and ZH translations  
✅ Clicking "Save" shows success message  
✅ Reloading the edit page shows RU and ZH translations  
✅ Translations persist after closing browser  
✅ Can edit and re-save translations  
✅ Database has ProductTranslation rows  

The fix FAILS if:

❌ Translations empty after reload  
❌ Only EN shows after save  
❌ Console shows errors when saving  
❌ Database has no ProductTranslation rows  

---

## Quick Checklist

Before marking as complete:

- [ ] Edited a product
- [ ] Used auto-translate
- [ ] Saved the product
- [ ] Reloaded the edit page
- [ ] Verified RU tab has Russian text
- [ ] Verified ZH tab has Chinese text
- [ ] Manually edited a translation
- [ ] Saved and reloaded
- [ ] Verified manual edit persisted
- [ ] Checked database (optional)
- [ ] No console errors

---

## Ready to Test?

1. Start your dev server:
   ```bash
   cd ecommerce-monorepo/web
   npm run dev
   ```

2. Open: `http://localhost:3005/admin/products`

3. Edit any product

4. Follow **Quick Test** steps above

5. Verify translations persist after reload

**If all steps pass, the fix is working!** ✅
