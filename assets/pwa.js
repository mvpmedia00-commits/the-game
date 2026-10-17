// Installable app (PWA): registers the service worker and powers "Install" buttons.
// Load with data-root pointing at the site root (where sw.js lives), e.g. <script src="../assets/pwa.js" data-root="../"></script>.
// window.mvpInstall() shows the browser's install prompt when available; the 'mvp-installable' event fires when it is.
(function () {
  var me = document.currentScript, root = (me && me.getAttribute('data-root')) || './';
  if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', function () { navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch(function () {}); });
  var deferred = null;
  window.mvpCanInstall = false;
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; window.mvpCanInstall = true; dispatchEvent(new Event('mvp-installable')); });
  addEventListener('appinstalled', function () { deferred = null; window.mvpCanInstall = false; dispatchEvent(new Event('mvp-installed')); });
  window.mvpInstall = function () { if (!deferred) return false; deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; window.mvpCanInstall = false; }); return true; };
  window.mvpInstalled = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
})();
