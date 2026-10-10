/* OpenSchool Procedure Wizard — generic stepper. Zero dependencies, fully offline.
   Usage:
     OSProcedure.start(document.querySelector("[data-os-procedure]"), ["step 1", ...], { key: "P-C09-01" });
     OSProcedure.start(["step 1", ...]);                       // auto-finds [data-os-procedure]
     OSProcedure.initFromBank();                               // uses CONFIG.experimentId + OS_PROCEDURE_BANK
   Features: Prev/Next, per-step checkbox, progress bar, keyboard accessible, ARIA. */
(function () {
  "use strict";

  var GENERIC = [
    "Check the apparatus for zero error and note the least count of each instrument.",
    "Arrange the apparatus as shown and level it before taking readings.",
    "Record the initial reading with the eye perpendicular to the scale.",
    "Vary the input in equal steps and record at least five observations.",
    "Compute the result from the mean of the observations using the governing equation.",
    "Repeat the set, estimate the error, and write the result with units and precautions."
  ];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Chrome i18n: OS_I18N keys with identical-English fallback (guarded). */
  function t(k, fb) {
    try { if (typeof window !== "undefined" && window.OS_I18N) return window.OS_I18N.t(k); } catch (e) {}
    return fb;
  }

  function storeKey(key) { return "os-procedure-" + key; }

  function loadDone(key, n) {
    try {
      var raw = localStorage.getItem(storeKey(key));
      if (!raw) return null;
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length !== n) return null;
      return arr.map(function (v) { return !!v; });
    } catch (e) { return null; }
  }

  function saveDone(key, done) {
    try { localStorage.setItem(storeKey(key), JSON.stringify(done)); } catch (e) {}
  }

  function resolveHost(a) {
    if (typeof a === "string") return document.querySelector(a);
    if (a && a.nodeType === 1) return a;
    return null;
  }

  function start(a, b, c) {
    var host = null, steps = null, opts = {};
    if (Array.isArray(a)) { steps = a; opts = b || {}; host = document.querySelector("[data-os-procedure]"); }
    else { host = resolveHost(a); steps = b; opts = c || {}; }
    if (!host) host = document.querySelector("[data-os-procedure]");
    if (!host) return null;
    if (!Array.isArray(steps)) steps = steps ? [String(steps)] : GENERIC.slice();
    if (!steps.length) steps = GENERIC.slice();
    var key = opts.key || opts.id ||
      ((typeof CONFIG !== "undefined" && CONFIG && CONFIG.experimentId) ? CONFIG.experimentId : "GENERIC");
    render(host, steps.map(String), key);
    return host;
  }

  function render(host, steps, key) {
    var n = steps.length;
    var done = loadDone(key, n);
    if (!done) { done = steps.map(function () { return false; }); }
    var idx = 0;
    for (var i = 0; i < n; i++) { if (!done[i]) { idx = i; break; } idx = Math.min(n - 1, i); }
    if (done.every(function (v) { return v; })) idx = n - 1;

    host.innerHTML = "";
    host.setAttribute("data-os-procedure-done", "1");

    var wrap = document.createElement("div");
    wrap.className = "os-proc";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Step-by-step experiment procedure");
    wrap.tabIndex = 0;

    var top = document.createElement("div");
    top.className = "os-row between";
    var countChip = document.createElement("span");
    countChip.className = "os-chip";
    countChip.setAttribute("data-proc-count", "");
    var btnBox = document.createElement("span");
    btnBox.className = "os-row";
    function mkBtn(label, attr, primary) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "os-btn sm" + (primary ? " primary" : "");
      b.setAttribute("data-proc-" + attr, "");
      b.textContent = label;
      btnBox.appendChild(b);
      return b;
    }
    top.appendChild(countChip);
    top.appendChild(btnBox);
    var btnPrev = mkBtn(t("procedure.prev", "← Prev"), "prev", false);
    var btnNext = mkBtn(t("procedure.next", "Next →"), "next", true);
    var btnReset = mkBtn(t("procedure.reset", "Reset"), "reset", false);
    wrap.appendChild(top);

    var bar = document.createElement("div");
    bar.className = "os-proc-bar";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(n));
    bar.setAttribute("aria-label", "Procedure progress");
    var fill = document.createElement("div");
    fill.className = "os-proc-fill";
    bar.appendChild(fill);
    wrap.appendChild(bar);

    var ol = document.createElement("ol");
    ol.className = "os-proc-list";
    var boxes = [];
    steps.forEach(function (text, k) {
      var li = document.createElement("li");
      li.className = "os-proc-step";
      li.setAttribute("data-step", String(k));
      var id = "osproc-" + key.replace(/[^A-Za-z0-9]+/g, "-") + "-" + k;
      var label = document.createElement("label");
      label.setAttribute("for", id);
      var box = document.createElement("input");
      box.type = "checkbox";
      box.id = id;
      box.checked = !!done[k];
      box.setAttribute("aria-label", "Mark step " + (k + 1) + " complete: " + text);
      boxes.push(box);
      var num = document.createElement("span");
      num.className = "os-proc-num";
      num.textContent = String(k + 1);
      num.setAttribute("aria-hidden", "true");
      var txt = document.createElement("span");
      txt.className = "os-proc-text";
      txt.textContent = text;
      label.appendChild(box);
      label.appendChild(num);
      label.appendChild(txt);
      li.appendChild(label);
      ol.appendChild(li);
    });
    wrap.appendChild(ol);

    var hint = document.createElement("p");
    hint.className = "os-muted os-proc-hint";
    hint.textContent = "Tip: use ← / → keys while this panel is focused to move between steps; Tab reaches each checkbox.";
    wrap.appendChild(hint);
    host.appendChild(wrap);

    var btnPrev = wrap.children[0].children[1].children[0];
    var btnNext = wrap.children[0].children[1].children[1];
    var btnReset = wrap.children[0].children[1].children[2];
    var countChip = wrap.children[0].children[0];

    function paint() {
      var finished = done.filter(Boolean).length;
      countChip.textContent = t("procedure.step", "Step") + " " + Math.min(idx + 1, n) + " of " + n + " · " + finished + " done";
      bar.setAttribute("aria-valuenow", String(finished));
      bar.setAttribute("aria-valuetext", finished + " of " + n + " steps complete");
      fill.style.width = (n ? (finished / n) * 100 : 0).toFixed(1) + "%";
      var items = ol.querySelectorAll(".os-proc-step");
      items.forEach(function (li, k) {
        li.classList.toggle("done", !!done[k]);
        li.classList.toggle("current", k === idx);
        if (k === idx) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
      });
      boxes.forEach(function (bx, k) { if (bx.checked !== done[k]) bx.checked = done[k]; });
      btnPrev.disabled = idx <= 0;
      btnNext.textContent = idx >= n - 1 ? t("procedure.finish", "Finish ✓") : t("procedure.next", "Next →");
    }

    function go(k) {
      idx = Math.max(0, Math.min(n - 1, k));
      paint();
      var li = ol.querySelector('[data-step="' + idx + '"]');
      if (li && document.activeElement === wrap) li.scrollIntoView({ block: "nearest" });
    }

    boxes.forEach(function (bx, k) {
      bx.addEventListener("change", function () {
        done[k] = bx.checked;
        saveDone(key, done);
        if (bx.checked && idx === k && idx < n - 1) idx++;
        paint();
      });
    });
    btnPrev.addEventListener("click", function () { go(idx - 1); });
    btnNext.addEventListener("click", function () {
      if (idx >= n - 1) { done[idx] = true; saveDone(key, done); }
      go(Math.min(n - 1, idx + 1));
    });
    btnReset.addEventListener("click", function () {
      done = steps.map(function () { return false; });
      saveDone(key, done);
      go(0);
    });
    wrap.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowRight") { ev.preventDefault(); go(idx + 1); }
      else if (ev.key === "ArrowLeft") { ev.preventDefault(); go(idx - 1); }
      else if (ev.key === "Home") { ev.preventDefault(); go(0); }
      else if (ev.key === "End") { ev.preventDefault(); go(n - 1); }
    });

    paint();
  }

  /* Hindi when OS_I18N.getLang()==='hi', else document <html lang="hi">.
     Guarded so procedure.js works with or without i18n.js. */
  function isHi() {
    try {
      if (window.OS_I18N && typeof window.OS_I18N.getLang === "function" &&
          window.OS_I18N.getLang() === "hi") return true;
    } catch (e) {}
    try {
      if (typeof document !== "undefined" && document.documentElement) {
        var l = document.documentElement.getAttribute
          ? document.documentElement.getAttribute("lang")
          : document.documentElement.lang;
        if (l === "hi") return true;
      }
    } catch (e) {}
    return false;
  }

  function lookupIn(bankMap, id) {
    if (!bankMap || !id) return null;
    if (bankMap[id]) return bankMap[id];
    var base = String(id).slice(0, 8);
    if (bankMap[base]) return bankMap[base];
    var keys = Object.keys(bankMap);
    for (var i = 0; i < keys.length; i++) {
      if (id.indexOf(keys[i]) === 0 || keys[i].indexOf(id) === 0) return bankMap[keys[i]];
    }
    return null;
  }

  /* stepsFor(id[, lang]): Hindi steps from window.OS_PROC_HI when lang
     is "hi" (or current UI lang is hi and lang is omitted); otherwise EN.
     Falls back to EN when a Hindi entry is missing. */
  function bankStepsFor(id, lang) {
    var wantHi = (typeof lang === "string") ? (lang === "hi") : isHi();
    if (wantHi) {
      var hi = lookupIn(window.OS_PROC_HI || {}, id);
      if (hi) return hi;
    }
    return lookupIn(window.OS_PROCEDURE_BANK || {}, id);
  }

  function initFromBank() {
    var hosts = document.querySelectorAll("[data-os-procedure]:not([data-os-procedure-done])");
    if (!hosts.length) return 0;
    var id = (typeof CONFIG !== "undefined" && CONFIG && CONFIG.experimentId) ? String(CONFIG.experimentId) : "";
    var steps = bankStepsFor(id) || GENERIC.slice();
    hosts.forEach(function (h) { start(h, steps, { key: id || "GENERIC" }); });
    return hosts.length;
  }

  /* Re-render procedure in the new language when the i18n toggle fires
     (guarded, no-op when absent). */
  try {
    if (typeof document !== "undefined" && document.addEventListener &&
        !window.__osProcLangWired) {
      window.__osProcLangWired = true;
      document.addEventListener("os-lang-change", function () {
        try {
          var done = document.querySelectorAll("[data-os-procedure][data-os-procedure-done]");
          for (var i = 0; i < done.length; i++) done[i].removeAttribute("data-os-procedure-done");
          initFromBank();
        } catch (e) {}
      });
    }
  } catch (e) {}

  window.OSProcedure = {
    start: start,
    initFromBank: initFromBank,
    stepsFor: bankStepsFor,
    GENERIC_STEPS: GENERIC
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFromBank);
  } else {
    try { initFromBank(); } catch (e) {}
  }
})();
