# 📋 PURCHASE MANAGEMENT SYSTEM - CHEAT SHEET

## ⚡ QUICK SETUP

```bash
cd web
npx prisma migrate dev --name add_purchase_management_system
npx prisma generate
npm run dev
```

---

## 🔗 QUICK ACCESS URLS

| Feature | URL |
|---------|-----|
| Suppliers List | `http://localhost:3000/admin/suppliers` |
| Purchase Orders | `http://localhost:3000/admin/purchase-orders` |
| Create PO | `http://localhost:3000/admin/purchase-orders/new` |

---

## 🎯 KEY ACTIONS

### Add Supplier
1. Admin → Suppliers
2. Click "Add Supplier"
3. Fill name, email, payment terms
4. Save

### Create Purchase Order
1. Admin → Purchase Orders
2. Click "Create Purchase Order"
3. Select supplier
4. Add items
5. Set quantities & prices
6. Create

### Receive Order (Updates Inventory!)
1. Open PO details
2. Mark as "Shipped" (if not already)
3. Click "Receive Order"
4. Confirm quantities
5. Submit
6. ✨ **Stock automatically increases!**

---

## 📊 STATUS WORKFLOW

```
DRAFT → SENT → CONFIRMED → SHIPPED → RECEIVED → CLOSED
                                ↓
                            CANCELLED
```

---

## 🗂️ DATABASE MODELS

```
Supplier
  ├── name
  ├── email, phone, address
  ├── paymentTerms
  └── PurchaseOrders[]

PurchaseOrder
  ├── poNumber (auto)
  ├── supplierId
  ├── status
  ├── total
  └── items[]

PurchaseOrderItem
  ├── productId
  ├── quantity
  ├── unitPrice
  └── receivedQuantity

Product
  ├── costPrice (updated on receive)
  ├── stock (updated on receive)
  └── suppliers[]
```

---

## 🔌 API ENDPOINTS

### Suppliers
```
GET    /api/admin/suppliers
POST   /api/admin/suppliers
GET    /api/admin/suppliers/[id]
PUT    /api/admin/suppliers/[id]
DELETE /api/admin/suppliers/[id]
```

### Purchase Orders
```
GET  /api/admin/purchase-orders
POST /api/admin/purchase-orders
GET  /api/admin/purchase-orders/[id]
PUT  /api/admin/purchase-orders/[id]
PUT  /api/admin/purchase-orders/[id]/status
POST /api/admin/purchase-orders/[id]/receive  ⭐ Updates inventory!
```

---

## 💰 PROFIT CALCULATION

```javascript
// After receiving PO, you have:
const costPrice = purchaseOrderItem.unitPrice  // $10
const salePrice = product.price                // $25
const profit = salePrice - costPrice           // $15
const margin = (profit / salePrice) * 100      // 60%
```

---

## 🎨 STATUS COLORS

| Status | Color | Meaning |
|--------|-------|---------|
| DRAFT | Gray | Just created |
| PENDING | Yellow | Awaiting approval |
| SENT | Blue | Sent to supplier |
| CONFIRMED | Indigo | Supplier confirmed |
| SHIPPED | Purple | In transit |
| RECEIVED | Green | ✅ Inventory updated |
| CANCELLED | Red | Cancelled |
| CLOSED | Gray | Paid & complete |

---

## 🔒 BUSINESS RULES

- ❌ Can't delete suppliers with existing POs
- ❌ Can only delete DRAFT purchase orders
- ✅ Inventory updates only when status = RECEIVED
- ✅ PO numbers auto-increment (PO-0001, PO-0002...)
- ✅ Cost price updates on each receive

---

## 🛠️ COMMON TASKS

### Find Total Purchase Value
```
Admin → Purchase Orders → Check dashboard stats
```

### Track Pending Orders
```
Admin → Purchase Orders → Filter: PENDING
```

### Update Inventory
```
PO Details → Receive Order → Confirm quantities
```

### View Supplier History
```
Admin → Suppliers → Click supplier → View PO list
```

---

## 📁 KEY FILES

```
📂 web/
├── 📂 prisma/
│   └── schema.prisma          ⭐ 5 new models
├── 📂 app/admin/
│   ├── 📂 suppliers/
│   │   └── page.tsx           ⭐ Supplier management
│   └── 📂 purchase-orders/
│       ├── page.tsx           ⭐ PO list
│       ├── new/page.tsx       ⭐ Create PO
│       └── [id]/page.tsx      ⭐ PO details
└── 📂 app/api/admin/
    ├── 📂 suppliers/          ⭐ Supplier APIs
    └── 📂 purchase-orders/    ⭐ PO APIs
```

---

## 🧪 QUICK TEST

```bash
# 1. Create supplier
Admin → Suppliers → Add "Test Supplier"

# 2. Create PO
Admin → Purchase Orders → New
Select "Test Supplier"
Add any product
Quantity: 10
Unit Price: $5
Create

# 3. Receive PO
Open PO → Receive Order
Confirm quantity: 10
Submit

# 4. Verify
Products → Find product → Stock increased by 10 ✅
```

---

## 💡 PRO TIPS

### 1. Cost Tracking
```
Always receive POs to track cost prices
```

### 2. Search
```
Use search bar to quickly find POs or suppliers
```

### 3. Filters
```
Filter POs by status for better organization
```

### 4. Internal Notes
```
Use for negotiation history, not visible to suppliers
```

### 5. Urgent Flag
```
Mark time-sensitive orders as urgent
```

---

## ❓ TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Supplier not found | Create supplier first |
| Can't add items | Ensure products exist in catalog |
| Inventory not updating | Must receive order (status = RECEIVED) |
| Can't delete supplier | Supplier has existing POs |
| PO number not auto | Check database migration |

---

## 📱 KEYBOARD SHORTCUTS

| Action | Shortcut |
|--------|----------|
| Search | Click search box |
| Add Item | Click "Add Item" button |
| Save | Click save or press Enter in form |
| Cancel | Esc (closes dialogs) |

---

## 🎯 WORKFLOW EXAMPLE

```
1. Supplier emails: "We have keyboards in stock"
   ↓
2. Admin → Purchase Orders → New
   ↓
3. Select supplier, add keyboard item, qty 100
   ↓
4. Create PO (Status: DRAFT)
   ↓
5. Send to Supplier (Status: SENT)
   ↓
6. Supplier confirms (Status: CONFIRMED)
   ↓
7. Supplier ships (Status: SHIPPED)
   ↓
8. Receive at warehouse (Status: RECEIVED)
   ✨ Stock automatically increases by 100!
   ↓
9. Pay supplier, close PO (Status: CLOSED)
```

---

## 📊 CALCULATIONS

### Subtotal
```javascript
subtotal = sum(item.quantity × item.unitPrice)
```

### Total
```javascript
total = subtotal + tax + shipping - discount
```

### New Stock
```javascript
newStock = currentStock + receivedQuantity
```

---

## 🔐 PERMISSIONS

All purchase management features require:
- ✅ Admin authentication
- ✅ Admin role
- ✅ Active session

---

## 📖 DOCUMENTATION

| Document | Purpose |
|----------|---------|
| `PURCHASE_MANAGEMENT_SYSTEM.md` | Complete documentation |
| `🚀_PURCHASE_SYSTEM_QUICK_START.md` | Tutorial guide |
| `✅_PURCHASE_SYSTEM_COMPLETE.md` | Implementation summary |
| `PURCHASE_SYSTEM_CHEAT_SHEET.md` | This quick reference |

---

## 🚀 PRODUCTION CHECKLIST

Before going live:
- [ ] Database migrated
- [ ] Prisma client generated
- [ ] Test create supplier
- [ ] Test create PO
- [ ] Test receive PO
- [ ] Verify inventory updates
- [ ] Test all status changes
- [ ] Check search/filter works

---

## 🎉 YOU'RE READY!

Print this cheat sheet and keep it handy! 📋

**Quick Start:** `SETUP-PURCHASE-SYSTEM.bat`

---

**Version:** 1.0.0  
**Last Updated:** June 29, 2026  
**Status:** ✅ Production Ready
