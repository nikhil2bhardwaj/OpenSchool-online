/* ==========================================================================
   OpenSchool NCERT - Printable Lab Report (F4)
   assets/js/report.js
   Zero deps. Deterministic. window.OSReport.buildLabReport({...}) returns a
   standalone printable HTML string; printLabReport(...) opens it in a new
   window (best-effort on file://). Canvas snapshot via toDataURL is guarded.
   ========================================================================== */
(function (global) {
  "use strict";

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtNum(v, digits) {
    var n = Number(v);
    if (!isFinite(n)) return esc(v);
    return n.toFixed(digits == null ? 3 : digits);
  }

  /* Snapshot a canvas element to a PNG data URL. Guarded: tainted or
     missing canvases yield "" instead of throwing. */
  function canvasPNG(canvasEl) {
    if (!canvasEl || typeof canvasEl.toDataURL !== "function") return "";
    try {
      return canvasEl.toDataURL("image/png");
    } catch (e) {
      return "";
    }
  }

  /* Readings may be [{x,y}] or generic row objects. Render generically:
     x/y pairs get Input/Output columns; anything else uses union of keys. */
  function readingsTable(readings) {
    var rows = Array.isArray(readings) ? readings : [];
    if (!rows.length) {
      return '<p class="os-dim">No readings recorded.</p>';
    }
    var simple = rows.every(function (r) {
      return r && typeof r === "object" && ("x" in r) && ("y" in r);
    });
    var heads, body;
    if (simple) {
      heads = "<tr><th>S. No.</th><th>Input x</th><th>Output y</th></tr>";
      body = rows.map(function (r, i) {
        return "<tr><td>" + (i + 1) + "</td><td>" +
          fmtNum(r.x, 2) + "</td><td>" + fmtNum(r.y, 3) + "</td></tr>";
      }).join("");
    } else {
      var keys = [];
      rows.forEach(function (r) {
        if (r && typeof r === "object") {
          Object.keys(r).forEach(function (k) {
            if (keys.indexOf(k) === -1) keys.push(k);
          });
        }
      });
      if (!keys.length) {
        body = rows.map(function (r, i) {
          return "<tr><td>" + (i + 1) + "</td><td>" + esc(r) + "</td></tr>";
        }).join("");
        return "<table><thead><tr><th>S. No.</th><th>Observation</th></tr></thead><tbody>" +
          body + "</tbody></table>";
      }
      heads = "<tr><th>S. No.</th>" + keys.map(function (k) {
        return "<th>" + esc(k) + "</th>";
      }).join("") + "</tr>";
      body = rows.map(function (r, i) {
        return "<tr><td>" + (i + 1) + "</td>" + keys.map(function (k) {
          return "<td>" + esc(r ? r[k] : "") + "</td>";
        }).join("") + "</tr>";
      }).join("");
    }
    return "<table><thead>" + heads + "</thead><tbody>" + body + "</tbody></table>";
  }

  /* Stats may be {mean, stderr|err, n} or a generic results object. */
  function statsBlock(stats) {
    var s = stats && typeof stats === "object" ? stats : {};
    var mean = (s.mean != null) ? fmtNum(s.mean, 3) : (s["Mean y"] != null ? esc(s["Mean y"]) : "—");
    var err = (s.stderr != null) ? fmtNum(s.stderr, 3)
      : (s.err != null) ? fmtNum(s.err, 3)
      : (s["Std. Error"] != null ? esc(s["Std. Error"]) : "—");
    var n = (s.n != null) ? esc(s.n)
      : (s.trials != null) ? esc(s.trials) : "—";
    var extraKeys = Object.keys(s).filter(function (k) {
      return ["mean", "stderr", "err", "n", "trials", "Mean y", "Std. Error"].indexOf(k) === -1;
    });
    var extra = extraKeys.map(function (k) {
      return '<div><b>' + esc(k) + ":</b> " + esc(s[k]) + "</div>";
    }).join("");
    return '<div class="res"><span><b>Mean:</b> ' + mean + "</span>" +
      "<span><b>Std. Error:</b> " + err + "</span>" +
      "<span><b>Trials (n):</b> " + n + "</span></div>" + extra;
  }

  /**
   * Build a standalone printable lab-report document.
   * @param {object} o {experimentId,title,readings,stats,canvasEl,canvasDataURL,
   *   aim,apparatus,theory,viva,quiz,date}
   * @returns {string} full HTML document.
   */
  function buildLabReport(o) {
    o = o || {};
    var expId = o.experimentId || "UNKNOWN";
    var title = o.title || String(expId);
    var date = o.date || new Date().toLocaleDateString();
    var img = o.canvasDataURL || canvasPNG(o.canvasEl);
    var viva = o.viva || { score: "____", total: "____" };
    var quiz = o.quiz || { score: "____", total: "____" };

    return "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>" +
      "<meta name='viewport' content='width=device-width, initial-scale=1'>" +
      "<title>Lab Report &mdash; " + esc(title) + "</title><style>" +
      "body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:34px;max-width:900px;}" +
      "h1{font-size:21px;margin:0 0 4px;}h2{font-size:15px;font-weight:normal;color:#444;margin:0 0 16px;}" +
      "h3{font-size:14px;margin:20px 0 8px;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #999;padding-bottom:4px;}" +
      ".meta{border:1px solid #333;padding:10px 14px;display:flex;gap:26px;flex-wrap:wrap;font-size:13px;margin-bottom:6px;}" +
      "table{border-collapse:collapse;width:100%;font-size:12.5px;}" +
      "th,td{border:1px solid #333;padding:6px 8px;text-align:center;}" +
      "th{background:#eee;}" +
      ".res{display:flex;gap:26px;flex-wrap:wrap;font-size:13.5px;margin-top:6px;}" +
      ".sec{font-size:13px;line-height:1.55;}" +
      "img.snap{max-width:100%;border:1px solid #333;margin-top:8px;}" +
      ".os-dim{color:#888;}" +
      ".sign{display:flex;gap:40px;margin-top:26px;font-size:13px;}" +
      ".sign div{flex:1;border-top:1px solid #333;padding-top:6px;}" +
      ".toolbar{margin:0 0 18px;display:flex;gap:10px;}" +
      ".toolbar button{font-size:14px;padding:8px 18px;cursor:pointer;}" +
      "@media print{body{margin:14mm;}.toolbar{display:none;}}" +
      "</style></head><body>" +
      "<div class='toolbar'><button onclick='window.print()'>Print / Save as PDF</button></div>" +
      "<h1>OpenSchool NCERT &mdash; Practical Lab Report</h1>" +
      "<h2>" + esc(title) + " (Experiment ID: " + esc(expId) + ")</h2>" +
      '<div class="meta"><span><b>Date:</b> ' + esc(date) + "</span>" +
      "<span><b>Student:</b> ____________________</span>" +
      "<span><b>Class / Sec:</b> ________</span>" +
      "<span><b>Roll No:</b> ________</span></div>" +
      "<h3>Aim</h3><div class='sec'>" + (o.aim ? esc(o.aim) : "<span class='os-dim'>As stated in the lab theory section.</span>") + "</div>" +
      "<h3>Apparatus</h3><div class='sec'>" + (o.apparatus ? esc(o.apparatus) : "<span class='os-dim'>As listed for this experiment.</span>") + "</div>" +
      "<h3>Theory Snapshot</h3><div class='sec'>" + (o.theory ? esc(o.theory) : "<span class='os-dim'>Governing relation verified via the simulation; see the Theory tab in the lab.</span>") + "</div>" +
      "<h3>Observations</h3>" + readingsTable(o.readings) +
      "<h3>Result</h3>" + statsBlock(o.stats) +
      "<h3>Graph / Apparatus Snapshot</h3>" +
      (img ? "<img class='snap' alt='Experiment canvas snapshot' src=\"" + img + "\" />"
        : "<p class='os-dim'>No canvas snapshot available (canvas tainted or empty).</p>") +
      "<h3>Viva-Voce</h3><div class='sec'>Offline viva score: <b>" + esc(viva.score) +
      "</b> / " + esc(viva.total) + " &nbsp;&nbsp;|&nbsp;&nbsp; Examiner remarks: ____________________</div>" +
      "<h3>Quiz</h3><div class='sec'>Quiz score: <b>" + esc(quiz.score) +
      "</b> / " + esc(quiz.total) + "</div>" +
      "<div class='sign'><div>Student signature &amp; date</div><div>Teacher signature &amp; date</div></div>" +
      "<div class='sec' style='margin-top:14px'><b>Remarks:</b> _______________________________________________</div>" +
      "</body></html>";
  }

  /* Convenience: open the report in a new window and trigger print. */
  function printLabReport(o) {
    var html = buildLabReport(o);
    try {
      var w = global.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(function () { try { w.print(); } catch (e) { /* noop */ } }, 350);
      }
    } catch (e) { /* popup blocked: caller still has the HTML string */ }
    return html;
  }

  global.OSReport = {
    buildLabReport: buildLabReport,
    printLabReport: printLabReport
  };
})(typeof window !== "undefined" ? window : this);
