# Flash Sales Feature - Admin Panel

## Overview
The Flash Sales feature allows administrators to create time-limited special offers for mobile app users. This feature is designed to drive urgency and increase conversions through limited-time promotions.

## Features

### 1. Flash Sale Management Page
**Location**: Admin Panel → Settings → Flash Sales (`/admin/settings/flash-sales`)

**Features**:
- View all products configured for flash sales
- Drag and drop to reorder flash sale products
- Toggle products on/off for flash sales
- Edit flash sale details inline
- Status indicators (Active, Scheduled, Ended, Not Configured)

### 2. Product List Integration
**Location**: Admin Panel → Products (`/admin/products`)

**Features**:
- New "Flash Sale" toggle column in product list
- Quick enable/disable flash sales for any product
- Works alongside Featured and New Arrival toggles

### 3. Flash Sale Configuration

Each flash sale product can have:
- **Flash Sale Price**: Special discounted price (required)
- **Start Date & Time**: When the flash sale begins (required)
- **End Date & Time**: When the flash sale ends (required)
- **Flash Sale Stock**: Limited quantity available (optional, leave empty for unlimited)

### 4. Smart Status System

Flash sales automatically show status based on dates:
- **Scheduled** (Blue): Sale hasn't started yet
- **Active** (Green): Sale is currently running
- **Ended** (Gray): Sale has completed
- **Not Configured** (Yellow): Flash sale enabled but dates not set

## Database Schema

New fields added to `Product` model:
```prisma
isFlashSale       Boolean   @default(false)
flashSaleOrder    Int       @default(999)
flashSalePrice    Float?
flashSaleStart    DateTime?
flashSaleEnd      DateTime?
flashSaleStock    Int?
```

## API Endpoints

### Get Flash Sale Products
```
GET /api/admin/products/flash-sales
```
Returns all products with `isFlashSale = true`, ordered by `flashSaleOrder`.

### Update Flash Sale Order
```
PUT /api/admin/products/flash-sales
Body: { products: [{ id: string, order: number }] }
```
Updates the display order of flash sale products via drag-and-drop.

### Toggle/Update Flash Sale for Product
```
PUT /api/admin/products/{id}/flash-sale
Body: {
  isFlashSale: boolean,
  flashSalePrice?: number,
  flashSaleStart?: string,
  flashSaleEnd?: string,
  flashSaleStock?: number
}
```

## Usage Workflow

### Setting Up a Flash Sale

1. **Navigate to Products**
   - Go to Admin Panel → Products
   - Find products you want to add to flash sales

2. **Enable Flash Sale**
   - Toggle the "Flash Sale" switch for desired products
   - Products are now in flash sale list but not configured

3. **Configure Flash Sale Details**
   - Go to Admin Panel → Settings → Flash Sales
   - Click "Edit" on any product
   - Set:
     - Flash Sale Price (must be less than regular price)
     - Start Date & Time
     - End Date & Time
     - Flash Sale Stock (optional)
   - Click "Save"

4. **Reorder Products**
   - Drag and drop products to prioritize display order
   - Order is automatically saved

5. **Monitor Status**
   - Status badges show current state
   - Discount percentage is auto-calculated
   - View remaining stock and dates at a glance

### Disabling a Flash Sale

Option 1: From Flash Sales page
- Toggle the switch next to the product OFF

Option 2: From Products page
- Toggle the "Flash Sale" column switch OFF

## Display Logic

### Frontend/Mobile App Integration

Products should be displayed in flash sales section when:
```javascript
product.isFlashSale === true 
&& product.flashSaleStart <= now 
&& product.flashSaleEnd >= now
&& (product.flashSaleStock === null || product.flashSaleStock > 0)
```

### Price Display
- Show flash sale price prominently
- Strike through original price
- Display discount percentage
- Show countdown timer to end date

### Stock Management
- If `flashSaleStock` is set, decrement on each purchase
- When `flashSaleStock` reaches 0, hide from flash sales
- Regular product stock is separate

## Best Practices

1. **Timing**: Schedule flash sales during peak traffic hours
2. **Duration**: Keep flash sales short (24-72 hours) for urgency
3. **Discount**: Offer meaningful discounts (20-50% off)
4. **Stock**: Use limited stock to create scarcity
5. **Order**: Put best deals at the top via drag-and-drop
6. **Monitoring**: Check active flash sales daily

## Validation Rules

- Flash sale price must be greater than 0
- Flash sale price should be less than regular price (warning only)
- End date must be after start date
- Flash sale stock cannot be negative
- Start and end dates required when flash sale is enabled

## Migration

The database migration was created and applied:
```
npx prisma migrate dev --name add_flash_sales_to_products
```

This adds the new flash sale fields to the products table without affecting existing data.

## Future Enhancements

Potential improvements:
- [ ] Bulk flash sale creation
- [ ] Flash sale templates
- [ ] Automatic scheduling for recurring flash sales
- [ ] Email notifications when flash sales start
- [ ] Analytics dashboard for flash sale performance
- [ ] Integration with push notifications
- [ ] Customer-specific flash sale access
- [ ] Flash sale history and reporting

## Support

For issues or questions:
- Check API response errors for validation messages
- Verify dates are in correct format (ISO 8601)
- Ensure product has sufficient regular stock
- Check browser console for frontend errors
