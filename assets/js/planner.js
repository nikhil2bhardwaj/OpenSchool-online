/* ==========================================================================
   OpenSchool NCERT - Spaced-Repetition Planner (F8)
   assets/js/planner.js
   Zero dependencies. 100% offline. Works over file://.
   window.OSPlanner = {
     nextUp(catalog, statsArr, limit),
     rank(catalog, statsArr, opts),   // pure logic, deterministic
     snooze(id, days), markDone(id),
     isSnoozed(id, now), isDoneToday(id),
     renderHubWidget(host, catalog, statsArr, opts)
   }
   Priority rule: score < 60% first, then unseen / >7 days unseen first.
   Uses LabNotebook.getUsageStats() rows + optional mastery-XP maps from
   localStorage (os-xp, os-mastery, os-gamify). Deterministic sort:
   priority -> score asc (unseen first) -> lastActivity asc -> id lexical.
   ========================================================================== */
(function (global) {
  "use strict";

  var SEVEN_DAYS = 7 * 24 * 3600 * 1000;
  var LS_SNOOZE = "os-planner-snooze";
  var LS_DONE = "os-planner-done";
  var LOW_SCORE = 60;

  function now() { return Date.now(); }

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function readJSON(key) {
    try {
      if (!global.localStorage) return null;
      var raw = global.localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function writeJSON(key, val) {
    try {
      if (!global.localStorage) return false;
      global.localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) { return false; }
  }

  /* Mastery-XP map: { <experimentId>: <cumulative xp number> }.
     Primary source is window.OSMastery (localStorage "os-mastery" shape
     { totalXP, perExp: {id: xp} }); also accepts flat maps under
     "os-xp" / "os-gamify" ({id: n} or {xp:{id:n}, mastery:{id:n}}).
     Read raw (no API calls) so rank() stays pure-ish and cheap. */
  function readXPMap() {
    var out = Object.create(null);
    function absorb(obj) {
      if (!obj || typeof obj !== "object") return;
      Object.keys(obj).forEach(function (id) {
        var n = Number(obj[id]);
        if (isFinite(n) && n > 0 && out[id] == null) out[id] = Math.floor(n);
      });
    }
    try {
      var mkey = (global.OSMastery && global.OSMastery._lsKey) || "os-mastery";
      var mraw = global.localStorage ? global.localStorage.getItem(mkey) : null;
      if (mraw) {
        var mdata = JSON.parse(mraw);
        if (mdata && typeof mdata === "object") {
          if (mdata.perExp && typeof mdata.perExp === "object") absorb(mdata.perExp);
          else absorb(mdata);
        }
      }
    } catch (e) {}
    ["os-xp", "os-gamify"].forEach(function (key) {
      var data = readJSON(key);
      if (!data || typeof data !== "object") return;
      if (data.xp && typeof data.xp === "object") absorb(data.xp);
      else if (data.mastery && typeof data.mastery === "object") absorb(data.mastery);
      else if (!data.perExp) absorb(data);
      else absorb(data.perExp);
    });
    return out;
  }

  function statsMap(statsArr) {
    var m = Object.create(null);
    (statsArr || []).forEach(function (r) {
      if (r && r.experiment_id) m[r.experiment_id] = r;
    });
    return m;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* Chrome i18n: OS_I18N keys with identical-English fallback (guarded). */
  function t(k, fb) {
    try { if (global.OS_I18N) return global.OS_I18N.t(k); } catch (e) {}
    return fb;
  }

  /* Pure ranking logic: no DOM, no storage reads except via opts. */
  function rank(catalog, statsArr, opts) {
    opts = opts || {};
    var t = opts.now != null ? opts.now : now();
    var xpMap = opts.xpMap || readXPMap();
    var snoozed = opts.snoozed || readJSON(LS_SNOOZE) || {};
    var doneMap = opts.doneMap || readJSON(LS_DONE) || {};
    var today = opts.today || todayKey(new Date(t));
    var sm = statsMap(statsArr);
    var out = [];

    (catalog || []).forEach(function (e) {
      if (!e || !e.id) return;
      if (snoozed[e.id] && Number(snoozed[e.id]) > t) return; // snoozed
      if (doneMap[e.id] === today) return;                    // done today
      var st = sm[e.id] || null;
      var pct = st && typeof st.vivaAvgPercent === "number" && isFinite(st.vivaAvgPercent)
        ? st.vivaAvgPercent : null;
      var xp = xpMap[e.id] != null ? xpMap[e.id] : 0; // mastery XP (engagement)
      var last = st && st.lastActivity ? Number(st.lastActivity) : 0;
      var staleDays = last > 0 ? Math.floor((t - last) / (24 * 3600 * 1000)) : -1;

      var priority, reason;
      if (pct != null && pct < LOW_SCORE) {
        priority = 0;
        reason = "Low score (" + Math.round(pct) + "%) — revise";
      } else if (last === 0 && xp === 0) {
        priority = 1;
        reason = "Not attempted yet";
      } else if (last === 0) {
        priority = 1;
        reason = "In progress (" + xp + " XP) — finish a trial";
      } else if (t - last > SEVEN_DAYS) {
        priority = 1;
        reason = "Not revised in " + staleDays + " days";
      } else {
        priority = 2;
        reason = pct != null
          ? "Score " + Math.round(pct) + "% — scheduled review"
          : "Practised " + staleDays + "d ago — scheduled review";
      }
      out.push({
        id: e.id, title: e.title || e.id, href: e.href || null,
        cls: e.cls, subject: e.subject,
        score: pct, xp: xp, lastActivity: last, priority: priority, reason: reason
      });
    });

    out.sort(function (a, b) {
      if (a.priority !== b.priority) return a.priority - b.priority;
      var sa = a.score == null ? -Infinity : a.score; // unseen first
      var sb = b.score == null ? -Infinity : b.score;
      if (sa !== sb) return sa - sb;
      if (a.lastActivity !== b.lastActivity) return a.lastActivity - b.lastActivity;
      if (a.xp !== b.xp) return a.xp - b.xp; // less practice first
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return out;
  }

  function nextUp(catalog, statsArr, limit) {
    var n = limit == null ? 5 : limit;
    if (typeof n === "object") { // nextUp(cat, stats, {limit:5})
      n = n.limit == null ? 5 : n.limit;
    }
    return rank(catalog, statsArr, {}).slice(0, n);
  }

  function snooze(id, days) {
    if (!id) return false;
    var m = readJSON(LS_SNOOZE) || {};
    m[id] = now() + (days == null ? 3 : Number(days)) * 24 * 3600 * 1000;
    return writeJSON(LS_SNOOZE, m);
  }

  function markDone(id) {
    if (!id) return false;
    var m = readJSON(LS_DONE) || {};
    m[id] = todayKey();
    // prune yesterday's entries to keep the map small
    var tk = todayKey();
    Object.keys(m).forEach(function (k) { if (m[k] !== tk) delete m[k]; });
    return writeJSON(LS_DONE, m);
  }

  function isSnoozed(id, t) {
    var m = readJSON(LS_SNOOZE) || {};
    return !!(m[id] && Number(m[id]) > (t == null ? now() : t));
  }

  function isDoneToday(id) {
    var m = readJSON(LS_DONE) || {};
    return m[id] === todayKey();
  }

  /* Hub widget: "Today's revision: N labs" with snooze/done buttons. */
  function renderHubWidget(host, catalog, statsArr, opts) {
    opts = opts || {};
    var limit = opts.limit == null ? 5 : opts.limit;
    if (typeof host === "string") host = document.querySelector(host);
    if (!host) return [];
    var items = rank(catalog, statsArr, {}).slice(0, limit);
    var html = '<h3 style="margin:0 0 4px">' + t("planner.title", "Today&rsquo;s revision") + ': ' + items.length + ' ' +
      t("planner.labs", items.length === 1 ? "lab" : "labs") + "</h3>";
    if (!items.length) {
      html += '<p class="os-dim" style="margin:4px 0">' + t("planner.empty", "All caught up — nothing due for revision.") + "</p>";
    } else {
      html += '<ol class="os-planner-list" style="margin:6px 0 0;padding-left:20px">';
      items.forEach(function (it) {
        var link = it.href
          ? '<a href="' + esc(it.href) + '">' + esc(it.title) + "</a>"
          : esc(it.title);
        html += '<li data-os-planner-item="' + esc(it.id) + '">' + link +
          ' <span class="os-dim" style="font-size:11px">' + esc(it.id) + " · " + esc(it.reason) + "</span>" +
          ' <span class="os-row" style="display:inline-flex;gap:4px;margin-left:6px">' +
          '<button class="os-btn sm ghost" type="button" data-os-planner-done="' + esc(it.id) + '">' + t("planner.done", "Done") + "</button>" +
          '<button class="os-btn sm ghost" type="button" data-os-planner-snooze="' + esc(it.id) + '">' + t("planner.snooze", "Snooze") + "</button>" +
          "</span></li>";
      });
      html += "</ol>";
    }
    host.innerHTML = html;
    host.querySelectorAll("[data-os-planner-done]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        markDone(btn.getAttribute("data-os-planner-done"));
        renderHubWidget(host, catalog, statsArr, opts);
      });
    });
    host.querySelectorAll("[data-os-planner-snooze]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        snooze(btn.getAttribute("data-os-planner-snooze"), 3);
        renderHubWidget(host, catalog, statsArr, opts);
      });
    });
    return items;
  }

  global.OSPlanner = {
    SEVEN_DAYS: SEVEN_DAYS, LOW_SCORE: LOW_SCORE,
    rank: rank, nextUp: nextUp,
    snooze: snooze, markDone: markDone,
    isSnoozed: isSnoozed, isDoneToday: isDoneToday,
    renderHubWidget: renderHubWidget,
    _readXPMap: readXPMap
  };
})(typeof window !== "undefined" ? window : this);
