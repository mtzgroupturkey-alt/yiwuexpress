# 🧪 Testing Product Image Upload Feature

## Quick Test Checklist

### ✅ Basic Upload Tests
- [ ] Can upload single image from computer
- [ ] Can upload multiple images at once
- [ ] Can add image via URL
- [ ] Images display correctly in grid
- [ ] Can mix uploaded and URL images

### ✅ Validation Tests
- [ ] Files over 5MB are rejected
- [ ] Invalid file formats are rejected
- [ ] Invalid URLs are rejected
- [ ] Can't exceed 10 images limit
- [ ] Error messages are clear

### ✅ Management Tests
- [ ] Can reorder images (up/down)
- [ ] Can remove images
- [ ] First image marked as thumbnail
- [ ] Image counter updates correctly
- [ ] Empty state shows when no images

### ✅ Integration Tests
- [ ] New product saves images correctly
- [ ] Edit product loads existing images
- [ ] Updated product saves changes
- [ ] Images persist in database

---

## Detailed Test Scenarios

### Test 1: Upload Single Image from Computer

**Steps:**
1. Go to Admin → Products → Add New Product
2. Scroll to "Product Images" section
3. Click "Upload from Computer"
4. Select one image file (JPEG, under 5MB)
5. Wait for upload to complete

**Expected Result:**
- ✓ Upload button shows "Uploading..."
- ✓ Image appears in grid after upload
- ✓ Image has "Thumbnail" badge
- ✓ Counter shows "1 / 10 images"
- ✓ Image shows "📁 Uploaded" label

---

### Test 2: Upload Multiple Images at Once

**Steps:**
1. Go to Product Images section
2. Click "Upload from Computer"
3. Select 3-5 images (hold Ctrl/Cmd)
4. Wait for all uploads to complete

**Expected Result:**
- ✓ All images upload sequentially
- ✓ Progress indicator shows during upload
- ✓ All images appear in grid
- ✓ First image has "Thumbnail" badge
- ✓ Counter shows correct count

---

### Test 3: Add Image from URL

**Steps:**
1. Click "Add from URL"
2. Paste: `https://picsum.photos/800/800`
3. Click "Add" or press Enter

**Expected Result:**
- ✓ Input field appears
- ✓ URL is accepted
- ✓ Image appears in grid immediately
- ✓ Image shows "🔗 URL" label
- ✓ Counter updates

---

### Test 4: File Size Validation

**Steps:**
1. Click "Upload from Computer"
2. Try to upload a file larger than 5MB

**Expected Result:**
- ✓ Error message appears: "File too large. Maximum size is 5MB"
- ✓ File is not uploaded
- ✓ Upload button returns to normal state

**How to Test:**
- Use any large image (>5MB)
- Or create test file: Download large photo from internet

---

### Test 5: Invalid File Format

**Steps:**
1. Click "Upload from Computer"
2. Try to upload a .txt, .pdf, or .zip file

**Expected Result:**
- ✓ File is rejected
- ✓ Error message appears about invalid format
- ✓ Only image files are accepted

---

### Test 6: Invalid URL

**Steps:**
1. Click "Add from URL"
2. Enter invalid URL: `not-a-url`
3. Click "Add"

**Expected Result:**
- ✓ Error message: "Please enter a valid URL"
- ✓ URL is not added
- ✓ Input field remains for retry

---

### Test 7: Reorder Images

**Steps:**
1. Add at least 3 images
2. Click ↑ button on second image
3. Click ↓ button on first image

**Expected Result:**
- ✓ Images swap positions
- ✓ Thumbnail badge moves with first image
- ✓ Grid updates smoothly
- ✓ Order is maintained

---

### Test 8: Remove Images

**Steps:**
1. Add 3 images
2. Hover over second image
3. Click × button

**Expected Result:**
- ✓ Overlay appears on hover
- ✓ Image is removed from grid
- ✓ Counter decrements
- ✓ Remaining images adjust

---

### Test 9: Maximum Images Limit

**Steps:**
1. Add 10 images (mix of uploaded and URLs)
2. Try to add 11th image

**Expected Result:**
- ✓ Upload button becomes disabled
- ✓ "Add from URL" button becomes disabled
- ✓ Error message: "Maximum 10 images allowed"
- ✓ Counter shows "10 / 10 images"

---

### Test 10: Save New Product with Images

**Steps:**
1. Fill out product form (name, SKU, price, etc.)
2. Add 3 images
3. Click "Create Product"

**Expected Result:**
- ✓ Product is created successfully
- ✓ Redirected to products list
- ✓ Images are saved to database

**Verify:**
- Go to product edit page
- Check if all 3 images are loaded

---

### Test 11: Edit Product - Load Existing Images

**Steps:**
1. Go to Products list
2. Click "Edit" on a product with images
3. Scroll to Product Images section

**Expected Result:**
- ✓ All existing images load in grid
- ✓ Images display correctly
- ✓ First image has "Thumbnail" badge
- ✓ Counter shows correct count

---

### Test 12: Edit Product - Update Images

**Steps:**
1. Edit existing product
2. Add 2 new images
3. Remove 1 existing image
4. Reorder images
5. Click "Update Product"

**Expected Result:**
- ✓ Changes are saved
- ✓ Product updates successfully
- ✓ Return to edit page shows updated images
- ✓ Database reflects changes

---

### Test 13: Empty State

**Steps:**
1. Create new product
2. Don't add any images
3. Look at Product Images section

**Expected Result:**
- ✓ Empty state displays
- ✓ Shows camera icon
- ✓ Shows "No images added yet" message
- ✓ Shows helpful instructions

---

### Test 14: Mobile Responsive

**Steps:**
1. Open product page on mobile device or resize browser
2. Add images
3. Try all functions

**Expected Result:**
- ✓ Grid adjusts to 2 columns on mobile
- ✓ Touch controls work
- ✓ Buttons are easily tappable
- ✓ All features work on mobile

---

### Test 15: Mixed Upload Methods

**Steps:**
1. Upload 2 images from computer
2. Add 2 images via URL
3. Reorder them
4. Save product

**Expected Result:**
- ✓ Both upload methods work together
- ✓ All 4 images display correctly
- ✓ Each shows correct source label
- ✓ Product saves with all images

---

## Sample Test URLs

Use these for URL testing:

```
✅ Valid Image URLs:
https://picsum.photos/800/800
https://via.placeholder.com/800x800
https://images.unsplash.com/photo-1523275335684-37898b6baf30
https://dummyimage.com/800x800/000/fff

❌ Invalid URLs for Testing:
not-a-url
htp://broken-url.com
www.no-protocol.com
```

---

## Sample Test Images

Create these test scenarios:

### Small Valid Image (PASS)
- Size: 100KB - 2MB
- Format: JPEG, PNG
- Expected: ✅ Upload succeeds

### Large Invalid Image (FAIL)
- Size: >5MB
- Format: Any
- Expected: ❌ Rejected with error

### Wrong Format (FAIL)
- Format: .txt, .pdf, .doc
- Expected: ❌ Rejected with error

---

## Browser Testing Matrix

Test on multiple browsers:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | Latest  | ⬜ Test |
| Firefox | Latest  | ⬜ Test |
| Safari  | Latest  | ⬜ Test |
| Edge    | Latest  | ⬜ Test |

---

## Device Testing

Test on different screen sizes:

| Device Type | Screen Size | Status |
|-------------|-------------|--------|
| Desktop     | 1920×1080   | ⬜ Test |
| Laptop      | 1366×768    | ⬜ Test |
| Tablet      | 768×1024    | ⬜ Test |
| Mobile      | 375×667     | ⬜ Test |

---

## Performance Testing

### Load Time Test
**Steps:**
1. Add 10 images
2. Measure page load time
3. Check if images load progressively

**Expected:**
- Page loads in <2 seconds
- Images appear progressively
- No UI blocking during upload

### Multiple Upload Test
**Steps:**
1. Upload 10 images at once
2. Monitor progress
3. Check browser console for errors

**Expected:**
- All uploads complete successfully
- No memory leaks
- No console errors
- UI remains responsive

---

## Accessibility Testing

### Keyboard Navigation
**Steps:**
1. Use only keyboard (no mouse)
2. Tab through all controls
3. Try to upload and manage images

**Expected:**
- ✓ All buttons focusable
- ✓ Focus indicators visible
- ✓ Enter/Space trigger actions
- ✓ Tab order logical

### Screen Reader Test
**Steps:**
1. Enable screen reader (NVDA/JAWS)
2. Navigate through interface
3. Listen to announcements

**Expected:**
- ✓ Button labels announced
- ✓ Image count announced
- ✓ Errors announced
- ✓ Upload status announced

---

## Edge Cases

### Test Case: Slow Internet
- Upload image on slow connection
- Should show progress indicator
- Should handle timeout gracefully

### Test Case: Network Error
- Disconnect internet during upload
- Should show error message
- Should allow retry

### Test Case: Server Error
- Test with API returning 500
- Should show user-friendly error
- Should not break UI

### Test Case: Large Image Names
- Upload file with very long name
- Should truncate display name
- Should upload successfully

### Test Case: Special Characters
- Upload file with special chars: `product-#1@2024.jpg`
- Should sanitize filename
- Should upload successfully

### Test Case: Concurrent Users
- Two admins edit same product
- Should handle race conditions
- Should not lose data

---

## Bug Reporting Template

If you find a bug, report it using this template:

```markdown
## Bug Report

**Title:** [Brief description]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Screenshots:**
[Attach if applicable]

**Environment:**
- Browser: 
- OS: 
- Screen Size: 

**Console Errors:**
[Copy any console errors]

**Severity:**
- [ ] Critical (breaks functionality)
- [ ] High (major issue)
- [ ] Medium (minor issue)
- [ ] Low (cosmetic)
```

---

## Test Results Log

Use this template to log your test results:

```
Date: _______________
Tester: _______________

✅ PASSED:
- Test 1: Upload single image
- Test 2: Upload multiple images
- Test 5: Invalid file format

❌ FAILED:
- Test 4: File size validation (not working)
- Test 7: Reorder images (buttons not visible)

⚠️ ISSUES FOUND:
1. [Issue description]
2. [Issue description]

📝 NOTES:
- General observations
- Suggestions for improvement
```

---

## Automated Testing (Future)

### Unit Tests Needed:
```typescript
// ProductImageUpload.test.tsx
describe('ProductImageUpload', () => {
  test('renders empty state', () => {})
  test('handles file upload', () => {})
  test('validates file size', () => {})
  test('validates file type', () => {})
  test('adds URL image', () => {})
  test('validates URL', () => {})
  test('reorders images', () => {})
  test('removes images', () => {})
  test('enforces max images', () => {})
})
```

### Integration Tests Needed:
```typescript
// product-form.test.tsx
describe('Product Form Integration', () => {
  test('saves product with images', () => {})
  test('loads product with images', () => {})
  test('updates product images', () => {})
})
```

---

## Sign-Off Checklist

Before marking as complete:

- [ ] All basic upload tests passed
- [ ] All validation tests passed
- [ ] All management tests passed
- [ ] All integration tests passed
- [ ] Tested on multiple browsers
- [ ] Tested on multiple devices
- [ ] Accessibility verified
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Documentation is accurate
- [ ] Known issues are logged
- [ ] Stakeholder approval obtained

---

## Quick Test Script

Run this quick 5-minute test:

```
⏱️ 5-MINUTE QUICK TEST

1. [30s] Upload 1 image from computer ✓
2. [30s] Add 1 image via URL ✓
3. [15s] Reorder images ✓
4. [15s] Remove one image ✓
5. [60s] Save new product ✓
6. [60s] Edit product, verify images load ✓
7. [30s] Add 1 more image ✓
8. [60s] Update product, verify save ✓
9. [30s] Try uploading invalid file ✓
10. [30s] Check mobile view ✓

All passed? ✅ Feature is working!
```

---

**Testing Guide Complete** ✅

Follow this guide to thoroughly test the product image upload feature!
