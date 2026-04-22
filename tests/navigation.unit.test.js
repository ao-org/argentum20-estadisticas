import { describe, it, expect, beforeEach, vi } from 'vitest';

// Provide a minimal AO20 stub so the module can attach .navigation
globalThis.AO20 = globalThis.AO20 || {};

const navModule = require('../js/navigation.js');
const { navigation } = navModule;

// ── Helpers ─────────────────────────────────────────────────────────────────
function buildDOM(sectionIds) {
  var navItems = sectionIds
    .map(function (id) {
      return '<li><a href="#' + id + '">' + id + '</a></li>';
    })
    .join('');

  var sections = sectionIds
    .map(function (id) {
      return '<section id="' + id + '" style="height:500px;">' + id + '</section>';
    })
    .join('');

  document.body.innerHTML =
    '<div class="section-nav"><ul class="menu menu-horizontal">' +
    navItems +
    '</ul></div>' +
    '<main>' +
    sections +
    '</main>';
}

var SECTION_IDS = [
  'section-general',
  'section-personajes',
  'section-combate',
  'section-economia',
  'section-rankings',
  'section-comunidad'
];

// ── Tests ───────────────────────────────────────────────────────────────────
describe('AO20.navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('is defined with an init function', () => {
    expect(navigation).toBeDefined();
    expect(typeof navigation.init).toBe('function');
  });

  it('does nothing when .section-nav is missing', () => {
    document.body.innerHTML = '<main></main>';
    expect(() => navigation.init()).not.toThrow();
  });

  it('does nothing when nav has no anchor links', () => {
    document.body.innerHTML = '<div class="section-nav"><ul></ul></div>';
    expect(() => navigation.init()).not.toThrow();
  });

  it('attaches click handlers that call scrollIntoView with smooth behavior', () => {
    buildDOM(SECTION_IDS);
    navigation.init();

    var target = document.getElementById('section-combate');
    target.scrollIntoView = vi.fn();

    var link = document.querySelector('a[href="#section-combate"]');
    link.click();

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('click handler prevents default anchor jump', () => {
    buildDOM(SECTION_IDS);
    navigation.init();

    var link = document.querySelector('a[href="#section-general"]');
    var target = document.getElementById('section-general');
    target.scrollIntoView = vi.fn();

    var prevented = false;
    link.addEventListener('click', function (e) {
      if (e.defaultPrevented) prevented = true;
    });
    link.click();

    expect(prevented).toBe(true);
  });

  it('click handler does nothing for href="#"', () => {
    document.body.innerHTML =
      '<div class="section-nav"><a href="#">Empty</a></div>';
    navigation.init();

    var link = document.querySelector('a[href="#"]');
    expect(() => link.click()).not.toThrow();
  });
});

describe('AO20.navigation — IntersectionObserver scroll spy', () => {
  var observedElements;
  var observerCallback;

  beforeEach(() => {
    document.body.innerHTML = '';
    observedElements = [];

    // Mock IntersectionObserver
    globalThis.IntersectionObserver = vi.fn(function (callback, options) {
      observerCallback = callback;
      this.options = options;
      this.observe = vi.fn(function (el) {
        observedElements.push(el);
      });
      this.disconnect = vi.fn();
    });
  });

  it('creates an IntersectionObserver with correct rootMargin', () => {
    buildDOM(SECTION_IDS);
    navigation.init();

    expect(IntersectionObserver).toHaveBeenCalledTimes(1);
    var options = IntersectionObserver.mock.calls[0][1];
    expect(options.rootMargin).toBe('-20% 0px -70% 0px');
  });

  it('observes all 6 sections', () => {
    buildDOM(SECTION_IDS);
    navigation.init();

    expect(observedElements).toHaveLength(6);
    SECTION_IDS.forEach(function (id) {
      var section = document.getElementById(id);
      expect(observedElements).toContain(section);
    });
  });

  it('adds active class to the intersecting section link', () => {
    buildDOM(SECTION_IDS);
    navigation.init();

    var section = document.getElementById('section-economia');
    observerCallback([{ target: section, isIntersecting: true }]);

    var link = document.querySelector('a[href="#section-economia"]');
    expect(link.classList.contains('active')).toBe(true);
  });

  it('removes active class from non-intersecting section links', () => {
    buildDOM(SECTION_IDS);
    navigation.init();

    // First activate general
    var generalSection = document.getElementById('section-general');
    observerCallback([{ target: generalSection, isIntersecting: true }]);

    var generalLink = document.querySelector('a[href="#section-general"]');
    expect(generalLink.classList.contains('active')).toBe(true);

    // Now activate combate — general should lose active
    var combateSection = document.getElementById('section-combate');
    observerCallback([{ target: combateSection, isIntersecting: true }]);

    expect(generalLink.classList.contains('active')).toBe(false);
    var combateLink = document.querySelector('a[href="#section-combate"]');
    expect(combateLink.classList.contains('active')).toBe(true);
  });

  it('ignores entries where isIntersecting is false', () => {
    buildDOM(SECTION_IDS);
    navigation.init();

    var section = document.getElementById('section-rankings');
    observerCallback([{ target: section, isIntersecting: false }]);

    var link = document.querySelector('a[href="#section-rankings"]');
    expect(link.classList.contains('active')).toBe(false);
  });

  it('gracefully degrades when IntersectionObserver is undefined', () => {
    delete globalThis.IntersectionObserver;
    buildDOM(SECTION_IDS);

    // Should not throw — links still work as anchors
    expect(() => navigation.init()).not.toThrow();

    // Smooth scroll click handlers should still be attached
    var target = document.getElementById('section-personajes');
    target.scrollIntoView = vi.fn();
    var link = document.querySelector('a[href="#section-personajes"]');
    link.click();
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
