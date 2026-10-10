/* ==========================================================================
   OpenSchool NCERT — Physics/Chemistry reference kernels + unit tests
   assets/js/kernel-tests.js
   Zero-dependency, zero-build. Pure deterministic asserts for ~10 kernels
   (no DOM, no Jest). Run offline via tests.html, or under node:
       node -e "require('./assets/js/kernel-tests.js'); ..."
   Each entry: { id, kernel, expected, tol, unit, note }.
   Expected values are hand-derived from the governing equations (see notes);
   tolerances are absolute and generous enough for double precision.
   ========================================================================== */
(function (root) {
  "use strict";

  /* ------------------------- reference kernels ------------------------- */
  var K = {
    /* Simple pendulum, small-angle: T = 2π√(L/g). L in m, g in m/s². */
    pendulumPeriod: function (L, g) {
      return 2 * Math.PI * Math.sqrt(L / g);
    },
    /* Doppler (stationary observer, source moving toward +ve = approaching):
       f' = f·v / (v − vs). Speeds in m/s. */
    dopplerObserved: function (f, vs, v) {
      return (f * v) / (v - vs);
    },
    /* Photoelectric: KE(eV) = h·f − φ, h in eV·s, f in Hz, φ in eV. */
    photoelectricKE: function (freqHz, workFnEV) {
      var H_EV_S = 4.135667696e-15;
      return H_EV_S * freqHz - workFnEV;
    },
    /* Radioactive decay: N = N0·(1/2)^(t / halfLife). */
    decayRemaining: function (N0, t, halfLife) {
      return N0 * Math.pow(0.5, t / halfLife);
    },
    /* Half-life from decay constant: T½ = ln2 / λ. */
    halfLifeFromLambda: function (lambda) {
      return Math.LN2 / lambda;
    },
    /* Compound microscope magnifying power: M = (L/fo)·(1 + D/fe). */
    microscopeM: function (tubeL, fObj, nearD, fEye) {
      return (tubeL / fObj) * (1 + nearD / fEye);
    },
    /* Beer–Lambert: A = ε·l·c. */
    beerLambertA: function (epsilon, pathL, conc) {
      return epsilon * pathL * conc;
    },
    /* Transmittance % from absorbance: T% = 100·10^(−A). */
    transmittancePct: function (A) {
      return 100 * Math.pow(10, -A);
    },
    /* Henderson–Hasselbalch: pH = pKa + log10([A−]/[HA]). */
    hendersonHasselbalch: function (pKa, ratioBaseAcid) {
      return pKa + Math.log(ratioBaseAcid) / Math.LN10;
    },
    /* Ksp of Ca(OH)2 from molar solubility s: Ksp = 4s³. */
    kspCalciumHydroxide: function (s) {
      return 4 * s * s * s;
    },
    /* Iodine-clock initial rate: rate = k·[A]^m·[B]^n (M/s). */
    iodineRate: function (k, concA, orderA, concB, orderB) {
      return k * Math.pow(concA, orderA) * Math.pow(concB, orderB);
    },
    /* Bohr: photon wavelength (nm) for n_hi → n_lo: 1/λ = R(1/n_lo² − 1/n_hi²). */
    bohrLambdaNm: function (nHi, nLo) {
      var R = 1.097373e7; // m⁻¹
      var inv = R * (1 / (nLo * nLo) - 1 / (nHi * nHi));
      return 1e9 / inv;
    },
    /* Bohr level energy: E_n = −13.6/n² (eV). */
    bohrEnergyEV: function (n) {
      return -13.6 / (n * n);
    }
  };

  /* ------------------------------ tests -------------------------------- */
  var TESTS = [
    {
      id: "pendulum-period",
      kernel: "pendulumPeriod", args: [1.0, 9.81],
      expected: 2.0061, tol: 1e-3, unit: "s",
      note: "T = 2π√(1/9.81) ≈ 2.00607 s"
    },
    {
      id: "doppler-approaching",
      kernel: "dopplerObserved", args: [440, 10, 343],
      expected: 453.21, tol: 0.05, unit: "Hz",
      note: "f′ = 440·343/333 ≈ 453.213 Hz"
    },
    {
      id: "doppler-receding",
      kernel: "dopplerObserved", args: [440, -10, 343],
      expected: 427.54, tol: 0.05, unit: "Hz",
      note: "f′ = 440·343/353 ≈ 427.535 Hz"
    },
    {
      id: "photoelectric-ke",
      kernel: "photoelectricKE", args: [1.2e15, 2.3],
      expected: 2.663, tol: 1e-3, unit: "eV",
      note: "KE = 4.135667696e-15·1.2e15 − 2.3 ≈ 2.6628 eV"
    },
    {
      id: "decay-three-halflives",
      kernel: "decayRemaining", args: [1000, 3, 1],
      expected: 125, tol: 1e-9, unit: "nuclei",
      note: "N = 1000·(1/2)³ = 125"
    },
    {
      id: "decay-halflife-from-lambda",
      kernel: "halfLifeFromLambda", args: [0.231049],
      expected: 3.0, tol: 1e-2, unit: "days",
      note: "T½ = ln2/0.231049 ≈ 3.000 days"
    },
    {
      id: "microscope-magnification",
      kernel: "microscopeM", args: [20, 2, 25, 5],
      expected: 60, tol: 1e-9, unit: "×",
      note: "M = (20/2)·(1 + 25/5) = 10·6 = 60"
    },
    {
      id: "beer-lambert-absorbance",
      kernel: "beerLambertA", args: [1.5e4, 1, 1e-4],
      expected: 1.5, tol: 1e-9, unit: "AU",
      note: "A = 1.5e4·1·1e-4 = 1.5"
    },
    {
      id: "beer-lambert-transmittance",
      kernel: "transmittancePct", args: [1.5],
      expected: 3.1623, tol: 1e-3, unit: "%",
      note: "T% = 100·10^(−1.5) ≈ 3.1623%"
    },
    {
      id: "henderson-hasselbalch",
      kernel: "hendersonHasselbalch", args: [4.76, 2],
      expected: 5.061, tol: 1e-3, unit: "pH",
      note: "pH = 4.76 + log10(2) ≈ 5.06103"
    },
    {
      id: "ksp-calcium-hydroxide",
      kernel: "kspCalciumHydroxide", args: [0.011],
      expected: 5.324e-6, tol: 1e-8, unit: "",
      note: "Ksp = 4·(0.011)³ = 5.324e-6"
    },
    {
      id: "iodine-clock-rate",
      kernel: "iodineRate", args: [0.02, 0.1, 1, 0.2, 1],
      expected: 4e-4, tol: 1e-12, unit: "M/s",
      note: "rate = 0.02·0.10·0.20 = 4.0e-4 M/s"
    },
    {
      id: "bohr-balmer-h-alpha",
      kernel: "bohrLambdaNm", args: [3, 2],
      expected: 656.11, tol: 0.5, unit: "nm",
      note: "3→2 with R∞: λ ≈ 656.11 nm"
    },
    {
      id: "bohr-level-n2",
      kernel: "bohrEnergyEV", args: [2],
      expected: -3.4, tol: 1e-9, unit: "eV",
      note: "E₂ = −13.6/4 = −3.4 eV"
    }
  ];

  function runOne(entry) {
    var fn = K[entry.kernel];
    var actual = fn.apply(null, entry.args);
    var pass = typeof actual === "number" && isFinite(actual) &&
      Math.abs(actual - entry.expected) <= entry.tol;
    return { id: entry.id, kernel: entry.kernel, expected: entry.expected, tol: entry.tol, unit: entry.unit, note: entry.note, actual: actual, pass: pass };
  }

  function runAll() {
    var out = [];
    for (var i = 0; i < TESTS.length; i++) out.push(runOne(TESTS[i]));
    return out;
  }

  root.OS_KERNELS = K;
  root.OS_KERNEL_TESTS = TESTS;
  root.OS_KERNEL_RUN = runAll;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { kernels: K, tests: TESTS, run: runAll };
  }
})(typeof window !== "undefined" ? window : globalThis);
