// Temporary script to unregister any stale service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister().then(function(success) {
        console.log('Service Worker unregistered:', success);
      });
    }
  }).catch(function(err) {
    console.log('Service Worker unregistration failed:', err);
  });
}
