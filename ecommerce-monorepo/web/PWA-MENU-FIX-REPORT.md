# PWA Menu Fix & Diagnostics Report

## 1. Problem Summary & Symptoms
In installed Progressive Web App (PWA) standalone display mode on mobile devices (Android / iOS):
- Tapping the hamburger menu button in the header did nothing.
- The comprehensive side navigation drawer (`MobileDrawer.tsx` with Categories, Account, B2B wholesale toggle, Orders, Cargo Tracking, Currency & Language selectors) was completely absent.
- BottomNav's "More" tab had an isolated, local bottom-sheet state disconnected from the header and the global application context.

Desktop and mobile browsers worked without issue because desktop uses the standard ribbon and modal headers, while mobile browsers used `CatalogModal`.

---

## 2. Root Cause
1. **Unmounted Component in DOM**:
   `MobileDrawer.tsx` was only imported inside an unused `MobileShell.tsx` wrapper and was never mounted in the root layout (`app/[locale]/layout.tsx`).
2. **Dead Event Listener**:
   `MobileHeader.tsx`'s hamburger button called `openDrawer()` / `toggleDrawer()` on `MobileProvider`, but no component in the React tree was listening or rendering based on `isDrawerOpen`.
3. **State Duplication**:
   `BottomNav.tsx` maintained an isolated `const [isDrawerOpen, setIsDrawerOpen] = useState(false)` and duplicated a subset of drawer links instead of referencing the single source of truth in `MobileProvider`.

---

## 3. Fixes Applied

### Fix 1 — Mount `<MobileDrawer />` in Root Layout
- **File:** `ecommerce-monorepo/web/app/[locale]/layout.tsx`
- **Action:** Imported `MobileDrawer` from `@/components/mobile/MobileDrawer` and mounted `<MobileDrawer />` inside `<MobileProvider>` directly alongside `<BottomNav />`.
- **Commit:** `3d520494` (`fix(pwa): mount MobileDrawer inside MobileProvider in root layout`)

### Fix 2 — Wire Header Hamburger to `openDrawer` in PWA Mode
- **File:** `ecommerce-monorepo/web/app/[locale]/design-3/components/Header.tsx`
- **Action:** In standalone mode (`isStandalone === true`), the hamburger button now calls `openDrawer()`, opening the global `MobileDrawer`. In standard mobile browser mode, it continues to call `onOpenCatalog` (opening `CatalogModal`), maintaining 100% backward compatibility.
- **Commit:** `f74f0b23` (`fix(pwa): wire header hamburger menu to open global MobileDrawer in standalone mode`)

### Fix 3 — Connect BottomNav "More" Tab to Global Drawer State
- **File:** `ecommerce-monorepo/web/components/mobile/BottomNav.tsx`
- **Action:** Removed isolated local `useState`, connected the "More" tab trigger to `toggleDrawer` / `openDrawer` from `useMobile()`, and eliminated redundant duplicate bottom-sheet markup in favor of the unified `MobileDrawer`.
- **Commit:** `a5313538` (`fix(pwa): connect BottomNav More tab to global useMobile drawer state and eliminate redundant duplicate sheet`)

### Fix 4 — Unit Tests for Standalone Mode and BottomNav
- **File:** `ecommerce-monorepo/web/__tests__/mobile/BottomNav.test.tsx`
- **Action:** Created dedicated tests validating that `BottomNav` renders in standalone mode, hides in browser mode, and triggers `toggleDrawer()` on the "More" tab click.
- **Commit:** `e593880f` (`test(pwa): add unit tests for BottomNav standalone display mode and drawer integration`)

---

## 4. Verification Matrix

| Target / Environment | Action / Test | Result |
| :--- | :--- | :--- |
| **PWA on Android / iOS** | Tap header hamburger (top-left) | `MobileDrawer` slides in smoothly from the left |
| **PWA on Android / iOS** | Tap "More" in `BottomNav` (bottom-right) | Same `MobileDrawer` opens synchronously; active dot indicator displays |
| **PWA Navigation Links** | Tap Menu / Categories / Orders / Tracking / Currency | Seamless navigation without page reload; drawer auto-closes on route change |
| **PWA Drawer Dismissal** | Tap backdrop or press Escape key | Drawer closes cleanly; body scroll unlocked |
| **Mobile Web Browser** | Open `/en` in mobile viewport | `BottomNav` remains hidden; top menu opens `CatalogModal` as expected |
| **Desktop View (1440px)** | Open `/en` on desktop | Desktop header ribbon, category dropdowns, and search bar 100% unchanged |
| **Typecheck** | `npm run typecheck` (`tsc --noEmit`) | **0 errors (Pass)** |
| **Unit Tests** | `npx vitest run __tests__/mobile/MobileDrawer.test.tsx __tests__/mobile/BottomNav.test.tsx` | **11 tests passed (100% Green)** |

---

## 5. Git Commit Hashes
- `3d520494` - `fix(pwa): mount MobileDrawer inside MobileProvider in root layout`
- `f74f0b23` - `fix(pwa): wire header hamburger menu to open global MobileDrawer in standalone mode`
- `a5313538` - `fix(pwa): connect BottomNav More tab to global useMobile drawer state and eliminate redundant duplicate sheet`
- `e593880f` - `test(pwa): add unit tests for BottomNav standalone display mode and drawer integration`

Pushed to `main` and `production` branches on both `origin` and `dromkok` remotes.

---

## 6. Prevention Note
- Always ensure global overlay components listening to context-based flags (such as `isDrawerOpen`, `isModalOpen`) are mounted within the root `layout.tsx` provider boundary rather than inside individual unused wrapper templates.
- Maintain a single source of truth for navigation state across headers and bottom navigation bars.
