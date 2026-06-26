# 🎯 Admin Panel Quick Guide

## 🚀 Quick Start

Your admin panel is ready! Here's everything you need to know:

---

## 📍 Admin URLs

```bash
# Product Management
http://localhost:3001/admin/products           # List all products
http://localhost:3001/admin/products/new       # Create new product
http://localhost:3001/admin/products/[id]/edit # Edit product

# Order Management
http://localhost:3001/admin/orders             # List all orders
http://localhost:3001/admin/orders/[id]        # View order details

# Wholesale Management
http://localhost:3001/admin/wholesale          # List wholesale inquiries
http://localhost:3001/admin/wholesale/[id]     # View inquiry details
```

---

## 🔐 Admin Login

```
Email: admin@test.com
Password: password123
```

---

## 📦 Product Management

### List Products
- **URL**: `/admin/products`
- **Features**: Search, filter by category/status, pagination
- **Actions**: View, Edit, Create new

### Create Product
- **URL**: `/admin/products/new`
- **Required**: SKU, Name, Price, Weight
- **Includes**: 
  - Basic info (name, SKU, category)
  - Pricing (price, compare price, wholesale)
  - Inventory (stock, threshold)
  - Compliance (weight, HS code, origin)
  - Images (multiple URLs)
  - SEO (meta title, description)
  - Status (active, featured)

### Edit Product
- **URL**: `/admin/products/[id]/edit`
- **Features**: Same as create + Delete button
- **Protection**: Can't delete products with orders

---

## 📋 Order Management

### List Orders
- **URL**: `/admin/orders`
- **Features**: 
  - Filter by status (11 states)
  - Search by order number, email
  - Stats cards (pending, processing, shipped, delivered)
  - Desktop table + mobile cards

### Order Statuses
```
1.  pending              - Order placed, awaiting payment
2.  payment_pending      - Payment processing
3.  paid                 - Payment confirmed
4.  processing           - Being prepared
5.  shipped              - Shipped to carrier
6.  in_transit           - On the way
7.  out_for_delivery     - Out for delivery
8.  delivered            - Delivered to customer
9.  cancelled            - Cancelled
10. refunded             - Refunded
11. failed               - Payment/order failed
```

### View Order Details
- **URL**: `/admin/orders/[id]`
- **Displays**:
  - All order items with images
  - Order totals (subtotal, shipping, tax)
  - Customer information
  - Shipping & billing addresses
  - Shipment history
  - Order exceptions
  - Internal notes

### Change Order Status
1. Go to order detail page
2. Select new status from dropdown
3. Add optional notes
4. Click "Update Status"
5. Notes are timestamped and saved

### Create Shipment
1. Go to order detail page
2. Click "Create Shipment"
3. Fill in form:
   - **Carrier**: DHL, FedEx, UPS, China Post, SF Express
   - **Tracking Number**: Required
   - **Estimated Delivery**: Optional
   - **Notes**: Optional
4. Click "Create Shipment"
5. Order status auto-updates to "shipped"

---

## 💼 Wholesale Management

### Wholesale Workflow (8 States)
```
1. new          - Just submitted
2. reviewing    - Under review
3. quoted       - Quote sent
4. negotiating  - Price negotiation
5. accepted     - Customer accepted quote
6. rejected     - Quote rejected
7. converted    - Converted to order
8. expired      - Quote expired
```

### List Inquiries
- **URL**: `/admin/wholesale`
- **Features**:
  - Filter by status
  - Search by company, contact, email
  - Stats cards (new, quoted, negotiating, converted)

### View Inquiry Details
- **URL**: `/admin/wholesale/[id]`
- **Displays**:
  - Company and contact info
  - Quantity requested
  - Target price
  - Customer message
  - Delivery address
  - Quote history
  - Activity timeline

### Create Quote
1. Go to inquiry detail page
2. Click "Create Quote"
3. Fill in form:
   - **Unit Price**: Price per unit (required)
   - **Quantity**: Number of units (pre-filled)
   - **Valid Until**: Expiration date (optional)
   - **Notes**: Additional details (optional)
4. See **Total Price** calculated automatically
5. Click "Create Quote"
6. Status auto-updates to "quoted"

### Convert to Order
1. Customer must accept a quote first
2. Go to inquiry detail page
3. Click "Convert to Order"
4. Confirm the conversion
5. New order is created
6. Redirects to order management
7. Inquiry status becomes "converted"

---

## 🗺️ Country Configuration

### APIs Available (UI Coming Soon)

**List Countries**: `GET /api/admin/countries`
**Create Country**: `POST /api/admin/countries`
**Get Country**: `GET /api/admin/countries/[id]`
**Update Country**: `PUT /api/admin/countries/[id]`
**Delete Country**: `DELETE /api/admin/countries/[id]`

### Country Fields
- Code (2-letter, e.g., "US", "CN")
- Name
- Currency
- Tax Rate
- Customs Threshold
- Shipping Restrictions (JSON)
- Payment Methods (JSON)
- Is Active

---

## 🎨 UI Features

### Desktop View
- Full tables with sortable columns
- Inline actions
- Status badges with colors
- Search bars
- Filter dropdowns

### Mobile View
- Card-based layouts
- Responsive grids
- Touch-friendly buttons
- Collapsible sections

### Status Colors
```
Blue    - New, In Transit
Yellow  - Pending, Reviewing
Purple  - Quoted, Shipped
Orange  - Negotiating, Payment Pending
Green   - Accepted, Delivered, Paid
Red     - Rejected, Cancelled, Failed
Teal    - Converted
Gray    - Expired, Inactive
```

---

## 🔍 Search & Filter

### Products
- Search: Name, SKU, description
- Filter: Category, status (active/inactive)
- Sort: Name, price, stock, date

### Orders
- Search: Order number, customer email, address
- Filter: Status (11 options)
- Sort: Date (newest first)

### Wholesale
- Search: Company, contact name, email
- Filter: Status (8 options)
- Sort: Date (newest first)

---

## 📊 Statistics Dashboard

### Order Stats (Top of orders page)
- **Pending**: Orders awaiting processing
- **Processing**: Orders being prepared
- **Shipped**: Orders sent to carrier
- **Delivered**: Completed orders

### Wholesale Stats (Top of wholesale page)
- **New Inquiries**: Just submitted
- **Quoted**: Quotes sent
- **Negotiating**: Active negotiations
- **Converted**: Successfully converted

---

## ⚡ Quick Actions

### From Product List
- **Create Product**: Top right button
- **Edit Product**: Click edit icon on row
- **Search**: Use search bar
- **Filter**: Use category/status dropdowns

### From Order List
- **View Details**: Click "View" button
- **Filter Status**: Use status dropdown
- **Search**: Use search bar
- **Export**: Top right button (placeholder)

### From Order Detail
- **Update Status**: Status dropdown + notes
- **Create Shipment**: Shipment form
- **Generate Invoice**: Quick actions (placeholder)
- **Packing Slip**: Quick actions (placeholder)
- **Customs Docs**: Quick actions (placeholder)

### From Wholesale List
- **View Details**: Click "View" button
- **Filter Status**: Use status dropdown
- **Search**: Use search bar

### From Wholesale Detail
- **Create Quote**: Quote form
- **Update Status**: Status dropdown
- **Convert to Order**: Quick actions button

---

## 🛡️ Data Protection

### Product Delete
- ❌ Can't delete if product has orders
- ✅ Suggests marking as inactive instead

### Country Delete
- ❌ Can't delete if country has shipping rates
- ✅ Suggests marking as inactive instead

### Status Transitions
- ✅ All status changes are validated
- ✅ Status changes are logged with timestamps
- ✅ Internal notes track all changes

---

## 🎯 Common Workflows

### New Order Workflow
1. Customer places order → Status: `pending`
2. Payment confirmed → Status: `paid`
3. Start preparing → Status: `processing`
4. Create shipment → Status: `shipped`
5. Carrier delivers → Status: `delivered`

### Wholesale Workflow
1. Inquiry submitted → Status: `new`
2. Review inquiry → Status: `reviewing`
3. Create quote → Status: `quoted`
4. Negotiate if needed → Status: `negotiating`
5. Customer accepts → Status: `accepted`
6. Convert to order → Status: `converted`

### Product Management Workflow
1. Create product with all details
2. Set pricing (regular, compare, wholesale)
3. Configure inventory (stock, threshold)
4. Add images (multiple URLs)
5. Set compliance (weight, HS code)
6. Activate product
7. Edit anytime as needed

---

## 📞 Support & Documentation

### Main Documentation
- `SESSION_COMPLETION_SUMMARY.md` - What was built
- `PHASE1_IMPLEMENTATION_STATUS.md` - Detailed status
- `DATABASE_CONFIRMED_WORKING.md` - Database info
- `START_HERE.md` - Getting started
- `ADMIN_QUICK_GUIDE.md` - This file

### Database Info
- **Database**: PostgreSQL on localhost:5432
- **Name**: ecommerce
- **Tables**: 21 tables
- **Sample Data**: 5 products, 3 categories, 2 countries

### Server Info
- **URL**: http://localhost:3001
- **Status**: Running
- **Framework**: Next.js 14
- **Database**: Prisma + PostgreSQL

---

## 🎓 Tips & Tricks

### For Products
- Use clear, unique SKUs
- Set wholesale price for B2B customers
- Configure low stock threshold for alerts
- Mark fragile/dangerous goods for shipping
- Add multiple images for better presentation

### For Orders
- Update status regularly for customer tracking
- Add internal notes for team communication
- Create shipments promptly after processing
- Use exceptions to flag issues

### For Wholesale
- Respond to inquiries quickly (shows as "reviewing")
- Create competitive quotes
- Set reasonable validity periods (30 days default)
- Add notes to quotes explaining value
- Convert accepted quotes promptly

---

## ✅ Checklist for Daily Operations

### Morning
- [ ] Check new orders (pending status)
- [ ] Check new wholesale inquiries
- [ ] Review low stock products
- [ ] Process pending shipments

### Throughout Day
- [ ] Update order statuses as items ship
- [ ] Respond to wholesale inquiries
- [ ] Create quotes for inquiries
- [ ] Handle order exceptions

### Evening
- [ ] Verify all shipments created
- [ ] Update tracking information
- [ ] Review pending items for tomorrow
- [ ] Check inventory levels

---

## 🚀 You're Ready!

Your admin panel is fully functional with:
- ✅ Complete product management
- ✅ Full order processing workflow
- ✅ Wholesale B2B management
- ✅ Shipment tracking
- ✅ Status management
- ✅ Search and filtering
- ✅ Responsive design
- ✅ Real-time updates

**Start managing your e-commerce platform now!**

Visit: **http://localhost:3001/admin/products**

