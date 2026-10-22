// Network-first: mereu versiunea nouă când ești online, copie salvată când nu ești.
var V="wh-v1";
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(e){
  var r=e.request;
  if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(function(res){var c=res.clone();caches.open(V).then(function(ch){ch.put(r,c)});return res}).catch(function(){return caches.match(r)}));
});
