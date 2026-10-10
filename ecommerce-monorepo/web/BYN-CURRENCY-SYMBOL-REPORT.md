# BYN Currency Symbol Implementation Report

## Summary
The official Belarusian Ruble (BYN) currency symbol (approved by the National Bank of the Republic of Belarus) is now natively supported across the platform.

### Problem Addressed
Previously, whenever a user/admin entered or selected BYN, the symbol rendered as "ƃ" or a broken/missing character because standard operating system and web fonts do not contain the newly standardized official NBRB glyph.

### Key Changes Implemented

1. **Official NBRB Vector Glyph (`BynSymbol.tsx`)**
   - Implemented `ecommerce-monorepo/web/components/icons/BynSymbol.tsx` using the official NBRB vector path (`viewBox="0 0 2.65 2.65"`, `fill="currentColor"`).
   - Properly aligns with typography (`inline-block`, `vertical-align: -0.125em`, standard `1em` proportional sizing).

2. **Unified Currency Symbol Component (`CurrencySymbol.tsx`)**
   - Created `ecommerce-monorepo/web/components/ui/CurrencySymbol.tsx` to handle currency symbol rendering across the application.
   - For `code === 'BYN'`, it renders the official SVG icon `<BynSymbol />`.
   - For all other currencies, it displays the standard string symbol inside a styled `<span>`.

3. **React Price Component (`PriceFormatted.tsx`)**
   - Created `ecommerce-monorepo/web/components/ui/PriceFormatted.tsx` to support structured React rendering of prices with before/after symbol positioning and proper BYN symbol integration.

4. **Client & Server Currency Services Safeguards**
   - `CurrencyContext.tsx`: Updated `formatPrice` string fallback logic so that whenever BYN is formatted in plain-text strings, it renders as clean `'BYN'` or `'руб.'` text rather than broken glyph characters.
   - `currency-service.ts`: Updated `formatAmount` and `formatAmountSync` to guard against broken characters by checking for `code === 'BYN'`.

5. **Admin Currency Management (`/admin/currencies`)**
   - **Symbol Field Locking:** When creating or editing a currency with code `BYN`, the symbol input field is locked (`disabled`/`readOnly`).
   - **Visual Preview:** Displays the official NBRB symbol with a badge and note: *"Official BYN symbol is applied automatically."*
   - **Server-Side API Enforcement:** `POST /api/admin/currencies` and `PUT /api/admin/currencies/[id]` automatically enforce that `BYN` has its symbol set safely to `'BYN'` and default position to `'after'`.

6. **Currency Switcher Dropdowns (`CurrencySwitcher.tsx`)**
   - Updated header dropdown, footer dropdown, and mobile drawer variants to render `<CurrencySymbol code={c.code} symbol={c.symbol} />`.
   - Displays the official BYN vector icon in all picker rows and button triggers.

7. **Typography & Font Fallbacks**
   - Added `@font-face` definition for `nbrb` and `.nbrb-icon` in `globals.css`.
   - Added `nbrb` font family to `tailwind.config.ts`.
   - Created `public/fonts/nbrb/README.md`.

## Quality Checks
- `tsc --noEmit`: **0 errors**
- Clean Git commits per modified file.
