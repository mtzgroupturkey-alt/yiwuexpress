# Comprehensive Product Detail Page (PDP) Audit Report
**Design Consistency, Functionality, Data Integrity, Admin Extensibility, and Standard PDP Roadmap**

- **Target PDP**: `http://localhost:3001/en/products/10-inch-android-tablet`
- **Secondary Locales**: `http://localhost:3001/ru/products/10-inch-android-tablet`, `http://localhost:3001/zh/products/10-inch-android-tablet`
- **Reference Pages**: PLP (`http://localhost:3001/en/store`), Homepage (`http://localhost:3001/en`)
- **Admin Pages**: `http://localhost:3001/admin/products/new`, `http://localhost:3001/admin/products/[id]/edit`
- **Active Store Mode**: `storeMode = 'WHOLESALE'`, `rfqModel = 'RFQ'`
- **Audit Date**: September 18, 2026
- **Status**: Audit Completed. Zero code modifications performed. Ready for review and execution approval.

---

## Executive Summary

The transition from the mock prototype (`design-3/components/ProductDetailPage.tsx`) to the production-oriented server-rendered route (`ProductDetailView.tsx`) successfully resolved the critical hardcoded coffee machine mockup bugs and enabled genuine server-side Prisma querying and proper HTTP 404 handling. 

However, a deep audit of `10-inch-android-tablet` alongside the PLP (`/store`), Homepage (`/`), and Admin panel (`/admin/products/...`) reveals **12 critical functional and UX gaps**, **7 visual inconsistencies**, and **major opportunities to elevate the PDP to an international enterprise standard (Amazon / AliExpress / Shopify Plus)**:

1. **Variants are Completely Missing**: The database record for `10-inch-android-tablet` has **6 active variants** (2 sizes: 8-inch, 10-inch; 3 colors: Black, White, Gold) with differing prices ($189.99 vs $218.49) and SKUs. `ProductDetailView.tsx` neither accepts nor renders variants. Buyers cannot choose colors or sizes.
2. **Inert / Dead UI Controls**: The "Favorite" heart button contains an unhandled `// TODO: Implement API call`, disregarding the existing working `useWishlist()` hook and `WishlistButton`. The "Ask a Question" form and "Live Chat" button have zero submit/click handlers.
3. **Double Title in Metadata**: `generateMetadata` outputs `${title} — ${companyName}`, which RootLayout's title template formats again into `10-Inch Android Tablet - Premium Quality — dromkok | dromkok`.
4. **Layout Inconsistency (PageHero Banner)**: PDP wraps content in `SharedLayout` with a heavy photographic header (`PageHero` with `/images/breadcrumb-bg.jpg`), duplicating breadcrumbs and pushing the actual product viewport down. The PLP and Homepage do not use `PageHero`, providing a much faster, modern product-first experience.
5. **Wholesale Bypass on Related Products**: In `ProductDetailView.tsx`, related product cards dispatch retail `POST /api/cart` with hardcoded `quantity: 1`, bypassing wholesale MOQ and the QuoteCart system.
6. **Hardcoded Assumptions in Placeholders**: The size guide displays a hardcoded women's clothing chart (`S/M/L/XL`) on an electronic tablet page; the live viewer count generates a fake client-side random number; the rating stars always display 5 stars even when reviews count is 0.

---

## PHASE 1 — Design Audit (Visual Consistency)

### 1.1 Styling Comparison: PDP vs. PLP vs. Homepage

| Element | PDP (`/products/[slug]`) | PLP (`/store`) | Homepage (`/`) | Consistent? | Evidence |
|---|---|---|---|:---:|---|
| **Header** | `Design3LayoutHeader` (wrapped via `SharedLayout`) | `Design3LayoutHeader` (wrapped via `SharedLayout`) | `Header` (Design-3 with direct modals) | ⚠️ Partial | Identical top bar/search/cart modals, but PDP mounts `PageHero` banner immediately underneath it. |
| **Hero / Header Banner** | Mounts `PageHero` banner (height ~220px, dark photographic overlay `/images/breadcrumb-bg.jpg`, white text, breadcrumbs) | None (direct catalog filter bar & grid) | None (interactive `HeroBanner` with category carousel) | ❌ Inconsistent | `SharedLayout.tsx` renders `PageHero` whenever `!showHero && pageTitle`. PLP omits `pageTitle`, so it has no banner. PDP includes `pageTitle`, forcing a disruptive hero banner. |
| **Footer** | `Design3LayoutFooter` | `Design3LayoutFooter` | `Footer` (Design-3) | ✅ Consistent | Same 4-column layout, payment badges, newsletter bar. |
| **Primary Button Color** | `bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600` (`#1a3a5c`) with shimmer animation | `bg-[#00407a] hover:bg-[#00315c]` or `bg-gradient-to-r from-[#1a3a5c] to-[#2563eb]` | `bg-[#00407a]` and `bg-gradient-to-r from-[#1a3a5c] to-[#2563eb]` | ⚠️ Partial | PDP uses Tailwind `primary-600`, whereas PLP/Homepage use hardcoded `#00407a` and `#2563eb`. |
| **Secondary Button Color** | `border-2 border-primary-600 text-primary-700 hover:bg-primary-50` | `border border-slate-200 text-slate-700 hover:bg-slate-50` | `border border-slate-200 text-slate-700 hover:bg-slate-50` | ⚠️ Partial | PDP uses thick border-2 and primary brand blue; PLP uses subtle slate-200 border. |
| **Card Backgrounds** | `bg-white` with gradient header bars (`from-blue-50 to-blue-100`) for specifications & description cards | Pure flat `bg-white` with `border border-slate-100` | Flat `bg-white` with `border border-slate-100/80` | ❌ Inconsistent | PDP uses dated gradient header bars on sub-cards (`Specifications`, `Description`); PLP and Home use clean modern flat cards. |
| **Border Radius** | Mixed: `rounded-lg` (8px) on cards/inputs/tabs, `rounded-2xl` (16px) on main image | `rounded-2xl` (16px) and `rounded-xl` (12px) | `rounded-2xl` (16px) and `rounded-3xl` (24px) | ❌ Inconsistent | PDP sub-cards use tight `rounded-lg` (8px); modern Design-3 standard is `rounded-2xl` (16px). |
| **Shadows** | `shadow-md`, `hover:shadow-lg`, and custom `shadow-[0_8px_30px_rgb(26,58,92,0.2)]` | `shadow-sm hover:shadow-md` | `shadow-sm hover:shadow-xl` | ⚠️ Partial | PDP CTA uses a heavy saturated blue drop shadow (`0_8px_30px...`) not present on PLP/Home. |
| **Typography Scale** | In-page product name is `text-2xl lg:text-3xl font-bold`; `PageHero` title is `text-3xl sm:text-4xl` | Section titles `text-2xl sm:text-3xl font-bold` | Hero heading `text-4xl sm:text-5xl font-black`, sections `text-2xl` | ⚠️ Partial | In PDP, product name is visually split: large in `PageHero` banner and medium in product block. |
| **Font Family** | System / Geist Sans (`font-sans`) | System / Geist Sans (`font-sans`) | System / Geist Sans (`font-sans`) | ✅ Consistent | Uniform typography across all routes. |
| **Spacing Grid** | `grid-cols-1 lg:grid-cols-12 gap-6`, container `maxWidth="2xl"` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`, container `max-w-7xl` | 12-column layout, `max-w-7xl` | ⚠️ Partial | PDP uses `<Container maxWidth="2xl">` which sets `max-w-screen-2xl`, wider than PLP's `max-w-7xl`. |
| **Breadcrumb Style** | In `PageHero` on dark photographic overlay | Integrated above product listings / filter bar | None on home | ❌ Inconsistent | PDP breadcrumb is separated into the top hero banner instead of being an in-page navigation element above the product title. |
| **Trust Badges** | `TrustBadgesMini` (4 inline mini items) + custom delivery card | Minimal trust icons in Quick View modal | `TrustFeatures` (4 large cards with detailed guarantees) | ⚠️ Partial | Different iconography and copy between PDP and Homepage trust features. |
| **Image Aspect Ratio** | 1:1 (`aspect-square`) | 1:1 (`aspect-square`) | 1:1 (`aspect-square`) | ✅ Consistent | Uniform 1:1 square ratio across thumbnails and cards. |
| **Badge / Pill Styles** | `Badge` (shadcn) with `px-4 py-1.5` and `Badge variant="destructive"` | Rounded pill badges `rounded-full text-xs px-2.5 py-0.5` | Rounded pill badges `rounded-full text-xs font-semibold` | ❌ Inconsistent | PDP badges are larger and rectangular with `rounded-md`, whereas PLP/Home use sleek circular `rounded-full` pills. |
| **Motion / Animations** | CSS keyframes `animate-fade-in` and `animate-slide-in` | CSS transitions `hover:scale-[1.02]` | `MotionReveal` (framer-motion style stagger) | ⚠️ Partial | Home has fluid scroll-triggered entrance motion; PDP uses abrupt CSS opacity fades. |

---

### 1.2 Inconsistencies Report

| # | Element | PDP Current State | PLP / Home Standard | Impact | Recommended Fix |
|---|---|---|---|---|---|
| **D-01** | **PageHero Header Banner** | Renders 220px tall dark image banner with product name & breadcrumb | Direct catalog/store view, no intrusive banner | **High**: Pushes the product image and buy box below the fold; disrupts e-commerce flow. | Pass `showHero={true}` to `SharedLayout` (or remove `pageTitle` from `SharedLayout`) so `PageHero` does not render. Place breadcrumbs inside the PDP container. |
| **D-02** | **Breadcrumbs Placement** | Trapped inside `PageHero` with dark background image | Clean text breadcrumbs on light background above gallery/title | **Medium**: Poor contrast and disconnected from product content. | Render standard breadcrumb trail (`Home / Electronics / Tablets / 10-Inch Android Tablet`) directly above gallery. |
| **D-03** | **Card Border Radius** | `rounded-lg` (8px) on specifications, description, and FAQ cards | `rounded-2xl` (16px) or `rounded-3xl` across cards | **Medium**: PDP looks dated compared to modern Design-3 components. | Upgrade card containers to `rounded-2xl` with subtle `border-slate-100`. |
| **D-04** | **Sub-card Header Styling** | Dated gradient header strips: `bg-gradient-to-r from-blue-50 to-blue-100` | Flat clean tabs or subtle border-b headers with neutral typography | **Medium**: Creates a busy, fragmented visual presentation. | Consolidate Description, Specifications, Reviews, and FAQ into a modern unified Tabbed interface. |
| **D-05** | **Badge Geometry** | Rectangular `rounded-md` badges with heavy padding (`px-4 py-1.5`) | Sleek `rounded-full` pills (`px-2.5 py-0.5 text-xs font-semibold`) | **Low**: Inconsistent aesthetic with catalog cards. | Use `rounded-full text-xs font-semibold` pill badges matching `ProductCard.tsx`. |
| **D-06** | **Action Button Gradients & Shadows** | Oversaturated gradient with heavy `shadow-[0_8px_30px_rgb(26,58,92,0.2)]` | Clean solid `#00407a` or subtle gradient with `shadow-sm hover:shadow-md` | **Medium**: CTA looks overly stark and inconsistent with PLP buttons. | Unify button styles using the project primary design token and standard hover lift. |
| **D-07** | **Container Width** | `maxWidth="2xl"` (~1536px) | `max-w-7xl` (~1280px) | **Low**: PDP content stretches too wide on ultra-wide monitors. | Standardize container to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. |

---

## PHASE 2 — Functional Audit

### 2.1 Primary CTAs

| Action / Button | Mode Behavior | Status | Evidence | Root Cause / Fix |
|---|---|:---:|---|---|
| **Add to Cart (Retail)** | Visible only when `storeMode !== 'WHOLESALE'` | ✅ Works | Gated by `isRetail` in `ProductDetailView.tsx:810`. Hidden in wholesale mode to enforce MOQ. Calls `/api/cart`. | Verified working as designed. |
| **Add to Quote List (Wholesale RFQ)** | Primary CTA in `WHOLESALE` mode | ✅ Works | `ProductDetailView.tsx:826-839`. Validates MOQ, adds to `WholesaleInquiryContext` and `QuoteCartContext`, shows feedback toast with quote link. | Successfully synchronizes with header quote badge. |
| **Add to Wholesale Cart (INSTANT)** | When `rfqModel === 'INSTANT'` | ❌ Broken | `ProductDetailView.tsx` does NOT check `rfqModel` at all! Only says "Add to Quote List". | Import `useSettings()`, check `settings?.rfqModel === 'INSTANT'`, and provide direct wholesale cart checkout. |
| **Add to Wishlist / Favorites** | Heart icon in top action bar | ❌ Broken | `ProductDetailView.tsx:247-250`: `handleToggleFavorite` only toggles local state `isFavorite`, with `// TODO: Implement API call`. | Replace with existing production `WishlistButton` component (`components/products/WishlistButton.tsx`). |
| **Share Product** | Share icon in top action bar | ⚠️ Partial | `ProductDetailView.tsx:252-270`: Uses `navigator.share` with fallback to clipboard copy. Works, but fallback menu only has "Copy Link", no social share channels (WhatsApp, WeChat, Email). | Add WhatsApp, WeChat, and Email share options in the dropdown. |
| **Compare Products** | Compare button | 🚫 Missing | No compare button or comparison drawer exists on the PDP. | Add optional product comparison trigger. |

---

### 2.2 Quantity Selector & MOQ Enforcement
- **Manual Input**: `<input type="number">` allows typing numbers, but does not prevent typing non-numeric characters or negative values until blur.
- **Increment / Decrement (+ / -)**: Works as expected. Minus button disabled at `quantity <= effectiveMinQty`. Plus button disabled at `quantity >= product.stock`.
- **MOQ Enforcement**: `getEffectiveMinOrderQty(product.minOrderQty, storeMode)` initializes quantity to 2 (product MOQ) or 10 (settings default). Attempting to submit lower quantity triggers inline error message.
- **Stock Limit**: Prevents increasing past `product.stock` (114 units for tablet).

---

### 2.3 Image Gallery
- **Thumbnails**: 5-column grid under main image. Clicking thumbnail switches main view.
- **Zoom / Lightbox**: Clicking the zoom button opens a full-screen lightbox modal.
- **Defect (No Swipe/Touch)**: Lightbox and main image lack touch swipe event handlers (`onTouchStart`, `onTouchEnd`) on mobile devices.
- **Defect (No Keyboard)**: Lightbox does not listen for `ArrowLeft`, `ArrowRight`, or `Escape` keys. Focus is not trapped.
- **Defect (Standard Image Tag)**: `ProductImageGallery.tsx` imports Next.js `Image` on line 4, but renders plain `<img>` tags on lines 30, 84, and 113, losing automatic WebP conversion and responsive `srcset`.

---

### 2.4 Variant Selection (Critical Bug)
- **Status**: ❌ **CRITICAL BUG / MISSING**
- **Evidence**:
  - In DB: `10-inch-android-tablet` has **6 active variants** in table `product_variants`:
    - `ELEC-004-VAR-001`: Size: 8-inch, Color: Black, Stock: 23, Price: $189.99
    - `ELEC-004-VAR-002`: Size: 8-inch, Color: White, Stock: 101, Price: $189.99
    - `ELEC-004-VAR-003`: Size: 8-inch, Color: Gold, Stock: 83, Price: $218.49
    - `ELEC-004-VAR-004`: Size: 10-inch, Color: Black, Stock: 110, Price: $189.99
    - `ELEC-004-VAR-005`: Size: 10-inch, Color: White, Stock: 100, Price: $189.99
    - `ELEC-004-VAR-006`: Size: 10-inch, Color: Gold, Stock: 59, Price: $218.49
  - In `page.tsx`: Server query fetches `variants: true`, but `ProductDetailView.tsx` props do NOT include `variants` in `ProductData` interface!
  - In `ProductDetailView.tsx`: There is zero variant selector UI (no size pills, no color swatches).
  - Price synchronization is impossible; Gold variant ($218.49) cannot be bought.

---

### 2.5 Reviews Section
- **Dynamic Fetching**: Uses `@tanstack/react-query` to fetch `/api/products/${productId}/reviews`.
- **Review Form**: Modal/inline form allows submitting rating, title, and comment.
- **Photo Upload**: Schema `Review` supports `images String[]`, and `ReviewList.tsx` has code to display them, but `ReviewForm.tsx` has NO image upload input. Customers cannot attach photos.
- **Rating Breakdown**: Visual bar distribution (5★, 4★, 3★, 2★, 1★) functions properly when reviews exist.
- **Empty State**: When 0 reviews exist (current state of tablet), displays "No reviews yet. Be the first to review this product" with "Write a Review" button.

---

### 2.6 Related Products
- **DB Source**: Fetches `/api/products/${slug}/related?limit=4&locale=${locale}`. Correctly returns 3 related electronics products (`Business Laptop`, `64GB Smartphone`, `Bluetooth Headphones`).
- **Defect (Wholesale Bypass)**: Lines 1041-1075 of `ProductDetailView.tsx` pass `onAddToCart` to `ProductCard`, calling `POST /api/cart` with hardcoded `quantity: 1`. In `WHOLESALE` mode, clicking add on a related product bypasses MOQ and quote routing!

---

### 2.7 Trust Signals & Guarantees
- **TrustBadgesMini**: Displays 4 badges (Secure Payment, Quality Guarantee, Fast Shipping, Buyer Protection).
- **Delivery Estimate**: Hardcoded client calculation (`Date.now() + 7 days` to `14 days`). Does not take customer country, warehouse location, or shipping tier into account.
- **Social Proof**: "12-46 people viewing this item" uses `Math.random()`. Fake urgency counter.

---

### 2.8 Tabs / Content Sections
- **Structure**: Currently split vertically across stacked cards rather than tabs:
  - Left column: Image gallery, followed by `Specifications` card.
  - Right column: `Product Description` card, Price block, Stock, Quantity, CTAs, `TrustBadgesMini`, Delivery Estimate.
  - Bottom row 1: 3 cards (`Ask a Question`, `Size Guide`, `Return Policy`).
  - Bottom row 2: Blue Customer Support banner.
  - Bottom row 3: Related Products grid.
  - Bottom row 4: 2-column grid (`ReviewSection` and `FAQSection`).
- **Defect**: Very tall page; scrolling down past the images reveals excessive stacked boxes with inconsistent card headers. Modern e-commerce uses clean horizontal Tabs (Description / Specs / Reviews / Q&A / Shipping & FAQ).

---

## PHASE 3 — Data Audit

### 3.1 Field-by-Field Comparison: Database vs. Rendered Page

| Field | DB Value (`10-inch-android-tablet`) | Rendered Value on PDP | Match? | Notes |
|---|---|---|:---:|---|
| **SKU** | `ELEC-004` | `SKU: ELEC-004` | ✅ Yes | Rendered in top category bar. |
| **Name** | `10-Inch Android Tablet` | `10-Inch Android Tablet` | ✅ Yes | Rendered in `PageHero` and product title. |
| **Slug** | `10-inch-android-tablet` | `10-inch-android-tablet` | ✅ Yes | In URL and canonical tag. |
| **Description** | `10-inch Android tablet with HD display, 32GB storage, and 10-hour battery life. Perfect for entertainment and productivity.` | Exact match | ✅ Yes | Rendered in Description card. |
| **Category** | `Electronics` (`electronics`) | `Electronics` | ✅ Yes | Linked in breadcrumbs and category badge. |
| **Retail Price** | `189.99` | `$189.99` | ✅ Yes | Shown in wholesale hybrid comparisons. |
| **CompareAtPrice**| `249.99` | `$249.99` (crossed out) + `Save 24%` | ✅ Yes | Discount percentage calculated accurately. |
| **WholesalePrice**| `139.99` | `$139.99` | ✅ Yes | Rendered as primary price in `WHOLESALE` mode. |
| **Cost Price** | `105.67` | *Hidden* | ✅ Yes | Secure; cost price is never leaked to client. |
| **Images** | `["https://images.unsplash.com/..."]` (1 image) | 1 image displayed | ✅ Yes | Rendered in `ProductImageGallery`. |
| **Videos** | `[]` (empty array) | None | ✅ Yes | No video rendered. |
| **Stock** | `114` | `In Stock (114 units available)` | ✅ Yes | Scarcity badge correctly hidden (>50 units). |
| **Min Order Qty**| `2` | `2 units` | ✅ Yes | MOQ initialized to 2 in wholesale mode. |
| **Weight** | `0.5` kg | `0.5 kg` | ✅ Yes | Shown in Specifications. |
| **Country of Origin**| `China` | `China` | ✅ Yes | Shown in Specifications. |
| **Material** | `Aluminum and Glass` | `Aluminum and Glass` | ✅ Yes | Shown in Specifications. |
| **HS Code** | `8471.30` | `8471.30` | ✅ Yes | Shown in Specifications. |
| **Variants (6)**| 6 active variants in DB | ❌ **0 rendered** | ❌ **Mismatch** | Variants are omitted from props and UI. |
| **Category Attributes**| 8 attributes on category | ⚠️ Partial (0 values in DB) | ⚠️ Missing | Product has no `AttributeValue` rows, so only base fields (weight, HS code, origin, material) display. |
| **Translations**| 0 rows in `ProductTranslation` | Falls back to English on `/ru` and `/zh` | ⚠️ Missing | Database lacks Russian and Chinese rows for this product. |

---

### 3.2 Hardcoded & Mock Data Check

```text
Audit Command: grep -rn "coffee|machine|Philips|LatteGo|Arabica|fake" app/[locale]/products/[slug]/
Result: 0 matches found.
```

- **Mock Coffee Machine**: Confirmed **purged** from active PDP route (`36bc1f1`).
- **Other Hardcoded Elements Discovered**:
  1. `ProductDetailView.tsx:132`: `setViewingCount(Math.floor(Math.random() * 35) + 12)` — Simulated viewer counter.
  2. `ProductDetailView.tsx:934-946`: Women's clothing size chart (`S/M/L/XL`, US 6-8, EU 36-38, UK 8-10) rendered on tablet product page.
  3. `ProductDetailView.tsx:548-552`: Hardcoded 5 filled yellow stars in top action bar regardless of review count.
  4. `ProductDetailView.tsx:868`: Fixed delivery date window (`Date.now() + 7 days` to `14 days`).
  5. `ProductDetailView.tsx:1096-1129`: Static mock FAQ items with generic text.

---

### 3.3 Empty State Handling

| Scenario | Handled? | Current Display | Recommended Behavior |
|---|:---:|---|---|
| **No Images** | ✅ Yes | Displays `/placeholder-product.png` | Clean SVG image placeholder with brand icon. |
| **No Description** | ✅ Yes | Displays localized `t('noDescription')` | Show "No detailed description provided by supplier". |
| **No Reviews** | ✅ Yes | Card with `MessageSquare` icon and `Write First Review` button | Excellent empty state in `ReviewSection.tsx`. |
| **No Related Products** | ✅ Yes | Entire Related Products section unmounts (`relatedProducts.length > 0`) | Gracefully hidden. |
| **Out of Stock** | ✅ Yes | Red `Out of Stock` badge; CTAs disabled | Offer "Backorder" or "Notify When in Stock" inquiry. |
| **No Variants** | ⚠️ Partial | Displays base product | Works for simple products, but breaks products that have variants. |

---

## PHASE 4 — Mode Switching Audit

Testing behavior across the 4 supported store modes:

| Mode | Expected Behavior | Observed Behavior | Status |
|---|---|---|:---:|
| **RETAIL** | Retail price shown ($189.99), "Add to Cart" button visible, MOQ = 1, wholesale price hidden. | Retail price displayed, primary button is "Add to Cart", MOQ defaults to 1. | ✅ Works |
| **WHOLESALE (RFQ)** | Wholesale price ($139.99) primary, "Add to Quote List" button visible, retail "Add to Cart" hidden, MOQ enforced (2). | Wholesale price displayed, primary button is "Add to Quote List", retail cart hidden, MOQ enforced. | ✅ Works |
| **WHOLESALE (INSTANT)**| Wholesale price primary, "Add to Wholesale Cart" button visible with instant checkout, MOQ enforced. | Shows "Add to Quote List". Does NOT check `rfqModel === 'INSTANT'`. Direct wholesale checkout missing. | ❌ Broken |
| **BOTH (Hybrid)** | Both retail and wholesale prices shown in comparison tier. If qty $\ge$ MOQ, user can switch to wholesale inquiry. | Retail & wholesale prices shown. Exceeding MOQ triggers `enableWholesaleSession()`. Both CTAs visible. | ✅ Works |

---

## PHASE 5 — Localization Audit

Testing across `/en`, `/ru`, and `/zh`:

| Check | English (`/en`) | Russian (`/ru`) | Chinese (`/zh`) | Verdict |
|---|---|---|---|:---:|
| **UI Action Buttons** | "Add to Quote List" | "Добавить в список запросов" | "添加到询价单" | ✅ Translated |
| **Section Headings** | "Specifications", "Product Description" | "Технические характеристики", "Описание товара" | "规格参数", "商品描述" | ✅ Translated |
| **Product Name (H1)** | `10-Inch Android Tablet` | `10-Inch Android Tablet` | `10-Inch Android Tablet` | ⚠️ Missing Data (No DB translation) |
| **Product Description** | English text | English text | English text | ⚠️ Missing Data (No DB translation) |
| **Company Brand Name** | `dromkok` | `Глобал Трейд` | `dromkok` | ✅ Dynamic via `getCompanyName(locale)` |
| **Breadcrumbs** | `Products > Electronics > 10-Inch Android Tablet` | `Товары > Электроника > ...` | `产品 > 电子产品 > ...` | ✅ Translated (Category localized) |
| **Category Attributes** | English labels | Localized if `AttributeTranslation` exists | Localized if `AttributeTranslation` exists | ✅ Supported |
| **Meta Title Tag** | `... — dromkok \| dromkok` | `... — Глобал Трейд \| Глобал Трейд` | `... — dromkok \| dromkok` | ⚠️ Double brand suffix |

---

## PHASE 6 — SEO Audit

Target URL: `http://localhost:3001/en/products/10-inch-android-tablet`

- **`<title>` tag**:
  - Raw HTML output: `<title>10-Inch Android Tablet - Premium Quality — dromkok | dromkok</title>`
  - **Defect**: Double brand naming. `generateMetadata` appended `— ${companyName}`, and Next.js `layout.tsx` metadata title template appended `| ${companyName}`.
  - **Fix**: Remove the manual `— ${companyName}` suffix in `page.tsx:generateMetadata` and rely on RootLayout's template, or set `title.absolute`.
- **`<meta name="description">`**:
  - `10-inch Android tablet with HD display, 32GB storage, and 10-hour battery life. Perfect for entertainment and productivity.` (130 chars). Excellent.
- **`<h1>` tag**:
  - Present in SSR HTML inside `PageHero`: `<h1>10-Inch Android Tablet</h1>`.
  - Inside the product buy-box, the name is in a `<div className="text-2xl font-bold">` to avoid duplicate `<h1>`.
  - **Recommendation**: If `PageHero` is removed to align with standard e-commerce PDPs, convert the in-card product title to the primary `<h1>`.
- **Canonical & Hreflang**:
  - Canonical: `<link rel="canonical" href="https://dromkok.com/en/products/10-inch-android-tablet"/>`
  - Hreflang alternates: `en`, `ru`, `zh` all present in `<head>`.
- **JSON-LD Schema (`schema.org/Product`)**:
  - Injected as `<script type="application/ld+json">`.
  - Contains `@context`, `@type: "Product"`, `name`, `sku`, `image`, `description`, and `offers` (`price`, `priceCurrency: "USD"`, `availability: "InStock"`).
  - Valid schema.org syntax.

---

## PHASE 7 — Performance Audit

- **Live Server Response Time (TTFB)**:
  - `/en/products/10-inch-android-tablet`: **550ms** initial cold SSR; subsequent hits **110ms–140ms**.
- **Page Weight (Raw HTML)**:
  - Initial SSR payload: **184.9 KB**.
- **Script Bundles**:
  - Client components: `ProductDetailView.tsx` (54 KB source), `ReviewSection.tsx`, `ProductImageGallery.tsx`.
- **Image Optimization**:
  - `ProductImageGallery.tsx` currently uses standard `<img>` tags for gallery and thumbnails.
  - **Recommendation**: Upgrade to Next.js `<Image>` with `priority` on the main active image (`fetchpriority="high"`), generating automatic WebP/AVIF formats and boosting Core Web Vitals (LCP < 1.2s).

---

## PHASE 8 — Accessibility Audit (WCAG 2.2 AA)

1. **Color Contrast**:
   - ❌ **Severe Failure**: Customer support callout banner has `bg-gradient-to-r from-blue-600 to-blue-700` with `text-gray-900` (`<h3 className="... text-gray-900">{t('needHelp')}</h3>`). Dark gray text on deep blue background yields a contrast ratio of only **1.8:1** (WCAG AA minimum is 4.5:1).
   - ⚠️ **Warning**: Line-through price (`text-gray-400` on white) has contrast ~2.1:1.
   - ⚠️ **Warning**: Toast notification sub-labels (`text-blue-100` on blue-600) have contrast ~2.9:1.
2. **Form Accessibility**:
   - ❌ Quantity `<input>` lacks an `id` matching its `<label>`'s `htmlFor`, and lacks `aria-label="Product quantity"`.
   - ❌ "Ask a Question" textarea has no `<label>` or `aria-label`, only a placeholder.
3. **Keyboard & Focus**:
   - Gallery zoom modal lacks keyboard focus trapping. Tab key navigates behind the backdrop. Pressing `Escape` does not close the lightbox.
4. **ARIA Attributes**:
   - Heart button and Share button include `aria-label`.
   - Quantity decrement/increment buttons lack `aria-label` ("Decrease quantity", "Increase quantity").

---

## PHASE 9 — Mobile Audit (Viewport: 375 × 812 px)

- **Layout Stacking**: The 2-column desktop layout (`grid-cols-1 lg:grid-cols-12`) collapses neatly into a single column. No horizontal overflow detected.
- **Touch Target Deficiencies**:
  - Thumbnail buttons in `ProductImageGallery` are rendered in a 5-column grid (`grid-cols-5 gap-3`). On a 375px screen, each thumbnail measures ~58px wide. Tap targets are acceptable, but spacing is cramped.
- **Missing Mobile Sticky Buy Bar**:
  - When scrolling through lengthy descriptions, specifications, and reviews on mobile, the primary CTA scrolls off-screen.
  - Standard mobile e-commerce pattern (Amazon, AliExpress, Shopify) requires a **Sticky Bottom CTA Bar** (docked at the bottom of the viewport with thumbnail, price, and "Add to Quote / Cart" button).

---

## PHASE 10 — Edge Cases

| Edge Case | Expected Behavior | Observed Result | Status |
|---|---|---|:---:|
| **Stock = 0** | CTAs disabled, "Out of Stock" badge displayed | Badge shows "Out of stock"; buttons disabled. | ✅ Passed |
| **Single Image** | Main image shown, thumbnail row hidden | Thumbnail grid conditionally hidden (`displayImages.length > 1`). | ✅ Passed |
| **Many Images (20+)** | Scrollable thumbnail strip | `grid-cols-5` forces 4 rows of thumbnails, creating large vertical gap. | ⚠️ Needs Fix |
| **Very Long Product Title** | Text wraps without overflowing | Breaks words cleanly; no horizontal spill. | ✅ Passed |
| **Zero Reviews** | Clean empty state with CTA to write review | Displays friendly empty state; rating distribution hidden. | ✅ Passed |
| **Invalid Slug** | Genuine HTTP 404 response | `notFound()` invoked in `page.tsx`; returns status 404. | ✅ Passed |
| **Deleted / Inactive Product**| Genuine HTTP 404 response | Prisma checks `isActive: true`; non-active returns 404. | ✅ Passed |
| **Product with Multiple Variants**| Dropdowns / swatches to pick variant, price updates | Variants ignored; cannot select or purchase variants. | ❌ Failed |

---

## PHASE 11 — Design Proposal for a Standard PDP

To transform this PDP from a basic form into an international, high-converting B2B/B2C product experience (comparable to Amazon, AliExpress, and Shopify Plus), the following 24 standard sections are proposed:

### 11.1 Standard PDP Sections Matrix

| # | Section | Present Today? | Recommendation | Priority | Admin Field Needed? | Schema Change? | API Endpoint Needed? |
|---|---|:---:|---|:---:|:---:|:---:|:---:|
| **1** | **Clean Breadcrumbs** | Trapped in PageHero | Move directly above gallery on white background | **CRITICAL** | No | No | No |
| **2** | **Image & Media Gallery** | Partial (Images only) | Add video player support, Next.js `<Image>`, touch swipe, zoom lens | **HIGH** | Yes (Video URL/Upload) | Existing `videos` or new model | Yes |
| **3** | **Product Title & Brand** | Present | Add brand link & verified manufacturer badge | **HIGH** | Yes (Brand/Supplier link) | No | No |
| **4** | **SKU & HS Code Bar** | Present | Add copy SKU button, barcode/UPC | **LOW** | No | No | No |
| **5** | **Rating Summary** | Static 5★ | Real dynamic average rating + review count click-to-scroll | **HIGH** | No | No | Uses reviews API |
| **6** | **Price & Savings Block** | Present | Tiered wholesale price display + compare-at discount badge | **HIGH** | No | No | No |
| **7** | **Volume / Tiered Pricing Table** | ❌ No | Show quantity break tiers (e.g. 10-99: $139, 100-499: $125, 500+: $110) | **CRITICAL** | Yes (Volume tiers manager) | Yes (`TieredPrice` on Product) | Yes |
| **8** | **Stock Urgency & Warehouse Location** | Partial | Show "In Stock at China Warehouse", real-time low-stock counter | **MEDIUM** | No | No | No |
| **9** | **Variant Selectors (Color/Size/Spec)**| ❌ No | Interactive color swatches, size buttons, price & stock sync | **CRITICAL** | Yes (Variant editor) | Existing `ProductVariant` | Yes |
| **10**| **Quantity Selector & MOQ** | Present | MOQ stepper with visual progress to next volume tier discount | **HIGH** | No | No | No |
| **11**| **Primary Dual CTAs** | Present | Store-mode intelligent buttons (Quote List, Instant Checkout, Sample Request) | **HIGH** | No | No | No |
| **12**| **Trust & Assurance Badges** | Present | Factory inspection badge, secure payment, money-back guarantee | **MEDIUM** | No | No | No |
| **13**| **Shipping & Customs Estimator** | Mocked | Interactive calculator by Country + Port/Zip with ETA & rate | **HIGH** | Yes (Shipping zones) | Yes | Yes |
| **14**| **Accepted Payment Methods** | ❌ No | Icons for TT (Wire), Visa, Mastercard, PayPal, Alipay, LC | **MEDIUM** | No | No | No |
| **15**| **Seller / Supplier Profile Card** | ❌ No | Supplier name, verified gold supplier badge, response rate | **HIGH** | Yes (Supplier relation) | Existing `SupplierProfile` | Yes |
| **16**| **Unified Content Tabs** | Stacked boxes | Tabbed system: Description / Specs / Reviews / Q&A / Shipping | **HIGH** | No | No | No |
| **17**| **Category Attributes Table** | Partial | Formatted key-value technical spec table with search/filter | **HIGH** | No | No | No |
| **18**| **Frequently Bought Together (Bundles)**| ❌ No | Companion accessories with 1-click bundle discount | **MEDIUM** | Yes (Bundle selector) | Yes (`ProductBundle`) | Yes |
| **19**| **Customer Q&A Section** | Dead mock form | Real questions & answers with search and customer submission | **MEDIUM** | Yes (Q&A manager) | Yes (`ProductQuestion`) | Yes |
| **20**| **Product Video Player** | ❌ No | Embedded factory demonstration / product overview video | **HIGH** | Yes (Video URL/File) | Existing `videos` field | Yes |
| **21**| **Dimensions & Packaging Info** | Present | Packaging size, gross weight, pallet/carton quantity (CBM) | **HIGH** | Yes (Carton qty, CBM) | Yes | Yes |
| **22**| **Recently Viewed Products** | ❌ No | Cookie/localStorage tracked carousel of recently viewed items | **MEDIUM** | No | No | No |
| **23**| **Sticky Mobile Action Bar** | ❌ No | Fixed bottom bar on mobile with price, MOQ, and CTA | **HIGH** | No | No | No |
| **24**| **Related / Similar Products** | Present | Sourced from same category; fix wholesale cart bypass | **HIGH** | No | No | No |

---

### 11.2 Key Feature Deep-Dives

#### 1. Volume / Tiered Pricing Table (B2B Standard)
- Professional B2B buyers expect volume discounts displayed prominently above the CTA:
  ```text
  ┌─────────────────────────────────────────────────────────┐
  │ Quantity (Units)   │ Unit Price (USD) │ Savings         │
  ├────────────────────┼──────────────────┼─────────────────┤
  │ 2 – 49 (MOQ)       │ $139.99          │ Base Wholesale  │
  │ 50 – 199           │ $129.99          │ Save 7%         │
  │ 200 – 499          │ $119.99          │ Save 14%        │
  │ 500+               │ $109.99          │ Save 21%        │
  └─────────────────────────────────────────────────────────┘
  ```
- Selecting a quantity in the stepper automatically highlights the active tier and recalculates the line total.

#### 2. Shipping & Lead Time Estimator
- Displays dynamic estimated freight based on product weight (`0.5 kg`) and volume.
- Country selector defaults to user's detected/stored country (e.g. United States, Russia, Saudi Arabia).
- Displays delivery methods: Air Express (5–8 days), Sea Freight (25–35 days), Railway (18–22 days).

#### 3. Real Customer Q&A
- Customers can submit questions about product certification, power plug type, or OEM customization.
- Admin receives notification in Admin Panel, writes an answer, and approves publication.

---

## PHASE 12 — Admin-Side Changes for New Sections

To ensure the admin can manage all new features without leaving the administrative interface, the following schema, UI, and API additions are specified, fully matching the existing admin design language.

### 12.1 Database Schema Additions (`prisma/schema.prisma`)

```prisma
// 1. Product-Level Tiered Pricing (B2B Volume Discounts)
model ProductPriceTier {
  id          String   @id @default(cuid())
  productId   String
  minQuantity Int
  maxQuantity Int?     // null indicates unbounded (e.g. 500+)
  unitPrice   Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@map("product_price_tiers")
}

// 2. Product Video Assets (Factory demos, 360 views)
model ProductVideo {
  id          String   @id @default(cuid())
  productId   String
  title       String?
  videoUrl    String
  thumbnailUrl String?
  provider    String   @default("DIRECT") // DIRECT, YOUTUBE, VIMEO
  displayOrder Int     @default(0)
  createdAt   DateTime @default(now())

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@map("product_videos")
}

// 3. Customer Questions & Answers (Amazon-style Q&A)
model ProductQuestion {
  id          String    @id @default(cuid())
  productId   String
  userId      String?
  authorName  String
  authorEmail String?
  question    String
  answer      String?
  answeredBy  String?
  answeredAt  DateTime?
  isApproved  Boolean   @default(false)
  helpfulCount Int      @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([productId])
  @@index([isApproved])
  @@map("product_questions")
}

// 4. Product Bundles ("Frequently Bought Together")
model ProductBundle {
  id                String   @id @default(cuid())
  productId         String
  bundledProductId  String
  discountPercent   Float    @default(0.0)
  displayOrder      Int      @default(0)
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())

  product           Product  @relation("MainProductBundles", fields: [productId], references: [id], onDelete: Cascade)
  bundledProduct    Product  @relation("BundledProducts", fields: [bundledProductId], references: [id], onDelete: Cascade)

  @@unique([productId, bundledProductId])
  @@map("product_bundles")
}
```

---

### 12.2 Admin UI Additions (`/admin/products/[id]/edit`)

The admin edit page (`app/admin/products/[id]/edit/page.tsx`) already uses a clean card layout with tokens `#1a3a5c` and `#2563eb`, `rounded-3xl` cards, and modular sections. The new features will be added as coherent sections:

#### 1. Volume Pricing Card (Under "Pricing")
```text
┌────────────────────────────────────────────────────────────────────────┐
│ Volume Pricing Tiers (B2B)                            [ + Add Tier ]  │
├────────────────────────────────────────────────────────────────────────┤
│ Min Qty    │ Max Qty    │ Unit Price ($)  │ Discount % │ Actions       │
├────────────┼────────────┼─────────────────┼────────────┼───────────────┤
│ [ 2      ] │ [ 49     ] │ [ $139.99     ] │ Base       │ [ Trash ]     │
│ [ 50     ] │ [ 199    ] │ [ $129.99     ] │ 7.1%       │ [ Trash ]     │
│ [ 200    ] │ [ 499    ] │ [ $119.99     ] │ 14.3%      │ [ Trash ]     │
│ [ 500    ] │ [  +     ] │ [ $109.99     ] │ 21.4%      │ [ Trash ]     │
└────────────────────────────────────────────────────────────────────────┘
```
- **Validation**: `minQuantity` must be strictly greater than previous tier's `maxQuantity`. `unitPrice` must be less than base `wholesalePrice`.

#### 2. Media Card Enhancement (Images & Video)
- Expand existing `ProductMediaUpload.tsx` to support Video URL inputs (YouTube/Vimeo embed or MP4 upload via existing `/api/upload` endpoint).
- Includes inline video preview and drag-and-drop sort order.

#### 3. Variant Management Section
- Add an interactive Variant Matrix table under Dynamic Attributes:
  - Generate combinations from selected options (e.g. Size: 8", 10" × Color: Black, White, Gold = 6 rows).
  - Inline editing for SKU, Price, Stock, and image selector per variant.

#### 4. Customer Q&A Management Card
- Lists pending questions submitted by store visitors.
- Includes textarea for admin answer, "Approve & Publish" button, and "Delete" button.

---

### 12.3 Admin API Endpoints Specification

| Endpoint | Method | Role | Payload / Params | Function |
|---|:---:|:---:|---|---|
| `/api/admin/products/[id]/tiers` | `GET` | Admin | Query `productId` | Fetch all volume pricing tiers |
| `/api/admin/products/[id]/tiers` | `POST` | Admin | `[{ minQuantity, maxQuantity, unitPrice }]` | Bulk replace/save pricing tiers |
| `/api/admin/products/[id]/variants` | `GET` | Admin | Query `productId` | Fetch all product variants |
| `/api/admin/products/[id]/variants` | `PUT` | Admin | `[{ id, sku, price, stock, attributes }]` | Update variant pricing & inventory |
| `/api/admin/products/[id]/questions` | `GET` | Admin | `status=pending\|approved` | Fetch questions for moderation |
| `/api/admin/products/[id]/questions/[qid]` | `PUT` | Admin | `{ answer, isApproved }` | Submit answer and publish question |
| `/api/admin/products/[id]/bundles` | `POST` | Admin | `{ bundledProductId, discountPercent }` | Link a companion bundle product |

---

## PHASE 13 — Prioritized Fix & Implementation Roadmap

```mermaid
flowchart TD
    subgraph Phase A: Critical Fixes
        A1[Fix Variant Gaps & Selection] --> A2[Fix PageHero Banner & Breadcrumbs]
        A2 --> A3[Fix Double Title SEO Bug]
        A3 --> A4[Fix Related Products Wholesale Bypass]
    end
    subgraph Phase B: Design & Functional Alignment
        B1[Unify Design Tokens & Card Radius] --> B2[Implement Real WishlistButton]
        B2 --> B3[Replace Hardcoded Size Guide & Fake Count]
        B3 --> B4[Fix WCAG AA Contrast Failures]
    end
    subgraph Phase C: Standard Enterprise PDP
        C1[Implement Tabbed Content Layout] --> C2[Volume Pricing Schema & UI]
        C2 --> C3[Mobile Sticky Action Bar]
        C3 --> C4[Product Video Player Support]
    end
    subgraph Phase D: Admin Panel Extensions
        D1[Admin Volume Tiers Manager] --> D2[Admin Variant Matrix Editor]
        D2 --> D3[Admin Q&A Moderation Dashboard]
    end

    Phase A --> Phase B
    Phase B --> Phase C
    Phase C --> Phase D
```

### Phase Breakdown

- **Phase A: Critical Bug & Data Fixes (Effort: 6–8h)**
  - Integrate variants into `ProductDetailView.tsx` (swatches, size buttons, price & stock sync).
  - Remove intrusive `PageHero` banner from PDP; place clean breadcrumbs inside page container.
  - Fix double company brand title suffix in `page.tsx:generateMetadata`.
  - Fix related product "Add to Cart" to respect `WHOLESALE` mode and QuoteCart.
  - Wire `WishlistButton` component into PDP top bar.

- **Phase B: Design Consistency & Polish (Effort: 4–6h)**
  - Replace dated gradient sub-card headers with unified, clean cards (`rounded-2xl`, `border-slate-100`).
  - Purge fake client viewer counter and static clothing size chart on non-apparel products.
  - Fix accessibility color contrast in customer support banner (`text-white` on blue-600) and form labels.
  - Upgrade gallery images to Next.js `<Image>` with touch swipe support.

- **Phase C: Enterprise Standard PDP Features (Effort: 8–10h)**
  - Add Volume Pricing table on PDP and connect with quantity stepper.
  - Implement Sticky Mobile Action Bar for smartphones.
  - Add Product Video player in gallery.
  - Convert stacked description/specs/reviews/FAQ into responsive Tabs.

- **Phase D: Admin Panel Upgrades (Effort: 8–10h)**
  - Add Prisma schema migrations for `ProductPriceTier`, `ProductVideo`, `ProductQuestion`.
  - Build Volume Pricing editor card in `/admin/products/[id]/edit`.
  - Build Variant Matrix manager in admin edit page.
  - Build Q&A moderation tab in admin panel.

---

## Master Bug List

| # | Severity | Category | Issue | Evidence | File | Proposed Fix | Effort |
|---|:---:|:---:|---|---|---|---|:---:|
| **B-01** | **CRITICAL** | Functionality | Variants completely ignored; cannot select size or color | `10-inch-android-tablet` has 6 variants in DB, but PDP has 0 variant UI | `app/[locale]/products/[slug]/page.tsx`, `ProductDetailView.tsx` | Pass `variants` to `ProductDetailView`; render interactive option selectors; sync SKU, price, stock, and images | 3h |
| **B-02** | **CRITICAL** | B2B Flow | Related products bypass wholesale mode & MOQ | Line 1048 of `ProductDetailView.tsx` calls retail `/api/cart` with `quantity: 1` | `ProductDetailView.tsx:1041-1075` | Route through `addInquiryItem` and `addToQuote` with effective MOQ when in wholesale mode | 1h |
| **B-03** | **HIGH** | Layout / UX | Intrusive `PageHero` banner pushes product below fold | `SharedLayout` renders dark photo banner with title and breadcrumb above PDP | `ProductDetailView.tsx:304`, `components/layout/SharedLayout.tsx` | Pass `showHero={true}` to `SharedLayout` to suppress banner; render clean breadcrumb inside container | 1h |
| **B-04** | **HIGH** | SEO | Double company brand name in title tag | `<title>10-Inch Android Tablet ... — dromkok \| dromkok</title>` | `app/[locale]/products/[slug]/page.tsx:220` | Remove manual `— ${companyName}` suffix; let RootLayout template format it once | 0.5h |
| **B-05** | **HIGH** | Functionality | Wishlist / Favorite button is an inert placeholder | `handleToggleFavorite` has `// TODO: Implement API call` | `ProductDetailView.tsx:247-250` | Replace custom button with `WishlistButton` from `components/products/WishlistButton.tsx` | 0.5h |
| **B-06** | **HIGH** | Accessibility | Severe contrast failure (1.8:1) on support banner | Dark gray text (`text-gray-900`) on dark blue gradient (`bg-blue-600`) | `ProductDetailView.tsx:997-1006` | Change text classes to `text-white` and `text-blue-100` | 0.5h |
| **B-07** | **MEDIUM** | UX / Data | Non-clothing products render clothing size guide | Hardcoded table with S, M, L, XL clothing sizes appears on tablet page | `ProductDetailView.tsx:913-952` | Conditionally display size guide only for clothing/apparel categories, or support category-specific guide | 1h |
| **B-08** | **MEDIUM** | UX / Data | Simulated viewer counter | Random number generated on client (`Math.random() * 35 + 12`) | `ProductDetailView.tsx:132` | Remove fake counter or connect to real session/analytics endpoint | 0.5h |
| **B-09** | **MEDIUM** | Functionality | "Ask a Question" form has no submit action | Textarea and button have no submit handler or API call | `ProductDetailView.tsx:898-908` | Connect to customer question submission API | 1.5h |
| **B-10** | **MEDIUM** | Functionality | Missing INSTANT wholesale checkout option | When `rfqModel === 'INSTANT'`, button still says "Add to Quote List" | `ProductDetailView.tsx:826` | Check `rfqModel` from `settings`; offer direct wholesale cart checkout if INSTANT | 1.5h |
| **B-11** | **LOW** | Performance | Gallery uses plain `<img>` instead of Next.js `<Image>` | Plain `<img>` tags on lines 30, 84, 113 of `ProductImageGallery.tsx` | `components/products/ProductImageGallery.tsx` | Upgrade to `next/image` with `priority` on main image | 1h |
| **B-12** | **LOW** | Accessibility | Lightbox modal lacks keyboard trap and escape handler | Keydown events not captured; focus escapes behind overlay | `components/products/ProductImageGallery.tsx:99-139` | Add `useEffect` listener for `Escape`, `ArrowLeft`, `ArrowRight`, and `role="dialog"` | 1h |

---

## Master New Features Proposal

| # | Section / Feature | Priority | Admin Field Needed | Schema Change | API Endpoint | Estimated Effort |
|---|---|:---:|---|:---:|---|:---:|
| **F-01** | **Product Variant Matrix** | **CRITICAL** | Variant price, stock, SKU, attributes editor | Existing `ProductVariant` | `/api/admin/products/[id]/variants` | 6h |
| **F-02** | **Volume / Tiered Pricing Table** | **CRITICAL** | Min Qty, Max Qty, Unit Price table | New `ProductPriceTier` | `/api/admin/products/[id]/tiers` | 4h |
| **F-03** | **Responsive Content Tabs** | **HIGH** | None (organizes existing data) | None | Existing PDP query | 3h |
| **F-04** | **Sticky Mobile Buy Bar** | **HIGH** | None (client component) | None | None | 2.5h |
| **F-05** | **Product Video Player** | **HIGH** | Video URL / File uploader | New `ProductVideo` / `videos` | `/api/admin/products/[id]/videos` | 3h |
| **F-06** | **Customer Q&A Engine** | **MEDIUM** | Moderation interface in admin | New `ProductQuestion` | `/api/admin/products/[id]/questions` | 5h |
| **F-07** | **Recently Viewed Carousel** | **MEDIUM** | None (client-side storage) | None | None | 2h |
| **F-08** | **Dynamic Shipping Estimator**| **HIGH** | Shipping rate settings | Existing / New Rate | `/api/shipping/estimate` | 4h |

---

## Open Questions for Approval

1. **PageHero Suppression**: Do you approve removing the top `PageHero` dark photographic banner on the PDP and placing clean, minimal breadcrumbs directly above the product gallery (matching Amazon / Shopify standards)?
2. **Volume Pricing Schema**: Should volume tiers be stored at the `Product` level (recommended for store-wide MOQ discounts) or linked optionally to `ProductVariant`?
3. **Customer Q&A Moderation**: Should customer questions require mandatory admin approval before appearing publicly on the PDP?
4. **Execution Priority**: Would you prefer executing **Phase A (Critical Bug Fixes & Variants)** immediately, or reviewing the proposed tabbed UI layout first?
