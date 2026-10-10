/* ==========================================================================
   OpenSchool NCERT - Universal Lab Notebook Storage
   assets/js/storage.js
   Zero external dependencies. Browser-native IndexedDB with a resilient
   in-memory fallback for restricted file:// contexts.
   ========================================================================== */

(function (global) {
  "use strict";

  const DB_NAME = "OpenSchool_NCERT_DB";
  const DB_VERSION = 1;
  const STORE_NOTEBOOK = "practical_notebook";
  const STORE_VIVA = "viva_scores";

  function uid(prefix) {
    const rnd = Math.random().toString(36).slice(2, 10);
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + rnd;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  class LabNotebookDB {
    constructor() {
      this.db = null;
      this._memory = { [STORE_NOTEBOOK]: [], [STORE_VIVA]: [] };
      this._usingMemory = false;
      this._ready = null;
      this._error = null;
    }

    /* ------------------------------------------------------------------ */
    /* Connection                                                          */
    /* ------------------------------------------------------------------ */
    open() {
      if (this._ready) return this._ready;
      const self = this;
      this._ready = new Promise(function (resolve) {
        if (!global.indexedDB) {
          self._usingMemory = true;
          self._error = "IndexedDB unavailable; using in-memory notebook.";
          resolve(self);
          return;
        }
        let req;
        try {
          req = global.indexedDB.open(DB_NAME, DB_VERSION);
        } catch (e) {
          self._usingMemory = true;
          self._error = "IndexedDB blocked; using in-memory notebook.";
          resolve(self);
          return;
        }
        req.onupgradeneeded = function (event) {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NOTEBOOK)) {
            const s = db.createObjectStore(STORE_NOTEBOOK, { keyPath: "entry_id" });
            s.createIndex("experiment_id", "experiment_id", { unique: false });
            s.createIndex("class_level", "class_level", { unique: false });
            s.createIndex("timestamp", "timestamp", { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_VIVA)) {
            const v = db.createObjectStore(STORE_VIVA, { keyPath: "viva_id" });
            v.createIndex("experiment_id", "experiment_id", { unique: false });
          }
        };
        req.onsuccess = function () {
          self.db = req.result;
          resolve(self);
        };
        req.onerror = function () {
          self._usingMemory = true;
          self._error = "IndexedDB open failed; using in-memory notebook.";
          resolve(self);
        };
        req.onblocked = function () {
          self._usingMemory = true;
          self._error = "IndexedDB blocked; using in-memory notebook.";
          resolve(self);
        };
      });
      return this._ready;
    }

    _tx(store, mode) {
      return this.db.transaction(store, mode).objectStore(store);
    }

    _wrap(request) {
      return new Promise(function (resolve, reject) {
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () { reject(request.error); };
      });
    }

    isFallback() { return this._usingMemory; }

    /* ------------------------------------------------------------------ */
    /* Notebook trials                                                     */
    /* ------------------------------------------------------------------ */
    async saveTrial(experimentId, trialData) {
      await this.open();
      const payload = trialData || {};
      const entry = {
        entry_id: payload.entry_id || uid("trial"),
        experiment_id: experimentId,
        class_level: payload.class_level != null ? payload.class_level : payload.classLevel,
        subject: payload.subject || null,
        title: payload.title || null,
        timestamp: payload.timestamp || Date.now(),
        readings: payload.readings || [],
        results: payload.results || {},
        notes: payload.notes || ""
      };

      if (this._usingMemory) {
        const list = this._memory[STORE_NOTEBOOK];
        const idx = list.findIndex(function (e) { return e.entry_id === entry.entry_id; });
        if (idx >= 0) list[idx] = entry; else list.push(entry);
        return entry;
      }
      try {
        await this._wrap(this._tx(STORE_NOTEBOOK, "readwrite").put(entry));
        return entry;
      } catch (e) {
        this._usingMemory = true;
        return this.saveTrial(experimentId, entry);
      }
    }

    async getHistory(experimentId) {
      await this.open();
      if (this._usingMemory) {
        return this._memory[STORE_NOTEBOOK]
          .filter(function (e) { return !experimentId || e.experiment_id === experimentId; })
          .sort(function (a, b) { return b.timestamp - a.timestamp; });
      }
      try {
        const store = this._tx(STORE_NOTEBOOK, "readonly");
        let all;
        if (experimentId) {
          all = await this._wrap(store.index("experiment_id").getAll(experimentId));
        } else {
          all = await this._wrap(store.getAll());
        }
        return (all || []).sort(function (a, b) { return b.timestamp - a.timestamp; });
      } catch (e) {
        return [];
      }
    }

    async getEntry(entryId) {
      await this.open();
      if (this._usingMemory) {
        return this._memory[STORE_NOTEBOOK].find(function (e) { return e.entry_id === entryId; }) || null;
      }
      try {
        return (await this._wrap(this._tx(STORE_NOTEBOOK, "readonly").get(entryId))) || null;
      } catch (e) { return null; }
    }

    async deleteTrial(entryId) {
      await this.open();
      if (this._usingMemory) {
        this._memory[STORE_NOTEBOOK] = this._memory[STORE_NOTEBOOK].filter(function (e) { return e.entry_id !== entryId; });
        return true;
      }
      try {
        await this._wrap(this._tx(STORE_NOTEBOOK, "readwrite").delete(entryId));
        return true;
      } catch (e) { return false; }
    }

    /* ------------------------------------------------------------------ */
    /* Viva scores                                                         */
    /* ------------------------------------------------------------------ */
    async saveViva(experimentId, vivaData) {
      await this.open();
      const payload = vivaData || {};
      const record = {
        viva_id: payload.viva_id || uid("viva"),
        experiment_id: experimentId,
        timestamp: payload.timestamp || Date.now(),
        score: payload.score != null ? payload.score : null,
        total: payload.total != null ? payload.total : null,
        transcript: payload.transcript || [],
        mode: payload.mode || "offline"
      };
      if (this._usingMemory) {
        this._memory[STORE_VIVA].push(record);
        return record;
      }
      try {
        await this._wrap(this._tx(STORE_VIVA, "readwrite").put(record));
        return record;
      } catch (e) {
        this._usingMemory = true;
        return this.saveViva(experimentId, record);
      }
    }

    async getVivaHistory(experimentId) {
      await this.open();
      if (this._usingMemory) {
        return this._memory[STORE_VIVA].filter(function (v) { return !experimentId || v.experiment_id === experimentId; });
      }
      try {
        const store = this._tx(STORE_VIVA, "readonly");
        const all = experimentId
          ? await this._wrap(store.index("experiment_id").getAll(experimentId))
          : await this._wrap(store.getAll());
        return all || [];
      } catch (e) { return []; }
    }

    /* ------------------------------------------------------------------ */
    /* CBSE record generation                                              */
    /* ------------------------------------------------------------------ */
    async exportToCBSEFormat(experimentId) {
      const history = await this.getHistory(experimentId);
      return this.buildCBSESheet(experimentId, history);
    }

    buildCBSESheet(experimentId, history) {
      const entries = history || [];
      const meta = entries[0] || {};
      const title = meta.title || experimentId;
      const cls = meta.class_level != null ? meta.class_level : "-";
      const subject = meta.subject || "-";
      const date = new Date().toLocaleDateString();

      let rows = "";
      entries.forEach(function (e, i) {
        const readings = Array.isArray(e.readings) && e.readings.length
          ? e.readings.map(function (r) {
              const cells = Object.keys(r).map(function (k) {
                return "<td>" + escapeHtml(r[k]) + "</td>";
              }).join("");
              return "<tr><td>" + (i + 1) + "</td>" + cells + "</tr>";
            }).join("")
          : '<tr><td colspan="2" class="os-dim">No tabulated readings recorded.</td></tr>';

        const headers = Array.isArray(e.readings) && e.readings.length
          ? Object.keys(e.readings[0]).map(function (k) { return "<th>" + escapeHtml(k) + "</th>"; }).join("")
          : "<th>Observation</th>";

        const results = e.results && Object.keys(e.results).length
          ? Object.keys(e.results).map(function (k) {
              return "<div><b>" + escapeHtml(k) + ":</b> " + escapeHtml(e.results[k]) + "</div>";
            }).join("")
          : '<span class="os-dim">-</span>';

        rows +=
          '<section class="trial">' +
          '<h3>Trial ' + (i + 1) + " &mdash; " + escapeHtml(new Date(e.timestamp).toLocaleString()) + "</h3>" +
          '<table><thead><tr><th>S. No.</th>' + headers + "</tr></thead><tbody>" + readings + "</tbody></table>" +
          '<div class="results"><h4>Computed Result</h4>' + results + "</div>" +
          (e.notes ? '<div class="notes"><b>Remarks:</b> ' + escapeHtml(e.notes) + "</div>" : "") +
          "</section>";
      });

      const html =
        "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>" +
        "<title>CBSE Practical Record &mdash; " + escapeHtml(title) + "</title>" +
        "<style>" +
        "body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:34px;}" +
        "h1{font-size:20px;margin:0 0 4px;}h2{font-size:15px;font-weight:normal;color:#444;margin:0 0 18px;}" +
        ".meta{border:1px solid #333;padding:10px 14px;display:flex;gap:26px;flex-wrap:wrap;font-size:13px;margin-bottom:18px;}" +
        "section.trial{margin-bottom:26px;page-break-inside:avoid;}" +
        "table{border-collapse:collapse;width:100%;font-size:12.5px;}" +
        "th,td{border:1px solid #333;padding:6px 8px;text-align:center;}" +
        "th{background:#eee;}" +
        ".results{margin-top:8px;font-size:13px;}.notes{margin-top:6px;font-size:12.5px;color:#444;}" +
        ".os-dim{color:#888;}" +
        "@media print{body{margin:14mm;}}" +
        "</style></head><body>" +
        "<h1>OpenSchool NCERT &mdash; CBSE Practical Record Sheet</h1>" +
        "<h2>" + escapeHtml(title) + " (Experiment ID: " + escapeHtml(experimentId) + ")</h2>" +
        '<div class="meta"><span><b>Class:</b> ' + escapeHtml(cls) + "</span>" +
        "<span><b>Subject:</b> " + escapeHtml(subject) + "</span>" +
        "<span><b>Date:</b> " + escapeHtml(date) + "</span>" +
        "<span><b>Trials:</b> " + entries.length + "</span></div>" +
        (rows || '<p class="os-dim">No saved trials found for this experiment.</p>') +
        "</body></html>";
      return html;
    }

    /* Opens a print window with the CBSE sheet (best-effort on file://). */
    async printCBSEFormat(experimentId) {
      const html = await this.exportToCBSEFormat(experimentId);
      const w = global.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(function () { try { w.print(); } catch (e) { /* noop */ } }, 350);
      }
      return html;
    }
  }

  global.LabNotebookDB = LabNotebookDB;
  if (!global.LabNotebook) {
    global.LabNotebook = new LabNotebookDB();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = LabNotebookDB;
  }
})(typeof window !== "undefined" ? window : this);

/* ==========================================================================
   OpenSchool NCERT - Teacher Dashboard extensions (append-only)
   Adds exportDB / importDB / getUsageStats / clearAll to LabNotebookDB.
   Zero-deps. Works with IndexedDB + in-memory fallback. 100% offline.
   ========================================================================== */
(function (global) {
  "use strict";

  var STORE_NB = "practical_notebook";
  var STORE_VV = "viva_scores";

  function uid(prefix) {
    const rnd = Math.random().toString(36).slice(2, 10);
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + rnd;
  }

  function proto() {
    if (global.LabNotebookDB && global.LabNotebookDB.prototype) return global.LabNotebookDB.prototype;
    return null;
  }

  async function getAllRecords(inst, store) {
    await inst.open();
    if (inst._usingMemory) {
      return (inst._memory[store] || []).slice();
    }
    try {
      const txStore = inst._tx(store, "readonly");
      const all = await inst._wrap(txStore.getAll());
      return (all || []).slice();
    } catch (e) {
      return [];
    }
  }

  async function clearStore(inst, store) {
    await inst.open();
    if (inst._usingMemory) {
      inst._memory[store] = [];
      return;
    }
    try {
      await inst._wrap(inst._tx(store, "readwrite").clear());
    } catch (e) {
      inst._usingMemory = true;
      inst._memory[store] = [];
    }
  }

  async function putMany(inst, store, rows) {
    await inst.open();
    if (inst._usingMemory) {
      inst._memory[store] = rows.slice();
      return;
    }
    try {
      for (const row of rows) {
        await inst._wrap(inst._tx(store, "readwrite").put(row));
      }
    } catch (e) {
      // Fall back to memory so no data is silently dropped on file://.
      inst._usingMemory = true;
      inst._memory[store] = rows.slice();
    }
  }

  var P = proto();
  if (!P) return;

  /* Full-database export: { practical_notebook, viva_scores, exportedAt }. */
  if (typeof P.exportDB !== "function") {
    P.exportDB = async function () {
      const nb = await getAllRecords(this, STORE_NB);
      const vv = await getAllRecords(this, STORE_VV);
      return {
        practical_notebook: nb,
        viva_scores: vv,
        exportedAt: new Date().toISOString()
      };
    };
  }

  /* Validated import. Accepts an object or JSON string. Replaces both stores. */
  if (typeof P.importDB !== "function") {
    P.importDB = async function (json) {
      let data = json;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          throw new Error("importDB: invalid JSON string.");
        }
      }
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("importDB: payload must be an object.");
      }
      const nb = data[STORE_NB];
      const vv = data[STORE_VV];
      if (!Array.isArray(nb)) throw new Error("importDB: missing practical_notebook array.");
      if (!Array.isArray(vv)) throw new Error("importDB: missing viva_scores array.");
      for (const e of nb) {
        if (!e || typeof e !== "object" || Array.isArray(e)) throw new Error("importDB: bad trial entry.");
      }
      for (const v of vv) {
        if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("importDB: bad viva entry.");
      }

      const now = Date.now();
      const normNb = nb.map(function (e) {
        return {
          entry_id: e.entry_id || uid("trial"),
          experiment_id: e.experiment_id || "unknown",
          class_level: e.class_level != null ? e.class_level : (e.classLevel != null ? e.classLevel : null),
          subject: e.subject || null,
          title: e.title || null,
          timestamp: e.timestamp || now,
          readings: Array.isArray(e.readings) ? e.readings : [],
          results: e.results && typeof e.results === "object" ? e.results : {},
          notes: e.notes || ""
        };
      });
      const normVv = vv.map(function (v) {
        return {
          viva_id: v.viva_id || uid("viva"),
          experiment_id: v.experiment_id || "unknown",
          timestamp: v.timestamp || now,
          score: v.score != null ? v.score : null,
          total: v.total != null ? v.total : null,
          transcript: Array.isArray(v.transcript) ? v.transcript : [],
          mode: v.mode || "offline"
        };
      });

      await clearStore(this, STORE_NB);
      await clearStore(this, STORE_VV);
      await putMany(this, STORE_NB, normNb);
      await putMany(this, STORE_VV, normVv);
      return { trials: normNb.length, viva: normVv.length };
    };
  }

  /* Per-experiment aggregates: trials, viva attempts, avg score. */
  if (typeof P.getUsageStats !== "function") {
    P.getUsageStats = async function () {
      const nb = await getAllRecords(this, STORE_NB);
      const vv = await getAllRecords(this, STORE_VV);
      const map = Object.create(null);

      function row(id) {
        if (!map[id]) {
          map[id] = {
            experiment_id: id, trials: 0, vivaAttempts: 0,
            vivaAvgScore: null, vivaAvgPercent: null,
            lastActivity: 0, title: null, subject: null, class_level: null,
            _scoreSum: 0, _scored: 0, _pctSum: 0, _pctN: 0
          };
        }
        return map[id];
      }

      nb.forEach(function (e) {
        const id = (e && e.experiment_id) || "unknown";
        const r = row(id);
        r.trials += 1;
        if (e.timestamp && e.timestamp > r.lastActivity) {
          r.lastActivity = e.timestamp;
          r.title = e.title || r.title;
          r.subject = e.subject || r.subject;
          r.class_level = e.class_level != null ? e.class_level : r.class_level;
        } else if (!r.title && e.title) {
          r.title = e.title;
        }
      });

      vv.forEach(function (v) {
        const id = (v && v.experiment_id) || "unknown";
        const r = row(id);
        r.vivaAttempts += 1;
        if (v.timestamp && v.timestamp > r.lastActivity) r.lastActivity = v.timestamp;
        if (typeof v.score === "number" && isFinite(v.score)) {
          r._scoreSum += v.score;
          r._scored += 1;
          if (typeof v.total === "number" && isFinite(v.total) && v.total > 0) {
            r._pctSum += (v.score / v.total) * 100;
            r._pctN += 1;
          }
        }
      });

      const out = Object.keys(map).map(function (k) {
        const r = map[k];
        if (r._scored > 0) r.vivaAvgScore = Math.round((r._scoreSum / r._scored) * 100) / 100;
        if (r._pctN > 0) r.vivaAvgPercent = Math.round((r._pctSum / r._pctN) * 100) / 100;
        delete r._scoreSum; delete r._scored; delete r._pctSum; delete r._pctN;
        return r;
      });
      out.sort(function (a, b) {
        if (a.experiment_id < b.experiment_id) return -1;
        if (a.experiment_id > b.experiment_id) return 1;
        return 0;
      });
      return out;
    };
  }

  /* Clears both stores (memory or IndexedDB). Used by dashboard Clear button. */
  if (typeof P.clearAll !== "function") {
    P.clearAll = async function () {
      await clearStore(this, STORE_NB);
      await clearStore(this, STORE_VV);
      return true;
    };
  }
})(typeof window !== "undefined" ? window : this);

/* ==========================================================================
   OpenSchool NCERT - Bookmarks extensions (F10, append-only, guarded)
   Interoperates with assets/js/bookmarks.js via localStorage "os-bookmarks"
   (JSON array of experiment ids). Zero-deps, file:// safe, 100% offline.
   Delegates to window.OSBookmarks when loaded; otherwise reads/writes
   localStorage directly so the API works standalone.
   ========================================================================== */
(function (global) {
  "use strict";

  var LS_KEY = "os-bookmarks";

  function proto() {
    if (global.LabNotebookDB && global.LabNotebookDB.prototype) return global.LabNotebookDB.prototype;
    return null;
  }

  function readLocal() {
    try {
      if (global.OSBookmarks && typeof global.OSBookmarks.list === "function") {
        return global.OSBookmarks.list();
      }
      if (!global.localStorage) return [];
      var raw = global.localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (x) { return typeof x === "string" && x; });
    } catch (e) { return []; }
  }

  function writeLocal(ids) {
    if (global.OSBookmarks && typeof global.OSBookmarks.set === "function" && ids && ids._toggleSingle) {
      return null; // unused path; OSBookmarks.set handles single-id writes
    }
    try {
      if (!global.localStorage) return false;
      global.localStorage.setItem(LS_KEY, JSON.stringify(ids || []));
      return true;
    } catch (e) { return false; }
  }

  var P = proto();
  if (!P) return;

  /* Persist a bookmark. Returns the full bookmark id list. */
  if (typeof P.saveBookmark !== "function") {
    P.saveBookmark = async function (experimentId) {
      if (!experimentId) throw new Error("saveBookmark: experimentId required.");
      var id = String(experimentId);
      if (global.OSBookmarks && typeof global.OSBookmarks.set === "function") {
        return global.OSBookmarks.set(id, true);
      }
      var ids = readLocal();
      if (ids.indexOf(id) === -1) ids.push(id);
      writeLocal(ids);
      return ids;
    };
  }

  /* List all bookmarked experiment ids. */
  if (typeof P.listBookmarks !== "function") {
    P.listBookmarks = async function () {
      return readLocal();
    };
  }

  /* Remove a bookmark. Returns the full bookmark id list. */
  if (typeof P.removeBookmark !== "function") {
    P.removeBookmark = async function (experimentId) {
      if (!experimentId) return readLocal();
      var id = String(experimentId);
      if (global.OSBookmarks && typeof global.OSBookmarks.set === "function") {
        return global.OSBookmarks.set(id, false);
      }
      var ids = readLocal().filter(function (x) { return x !== id; });
      writeLocal(ids);
      return ids;
    };
  }
})(typeof window !== "undefined" ? window : this);
