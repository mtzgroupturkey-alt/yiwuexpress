# Start Development Server & Test Category System

## Quick Start

### 1. Start the Development Server
```bash
cd ecommerce-monorepo/web
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

---

## 2. Test Frontend Menu (Main Website)

### Visit: http://localhost:3000

**What to Check:**
- ✅ Blue menu bar below the header shows 9 categories
- ✅ Categories are in correct order (see expected list below)
- ✅ Hovering over categories with dropdown icon shows subcategories
- ✅ Clicking categories WITHOUT children navigates to products page
- ✅ Clicking categories WITH children only shows dropdown (no navigation)

**Expected Categories (in order):**
1. **CLOTHING** 📋 (has 3 subcategories)
   - Man
   - women  
   - Boys

2. **BAKEWARE** 📋 (has 4 subcategories)
   - Cast Iron Dutch Ovens
   - Cake Pans
   - Muffin & Cupcake Pans
   - Baking Trays & Sheets

3. **COOKWARE** 📋 (has 5 subcategories)
   - Cast Iron Cookware
   - Non-Stick Cookware
   - Sauce Pans
   - Stainless Steel Cookware
   - Stock Pots

4. **ELECTRONICS** 🔗 (no children - click navigates)

5. **HOME GOODS** 🔗 (no children - click navigates)

6. **KITCHEN APPLIANCES** 📋 (has 3 subcategories)
   - Blenders & Mixers
   - Coffee Makers
   - Electric Kettles

7. **KITCHEN UTENSILS** 📋 (has 3 subcategories)
   - Measuring Cups & Spoons
   - Spatulas & Turners
   - Whisks & Mixers

8. **STORAGE & ORGANIZATION** 🔗 (no children - click navigates)

9. **TABLEWARE** 📋 (has 3 subcategories)
   - Bowls & Plates
   - Cups & Mugs
   - Dinner Sets

### Browser Console Debugging:
Open DevTools (F12) → Console tab and look for:
```
API Response: {success: true, categories: Array(32), count: 32}
Category Clothing: isParent=true, isActive=true, showInMenu=true
Category Bakeware: isParent=true, isActive=true, showInMenu=true
...
Parent categories: 9
Category CLOTHING has 3 children
...
Final categories with children: Array(9)
```

If you see `Parent categories: 0`, something is wrong with filtering.

---

## 3. Test Admin Menu Manager (Drag & Drop)

### Visit: http://localhost:3000/admin/categories/menu

**What to Check:**
- ✅ All 9 parent categories shown
- ✅ Each parent can be expanded to see children
- ✅ Drag handle (⋮⋮) appears on left of each category
- ✅ Can drag root categories to reorder
- ✅ Can drag subcategories within same parent to reorder
- ✅ Eye icon toggles showInMenu (blue = visible, gray = hidden)
- ✅ "Save Changes" button persists the new order

### Testing Drag & Drop:

**Test 1: Reorder Root Categories**
1. Drag "ELECTRONICS" above "CLOTHING"
2. Click "Save Changes"
3. Refresh page → order should persist
4. Go to homepage → menu should show new order

**Test 2: Reorder Subcategories**
1. Expand "CLOTHING" category
2. Drag "Boys" above "Man"
3. Click "Save Changes"
4. Refresh page → order should persist
5. Go to homepage → hover CLOTHING → should see "Boys" first

**Test 3: Hide/Show in Menu**
1. Click eye icon on "STORAGE & ORGANIZATION" (should turn gray)
2. Click "Save Changes"
3. Go to homepage → "STORAGE & ORGANIZATION" should disappear from menu
4. Go back to admin → click eye icon again (should turn blue)
5. Click "Save Changes"
6. Go to homepage → "STORAGE & ORGANIZATION" should reappear

---

## 4. Troubleshooting

### Problem: No categories show on frontend menu

**Check 1: API Response**
```bash
# In another terminal (keep dev server running)
curl http://localhost:3000/api/categories?includeChildren=true
```

Should return JSON with `categories` array containing 32 items.

**Check 2: Database**
```bash
cd ecommerce-monorepo/web
node test-category-api.js
```

Should show: `✓ Parent categories (will show in menu): 9`

**Check 3: Browser Console**
- Open DevTools (F12)
- Look for error messages
- Check if API call succeeded
- Verify filtering logic logs

### Problem: Drag & drop not working

**Check 1: Console Errors**
- Open DevTools → Console
- Try dragging
- Look for JavaScript errors

**Check 2: Category IDs**
- Each category must have unique ID
- Check: `node check-categories.js`

**Check 3: Package Installation**
```bash
cd ecommerce-monorepo/web
npm list @dnd-kit/core
```
Should show: `@dnd-kit/core@6.x.x`

### Problem: Order not saving

**Check 1: API Endpoint**
```bash
# Test the order save endpoint
curl -X POST http://localhost:3000/api/admin/categories/order \
  -H "Content-Type: application/json" \
  -d '{"categories":[{"id":"cmqqklpmz0001v1n419ru1rfu","parentId":null,"menuOrder":0,"level":1}]}'
```

Should return: `{"success":true,"message":"Category order updated successfully"}`

**Check 2: Browser Network Tab**
- Open DevTools → Network tab
- Click "Save Changes"
- Look for POST to `/api/admin/categories/order`
- Check response status (should be 200)
- Check response body (should have `success: true`)

---

## 5. Quick Tests Checklist

Before marking as complete, verify:

- [ ] Dev server starts without errors
- [ ] Homepage shows 9 categories in menu bar
- [ ] Hovering categories with children shows dropdown
- [ ] Clicking categories without children navigates to products
- [ ] Clicking categories with children does NOT navigate
- [ ] Admin menu manager loads all categories
- [ ] Can drag root categories to reorder
- [ ] Can drag subcategories within same parent
- [ ] Can expand/collapse parent categories
- [ ] Eye icon toggles visibility
- [ ] Save Changes button persists order to database
- [ ] After refresh, order is maintained
- [ ] Frontend menu reflects admin order
- [ ] Browser console shows debug logs (no errors)

---

## Files Modified in This Session

1. **web/app/admin/categories/menu/page.tsx**
   - Fixed drag-drop for subcategories
   - Added recursive reordering logic
   - Added menuOrder normalization

2. **web/components/layout/CategoryMenu.tsx**
   - Added comprehensive debug logging
   - Improved error handling
   - Better filtering logic visibility

3. **web/test-category-api.js** (NEW)
   - Test script to verify category structure
   - Shows what will render on frontend

4. **web/check-categories.js** (EXISTING)
   - Raw database category listing

5. **CATEGORY_MENU_FIXES.md** (NEW)
   - Complete documentation of fixes

6. **START_AND_TEST.md** (NEW - THIS FILE)
   - Testing and troubleshooting guide

---

## Success Criteria

✅ **All three original issues resolved:**
1. ✅ Subcategories can be dragged for reordering
2. ✅ Frontend shows same ordering as admin (uses menuOrder)
3. ✅ Parent categories with children only show dropdown, don't navigate

🚀 **Ready for testing!**
