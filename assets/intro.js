// Intro video while the game loads. Plain script: load it after agegate.js with data-src="<path to intro.mp4>".
// Plays once per page load and covers the loading screen. Skip with any key, a tap or the Skip button.
// The game waits while window.mvpIntroPlaying is true, and world/index.html only starts building the city once
// window.mvpIntroDone resolves (the modules download in the background meanwhile).
(function () {
  var me = document.currentScript, src = me && me.getAttribute('data-src');
  if (!src) return;
  var resolveDone; window.mvpIntroDone = new Promise(function (r) { resolveDone = r; }); // the page starts the game when this resolves
  window.mvpIntroPlaying = true;
  function start() {
    var wrap = document.createElement('div'), v = document.createElement('video'), skip = document.createElement('button'), snd = document.createElement('button');
    wrap.id = 'intro';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#000;display:grid;place-items:center;transition:opacity .5s';
    var webm = src.replace(/\.mp4$/, '.webm'); // browsers without H.264 (some Chromium builds) get the WebM copy
    v.src = v.canPlayType('video/mp4; codecs="avc1.640028, mp4a.40.2"') ? src : webm; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
    v.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
    var btn = 'position:absolute;bottom:calc(20px + env(safe-area-inset-bottom,0px));padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(10,6,8,.6);color:#f6f1eb;font:700 12px Montserrat,system-ui,sans-serif;letter-spacing:.14em;cursor:pointer';
    skip.textContent = 'SKIP ›'; skip.style.cssText = btn + ';right:max(20px,env(safe-area-inset-right,0px))';
    snd.textContent = '🔊 TAP FOR SOUND'; snd.style.cssText = btn + ';left:max(20px,env(safe-area-inset-left,0px));display:none';
    wrap.append(v, skip, snd); document.body.appendChild(wrap);
    var done = false;
    function finish() {
      if (done) return; done = true; window.mvpIntroPlaying = false; resolveDone();
      removeEventListener('keydown', onKey, true); wrap.style.opacity = '0';
      setTimeout(function () { v.pause(); wrap.remove(); }, 520);
    }
    function onKey(e) { e.preventDefault(); e.stopPropagation(); finish(); }
    addEventListener('keydown', onKey, true);
    skip.onclick = function (e) { e.stopPropagation(); finish(); };
    snd.onclick = function (e) { e.stopPropagation(); v.muted = false; snd.style.display = 'none'; };
    wrap.onclick = finish;
    v.onended = finish; v.onerror = finish;
    // with sound if the browser allows it (it does right after the 18+ tap), otherwise muted with a sound button
    v.muted = false;
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.muted = true; snd.style.display = ''; v.play().catch(finish); });
    setTimeout(function () { if (v.readyState < 2) finish(); }, 8000); // couldn't load: don't block the game
  }
  function go() { if (window.mvpAgeOk === false) addEventListener('mvp-age-ok', start, { once: true }); else start(); }
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
