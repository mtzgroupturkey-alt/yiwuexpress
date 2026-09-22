# PWA Progressive Install Strategy — Implementation Report

## Summary

This document records the full implementation of the progressive PWA install
strategy for the Yiwu Express / Global Trade platform.

**Goal:** Switch mobile UI from "always app-like" to display-mode-aware:

| Mode | Behaviour |
|---|---|
| **Browser** (default) | Standard responsive website — footer visible, no BottomNav, no StickyBuyBar, category grid layout, install banner shown |
| **Standalone (PWA installed)** | App-like layout — BottomNav, footer hidden, StickyBuyBar, swipeable category row, no install banner |

---

## Phase 1 — Display Mode Detection

### `hooks/useDisplayMode.ts` (NEW)

- Detects `display-mode: standalone`, `minimal-ui`, `fullscreen` via `window.matchMedia`.
- Detects iOS `navigator.standalone === true`.
- SSR-safe: defaults to `'browser'` on the server.
- Subscribes to `matchMedia.change`, `resize`, `visibilitychange` for runtime updates.
- Dispatches `pwa_analytics` CustomEvent when standalone mode is entered.

---

## Phase 2 — Layout Switching

### `components/MobileProvider.tsx` (MODIFIED)

Added to `MobileContextType`:

```ts
isStandalone: boolean   // PWA installed & running standalone
isBrowser: boolean      // running in browser tab
isMinimalUI: boolean    // minimal-ui display mode
mode: 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser'
```

Accepts optional `initialIsStandalone` prop for Storybook / test overrides.

### `components/mobile/MobileLayoutContainer.tsx` (NEW)

Client component wrapping `<main>`. Applies `pb-20` padding only in standalone
(to clear BottomNav), `pb-0` in browser. Exposes `data-display-mode` attribute.

### `app/[locale]/layout.tsx` (MODIFIED)

`<main>` replaced with `<MobileLayoutContainer>`.

### `components/mobile/BottomNav.tsx` (MODIFIED)

- Added `forceVisible?: boolean` prop.
- Returns `null` when `!isStandalone && !forceVisible` — BottomNav is invisible in browser mode.
- Added `data-testid="mobile-bottom-nav"` for test accessibility.

### `components/mobile/MobileShell.tsx` (MODIFIED)

- `showBottomNav` defaults to `undefined` (was `true`).
- `effectiveShowBottomNav = showBottomNav !== undefined ? showBottomNav : isStandalone`.
- Passes `forceVisible={effectiveShowBottomNav}` to BottomNav.

### `app/[locale]/design-3/components/Footer.tsx` (MODIFIED)

- Browser mode: `block` (footer visible).
- Standalone mode: `hidden md:block` (footer hidden on mobile).
- Added `data-testid="app-footer"`.

### `components/ui/BackToTop.tsx` (MODIFIED)

- Standalone: `bottom-[6.5rem]` (above BottomNav).
- Browser: `bottom-6`.

### `app/[locale]/products/[slug]/ProductDetailView.tsx` (MODIFIED)

`StickyBuyBar` is now gated by `showStickyBuyBar && isStandalone`.

### `components/mobile/home/MobileCategoryRow.tsx` (MODIFIED)

- Standalone: horizontal `overflow-x-auto snap-x` scroll with fixed-width buttons.
- Browser: `grid grid-cols-4` static grid.

---

## Phase 3 — Progressive Install Components

### `components/mobile/InstallPrompt.tsx` (REWRITTEN)

- Suppressed in standalone mode (`isStandalone === true`).
- Suppressed on specific routes: `/checkout`, `/products`, `/admin`.
- Session storage gate: shown once per browser session.
- Dismissal count: hidden permanently after 3 dismissals.
- 7-day snooze stored in `localStorage['gt_pwa_install_snoozed_until']`.
- Dispatches `pwa_analytics` events: `prompt_shown`, `prompt_dismissed`, `install_clicked`, `install_success`.
- Wraps `<InstallWelcomeModal>`.

### `components/mobile/InstallBanner.tsx` (NEW)

Standalone progressive banner. Same suppression rules. iOS installation guide sheet. Toast on install success.

---

## Phase 4 — Welcome Modal

### `components/mobile/InstallWelcomeModal.tsx` (NEW)

- Shown after 3-second delay on first visit.
- Shows benefits list (offline, faster, no browser bar, home screen icon).
- Stores choice in `localStorage` for 30 days.
- Suppressed in standalone mode.
- Dispatches analytics events.

---

## Phase 5 — Exports

### `components/mobile/index.ts` (MODIFIED)

Added exports for `InstallBanner`, `InstallWelcomeModal`, `MobileLayoutContainer`.

---

## Phase 6 — Tests

### `__tests__/BottomNav.test.tsx` (MODIFIED)

`useMobile` mock updated to include `isStandalone: true` so BottomNav renders in tests.

### `__tests__/mobile/useDisplayMode.test.ts` (NEW)

5 unit tests covering:
- Default `browser` mode in jsdom.
- Standalone detection via `matchMedia`.
- iOS `navigator.standalone` detection.
- Returns correct mode string.

### `__tests__/mobile/PwaProgressiveInstall.test.tsx` (NEW)

9 integration tests covering:
- `MobileLayoutContainer` renders with `data-display-mode`.
- BottomNav visible in standalone, hidden in browser.
- Footer visible in browser, hidden in standalone.
- `InstallBanner` rendered in browser mode.
- `InstallWelcomeModal` rendered in browser mode.

### `__tests__/mobile/InstallPrompt.test.tsx` (FIXED)

Added missing mocks: `usePathname`, `useMobile`, `sessionStorage.clear()`.

---

## Test Results

```
Exit code: 0 — all tests passed
```

Warnings: pre-existing `act()` warnings from `MobileQuoteCartPage` / `CompactQuoteAttributeSelector` (unrelated to this feature).

---

## Analytics Events

| Event | When |
|---|---|
| `pwa_analytics { action: 'standalone_entered' }` | User opens installed PWA |
| `pwa_analytics { action: 'prompt_shown' }` | Install prompt displayed |
| `pwa_analytics { action: 'prompt_dismissed' }` | User taps × |
| `pwa_analytics { action: 'install_clicked' }` | User taps Install |
| `pwa_analytics { action: 'install_success' }` | `appinstalled` event fires |
| `pwa_analytics { action: 'modal_shown' }` | Welcome modal displayed |
| `pwa_analytics { action: 'modal_install_clicked' }` | Install clicked in modal |
| `pwa_analytics { action: 'modal_closed' }` | Modal closed without install |

---

## Edge Cases

| Case | Handling |
|---|---|
| SSR (no `window`) | `useDisplayMode` returns `'browser'` safely |
| iOS Safari | `navigator.standalone` boolean checked |
| `minimal-ui` mode | Treated like standalone (BottomNav shown) |
| Rapid route changes | `isStandalone` from context, no re-detection |
| Snoozed user returns within 7 days | Banner stays hidden |
| Dismissed 3+ times | Banner hidden permanently |
| Checkout / admin routes | Install prompt suppressed |

---

## Files Changed

| File | Status |
|---|---|
| `hooks/useDisplayMode.ts` | NEW |
| `components/MobileProvider.tsx` | MODIFIED |
| `app/[locale]/layout.tsx` | MODIFIED |
| `components/mobile/MobileLayoutContainer.tsx` | NEW |
| `components/mobile/BottomNav.tsx` | MODIFIED |
| `components/mobile/MobileShell.tsx` | MODIFIED |
| `app/[locale]/design-3/components/Footer.tsx` | MODIFIED |
| `components/ui/BackToTop.tsx` | MODIFIED |
| `app/[locale]/products/[slug]/ProductDetailView.tsx` | MODIFIED |
| `components/mobile/home/MobileCategoryRow.tsx` | MODIFIED |
| `components/mobile/home/MobileHero.tsx` | MODIFIED |
| `components/mobile/InstallPrompt.tsx` | REWRITTEN |
| `components/mobile/InstallWelcomeModal.tsx` | NEW |
| `components/mobile/InstallBanner.tsx` | NEW |
| `components/mobile/index.ts` | MODIFIED |
| `__tests__/BottomNav.test.tsx` | MODIFIED |
| `__tests__/mobile/useDisplayMode.test.ts` | NEW |
| `__tests__/mobile/PwaProgressiveInstall.test.tsx` | NEW |
| `__tests__/mobile/InstallPrompt.test.tsx` | FIXED |
