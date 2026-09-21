# Language & Currency Selector Implementation Report

> **Evaluation & Implementation Date:** September 2026  
> **Target System:** Global Trade / Yiwu Express Web Client (`ecommerce-monorepo/web`)  
> **Scope:** Desktop Header, Mobile Hamburger Drawer, Mobile Settings/Profile (`/profile`), Desktop Footer, Auto-Detection & 1-Year Cookie Persistence.

---

## 1. Discovery Findings (Phase 1)

1. **Existing Language / Currency Selectors:**
   - Prior to this task, the desktop header had basic dropdowns in the micro top bar, but lacked clear globe/currency visual cues.
   - The mobile drawer had a small horizontal scrolling button row that did not match standard native app design guidelines.
   - The mobile profile view had a single row opening a modal sheet with tabs, rather than separate discoverable settings.
   - The desktop footer had no language or currency selectors whatsoever.
2. **Placement:**
   - Desktop Header: `app/[locale]/design-3/components/Header.tsx` (top micro bar).
   - Mobile Drawer: `components/mobile/MobileDrawer.tsx` (bottom section).
   - Mobile Profile: `components/mobile/account/MobileProfileView.tsx` (Preferences card).
   - Desktop Footer: `app/[locale]/design-3/components/Footer.tsx` (bottom legal strip).
3. **`useCurrency()` Hook:**
   - Located in `contexts/CurrencyContext.tsx` and re-exported through `hooks/useCurrency.tsx`. Provides active currency, live rates, `formatPrice()`, `convertPrice()`, and `setCurrency()`.
4. **`useLocale()` from `next-intl`:**
   - Supported locales: `['en', 'ru', 'zh']`.
   - Next-intl routing defined in `i18n/routing.ts` with prefix `'always'`.
5. **Cookie Storage Prior to Task:**
   - Language was inconsistently stored (partially set in header `switchLocale`, but missing in mobile drawer and preferences sheet).
   - Currency was stored **strictly in `localStorage`**, never in cookies. SSR had no access to the user's currency choice, causing client hydration shifts.
6. **Switching Mechanism:**
   - Language change requires a full page navigation (`window.location.href`) to reload translated server and client bundles.
   - Currency change updates reactively without reloading the page.
7. **Price Updates:**
   - `formatPrice` is wired across catalog cards, PDP, cart summary, and checkout.
8. **Mobile Drawer Section:**
   - Existed as an unstyled button grid; needed redesign into dedicated vertical radio selector.

---

## 2. Design Wireframes (Phase 2)

### 2.1 Desktop Header (Top-Right)
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] Global Trade       [Search Bar]           🌐 EN ▼   💵 USD ▼   │
└────────────────────────────────────────────────────────────────────────┘
```
- **Language Dropdown:** `🌐 EN ▼` with flags (🇺🇸 English, 🇷🇺 Русский, 🇨🇳 中文) and active checkmarks.
- **Currency Dropdown:** `💵 USD ▼` with symbols (`$ USD`, `₽ RUB`, `¥ CNY`, `€ EUR`, etc.) and active checkmarks.

### 2.2 Mobile Hamburger Drawer
```
┌────────────────────────────────────────┐
│ ☰ Global Trade                   ✕    │
│                                        │
│ [Sign In / Register]                  │
│ [Navigation Links]                     │
│                                        │
│ ── Language & Currency ─────────────── │
│                                        │
│ 🌐 Language                            │
│ ● 🇺🇸 English (US)                  EN │
│ ○ 🇷🇺 Русский                          │
│ ○ 🇨🇳 中文                             │
│                                        │
│ 💵 Currency                            │
│ ● USD ($)                    US Dollar │
│ ○ RUB (₽)                Russian Ruble │
│ ○ CNY (¥)                 Chinese Yuan │
│ ○ EUR (€)                         Euro │
└────────────────────────────────────────┘
```

### 2.3 Mobile Settings Page (`/profile`)
```
┌────────────────────────────────────────┐
│ < Account Preferences                  │
│                                        │
│ Language & Currency                    │
│ ────────────────────────────────────── │
│ 🌐 Language            English       > │
│ 💵 Currency            USD ($)       > │
│ 🔔 Notifications       On            > │
└────────────────────────────────────────┘
```
*Tapping opens the draggable bottom sheet directly focused on that selection.*

### 2.4 Desktop Footer
```
┌────────────────────────────────────────────────────────────────────────┐
│ © 2026 Global Trade. All rights reserved.    🌐 EN ▼  |  💵 USD ▼     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Components Created & Refactored (Phase 3)

### 1. `lib/locale-navigation.ts` [NEW]
- `setCookie(name, value, days)`: Sets cookie with 1-year max-age (`SameSite=Lax`).
- `getCookie(name)`: Reads cookies in client runtime.
- `switchLocale(newLocale, currentLocale, pathname)`: Sets `NEXT_LOCALE` cookie, updates URL path with new locale prefix, preserves search queries, and triggers navigation.

### 2. `components/i18n/LanguageSwitcher.tsx` [NEW]
- Variants:
  - `header-dropdown`: Compact top-bar dropdown with flag and short code.
  - `footer-dropdown`: Sleek dark-mode footer selector with popup.
  - `drawer-radio`: Full vertical list with radio selection buttons (`●` vs `○`).
- Supported locales: `en` (🇺🇸 English), `ru` (🇷🇺 Русский), `zh` (🇨🇳 中文).

### 3. `components/i18n/CurrencySwitcher.tsx` [NEW]
- Variants:
  - `header-dropdown`: Header dropdown with badge, code, and live list.
  - `footer-dropdown`: Dark footer dropdown.
  - `drawer-radio`: Dedicated vertical radio list (`●` vs `○`).
- Prioritizes top trade currencies: USD, RUB, CNY, EUR, GBP, AED, TRY, etc.
- Updates reactively on select without closing drawer or reloading page.

### 4. `components/i18n/LocaleCurrencyAutoDetect.tsx` [NEW]
- Client-side auto-detection hook and non-intrusive top banner.
- Detects `navigator.language` (e.g. `ru-RU`, `zh-CN`).
- If browser is Russian and site is in English, offers 1-tap switch to Русский + RUB.
- If browser is Chinese and site is in English, offers 1-tap switch to 中文 + CNY.
- Includes clear [Dismiss] action; respects user choice and persists dismissal for 1 year.

---

## 4. Files Modified

| File Path | Description of Changes |
| :--- | :--- |
| `contexts/CurrencyContext.tsx` | Added `initialCurrency` support for SSR hydration and 1-year `NEXT_CURRENCY` cookie persistence on `setCurrency()`. |
| `app/[locale]/layout.tsx` | Reads `NEXT_CURRENCY` from `cookies()`, passes `initialCurrency` to `CurrencyProvider`, and mounts `<LocaleCurrencyAutoDetect />`. |
| `app/[locale]/design-3/components/Header.tsx` | Replaced manual dropdowns with standard discoverable `<LanguageSwitcher variant="header-dropdown" />` and `<CurrencySwitcher variant="header-dropdown" />`. |
| `components/mobile/MobileDrawer.tsx` | Integrated dedicated "Language & Currency" section with vertical radio selection (`variant="drawer-radio"`). |
| `components/mobile/account/MobileProfileView.tsx` | Added discrete "Language & Currency" card with separate rows for Language (`English >`), Currency (`USD ($) >`), and Notifications (`On >`). |
| `components/mobile/account/MobilePreferencesSheet.tsx` | Synced active tab with `initialTab`, added `switchLocale()` navigation with `NEXT_LOCALE` cookie persistence. |
| `app/[locale]/design-3/components/Footer.tsx` | Added Language and Currency dropdowns to the bottom copyright bar (`variant="footer-dropdown"`). |

---

## 5. Verification & Test Results (Phase 4)

### Automated Test Suite
- **TypeScript Typecheck:** `npx tsc --noEmit` &rarr; **Passed with 0 errors**.
- **Vitest Full Suite:** `npm test` &rarr; **68 passed (68 test files), 276 passed (276 total tests)**.
- **Dedicated I18n Suite:** `__tests__/i18n/LanguageCurrencySwitcher.test.tsx` &rarr; **12 passed (12 tests)**.

```bash
 ✓ __tests__/i18n/LanguageCurrencySwitcher.test.tsx (12 tests)
   ✓ LanguageSwitcher > renders desktop header dropdown with active language EN
   ✓ LanguageSwitcher > opens dropdown on click and displays options for EN, RU, ZH
   ✓ LanguageSwitcher > renders drawer radio list variant with flags and titles
   ✓ LanguageSwitcher > renders footer dropdown variant
   ✓ CurrencySwitcher > renders desktop header dropdown with active currency USD
   ✓ CurrencySwitcher > opens dropdown on click and shows available currencies (RUB, CNY, EUR)
   ✓ CurrencySwitcher > triggers setCurrency when a currency is selected
   ✓ CurrencySwitcher > renders drawer radio list with popular currencies
   ✓ Locale and Cookie Navigation Utilities > sets and retrieves cookies correctly
   ✓ Locale and Cookie Navigation Utilities > switchLocale sets NEXT_LOCALE cookie
   ✓ LocaleCurrencyAutoDetect > suggests Russian when browser language is ru-RU and current locale is en
   ✓ LocaleCurrencyAutoDetect > dismisses banner on dismiss click and stores dismissal flag

 Test Files  68 passed (68)
      Tests  276 passed (276)
```

---

## 6. Cookie Persistence & SSR Hydration

- **Language Persistence:**
  - Key: `NEXT_LOCALE`
  - Max-Age: `31536000` (1 Year)
  - `SameSite=Lax; path=/`
  - Handled by `next-intl` middleware and client helper `switchLocale()`.
- **Currency Persistence:**
  - Key: `NEXT_CURRENCY`
  - Max-Age: `31536000` (1 Year)
  - `SameSite=Lax; path=/`
  - Read on server in `app/[locale]/layout.tsx` via `cookies().get('NEXT_CURRENCY')`.
  - Passed to `<CurrencyProvider initialCurrency={...}>` to ensure server-rendered prices match user preference without hydration flash.

---

## 7. Edge Cases Addressed

1. **Preserving Query Parameters:**
   When switching languages from `/en/store?category=tools&sort=price_asc`, `switchLocale()` preserves `?category=tools&sort=price_asc` and navigates to `/ru/store?category=tools&sort=price_asc`.
2. **Double Inset & Drawer State:**
   Changing currency inside `MobileDrawer` does NOT close the drawer, allowing users to see their currency selection confirmed immediately. Changing language reloads the document into the new locale.
3. **Auto-Detect Non-Intrusiveness:**
   `LocaleCurrencyAutoDetect` checks whether the user has already chosen or dismissed a preference. If dismissed once, it never shows again, preventing annoyance.
4. **Offline & Fallback Safety:**
   If the user is offline or currency API fails, `CurrencyProvider` safely falls back to `DEFAULT_CURRENCIES` (USD, EUR, CNY, RUB) with static baseline rates.

---

*Status: Implemented, fully verified, and ready for deployment.*
