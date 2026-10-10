/* ==========================================================================
   OpenSchool NCERT — Hub + Lab-shell chrome i18n (zero-dependency)
   assets/js/i18n.js
   Covers hub + lab-shell chrome AND per-experiment Hindi overlays
   (catalog titles/aims, 390 quiz MCQs, 78x4 viva, 78 procedure sets)
   via catalog-hi.js / quiz-bank-hi-*.js / viva-bank-hi.js /
   procedure-bank-hi.js. Languages: en + hi. Persists via localStorage.
   Wiring: static text  -> data-i18n="key"
            placeholders -> data-i18n-ph="key"
            toggle buttons -> data-os-lang-toggle="en|hi"
   Dynamic renderers (e.g. hub cards) should use OS_I18N.t() and
   re-render on the "os-lang-change" document event.
   ========================================================================== */
(function (global) {
  "use strict";

  var STORE_KEY = "os-lang";

  var STR = {
    en: {
      "brand.tag": "NCERT VIRTUAL STEM LAB",
      "topbar.notebook": "Notebook:",
      "topbar.mode": "Mode:",
      "topbar.offline": "100% Offline",
      "hero.kicker": "Open-source · Zero-build · Zero-dependency",
      "hero.title": "Virtual STEM Laboratory",
      "hero.sub": "Experiential, apparatus-free science practicals mapped to the NCERT / CBSE Class 9–12 curriculum. Every sandbox runs entirely in your browser — even from a USB stick, with no internet connection.",
      "filters.allClasses": "All Classes",
      "filters.classPrefix": "Class ",
      "filters.class9": "Class 9",
      "filters.class10": "Class 10",
      "filters.class11": "Class 11",
      "filters.class12": "Class 12",
      "filters.allSubjects": "All Subjects",
      "filters.physics": "Physics",
      "filters.chemistry": "Chemistry",
      "filters.biology": "Biology",
      "search.placeholder": "Search experiment, aim, or keyword…",
      "results.experiments": "experiments",
      "results.empty": "No experiments match your filters.",
      "cards.launch": "Launch Lab →",
      "cards.planned": "Planned",
      "footer.note": "OpenSchool NCERT · Static, offline-first, IndexedDB-powered lab notebook ·",
      "storage.persisted": "Trials persist in browser IndexedDB (OpenSchool_NCERT_DB).",
      "storage.memory": "In-memory notebook active (IndexedDB unavailable).",
      "storage.unavailable": "Notebook storage could not initialise.",
      "lab.back": "← Curriculum Hub",
      "lab.apparatus": "Apparatus",
      "lab.engineReady": "Engine ready",
      "lab.observation": "Observation Table",
      "btn.record": "Record Reading",
      "btn.reset": "Reset Apparatus",
      "btn.save": "Save to Notebook",
      "btn.export": "Export CBSE Sheet",
      "btn.clear": "Clear Trials",
      "stats.mean": "Mean y",
      "stats.stderr": "Std. Error",
      "stats.trials": "Trials",
      "trials.unit": "trials",
      "th.num": "#",
      "th.input": "Input x",
      "th.output": "Output y",
      "tabs.theory": "Theory & Diagram",
      "tabs.errors": "Precautions & Errors",
      "tabs.viva": "Viva-Voce Arena",
      "tabs.quiz": "Quiz",
      "tabs.procedure": "Procedure",
      "btn.report": "Print Report",
      "btn.print": "Print",
      "quiz.submit": "Submit Quiz",
      "quiz.retry": "Retry",
      "quiz.score": "Quiz score",
      "procedure.next": "Next →",
      "procedure.prev": "← Prev",
      "procedure.reset": "Reset",
      "procedure.step": "Step",
      "procedure.finish": "Finish ✓",
      "mastery.xp": "XP",
      "mastery.streak": "-day streak",
      "planner.title": "Today's revision",
      "planner.labs": "labs",
      "planner.empty": "All caught up — nothing due for revision.",
      "planner.done": "Done",
      "planner.snooze": "Snooze",
      "mistakes.title": "Mistakes Notebook",
      "mistakes.sub": "Every wrong viva / MCQ answer recorded here. Review, then retry the lab quiz.",
      "mistakes.clear": "Clear all",
      "mistakes.mistakes": "mistakes",
      "mistakes.empty": "No mistakes yet",
      "exam.title": "Timed Practical Paper",
      "exam.setup": "Setup",
      "exam.start": "Start exam",
      "exam.submit": "Submit paper",
      "exam.reset": "Reset",
      "exam.result": "Result sheet",
      "exam.print": "Print result",
      "dashboard.title": "Teacher Dashboard",
      "dashboard.refresh": "Refresh",
      "dashboard.export": "Export JSON",
      "dashboard.import": "Import JSON",
      "dashboard.print": "Print",
      "dashboard.clear": "Clear",
      "formulas.title": "Formula Sheets",
      "formulas.searchPh": "Search formula, keyword, or unit…",
      "formulas.entries": "entries",
      "formulas.print": "Print",
      "tts.read": "Read aloud",
      "tts.theory": "Theory",
      "tts.rate": "Rate",
      "bookmarks.only": "Starred only",
      "bookmarks.starred": "starred",
      "bookmarks.bookmark": "Bookmark",
      "viva.offline": "Offline Viva",
      "viva.ai": "AI Examiner",
      "viva.startOffline": "Start Offline Viva",
      "viva.startAI": "Start AI Viva",
      "viva.send": "Send",
      "viva.answerPh": "Type your answer…"
    },
    hi: {
      "brand.tag": "एनसीईआरटी वर्चुअल STEM लैब",
      "topbar.notebook": "नोटबुक:",
      "topbar.mode": "मोड:",
      "topbar.offline": "100% ऑफ़लाइन",
      "hero.kicker": "ओपन-सोर्स · शून्य-बिल्ड · शून्य-निर्भरता",
      "hero.title": "वर्चुअल STEM प्रयोगशाला",
      "hero.sub": "एनसीईआरटी / सीबीएसई कक्षा 9–12 पाठ्यक्रम से जुड़े, बिना उपकरण वाले अनुभवात्मक विज्ञान प्रैक्टिकल। प्रत्येक सैंडबॉक्स पूरी तरह आपके ब्राउज़र में चलता है — USB स्टिक से भी, बिना इंटरनेट।",
      "filters.allClasses": "सभी कक्षाएँ",
      "filters.classPrefix": "कक्षा ",
      "filters.class9": "कक्षा 9",
      "filters.class10": "कक्षा 10",
      "filters.class11": "कक्षा 11",
      "filters.class12": "कक्षा 12",
      "filters.allSubjects": "सभी विषय",
      "filters.physics": "भौतिकी",
      "filters.chemistry": "रसायन विज्ञान",
      "filters.biology": "जीवविज्ञान",
      "search.placeholder": "प्रयोग, उद्देश्य या कीवर्ड खोजें…",
      "results.experiments": "प्रयोग",
      "results.empty": "आपके फ़िल्टर से कोई प्रयोग मेल नहीं खाता।",
      "cards.launch": "लैब खोलें →",
      "cards.planned": "योजनाबद्ध",
      "footer.note": "ओपनस्कूल एनसीईआरटी · स्थिर, ऑफ़लाइन-प्रथम, IndexedDB-संचालित लैब नोटबुक ·",
      "storage.persisted": "ट्रायल ब्राउज़र IndexedDB (OpenSchool_NCERT_DB) में सहेजे जाते हैं।",
      "storage.memory": "इन-मेमोरी नोटबुक सक्रिय है (IndexedDB उपलब्ध नहीं)।",
      "storage.unavailable": "नोटबुक संग्रहण प्रारंभ नहीं हो सका।",
      "lab.back": "← पाठ्यक्रम हब",
      "lab.apparatus": "उपकरण",
      "lab.engineReady": "इंजन तैयार",
      "lab.observation": "प्रेक्षण तालिका",
      "btn.record": "रीडिंग दर्ज करें",
      "btn.reset": "उपकरण रीसेट करें",
      "btn.save": "नोटबुक में सहेजें",
      "btn.export": "CBSE शीट निर्यात करें",
      "btn.clear": "ट्रायल साफ़ करें",
      "stats.mean": "माध्य y",
      "stats.stderr": "मानक त्रुटि",
      "stats.trials": "ट्रायल",
      "trials.unit": "ट्रायल",
      "th.num": "क्र.",
      "th.input": "इनपुट x",
      "th.output": "आउटपुट y",
      "tabs.theory": "सिद्धांत एवं चित्र",
      "tabs.errors": "सावधानियाँ एवं त्रुटियाँ",
      "tabs.viva": "मौखिक परीक्षा (वाइवा)",
      "tabs.quiz": "प्रश्नोत्तरी",
      "tabs.procedure": "प्रक्रिया",
      "btn.report": "रिपोर्ट प्रिंट करें",
      "btn.print": "प्रिंट करें",
      "quiz.submit": "क्विज़ जमा करें",
      "quiz.retry": "पुनः प्रयास",
      "quiz.score": "क्विज़ स्कोर",
      "procedure.next": "आगे →",
      "procedure.prev": "← पीछे",
      "procedure.reset": "रीसेट",
      "procedure.step": "चरण",
      "procedure.finish": "समाप्त ✓",
      "mastery.xp": "XP",
      "mastery.streak": "-दिन की लड़ी",
      "planner.title": "आज का दोहराव",
      "planner.labs": "प्रयोग",
      "planner.empty": "सब पूरा — दोहराव के लिए कुछ नहीं।",
      "planner.done": "पूर्ण",
      "planner.snooze": "स्थगित करें",
      "mistakes.title": "गलती नोटबुक",
      "mistakes.sub": "प्रत्येक गलत वाइवा / MCQ उत्तर यहाँ दर्ज है। समीक्षा करें, फिर लैब क्विज़ दोहराएँ।",
      "mistakes.clear": "सभी साफ़ करें",
      "mistakes.mistakes": "गलतियाँ",
      "mistakes.empty": "अभी कोई गलती नहीं",
      "exam.title": "समयबद्ध प्रैक्टिकल पेपर",
      "exam.setup": "सेटअप",
      "exam.start": "परीक्षा शुरू करें",
      "exam.submit": "पेपर जमा करें",
      "exam.reset": "रीसेट",
      "exam.result": "परिणाम पत्रक",
      "exam.print": "परिणाम प्रिंट करें",
      "dashboard.title": "शिक्षक डैशबोर्ड",
      "dashboard.refresh": "ताज़ा करें",
      "dashboard.export": "JSON निर्यात करें",
      "dashboard.import": "JSON आयात करें",
      "dashboard.print": "प्रिंट करें",
      "dashboard.clear": "साफ़ करें",
      "formulas.title": "सूत्र पत्रक",
      "formulas.searchPh": "सूत्र, कीवर्ड या मात्रक खोजें…",
      "formulas.entries": "प्रविष्टियाँ",
      "formulas.print": "प्रिंट करें",
      "tts.read": "ज़ोर से पढ़ें",
      "tts.theory": "सिद्धांत",
      "tts.rate": "गति",
      "bookmarks.only": "केवल तारांकित",
      "bookmarks.starred": "तारांकित",
      "bookmarks.bookmark": "बुकमार्क",
      "viva.offline": "ऑफ़लाइन वाइवा",
      "viva.ai": "AI परीक्षक",
      "viva.startOffline": "ऑफ़लाइन वाइवा शुरू करें",
      "viva.startAI": "AI वाइवा शुरू करें",
      "viva.send": "भेजें",
      "viva.answerPh": "अपना उत्तर लिखें…"
    }
  };

  function getLang() {
    try {
      var v = global.localStorage ? global.localStorage.getItem(STORE_KEY) : null;
      return v === "hi" ? "hi" : "en";
    } catch (e) { return "en"; }
  }

  function t(key, lang) {
    var L = lang || getLang();
    if (STR[L] && STR[L][key] != null) return STR[L][key];
    if (STR.en[key] != null) return STR.en[key];
    return key;
  }

  function markToggles(lang) {
    var btns = document.querySelectorAll("[data-os-lang-toggle]");
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute("data-os-lang-toggle") === lang) btns[i].classList.add("active");
      else btns[i].classList.remove("active");
    }
  }

  function apply(lang) {
    lang = lang === "hi" ? "hi" : "en";
    try { document.documentElement.setAttribute("lang", lang); } catch (e) {}
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = t(els[i].getAttribute("data-i18n"), lang);
    }
    var phs = document.querySelectorAll("[data-i18n-ph]");
    for (var j = 0; j < phs.length; j++) {
      phs[j].setAttribute("placeholder", t(phs[j].getAttribute("data-i18n-ph"), lang));
    }
    markToggles(lang);
  }

  function setLang(lang) {
    lang = lang === "hi" ? "hi" : "en";
    try { if (global.localStorage) global.localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    apply(lang);
    try {
      if (typeof document !== "undefined" && document.dispatchEvent) {
        document.dispatchEvent(new CustomEvent("os-lang-change", { detail: { lang: lang } }));
      }
    } catch (e) {}
    return lang;
  }

  function wireToggles() {
    var btns = document.querySelectorAll("[data-os-lang-toggle]");
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        if (b.__osLangWired) return;
        b.__osLangWired = true;
        b.addEventListener("click", function () { setLang(b.getAttribute("data-os-lang-toggle")); });
      })(btns[i]);
    }
  }

  function boot() {
    apply(getLang());
    wireToggles();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  global.OS_I18N = { STR: STR, getLang: getLang, setLang: setLang, apply: apply, t: t };
})(typeof window !== "undefined" ? window : this);
