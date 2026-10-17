// Editions of MVP Media: Las Vegas. Load this first (before agegate.js and intro.js).
//   xrated - The Underground Cut, the adults-only X-rated edition (this build): 18+ gate, X-rated intro video.
//   pg13   - the PG-13 edition (coming later): no age gate, its own intro video (drop it in assets/video/intro-pg13.mp4 / .webm).
// Pick one with ?edition=pg13 in the URL, or change DEFAULT below for a build.
(function () {
  var DEFAULT = 'xrated';
  var EDITIONS = {
    xrated: { id: 'xrated', label: 'The Underground Cut · X-Rated (18+)', ageGate: true, intro: 'video/intro-xrated.mp4' },
    pg13: { id: 'pg13', label: 'PG-13 Edition', ageGate: false, intro: 'video/intro-pg13.mp4' },
  };
  var q = (location.search.match(/[?&]edition=([a-z0-9]+)/) || [])[1];
  window.MVP_EDITION = EDITIONS[q] || EDITIONS[DEFAULT];
  document.documentElement.dataset.edition = window.MVP_EDITION.id;
})();
