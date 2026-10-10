"use strict";
/* OpenSchool offline MCQ bank merger — zero dependencies, no fetch/CDN.
   Merges window.OS_QUIZ_PART1..PART5 (assets/js/quiz-bank-1.js..5.js) into
   window.OS_QUIZ_BANK. Missing parts are tolerated (empty-object fallback),
   so a lab still renders whatever banks did load. Later parts win on
   duplicate keys. */
(function () {
  window.OS_QUIZ_BANK = Object.assign({},
    window.OS_QUIZ_PART1 || {},
    window.OS_QUIZ_PART2 || {},
    window.OS_QUIZ_PART3 || {},
    window.OS_QUIZ_PART4 || {},
    window.OS_QUIZ_PART5 || {});
  /* Hindi overlay bank (aligned by index with EN bank; answer indices live
     only in EN). Parts missing at load time are tolerated. */
  window.OS_QUIZ_BANK_HI = Object.assign({},
    window.OS_QUIZ_HI_1 || {},
    window.OS_QUIZ_HI_2 || {},
    window.OS_QUIZ_HI_3 || {},
    window.OS_QUIZ_HI_4 || {},
    window.OS_QUIZ_HI_5 || {});
})();
