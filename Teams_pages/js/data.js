/* CodeLab — shared data helpers
   Pages load their content from data/*.json (edited through Pages CMS,
   see .pages.yml) and build their HTML from it BEFORE calling initSite(),
   so the existing data-i18n language switch and reveal animations cover
   the generated content too.

   Note: fetch() does not work on file:// pages. Preview locally with a
   local server (e.g. VS Code Live Server), not by double-clicking the HTML. */
(function (global) {
  'use strict';

  /* Fetch data/<name>.json for each name. Resolves to { name: data }.
     A file that fails to load resolves to null (logged), so one broken
     file never blocks the rest of the page. */
  function load(names) {
    return Promise.all(names.map(function (name) {
      return fetch('data/' + name + '.json', { cache: 'no-cache' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .catch(function (err) {
          console.error('[CodeLab] could not load data/' + name + '.json:', err);
          return null;
        });
    })).then(function (results) {
      var out = {};
      names.forEach(function (name, i) { out[name] = results[i]; });
      return out;
    });
  }

  /* Escape text for use inside innerHTML (translations are applied with innerHTML). */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* A bilingual field { en, nl } in one language; empty Dutch falls back to English. */
  function text(field, lang) {
    if (!field) return '';
    return (lang === 'nl' && field.nl) ? field.nl : (field.en || '');
  }

  /* Register a bilingual field under `key` in a page translation dictionary
     ({ en: {}, nl: {} }), escaped, and return the key for data-i18n. */
  function addText(dict, key, field) {
    dict.en[key] = esc(text(field, 'en'));
    dict.nl[key] = esc(text(field, 'nl'));
    return key;
  }

  /* "09/2024" -> sortable number; "2024" counts as January of that year;
     empty or malformed -> null. */
  function parseTime(t) {
    var m = /^(?:(0[1-9]|1[0-2])\/)?([0-9]{4})$/.exec(String(t || '').trim());
    if (!m) return null;
    return Number(m[2]) * 12 + (m[1] ? Number(m[1]) - 1 : 0);
  }

  /* Stable sort by time. `getTime(item)` returns the "09/2024" string.
     Items without a time keep their original order and go after all dated items.
     order: 'asc' (oldest first) or 'desc' (newest first). */
  function sortByTime(list, getTime, order) {
    var dir = order === 'desc' ? -1 : 1;
    return list
      .map(function (item, i) { return { item: item, i: i, t: parseTime(getTime(item)) }; })
      .sort(function (a, b) {
        if (a.t === null || b.t === null) {
          if (a.t === b.t) return a.i - b.i;
          return a.t === null ? 1 : -1;
        }
        return (a.t - b.t) * dir || a.i - b.i;
      })
      .map(function (x) { return x.item; });
  }

  /* Replace a section's content with the one-line load error message. */
  function showError(el) {
    if (!el) return;
    el.innerHTML = '<p class="data-error" data-i18n="dataLoadError">Content could not be loaded.</p>';
  }

  global.CodeLabData = {
    load: load,
    esc: esc,
    text: text,
    addText: addText,
    parseTime: parseTime,
    sortByTime: sortByTime,
    showError: showError
  };
})(window);
