# Category Filter Flicker Bug — Comprehensive Resolution Report

## Executive Summary

When selecting categories in the store catalog (`/en/store`), the user experience was disrupted by visible oscillating flickers between categories, out-of-order product lists, and competing API fetches.

Through systematic phased investigation and step-by-step isolation, five root causes across the navigation stack were diagnosed and permanently resolved. Each fix was implemented independently, verified against TypeScript strict checks and automated unit/integration tests, and committed with zero breaking changes to visual styling or taxonomy.

---

## Root Causes Identified

1. **Header Component Dual Navigation (`Header.tsx` / `Design3LayoutHeader.tsx`):**
   - Ribbon department buttons invoked `onSelectDepartment(name)` followed immediately by `router.push(?category=slug)`.
   - `onSelectDepartment` itself triggered an independent `router.push(?category=name)`.
   - Every click initiated **two conflicting `router.push` calls** in immediate succession (one with localized name, one with canonical slug).

2. **Bidirectional State Sync in Catalog (`ShopProductsPage.tsx`):**
   - A `useEffect` watched `selectedCategory`, resolved its slug via `categoryLookupMap`, and executed a third `router.push` whenever `searchParams.get('category') !== activeCategoryParam`.
   - This established a state $\leftrightarrow$ URL ping-pong loop.

3. **React Query Overly Permissive `placeholderData` (`store/page.tsx`):**
   - TanStack Query was configured with `placeholderData: (prev) => prev`.
   - When transitioning between categories (e.g. Kitchen $\rightarrow$ Living Room), the previous category's products remained rendered on screen during network latency.
   - Combined with out-of-order response settlement, this produced visible flickering back and forth between old and new category products.

4. **Mobile Store State Disconnection (`MobileStorePage.tsx`):**
   - Category filtering in the mobile bottom sheet modified local state without pushing canonical URL query parameters, disconnecting mobile filtering from server-side query state and browser history navigation.

---

## Detailed Summary of Implemented Fixes

### FIX 1: Header Single Push with Canonical Slug
- **Files Modified:**
  - [`app/[locale]/design-3/components/Header.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/app/[locale]/design-3/components/Header.tsx)
  - [`components/layout/Design3LayoutHeader.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/components/layout/Design3LayoutHeader.tsx)
- **Changes:**
  - Removed internal duplicate `router.push` invocations and dual `onSelectDepartment` triggers.
  - Category buttons now fire a single canonical `router.push(`/${currentLocale}/store?category=${encodeURIComponent(dept.slug || dept.id || dept.name)}`)`.
- **Commit:** `d3dd0351` (`fix(header): eliminate duplicate router.push and use canonical category slug`)

### FIX 2: Single Source of Truth (URL) in Desktop Catalog
- **Files Modified:**
  - [`app/[locale]/design-3/components/ShopProductsPage.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/app/[locale]/design-3/components/ShopProductsPage.tsx)
- **Changes:**
  - Removed state $\rightarrow$ URL sync `useEffect` containing `router.push`.
  - Replaced with a read-only unidirectional listener syncing `searchParams` into local state.
  - Centralized user interactions in `handleCategoryClick(categorySlugOrAll, deptSlugOrAll)` which executes a single `router.push` with cleaned parameters (`page` reset, legacy parameters purged).
  - Wired breadcrumbs, sidebar department/category trees, active filter chips, and drawer selects directly to `handleCategoryClick`.
- **Commit:** `7814534b` (`fix(store): make URL single source of truth and remove bidirectional sync in ShopProductsPage`)

### FIX 3: Conditional `placeholderData` in React Query
- **Files Modified:**
  - [`app/[locale]/store/page.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/app/[locale]/store/page.tsx)
- **Changes:**
  - Updated `placeholderData` to inspect previous query key filters:
    ```tsx
    placeholderData: (previousData, previousQuery) => {
      if (!previousQuery) return undefined;
      const prevKey = previousQuery.queryKey;
      const prevCategory = prevKey[4];
      const prevSearch = prevKey[5];
      const prevSort = prevKey[6];

      // Only preserve previous data for pagination (same filters)
      if (prevCategory === categoryParam && prevSearch === searchParam && prevSort === sortParam) {
        return previousData;
      }
      return undefined;
    }
    ```
  - When switching categories, stale products are immediately wiped and the clean loading skeleton renders until fresh data arrives.
  - Page-to-page pagination continues to retain previous data smoothly without screen jumps.
- **Commit:** `df9cb3ad` (`fix(store): clear placeholderData on category change while preserving for pagination`)

### FIX 4: Mobile Store Synchronization
- **Files Modified:**
  - [`components/mobile/store/MobileStorePage.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/components/mobile/store/MobileStorePage.tsx)
- **Changes:**
  - Integrated `useSearchParams`, `useRouter`, and `usePathname`.
  - Added unidirectional `searchParams` $\rightarrow$ `filters` state sync.
  - Created `handleCategoryNavigate` for single push with canonical slugs when removing chips, resetting, or applying filters from the mobile bottom sheet.
- **Commit:** `dbdccd48` (`fix(mobile): apply single-source-of-truth pattern to mobile store`)

### FIX 5: Automated Regression Test Suite
- **Files Created / Modified:**
  - [`__tests__/store/category-navigation.test.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/__tests__/store/category-navigation.test.tsx)
  - [`__tests__/mobile/store/MobileStorePage.test.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/__tests__/mobile/store/MobileStorePage.test.tsx)
  - [`app/[locale]/design-3/components/ShopProductsPage.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/app/[locale]/design-3/components/ShopProductsPage.tsx)
- **Test Coverage:**
  1. `fires router.push exactly once when clicking a category`
  2. `uses the canonical slug in the URL rather than raw name`
  3. `does not fire router.push twice in rapid succession or from sync effects`
  4. `preserves category param when changing page via onPageChange`
  5. `mobile category selection uses single push with canonical slug`
- **Regression Verification:**
  - Temporarily simulated a duplicate `router.push` in `handleCategoryClick` $\rightarrow$ Tests **failed as expected** with `expected "spy" to be called 1 times, but got 2 times`.
  - Reverted the simulated bug $\rightarrow$ All **5 tests passed cleanly** (399ms).
- **Commit:** `469784f0` (`test(store): add category navigation regression test`)

---

## Verification & Quality Results

| Gate | Command | Result |
|---|---|---|
| TypeScript Type Check | `npx tsc --noEmit` | **0 errors (Pass)** |
| Category Navigation Tests | `npx vitest run __tests__/store/category-navigation.test.tsx` | **5/5 tests passed** |
| Mobile Store Tests | `npx vitest run __tests__/mobile/store/MobileStorePage.test.tsx` | **3/3 tests passed** |
| PWA Manifest Tests | `npx vitest run __tests__/pwa/manifest.test.ts` | **4/4 tests passed** |

### Git Commit Log
- `469784f0` - `test(store): add category navigation regression test`
- `dbdccd48` - `fix(mobile): apply single-source-of-truth pattern to mobile store`
- `df9cb3ad` - `fix(store): clear placeholderData on category change while preserving for pagination`
- `7814534b` - `fix(store): make URL single source of truth and remove bidirectional sync in ShopProductsPage`
- `d3dd0351` - `fix(header): eliminate duplicate router.push and use canonical category slug`

---

## Network & State Behavior (Before vs After)

### Before Fixes:
1. User clicks "Kitchen & Dining" in menu.
2. Request 1: `GET /api/products?category=Kitchen+%26+Dining` (from header name push).
3. Request 2: `GET /api/products?category=kitchen-dining` (from header slug push).
4. Request 3: `GET /api/products?category=kitchen-dining` (from sync effect in catalog).
5. Previous category products remained visible during in-flight network requests due to `placeholderData`.
6. Out-of-order resolution caused products and URL to ping-pong repeatedly.

### After Fixes:
1. User clicks "Kitchen & Dining".
2. URL updates **once** to `/en/store?category=kitchen-dining`.
3. Exactly **one** network request: `GET /api/products?page=1&limit=24&locale=en&category=kitchen-dining`.
4. Stale products clear immediately; skeleton displays cleanly during fetch.
5. Paginating preserves previous page data smoothly without skeleton jumps.
6. Browser back/forward navigation reliably restores the correct category state.
