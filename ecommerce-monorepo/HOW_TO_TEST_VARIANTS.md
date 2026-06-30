# 🧪 HOW TO TEST VARIANT SELECTION

## Why You Don't See Variants

The products you added (**Porcelain Dinner Set 16-Piece** and **Stainless Steel Mixing Bowls**) don't have variants in your database yet. The variant selection feature only appears when a product actually has variants.

---

## ✅ OPTION 1: Add Variants to Existing Product (Recommended)

### Step 1: Open Prisma Studio
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma studio
```

### Step 2: Find Your Product
1. Open the **`Product`** table
2. Find "Stainless Steel Mixing Bowls Set of 3"
3. **Copy the product ID** (something like `cm...`)

### Step 3: Create Variants
1. Open the **`ProductVariant`** table
2. Click **"Add record"** button
3. Fill in the following for **Variant 1 (Small, Silver)**:
   ```
   productId: [Paste the product ID from step 2]
   sku: YW-TW-MB3-SM-SLV
   attributes: {"Size": "Small (1L, 2L, 3L)", "Color": "Silver"}
   price: 14.99
   costPrice: 10.50
   stock: 50
   isActive: true
   ```
4. Click **"Save 1 change"**

5. Repeat for **Variant 2 (Medium, Silver)**:
   ```
   productId: [Same product ID]
   sku: YW-TW-MB3-MD-SLV
   attributes: {"Size": "Medium (2L, 3L, 4L)", "Color": "Silver"}
   price: 16.19
   costPrice: 12.00
   stock: 40
   isActive: true
   ```

6. Repeat for **Variant 3 (Large, Copper)**:
   ```
   productId: [Same product ID]
   sku: YW-TW-MB3-LG-COP
   attributes: {"Size": "Large (3L, 4L, 5L)", "Color": "Copper"}
   price: 18.99
   costPrice: 14.50
   stock: 30
   isActive: true
   ```

### Step 4: Test in Purchase Order
1. Refresh your purchase order page: `http://localhost:3005/admin/purchase-orders/new`
2. Remove the existing "Mixing Bowls" item (if already added)
3. Click **"Add Product"** button
4. Search for **"Mixing Bowls"**
5. **You should now see a badge: "3 variants"** next to the product name
6. Click **"Select Variant"** button
7. A dialog will open showing all 3 variants
8. Select one and click **"Add Variant"**
9. **The variant badge will appear** below the product name!

---

## ✅ OPTION 2: Use SQL Script

### Step 1: Get Product ID
Open your database tool (pgAdmin, TablePlus, etc.) and run:
```sql
SELECT id, name, sku FROM products WHERE name LIKE '%Mixing Bowls%';
```

Copy the `id` value.

### Step 2: Run Insert Script
Replace `YOUR_PRODUCT_ID_HERE` in the `ADD_TEST_VARIANTS.sql` file with the actual product ID, then run the SQL script.

### Step 3: Test
Follow Step 4 from Option 1 above.

---

## ✅ OPTION 3: Create New Product with Variants

### Through Admin Panel:
1. Go to **Products** → **Create Product**
2. Create a product (e.g., "Test T-Shirt")
3. After creating, go to **Product Variants** section
4. Add variants like:
   - Small, Blue
   - Medium, Blue
   - Large, Red
5. Save the product

### Test:
1. Go to purchase orders
2. Add the new product
3. You'll see variant selection dialog!

---

## 🎬 WHAT YOU SHOULD SEE

### Before (No Variants):
```
┌────────────────────────────────────────────┐
│  Stainless Steel Mixing Bowls Set of 3    │
│  SKU: YW-TW-MB3                            │
│                                [Add]       │
└────────────────────────────────────────────┘
```

### After (With Variants):
```
┌─────────────────────────────────────────────────────┐
│  Stainless Steel Mixing Bowls Set of 3  [3 variants]│
│  SKU: YW-TW-MB3                                     │
│                           [Select Variant ▼]        │
└─────────────────────────────────────────────────────┘
```

### Variant Dialog:
```
┌──────────────────────────────────────────────────┐
│  Select Variant                             [×]  │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐ │
│  │  Size: Small (1L, 2L, 3L) • Color: Silver │ │
│  │  SKU: YW-TW-MB3-SM-SLV • Stock: 50        │ │
│  │  Cost: $10.50                    $14.99   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Size: Medium (2L, 3L, 4L) • Color: Silver│ │
│  │  SKU: YW-TW-MB3-MD-SLV • Stock: 40    ✓   │ │
│  │  Cost: $12.00                    $16.19   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Size: Large (3L, 4L, 5L) • Color: Copper │ │
│  │  SKU: YW-TW-MB3-LG-COP • Stock: 30        │ │
│  │  Cost: $14.50                    $18.99   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│                     [Cancel]  [Add Variant]     │
└──────────────────────────────────────────────────┘
```

### Added to Purchase Order:
```
┌─────────────────────────────────────────────────┐
│  Stainless Steel Mixing Bowls Set of 3    [🗑] │
│  SKU: YW-TW-MB3-MD-SLV                          │
│  [Size: Medium (2L, 3L, 4L) • Color: Silver]   │ ← This is the variant badge!
│                                                 │
│  Quantity: [1]  Unit Price: [12.00]  Total: 12 │
└─────────────────────────────────────────────────┘
```

---

## 🔍 VERIFICATION CHECKLIST

After adding variants, verify:

✅ **In Product Search:**
- [ ] Product shows "3 variants" badge
- [ ] "Select Variant" button appears instead of "Add"

✅ **In Variant Dialog:**
- [ ] All 3 variants are listed
- [ ] Attributes show correctly (Size • Color)
- [ ] SKU, stock, and prices display
- [ ] Can select a variant (checkmark appears)

✅ **After Adding:**
- [ ] Variant badge appears below product name
- [ ] Correct variant SKU is shown
- [ ] Correct cost price is used

✅ **In Database:**
- [ ] Purchase order item has `variantId` populated
- [ ] `variantName` contains "Size: ... • Color: ..."
- [ ] `variantAttributes` contains JSON object

---

## ❓ TROUBLESHOOTING

### Issue: Still don't see variant badge
**Check:**
1. Did you refresh the page after adding variants?
2. Is `isActive` set to `true` for the variants?
3. Did you use the correct product ID?

### Issue: Variant dialog is empty
**Check:**
1. Variants must belong to the correct product (matching productId)
2. Variants must be active (`isActive: true`)
3. Check browser console for errors

### Issue: Badge shows but wrong number
**Check:**
1. Count how many variants have `isActive: true`
2. Only active variants are counted

---

## 🎉 SUCCESS!

Once you've added variants and see the selection dialog working, you've successfully tested the variant selection feature!

The feature is **working correctly** - it just requires products to have variants defined in the database first.
