// Custom service worker push & notification event handlers for next-pwa
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Notification';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      image: data.image || undefined,
      badge: data.badge || '/icons/icon-96x96.png',
      tag: data.tag || `gt-push-${Date.now()}`,
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Error parsing push data:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';
  const deliveryId = data.deliveryId;
  const notificationId = data.notificationId;

  // Track click timestamp
  const trackPromise = (deliveryId || notificationId)
    ? fetch('/api/push/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          notificationId,
          action: event.action || 'click',
        }),
      }).catch((e) => console.warn('[SW] Click tracking failed:', e))
    : Promise.resolve();

  // Navigate or open client
  const navigationPromise = clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url && client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    });

  event.waitUntil(Promise.all([trackPromise, navigationPromise]));
});
