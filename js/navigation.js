/**
 * js/navigation.js — Section navigation scroll spy and smooth scrolling.
 *
 * Depends on: js/config.js (AO20 namespace)
 */
var AO20 = AO20 || {};

AO20.navigation = {
  /**
   * Initialise section navigation: scroll spy via IntersectionObserver
   * and smooth-scroll click handlers on nav links.
   *
   * Graceful degradation: when IntersectionObserver is unavailable the
   * nav links still work as standard anchor links — only the active-state
   * highlighting is lost.
   */
  init: function () {
    var navContainer = document.querySelector('.section-nav');
    if (!navContainer) return;

    var navLinks = navContainer.querySelectorAll('a[href^="#"]');
    if (!navLinks.length) return;

    // ── Smooth-scroll click handlers ────────────────────────────────────
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // ── Scroll spy via IntersectionObserver ──────────────────────────────
    if (typeof IntersectionObserver === 'undefined') return;

    var sectionIds = [];
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        sectionIds.push(href.substring(1));
      }
    });

    var sections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (!sections.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            navLinks.forEach(function (link) {
              if (link.getAttribute('href') === '#' + id) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }
};

// ── Export for testing ─────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AO20;
}
