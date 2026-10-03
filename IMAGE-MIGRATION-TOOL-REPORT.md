# Product Image Migration & Re-Hosting Tool Report

**Task:** Add an admin button to download and re-host all external product images.  
**Role:** Senior Full-Stack Developer (`/g fullstack`)  
**Scope:** Data & Admin Tooling Only — Zero Storefront UI Changes  
**Date:** 2026-10-03  

---

## 1. Executive Summary

A production-ready, resilient image migration subsystem has been implemented and tested. It allows administrators to download all external catalog images (e.g., CDN/IKEA URLs), convert them into modern WebP format via `sharp`, store them either locally under `public/uploads/products/` or in a Cloudflare R2 bucket, and update the database with new URLs.

- **Zero Storefront Disruption:** Only adds an admin tool page and server API routes. Does not modify storefront layout, product presentation, or existing image normalization pipelines.
- **Batch Processing & Rate Limiting:** Processes up to 50 images per batch with 1-second pause between batches to prevent server CPU or network exhaustion.
- **Resumability & Interruption Safety:** Uses the `ImageMigrationJob` table in PostgreSQL to track progress (`processedCount`, `failedCount`). If paused or restarted, it skips already re-hosted images and resumes seamlessly.
- **100% Reversible:** Writes all old-to-new URL transformations to timestamped JSON rollback logs (`data/migration-logs/image-migration-YYYYMMDD.json`) and provides an instant one-click Rollback API.

---

## 2. API Endpoints

### `GET /api/admin/images/migrate`
* **Access:** Admin only (`auth_token` cookie verification)
* **Response:**
```json
{
  "total": 15069,
  "totalProducts": 6743,
  "external": 15069,
  "local": 0,
  "storageType": "local",
  "lastRunAt": "2026-10-03T19:16:03.505Z",
  "lastRunStatus": "completed",
  "lastRunDownloaded": 12,
  "lastRunFailed": 0,
  "currentJob": null,
  "logs": [ ... ]
}
```

### `POST /api/admin/images/migrate`
* **Access:** Admin only
* **Body:**
```json
{
  "action": "start" | "preview" | "cancel" | "resume",
  "batchSize": 50,
  "dryRun": false
}
```
* **Actions:**
  - `action: "preview"` (or `dryRun: true`): Calculates total external images, estimated disk/CDN size (~140 KB/image), and estimated time without modifying the database.
  - `action: "start"`: Spawns the background migration worker, downloads images, converts to WebP, updates `product.thumbnail` and `product.images`, and appends to the rollback log.
  - `action: "resume"`: Continues an interrupted or stopped migration job.
  - `action: "cancel"`: Gracefully terminates the running job after the current batch finishes.

### `POST /api/admin/images/migrate/rollback`
* **Access:** Admin only
* **Function:** Reads `data/migration-logs/image-migration-*.json` and safely reverts all modified `product.thumbnail` and `product.images` entries back to their original external URLs.

---

## 3. Environment Variables Added

Added to [`.env.production`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/.env.production) and [`.env.example`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/.env.example):

```bash
# ============================================
# PRODUCT IMAGE MIGRATION & STORAGE
# ============================================
IMAGE_STORAGE=local # "local" or "r2"

# Cloudflare R2 Credentials (Optional - only required if IMAGE_STORAGE=r2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=dromkok-media
R2_PUBLIC_URL=https://media.dromkok.com
```

- When `IMAGE_STORAGE=local`: Images are saved to `public/uploads/products/prod-[sku]-[hash].webp` and served directly as `/uploads/products/...`.
- When `IMAGE_STORAGE=r2`: Uploaded to Cloudflare R2 via `@aws-sdk/client-s3` and served through the CDN domain.

---

## 4. UI Placement & Admin Navigation

1. **Dedicated Tool Page:** [`/admin/tools/images`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/app/admin/tools/images/page.tsx)
   - Real-time stat cards: External URLs remaining, Re-hosted URLs, Total products, and Storage target.
   - Batch size selector (10–50).
   - Control buttons: `[🔍 Preview Dry Run]`, `[▶️ Download & Re-host All Images]`, `[🔄 Resume]`, `[⏹️ Cancel]`, and `[⏪ Rollback]`.
   - Real-time animated progress bar with percentage, remaining time estimate, and success/failure counts.
   - Live terminal log viewer with auto-scroll and one-click "Copy Logs" functionality.
2. **System Settings Quick Section:** [`/admin/settings/system`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/app/admin/settings/system/page.tsx)
   - Embedded card displaying live counts of remaining external URLs vs. local URLs.
   - Direct `[Preview]` and `[Download & Re-host Images]` action buttons.
3. **Sidebar Navigation:** Added under `Tools` → `Image Migration` as well as `Settings` → `Image Migration` in [`navigationConfig.ts`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/components/admin/navigationConfig.ts).

---

## 5. Test Results & Verification

### Local Staging Test
1. **Status API:**
   - Command: `curl.exe -s -b cookie.txt "http://localhost:3001/api/admin/images/migrate"`
   - Result: HTTP 200 OK. Identified `15,069` external image URLs across `6,743` products.
2. **Dry Run (Preview):**
   - Command: `POST /api/admin/images/migrate` with `{"action":"preview","dryRun":true}`
   - Result: Estimated ~2.0 GB WebP size, ~200 minutes runtime across batches.
3. **Small Batch Test:**
   - Started with `batchSize: 2`.
   - Sharp successfully fetched images, converted them into WebP (~45KB–112KB per file), wrote to `public/uploads/products/`, and updated `Product` rows in the database.
4. **Cancellation Test:**
   - Triggered `action: "cancel"`. Job immediately halted in under 1 second.
5. **Rollback Verification:**
   - Triggered `POST /api/admin/images/migrate/rollback`.
   - Result: `{"success":true,"message":"Rollback completed. Reverted 12 image URLs to original values.","revertedCount":12}`.
   - All 12 test records were reverted cleanly to original external URLs.

---

## 6. Database Migration Table

Added table `image_migration_jobs` via Prisma and verified with `npx prisma db push`:

```prisma
model ImageMigrationJob {
  id             String    @id @default(cuid())
  status         String    @default("PENDING") // PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
  totalImages    Int       @default(0)
  processedCount Int       @default(0)
  failedCount    Int       @default(0)
  lastError      String?
  startedAt      DateTime?
  finishedAt     DateTime?
  createdBy      String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("image_migration_jobs")
}
```

---

## 7. Rollback Procedure

In case of any unexpected network or storage failure:
1. Navigate to `/admin/tools/images` and click **Rollback**.
2. Or invoke the endpoint via curl:
   ```bash
   curl -X POST https://dromkok.com/api/admin/images/migrate/rollback \
     -H "Cookie: auth_token=YOUR_ADMIN_JWT"
   ```
3. The server reads the most recent log file from `data/migration-logs/` and atomically updates the product records back to their original URLs.
