# Image Finder & Legal Sourcing Tool Report

**Date:** 2026-10-04  
**Project:** Yiwu Express / Dromkok Monorepo  
**Module:** Admin Product Image Finder & Copyright Guard (`/admin/tools/image-finder`)  
**Status:** Completed & Tested

---

## 1. Overview & Purpose

The **Image Finder** tool identifies catalog products that either have missing thumbnails or rely on external/hotlinked URLs (e.g. Ikea hotlinks subject to `ERR_CONNECTION_RESET`), and provides a safe, strictly legal interface for administrators to search, review, approve, convert to WebP, and assign images.

### Strict Legal & Safety Rules Enforced
1. **Zero Automated Scraping of Competitors:** The system will **never** automatically scrape or assign competitor images.
2. **Curated Approved Sources:** Sourcing is prioritized from free royalty-free collections (Unsplash, Pexels, Pixabay) and direct uploads from the admin's device.
3. **Competitor & Copyright Guard:** If an external competitor URL (e.g. Ikea, Amazon, AliExpress) is entered, the system flags it as `copyrighted`, displays a prominent warning banner, and strictly disables download until the admin explicitly checks:  
   *"I confirm that I have the legal right or permission to use this image."*
4. **Data & Admin Only:** Zero storefront layouts or product schemas were altered.

---

## 2. Database Schema Changes

Two new models were added to [`prisma/schema.prisma`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/prisma/schema.prisma) and synchronized to PostgreSQL:

### `ImageSearchCandidate`
Stores candidate images retrieved from search queries:
```prisma
model ImageSearchCandidate {
  id          String    @id @default(cuid())
  productId   String
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  source      String    // "unsplash" | "pexels" | "pixabay" | "manual" | "external"
  sourceUrl   String    // the high-res image URL
  thumbnail   String?   // small preview URL
  title       String?   // description from source
  author      String?   // photographer name
  license     String?   // "CC0" | "free" | "unknown" | "copyrighted"

  status      String    @default("PENDING") // PENDING | APPROVED | REJECTED | ASSIGNED

  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime  @default(now())

  @@index([productId])
  @@index([status])
  @@map("image_search_candidates")
}
```

### `ImageSearchLog`
Comprehensive audit log of every search, rejection, approval, and copyright confirmation:
```prisma
model ImageSearchLog {
  id              String    @id @default(cuid())
  productId       String?
  candidateId     String?
  source          String?
  action          String    // "search" | "approve" | "reject" | "upload"
  adminUser       String?
  details         Json?
  confirmedRights Boolean   @default(false)
  createdAt       DateTime  @default(now())

  @@index([productId])
  @@index([action])
  @@map("image_search_logs")
}
```

---

## 3. Implemented API Endpoints

All endpoints require active **ADMIN** role authentication (JWT token via cookie).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/images/search-candidates` | Paginated listing of products needing images with category and text filters, stored candidate images, and catalog stats. |
| `POST` | `/api/admin/images/search` | Queries Unsplash, Pexels, Pixabay, and evaluates custom URLs. Saves candidates as `PENDING`. Rate limited to 100/hr. |
| `POST` | `/api/admin/images/approve` | Downloads approved candidate, converts to WebP with `sharp`, saves to `/uploads/products/` or Cloudflare R2, updates `Product.thumbnail` & `images`, marks candidate `ASSIGNED`. Enforces copyright confirmation. Rate limited to 50/hr. |
| `POST` | `/api/admin/images/reject` | Sets candidate status to `REJECTED`. |
| `POST` | `/api/admin/images/assign-upload` | Directly binds a device-uploaded image file to the product and registers an approved audit log. |

---

## 4. Admin User Interface

### Location in Admin Panel
- **Sidebar Navigation:** **Settings → Image Finder** (`/admin/tools/image-finder`)

### UI Features
1. **Catalog Overview Cards:** Live counter of products needing images, missing thumbnails, hotlinked items, and external API connection indicators.
2. **Filters & Search:** Live text search with 300ms debounce, category selector dropdown, view filter (Missing/External vs No Thumbnail), and pagination controls.
3. **Interactive Search & Review Modal:**
   - Pre-fills search query from cleaned product title.
   - Allows toggling Unsplash, Pexels, and Pixabay.
   - Direct image URL entry with live competitor detection.
   - Responsive thumbnail grid displaying source badges, author names, and license tags.
   - Large image preview with full metadata.
   - Copyright confirmation checkbox required for commercial/competitor URLs.
   - One-click assign to product with real-time feedback.
4. **Device Upload Integration:** Each product row includes a direct **`[ Upload ]`** button to upload files from the local computer.

---

## 5. Automated Verification Results

Automated test executed via [`test_image_finder.js`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/scripts/test_image_finder.js):

```
Admin token generated. Has cookie: true

--- 1. Testing GET /api/admin/images/search-candidates ---
Status: 200
Products returned: 5
Total count in view: 6657
Target product: [NDK-ALL-F4336CFF] Danish Functional LED candle - STRÅLA

--- 2. Testing POST /api/admin/images/search ---
Status: 200
Candidates found: 5
  [1] Source: external, License: copyrighted, Competitor: true, URL: https://www.ikea.com/us/en/images/products/sample-...
  [2] Source: unsplash, License: free, Competitor: false, URL: https://images.unsplash.com/photo-1555041469-a586c...
  [3] Source: unsplash, License: free, Competitor: false, URL: https://images.unsplash.com/photo-1586023492125-27...
  [4] Source: unsplash, License: free, Competitor: false, URL: https://images.unsplash.com/photo-1580481077195-c3...
  [5] Source: unsplash, License: free, Competitor: false, URL: https://images.unsplash.com/photo-1532372320572-cd...

--- 3. Testing Legal Guard on Competitor Image (confirmRights: false) ---
Blocked response status (expect 400): 400
Blocked message: ⚠️ This image may be copyrighted. You are responsible for ensuring you have the right to use it. Please check the confirmation box before downloading.
Requires confirmation flag: true

--- 4. Testing Approval of Legal Candidate Image ---
Candidate to approve: cmusv8ty30005w4a0db6mot1p unsplash
Approve response status: 200
New assigned URL: /uploads/products/prod-F4336CFF-eda9abaed5.webp

=== ALL IMAGE FINDER API TESTS PASSED! ===
```

---

## 6. Commit & Deployment Readiness

All code type-checks cleanly with `npx tsc --noEmit`. The production deploy script [`deploy-production.sh`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/scripts/deploy-production.sh) was updated with `CREATE TABLE IF NOT EXISTS` for both new tables.
