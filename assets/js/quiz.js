"use strict";
/* OpenSchool offline MCQ quiz renderer — zero dependencies, no fetch/CDN.
   window.OSQuiz = { getQuestions(experimentId), renderInto(container, experimentId, opts) }
   Renders up to 5 MCQs with native radio inputs (keyboard accessible),
   deterministic grading (bank order, index comparison), score display,
   and notebook persistence via LabNotebook.saveViva when available. */
window.OSQuiz = (function () {
  function bank() {
    return (window.OS_QUIZ_BANK && typeof window.OS_QUIZ_BANK === "object") ? window.OS_QUIZ_BANK : {};
  }

  function hiBank() {
    return (window.OS_QUIZ_BANK_HI && typeof window.OS_QUIZ_BANK_HI === "object") ? window.OS_QUIZ_BANK_HI : null;
  }

  /* Hindi when OS_I18N.getLang()==='hi', else document <html lang="hi">. */
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

  /* Overlay Hindi text onto EN items by index. Answer indices are NEVER
     taken from HI (options order preserved, so EN indices stay valid). */
  function applyHi(list, id, base) {
    var hb = hiBank();
    if (!hb) return list;
    var arr = null;
    if (Object.prototype.hasOwnProperty.call(hb, id) && Array.isArray(hb[id])) arr = hb[id];
    else if (base !== id && Object.prototype.hasOwnProperty.call(hb, base) && Array.isArray(hb[base])) arr = hb[base];
    if (!arr) return list;
    return list.map(function (item, i) {
      var h = arr[i];
      if (!h || typeof h.q_hi !== "string") return item;
      return {
        q: h.q_hi,
        options: (Array.isArray(h.options_hi) && h.options_hi.length === (item.options || []).length)
          ? h.options_hi.slice() : item.options,
        answer: item.answer,
        explain: (typeof h.explain_hi === "string" && h.explain_hi) ? h.explain_hi : item.explain
      };
    });
  }

  /* Exact match first, then strip "_SUFFIX" lab variants (e.g.
     P-C12-10_SALT_ANALYSIS -> P-C12-10). Deterministic. */
  function getQuestions(experimentId) {
    var b = bank();
    if (!experimentId) return [];
    var id = String(experimentId);
    var list = null; var base = id.split("_")[0];
    if (Object.prototype.hasOwnProperty.call(b, id) && Array.isArray(b[id])) list = b[id];
    else if (base !== id && Object.prototype.hasOwnProperty.call(b, base) && Array.isArray(b[base])) list = b[base];
    else return [];
    if (isHi()) return applyHi(list, id, base);
    return list;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* Chrome i18n: OS_I18N keys with identical-English fallback (guarded). */
  function t(k, fb) {
    try { if (window.OS_I18N) return window.OS_I18N.t(k); } catch (e) {}
    return fb;
  }

  function renderInto(container, experimentId, opts) {
    opts = opts || {};
    var count = opts.count > 0 ? opts.count : 5;
    var qs = getQuestions(experimentId).slice(0, count);
    container.innerHTML = "";
    container.setAttribute("data-os-quiz-done", "1");

    if (!qs.length) {
      container.innerHTML = '<div class="os-callout warn"><h4>Quiz unavailable</h4><span>' +
        "No MCQ set is mapped to experiment <b>" + esc(experimentId || "unknown") +
        "</b> yet. The offline viva tab above still works.</span></div>";
      return { score: 0, total: 0, graded: false };
    }

    var form = document.createElement("form");
    form.className = "os-quiz";
    form.setAttribute("novalidate", "novalidate");

    qs.forEach(function (item, qi) {
      var fs = document.createElement("fieldset");
      fs.className = "os-quiz-q";
      fs.setAttribute("role", "radiogroup");
      fs.setAttribute("aria-label", "Question " + (qi + 1) + " of " + qs.length);
      var lg = document.createElement("legend");
      lg.innerHTML = "<b>Q" + (qi + 1) + ".</b> " + esc(item.q);
      fs.appendChild(lg);
      (item.options || []).forEach(function (opt, oi) {
        var label = document.createElement("label");
        label.className = "os-quiz-opt";
        var radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "osq_" + qi;
        radio.value = String(oi);
        label.appendChild(radio);
        label.appendChild(document.createTextNode(" " + opt));
        fs.appendChild(label);
      });
      var fb = document.createElement("div");
      fb.className = "os-quiz-feedback";
      fb.setAttribute("aria-live", "polite");
      fs.appendChild(fb);
      form.appendChild(fs);
    });

    var row = document.createElement("div");
    row.className = "os-row";
    row.style.marginTop = "10px";
    var submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "os-btn primary";
    submit.textContent = t("quiz.submit", "Submit Quiz");
    row.appendChild(submit);
    var retry = document.createElement("button");
    retry.type = "button";
    retry.className = "os-btn";
    retry.textContent = t("quiz.retry", "Retry");
    retry.style.display = "none";
    row.appendChild(retry);
    form.appendChild(row);

    var score = document.createElement("div");
    score.className = "os-callout";
    score.style.display = "none";
    score.setAttribute("role", "status");
    score.setAttribute("aria-live", "polite");
    form.appendChild(score);
    container.appendChild(form);

    var result = { score: 0, total: qs.length, graded: false };

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var correct = 0;
      var answers = [];
      var sets = form.querySelectorAll("fieldset.os-quiz-q");
      qs.forEach(function (item, qi) {
        var checked = form.querySelector('input[name="osq_' + qi + '"]:checked');
        var picked = checked ? parseInt(checked.value, 10) : -1;
        var ok = picked === item.answer;
        if (ok) correct++;
        answers.push({ q: item.q, picked: picked, answer: item.answer, correct: ok });
        var box = sets[qi];
        var fb = box.querySelector(".os-quiz-feedback");
        var exp = item.explain ? "<br><b>Why:</b> " + esc(item.explain) : "";
        if (picked === -1) {
          fb.innerHTML = '<span class="os-quiz-missed">Not answered. Correct option: <b>' +
            esc(item.options[item.answer]) + "</b>." + exp + "</span>";
        } else if (ok) {
          fb.innerHTML = '<span class="os-quiz-ok">Correct.</span>' + exp;
        } else {
          fb.innerHTML = '<span class="os-quiz-bad">Incorrect — you chose <b>' +
            esc(item.options[picked]) + "</b>; correct: <b>" +
            esc(item.options[item.answer]) + "</b>." + exp + "</span>";
        }
        box.querySelectorAll('input[type="radio"]').forEach(function (r) { r.disabled = true; });
      });
      var pct = Math.round((correct / qs.length) * 100);
      result.score = correct; result.total = qs.length; result.graded = true;
      score.style.display = "block";
      score.className = "os-callout " + (pct >= 60 ? "ok" : "warn");
      score.innerHTML = "<h4>" + t("quiz.score", "Quiz score") + ": " + correct + " / " + qs.length + " (" + pct + "%)</h4>" +
        "<span>" + (pct >= 60 ? "Good — this attempt was saved to your notebook." : "Keep practising — this attempt was saved to your notebook.") + "</span>";
      submit.disabled = true;
      retry.style.display = "";
      try {
        if (window.LabNotebook && typeof window.LabNotebook.saveViva === "function") {
          window.LabNotebook.saveViva(experimentId, {
            score: correct, total: qs.length, percent: pct,
            mode: "mcq-quiz", transcript: [{ percent: pct, answers: answers }]
          });
        }
      } catch (e) { /* notebook optional — score display is unaffected */ }
      /* OS-MISTAKES-HOOK: record each wrong MCQ (guarded, no-op when absent). */
      try {
        if (typeof window.OSMistakes !== "undefined" && window.OSMistakes && typeof window.OSMistakes.record === "function") {
          answers.forEach(function (a) {
            if (!a.correct) {
              var qi = qs.filter(function (item) { return item.q === a.q; })[0] || {};
              var opts = qi.options || [];
              window.OSMistakes.record({
                experimentId: experimentId, q: a.q,
                yourAnswer: a.picked === -1 ? "(unanswered)" : String(opts[a.picked] != null ? opts[a.picked] : a.picked),
                correct: String(opts[qi.answer] != null ? opts[qi.answer] : (a.answer != null ? a.answer : "")),
                explain: qi.explain || "", ts: Date.now()
              });
            }
          });
        }
      } catch (e) { /* mistakes notebook optional */ }
      /* OS-MASTERY-HOOK: +5 XP per correct MCQ (guarded, no-op when absent). */
      try {
        if (typeof window.OSMastery !== "undefined" && window.OSMastery && typeof window.OSMastery.awardQuiz === "function") {
          window.OSMastery.awardQuiz(experimentId, correct);
        }
      } catch (e) { /* mastery optional */ }
    });

    retry.addEventListener("click", function () {
      renderInto(container, experimentId, opts);
    });

    /* Re-render in the new language when the i18n toggle fires, so the
       quiz picks up hi text (or falls back to en) without a reload. */
    try {
      if (typeof document !== "undefined" && document.addEventListener &&
          !container.__osQuizLangWired) {
        container.__osQuizLangWired = true;
        document.addEventListener("os-lang-change", function () {
          if (container.getAttribute("data-os-quiz-done") === "1" &&
              container.contains(form)) {
            renderInto(container, experimentId, opts);
          }
        });
      }
    } catch (e) {}

    return result;
  }

  return { getQuestions: getQuestions, renderInto: renderInto };
})();
