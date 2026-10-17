// 18+ age gate for The Underground Cut. Plain script (load it in <head>, before the game).
// Sets window.mvpAgeOk once the player confirms; the game waits for it. Remembered on this device.
(function () {
  var KEY = 'mvp_age_ok';
  try { if (localStorage.getItem(KEY) === '1') { window.mvpAgeOk = true; return; } } catch (e) {}
  window.mvpAgeOk = false;
  function show() {
    var d = document.createElement('div');
    d.id = 'agegate'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'agegate-h');
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:radial-gradient(ellipse at 50% 40%,#2a0710,#07040a 75%);color:#f6f1eb;font:16px/1.55 Montserrat,system-ui,sans-serif;text-align:center';
    d.innerHTML = '<div style="max-width:440px">' +
      '<div style="font:700 12px/1 Montserrat,system-ui,sans-serif;letter-spacing:.3em;color:#f03d49;margin-bottom:14px">ADULTS ONLY · 18+</div>' +
      '<h1 id="agegate-h" style="font:900 28px/1.15 Cinzel,Georgia,serif;margin:0 0 14px">MVP Media: Las Vegas<br><span style="font-size:18px;color:#e6bd79">The Underground Cut</span></h1>' +
      '<p style="margin:0 0 10px">This game is for adults. It is set in the Las Vegas nightlife and adult-film business, with strong language, crime and violence.</p>' +
      '<p style="margin:0 0 20px;color:#b1a8ae;font-size:14px">No nudity or sex scenes. Every character is an adult.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
      '<button id="agegate-yes" style="padding:12px 22px;border-radius:999px;border:0;background:#f03d49;color:#fff;font:700 14px Montserrat,system-ui,sans-serif;cursor:pointer">I\'m 18 or older</button>' +
      '<button id="agegate-no" style="padding:12px 22px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#f6f1eb;font:700 14px Montserrat,system-ui,sans-serif;cursor:pointer">I\'m under 18</button></div></div>';
    document.body.appendChild(d);
    document.getElementById('agegate-yes').focus();
    document.getElementById('agegate-yes').onclick = function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} window.mvpAgeOk = true; d.remove(); };
    document.getElementById('agegate-no').onclick = function () { d.firstChild.innerHTML = '<h1 style="font:900 24px Cinzel,Georgia,serif">Sorry, this game is for adults only.</h1><p style="color:#b1a8ae">Come back when you\'re 18.</p>'; };
  }
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
