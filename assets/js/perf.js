/* OpenSchool perf helpers — zero dependencies, offline-first. */
(function () {
  "use strict";
  function rafThrottle(fn) {
    var scheduled = false, lastArgs = null, lastCtx = null;
    return function () {
      lastArgs = arguments;
      lastCtx = this;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        fn.apply(lastCtx, lastArgs);
      });
    };
  }
  function debounce(fn, ms) {
    var t = null;
    var wait = typeof ms === "number" ? ms : 120;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }
  window.OSPerf = { rafThrottle: rafThrottle, debounce: debounce };
})();
