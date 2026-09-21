# Web Push Notification System — Admin Management & Broadcast Engine

## 1. Executive Summary

A complete, standards-compliant Web Push Notification system has been implemented and integrated into the YIWU EXPRESS / Global Trade platform. The system empowers administrators to compose, target, simulate, broadcast, and schedule real-time push messages to active customer devices (desktop, Android, and iOS PWA) while tracking delivery and click-through engagement.

All changes adhere to cross-platform standards (Linux/Ubuntu production runtime with LF endings, Windows local dev host, dynamic company branding via `getCompanyName()`).

---

## 2. Prerequisites Verification & Resolutions (Phase 1)

During initial discovery, the following prerequisites were audited and resolved:

| Component | Initial Status | Action Taken |
|---|---|---|
| **`web-push` npm package** | Missing | Installed `web-push@3.6.7` and `@types/web-push@3.6.4` |
| **VAPID Keys** | Missing | Generated cryptographic VAPID keypair (`BKqjHu...` / `v_Php...`) and configured in `.env` |
| **Prisma Models** | Missing | Added `PushSubscription`, `PushNotification`, and `PushDelivery` with relational mapping to `User` |
| **Service Worker** | Inactive (`unregister-sw.js`) | Created `public/sw.js` and `worker/index.js` with `push` and `notificationclick` handlers |
| **Storefront Subscription** | Missing | Built `usePushSubscription` hook and `PushNotificationPrompt` opt-in UI component |
| **Click Tracking** | Missing | Implemented `/api/push/track-click` beacon receiver |

---

## 3. Data Model Architecture (`prisma/schema.prisma`)

Three relational models were added to PostgreSQL via Prisma:

### `PushSubscription` (`push_subscriptions`)
- `id`: Unique identifier (CUID)
- `endpoint`: Browser push service endpoint (Unique)
- `p256dh`, `auth`: Client cryptographic public keys
- `userId`: Optional relation to registered `User` (onDelete: SetNull)
- `deviceType`: Device category (`desktop`, `mobile`, `tablet`)
- `os`: Operating system (`windows`, `macos`, `android`, `ios`, `linux`)
- `browser`: User browser (`chrome`, `safari`, `firefox`, `edge`)
- `language`, `country`: Subscriber locale metadata
- `isActive`: Boolean flag (`true` when active, automatically set to `false` on HTTP 410/404 Gone)
- `lastSeenAt`, `createdAt`, `updatedAt`: Timestamps

### `PushNotification` (`push_notifications`)
- `id`: Notification ID (CUID)
- `title`: Subject line (validated ≤ 60 characters)
- `body`: Message text (validated ≤ 180 characters)
- `iconUrl`, `imageUrl`: Media assets (app icon and rich banner)
- `actionUrl`: Destination path (e.g. `/store`, `/quote-cart`, `/orders`)
- `actionLabel`: Action button label (e.g. "Shop Now", "View Deal")
- `segment`: Target segment (`ALL`, `ACTIVE_30D`, `BUYERS`, `INACTIVE`, `SINGLE_USER`)
- `targetUserId`: Specific customer ID when targeting a single user
- `status`: Lifecycle status (`DRAFT`, `SCHEDULED`, `SENDING`, `SENT`, `FAILED`, `CANCELLED`)
- `scheduledFor`, `sentAt`: Scheduling and dispatch timestamps
- `totalTargets`, `totalSent`, `totalFailed`, `totalClicked`: Aggregate metrics
- `createdBy`: Admin name / email

### `PushDelivery` (`push_deliveries`)
- `id`: Delivery record ID (CUID)
- `notificationId`: Relation to `PushNotification` (Cascade delete)
- `subscriptionId`: Relation to `PushSubscription` (Cascade delete)
- `status`: Individual delivery state (`PENDING`, `SENT`, `FAILED`, `CLICKED`)
- `errorMessage`: Diagnostic error string if rejected by push service
- `sentAt`, `clickedAt`: Precision interaction timestamps

---

## 4. Core Push Library (`lib/push.ts`)

- **Lazy VAPID Configuration**: Configures `webpush.setVapidDetails` safely with fallback subject `mailto:support@dromkok.com`.
- **Automatic Dead Subscription Pruning**: When push gateways return HTTP `410 Gone` or `404 Not Found`, the subscription's `isActive` flag is immediately set to `false`, preventing wasted compute and quota on dead tokens.
- **Segment Resolver (`resolveSegmentAudience`)**:
  - `ALL`: All active subscriptions.
  - `ACTIVE_30D`: Active subscriptions with `lastSeenAt ≥ 30 days ago`.
  - `BUYERS`: Subscriptions linked to customers with completed orders.
  - `INACTIVE`: Re-engagement audience inactive for > 30 days.
  - `SINGLE_USER`: Subscriptions linked specifically to `targetUserId`.
- **Chunked Concurrency Dispatcher (`dispatchNotification`)**: Dispatches push payloads in batches of 25 to optimize throughput without saturating network connections.

---

## 5. API Endpoints

### Storefront & Public Routes
- `GET /api/push/public-key`: Exposes the public VAPID key to frontend clients.
- `POST /api/push/subscribe`: Upserts subscription endpoint, stores encryption keys, device info, and associates with logged-in user.
- `POST /api/push/unsubscribe`: Sets `isActive: false` on customer opt-out.
- `POST /api/push/track-click`: Called by Service Worker upon notification click to record timestamp and increment `totalClicked`.

### Admin Routes (`requireRole(req, ['ADMIN'])`)
- `GET /api/admin/push/stats`: Aggregate dashboard stats (total subscribers, active %, 30-day sent volume, CTR, device breakdown).
- `GET /api/admin/push/subscribers/count`: Dynamic live audience count based on chosen segment.
- `GET /api/admin/push/history`: Paginated history table with status, search query, and date filtering.
- `GET /api/admin/push/[id]`: Detail view of campaign with delivery logs and error diagnostics.
- `DELETE /api/admin/push/[id]`: Deletes notification records.
- `POST /api/admin/push/[id]/cancel`: Cancels scheduled campaigns.
- `POST /api/admin/push/send`: Broadcasts notification immediately (with rate limiting: max 10 blasts/hour).
- `POST /api/admin/push/schedule`: Queues a future notification blast with ISO date validation.
- `POST /api/admin/push/test`: Fires an instant preview notification to the current admin's device without alerting subscribers.

### Automation / Cron
- `POST /api/cron/send-scheduled`: Endpoint for automated dispatch of queued notifications (supports `Authorization: Bearer <CRON_SECRET>`).

---

## 6. Admin Panel UI & Experience

### 1. Navigation Integration
- Added **Push Notifications** (`/admin/notifications`) to the admin sidebar under the **Website** section with a `Bell` icon.
- Full trilingual support configured for English, Russian, and Chinese.

### 2. Dashboard (`/admin/notifications`)
- Four primary KPI cards:
  - **Total Subscribers** (with active subscriber percentage badge).
  - **Active Devices** (breakdown across Desktop, Mobile, and Tablet).
  - **Sent (Last 30 Days)** (with total delivery counter).
  - **Avg Click-Through Rate (CTR %)** (with aggregate click counts).
- Quick action button: **Compose Notification**.
- Full campaign history table:
  - Title, body excerpt, image preview thumbnail, destination URL link.
  - Target audience segment badge.
  - Color-coded status badge (`Sent`, `Scheduled`, `Sending`, `Cancelled`, `Failed`).
  - Delivered vs Target counts and failures.
  - CTR percentage and raw click counts.
  - Contextual actions: View analytics, Cancel scheduled, Delete.

### 3. Notification Composer (`/admin/notifications/new`)
- **Two-column responsive layout**:
  - **Left Column (Form Controls)**:
    - **Title input**: Enforces standard 60-character ceiling with real-time character counter (`X / 60`) and color-coded alert.
    - **Body textarea**: Enforces 180-character limit with real-time character counter (`X / 180`).
    - **Destination URL**: Target path validation with quick shortcuts (`/store`, `/quote-cart`, `/orders`).
    - **Action Button Label**: Optional call-to-action button text.
    - **Media URLs**: App icon selector (defaults to company logo) and rich banner image URL.
    - **Audience Targeting**: Radio cards for All Subscribers, Active 30 Days, Verified Buyers, Re-engagement, or Single User with **live subscriber count badge**.
    - **Delivery Timing**: Send Immediately vs. Schedule for Later (with date-time picker).
  - **Right Column (Interactive Multi-Device Live Mockup)**:
    - Tab switcher: **Android**, **iOS**, and **Desktop**.
    - **Android Mockup**: Emulates Material You notification card in the system tray with app icon, company name, timestamp, rich image thumbnail, and action button.
    - **iOS Mockup**: Emulates iOS Dynamic Island notch and Lock Screen notification banner with frosted glass effect.
    - **Desktop Mockup**: Emulates Windows 11 / macOS Google Chrome desktop toast notification.
- **Safety Confirmation Modal**:
  - Summarizes title, audience segment, recipient count, delivery timing, and target destination URL before broadcasting.

### 4. Campaign Analytics & Audit Detail (`/admin/notifications/[id]`)
- Delivery funnel breakdown: Total Targets → Delivered → Failed → Verified Clicks.
- Full sample delivery log table showing recipient names, device OS, browser, sent timestamp, and click timestamp.
- Failure diagnostic messages for debugging expired push subscription tokens.

---

## 7. Verification & Quality Assurance

### Automated Testing Suite
- **API & Backend Integration (`__tests__/admin/push-notifications.test.ts`)**:
  - Public VAPID key delivery: **PASS**
  - Subscription registration & deduplication: **PASS**
  - Unsubscribe flag toggling: **PASS**
  - Audience segment resolution (`ALL`, `SINGLE_USER`): **PASS**
  - Admin authorization guards (401 unauthenticated, 403 non-admin): **PASS**
  - Input length validation (rejects title > 60 chars, body > 180 chars): **PASS**
  - Scheduled notification creation & cancellation lifecycle: **PASS**
  - Click tracking and delivery status updating: **PASS**
- **Admin UI & Frontend Testing (`__tests__/admin/push-notifications-ui.test.tsx`)**:
  - Dashboard header, stat cards, and history table rendering: **PASS**
  - Search filter functionality: **PASS**
  - Composer input binding and character counters: **PASS**
  - Multi-device preview switching (Android, iOS, Desktop): **PASS**
  - Send confirmation modal: **PASS**
  - Storefront opt-in prompt component: **PASS**

### Global Test Suite Run
- **Total test files**: 70 passed (70)
- **Total tests**: 296 passed (296)
- **TypeScript compilation**: `npx tsc --noEmit` exited with code 0 (0 errors).
