# Test Guide: Admin Products Status Filter

## Quick Test on Localhost (Port 3005)

### 1. Navigate to Admin Products Page
Open: `http://localhost:3005/admin/products`

### 2. Verify Status Filter Dropdown Exists
You should see a new dropdown between the Category dropdown and Clear Filters button with options:
- All Products (default)
- Featured Only
- New Arrivals Only
- Flash Sales Only

### 3. Test New Arrivals Filter
1. Select "New Arrivals Only" from the dropdown
2. The page should reload and show ONLY products where the "New Arrival" toggle is ON (green)
3. All other products should be hidden
4. The "• Filters active" indicator should appear under the page title

### 4. Test Featured Filter
1. Select "Featured Only" from the dropdown
2. Should show ONLY products where the "Featured" toggle is ON

### 5. Test Flash Sales Filter
1. Select "Flash Sales Only" from the dropdown
2. Should show ONLY products where the "Flash Sale" toggle is ON

### 6. Test Filter Persistence
1. Select "New Arrivals Only"
2. Refresh the page (F5 or Ctrl+R)
3. The "New Arrivals Only" filter should still be active after refresh

### 7. Test Clear Filters
1. Select any status filter
2. Click "Clear Filters" button
3. Status filter should reset to "All Products"
4. Search and category filters should also clear

### 8. Test Combined Filters
1. Enter a search term (e.g., "shirt")
2. Select a category (e.g., "Clothing")
3. Select "New Arrivals Only"
4. Should show only New Arrival products that match the search term in the Clothing category

### 9. Test Toggle Interaction
1. Select "New Arrivals Only" filter
2. Toggle OFF the "New Arrival" switch on one of the displayed products
3. That product should disappear from the list (since it's no longer a New Arrival)
4. The filter should remain active

## Expected Behavior

**Status Filter: "All Products"**
- Shows all products regardless of Featured/New Arrival/Flash Sale status
- Toggles show correct status for each product

**Status Filter: "Featured Only"**
- Shows ONLY products with isFeatured = true
- All displayed products should have the Featured toggle ON (green)

**Status Filter: "New Arrivals Only"**
- Shows ONLY products with isNewArrival = true
- All displayed products should have the New Arrival toggle ON (green)

**Status Filter: "Flash Sales Only"**
- Shows ONLY products with isFlashSale = true
- All displayed products should have the Flash Sale toggle ON (green)

## Troubleshooting

**Issue: Filter doesn't work**
- Check browser console for errors
- Verify API is receiving statusFilter parameter
- Check Network tab in DevTools to see API request

**Issue: Filter resets on page refresh**
- Check browser localStorage for `adminProductsFilters` key
- Verify localStorage is not disabled in browser

**Issue: No products shown when filter is active**
- Check if any products actually have that status enabled
- Try toggling some products ON for the status you're filtering by
- Example: To test "New Arrivals Only", first mark some products as New Arrivals

## Database Check (if needed)

To verify product status in database:
```sql
-- Count products by status
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN "isFeatured" = true THEN 1 ELSE 0 END) as featured,
  SUM(CASE WHEN "isNewArrival" = true THEN 1 ELSE 0 END) as new_arrivals,
  SUM(CASE WHEN "isFlashSale" = true THEN 1 ELSE 0 END) as flash_sales
FROM "Product";

-- View all New Arrivals
SELECT id, name, sku, "isNewArrival" 
FROM "Product" 
WHERE "isNewArrival" = true;
```

## Production Testing

After syncing to production server, test at:
`https://www.dromkok.com/admin/products`

Follow the same test steps above.
