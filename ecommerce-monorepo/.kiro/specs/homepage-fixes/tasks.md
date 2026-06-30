# Homepage Fixes - Tasks

## Task 1: Fix Page Scrolling
**Priority:** Critical
**Estimated Time:** 30 minutes

### Description
Fix CSS overflow and height constraints that prevent page scrolling.

### Steps
1. Audit `app/globals.css` for scroll-blocking properties
2. Check `SharedLayout` component for fixed heights
3. Verify `body` and `html` elements have proper overflow
4. Remove any `height: 100vh` or `overflow: hidden` on main containers
5. Test scrolling in browser

### Acceptance Criteria
- [ ] Page scrolls smoothly from top to bottom
- [ ] No fixed height containers blocking scroll
- [ ] Scroll behavior works on desktop and mobile

### Files to Modify
- `app/globals.css`
- `components/layout/SharedLayout.tsx` (if needed)

---

## Task 2: Update Categories API to Support Parent Filter
**Priority:** High
**Estimated Time:** 20 minutes

### Description
Enhance the categories API endpoint to filter parent categories (categories with no parent).

### Steps
1. Open `app/api/categories/route.ts`
2. Add support for `parent` query parameter
3. When `parent=null`, filter by `parentId: null`
4. Test API response with `/api/categories?parent=null`

### Acceptance Criteria
- [ ] API accepts `parent` query parameter
- [ ] Returns only parent categories when `parent=null`
- [ ] Includes product count for each category
- [ ] Response format matches existing structure

### Files to Modify
- `app/api/categories/route.ts`

---

## Task 3: Enhance CategoryGrid Component
**Priority:** High
**Estimated Time:** 30 minutes

### Description
Update CategoryGrid to support displaying parent categories or featured categories based on variant prop.

### Steps
1. Open `components/home/CategoryGrid.tsx`
2. Add `variant` prop: `'featured' | 'parent'`
3. Update query to use appropriate API params based on variant
4. Update query key to include variant
5. Adjust UI text/styling if needed for parent variant

### Acceptance Criteria
- [ ] Component accepts `variant` prop
- [ ] `variant="parent"` fetches all parent categories
- [ ] `variant="featured"` maintains current behavior
- [ ] Both variants render correctly
- [ ] TypeScript types are correct

### Files to Modify
- `components/home/CategoryGrid.tsx`

---

## Task 4: Create Pagination Component
**Priority:** High
**Estimated Time:** 45 minutes

### Description
Create a reusable pagination component for navigating product pages.

### Steps
1. Create `components/ui/Pagination.tsx`
2. Implement pagination controls (prev, next, page numbers)
3. Add props: `currentPage`, `totalPages`, `onPageChange`
4. Style with Tailwind CSS matching design system
5. Make responsive (mobile-friendly)
6. Add keyboard navigation support
7. Add ARIA labels for accessibility

### Acceptance Criteria
- [ ] Shows current page and total pages
- [ ] Previous/Next buttons work correctly
- [ ] Page numbers are clickable
- [ ] Disabled states for first/last page
- [ ] Mobile responsive design
- [ ] Keyboard accessible
- [ ] Proper ARIA labels

### Files to Create
- `components/ui/Pagination.tsx`

---

## Task 5: Create All Products Section Component
**Priority:** High
**Estimated Time:** 60 minutes

### Description
Create a new component to display all products with pagination.

### Steps
1. Create `components/home/AllProductsSection.tsx`
2. Implement pagination state management
3. Use React Query to fetch products with page parameter
4. Display products in grid using existing ProductGrid
5. Integrate Pagination component
6. Add loading states
7. Add error handling
8. Add empty state
9. Make responsive

### Acceptance Criteria
- [ ] Fetches all active products from API
- [ ] Displays 20 products per page
- [ ] Pagination controls work correctly
- [ ] Loading states display during fetch
- [ ] Error states handled gracefully
- [ ] Empty state shows when no products
- [ ] Grid is responsive (4/2/1 columns)
- [ ] React Query caching configured

### Files to Create
- `components/home/AllProductsSection.tsx`

---

## Task 6: Update Homepage Layout
**Priority:** High
**Estimated Time:** 30 minutes

### Description
Integrate new components into the homepage in the correct order.

### Steps
1. Open `app/page.tsx`
2. Import new components (AllProductsSection)
3. Update CategoryGrid to use `variant="parent"`
4. Arrange sections in order:
   - Hero, Stats, Trust Badges
   - Parent Categories (variant="parent")
   - All Products Section (NEW)
   - Featured Products (existing)
   - New Arrivals (existing)
   - Blog, CTA
5. Ensure proper spacing between sections
6. Test full page flow

### Acceptance Criteria
- [ ] All sections render in correct order
- [ ] Parent categories display at top
- [ ] All products section shows with pagination
- [ ] Featured and new arrivals sections remain
- [ ] Page layout is cohesive
- [ ] Spacing is consistent
- [ ] No layout breaks

### Files to Modify
- `app/page.tsx`

---

## Task 7: Testing and Polish
**Priority:** Medium
**Estimated Time:** 45 minutes

### Description
Test all changes, fix bugs, and polish the UI.

### Steps
1. Test scrolling on desktop and mobile
2. Test category display (parent categories)
3. Test product pagination (all pages)
4. Test loading states
5. Test error states (disconnect network)
6. Test empty states
7. Verify responsive design on all breakpoints
8. Check accessibility (keyboard nav, screen reader)
9. Verify performance (page load time)
10. Fix any bugs found

### Acceptance Criteria
- [ ] Scrolling works perfectly
- [ ] All parent categories display
- [ ] All products load with pagination
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states smooth
- [ ] Error handling works
- [ ] Keyboard navigation functional
- [ ] Page loads in <3 seconds

### Files to Test
- All modified files
- Full homepage user flow

---

## Dependencies
- Task 2 must complete before Task 3
- Task 4 must complete before Task 5
- Tasks 1-5 must complete before Task 6
- Task 6 must complete before Task 7

## Estimated Total Time
4 hours 40 minutes

## Risk Assessment
- **Low Risk:** Tasks 2, 3, 4 (isolated changes)
- **Medium Risk:** Task 5 (new component, needs testing)
- **Low Risk:** Task 6 (integration)
- **Critical:** Task 1 (must fix scrolling first)
