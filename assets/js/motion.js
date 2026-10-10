/* OpenSchool fluid motion system — vendored GSAP only, guarded, offline-first.
   Zero CDN: loads from assets/vendor/gsap/gsap.min.js via a plain <script> tag.
   Every helper is a no-op (CSS fallback keeps content visible) when window.gsap
   is absent, and everything honours prefers-reduced-motion.

   Motion-spec applied (3 pillars / duration + easing tables / 8-step checklist):
     Pillars: (1) purposeful — every tween signals hierarchy or feedback;
              (2) responsive — micro < 250ms, entrances decelerate, exits accelerate;
              (3) calm — transform/opacity only, no linear easings, no infinite RAF.
     Durations: micro 120-220ms | enter 250-450ms | exit 150-250ms |
                stagger 35-70ms | counter ~900ms | toast in 280ms / out 180ms.
     Easings:  entrances power2.out / power3.out (decelerate);
               exits power2.in (accelerate); press back.out(2.5) (spring-ish);
               counters power2.out; NEVER linear ("none"/"linear" banned).
     1/3-rule: a stagger cascade never exceeds ~0.5s (≈1/3 of the 1.5s
               page-enter budget); extras render instantly via CSS fallback.
     Checklist: tokens -> page-enter -> cards cascade -> scroll reveals ->
                counters -> press physics -> tab morph -> toast/feedback ->
                reduced-motion kill-switch -> idle-proof verify.

   Public API (backward compatible):
     OSMotion.staggerIn / tabSwap / popIn / shake / enabled (unchanged)
     OSMotion.pageEnter(opts)        — hero stagger + panels/cards cascade
     OSMotion.reveal(target)         — IntersectionObserver + gsap scroll reveals
     OSMotion.counters(target)       — animated tabular-nums counters
     OSMotion.press(node)            — button press physics (scale .97)
     OSMotion.tabMorph(outEl, inEl)  — outgoing accelerate + incoming decelerate
     OSMotion.toast(msg, type)       — toast in/out animation
     OSMotion.success(el) / OSMotion.error(el) — feedback states
   Idle-proof: IntersectionObserver + one-shot gsap tweens only. No ticker,
   no infinite RAF, no setInterval anywhere in this file. */
(function () {
  "use strict";

  /* -- guards ----------------------------------------------------------- */
  function reducedMotion() {
    try {
      return window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { return false; }
  }

  /* Single gsap gate: every animated path goes through canAnimate(). */
  function hasGsap() {
    return !!(window.gsap && typeof window.gsap.fromTo === "function");
  }

  function canAnimate() {
    return hasGsap() && !reducedMotion();
  }

  /* 1/3-rule: cap a stagger cascade at ~0.5s of the 1.5s page-enter budget. */
  var MAX_CASCADE = 0.5;   /* seconds */
  var MAX_ANIMATED = 12;   /* extras appear instantly, never staggered late */
  function cappedStagger(want, n) {
    var s = (want != null && want >= 0) ? want : 0.06;
    if (n > 1) s = Math.min(s, MAX_CASCADE / (n - 1));
    return Math.max(0, s);
  }

  function toNodes(target) {
    if (!target) return [];
    if (typeof target === "string") {
      try { return Array.prototype.slice.call(document.querySelectorAll(target)); }
      catch (e) { return []; }
    }
    if (target.nodeType === 1) return [target];
    if (target.length != null && typeof target !== "function") {
      try { return Array.prototype.slice.call(target); } catch (e) { return []; }
    }
    return [];
  }

  /* Reveal fallback: make nodes visible through CSS when gsap is absent
     (or reduced-motion is on). Mirrors .os-reveal / .os-enter-done classes. */
  function showInstantly(nodes) {
    nodes.forEach(function (n) {
      try {
        n.classList.add("is-in");
        n.classList.add("os-enter-done");
        n.classList.remove("os-enter");
      } catch (e) {}
    });
  }

  /* -- entrances -------------------------------------------------------- */
  /* Stagger-fade/slide entrance for shell panels. */
  function staggerIn(target, opts) {
    var els = toNodes(target || ".os-panel, .os-tabpanel.active");
    if (!els.length) return;
    if (!canAnimate()) { showInstantly(els); return; }
    var o = opts || {};
    var head = els.slice(0, MAX_ANIMATED);
    var tail = els.slice(MAX_ANIMATED);
    if (tail.length) showInstantly(tail);
    try {
      showInstantly(head); /* CSS-first paint, then gsap enhances */
      window.gsap.fromTo(head,
        { y: o.y != null ? o.y : 10, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: o.duration || 0.45,
          stagger: cappedStagger(o.stagger != null ? o.stagger : 0.07, head.length),
          ease: o.ease || "power2.out", /* decelerate entrances */
          overwrite: true,
          clearProps: "transform,opacity"
        });
    } catch (e) { /* no-op: CSS keeps content visible */ }
  }

  /* Page-enter choreography: hero stagger, then panels/cards cascade.
     transform/opacity only; tail beyond MAX_ANIMATED renders instantly. */
  function pageEnter(opts) {
    var o = opts || {};
    var hero = toNodes(o.hero || ".os-hero > *");
    var cards = toNodes(o.cards || ".os-cards .os-card, .os-panel");
    if (!hero.length && !cards.length) return;
    if (!canAnimate()) { showInstantly(hero.concat(cards)); return; }
    try {
      var tl = window.gsap.timeline({ defaults: { ease: "power3.out" } });
      if (hero.length) {
        var hh = hero.slice(0, MAX_ANIMATED);
        showInstantly(hh);
        if (hero.length > hh.length) showInstantly(hero.slice(MAX_ANIMATED));
        tl.fromTo(hh, { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: cappedStagger(0.07, hh.length), clearProps: "transform,opacity" }, 0);
      }
      if (cards.length) {
        var cc = cards.slice(0, MAX_ANIMATED);
        showInstantly(cc);
        if (cards.length > cc.length) showInstantly(cards.slice(MAX_ANIMATED));
        tl.fromTo(cc, { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: cappedStagger(0.06, cc.length), clearProps: "transform,opacity" }, 0.12);
      }
    } catch (e) { showInstantly(hero.concat(cards)); }
  }

  /* Scroll reveals: IntersectionObserver drives one-shot gsap tweens.
     Elements start hidden only via .os-reveal CSS; IO unobserves on reveal
     so nothing runs while idle. */
  var revealIO = null;
  function reveal(target) {
    var els = toNodes(target || ".os-reveal");
    if (!els.length) return;
    if (!canAnimate()) { showInstantly(els); return; }
    function play(nodes) {
      try {
        window.gsap.fromTo(nodes, { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: cappedStagger(0.06, nodes.length), ease: "power2.out", overwrite: true, clearProps: "transform,opacity" });
      } catch (e) { showInstantly(nodes); }
      nodes.forEach(function (n) { try { n.classList.add("is-in"); } catch (e2) {} });
    }
    try {
      if (!("IntersectionObserver" in window)) { play(els); return; }
      if (!revealIO) {
        revealIO = new IntersectionObserver(function (entries) {
          var batch = [];
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              try { revealIO.unobserve(en.target); } catch (e) {}
              batch.push(en.target);
            }
          });
          if (batch.length) play(batch);
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      }
      els.forEach(function (el) {
        try {
          if (el.classList.contains("is-in")) return;
          revealIO.observe(el);
        } catch (e) {}
      });
      /* Safety net: never leave content hidden if IO stalls. One-shot. */
      setTimeout(function () {
        var pending = els.filter(function (el) {
          try { return !el.classList.contains("is-in"); } catch (e) { return false; }
        });
        if (pending.length && !canAnimate()) showInstantly(pending);
        else if (pending.length) play(pending);
      }, 2500);
    } catch (e) { showInstantly(els); }
  }

  /* -- counters ---------------------------------------------------------- */
  /* Animated counters: [data-os-count] / .os-counter. tabular-nums via CSS.
     Triggered once via IntersectionObserver; reduced-motion sets final value. */
  function fmtCount(v, decimals) {
    try { return Number(v).toFixed(decimals); } catch (e) { return String(v); }
  }
  function counters(target) {
    var els = toNodes(target || "[data-os-count], .os-counter[data-count]");
    if (!els.length) return;
    els.forEach(function (el) {
      if (el.getAttribute("data-os-counted")) return;
      var raw = el.getAttribute("data-os-count");
      if (raw == null) raw = el.getAttribute("data-count");
      if (raw == null) raw = el.textContent;
      var end = parseFloat(raw);
      if (isNaN(end)) return;
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      if (isNaN(dec) || dec < 0) dec = 0;
      var dur = parseFloat(el.getAttribute("data-duration") || "0.9");
      if (isNaN(dur) || dur <= 0) dur = 0.9;
      function done() { el.setAttribute("data-os-counted", "1"); }
      function render(v) { try { el.textContent = fmtCount(v, dec); } catch (e) {} }
      function run() {
        if (reducedMotion() || !hasGsap()) { render(end); done(); return; }
        try {
          var state = { v: 0 };
          render(0);
          window.gsap.to(state, {
            v: end, duration: Math.min(dur, 1.4), ease: "power2.out",
            overwrite: true,
            onUpdate: function () { render(state.v); },
            onComplete: function () { render(end); done(); }
          });
        } catch (e) { render(end); done(); }
      }
      try {
        if (!("IntersectionObserver" in window) || reducedMotion()) { run(); return; }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              try { io.unobserve(en.target); } catch (e) {}
              run();
            }
          });
        }, { threshold: 0.4 });
        io.observe(el);
        setTimeout(function () { /* never leave a counter stuck at 0 */
          if (!el.getAttribute("data-os-counted")) { try { io.disconnect(); } catch (e) {} run(); }
        }, 3000);
      } catch (e) { run(); }
    });
  }

  /* -- press physics ------------------------------------------------------ */
  /* Button press: scale .97 on pointerdown, spring back on release.
     transform-only; CSS .is-pressed covers the no-gsap path. */
  function press(node) {
    var nodes = toNodes(node);
    if (!nodes.length) return;
    nodes.forEach(function (n) {
      if (!canAnimate()) {
        try {
          n.classList.add("is-pressed");
          setTimeout(function () { try { n.classList.remove("is-pressed"); } catch (e) {} }, 160);
        } catch (e) {}
        return;
      }
      try {
        window.gsap.fromTo(n, { scale: 1 }, { scale: 0.97, duration: 0.12, ease: "power2.in", overwrite: true, clearProps: "transform" });
      } catch (e) {}
    });
  }
  function release(node) {
    var nodes = toNodes(node);
    if (!nodes.length || !canAnimate()) return;
    try {
      window.gsap.to(nodes, { scale: 1, duration: 0.22, ease: "back.out(2.5)", overwrite: true, clearProps: "transform" });
    } catch (e) {}
  }

  /* -- tab morph ----------------------------------------------------------- */
  /* Tab panel swap: fade/slide incoming panel (decelerate). Old panel hidden
     by each lab's own selectTab/class logic before this runs. */
  function tabSwap(incomingPanel) {
    if (!incomingPanel) return;
    var nodes = toNodes(incomingPanel);
    if (!nodes.length) return;
    if (!canAnimate()) { showInstantly(nodes); return; }
    try {
      window.gsap.fromTo(nodes,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.28, ease: "power2.out", overwrite: true, clearProps: "transform,opacity" });
    } catch (e) { /* no-op */ }
  }

  /* Two-panel morph: outgoing accelerates out, incoming decelerates in.
     transform/opacity only; falls back to instantly showing incoming. */
  function tabMorph(outgoing, incoming) {
    var inNodes = toNodes(incoming);
    var outNodes = toNodes(outgoing);
    if (!inNodes.length) return;
    if (!canAnimate()) { showInstantly(inNodes); return; }
    try {
      if (outNodes.length) {
        window.gsap.to(outNodes, {
          y: -6, opacity: 0, duration: 0.16, ease: "power2.in", overwrite: true,
          onComplete: function () {
            try { window.gsap.set(outNodes, { clearProps: "transform,opacity" }); } catch (e) {}
            tabSwap(inNodes);
          }
        });
      } else {
        tabSwap(inNodes);
      }
    } catch (e) { showInstantly(inNodes); }
  }

  /* -- row pop-in + shake (unchanged behaviour, capped) --------------------- */
  /* Row pop-in (reimplements 02-number-pop-in): scale + fade for new rows. */
  function popIn(el) {
    var nodes = toNodes(el).slice(0, MAX_ANIMATED);
    if (!nodes.length) return;
    if (!canAnimate()) { showInstantly(nodes); return; }
    try {
      window.gsap.fromTo(nodes,
        { scale: 0.96, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2.2)", overwrite: true, clearProps: "transform,opacity" });
    } catch (e) { /* no-op: CSS .os-pop-in handles fallback */ }
  }

  /* Error shake (reimplements 12-error-state-shake): horizontal shake. */
  function shake(el) {
    var nodes = toNodes(el);
    if (!nodes.length) return;
    if (!canAnimate()) {
      nodes.forEach(function (n) {
        try {
          n.classList.remove("os-shake");
          void n.offsetWidth; /* restart CSS keyframes */
          n.classList.add("os-shake");
        } catch (e) {}
      });
      return;
    }
    try {
      nodes.forEach(function (n) {
        window.gsap.fromTo(n, { x: 0 },
          { keyframes: [{ x: -7 }, { x: 7 }, { x: -5 }, { x: 5 }, { x: 0 }], duration: 0.38, ease: "power1.inOut", overwrite: true, clearProps: "transform" });
      });
    } catch (e) { /* no-op: CSS .os-shake handles fallback */ }
  }

  /* -- toast + feedback ----------------------------------------------------- */
  function toastStack() {
    var host = document.querySelector(".os-toast-stack");
    if (host) return host;
    host = document.createElement("div");
    host.className = "os-toast-stack";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    try { document.body.appendChild(host); } catch (e) { return null; }
    return host;
  }

  /* Toast: slides/fades in (decelerate), auto-dismiss accelerates out.
     One setTimeout per toast; node removed afterwards — nothing idles. */
  function toast(msg, type) {
    var host = toastStack();
    if (!host) return null;
    var t = (type || "info").toLowerCase();
    if (t !== "ok" && t !== "success" && t !== "error" && t !== "danger" && t !== "info") t = "info";
    var el = document.createElement("div");
    el.className = "os-toast os-toast-" + t + " os-toast-in";
    var dot = document.createElement("span");
    dot.className = "os-toast-dot";
    dot.setAttribute("aria-hidden", "true");
    var span = document.createElement("span");
    span.className = "os-toast-msg";
    span.textContent = String(msg == null ? "" : msg);
    el.appendChild(dot);
    el.appendChild(span);
    try { host.appendChild(el); } catch (e) { return null; }
    function dismiss() {
      try {
        if (!canAnimate()) { if (el.parentNode) el.parentNode.removeChild(el); return; }
        window.gsap.to(el, {
          y: -6, opacity: 0, duration: 0.18, ease: "power2.in", overwrite: true,
          onComplete: function () { try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e2) {} }
        });
      } catch (e) { try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e2) {} }
    }
    if (canAnimate()) {
      try {
        window.gsap.fromTo(el, { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.28, ease: "power2.out", overwrite: true, clearProps: "transform" });
      } catch (e) {}
    }
    setTimeout(dismiss, 2600);
    return el;
  }

  /* Success: CSS-drawn check + gentle pop. Error: shake + toast. */
  function success(el, msg) {
    var nodes = toNodes(el);
    nodes.forEach(function (n) {
      try { n.classList.add("os-show-check"); } catch (e) {}
    });
    if (canAnimate() && nodes.length) {
      try {
        window.gsap.fromTo(nodes, { scale: 0.97, opacity: 0.4 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)", overwrite: true, clearProps: "transform,opacity" });
      } catch (e) {}
    }
    if (msg) toast(msg, "ok");
  }
  function error(el, msg) {
    shake(el);
    if (msg) toast(msg, "error");
    else if (!toNodes(el).length) toast("Something went wrong.", "error");
  }

  window.OSMotion = {
    staggerIn: staggerIn,
    pageEnter: pageEnter,
    reveal: reveal,
    counters: counters,
    press: press,
    release: release,
    tabSwap: tabSwap,
    tabMorph: tabMorph,
    popIn: popIn,
    shake: shake,
    toast: toast,
    success: success,
    error: error,
    enabled: canAnimate
  };

  /* Auto-enhance: entrance + reveals + counters + press + tabs + rows.
     Idempotent — safe to include on every lab. */
  function autoInit() {
    if (document.body && !document.body.hasAttribute("data-os-motion")) {
      document.body.setAttribute("data-os-motion", "1");
    }
    try { pageEnter(); } catch (e) {}
    try { reveal(".os-reveal"); } catch (e) {}
    try { counters(); } catch (e) {}

    /* Button press physics: delegated, transient, no RAF. */
    if (!document.documentElement.getAttribute("data-os-motion-press")) {
      document.documentElement.setAttribute("data-os-motion-press", "1");
      document.addEventListener("pointerdown", function (ev) {
        var b = ev.target && ev.target.closest ? ev.target.closest(".os-btn, .os-tab, .os-filter-pill") : null;
        if (b) press(b);
      }, { passive: true });
      document.addEventListener("pointerup", function (ev) {
        var b = ev.target && ev.target.closest ? ev.target.closest(".os-btn, .os-tab, .os-filter-pill") : null;
        if (b) release(b);
      }, { passive: true });
    }

    /* Tab transitions: hook .os-tabs clicks -> morph into incoming panel. */
    document.querySelectorAll(".os-tabs").forEach(function (tabsEl) {
      if (tabsEl.getAttribute("data-os-motion-tabs")) return;
      tabsEl.setAttribute("data-os-motion-tabs", "1");
      tabsEl.addEventListener("click", function (ev) {
        var tab = ev.target && ev.target.closest ? ev.target.closest(".os-tab") : null;
        if (!tab) return;
        /* Let the lab's own selectTab run first, then animate the now-active panel. */
        setTimeout(function () {
          try {
            var sel = tab.getAttribute("data-tab");
            var panel = sel && document.querySelector('.os-tabpanel[data-panel="' + sel + '"]');
            if (panel) tabSwap(panel);
          } catch (e) {}
        }, 0);
      });
    });
    /* Row pop-in: observe observation-table bodies. */
    try {
      var bodies = document.querySelectorAll("#obsTable tbody");
      if (bodies.length && window.MutationObserver) {
        var obs = new MutationObserver(function (muts) {
          muts.forEach(function (m) {
            (m.addedNodes || []).forEach(function (n) {
              if (n.nodeType === 1 && n.tagName === "TR") {
                n.classList.add("os-pop-in");
                popIn(n);
              }
            });
          });
        });
        bodies.forEach(function (b) { obs.observe(b, { childList: true }); });
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();
