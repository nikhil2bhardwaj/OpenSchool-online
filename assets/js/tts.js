/* ==========================================================================
   OpenSchool NCERT - Read-Aloud / TTS helper (F9)
   assets/js/tts.js
   Zero dependencies. Browser SpeechSynthesis ONLY — no network, no fetch,
   no speech recognition. Works over file://. Gracefully no-ops where
   speechSynthesis is unavailable.
   window.OSTTS = { speak(text), stop(), toggle(text), setRate(r), getRate(),
                    isSupported(), speakFrom(elOrSelector) }
   Auto-wires [data-os-tts-btn] buttons on DOMContentLoaded:
     data-os-tts-target="<css selector>" -> reads that element's text.
   ========================================================================== */
(function (global) {
  "use strict";

  var LS_RATE = "os-tts-rate";

  function synth() {
    try {
      return ("speechSynthesis" in global) ? global.speechSynthesis : null;
    } catch (e) { return null; }
  }

  function isSupported() { return !!synth(); }

  function getRate() {
    try {
      var r = parseFloat(global.localStorage ? global.localStorage.getItem(LS_RATE) : "1");
      if (isFinite(r) && r >= 0.5 && r <= 2) return r;
    } catch (e) {}
    return 1;
  }

  function setRate(r) {
    r = Number(r);
    if (!isFinite(r)) return getRate();
    r = Math.max(0.5, Math.min(2, r));
    try { if (global.localStorage) global.localStorage.setItem(LS_RATE, String(r)); } catch (e) {}
    return r;
  }

  function clean(text) {
    return String(text == null ? "" : text).replace(/\s+/g, " ").trim().slice(0, 8000);
  }

  /* Chrome i18n: OS_I18N keys with identical-English fallback (guarded). */
  function t(k, fb) {
    try { if (global.OS_I18N) return global.OS_I18N.t(k); } catch (e) {}
    return fb;
  }

  /* Translate a known default TTS button base label; pass through customs. */
  function trBaseLabel(raw) {
    if (raw === "Theory") return t("tts.theory", "Theory");
    if (raw === "Read aloud") return t("tts.read", "Read aloud");
    return raw;
  }

  function speak(text) {
    var s = synth();
    text = clean(text);
    if (!s || !text) return false;
    try {
      s.cancel();
      var u = new global.SpeechSynthesisUtterance(text);
      u.rate = getRate();
      u.lang = (global.document && global.document.documentElement.lang) || "en-IN";
      s.speak(u);
      return true;
    } catch (e) { return false; }
  }

  function stop() {
    var s = synth();
    if (!s) return false;
    try { s.cancel(); return true; } catch (e) { return false; }
  }

  function speaking() {
    var s = synth();
    try { return !!(s && s.speaking); } catch (e) { return false; }
  }

  function toggle(text) {
    if (speaking()) { stop(); return "stopped"; }
    return speak(text) ? "speaking" : "unsupported";
  }

  function speakFrom(elOrSelector) {
    var el = typeof elOrSelector === "string"
      ? (global.document ? global.document.querySelector(elOrSelector) : null)
      : elOrSelector;
    if (!el) return false;
    return speak(el.textContent || el.innerText || "");
  }

  /* Auto-wire speaker buttons: <button data-os-tts-btn
     data-os-tts-target="[data-panel=theory]">. Idempotent. */
  function wire(root) {
    root = root || (global.document ? global.document : null);
    if (!root || !root.querySelectorAll) return;
    var btns = root.querySelectorAll("[data-os-tts-btn]");
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.getAttribute("data-os-tts-wired")) return;
      btn.setAttribute("data-os-tts-wired", "1");
      if (!isSupported()) {
        btn.disabled = true;
        btn.title = "Speech synthesis not supported in this browser.";
      }
      btn.addEventListener("click", function () {
        var sel = btn.getAttribute("data-os-tts-target");
        var scope = null;
        try {
          if (sel && btn.ownerDocument) scope = btn.ownerDocument.querySelector(sel);
          // Fallback: read the enclosing tab panel (works in batch-patched labs).
          if (!scope && btn.closest) scope = btn.closest(".os-tabpanel") || btn.closest(".os-panel");
        } catch (e) { scope = null; }
        var text = scope ? (scope.textContent || "") : (btn.getAttribute("data-os-tts-text") || "");
        var state = toggle(text);
        var base = trBaseLabel(btn.getAttribute("data-os-tts-label") || "Read aloud");
        btn.textContent = (state === "speaking" ? "⏹ Stop — " : "🔊 ") + base;
        if (state === "speaking" && synth()) {
          // Reset label when the utterance queue empties.
          var iv = setInterval(function () {
            try {
              if (!synth().speaking) {
                clearInterval(iv);
                btn.textContent = "🔊 " + base;
              }
            } catch (e) { clearInterval(iv); }
          }, 600);
        }
      });
    });
    // Rate controls: <input type="range" data-os-tts-rate> (0.5–2).
    var rates = root.querySelectorAll("[data-os-tts-rate]");
    Array.prototype.forEach.call(rates, function (input) {
      if (input.getAttribute("data-os-tts-wired")) return;
      input.setAttribute("data-os-tts-wired", "1");
      try { input.value = String(getRate()); } catch (e) {}
      input.addEventListener("change", function () { setRate(parseFloat(input.value)); });
    });
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", function () { wire(global.document); });
    } else {
      wire(global.document);
    }
  }

  global.OSTTS = {
    speak: speak, stop: stop, toggle: toggle,
    setRate: setRate, getRate: getRate,
    isSupported: isSupported, speakFrom: speakFrom,
    _wire: wire
  };
})(typeof window !== "undefined" ? window : this);
