/* ==========================================================================
   OpenSchool NCERT - Bookmarks helper (F10)
   assets/js/bookmarks.js
   Zero dependencies. 100% offline. file:// safe.
   Primary store: localStorage "os-bookmarks" (JSON array of experiment ids)
   so hub + labs interoperate with storage.js saveBookmark/listBookmarks.
   window.OSBookmarks = { list(), has(id), toggle(id), set(id, on),
                           starButton(id, opts), wire(root) }
   Auto-wires:
     - [data-os-bookmark-btn]            -> star toggle for CONFIG id
       (or data-os-bookmark-btn="<EXP_ID>")
     - [data-os-bookmark-filter]         -> hub "show starred only" toggle
   ========================================================================== */
(function (global) {
  "use strict";

  var LS_KEY = "os-bookmarks";

  function read() {
    try {
      if (!global.localStorage) return [];
      var raw = global.localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (x) { return typeof x === "string" && x; });
    } catch (e) { return []; }
  }

  function write(ids) {
    try {
      if (!global.localStorage) return false;
      var uniq = [];
      (ids || []).forEach(function (x) {
        if (typeof x === "string" && x && uniq.indexOf(x) === -1) uniq.push(x);
      });
      global.localStorage.setItem(LS_KEY, JSON.stringify(uniq));
      return true;
    } catch (e) { return false; }
  }

  function list() { return read(); }

  function has(id) {
    if (!id) return false;
    return read().indexOf(String(id)) !== -1;
  }

  function set(id, on) {
    if (!id) return [];
    id = String(id);
    var ids = read();
    var i = ids.indexOf(id);
    if (on && i === -1) ids.push(id);
    if (!on && i !== -1) ids.splice(i, 1);
    write(ids);
    notify(id, on);
    return ids;
  }

  function toggle(id) {
    var next = !has(id);
    set(id, next);
    return next;
  }

  function notify(id, on) {
    try {
      if (global.document) {
        global.document.dispatchEvent(new global.CustomEvent("os-bookmark-change", {
          detail: { id: id, starred: !!on, all: read() }
        }));
      }
    } catch (e) {}
  }

  /* Chrome i18n: OS_I18N keys with identical-English fallback (guarded). */
  function t(k, fb) {
    try { if (global.OS_I18N) return global.OS_I18N.t(k); } catch (e) {}
    return fb;
  }

  function paint(btn, starred) {
    var label = starred ? "★ " + t("bookmarks.starred", "Starred") : "☆ " + t("bookmarks.bookmark", "Bookmark");
    if (btn.getAttribute("data-os-bookmark-compact") != null) label = starred ? "★" : "☆";
    btn.textContent = label;
    btn.setAttribute("aria-pressed", starred ? "true" : "false");
    btn.classList.toggle("active", !!starred);
  }

  /* Resolve the experiment id for a button: explicit value wins,
     else global CONFIG.experimentId (lab pages). */
  function resolveId(btn) {
    var v = btn.getAttribute("data-os-bookmark-btn");
    if (v) return v;
    try {
      if (global.CONFIG && global.CONFIG.experimentId) return global.CONFIG.experimentId;
    } catch (e) {}
    return null;
  }

  function wire(root) {
    root = root || (global.document ? global.document : null);
    if (!root || !root.querySelectorAll) return;
    var btns = root.querySelectorAll("[data-os-bookmark-btn]");
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.getAttribute("data-os-bookmark-wired")) return;
      btn.setAttribute("data-os-bookmark-wired", "1");
      var id = resolveId(btn);
      if (id) paint(btn, has(id));
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        var bid = resolveId(btn) || id;
        if (!bid) return;
        paint(btn, toggle(bid));
      });
    });
    // Keep all star buttons in sync when any one toggles.
    if (root === global.document && !wire._listening && global.document) {
      wire._listening = true;
      global.document.addEventListener("os-bookmark-change", function (ev) {
        var d = (ev && ev.detail) || {};
        Array.prototype.forEach.call(
          global.document.querySelectorAll("[data-os-bookmark-btn]"), function (b) {
            var bid = resolveId(b);
            if (bid && bid === d.id) paint(b, !!d.starred);
          });
      });
    }
  }

  /* Build a standalone star toggle button for an experiment id. */
  function starButton(id, opts) {
    opts = opts || {};
    var b = global.document ? global.document.createElement("button") : null;
    if (!b) return null;
    b.type = "button";
    b.className = opts.className || "os-btn sm ghost";
    b.setAttribute("data-os-bookmark-btn", String(id));
    if (opts.compact) b.setAttribute("data-os-bookmark-compact", "1");
    b.setAttribute("aria-label", "Bookmark " + String(id));
    paint(b, has(id));
    b.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      paint(b, toggle(id));
    });
    return b;
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", function () { wire(global.document); });
    } else {
      wire(global.document);
    }
  }

  global.OSBookmarks = {
    LS_KEY: LS_KEY, list: list, has: has,
    toggle: toggle, set: set,
    starButton: starButton, wire: wire
  };
})(typeof window !== "undefined" ? window : this);
