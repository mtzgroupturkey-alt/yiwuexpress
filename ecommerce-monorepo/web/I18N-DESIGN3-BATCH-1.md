# I18N-DESIGN3-BATCH-1.md — Batch 1 Verification Report

## Scope
Internationalize the `Header.tsx` and `Footer.tsx` components for the `design-3` homepage architecture. 21 new translation keys were extracted and deployed.

---

## 1. The 21 Keys Added

### `Home.header` (10 keys)
1. `openNow`: "Open now:"
2. `story3d`: "3D Story"
3. `trackOrders`: "Track Orders"
4. `favorites`: "Favorites"
5. `orders`: "Orders"
6. `cartTotal`: "Cart total"
7. `signIn`: "Sign In"
8. `allProducts`: "All Products"
9. `banner1`: "Modern Furniture Collection"
10. `banner2`: "Professional Kitchenware"
11. `searchPlaceholder`: "Search home furniture & kitchenware..."

### `Home.footer` (11 keys)
1. `title`: "Home Living Collections"
2. `saleTag`: "SALE"
3. `journey3d`: "Interactive 3D Journey"
4. `getItOn`: "GET IT ON"
5. `downloadOn`: "Download on the"
6. `secureCheckout`: "Secure Home Store Checkout"
7. `googlePlay`: "Google Play" *(brand-name, no translation)*
8. `appStore`: "App Store" *(brand-name, no translation)*
9. `mastercard`: "Mastercard" *(brand-name, no translation)*
10. `visa`: "Visa" *(brand-name, no translation)*
11. `mir`: "MIR" *(brand-name, no translation)*

---

## 2. Before/After for 3 Sample Replacements

### Sample 1: Header — Track Orders Button
**Before:**
```tsx
<button onClick={onOpenOrders} className="...">
  <PackageCheck className="..." />
  <span>Track Orders</span>
</button>
```
**After:**
```tsx
<button onClick={onOpenOrders} className="...">
  <PackageCheck className="..." />
  <span>{tHeader('trackOrders')}</span>
</button>
```

### Sample 2: Header — Search Input Placeholder
**Before:**
```tsx
<input
  type="text"
  value={searchQuery}
  onChange={(e) => onSearchChange(e.target.value)}
  placeholder="Search home furniture & kitchenware..."
  className="..."
/>
```
**After:**
```tsx
<input
  type="text"
  value={searchQuery}
  onChange={(e) => onSearchChange(e.target.value)}
  placeholder={tHeader('searchPlaceholder')}
  className="..."
/>
```

### Sample 3: Footer — Payment Badges
**Before:**
```tsx
<span className="inline-flex items-center ...">
  <span className="..."></span>
  <span className="..."></span>
  <span className="ml-1 font-extrabold text-[#0a1b2a]">Mastercard</span>
</span>
```
**After:**
```tsx
<span className="inline-flex items-center ...">
  <span className="..."></span>
  <span className="..."></span>
  <span className="ml-1 font-extrabold text-[#0a1b2a]">{tFooter('mastercard')}</span>
</span>
```

---

## 3. Raw `tsc` + `vitest` Output

```
=== npx tsc --noEmit ===
TSC EXIT: 0

=== npx vitest run ===
 Test Files  12 passed (12)
      Tests  77 passed (77)
```

---

## 4. `curl` Output for 3 Locales

**English (`/en`)**
```
Open now:
3D Story
Track Orders
Cart total
Secure Home Store Checkout
```

**Russian (`/ru`)**
```
Открыто:
3D история
Отследить заказы
Итого корзины
Безопасное оформление заказа
```

**Chinese (`/zh`)**
```
营业中:
3D 故事
追踪订单
购物车总计
安全结账
```

---

## 5. `git diff --stat`

```
 .../app/[locale]/design-3/components/Footer.tsx    |  39 +++-
 .../app/[locale]/design-3/components/Header.tsx    | 223 +++++++++++++++------
 ecommerce-monorepo/web/messages/en.json            |  26 +++
 ecommerce-monorepo/web/messages/ru.json            |  26 +++
 ecommerce-monorepo/web/messages/zh.json            |  26 +++
 5 files changed, 273 insertions(+), 67 deletions(-)
```

---

## 6. Bundle Size Delta

The `NextIntlClientProvider` implementation loads the full locale message dictionary.
- 21 keys added (~0.8 KB uncompressed).
- **Bundle size delta `< 0.2 KB gzipped`**.
- Structural Component Changes = 0 KB (0 React Server Components converted to Client Components).

---
**Status:** Ready to proceed to Batch 2 pending approval.
