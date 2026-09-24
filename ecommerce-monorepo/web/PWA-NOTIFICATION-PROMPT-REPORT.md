# PWA Notification Prompt Implementation Report

## Detection Logic

The detection logic is encapsulated in `hooks/useNotificationStatus.ts`. It cross-references multiple factors before determining if the prompt should be shown (`shouldPrompt = true`):
1. **Installation Status**: Checks if the app is in standalone mode using `window.matchMedia('(display-mode: standalone)').matches` and `navigator.standalone`.
2. **Permission State**: Only triggers if `Notification.permission` is `'default'` or `'denied'`. If `'granted'`, the prompt will never be shown.
3. **Existing Subscription**: Queries the service worker `PushManager` to verify if a valid subscription currently exists.
4. **Snooze Period**: Checks `localStorage` for `notif_prompt_dismissed_at` and `notif_prompt_dismiss_count`. It enforces the incremental snooze rules (7, 14, 30, and 90 days).
5. **Platform Support**: Uses `lib/notificationSupport.ts` to ensure the device actually supports push notifications.

## UI Components Created

- **`components/pwa/PushNotificationPrompt.tsx`**: 
  - A global client component injected into `app/[locale]/layout.tsx`.
  - **First-time prompt (count = 0)**: Displays a rich bottom sheet detailing the benefits of notifications (orders, quotes, deals) with an "Enable Notifications" primary action.
  - **Recurring prompt (count > 0)**: Displays a smaller toast-like banner using a sleek dark theme to avoid aggressive nagging.
  - **Denied Guidance**: If permission is currently `'denied'`, the UI morphs into a troubleshooting screen that provides platform-specific steps (iOS, Android, Desktop) to unblock notifications via the OS/browser settings.

## Platform Handling

Platform capabilities are dynamically assessed in `lib/notificationSupport.ts`:
- **iOS 16.4+ (Standalone)**: Fully supported.
- **iOS (Browser tab) / iOS < 16.4**: Explicitly flagged as unsupported or requiring installation first. The hook surfaces `requiresInstall = true` so the UI won't pester the user in Safari tabs.
- **Android Chrome**: Fully supported in both standalone and browser tab (though the prompt only fires in standalone per requirements).
- **Desktop**: Supported, with partial capability warnings for Desktop Safari.

## Snooze Logic

Snooze intervals are handled gracefully in `useNotificationStatus.ts`:
- 1st dismissal: 7 days
- 2nd dismissal: 14 days
- 3rd dismissal: 30 days
- 4th+ dismissal: 90 days
When dismissed, the hook calculates the expiry date by adding the appropriate MS to the current timestamp and writing it to `localStorage`. If `permission` ever becomes `'granted'`, these keys are wiped.

## Server Check Integration

Created `GET /api/push/status` endpoint:
- Checks the authenticated user's active push subscriptions in the Prisma database (`PushSubscription` model).
- Returns `{ hasSubscription, lastActiveAt, deviceCount }`.
- This ensures consistency if the client clears site data but the server still thinks they are subscribed.

## Service Worker Updates

Modified `public/sw.js`:
- Hooked into the `pushsubscriptionchange` event.
- If the browser auto-rotates or drops the push subscription, the service worker quietly re-subscribes using the old options and POSTs the fresh subscription to `/api/push/subscribe` so the server never loses track.

## Tests & Verification Added (Manual Plan)

Given the browser/OS-level nature of push notifications, testing involves:
1. **Detection Matrix**: Spoofing User-Agents and standalone queries to confirm `shouldPrompt` toggles correctly.
2. **Snooze Matrix**: Manually editing `notif_prompt_dismiss_count` and `notif_prompt_dismissed_at` in DevTools to confirm the bottom sheet upgrades to a toast, and hides during the cooling-off period.
3. **Denied Flow**: Intentionally blocking notifications via the browser address bar lock icon and validating the platform-specific "unblock" steps render perfectly.

## Known Limitations per Platform

- **iOS PWA Deep-linking**: Apple restricts deep-linking directly into an app's specific notification settings page (`app-settings:` often fails or redirects generically). The prompt gracefully falls back to explicit text instructions ("Scroll to find this app").
- **Desktop Safari**: Can occasionally act aggressively with its own silent blocking if the user has ignored previous prompts globally.
- **Service Worker Lifecycle**: Push subscription validation relies on the SW being ready, which introduces a tiny async delay on mount before the prompt renders.

---

**Commit Hash**: The changes have been pushed successfully. Ensure you build and deploy the updated service worker for the `pushsubscriptionchange` listener to take effect globally.
