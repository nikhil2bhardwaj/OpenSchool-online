/* ==========================================================================
   OpenSchool NCERT - Deterministic Graph / Curve-Fit Helper (F5)
   assets/js/graph.js
   Zero deps. Pure deterministic least-squares math + a small canvas renderer.
   window.OSGraph = { linearFit(xs, ys), renderFit(canvas, xs, ys, opts) }.
   ========================================================================== */
(function (global) {
  "use strict";

  function toNums(a) {
    return (Array.isArray(a) ? a : []).map(function (v) { return Number(v); });
  }

  /**
   * Ordinary least-squares linear fit y = m*x + c.
   * @param {number[]} xs @param {number[]} ys
   * @returns {{slope:number,intercept:number,r2:number,n:number}|null}
   *   null when inputs are unusable (length mismatch, n<2, non-finite,
   *   zero x-variance). Deterministic: no randomness, no iteration.
   */
  function linearFit(xs, ys) {
    var X = toNums(xs), Y = toNums(ys);
    var n = Math.min(X.length, Y.length);
    if (n < 2) return null;
    X = X.slice(0, n); Y = Y.slice(0, n);
    for (var i = 0; i < n; i++) {
      if (!isFinite(X[i]) || !isFinite(Y[i])) return null;
    }
    var sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (i = 0; i < n; i++) { sx += X[i]; sy += Y[i]; sxx += X[i] * X[i]; sxy += X[i] * Y[i]; }
    var denom = n * sxx - sx * sx;
    if (denom === 0 || !isFinite(denom)) return null;
    var slope = (n * sxy - sx * sy) / denom;
    var intercept = (sy - slope * sx) / n;
    if (!isFinite(slope) || !isFinite(intercept)) return null;
    var meanY = sy / n, ssTot = 0, ssRes = 0;
    for (i = 0; i < n; i++) {
      ssTot += (Y[i] - meanY) * (Y[i] - meanY);
      var r = Y[i] - (slope * X[i] + intercept);
      ssRes += r * r;
    }
    var r2 = (ssTot === 0) ? 0 : 1 - ssRes / ssTot;
    if (!isFinite(r2)) r2 = 0;
    if (r2 < 0 && r2 > -1e-12) r2 = 0;
    return { slope: slope, intercept: intercept, r2: r2, n: n };
  }

  /**
   * Plot points + best-fit line on a canvas. Deterministic scaling.
   * @param {HTMLCanvasElement} canvas
   * @param {number[]} xs @param {number[]} ys
   * @param {object} [opts] {xLabel,yLabel,pointColor,lineColor}
   * @returns fit object or null (canvas cleared with a hint when no fit).
   */
  function renderFit(canvas, xs, ys, opts) {
    if (!canvas || typeof canvas.getContext !== "function") return null;
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;
    var o = opts || {};
    var W = canvas.width, H = canvas.height;
    var padL = 44, padR = 12, padT = 12, padB = 30;
    function frame(msg) {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0d1728"); g.addColorStop(1, "#0a111e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#8fa3c8"; ctx.font = "12px system-ui, sans-serif";
      ctx.fillText(msg, padL, H / 2);
    }
    var X = toNums(xs), Y = toNums(ys);
    var n = Math.min(X.length, Y.length);
    var fit = linearFit(X, Y);
    if (!fit) {
      frame(n < 2 ? "Record at least 2 readings to see the best-fit line." : "Best-fit unavailable for these readings.");
      return null;
    }
    X = X.slice(0, fit.n); Y = Y.slice(0, fit.n);
    var x0 = Math.min.apply(null, X), x1 = Math.max.apply(null, X);
    var ys2 = Y.concat([fit.slope * x0 + fit.intercept, fit.slope * x1 + fit.intercept]);
    var y0 = Math.min.apply(null, ys2), y1 = Math.max.apply(null, ys2);
    if (x1 === x0) { x0 -= 1; x1 += 1; }
    if (y1 === y0) { y0 -= 1; y1 += 1; }
    var dx = (x1 - x0) * 0.08, dy = (y1 - y0) * 0.12;
    x0 -= dx; x1 += dx; y0 -= dy; y1 += dy;
    function px(x) { return padL + ((x - x0) / (x1 - x0)) * (W - padL - padR); }
    function py(y) { return (H - padB) - ((y - y0) / (y1 - y0)) * (H - padT - padB); }

    var g2 = ctx.createLinearGradient(0, 0, 0, H);
    g2.addColorStop(0, "#0d1728"); g2.addColorStop(1, "#0a111e");
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(120,160,220,.15)"; ctx.lineWidth = 1;
    for (var gi = 0; gi <= 4; gi++) {
      var gy = padT + (gi / 4) * (H - padT - padB);
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
    }
    ctx.strokeStyle = "#5f7aa8"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB);
    ctx.stroke();
    // best-fit line
    ctx.strokeStyle = o.lineColor || "#ff9f43"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px(x0), py(fit.slope * x0 + fit.intercept));
    ctx.lineTo(px(x1), py(fit.slope * x1 + fit.intercept)); ctx.stroke();
    // data points
    ctx.fillStyle = o.pointColor || "#38e0a1";
    for (var i = 0; i < fit.n; i++) {
      ctx.beginPath(); ctx.arc(px(X[i]), py(Y[i]), 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#c9d6ee"; ctx.font = "12px system-ui, sans-serif";
    var eq = "y = " + fit.slope.toFixed(3) + "·x + " + fit.intercept.toFixed(3) + "   (R² = " + fit.r2.toFixed(4) + ")";
    ctx.fillText(eq, padL, H - 8);
    if (o.xLabel || o.yLabel) {
      ctx.fillStyle = "#8fa3c8";
      if (o.xLabel) ctx.fillText(String(o.xLabel), W - padR - ctx.measureText(String(o.xLabel)).width, H - 8 - 16);
    }
    return fit;
  }

  global.OSGraph = {
    linearFit: linearFit,
    renderFit: renderFit
  };
})(typeof window !== "undefined" ? window : this);
