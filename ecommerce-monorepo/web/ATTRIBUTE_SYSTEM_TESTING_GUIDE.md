# 🧪 Attribute System - Testing Guide

## 📋 Testing Checklist

### Phase 1: Database & Migration ✅

- [x] **Migration Applied**
  ```bash
  cd web
  npx prisma migrate status
  # Should show: 20260625182745_add_attribute_system
  ```

- [x] **Schema Validation**
  ```bash
  npx prisma validate
  # Should show: "The schema is valid"
  ```

- [x] **Generate Prisma Client**
  ```bash
  npx prisma generate
  # Should complete without errors
  ```

### Phase 2: Seed Sample Data

- [ ] **Run Attribute Seeder**
  ```bash
  # Windows
  SEED-ATTRIBUTES.bat
  
  # Or manually
  npx tsx prisma/seed-attributes.ts
  ```

- [ ] **Verify Seeded Data**
  Expected results:
  - Clothing: 5 attributes
  - Electronics: 6 attributes
  - Cookware: 6 attributes
  - Furniture: 6 attributes
  - Home & Garden: 4 attributes

### Phase 3: Admin UI Testing

#### 3.1 Access Attribute Manager

- [ ] **Navigate to Page**
  - URL: `http://localhost:3000/admin/attributes`
  - Should load without errors
  - Should show category list on left
  - Should show "Select a category" message on right

- [ ] **Check Sidebar**
  - "Attributes" menu item should be visible
  - Icon should be a Tag icon
  - Should highlight when on /admin/attributes

#### 3.2 Category Selection

- [ ] **Select Category**
  - Click on "Clothing" category
  - Should show 5 attributes in the table
  - Category card should highlight
  - Attribute count badge should show "5"

- [ ] **Switch Categories**
  - Click on "Electronics"
  - Table should update to show electronics attributes
  - Previous selection should unhighlight

#### 3.3 Create Attribute

- [ ] **Open Dialog**
  - Select a category (e.g., Clothing)
  - Click "+ Add Attribute" button
  - Dialog should open with empty form

- [ ] **Fill Form - TEXT Type**
  - Name: "Test Brand"
  - Type: Text
  - Placeholder: "Enter brand name"
  - Helper: "Brand or manufacturer"
  - Required: No
  - Filterable: Yes
  - Click "Create Attribute"
  - Should show success toast
  - Dialog should close
  - New attribute should appear in table

- [ ] **Fill Form - SELECT Type**
  - Name: "Test Size"
  - Type: Select (Dropdown)
  - Options: "S, M, L, XL"
  - Required: Yes
  - Filterable: Yes
  - Variant: Yes
  - Click "Create Attribute"
  - Should create successfully

- [ ] **Fill Form - COLOR Type**
  - Name: "Test Color"
  - Type: Color Picker
  - Required: Yes
  - Click "Create Attribute"
  - Should create successfully

- [ ] **Fill Form - CHECKBOX Type**
  - Name: "Test Waterproof"
  - Type: Checkbox
  - Helper: "Is waterproof?"
  - Click "Create Attribute"
  - Should create successfully

- [ ] **Slug Auto-Generation**
  - Name: "My Test Attribute"
  - Slug field should auto-fill with "my_test_attribute"
  - Can manually override slug
  - Slug should be URL-friendly

#### 3.4 Edit Attribute

- [ ] **Open Edit Dialog**
  - Click pencil icon (✏️) next to an attribute
  - Dialog should open with pre-filled values
  - Title should say "Edit Attribute"

- [ ] **Update Values**
  - Change name
  - Add/modify options (for SELECT types)
  - Update toggles
  - Click "Update Attribute"
  - Should show success toast
  - Table should update

#### 3.5 Delete Attribute

- [ ] **Delete Unused Attribute**
  - Click trash icon (🗑️) next to a test attribute
  - Should show confirmation dialog
  - Confirm deletion
  - Should show success toast
  - Attribute should disappear from table

- [ ] **Try Delete Used Attribute**
  - Try to delete an attribute in use by products
  - Should show error: "Cannot delete attribute that is being used by products"
  - Attribute should remain in table

#### 3.6 Toggle Visibility

- [ ] **Hide Attribute**
  - Toggle the visibility switch to OFF
  - Should update immediately (optimistic update)
  - No page refresh needed

- [ ] **Show Attribute**
  - Toggle the visibility switch to ON
  - Should update immediately

#### 3.7 Validation Testing

- [ ] **Empty Name**
  - Try to create without name
  - Should show validation error
  - Form should not submit

- [ ] **Duplicate Slug**
  - Try to create with existing slug
  - Should show error: "An attribute with this slug already exists"

- [ ] **SELECT Without Options**
  - Create SELECT type
  - Leave options empty
  - Should create but work correctly

### Phase 4: API Testing

#### 4.1 GET Endpoints

- [ ] **List All Attributes**
  ```bash
  curl http://localhost:3000/api/admin/attributes
  ```
  - Should return array of attributes
  - Should include category associations
  - Should include usage counts

- [ ] **Get Single Attribute**
  ```bash
  curl http://localhost:3000/api/admin/attributes/[ATTRIBUTE_ID]
  ```
  - Should return single attribute
  - Should include full details

- [ ] **Get Category Attributes**
  ```bash
  curl http://localhost:3000/api/admin/categories/[CATEGORY_ID]/attributes
  ```
  - Should return attributes for that category
  - Should be ordered by displayOrder

- [ ] **List Categories with Counts**
  ```bash
  curl "http://localhost:3000/api/admin/categories?includeAttributes=true"
  ```
  - Should include _count.attributes for each category

#### 4.2 POST Endpoint

- [ ] **Create Attribute**
  ```bash
  curl -X POST http://localhost:3000/api/admin/attributes \
    -H "Content-Type: application/json" \
    -d '{
      "name": "API Test",
      "type": "TEXT",
      "categoryId": "[CATEGORY_ID]"
    }'
  ```
  - Should return 201 status
  - Should return created attribute

#### 4.3 PUT Endpoint

- [ ] **Update Attribute**
  ```bash
  curl -X PUT http://localhost:3000/api/admin/attributes/[ATTRIBUTE_ID] \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Name"
    }'
  ```
  - Should return 200 status
  - Should return updated attribute

#### 4.4 DELETE Endpoint

- [ ] **Delete Attribute**
  ```bash
  curl -X DELETE http://localhost:3000/api/admin/attributes/[ATTRIBUTE_ID]
  ```
  - Should return success message
  - Attribute should be deleted

### Phase 5: Database Verification

- [ ] **Check Tables**
  ```sql
  -- Connect to PostgreSQL
  psql -U postgres -d ecommerce
  
  -- Count attributes
  SELECT COUNT(*) FROM attributes;
  
  -- Count category attributes
  SELECT COUNT(*) FROM category_attributes;
  
  -- View attributes by category
  SELECT 
    c.name as category,
    COUNT(ca.id) as attribute_count
  FROM categories c
  LEFT JOIN category_attributes ca ON c.id = ca."categoryId"
  GROUP BY c.name
  ORDER BY attribute_count DESC;
  ```

- [ ] **Check Relationships**
  ```sql
  -- View full attribute details
  SELECT 
    a.name,
    a.type,
    a.slug,
    c.name as category,
    ca."isRequired",
    ca."isVisible"
  FROM attributes a
  JOIN category_attributes ca ON a.id = ca."attributeId"
  JOIN categories c ON c.id = ca."categoryId"
  ORDER BY c.name, a."displayOrder";
  ```

### Phase 6: Responsive Design

- [ ] **Desktop View (1920x1080)**
  - Two-column layout should display properly
  - All buttons visible
  - Table scrolls if needed

- [ ] **Tablet View (768x1024)**
  - Layout should adapt
  - Sidebar should be collapsible
  - Forms should be readable

- [ ] **Mobile View (375x667)**
  - Mobile menu should work
  - Category list should be scrollable
  - Forms should stack vertically
  - Touch targets should be large enough

### Phase 7: Error Handling

- [ ] **Network Error**
  - Disconnect network
  - Try to create attribute
  - Should show error toast
  - UI should remain responsive

- [ ] **Server Error**
  - Stop backend server
  - Try to load attributes
  - Should show error message
  - Should handle gracefully

- [ ] **Invalid Data**
  - Send malformed JSON via API
  - Should return 400 error
  - Should not crash

### Phase 8: Performance

- [ ] **Page Load Time**
  - Page should load in < 2 seconds
  - No visible lag

- [ ] **Form Submit**
  - Should respond in < 500ms
  - Optimistic updates should be immediate

- [ ] **Large Dataset**
  - Create 50+ attributes
  - Page should still be responsive
  - Scrolling should be smooth

### Phase 9: Security

- [ ] **Authentication**
  - Logout and try to access /admin/attributes
  - Should redirect to login

- [ ] **Authorization**
  - Login as non-admin user
  - Try to access /admin/attributes
  - Should show "Unauthorized" or redirect

- [ ] **SQL Injection**
  - Try to inject SQL in name field
  - Should be sanitized by Prisma

- [ ] **XSS Attack**
  - Try to inject `<script>alert('XSS')</script>` in fields
  - Should be escaped by React

### Phase 10: Cross-Browser Testing

- [ ] **Chrome**
  - All features work
  - UI renders correctly

- [ ] **Firefox**
  - All features work
  - UI renders correctly

- [ ] **Safari**
  - All features work
  - UI renders correctly

- [ ] **Edge**
  - All features work
  - UI renders correctly

## 🐛 Common Issues & Solutions

### Issue 1: Migration Error
**Problem:** `type "datetime" does not exist`
**Solution:** Delete bad migration, run `prisma migrate dev` again

### Issue 2: Prisma Client Not Updated
**Problem:** TypeScript errors about missing types
**Solution:** Run `npx prisma generate`

### Issue 3: Page Not Loading
**Problem:** 404 error on /admin/attributes
**Solution:** Restart dev server (`npm run dev`)

### Issue 4: Empty Category List
**Problem:** No categories showing
**Solution:** Ensure categories exist in database, check API response

### Issue 5: Cannot Delete Attribute
**Problem:** Delete button not working
**Solution:** Check if attribute is in use, see error message

## ✅ Success Criteria

All tests should pass before considering Phase 1 complete:

- ✅ Database migration applied successfully
- ✅ Sample attributes seeded
- ✅ Admin page loads without errors
- ✅ Can create attributes of all 10 types
- ✅ Can edit existing attributes
- ✅ Can delete unused attributes
- ✅ Cannot delete used attributes
- ✅ Visibility toggle works
- ✅ Form validation works
- ✅ Slug auto-generation works
- ✅ API endpoints respond correctly
- ✅ Responsive on mobile
- ✅ Error handling works
- ✅ Toast notifications appear
- ✅ Database records are correct

## 📊 Test Results Template

```
Date: _______________
Tester: _____________

PHASE 1: Database & Migration
[ ] Migration Applied
[ ] Schema Valid
[ ] Prisma Client Generated

PHASE 2: Seed Data
[ ] Seeder Ran Successfully
[ ] Data Verified

PHASE 3: Admin UI
[ ] Page Accessible
[ ] Create Attribute Works
[ ] Edit Attribute Works
[ ] Delete Attribute Works
[ ] Toggle Visibility Works

PHASE 4: API Testing
[ ] All GET Endpoints Work
[ ] POST Endpoint Works
[ ] PUT Endpoint Works
[ ] DELETE Endpoint Works

PHASE 5: Database Verification
[ ] Tables Created Correctly
[ ] Relationships Valid

PHASE 6: Responsive Design
[ ] Desktop View OK
[ ] Tablet View OK
[ ] Mobile View OK

PHASE 7: Error Handling
[ ] Network Errors Handled
[ ] Server Errors Handled
[ ] Invalid Data Handled

PHASE 8: Performance
[ ] Fast Page Load
[ ] Fast Form Submit
[ ] Smooth Scrolling

PHASE 9: Security
[ ] Authentication Required
[ ] Authorization Enforced
[ ] SQL Injection Prevented
[ ] XSS Prevented

PHASE 10: Cross-Browser
[ ] Chrome OK
[ ] Firefox OK
[ ] Safari OK
[ ] Edge OK

OVERALL STATUS: [ ] PASS [ ] FAIL

NOTES:
_______________________________________________
_______________________________________________
_______________________________________________
```

## 🎉 After Testing

Once all tests pass:
1. Document any bugs found and fixed
2. Create production backup before deploying
3. Deploy to staging environment first
4. Perform smoke tests in staging
5. Deploy to production
6. Monitor error logs for first 24 hours

## 📞 Support

If you encounter issues during testing:
1. Check error logs in browser console
2. Check server logs in terminal
3. Review API responses in Network tab
4. Consult documentation files
5. Check database directly with SQL queries
