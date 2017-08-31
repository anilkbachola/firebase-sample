var cacheName = 'smart.v1.0.cache.appshell';
var dataCacheName = 'smart.v1.0.cache.data';
var filesToCache = [
        '/',
  '/index.html',
  '/scripts/about.js',
  '/scripts/auth.js',
  '/scripts/config.js',
  '/scripts/goalmsg.js',
  '/scripts/goals.js',
  '/scripts/addGoals.js',
  '/scripts/help.js',
  '/scripts/main.js',            
  '/scripts/moment.min.js',
  '/scripts/router.js',
  '/scripts/user.js',         
  '/styles/main.css',
  '/styles/chat.css',    
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png'     
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  //console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});

self.addEventListener('push', function(event) {
  var data;
    if(event.data){
        data = event.data.json();
    }else{
        data = {
            title :'You have new message',
            body : 'Click to see the message',
            icon : '/images/icons/icon-128x128.png',
            tag : 'new-message'
        }
    }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      tag: data.tag
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  // Android doesn’t close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});