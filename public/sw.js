self.addEventListener('push', (event) => {
  if (!event.data) return;
  const { title, body } = event.data.json();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Если есть хоть одно сфокусированное окно приложения — не показываем уведомление
      const hasFocusedWindow = clientList.some((client) => client.focused);
      if (hasFocusedWindow) return;

      return self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/profile');
    })
  );
});
