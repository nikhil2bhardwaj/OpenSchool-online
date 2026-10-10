/* OpenSchool NCERT - Hindi viva override wiring.
   assets/js/viva-hi.js
   Zero dependencies. Wraps window.AIExaminer so offline viva uses the
   centralized Hindi bank (window.OS_VIVA_HI) when lang=hi, else English.
   Guarded: missing Hindi id falls back to the lab's inline English bank.
   Load order: after ai-examiner.js + viva-bank-hi.js, before inline lab script.
   Reacts to os-lang-change for idle (not-yet-started) vivas. */
(function (global) {
  "use strict";

  function getLang() {
    try {
      if (global.OS_I18N && typeof global.OS_I18N.getLang === "function") return global.OS_I18N.getLang();
      var v = global.localStorage ? global.localStorage.getItem("os-lang") : null;
      return v === "hi" ? "hi" : "en";
    } catch (e) { return "en"; }
  }

  function hiBankFor(id) {
    try {
      var H = global.OS_VIVA_HI || null;
      if (!H || !id) return null;
      var arr = H[id];
      if (!Array.isArray(arr) || !arr.length) return null;
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        var it = arr[i] || {};
        var q = it.q_hi != null ? it.q_hi : it.question;
        var a = it.a_hi != null ? it.a_hi : it.answer;
        if (!q || !a) continue;
        out.push({ question: q, answer: a });
      }
      return out.length ? out : null;
    } catch (e) { return null; }
  }

  function pickBank(id, enBank) {
    if (getLang() !== "hi") return enBank;
    var hb = hiBankFor(id);
    return hb || enBank;
  }

  /* Correct the hardcoded " / N" progress text when Hindi bank length differs
     from the inline English VIVA_BANK length used by lab renderers. */
  function fixProgress(ex) {
    try {
      if (!ex || !ex.vivaBank) return;
      var el = typeof document !== "undefined" ? document.getElementById("vivaProgress") : null;
      if (!el) return;
      var want = String(ex.vivaBank.length);
      var txt = el.textContent || "";
      var fixed = txt.replace(/\/\s*\d+/, "/ " + want);
      if (fixed !== txt) el.textContent = fixed;
    } catch (e) {}
  }

  function scheduleFix(ex) {
    try {
      if (typeof setTimeout === "function") setTimeout(function () { fixProgress(ex); }, 0);
      else fixProgress(ex);
    } catch (e) {}
  }

  function wrapOnce() {
    var Orig = global.AIExaminer;
    if (!Orig || Orig.__osVivaHiWrapped) return false;
    var REG = [];

    function Wrapped(config) {
      config = config || {};
      var en = config.vivaBank;
      var id = config.experimentId;
      try { config.vivaBank = pickBank(id, en); } catch (e) {}
      var inst = new Orig(config);
      inst._osEnBank = en;
      inst._osExpId = id;
      REG.push(inst);
      try {
        var _start = inst.offlineStart.bind(inst);
        inst.offlineStart = function () {
          try { inst.setVivaBank(pickBank(inst._osExpId, inst._osEnBank)); } catch (e) {}
          var r = _start();
          scheduleFix(inst);
          return r;
        };
        var _q = inst.offlineQuestion.bind(inst);
        inst.offlineQuestion = function () {
          var r = _q();
          scheduleFix(inst);
          return r;
        };
        var _s = inst.offlineSubmit.bind(inst);
        inst.offlineSubmit = function (ans) {
          var r = _s(ans);
          scheduleFix(inst);
          return r;
        };
      } catch (e) {}
      return inst;
    }
    Wrapped.prototype = Orig.prototype;
    Wrapped.__osVivaHiWrapped = true;
    Wrapped._Orig = Orig;
    Wrapped._instances = REG;
    global.AIExaminer = Wrapped;

    function refreshIdle() {
      try {
        for (var i = 0; i < REG.length; i++) {
          var ex = REG[i];
          if (ex.offline && ex.offline.index === 0 && (!ex.offline.answers || !ex.offline.answers.length)) {
            try { ex.setVivaBank(pickBank(ex._osExpId, ex._osEnBank)); } catch (e) {}
            fixProgress(ex);
          }
        }
      } catch (e) {}
    }

    try {
      if (typeof document !== "undefined" && document.addEventListener) {
        document.addEventListener("os-lang-change", function () { refreshIdle(); });
      }
    } catch (e) {}
    // Expose for tests/debugging (read-only intent).
    try { global.OS_VIVA_HI_CTL = { refreshIdle: refreshIdle, pickBank: pickBank }; } catch (e) {}
    return true;
  }

  try {
    if (global.AIExaminer) wrapOnce();
    else if (typeof document !== "undefined") {
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (global.AIExaminer || tries > 50) {
          try { clearInterval(timer); } catch (e) {}
          try { wrapOnce(); } catch (e) {}
        }
      }, 50);
    }
  } catch (e) {}
})(typeof window !== "undefined" ? window : this);
