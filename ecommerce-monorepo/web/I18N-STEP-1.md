# I18N-STEP-1.md

## Step 1a — Type A Fix Report (Hardcoded English Literals)

### Scope
Fixed all 5 Type A instances of the hardcoded English string `'Failed to add item to cart'`
in `app/[locale]/products/[slug]/ProductDetailView.tsx`.

- **Instance #1** in `app/api/cart/route.ts` (line 271) was **SKIPPED** per DO-NOT-TOUCH rule on `app/api/**`.

### Translations
Key: `Cart.errors.failedAdd`

| Locale | Value | Status |
|---|---|---|
| en | `Failed to add item to cart` | verified |
| ru | `Не удалось добавить товар в корзину` | PENDING NATIVE REVIEW |
| zh | `无法将商品添加到购物车` | PENDING NATIVE REVIEW |

The PENDING NATIVE REVIEW marker is recorded here only — NOT in the JSON files. JSON contains the actual strings.

## Changes made

### messages/*.json (3 files)
Added `Cart.errors.failedAdd` to en.json, ru.json, zh.json.
- Discovered the existing `Cart` namespace during the fix, so used it instead of creating a new lowercase `cart` namespace.
- Cleaned up the initially-created lowercase `cart` key.

### app/[locale]/products/[slug]/ProductDetailView.tsx
- Added `const tCart = useTranslations('Cart')`
- Replaced 5 hardcoded literals with `tCart('errors.failedAdd')` (lines 178, 189, 193, 1031, 1035)

### Key naming rationale
The component's default `t` is typed against the `Product` namespace.
A separate `useTranslations('Cart')` hook was added so the key resolves to
`Cart.errors.failedAdd` with correct next-intl strict typing, avoiding TS2345.

## Verification

```
$ npx tsc --noEmit
EXIT: 0  (0 errors)

$ npx vitest run
Test Files  12 passed (12)
Tests  77 passed (77)
```

## git diff --stat
(filled after commit)

## Flags
- ru/zh translations are PENDING NATIVE REVIEW — should be confirmed by a native speaker before production launch.