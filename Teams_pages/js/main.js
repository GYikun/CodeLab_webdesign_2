/* CodeLab — shared site behaviour and i18n
   Each page calls initSite(pageTranslations) with its own EN/NL content;
   this file supplies the common nav/footer strings and all the
   interactive wiring (mobile nav, scroll reveal, language switch, etc). */
(function (global) {
  'use strict';

  var commonTranslations = {
    en: {
      brandSub: "Leiden University",
      navHome: "Home",
      navMethods: "Discoveries",
      navQuestions: "Research",
      navPartners: "Partners",
      navTeam: "Team",
      navResources: "Resources",
      navJoin: "Join a Study",
      footerNote: "CODELAB, Leiden University. Wassenaarseweg 52, Leiden.",
      navOpenMenu: "Open menu",
      navCloseMenu: "Close menu",
      dataLoadError: "Content could not be loaded."
    },
    nl: {
      brandSub: "Universiteit Leiden",
      navHome: "Home",
      navMethods: "Bevindingen",
      navQuestions: "Onderzoek",
      navPartners: "Partners",
      navTeam: "Team",
      navResources: "Bronnen",
      navJoin: "Doe mee aan onderzoek",
      footerNote: "CODELAB, Universiteit Leiden. Wassenaarseweg 52, Leiden.",
      navOpenMenu: "Menu openen",
      navCloseMenu: "Menu sluiten",
      dataLoadError: "De inhoud kon niet worden geladen."
    }
  };

  function initSite(pageTranslations) {
    pageTranslations = pageTranslations || { en: {}, nl: {} };
    var translations = {
      en: Object.assign({}, commonTranslations.en, pageTranslations.en),
      nl: Object.assign({}, commonTranslations.nl, pageTranslations.nl)
    };

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var currentLang = 'en';
    try { currentLang = localStorage.getItem('codelab-lang') || 'en'; } catch (e) {}
    if (!translations[currentLang]) currentLang = 'en';

    function applyLanguage(lang) {
      if (!translations[lang]) return;
      currentLang = lang;
      document.documentElement.lang = lang;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        var value = translations[lang][key];
        if (value != null) el.innerHTML = value;
      });
      document.querySelectorAll('.lang-btn').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.lang === lang);
      });
      var toggleBtn = document.getElementById('navToggle');
      if (toggleBtn) {
        var isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-label', isOpen ? translations[lang].navCloseMenu : translations[lang].navOpenMenu);
      }
      try { localStorage.setItem('codelab-lang', lang); } catch (e) {}
    }

    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.addEventListener('click', function () { applyLanguage(b.dataset.lang); });
    });

    applyLanguage(currentLang);

    /* Mobile menu */
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('primary-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? translations[currentLang].navCloseMenu : translations[currentLang].navOpenMenu);
      });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', translations[currentLang].navOpenMenu);
        });
      });
    }

    /* Header scroll shadow */
    var header = document.getElementById('header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* SVG trace lengths (hero illustration, homepage only — no-op elsewhere) */
    document.querySelectorAll('.scene .trace').forEach(function (p) {
      try {
        var len = Math.ceil(p.getTotalLength());
        p.style.setProperty('--len', len);
      } catch (e) {}
    });

    /* Scroll reveal */
    var items = document.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
      items.forEach(function (el) { io.observe(el); });
    }

    /* Nav active-section highlight (in-page anchors on the current page only) */
    var navSectionIds = ['top', 'timeline'];
    var sections = navSectionIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (sections.length) {
      var links = new Map();
      document.querySelectorAll('.nav a[href^="#"]').forEach(function (a) {
        links.set(a.getAttribute('href').slice(1), a);
      });
      if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            links.forEach(function (l) { l.classList.remove('is-active'); });
            // Sections without their own nav link (timeline) belong to Home
            var link = links.get(e.target.id) || links.get('top');
            if (link) link.classList.add('is-active');
          });
        }, { threshold: 0.3 });
        sections.forEach(function (s) { spy.observe(s); });
      }
    }

    /* Year */
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  global.initSite = initSite;
})(window);
