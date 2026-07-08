# Sample Data Guide

## ✅ Sample Data Successfully Seeded!

Your database has been populated with comprehensive sample data for testing and demonstration purposes.

## 🔐 Admin Login Credentials

```
Email: admin@yiwuexpress.com
Password: admin123
```

**⚠️ Important**: Change these credentials in production!

## 📊 What Was Seeded

### 1. Admin User (1)
- Full admin access to all features
- Can manage products, orders, users, and settings
- Email: admin@yiwuexpress.com

### 2. Categories (4)
- **Electronics** - Electronic devices and gadgets
- **Clothing** - Fashion and apparel
- **Home & Garden** - Home decor and garden supplies
- **Toys & Games** - Toys and gaming products

### 3. Products (11)

#### Featured Products (3)
These appear on the homepage's "Featured Products" section:
1. **Wireless Bluetooth Headphones** - $79.99 (was $129.99)
2. **Cotton T-Shirt - Classic Fit** - $19.99
3. **Building Blocks Set - 500 Pieces** - $34.99

#### New Arrivals (3)
Displayed in the "New Arrivals" section:
1. **Smart Watch Fitness Tracker** - $49.99
2. **Ceramic Plant Pot Set (3 Pack)** - $24.99
3. **Remote Control Racing Car** - $44.99

#### Flash Sale Products (5)
Available in Admin → Settings → Flash Sales:

**Active Flash Sales** (currently running):
1. **USB-C Fast Charging Cable 2M** 
   - Regular: $12.99 → Flash: $9.99 (23% off)
   - Started 30 minutes ago, ends in 24 hours
   - 75 units available

2. **Denim Jeans - Slim Fit**
   - Regular: $39.99 → Flash: $29.99 (25% off)
   - Started 1 hour ago, ends in 23 hours
   - 50 units available

3. **LED String Lights - 10M**
   - Regular: $15.99 → Flash: $11.99 (25% off)
   - Started 2 hours ago, ends in 22 hours
   - 100 units available

**Scheduled Flash Sale** (not yet started):
4. **Portable Power Bank 20000mAh**
   - Regular: $29.99 → Flash: $19.99 (33% off)
   - Starts in 2 hours, runs for 24 hours
   - 150 units available

**Ended Flash Sale** (for testing):
5. **Winter Jacket - Waterproof**
   - Ended yesterday
   - Shows how expired flash sales appear

### 4. Countries (3)
Pre-configured shipping destinations:
- **United States** (USD) - 7-10 business days
- **United Kingdom** (GBP) - 5-7 business days
- **Australia** (AUD) - 10-15 business days

### 5. Currencies (4)
- **USD** (US Dollar) - Base currency
- **EUR** (Euro) - Exchange rate: 0.92
- **GBP** (British Pound) - Exchange rate: 0.79
- **CNY** (Chinese Yuan) - Exchange rate: 7.25

### 6. Hero Slides (3)
Displayed on the homepage carousel:
1. **Summer Sale 2024** - Up to 50% Off
2. **New Arrivals** - Fresh Products Weekly
3. **Flash Sale Today** - 24 Hours Only

### 7. Suppliers (2)
For purchase order management:
- **TechGlobal Co.** - Electronics supplier
  - Contact: Li Wei
  - Terms: Net 30
- **Fashion Hub** - Clothing supplier
  - Contact: Wang Fang
  - Terms: Net 60

### 8. Testimonials (3)
Customer reviews displayed on homepage:
- Sarah Johnson (Johnson Imports) - ⭐⭐⭐⭐⭐
- Michael Chen (Global Trade Solutions) - ⭐⭐⭐⭐⭐
- Emily Rodriguez (Fashion Forward) - ⭐⭐⭐⭐⭐

### 9. Shipping Methods (3)
Available shipping options:
- **Standard Air Freight** - 7-10 business days
- **Express Air Freight** - 3-5 business days
- **Sea Freight** - 30-45 business days

## 🎯 Where to Find Everything

### Admin Panel Pages with Sample Data

1. **Dashboard** (`/admin`)
   - View overall statistics

2. **Products** (`/admin/products`)
   - 11 products ready to manage
   - Test Featured, New Arrival, and Flash Sale toggles

3. **Categories** (`/admin/categories`)
   - 4 main categories
   - Test category management

4. **Suppliers** (`/admin/suppliers`)
   - 2 suppliers ready for purchase orders

5. **Countries** (`/admin/countries`)
   - 3 countries configured
   - Test shipping rules

6. **Currencies** (`/admin/currencies`)
   - 4 currencies with exchange rates

7. **Settings → Hero Slider** (`/admin/settings/hero-slider`)
   - 3 hero slides configured
   - Test drag-and-drop reordering

8. **Settings → Featured Products** (`/admin/settings/featured-products`)
   - 3 featured products
   - Test reordering and toggling

9. **Settings → New Arrivals** (`/admin/settings/new-arrivals`)
   - 3 new arrival products

10. **Settings → Flash Sales** (`/admin/settings/flash-sales`) ⚡
    - 5 flash sale products
    - 3 active, 1 scheduled, 1 ended
    - Test editing prices, dates, and stock limits

11. **Settings → Shipping Methods** (`/admin/settings/shipping-methods`)
    - 3 shipping methods configured

12. **Testimonials** (`/admin/testimonials`)
    - 3 customer testimonials

## 🧪 Testing Scenarios

### Flash Sales Testing

1. **View Active Sales**
   - Go to Settings → Flash Sales
   - See 3 active flash sales with countdown

2. **Edit Flash Sale**
   - Click "Edit" on any product
   - Change price, dates, or stock
   - Click "Save"

3. **Schedule Future Sale**
   - One product is already scheduled to start in 2 hours
   - Watch it become "Active" after start time

4. **View Ended Sales**
   - See how expired flash sales appear
   - Toggle them off to remove

5. **Public API Test**
   - Visit `/api/products/flash-sales`
   - See only active flash sales returned

### Featured Products Testing

1. **Reorder Products**
   - Drag and drop to change order
   - Order saves automatically

2. **Toggle On/Off**
   - Use switch to show/hide products
   - Changes reflect immediately

### Product Management Testing

1. **Add to Flash Sales**
   - Go to Products page
   - Toggle "Flash Sale" switch
   - Configure in Flash Sales settings

2. **Multiple Toggles**
   - Products can be Featured, New Arrival, AND Flash Sale
   - Test different combinations

## 🔄 Re-seeding Data

If you need to reset or re-seed the data:

```bash
# In the web directory
npm run db:seed:sample
```

**⚠️ Warning**: This will create/update records but won't delete existing data. If you want a fresh start, reset the database first:

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then run the seed
npm run db:seed:sample
```

## 📝 Notes

### Flash Sale Timing
The flash sales are seeded with relative timestamps:
- Active sales: Started recently, running for ~24 hours
- Scheduled sale: Starts in 2 hours
- Ended sale: Ended yesterday

These times are relative to when you run the seed script, so they'll always be relevant for testing.

### Image Placeholders
All image URLs point to `/images/...` paths. These are placeholder paths. In production:
- Upload actual images
- Or use a CDN
- Or implement automatic placeholder generation

### Password Security
The admin password is hashed using bcryptjs. In production:
- Use strong passwords
- Enable 2FA
- Implement password policies

## 🚀 Next Steps

1. **Log in to Admin Panel**
   - Visit `/admin`
   - Use credentials above
   
2. **Explore Flash Sales**
   - Go to Settings → Flash Sales
   - Try editing, reordering, toggling

3. **Test Product Management**
   - Add new products
   - Test toggles for Featured/New Arrival/Flash Sale

4. **Configure Settings**
   - Update hero slides
   - Add more testimonials
   - Configure shipping methods

5. **Test Public Endpoints**
   - Visit `/api/products/flash-sales`
   - Integrate with mobile app

## 🎉 Enjoy Your Fully Populated Admin Panel!

All major features now have sample data for immediate testing and demonstration.
