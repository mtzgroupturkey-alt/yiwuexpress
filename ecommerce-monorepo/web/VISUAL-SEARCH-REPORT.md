# Visual Search Implementation Report (Option A — AI Vision)

## Overview & Architecture

Visual search has been added to the storefront search bar across desktop, mobile web, and PWA modes.

### Key Pipeline Stages
1. **User Input / Capture**:
   - Desktop: Drag-and-drop zone, file explorer trigger, and direct image URL paste.
   - Mobile / PWA: Native camera capture (`capture="environment"`) and device photo gallery selector.
   - File limits: JPEG, PNG, WebP format validation and 5MB size limit.
2. **In-Memory Image Preprocessing**:
   - Normalized using `sharp` to a maximum resolution of `1024×1024` (preserving aspect ratio) and encoded to standard JPEG in-memory.
   - EXIF auto-rotation handled via `.rotate()`.
3. **Privacy & Hashing**:
   - Uploaded files are **never written to disk** or stored in permanent buckets.
   - A SHA-256 hash of the processed image buffer is computed for query logging and short-term 5-minute memory caching.
   - Client IP addresses are hashed for privacy.
4. **AI Vision Recognition**:
   - Provider Priority: **Z.ai GLM-4.6v-Flash** (free vision model) with fallback to **OpenRouter** (`gemini-2.0-flash`, `llama-3.2-11b-vision`, `qwen-2.5-vl-72b`) and custom **OpenAI-compatible** gateways.
   - Structured JSON response extracted: `{ category, keywords, colors, materials, style, confidence }`.
5. **Database Catalog Search & Scoring**:
   - Catalog queries match products by detected keywords, categories, and materials.
   - Weighted visual similarity scores computed and normalized to `70% – 98%` match accuracy.
   - Results logged to the new `visual_search_logs` table.
6. **Storefront User Interface**:
   - 📷 Camera buttons with accessible tap targets (≥ 44px on mobile) integrated inside the desktop search bar and mobile header.
   - `VisualSearchModal` displays visual scanning progress animation, source image thumbnail, category chips, match % badges on product cards, and a fallback text-search button.
   - Fully localized across English (`en`), Russian (`ru`), and Chinese (`zh`).

---

## File Changes Summary

| File | Change Description |
|---|---|
| [`prisma/schema.prisma`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/prisma/schema.prisma) | Added `VisualSearchLog` model mapped to `visual_search_logs` table. Synced to database with `prisma db push`. |
| [`app/api/products/search/image/route.ts`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/app/api/products/search/image/route.ts) | Created POST route handling multipart/json uploads, rate-limiting (10 req/min/IP), sharp resizing, vision AI routing, similarity ranking, and logging. |
| [`components/search/VisualSearchModal.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/components/search/VisualSearchModal.tsx) | Created modal component supporting drag & drop, camera capture, URL pasting, preview thumbnails, similarity badges, and fallback searches. |
| [`app/[locale]/design-3/components/Header.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/app/[locale]/design-3/components/Header.tsx) | Added camera trigger button into desktop global search bar and collapsible search bar; integrated `VisualSearchModal`. |
| [`components/mobile/MobileHeader.tsx`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/components/mobile/MobileHeader.tsx) | Added camera button into mobile search row; integrated `VisualSearchModal`. |
| [`messages/en.json`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/messages/en.json), [`messages/ru.json`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/messages/ru.json), [`messages/zh.json`](file:///c:/xampp/htdocs/yiwuexpress/ecommerce-monorepo/web/messages/zh.json) | Added `VisualSearch` translation keys. |

---

## Verification Proof
- Tested `POST /api/products/search/image` with live base64 image payload: returned HTTP 200 with structured vision attributes and ranked catalog products.
- Database audit record logged successfully to `visual_search_logs`.
- All visual search files type-check with zero errors.
