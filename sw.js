const CACHE_NAME = 'dispenza-v1';
const urlsToCache = ['./index.html', './manifest.json'];

// Instalar SW e cachear arquivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Servir do cache quando offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// Receber notificação push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Ritual Dispenza';
  const options = {
    body: data.body || 'Hora de checar sua frequência.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: './' },
    actions: [{ action: 'open', title: 'Abrir Ritual' }]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clique na notificação abre o app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('./');
    })
  );
});

// Alarmes locais agendados via postMessage
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleDaily();
  }
});

function scheduleDaily() {
  const notifications = [
    { hour: 7,  minute: 0,  title: '🌅 Ritual Matinal',        body: 'Comece com a emoção final. Sinta como já é ter o que deseja.' },
    { hour: 12, minute: 0,  title: '☀️ Checar Frequência',      body: 'Pausa. Você está na carência ou na gratidão agora?' },
    { hour: 17, minute: 0,  title: '🌇 Alinhar e Agir',         body: 'Uma ação hoje que seja coerente com quem você está se tornando.' },
    { hour: 21, minute: 0,  title: '🌙 Reflexão Noturna',       body: 'Onde o eu do passado apareceu hoje? E como você respondeu?' },
  ];

  notifications.forEach(n => {
    const now = new Date();
    const target = new Date();
    target.setHours(n.hour, n.minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target - now;

    setTimeout(() => {
      self.registration.showNotification(n.title, {
        body: n.body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        tag: `dispenza-${n.hour}`,
        renotify: true
      });
      // Reagendar para o próximo dia
      setInterval(() => {
        self.registration.showNotification(n.title, {
          body: n.body,
          icon: './icon-192.png',
          vibrate: [200, 100, 200],
          tag: `dispenza-${n.hour}`,
          renotify: true
        });
      }, 24 * 60 * 60 * 1000);
    }, delay);
  });
}
