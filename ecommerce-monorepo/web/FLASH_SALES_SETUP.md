# Flash Sales Setup Guide

## Quick Start

The Flash Sales feature has been successfully set up in your admin panel. Follow these steps to start using it:

### 1. Access the Flash Sales Manager

1. Log in to the admin panel at `http://localhost:8081/admin`
2. Navigate to **Settings** → **Flash Sales**
3. You'll see the Flash Sales management page

### 2. Add Products to Flash Sales

**Method 1: From Products Page**
1. Go to **Products** page
2. Find the product you want to add
3. Toggle the **Flash Sale** switch in the product row
4. The product is now added but needs configuration

**Method 2: Direct Configuration**
1. Enable flash sale from products page
2. Go to **Settings** → **Flash Sales**
3. Click **Edit** on the product
4. Fill in:
   - **Flash Sale Price**: The special discounted price
   - **Start Date & Time**: When the sale begins
   - **End Date & Time**: When the sale ends
   - **Flash Sale Stock**: (Optional) Limit the quantity available
5. Click **Save**

### 3. Manage Flash Sale Products

#### Reorder Products
- Drag and drop products to change their display order
- The order determines how products appear in the mobile app

#### Edit Flash Sale Details
- Click **Edit** on any product
- Update prices, dates, or stock limits
- Click **Save** to apply changes

#### Enable/Disable Flash Sales
- Use the toggle switch to quickly enable/disable
- Disabling removes the product from flash sales

### 4. Monitor Status

Flash sales automatically show their current status:
- **🔵 Scheduled**: Sale hasn't started yet
- **🟢 Active**: Sale is currently running
- **⚫ Ended**: Sale has completed
- **🟡 Not Configured**: Enabled but dates not set

## Database Migration

✅ **Already Applied!**

The database migration has been successfully applied. Your database now includes these new fields in the `products` table:
- `isFlashSale` (boolean)
- `flashSaleOrder` (integer)
- `flashSalePrice` (float, nullable)
- `flashSaleStart` (datetime, nullable)
- `flashSaleEnd` (datetime, nullable)
- `flashSaleStock` (integer, nullable)

## API Endpoints

### For Admin Panel
- `GET /api/admin/products/flash-sales` - Get all flash sale products
- `PUT /api/admin/products/flash-sales` - Update product order
- `PUT /api/admin/products/{id}/flash-sale` - Update flash sale settings

### For Mobile App (Public)
- `GET /api/products/flash-sales` - Get active flash sale products

The public endpoint returns only active flash sales with enriched data:
- Discount percentage
- Time remaining
- Stock status
- Category information

## Mobile App Integration

Use this endpoint in your mobile app to display flash sales:

```javascript
// Fetch active flash sales
const response = await fetch('http://localhost:8081/api/products/flash-sales')
const { data } = await response.json()

// Each product includes:
// - flashSalePrice: The discounted price
// - discount: Calculated discount percentage
// - timeRemaining: Milliseconds until sale ends
// - hasLimitedStock: Whether stock is limited
// - stockRemaining: Available quantity (if limited)
```

## Example Usage

### Create a 24-Hour Flash Sale

1. Go to **Products** and toggle Flash Sale for "Gaming Laptop"
2. Go to **Settings** → **Flash Sales**
3. Click **Edit** on Gaming Laptop
4. Set:
   - Flash Sale Price: $799 (original: $1,299)
   - Start: Today, 12:00 PM
   - End: Tomorrow, 12:00 PM
   - Flash Sale Stock: 50
5. Save

Result:
- 39% discount shown automatically
- Available for 24 hours
- Limited to 50 units
- Status shows "Active" during the sale

## Files Created/Modified

### New Files
- ✅ `app/api/admin/products/flash-sales/route.ts` - Admin API
- ✅ `app/api/admin/products/[id]/flash-sale/route.ts` - Single product API
- ✅ `app/api/products/flash-sales/route.ts` - Public API
- ✅ `app/admin/settings/flash-sales/page.tsx` - Management UI
- ✅ `docs/FLASH_SALES.md` - Complete documentation
- ✅ `prisma/migrations/20260707174527_add_flash_sales_to_products/` - Database migration

### Modified Files
- ✅ `prisma/schema.prisma` - Added flash sale fields to Product model
- ✅ `app/admin/layout.tsx` - Added Flash Sales to Settings menu
- ✅ `app/admin/products/page.tsx` - Added Flash Sale toggle column

## Troubleshooting

### Products Not Showing in Flash Sales List
- Ensure the Flash Sale toggle is ON
- Check that dates are set correctly
- Verify the sale is currently active (between start and end dates)

### Changes Not Saving
- Check browser console for errors
- Verify all required fields are filled
- Ensure dates are valid (end date after start date)

### Mobile App Not Showing Flash Sales
- Use the public endpoint: `/api/products/flash-sales`
- Only active sales (current time between start/end) are returned
- Check that products have stock available

## Next Steps

1. **Test the Feature**
   - Create a test flash sale
   - Verify it appears in the admin panel
   - Check the public API endpoint

2. **Integrate with Mobile App**
   - Use the public API endpoint
   - Display flash sales section
   - Show countdown timers
   - Handle stock limits

3. **Set Up Real Flash Sales**
   - Choose high-demand products
   - Set competitive prices
   - Schedule during peak hours
   - Monitor performance

## Support

For more details, see the complete documentation:
- `docs/FLASH_SALES.md` - Full feature documentation
- Admin panel UI includes tooltips and help text

Enjoy your new Flash Sales feature! 🎉
