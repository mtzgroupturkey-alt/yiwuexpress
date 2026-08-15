# Admin Panel QA Testing Checklist
## YIWU EXPRESS - http://localhost:3005/admin/

**Test Date:** _____________  
**Tester:** _____________  
**Environment:** Development (localhost:3005)

---

## 🔐 Authentication & Access Control

### Login & Authorization
- [ ] Admin login redirects to dashboard successfully
- [ ] Non-admin users cannot access `/admin/*` routes
- [ ] Session persists after page refresh
- [ ] Logout clears session and redirects to login
- [ ] Invalid credentials show appropriate error message
- [ ] Token is stored in localStorage correctly

---

## 🎨 Layout & Navigation

### Desktop Navigation (≥1024px)
- [ ] Sidebar expands/collapses correctly (toggle button works)
- [ ] Company logo displays (or fallback globe icon)
- [ ] Company name displays: "YIWU EXPRESS"
- [ ] Admin badge shows "ADMIN PANEL" correctly
- [ ] All navigation items are visible and clickable
- [ ] Active route is highlighted with accent color
- [ ] Submenu items expand/collapse on click
- [ ] Current page auto-expands parent menu on load
- [ ] Hover effects work on menu items
- [ ] Logout button at bottom works correctly

### Mobile Navigation (<1024px)
- [ ] Hamburger menu icon visible in header
- [ ] Sidebar opens as overlay when hamburger clicked
- [ ] Overlay darkens background correctly
- [ ] Clicking overlay closes mobile menu
- [ ] Close (X) button closes mobile menu
- [ ] Menu closes automatically on route change
- [ ] Body scroll disabled when menu open
- [ ] Navigation items work same as desktop

### Top Header Bar
- [ ] Mobile hamburger button visible on small screens
- [ ] Page title updates based on current route
- [ ] Company name shows in subtitle
- [ ] Notification bell icon displays
- [ ] Red notification dot visible on bell
- [ ] Admin avatar shows "A" with gradient
- [ ] Email "admin@yiwuexpress.com" displays (hidden on mobile)

---

## 📊 Dashboard Page (`/admin`)

### Loading States
- [ ] Loading spinner shows while fetching stats
- [ ] Loading message: "Loading dashboard..." appears
- [ ] Spinner uses primary color (#1a3a5c)

### Error States
- [ ] Error message displays if API fails
- [ ] AlertCircle icon appears with error
- [ ] Clear error message text shown

### Header Section
- [ ] Page title: "Dashboard Overview"
- [ ] Welcome message with current date
- [ ] "Live" status badge shows with green pulse dot

### Statistics Cards (5 cards)
- [ ] **Total Revenue** card displays correctly
  - [ ] Shows dollar amount with formatting
  - [ ] Emerald gradient background
  - [ ] Growth percentage with trend icon
  - [ ] "this month" label
- [ ] **Total Users** card displays correctly
  - [ ] Shows user count
  - [ ] Purple gradient background
  - [ ] Growth percentage with trend icon
- [ ] **Total Quotes** card displays correctly
  - [ ] Shows quote count
  - [ ] Gold gradient background (#c9a84c)
  - [ ] Growth percentage with trend icon
- [ ] **Shipments** card displays correctly
  - [ ] Shows shipment count
  - [ ] Blue gradient background
  - [ ] Growth percentage with trend icon
- [ ] **Pending Quotes** card displays correctly
  - [ ] Shows pending count
  - [ ] Orange gradient background
  - [ ] No growth indicator

### Growth Indicators
- [ ] Positive growth shows TrendingUp icon (green)
- [ ] Negative growth shows TrendingDown icon (red)
- [ ] Growth percentage formatted correctly (+/-X%)

### Recent Quotes Table
- [ ] Header shows "Recent Quotes" with icon
- [ ] "View all" link navigates to `/admin/quotes`
- [ ] Quote rows display:
  - [ ] Customer name/email
  - [ ] Service name
  - [ ] Origin → Destination
  - [ ] Status badge (color-coded)
  - [ ] Price formatted as $X.XX
- [ ] Empty state shows "No quotes yet" when empty
- [ ] Hover effect on rows (bg-gray-50)

### Recent Shipments Table
- [ ] Header shows "Recent Shipments" with icon
- [ ] "View all" link navigates to `/admin/shipments`
- [ ] Shipment rows display:
  - [ ] Tracking number (monospace font)
  - [ ] Origin → Destination
  - [ ] Status badge (color-coded)
  - [ ] Service name
- [ ] Empty state shows "No shipments yet" when empty
- [ ] Hover effect on rows

### Status Badges
- [ ] PENDING: Amber background & text
- [ ] APPROVED: Emerald background & text
- [ ] REJECTED: Red background & text
- [ ] IN_TRANSIT: Blue background & text
- [ ] DELIVERED: Emerald background & text
- [ ] PROCESSING: Purple background & text
- [ ] SHIPPED: Indigo background & text

### Quick Actions Section
- [ ] Header: "Quick Actions"
- [ ] 4 action cards displayed in grid
- [ ] **Add Service** card:
  - [ ] Links to `/admin/services`
  - [ ] Package icon
  - [ ] Navy color (#1a3a5c)
  - [ ] Hover effect: shadow + lift
  - [ ] Icon scales on hover
- [ ] **Review Quotes** card:
  - [ ] Links to `/admin/quotes`
  - [ ] FileText icon
  - [ ] Gold color (#c9a84c)
- [ ] **Track Shipments** card:
  - [ ] Links to `/admin/shipments`
  - [ ] Ship icon
  - [ ] Emerald color
- [ ] **Manage Users** card:
  - [ ] Links to `/admin/users`
  - [ ] Users icon
  - [ ] Purple color

---

## 🗂️ Navigation Menu Items

Test that each menu item navigates correctly and shows active state:

### Main Menu Items
- [ ] **Dashboard** (`/admin`) - LayoutDashboard icon
- [ ] **Products** - ShoppingBag icon
  - [ ] Expands to show submenu
  - [ ] All Products (`/admin/products`)
  - [ ] Add Product (`/admin/products/new`)
- [ ] **Categories** - FolderTree icon
  - [ ] All Categories (`/admin/categories`)
  - [ ] Menu Manager (`/admin/categories/menu`)
- [ ] **Attributes** (`/admin/attributes`) - Tag icon
- [ ] **Suppliers** (`/admin/suppliers`) - Building2 icon
- [ ] **Purchase Orders** - ClipboardList icon
  - [ ] All Purchase Orders
  - [ ] Create Purchase Order (`/admin/purchase-orders/new`)
- [ ] **Sales Orders** - ShoppingCart icon
  - [ ] All Orders
  - [ ] Pending Orders (with ?status=pending)
- [ ] **Wholesale** - MessageSquare icon
  - [ ] All Inquiries
  - [ ] New Inquiries (with ?status=new)
- [ ] **Countries** - Globe icon
  - [ ] All Countries
  - [ ] Add Country (`/admin/countries/new`)
- [ ] **Currencies** (`/admin/currencies`) - DollarSign icon
- [ ] **Services** (`/admin/services`) - Package icon
- [ ] **Quotes** - FileText icon
  - [ ] View Quotes
  - [ ] Approve/Reject (`/admin/quotes?tab=pending`)
- [ ] **Shipments** - Ship icon
  - [ ] All Shipments
  - [ ] Containers (`/admin/containers`)
  - [ ] Tracking (`/admin/shipments?tab=tracking`)
- [ ] **Users** (`/admin/users`) - Users icon
- [ ] **Reviews** (`/admin/reviews`) - MessageSquare icon
- [ ] **Testimonials** (`/admin/testimonials`) - ImageIcon

### Settings Submenu
- [ ] **Settings** parent menu expands
- [ ] Hero Slider (`/admin/settings/hero-slider`)
- [ ] Featured Products (`/admin/settings/featured-products`)
- [ ] New Arrivals (`/admin/settings/new-arrivals`)
- [ ] Flash Sales (`/admin/settings/flash-sales`)
- [ ] Breadcrumb Backgrounds (`/admin/settings/breadcrumb`)
- [ ] Company Info (`/admin/settings/company`)
- [ ] System Settings (`/admin/settings/system`)
- [ ] Shipping Methods (`/admin/settings/shipping-methods`)
- [ ] Notifications (`/admin/settings/notifications`)
- [ ] Permissions (`/admin/settings/permissions`)
- [ ] Backup & Export (`/admin/settings/backup`)

---

## 🎨 Theming & Branding

### Color Variables
- [ ] Primary color loads from settings API (#1a3a5c default)
- [ ] Accent color loads from settings API (#c9a84c default)
- [ ] CSS custom properties applied correctly:
  - [ ] `--primary-color` set on `:root`
  - [ ] `--accent-color` set on `:root`
- [ ] Sidebar gradient uses primary color
- [ ] Active menu items use accent color
- [ ] Badges use accent color

### Logo & Company Info
- [ ] Company logo loads from `/api/settings`
- [ ] Fallback globe icon shown if no logo
- [ ] Company name loads from settings
- [ ] Logo image renders correctly (32px)

---

## 🔄 Dynamic Behavior

### State Management
- [ ] Sidebar open/closed state persists during navigation
- [ ] Mobile menu closes on route change
- [ ] Expanded menu items remembered
- [ ] Body scroll disabled during mobile menu open
- [ ] Body scroll re-enabled when menu closes

### Hydration
- [ ] Loading state shown before hydration complete
- [ ] No hydration errors in console
- [ ] Dynamic content only renders after mount
- [ ] Settings fetched after mount

### API Integration
- [ ] `/api/settings` called for branding
- [ ] `/api/admin/stats` called for dashboard data
- [ ] Credentials included in fetch requests
- [ ] Error responses handled gracefully

---

## 📱 Responsive Design

### Breakpoints
- [ ] **Mobile** (<640px): Single column layouts
- [ ] **Tablet** (640px-1024px): 2 column grids
- [ ] **Desktop** (≥1024px): Full sidebar visible
- [ ] **XL** (≥1280px): 5 column stat cards

### Mobile-Specific (<1024px)
- [ ] Sidebar hidden by default
- [ ] Hamburger menu visible
- [ ] Sidebar slides in as overlay
- [ ] Background overlay appears
- [ ] Stats show 1-2 columns
- [ ] Quick actions 2 columns
- [ ] Tables remain scrollable
- [ ] Admin email hidden in header

### Desktop-Specific (≥1024px)
- [ ] Sidebar always visible
- [ ] Toggle button hidden on small sidebar
- [ ] Stats show up to 5 columns
- [ ] Quick actions 4 columns
- [ ] Tables side-by-side
- [ ] Full admin info in header

---

## ⚡ Performance

### Initial Load
- [ ] Page loads within 3 seconds
- [ ] No console errors
- [ ] No React hydration warnings
- [ ] Loading states appear smoothly

### Interactions
- [ ] Menu expand/collapse is smooth (300ms)
- [ ] Hover effects have no lag
- [ ] Route transitions are instant
- [ ] No layout shift on data load

### Assets
- [ ] Logo image loads quickly
- [ ] Icons render instantly (Lucide React)
- [ ] Gradients render smoothly
- [ ] No flashing of unstyled content

---

## ♿ Accessibility

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Menu items focusable
- [ ] Links have focus indicators
- [ ] Buttons are keyboard accessible
- [ ] Logout button accessible via keyboard

### Screen Reader
- [ ] Menu button has aria-label
- [ ] Icon-only buttons have labels
- [ ] Status badges have readable text
- [ ] Tables have proper structure
- [ ] Headings in correct hierarchy

### Visual
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Text readable at all sizes
- [ ] Icons have appropriate size
- [ ] Focus indicators visible
- [ ] Hover states clear

---

## 🔧 Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 🐛 Edge Cases & Error Handling

### Authentication
- [ ] Expired token redirects to login
- [ ] Invalid token handled gracefully
- [ ] Missing token redirects to login
- [ ] Multiple tabs maintain session

### Data Loading
- [ ] Empty stats handled correctly
- [ ] Missing user data shows "Unknown"
- [ ] Null/undefined values don't crash
- [ ] Large numbers formatted correctly

### Network Issues
- [ ] Failed API calls show error message
- [ ] Retry mechanism works (if implemented)
- [ ] Offline state handled gracefully
- [ ] Slow connections show loading state

### Navigation
- [ ] Direct URL access works for all routes
- [ ] Back button works correctly
- [ ] Forward button works correctly
- [ ] Deep links maintain state

---

## 📝 Console Checks

### No Errors
- [ ] Zero console errors
- [ ] No React warnings
- [ ] No network errors (except expected 401s)
- [ ] No missing image warnings

### Expected Warnings (Can Ignore)
- [ ] "ErrorBoundary is declared but never used" - Remove import

### Performance
- [ ] No memory leaks
- [ ] Components unmount cleanly
- [ ] Event listeners cleaned up
- [ ] No infinite re-renders

---

## ✅ Critical Path Testing

### Admin First-Time Login Flow
1. [ ] Navigate to http://localhost:3005/admin/
2. [ ] Redirect to login if not authenticated
3. [ ] Login with admin credentials
4. [ ] Redirect to dashboard
5. [ ] Dashboard loads with stats
6. [ ] Navigate through all main sections
7. [ ] Logout successfully

### Dashboard Data Flow
1. [ ] Dashboard loads with loading state
2. [ ] Stats API called with credentials
3. [ ] All 5 stat cards populate
4. [ ] Recent quotes table populates
5. [ ] Recent shipments table populates
6. [ ] Quick actions all clickable

### Navigation Flow
1. [ ] Click each main menu item
2. [ ] Verify correct page loads
3. [ ] Verify active state updates
4. [ ] Test submenu expansion
5. [ ] Test submenu navigation
6. [ ] Verify breadcrumb updates

---

## 📊 Test Results Summary

**Total Tests:** ___ / ___  
**Pass Rate:** ___%  
**Critical Bugs:** ___  
**Non-Critical Bugs:** ___  
**Enhancements:** ___

### Critical Issues Found
1. _______________________________
2. _______________________________
3. _______________________________

### Non-Critical Issues Found
1. _______________________________
2. _______________________________
3. _______________________________

### Recommendations
1. _______________________________
2. _______________________________
3. _______________________________

---

## 🎯 Next Steps

- [ ] Fix all critical issues
- [ ] Address non-critical issues
- [ ] Implement recommended enhancements
- [ ] Re-test after fixes
- [ ] Document any known limitations
- [ ] Update user documentation

---

**QA Sign-off:**  
Name: _____________  
Date: _____________  
Signature: _____________
