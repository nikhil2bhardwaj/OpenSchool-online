"use strict";
/* OpenSchool offline Mistakes notebook — zero dependencies, 100% offline.
   window.OSMistakes = { record(entry), getAll(experimentId?), clear(), count() }
   Entry: { experimentId, q, yourAnswer, correct, explain, ts }
   Persist: localStorage "os-mistakes" (primary, capped at 300, newest first).
   IndexedDB mirror: not used — localStorage is sufficient for small text rows
   and keeps file:// behaviour predictable.

   VIVA HOOK (for lab pages using AIExaminer.offlineSubmit — do NOT edit
   ai-examiner.js; paste this guarded snippet at the viva submit call-site):
     // after: var res = examiner.offlineSubmit(userText);
     try {
       if (window.OSMistakes && res && res.mark === 0) {
         window.OSMistakes.record({
           experimentId: examiner.experimentId,
           q: res.question, yourAnswer: userText,
           correct: res.model, explain: "Viva mark 0/2",
           ts: Date.now()
         });
       }
       if (window.OSMastery && res && res.done && res.score >= res.total * 0.6) {
         window.OSMastery.awardViva(examiner.experimentId, true);
       }
     } catch (e) {}
   MCQ hook is already wired inside assets/js/quiz.js renderInto (guarded
   `typeof window.OSMistakes !== "undefined"` checks — no-op when absent). */
window.OSMistakes = (function () {
  var LS_KEY = "os-mistakes";
  var CAP = 300;

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }

  function save(a) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch (e) {}
    return a;
  }

  /* record({ experimentId, q, yourAnswer, correct, explain, ts }) */
  function record(entry) {
    entry = entry || {};
    var row = {
      experimentId: entry.experimentId != null ? String(entry.experimentId) : "unknown",
      q: entry.q != null ? String(entry.q) : "",
      yourAnswer: entry.yourAnswer != null ? String(entry.yourAnswer) : "",
      correct: entry.correct != null ? String(entry.correct) : "",
      explain: entry.explain != null ? String(entry.explain) : "",
      ts: entry.ts || Date.now()
    };
    if (!row.q && !row.correct) return null; // nothing worth storing
    var a = load();
    a.unshift(row);
    if (a.length > CAP) a.length = CAP;
    save(a);
    try { document.dispatchEvent(new CustomEvent("os-mistakes-change", { detail: { count: a.length } })); } catch (e) {}
    return row;
  }

  function getAll(experimentId) {
    var a = load();
    if (experimentId == null) return a;
    var id = String(experimentId);
    return a.filter(function (r) { return r.experimentId === id; });
  }

  function clear() { save([]); return true; }
  function count(experimentId) { return getAll(experimentId).length; }

  /* Optional runtime auto-hook: wraps AIExaminer.prototype.offlineSubmit once,
     so viva misses are recorded even on lab pages that never pasted the hook.
     Fully guarded — no-ops when AIExaminer is absent or already wrapped. */
  function autoHookViva() {
    try {
      var P = window.AIExaminer && window.AIExaminer.prototype;
      if (!P || P._osMistakesHooked) return false;
      var orig = P.offlineSubmit;
      if (typeof orig !== "function") return false;
      P.offlineSubmit = function (userAnswer) {
        var res = orig.call(this, userAnswer);
        try {
          if (res && res.mark === 0) {
            record({
              experimentId: this.experimentId, q: res.question,
              yourAnswer: userAnswer, correct: res.model,
              explain: "Viva mark 0/2", ts: Date.now()
            });
          }
          if (window.OSMastery && res && res.done && res.score >= res.total * 0.6) {
            window.OSMastery.awardViva(this.experimentId, true);
          }
        } catch (e) {}
        return res;
      };
      P._osMistakesHooked = true;
      return true;
    } catch (e) { return false; }
  }

  try { autoHookViva(); } catch (e) {}
  /* Re-attempt late in case ai-examiner.js loads after this file. */
  try {
    document.addEventListener("DOMContentLoaded", function () { try { autoHookViva(); } catch (e) {} });
  } catch (e) {}

  return { record: record, getAll: getAll, clear: clear, count: count, _lsKey: LS_KEY, _cap: CAP };
})();
