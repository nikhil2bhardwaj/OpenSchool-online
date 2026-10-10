"use strict";
/* OpenSchool offline Mastery / XP engine — zero dependencies, 100% offline.
   window.OSMastery = { awardTrial, awardViva, awardQuiz, addXP, getProgress,
     getTotals, getRing, LEVELS, XP }
   XP rules: trial save = 10, viva pass = 20, each correct MCQ = 5.
   Levels/badges: Novice (0) → Explorer (50) → Practitioner (150) →
     Achiever (300) → Expert (500) → Master (800).
   Streak: consecutive local calendar days with any award, via localStorage date.
   Persist: localStorage "os-mastery" (primary) + best-effort IndexedDB mirror
   (OS_MASTERY_DB / store "mastery", key "state"). Mirror never blocks awards. */
window.OSMastery = (function () {
  var LS_KEY = "os-mastery";
  var IDB_NAME = "OS_MASTERY_DB";
  var IDB_STORE = "mastery";

  var XP = { trial: 10, vivaPass: 20, quizCorrect: 5 };
  var LEVELS = [
    { name: "Novice", min: 0 },
    { name: "Explorer", min: 50 },
    { name: "Practitioner", min: 150 },
    { name: "Achiever", min: 300 },
    { name: "Expert", min: 500 },
    { name: "Master", min: 800 }
  ];

  function todayStr(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  function blank() {
    return { totalXP: 0, perExp: {}, streak: 0, lastActive: null, awards: 0, updatedAt: Date.now() };
  }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return blank();
      var s = JSON.parse(raw);
      if (!s || typeof s !== "object") return blank();
      if (typeof s.totalXP !== "number") s.totalXP = 0;
      if (!s.perExp || typeof s.perExp !== "object") s.perExp = {};
      if (typeof s.streak !== "number") s.streak = 0;
      if (typeof s.awards !== "number") s.awards = 0;
      return s;
    } catch (e) { return blank(); }
  }

  function save(s) {
    s.updatedAt = Date.now();
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
    mirrorIDB(s); // fire-and-forget
    return s;
  }

  /* Best-effort mirror of { totalXP, perExp } snapshot into IndexedDB.
     Separate tiny DB so LabNotebook schema (v1) is never touched. */
  function mirrorIDB(s) {
    try {
      if (!window.indexedDB) return;
      var req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = function () {
        try {
          var db = req.result;
          var tx = db.transaction(IDB_STORE, "readwrite");
          tx.objectStore(IDB_STORE).put(
            { totalXP: s.totalXP, perExp: s.perExp, streak: s.streak, lastActive: s.lastActive, updatedAt: s.updatedAt },
            "state"
          );
          tx.oncomplete = function () { try { db.close(); } catch (e) {} };
          tx.onerror = function () { try { db.close(); } catch (e) {} };
        } catch (e) {}
      };
      req.onerror = function () {};
      req.onblocked = function () {};
    } catch (e) {}
  }

  function levelFor(xp) {
    var cur = LEVELS[0], next = null;
    for (var i = 0; i < LEVELS.length; i++) {
      if (xp >= LEVELS[i].min) cur = LEVELS[i];
      else { next = LEVELS[i]; break; }
    }
    return { name: cur.name, min: cur.min, next: next };
  }

  function touchStreak(s) {
    var t = todayStr();
    if (s.lastActive === t) return s; // already counted today
    var y = new Date(); y.setDate(y.getDate() - 1);
    s.streak = (s.lastActive === todayStr(y)) ? (s.streak + 1) : 1;
    s.lastActive = t;
    return s;
  }

  function addXP(n, experimentId) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    if (!n) return getTotals();
    var s = load();
    touchStreak(s);
    s.totalXP += n;
    s.awards += 1;
    if (experimentId) {
      var id = String(experimentId);
      s.perExp[id] = (Number(s.perExp[id]) || 0) + n;
    }
    save(s);
    return getTotals();
  }

  function awardTrial(experimentId) { return addXP(XP.trial, experimentId); }
  function awardViva(experimentId, passed) {
    if (passed === false) return getTotals(); // fail => no XP, no streak touch
    return addXP(XP.vivaPass, experimentId);
  }
  function awardQuiz(experimentId, correctCount) {
    var c = Math.max(0, Math.floor(Number(correctCount) || 0));
    return addXP(c * XP.quizCorrect, experimentId);
  }

  /* Per-experiment progress: { xp, level } */
  function getProgress(experimentId) {
    var s = load();
    var xp = experimentId ? (Number(s.perExp[String(experimentId)]) || 0) : s.totalXP;
    return { xp: xp, level: levelFor(xp).name };
  }

  function getTotals() {
    var s = load();
    var lv = levelFor(s.totalXP);
    return { xp: s.totalXP, level: lv.name, next: lv.next, streak: s.streak, lastActive: s.lastActive, awards: s.awards };
  }

  /* Ring data for hub cards: { xp, level, pct, nextMin }
     pct = progress toward next level (100 when Master). */
  function getRing(experimentId) {
    var p = getProgress(experimentId);
    var lv = levelFor(p.xp);
    var pct;
    if (!lv.next) pct = 100;
    else {
      var span = lv.next.min - lv.min;
      pct = span > 0 ? Math.min(100, Math.round(((p.xp - lv.min) / span) * 100)) : 100;
    }
    return { xp: p.xp, level: p.level, pct: pct, nextMin: lv.next ? lv.next.min : null };
  }

  return {
    XP: XP, LEVELS: LEVELS,
    addXP: addXP, awardTrial: awardTrial, awardViva: awardViva, awardQuiz: awardQuiz,
    getProgress: getProgress, getTotals: getTotals, getRing: getRing,
    _lsKey: LS_KEY
  };
})();
