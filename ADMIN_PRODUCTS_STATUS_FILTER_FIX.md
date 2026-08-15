# Admin Products Status Filter Fix

## Issue
The admin products page at `http://localhost:3005/admin/products` showed ALL products in the listing, with no way to filter and view only products marked as "New Arrivals", "Featured", or "Flash Sale". The toggle switches displayed the status correctly, but there was no filtering capability.

## Root Cause
The admin products page had filter options for:
- Search (by name/SKU)
- Category

But was missing a **Status Filter** to show only:
- Featured products
- New Arrival products
- Flash Sale products

## Solution Applied

### 1. Frontend Changes (`page.tsx`)

**Added Status Filter State:**
```typescript
const [statusFilter, setStatusFilter] = useState<string>('all') // all, featured, newArrival, flashSale
```

**Added Status Filter Dropdown:**
```html
<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
  <option value="all">All Products</option>
  <option value="featured">Featured Only</option>
  <option value="newArrival">New Arrivals Only</option>
  <option value="flashSale">Flash Sales Only</option>
</select>
```

**Updated Filter Persistence:**
- Status filter is now saved to localStorage
- Status filter is restored on page reload
- Status filter is included in API request

**Updated Clear Filters:**
- Resets status filter to "all" when clearing filters

### 2. Backend Changes (`route.ts`)

**Added Status Filter Logic:**
```typescript
const statusFilter = searchParams.get('statusFilter')

if (statusFilter) {
  if (statusFilter === 'featured') {
    where.isFeatured = true
  } else if (statusFilter === 'newArrival') {
    where.isNewArrival = true
  } else if (statusFilter === 'flashSale') {
    where.isFlashSale = true
  }
}
```

## Files Modified

1. **Frontend:**
   - `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\products\page.tsx`

2. **Backend API:**
   - `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\api\admin\products\route.ts`

## Testing

### Localhost Testing
1. Navigate to `http://localhost:3005/admin/products`
2. You should see a new "Status Filter" dropdown with options:
   - All Products (default)
   - Featured Only
   - New Arrivals Only
   - Flash Sales Only
3. Select "New Arrivals Only" - should show ONLY products where isNewArrival = true
4. Select "Featured Only" - should show ONLY products where isFeatured = true
5. Select "Flash Sales Only" - should show ONLY products where isFlashSale = true
6. Click "Clear Filters" - should reset to "All Products"
7. Refresh page - status filter selection should persist (localStorage)

### Production Deployment

After localhost testing is confirmed:

```cmd
c:\wamp64\www\yiwuexpress\sync-admin-products-status-filter.bat
```

Then on the server:
```bash
cd /www/wwwroot/www.dromkok.com/web
rm -rf .next
npm run build
pm2 restart dromkok-web --update-env
```

## Behavior

**Before Fix:**
- Admin products page showed all products
- No way to filter by Featured/New Arrival/Flash Sale status
- Had to scroll through entire list to find New Arrivals

**After Fix:**
- Admin products page has Status Filter dropdown
- Can quickly view only Featured products
- Can quickly view only New Arrival products
- Can quickly view only Flash Sale products
- Filter selection persists across page reloads
- Works in combination with search and category filters

## Notes

- Status filter works alongside existing search and category filters
- All filters can be used together (e.g., "New Arrivals in Electronics category")
- Filter state is saved in localStorage under `adminProductsFilters`
- The toggle switches still work to change individual product status
- Changing a product's status will refresh the list and respect the active filter
