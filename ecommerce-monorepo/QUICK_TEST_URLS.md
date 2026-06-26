# 🧪 Quick Test - All Pages

## Start Server
```bash
cd ecommerce-monorepo/web
npm run dev
```

## Test All Pages (10 URLs)

### ✅ 1. Homepage (Shows HeroSection)
**URL**: http://localhost:3001/

**Expected**:
- ✅ Full HeroSection with "Rise Ceramic Nonstick Bakeware"
- ✅ NO breadcrumbs visible
- ✅ MainHeader + CategoryMenu at top
- ✅ Footer at bottom

---

### ✅ 2. Products Page
**URL**: http://localhost:3001/products

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > Shop
- ✅ Title: "All Products"
- ✅ Product grid with filters
- ✅ Same header/footer as homepage

---

### ✅ 3. Product Detail
**URL**: http://localhost:3001/products/professional-non-stick-frying-pan

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > Products > Cookware > Product Name
- ✅ Title: Product name
- ✅ Product images and details
- ✅ Add to cart button

---

### ✅ 4. About Page
**URL**: http://localhost:3001/about

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > About
- ✅ Title: "About YIWU EXPRESS"
- ✅ Company story and values
- ✅ Statistics section

---

### ✅ 5. Contact Page
**URL**: http://localhost:3001/contact

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > Contact
- ✅ Title: "Contact Our Global Teams"
- ✅ Contact form
- ✅ Office locations

---

### ✅ 6. Services Page
**URL**: http://localhost:3001/services

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > Services
- ✅ Title: "Our Professional Logistics Services"
- ✅ Service cards grid
- ✅ Search and filters

---

### ✅ 7. Track Page
**URL**: http://localhost:3001/track

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > Track Shipment
- ✅ Title: "Real-Time Shipment Tracking"
- ✅ Tracking number input
- ✅ Sample tracking code button

---

### ✅ 8. Calculator Page
**URL**: http://localhost:3001/calculator

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > Calculator
- ✅ Title: "Freight Cost Calculator"
- ✅ Cost calculation form
- ✅ Estimation results area

---

### ✅ 9. Wholesale Page
**URL**: http://localhost:3001/wholesale

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > Wholesale
- ✅ Title: "Wholesale Inquiry"
- ✅ B2B inquiry form
- ✅ Company information fields

---

### ✅ 10. Cart Page
**URL**: http://localhost:3001/cart

**Expected**:
- ✅ PageHero with breadcrumbs: 🏠 > Cart
- ✅ Title: "Shopping Cart"
- ✅ Cart items or empty state
- ✅ Order summary (if items present)

---

## Quick Checklist

For EACH page above, verify:

- [ ] **TopBar** visible at very top
- [ ] **MainHeader** with logo, search, cart
- [ ] **CategoryMenu** (navy blue navigation)
- [ ] **PageHero** with breadcrumbs (except homepage)
- [ ] **HeroSection** on homepage ONLY
- [ ] **Footer** at bottom
- [ ] Content **centered** (max 1400px)
- [ ] No **horizontal scroll**
- [ ] **Mobile responsive** (resize browser)

---

## Expected Results

### ✅ All Pages Should Have:
- Same MainHeader
- Same CategoryMenu
- Same Footer
- Centered content (1400px max)
- Responsive padding

### ❌ ONLY Homepage Should Have:
- Full HeroSection
- No breadcrumbs
- "Rise Ceramic" promotional content

### ✅ All Other Pages Should Have:
- PageHero with breadcrumbs
- Page title and description
- Gradient or image background in hero
- NO HeroSection

---

## Issues to Report

If you find any issues:

### Layout Issues
- [ ] Header not showing
- [ ] Footer not showing
- [ ] Content not centered
- [ ] Horizontal scroll appearing

### Hero Issues
- [ ] Homepage showing PageHero instead of HeroSection
- [ ] Other pages showing HeroSection instead of PageHero
- [ ] Breadcrumbs not visible
- [ ] Breadcrumbs not clickable

### TypeScript Issues
- [ ] Console errors
- [ ] Build errors
- [ ] Type errors

---

## Success Criteria

**All 10 pages pass if:**
1. ✅ Homepage shows HeroSection (NO breadcrumbs)
2. ✅ Other 9 pages show PageHero (WITH breadcrumbs)
3. ✅ All pages have MainHeader + CategoryMenu
4. ✅ All pages have Footer
5. ✅ Content is centered
6. ✅ No console errors
7. ✅ Mobile responsive works
8. ✅ Breadcrumbs are clickable

---

## Test Duration

- **Quick test** (10 URLs): ~5 minutes
- **Thorough test** (with checklist): ~15 minutes
- **Full mobile test**: +10 minutes

**Total**: 15-30 minutes

---

## Final Verification Command

```bash
# Check for TypeScript errors
cd ecommerce-monorepo/web
npx tsc --noEmit

# Expected output: No errors!
```

---

**Status**: Ready for testing! 🚀
