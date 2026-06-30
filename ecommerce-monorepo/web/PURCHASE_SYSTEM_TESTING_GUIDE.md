# 🧪 PURCHASE MANAGEMENT SYSTEM - TESTING GUIDE

## 📋 COMPLETE TESTING CHECKLIST

---

## ⚡ QUICK START TEST (5 minutes)

### Prerequisites
- [ ] Database migrated successfully
- [ ] Prisma client generated
- [ ] Dev server running (`npm run dev`)
- [ ] Admin user logged in

### Quick Smoke Test

```bash
# 1. Access Suppliers page
http://localhost:3000/admin/suppliers

# 2. Access Purchase Orders page
http://localhost:3000/admin/purchase-orders

# 3. If both pages load without errors: ✅ System is working!
```

---

## 🎯 DETAILED TESTING SCENARIOS

### TEST SUITE 1: SUPPLIER MANAGEMENT

#### Test 1.1: Create Supplier ✅

**Steps:**
1. Navigate to `/admin/suppliers`
2. Click "Add Supplier" button
3. Fill in form:
   - Name: `Test Supplier Co.`
   - Company Name: `Test Supplier Company Ltd.`
   - Email: `test@supplier.com`
   - Phone: `+1 234 567 8900`
   - Contact Person: `John Doe`
   - Payment Terms: `Net 30`
   - Currency: `USD`
4. Click "Save Supplier"

**Expected Results:**
- ✅ Success toast notification appears
- ✅ Dialog closes
- ✅ Supplier appears in list
- ✅ Status badge shows "Active"

**Validation:**
- Check database: `SELECT * FROM suppliers WHERE name = 'Test Supplier Co.'`

---

#### Test 1.2: Edit Supplier ✅

**Steps:**
1. Click edit button (pencil icon) on test supplier
2. Change email to `updated@supplier.com`
3. Change payment terms to `Net 60`
4. Click "Save Supplier"

**Expected Results:**
- ✅ Success toast notification
- ✅ Changes reflected in list
- ✅ Updated timestamp changed

---

#### Test 1.3: Search Supplier ✅

**Steps:**
1. Type `Test` in search box
2. Verify test supplier appears
3. Type `NonExistent`
4. Verify "No suppliers found" message

**Expected Results:**
- ✅ Search filters results in real-time
- ✅ Case-insensitive search works

---

#### Test 1.4: Delete Supplier (Without POs) ✅

**Steps:**
1. Create a new supplier without any POs
2. Click delete button (trash icon)
3. Confirm deletion in confirmation dialog
4. Observe result

**Expected Results:**
- ✅ Success toast notification
- ✅ Supplier removed from list
- ✅ Deleted from database

---

#### Test 1.5: Delete Supplier (With POs) ❌

**Steps:**
1. Try to delete a supplier that has purchase orders
2. Confirm deletion

**Expected Results:**
- ✅ Error toast: "Cannot delete supplier with existing purchase orders"
- ✅ Supplier remains in list
- ✅ Data integrity maintained

---

### TEST SUITE 2: PURCHASE ORDER CREATION

#### Test 2.1: Create Draft Purchase Order ✅

**Steps:**
1. Navigate to `/admin/purchase-orders`
2. Click "Create Purchase Order"
3. Select supplier: `Test Supplier Co.`
4. Set Order Date: `Today`
5. Click "Add Item" button
6. Select a product from dropdown
7. Set Quantity: `50`
8. Verify unit price auto-fills
9. Add another item
10. Set Tax: `100`
11. Set Shipping: `50`
12. Set Discount: `25`
13. Click "Create Purchase Order"

**Expected Results:**
- ✅ PO created successfully
- ✅ Redirected to PO list
- ✅ New PO appears with status "DRAFT"
- ✅ PO number auto-generated (e.g., PO-0001)
- ✅ Totals calculated correctly:
  - Subtotal = sum of (quantity × unitPrice)
  - Total = Subtotal + Tax + Shipping - Discount

**Validation:**
```sql
SELECT * FROM purchase_orders ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM purchase_order_items WHERE "purchaseOrderId" = 'NEW_PO_ID';
```

---

#### Test 2.2: Verify PO Number Increment ✅

**Steps:**
1. Create first PO → Note PO number (e.g., PO-0001)
2. Create second PO → Note PO number (e.g., PO-0002)
3. Create third PO → Note PO number (e.g., PO-0003)

**Expected Results:**
- ✅ PO numbers increment sequentially
- ✅ No duplicates
- ✅ Format: PO-XXXX (4 digits, zero-padded)

---

#### Test 2.3: Form Validation ✅

**Steps:**
1. Try to create PO without selecting supplier
2. Try to create PO without adding items
3. Try to create PO with negative quantities
4. Try to create PO with negative prices

**Expected Results:**
- ✅ Cannot submit without supplier
- ✅ Cannot submit without items
- ✅ Validation messages shown
- ✅ Form prevents invalid data

---

### TEST SUITE 3: PURCHASE ORDER WORKFLOW

#### Test 3.1: Status Progression ✅

**Steps:**
1. Create PO (Status: DRAFT)
2. Open PO details page
3. Click "Send to Supplier" → (Status: SENT)
4. Manually update status to CONFIRMED
5. Manually update status to SHIPPED
6. Click "Receive Order" → (Status: RECEIVED)

**Expected Results:**
- ✅ Each status change updates correctly
- ✅ Status badge color changes
- ✅ Timestamp fields update (orderDate, receivedDate)
- ✅ Status-specific actions appear/disappear

---

#### Test 3.2: Receive Order & Inventory Update ⭐

**Steps:**
1. Create PO with 2 items:
   - Item A: Quantity 100
   - Item B: Quantity 50
2. Note current stock levels:
   - Product A stock: X
   - Product B stock: Y
3. Send PO to supplier
4. Mark as CONFIRMED
5. Mark as SHIPPED
6. Click "Receive Order"
7. Confirm quantities:
   - Item A: Receive 100
   - Item B: Receive 50
8. Click "Confirm Receipt"
9. Check product stock levels

**Expected Results:**
- ✅ PO status changes to RECEIVED
- ✅ Received date is set to now
- ✅ Product A stock = X + 100
- ✅ Product B stock = Y + 50
- ✅ Cost prices updated from PO
- ✅ Success toast shown

**Validation:**
```sql
-- Check PO status
SELECT status, "receivedDate" FROM purchase_orders WHERE id = 'PO_ID';

-- Check item received quantities
SELECT "productName", quantity, "receivedQuantity" 
FROM purchase_order_items 
WHERE "purchaseOrderId" = 'PO_ID';

-- Check product stock
SELECT name, sku, stock, "costPrice" 
FROM products 
WHERE id IN ('PRODUCT_A_ID', 'PRODUCT_B_ID');
```

---

#### Test 3.3: Partial Receipt ✅

**Steps:**
1. Create PO with Item: Quantity 100
2. Receive order but enter Received Quantity: 80
3. Confirm receipt

**Expected Results:**
- ✅ Stock increases by 80 (not 100)
- ✅ PO item shows: ordered 100, received 80
- ✅ Can track shortfall

---

#### Test 3.4: Cancel Purchase Order ✅

**Steps:**
1. Create PO (any status except RECEIVED/CLOSED)
2. Open PO details
3. Click "Cancel Order"
4. Confirm cancellation

**Expected Results:**
- ✅ Status changes to CANCELLED
- ✅ PO cannot be received
- ✅ Inventory not affected
- ✅ Historical record maintained

---

### TEST SUITE 4: SEARCH & FILTERING

#### Test 4.1: Search Purchase Orders ✅

**Steps:**
1. Go to Purchase Orders list
2. Search by PO number: `PO-0001`
3. Search by supplier name: `Test Supplier`
4. Clear search

**Expected Results:**
- ✅ Results filter in real-time
- ✅ Case-insensitive search
- ✅ Searches both PO number and supplier name

---

#### Test 4.2: Filter by Status ✅

**Steps:**
1. Use status dropdown filter
2. Select "DRAFT" → Only draft POs shown
3. Select "RECEIVED" → Only received POs shown
4. Select "All Status" → All POs shown

**Expected Results:**
- ✅ Filters work correctly
- ✅ List updates immediately
- ✅ Count matches filtered results

---

### TEST SUITE 5: CALCULATIONS & TOTALS

#### Test 5.1: Item Total Calculation ✅

**Steps:**
1. Add item with:
   - Quantity: 10
   - Unit Price: 15.50
2. Verify total shows: 155.00

**Expected Results:**
- ✅ Total = Quantity × Unit Price
- ✅ Decimal precision correct
- ✅ Updates on quantity/price change

---

#### Test 5.2: Order Total Calculation ✅

**Steps:**
1. Create PO with:
   - Item 1: 10 × $15 = $150
   - Item 2: 5 × $20 = $100
   - Subtotal: $250
   - Tax: $12.50
   - Shipping: $30
   - Discount: $10
2. Verify total: $282.50

**Expected Results:**
- ✅ Subtotal = sum of item totals
- ✅ Total = Subtotal + Tax + Shipping - Discount
- ✅ All decimals displayed correctly

---

### TEST SUITE 6: DATA INTEGRITY

#### Test 6.1: Product Snapshot ✅

**Steps:**
1. Create PO with product "Keyboard" (SKU: KB-001)
2. After creation, edit product name to "Mechanical Keyboard"
3. View PO details

**Expected Results:**
- ✅ PO still shows original name: "Keyboard"
- ✅ Historical accuracy maintained
- ✅ Product changes don't affect existing POs

---

#### Test 6.2: Transaction Rollback ✅

**Steps:**
1. Create PO with multiple items
2. Simulate error during receive (disconnect network)
3. Try to receive order
4. Check database

**Expected Results:**
- ✅ Error handled gracefully
- ✅ No partial updates (all-or-nothing)
- ✅ Data consistency maintained
- ✅ Stock levels unchanged

---

### TEST SUITE 7: UI/UX TESTING

#### Test 7.1: Responsive Design ✅

**Steps:**
1. Test on desktop (1920×1080)
2. Test on tablet (768×1024)
3. Test on mobile (375×667)
4. Rotate device (portrait/landscape)

**Expected Results:**
- ✅ Tables scroll horizontally on small screens
- ✅ Forms stack vertically on mobile
- ✅ Buttons accessible
- ✅ Text readable without zooming

---

#### Test 7.2: Loading States ✅

**Steps:**
1. Observe when data is loading
2. Check spinner/skeleton appears
3. Verify data displays after load

**Expected Results:**
- ✅ Loading indicators shown
- ✅ No flash of empty state
- ✅ Smooth transition

---

#### Test 7.3: Error Handling ✅

**Steps:**
1. Disconnect from database
2. Try to create supplier
3. Try to load PO list
4. Reconnect and retry

**Expected Results:**
- ✅ User-friendly error messages
- ✅ No app crashes
- ✅ Retry mechanism works
- ✅ Data not corrupted

---

### TEST SUITE 8: PERFORMANCE

#### Test 8.1: Large Dataset Performance ✅

**Steps:**
1. Create 100+ suppliers
2. Create 500+ purchase orders
3. Test list page loading
4. Test search performance
5. Test filtering speed

**Expected Results:**
- ✅ Page loads in < 2 seconds
- ✅ Search results instant (< 300ms)
- ✅ No UI freezing
- ✅ Pagination works smoothly

---

#### Test 8.2: Concurrent Users ✅

**Steps:**
1. Open multiple browser tabs
2. Create PO in tab 1
3. View PO list in tab 2
4. Receive order in tab 1
5. Refresh tab 2

**Expected Results:**
- ✅ Data stays synchronized
- ✅ No conflicts
- ✅ Cache invalidation works
- ✅ React Query handles updates

---

### TEST SUITE 9: EDGE CASES

#### Test 9.1: Empty States ✅

**Steps:**
1. View suppliers page with no suppliers
2. View PO page with no POs
3. Create PO with no items

**Expected Results:**
- ✅ "No suppliers found" message
- ✅ "No purchase orders found" message
- ✅ Cannot create PO without items

---

#### Test 9.2: Very Large Numbers ✅

**Steps:**
1. Create PO with:
   - Quantity: 999,999
   - Unit Price: 9,999.99
2. Calculate total
3. Save PO

**Expected Results:**
- ✅ Numbers display correctly
- ✅ No overflow errors
- ✅ Currency format maintained
- ✅ Database stores accurately

---

#### Test 9.3: Special Characters ✅

**Steps:**
1. Create supplier with name: `O'Brien & Co.`
2. Add notes with special chars: `<script>alert("test")</script>`
3. Save and retrieve

**Expected Results:**
- ✅ Special characters stored correctly
- ✅ No XSS vulnerabilities
- ✅ Data sanitized properly
- ✅ Display renders safely

---

### TEST SUITE 10: INTEGRATION TESTS

#### Test 10.1: End-to-End Procurement Flow ✅

**Complete workflow test:**

```
1. Create Supplier
   ↓
2. Create Product (if needed)
   ↓
3. Create Purchase Order
   - Add multiple items
   - Set expected delivery
   ↓
4. Send to Supplier
   ↓
5. Mark as Confirmed
   ↓
6. Mark as Shipped
   ↓
7. Receive Order
   - Verify inventory increases
   - Verify cost prices update
   ↓
8. Record Payment (if implemented)
   ↓
9. Close PO
   ↓
10. Generate Reports (if implemented)
```

**Expected Results:**
- ✅ All steps complete successfully
- ✅ Data flows correctly between modules
- ✅ Inventory accurately reflects received goods
- ✅ Historical data preserved

---

## 🐛 KNOWN ISSUES & LIMITATIONS

### Current Limitations:
1. PDF generation not yet implemented
2. Email notifications not configured
3. Bulk receive not supported
4. Multi-currency calculations simplified
5. No approval workflow (single-user system)

### Future Enhancements:
- [ ] Purchase analytics dashboard
- [ ] Supplier performance metrics
- [ ] Automated reorder points
- [ ] Purchase forecasting
- [ ] Multi-location support

---

## ✅ TEST RESULTS TEMPLATE

```
Test Date: _______________
Tester: _______________
Environment: □ Development  □ Staging  □ Production

Test Suite 1: Supplier Management
  [ ] 1.1 Create Supplier
  [ ] 1.2 Edit Supplier
  [ ] 1.3 Search Supplier
  [ ] 1.4 Delete Supplier (No POs)
  [ ] 1.5 Delete Supplier (With POs)

Test Suite 2: Purchase Order Creation
  [ ] 2.1 Create Draft PO
  [ ] 2.2 Verify PO Number Increment
  [ ] 2.3 Form Validation

Test Suite 3: Purchase Order Workflow
  [ ] 3.1 Status Progression
  [ ] 3.2 Receive Order & Inventory Update ⭐
  [ ] 3.3 Partial Receipt
  [ ] 3.4 Cancel Purchase Order

Test Suite 4: Search & Filtering
  [ ] 4.1 Search Purchase Orders
  [ ] 4.2 Filter by Status

Test Suite 5: Calculations & Totals
  [ ] 5.1 Item Total Calculation
  [ ] 5.2 Order Total Calculation

Test Suite 6: Data Integrity
  [ ] 6.1 Product Snapshot
  [ ] 6.2 Transaction Rollback

Test Suite 7: UI/UX Testing
  [ ] 7.1 Responsive Design
  [ ] 7.2 Loading States
  [ ] 7.3 Error Handling

Test Suite 8: Performance
  [ ] 8.1 Large Dataset Performance
  [ ] 8.2 Concurrent Users

Test Suite 9: Edge Cases
  [ ] 9.1 Empty States
  [ ] 9.2 Very Large Numbers
  [ ] 9.3 Special Characters

Test Suite 10: Integration
  [ ] 10.1 End-to-End Procurement Flow

OVERALL RESULT: □ PASS  □ FAIL

Notes:
_________________________________________________
_________________________________________________
```

---

## 🚀 AUTOMATED TESTING (Future)

### Unit Tests Template:

```typescript
// Example: PO total calculation test
describe('Purchase Order Calculations', () => {
  it('should calculate total correctly', () => {
    const subtotal = 100
    const tax = 10
    const shipping = 5
    const discount = 3
    const total = subtotal + tax + shipping - discount
    expect(total).toBe(112)
  })
})
```

### Integration Tests Template:

```typescript
// Example: Receive order test
describe('Receive Purchase Order', () => {
  it('should update inventory when order received', async () => {
    const initialStock = await getProductStock(productId)
    await receivePurchaseOrder(poId, receivedQuantity)
    const finalStock = await getProductStock(productId)
    expect(finalStock).toBe(initialStock + receivedQuantity)
  })
})
```

---

## 📊 TEST COVERAGE GOALS

Target Coverage:
- Unit Tests: 80%+
- Integration Tests: 70%+
- E2E Tests: 50%+
- Manual Tests: 100% (critical paths)

Critical Paths (Must Test):
1. ⭐ Create supplier
2. ⭐ Create purchase order
3. ⭐ Receive order (inventory update)
4. ⭐ Status workflow
5. ⭐ Search and filter

---

## 🎯 SUCCESS CRITERIA

System is ready for production when:
- [ ] All critical tests pass
- [ ] No data corruption issues
- [ ] Performance meets requirements
- [ ] UI/UX meets standards
- [ ] Security validated
- [ ] Documentation complete

---

## 📞 REPORTING ISSUES

When reporting bugs, include:
1. Test scenario being executed
2. Steps to reproduce
3. Expected result
4. Actual result
5. Screenshots/videos
6. Browser/environment details
7. Database state (if relevant)

---

**Testing Guide Version:** 1.0.0  
**Last Updated:** June 29, 2026  
**Status:** ✅ Ready for Testing
