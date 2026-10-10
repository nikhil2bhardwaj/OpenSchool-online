/* OpenSchool Online — apparatus3d.js
   Three.js apparatus viewer (CDN import, module script).
   Usage: <div id="apparatus3d" data-apparatus="optical-bench|pendulum|burette|thermo-beaker|circuit|magnet|microscope|bio-dish|prism"></div>
          <script type="module" src="../assets/js/apparatus3d.js"></script>
   - Switches scene by the data-apparatus attribute (generic dioramas;
     live-linked to lab sliders where present).
   - 2D-canvas fallback schematic when WebGL is missing or the CDN import fails.
   - Calm motion only (slow sway/pulse, transform-only), single RAF loop per
     viewer, frozen single frame under prefers-reduced-motion.
    - Drag yaws the rig (smoothed toward a target yaw); arrow keys rotate
      when the canvas is focused; touch scroll preserved via touch-action. */
(function () {
  "use strict";

  var CDN_URL = "https://unpkg.com/three@0.160.0/build/three.module.js";

  function reducedMotion() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { return false; }
  }

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (e) { return false; }
  }

  function readNum(id, fallback) {
    try {
      var el = document.getElementById(id);
      if (!el) return fallback;
      var v = parseFloat(el.value);
      return isFinite(v) ? v : fallback;
    } catch (e) { return fallback; }
  }

  function readFirst(ids, fallback) {
    for (var i = 0; i < ids.length; i++) {
      try {
        var el = document.getElementById(ids[i]);
        if (!el) continue;
        var v = parseFloat(el.value);
        if (isFinite(v)) return v;
      } catch (e) { /* keep looking */ }
    }
    return fallback;
  }

  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }

  /* ---- 2D fallback: schematic per apparatus kind ------------------------ */
  function renderFallback(mount, kind) {
    mount.classList.add("is-2d");
    var cv = document.createElement("canvas");
    cv.width = 640; cv.height = 420;
    cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", "2D schematic fallback (" + kind + "). WebGL unavailable.");
    mount.appendChild(cv);
    var ctx = cv.getContext("2d");
    var w = cv.width, h = cv.height;
    ctx.fillStyle = "#0d1b2a"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(79,214,255,.25)"; ctx.lineWidth = 1;
    for (var gx = 0; gx <= w; gx += 32) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (var gy = 0; gy <= h; gy += 32) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
    var axisY = 150;
    ctx.strokeStyle = "#f4f1e3"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(20, axisY); ctx.lineTo(w - 20, axisY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#4fd6ff"; ctx.strokeStyle = "#4fd6ff";
    if (kind === "pendulum") {
      var px = w / 2, py = 40, L = 150, th = 0.35;
      var bx = px + Math.sin(th) * L, by = py + Math.cos(th) * L;
      ctx.fillRect(px - 60, 24, 120, 10);
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2); ctx.fill();
    } else if (kind === "burette") {
      ctx.strokeStyle = "#9fd8ff"; ctx.lineWidth = 3;
      ctx.strokeRect(w / 2 - 16, 50, 32, 160);
      ctx.fillStyle = "rgba(80,170,255,.55)"; ctx.fillRect(w / 2 - 14, 130, 28, 78);
      ctx.fillStyle = "#4fd6ff"; ctx.fillRect(w / 2 - 70, 230, 140, 8);
      ctx.beginPath(); ctx.moveTo(w / 2, 210); ctx.lineTo(w / 2, 230); ctx.stroke();
    } else if (kind === "thermo-beaker") {
      ctx.fillStyle = "#5b6b7a"; ctx.fillRect(60, 300, w - 120, 12);
      ctx.fillStyle = "#8fa3c7"; ctx.fillRect(w / 2 - 90, 250, 26, 52);
      ctx.fillStyle = "#ff9a3c";
      ctx.beginPath(); ctx.moveTo(w / 2 - 77, 236); ctx.lineTo(w / 2 - 63, 250); ctx.lineTo(w / 2 - 91, 250); ctx.fill();
      ctx.strokeStyle = "#9fd8ff"; ctx.lineWidth = 3;
      ctx.strokeRect(w / 2 - 40, 130, 120, 130);
      ctx.fillStyle = "rgba(255,154,60,.6)"; ctx.fillRect(w / 2 - 37, 190, 114, 67);
      ctx.strokeStyle = "#ff6a6a"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(w / 2 + 110, 120); ctx.lineTo(w / 2 + 110, 260); ctx.stroke();
      ctx.fillStyle = "#ff6a6a"; ctx.beginPath(); ctx.arc(w / 2 + 110, 268, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9fd8ff"; ctx.font = "11px system-ui"; ctx.textAlign = "center";
      ctx.fillText("THERMO", w / 2 + 20, 285);
    } else if (kind === "circuit") {
      ctx.strokeStyle = "#4fd6ff"; ctx.lineWidth = 3;
      ctx.strokeRect(90, 150, 460, 140);
      ctx.fillStyle = "#16233d"; ctx.fillRect(250, 128, 140, 44);
      ctx.fillStyle = "#e8b34b"; ctx.fillRect(258, 136, 30, 28);
      ctx.fillStyle = "#8fa3c7"; ctx.fillRect(352, 136, 30, 28);
      ctx.fillStyle = "#0d1b2a"; ctx.font = "bold 20px system-ui"; ctx.textAlign = "center";
      ctx.fillStyle = "#f4f1e3"; ctx.fillText("+", 273, 158); ctx.fillText("-", 367, 158);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 4;
      ctx.beginPath();
      var zx = 120;
      ctx.moveTo(zx, 290);
      for (var zi = 0; zi < 6; zi++) { zx += 14; ctx.lineTo(zx, zi % 2 ? 272 : 290); }
      ctx.stroke();
      ctx.strokeStyle = "#9fd8ff"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(480, 220, 34, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(480, 220); ctx.lineTo(498, 200); ctx.stroke();
      ctx.fillStyle = "#9fd8ff"; ctx.font = "11px system-ui"; ctx.fillText("CIRCUIT  (A)", 320, 320);
    } else if (kind === "magnet") {
      ctx.fillStyle = "#e5484d"; ctx.fillRect(w / 2 - 130, axisY - 26, 130, 52);
      ctx.fillStyle = "#e8eef5"; ctx.fillRect(w / 2, axisY - 26, 130, 52);
      ctx.fillStyle = "#0d1b2a"; ctx.font = "bold 22px system-ui"; ctx.textAlign = "center";
      ctx.fillText("N", w / 2 - 65, axisY + 8); ctx.fillText("S", w / 2 + 65, axisY + 8);
      ctx.strokeStyle = "rgba(255,209,102,.85)"; ctx.lineWidth = 2;
      [-90, -60, -32, 32, 60, 90].forEach(function (dx) {
        ctx.beginPath();
        ctx.ellipse(w / 2, axisY, 150 + Math.abs(dx), 44 + Math.abs(dx) * 0.55, 0, -1.25, 1.25);
        ctx.stroke();
      });
      ctx.fillStyle = "#9fd8ff"; ctx.font = "11px system-ui"; ctx.fillText("BAR MAGNET + FIELD LINES", w / 2, 300);
    } else if (kind === "microscope") {
      ctx.fillStyle = "#5b6b7a"; ctx.fillRect(w / 2 - 90, 320, 180, 12);
      ctx.fillRect(w / 2 - 70, 200, 18, 120);
      ctx.fillStyle = "#8fa3c7"; ctx.fillRect(w / 2 - 100, 250, 170, 10);
      ctx.fillStyle = "#4fd6ff"; ctx.fillRect(w / 2 - 30, 236, 60, 8);
      ctx.fillStyle = "#e8b34b"; ctx.fillRect(w / 2 - 24, 130, 48, 70);
      ctx.fillStyle = "#0d1b2a"; ctx.fillRect(w / 2 - 16, 96, 32, 34);
      [[-18, 74], [0, 80], [18, 74]].forEach(function (o) {
        ctx.fillStyle = "#9fd8ff"; ctx.fillRect(w / 2 + o[0] - 7, 200 - (80 - o[1]), 14, o[1] - 52);
      });
      ctx.fillStyle = "rgba(255,209,102,.9)";
      ctx.beginPath(); ctx.arc(w / 2, 246, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9fd8ff"; ctx.font = "11px system-ui"; ctx.textAlign = "center";
      ctx.fillText("MICROSCOPE", w / 2, 350);
    } else if (kind === "bio-dish") {
      ctx.strokeStyle = "#9fd8ff"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(w / 2, 220, 170, 52, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(232,179,75,.35)";
      ctx.beginPath(); ctx.ellipse(w / 2, 220, 152, 42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#7ee2a8";
      var dots = [[-90, 214], [-52, 228], [-18, 210], [16, 226], [52, 212], [88, 226], [-70, 232], [34, 236], [70, 214], [-30, 236]];
      dots.forEach(function (d, i) {
        ctx.beginPath(); ctx.arc(w / 2 + d[0], d[1], 6 + (i % 3) * 2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = "#9fd8ff"; ctx.font = "11px system-ui"; ctx.textAlign = "center";
      ctx.fillText("PETRI DISH + CULTURE", w / 2, 320);
    } else if (kind === "prism") {
      ctx.fillStyle = "rgba(159,216,255,.35)";
      ctx.strokeStyle = "#9fd8ff"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 90, 260); ctx.lineTo(w / 2 + 90, 260); ctx.lineTo(w / 2, 110); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(60, 190); ctx.lineTo(w / 2 - 20, 190); ctx.stroke();
      ctx.strokeStyle = "#ff9a3c";
      ctx.beginPath(); ctx.moveTo(w / 2 - 20, 190); ctx.lineTo(w - 60, 250); ctx.stroke();
      ctx.strokeStyle = "rgba(126,226,168,.9)";
      ctx.beginPath(); ctx.moveTo(w / 2 - 20, 190); ctx.lineTo(w - 60, 215); ctx.stroke();
      ctx.fillStyle = "#9fd8ff"; ctx.font = "11px system-ui"; ctx.textAlign = "center";
      ctx.fillText("PRISM + DEVIATED RAY", w / 2, 320);
    } else { /* optical-bench */
      ctx.fillStyle = "#5b6b7a"; ctx.fillRect(40, 190, w - 80, 10);
      [[140, "OBJ"], [320, "LENS"], [500, "SCR"]].forEach(function (p) {
        var x = p[0];
        ctx.strokeStyle = "#4fd6ff"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, 190); ctx.stroke();
        ctx.fillStyle = "#9fd8ff"; ctx.font = "11px system-ui"; ctx.textAlign = "center";
        ctx.fillText(p[1], x, 215);
      });
      ctx.strokeStyle = "rgba(255,209,102,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(140, axisY - 30); ctx.lineTo(320, axisY - 30); ctx.lineTo(500, axisY + 20); ctx.stroke();
    }
    var cap = document.createElement("div");
    cap.className = "os-3d-cap";
    cap.textContent = "2D schematic fallback — WebGL or CDN unavailable (" + kind + ").";
    mount.appendChild(cap);
  }

  /* ---- scene builders (pure THREE, no addons) --------------------------- */
  function mat(color, opts) {
    return Object.assign({ color: color }, opts || {});
  }

  function buildOpticalBench(THREE, scene) {
    var g = new THREE.Group();
    var metal = new THREE.MeshStandardMaterial(mat(0x5b6b7a, { roughness: 0.5, metalness: 0.7 }));
    var brass = new THREE.MeshStandardMaterial(mat(0xe8b34b, { roughness: 0.35, metalness: 0.8 }));
    var glass = new THREE.MeshPhysicalMaterial
      ? new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.35, roughness: 0.1 })
      : new THREE.MeshStandardMaterial(mat(0x9fd8ff, { transparent: true, opacity: 0.35 }));
    // rail
    var rail = new THREE.Mesh(new THREE.BoxGeometry(9, 0.25, 0.8), metal);
    rail.position.y = 0; g.add(rail);
    for (var i = -4; i <= 4; i++) {
      var tick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.85),
        new THREE.MeshStandardMaterial(mat(0x8fa3c7)));
      tick.position.set(i, 0.05, 0); g.add(tick);
    }
    // riders: object / lens / screen
    function rider(x, kind) {
      var r = new THREE.Group();
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 16), metal);
      post.position.y = 0.8; r.add(post);
      if (kind === "lens") {
        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 12, 32), brass);
        ring.position.y = 1.9; r.add(ring);
        var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 32), glass);
        disc.rotation.x = Math.PI / 2; disc.position.y = 1.9; r.add(disc);
      } else if (kind === "screen") {
        var scr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 1.8),
          new THREE.MeshStandardMaterial(mat(0xf2f5fa, { roughness: 0.9 })));
        scr.position.y = 1.9; r.add(scr);
      } else {
        var flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 16),
          new THREE.MeshStandardMaterial(mat(0xff9a3c, { emissive: 0xff6a00, emissiveIntensity: 0.9 })));
        flame.position.y = 1.9; r.add(flame);
      }
      r.position.x = x; g.add(r); return r;
    }
    rider(-3, "object"); rider(0, "lens"); rider(3, "screen");
    // travelling light pulse
    var pulse = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd166 }));
    pulse.position.set(-3, 1.9, 0); g.add(pulse);
    scene.add(g);
    return {
      group: g,
      update: function (t) {
        var speed = 0.5 + readNum("fRange", 800) / 4000; // live-link: frequency slider
        var ph = (t * speed) % 2;
        pulse.position.x = -3 + 6 * ph;
        pulse.material.color.setHSL(0.1 + 0.5 * (1 - ph), 0.85, 0.6);
      }
    };
  }

  function buildPendulum(THREE, scene) {
    var g = new THREE.Group();
    var frame = new THREE.MeshStandardMaterial(mat(0x5b6b7a, { roughness: 0.5, metalness: 0.7 }));
    [-2.4, 2.4].forEach(function (x) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.4, 0.25), frame);
      post.position.set(x, 2.2, 0); g.add(post);
    });
    var bar = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.25, 0.4), frame);
    bar.position.set(0, 4.4, 0); g.add(bar);
    var pivot = new THREE.Group(); pivot.position.set(0, 4.3, 0); g.add(pivot);
    var L = 2.6;
    var string = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, L, 8),
      new THREE.MeshStandardMaterial(mat(0xd9c39a)));
    string.position.y = -L / 2; pivot.add(string);
    var bob = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18),
      new THREE.MeshStandardMaterial(mat(0xe8b34b, { roughness: 0.3, metalness: 0.85 })));
    bob.position.y = -L; pivot.add(bob);
    var floor = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 3),
      new THREE.MeshStandardMaterial(mat(0x16233d, { roughness: 0.9 })));
    floor.position.y = 0; g.add(floor);
    scene.add(g);
    return {
      group: g,
      update: function (t) {
        var amp = readNum("ampRange", 8) * Math.PI / 180; // live-link
        var Lc = readNum("lRange", 80) / 100;
        var w = Math.sqrt(9.81 / Math.max(0.2, Lc));
        pivot.rotation.z = amp * Math.sin(w * t * 0.6);
      }
    };
  }

  function buildBurette(THREE, scene) {
    var g = new THREE.Group();
    var steel = new THREE.MeshStandardMaterial(mat(0x8fa3c7, { roughness: 0.4, metalness: 0.8 }));
    var base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 1.4), steel);
    base.position.y = 0.1; g.add(base);
    var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 12), steel);
    rod.position.set(-0.9, 2.3, 0); g.add(rod);
    var glassMat = new THREE.MeshPhysicalMaterial
      ? new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.3, roughness: 0.05 })
      : new THREE.MeshStandardMaterial(mat(0xcfe8ff, { transparent: true, opacity: 0.3 }));
    var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.0, 24, 1, true), glassMat);
    tube.position.set(0.3, 2.9, 0); g.add(tube);
    var liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.6, 24),
      new THREE.MeshStandardMaterial(mat(0x3c8cff, { transparent: true, opacity: 0.75 })));
    liquid.position.set(0.3, 2.4, 0); g.add(liquid);
    var flask = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.0, 24, 1, true), glassMat);
    flask.position.set(0.3, 0.7, 0); g.add(flask);
    var drop = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10),
      new THREE.MeshStandardMaterial(mat(0x3c8cff)));
    drop.position.set(0.3, 1.4, 0); g.add(drop);
    scene.add(g);
    return {
      group: g,
      update: function (t) {
        var level = 0.5 + 0.5 * Math.sin(t * 0.4); // gentle burette level cue
        liquid.scale.y = 0.7 + 0.3 * level;
        var ph = (t * 0.5) % 1;
        drop.position.y = 1.4 - 0.7 * ph;
        drop.scale.setScalar(0.4 + 0.6 * ph);
      }
    };
  }


  function buildThermoBeaker(THREE, scene) {
    var g = new THREE.Group();
    var steel = new THREE.MeshStandardMaterial(mat(0x8fa3c7, { roughness: 0.4, metalness: 0.8 }));
    var darkSteel = new THREE.MeshStandardMaterial(mat(0x4a5568, { roughness: 0.6, metalness: 0.6 }));
    var glassMat = new THREE.MeshPhysicalMaterial
      ? new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.28, roughness: 0.05 })
      : new THREE.MeshStandardMaterial(mat(0xcfe8ff, { transparent: true, opacity: 0.28 }));
    var bench = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.25, 3.0), darkSteel);
    bench.position.y = 0.9; g.add(bench);
    // burner: base + barrel + flame
    var bbase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.15, 20), steel);
    bbase.position.set(-1.3, 1.1, 0); g.add(bbase);
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 14), steel);
    barrel.position.set(-1.3, 1.6, 0); g.add(barrel);
    var flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 14),
      new THREE.MeshStandardMaterial(mat(0xff9a3c, { emissive: 0xff6a00, emissiveIntensity: 1.0 })));
    flame.position.set(-1.3, 2.35, 0); g.add(flame);
    // beaker glass + liquid (bottom-fixed scaling)
    var LIQ_H = 1.5, LIQ_BOTTOM = 1.35;
    var jar = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.9, 1.9, 28, 1, true), glassMat);
    jar.position.set(0.7, 2.0, 0); g.add(jar);
    var jarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 28), glassMat);
    jarBase.position.set(0.7, 1.06, 0); g.add(jarBase);
    var liquidMat = new THREE.MeshStandardMaterial(mat(0x3c8cff, { transparent: true, opacity: 0.8 }));
    var liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, LIQ_H, 28), liquidMat);
    liquid.position.set(0.7, LIQ_BOTTOM + LIQ_H / 2, 0); g.add(liquid);
    // retort rod + clamp holding the thermometer
    var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 12), steel);
    rod.position.set(2.45, 2.7, -0.4); g.add(rod);
    var clamp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.1), steel);
    clamp.position.set(2.15, 3.5, -0.2); clamp.rotation.y = 0.35; g.add(clamp);
    // thermometer: stem + bulb + fill column that RISES with temp
    var STEM_H = 2.2, STEM_X = 1.95, STEM_BOTTOM = 1.3;
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, STEM_H, 12), glassMat);
    stem.position.set(STEM_X, STEM_BOTTOM + STEM_H / 2, 0); g.add(stem);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12),
      new THREE.MeshStandardMaterial(mat(0xff5a5a, { roughness: 0.4 })));
    bulb.position.set(STEM_X, STEM_BOTTOM + 0.1, 0); g.add(bulb);
    var fill = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 10),
      new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
    g.add(fill);
    var bubbles = [];
    for (var i = 0; i < 5; i++) {
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.8 }));
      b.position.set(0.7, LIQ_BOTTOM + 0.2, 0); g.add(b); bubbles.push(b);
    }
    scene.add(g);
    var cold = new THREE.Color(0x3c8cff), hot = new THREE.Color(0xff5a3c), tmpC = new THREE.Color();
    return {
      group: g,
      update: function (t) {
        var temp = readFirst(["tempRange", "heatRange", "tempSlider"], 60); // live-link
        var frac = clamp01(temp / 100);
        var lh = LIQ_H * (0.45 + 0.55 * frac);
        liquid.scale.y = lh / LIQ_H;
        liquid.position.y = LIQ_BOTTOM + lh / 2;
        var fh = Math.max(0.05, (STEM_H - 0.3) * frac);
        fill.scale.y = fh;
        fill.position.set(STEM_X, STEM_BOTTOM + 0.15 + fh / 2, 0);
        tmpC.copy(cold).lerp(hot, frac);
        liquidMat.color.copy(tmpC);
        flame.scale.set(1 + 0.06 * Math.sin(t * 9.0), 1 + 0.1 * Math.sin(t * 11.0), 1);
        for (var j = 0; j < bubbles.length; j++) {
          var ph = (t * (0.25 + frac * 0.9) + j / bubbles.length) % 1;
          bubbles[j].position.y = LIQ_BOTTOM + 0.15 + Math.max(0.1, lh - 0.2) * ph;
          bubbles[j].position.x = 0.7 + 0.35 * Math.sin(j * 2.4 + t * 1.5);
          bubbles[j].scale.setScalar(Math.max(0.15, 0.5 + 0.8 * ph * (0.4 + frac)));
        }
      }
    };
  }

  function buildCircuit(THREE, scene) {
    var g = new THREE.Group();
    var boardMat = new THREE.MeshStandardMaterial(mat(0x1d3a2f, { roughness: 0.8 }));
    var copper = new THREE.MeshStandardMaterial(mat(0xe8b34b, { roughness: 0.35, metalness: 0.8 }));
    var wireMat = new THREE.MeshStandardMaterial(mat(0xd9c39a, { roughness: 0.4, metalness: 0.6 }));
    var board = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.25, 3.4), boardMat);
    board.position.y = 0.9; g.add(board);
    var loopY = 1.15, hx = 3.0, hz = 1.2;
    function seg(x1, z1, x2, z2) {
      var dx = x2 - x1, dz = z2 - z1, len = Math.sqrt(dx * dx + dz * dz);
      var holder = new THREE.Group();
      var m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 8), wireMat);
      m.rotation.z = Math.PI / 2;
      holder.add(m);
      holder.position.set((x1 + x2) / 2, loopY, (z1 + z2) / 2);
      holder.rotation.y = -Math.atan2(dz, dx);
      g.add(holder);
    }
    seg(-hx, -hz, hx, -hz); seg(hx, -hz, hx, hz);
    seg(hx, hz, -hx, hz); seg(-hx, hz, -hx, -hz);
    // battery (left edge)
    var cell = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 18), copper);
    cell.rotation.z = Math.PI / 2; cell.position.set(-hx, loopY + 0.35, 0); g.add(cell);
    var posT = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12),
      new THREE.MeshStandardMaterial(mat(0xe5484d, { roughness: 0.4 })));
    posT.rotation.z = Math.PI / 2; posT.position.set(-hx + 0.7, loopY + 0.35, 0); g.add(posT);
    var negT = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12),
      new THREE.MeshStandardMaterial(mat(0x3c8cff, { roughness: 0.4 })));
    negT.rotation.z = Math.PI / 2; negT.position.set(-hx - 0.7, loopY + 0.35, 0); g.add(negT);
    // resistor (right edge) with bands
    var res = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 16),
      new THREE.MeshStandardMaterial(mat(0xd9c39a, { roughness: 0.6 })));
    res.rotation.z = Math.PI / 2; res.position.set(hx, loopY + 0.28, 0); g.add(res);
    [-0.25, 0, 0.25].forEach(function (dx) {
      var band = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.08, 16),
        new THREE.MeshStandardMaterial(mat(0xa34d3c, { roughness: 0.6 })));
      band.rotation.z = Math.PI / 2; band.position.set(hx + dx, loopY + 0.28, 0); g.add(band);
    });
    // ammeter dial (front edge) + needle
    var dial = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 28),
      new THREE.MeshStandardMaterial(mat(0xf2f5fa, { roughness: 0.7 })));
    dial.position.set(0, loopY + 0.12, hz); g.add(dial);
    var needlePivot = new THREE.Group();
    needlePivot.position.set(0, loopY + 0.22, hz); g.add(needlePivot);
    var needle = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xe5484d }));
    needle.position.x = 0.3; needlePivot.add(needle);
    // bulb glow (back edge)
    var bulbMat = new THREE.MeshStandardMaterial(mat(0xffd166, { emissive: 0xff9a00, emissiveIntensity: 0.4 }));
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), bulbMat);
    bulb.position.set(0, loopY + 0.35, -hz); g.add(bulb);
    var socket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.25, 14),
      new THREE.MeshStandardMaterial(mat(0x4a5568, { roughness: 0.5, metalness: 0.6 })));
    socket.position.set(0, loopY + 0.1, -hz); g.add(socket);
    // current dots travelling the loop
    var dots = [];
    for (var i = 0; i < 4; i++) {
      var d = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffd166 }));
      g.add(d); dots.push(d);
    }
    scene.add(g);
    function rectPoint(p) {
      var Lx = 2 * hx, Lz = 2 * hz, P = 2 * (Lx + Lz), s = ((p % 1) + 1) % 1 * P;
      if (s < Lx) return { x: -hx + s, z: -hz };
      s -= Lx;
      if (s < Lz) return { x: hx, z: -hz + s };
      s -= Lz;
      if (s < Lx) return { x: hx - s, z: hz };
      s -= Lx;
      return { x: -hx, z: hz - s };
    }
    return {
      group: g,
      update: function (t) {
        var v = readFirst(["voltRange", "VRange", "currRange"], 6); // live-link
        var frac = clamp01(v / 12);
        needlePivot.rotation.y = -(-0.7 + frac * 1.4) + 0.03 * Math.sin(t * 3.0);
        bulbMat.emissiveIntensity = 0.25 + frac * 1.8 + 0.08 * Math.sin(t * 2.2);
        bulb.scale.setScalar(1 + 0.05 * Math.sin(t * 2.2) + frac * 0.12);
        var speed = 0.12 + frac * 0.55;
        for (var j = 0; j < dots.length; j++) {
          var q = rectPoint(t * speed + j / dots.length);
          dots[j].position.set(q.x, loopY + 0.12, q.z);
        }
      }
    };
  }

  function buildMagnet(THREE, scene) {
    var g = new THREE.Group();
    var CY = 2.2;
    var core = new THREE.Group(); core.position.y = CY; g.add(core);
    var stand = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 1.8),
      new THREE.MeshStandardMaterial(mat(0x4a5568, { roughness: 0.6, metalness: 0.6 })));
    stand.position.y = 0.9; g.add(stand);
    [-1.2, 1.2].forEach(function (x) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.22),
        new THREE.MeshStandardMaterial(mat(0x8fa3c7, { roughness: 0.4, metalness: 0.8 })));
      post.position.set(x, 1.4, 0); g.add(post);
    });
    var north = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8),
      new THREE.MeshStandardMaterial(mat(0xe5484d, { roughness: 0.35 })));
    north.position.x = -0.8; core.add(north);
    var south = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8),
      new THREE.MeshStandardMaterial(mat(0xe8eef5, { roughness: 0.35 })));
    south.position.x = 0.8; core.add(south);
    // curved field-line arcs looping N -> S (two planes for depth)
    var lines = [];
    var radii = [0, 1, 2, 3];
    radii.forEach(function (k, idx) {
      var xr = 1.9 + k * 0.55, yr = 0.75 + k * 0.5;
      var curve = new THREE.EllipseCurve(0, 0, xr, yr, 0, Math.PI * 2, false, 0);
      var pts = curve.getPoints(72).map(function (p) {
        return new THREE.Vector3(p.x, p.y, 0);
      });
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var lm = new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.5 });
      var loopV = new THREE.LineLoop(geo, lm);
      core.add(loopV);
      var loopH = new THREE.LineLoop(geo, lm);
      loopH.rotation.x = Math.PI / 2;
      core.add(loopH);
      lines.push({ meshV: loopV, meshH: loopH, mat: lm, phase: idx * 0.8 });
    });
    scene.add(g);
    return {
      group: g,
      update: function (t) {
        core.position.y = CY + 0.05 * Math.sin(t * 0.8); // gentle float
        for (var i = 0; i < lines.length; i++) {
          var L = lines[i];
          var w = 0.5 + 0.5 * Math.sin(t * 1.1 + L.phase); // slow pulse
          L.mat.opacity = 0.28 + 0.3 * w;
          var s = 1 + 0.018 * Math.sin(t * 1.1 + L.phase);
          L.meshV.scale.set(s, s, 1);
          L.meshH.scale.set(s, 1, s);
        }
      }
    };
  }

  function buildMicroscope(THREE, scene) {
    var g = new THREE.Group();
    var steel = new THREE.MeshStandardMaterial(mat(0x4a5568, { roughness: 0.45, metalness: 0.7 }));
    var brass = new THREE.MeshStandardMaterial(mat(0xe8b34b, { roughness: 0.35, metalness: 0.8 }));
    var glassMat = new THREE.MeshPhysicalMaterial
      ? new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: 0.05 })
      : new THREE.MeshStandardMaterial(mat(0xcfe8ff, { transparent: true, opacity: 0.35 }));
    var base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 1.8), steel);
    base.position.y = 0.12; g.add(base);
    var pillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.1, 0.3), steel);
    pillar.position.set(-0.85, 1.25, 0); g.add(pillar);
    var stage = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.4), steel);
    stage.position.set(0.2, 1.55, 0); g.add(stage);
    var slide = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.5), glassMat);
    slide.position.set(0.2, 1.64, 0); g.add(slide);
    var sample = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10),
      new THREE.MeshStandardMaterial(mat(0xe5484d, { roughness: 0.5 })));
    sample.position.set(0.2, 1.7, 0); g.add(sample);
    var lampMat = new THREE.MeshStandardMaterial(mat(0xffd166, { emissive: 0xff9a00, emissiveIntensity: 0.8 }));
    var lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 18), lampMat);
    lamp.position.set(0.2, 1.32, 0); g.add(lamp);
    // tube assembly rides with focus
    var tube = new THREE.Group(); tube.position.set(0.2, 2.75, 0); g.add(tube);
    var barrelM = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 20), brass);
    tube.add(barrelM);
    var eye = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.35, 16), steel);
    eye.position.y = 0.95; tube.add(eye);
    var nose = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15, 20), steel);
    nose.position.y = -0.85; tube.add(nose);
    var lensLengths = [0.32, 0.46, 0.6]; // 3 objectives
    lensLengths.forEach(function (len, i) {
      var a = i * Math.PI * 2 / 3;
      var obj = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, len, 12), steel);
      obj.position.set(Math.cos(a) * 0.2, -0.95 - len / 2, Math.sin(a) * 0.2);
      tube.add(obj);
    });
    var arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 0.3), steel);
    arm.position.set(-0.35, 2.9, 0); g.add(arm);
    var knob = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 18), brass);
    knob.rotation.z = Math.PI / 2;
    knob.position.set(-0.85, 2.1, 0.28); g.add(knob);
    scene.add(g);
    return {
      group: g,
      update: function (t) {
        var frac = clamp01(readFirst(["focusRange"], 50) / 100); // live-link
        tube.position.y = 2.75 - frac * 0.55;
        knob.rotation.x = frac * Math.PI * 4;
        lampMat.emissiveIntensity = 0.7 + 0.2 * Math.sin(t * 2.0);
        sample.scale.setScalar(1 + 0.12 * Math.sin(t * 1.6));
      }
    };
  }

  function buildBioDish(THREE, scene) {
    var g = new THREE.Group();
    var dishMat = new THREE.MeshPhysicalMaterial
      ? new THREE.MeshPhysicalMaterial({ color: 0xe8eef5, transparent: true, opacity: 0.35, roughness: 0.05 })
      : new THREE.MeshStandardMaterial(mat(0xe8eef5, { transparent: true, opacity: 0.35 }));
    var dish = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.55, 0.3, 36), dishMat);
    dish.position.y = 1.6; g.add(dish);
    var agar = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.12, 36),
      new THREE.MeshStandardMaterial(mat(0xe8b34b, { transparent: true, opacity: 0.55, roughness: 0.7 })));
    agar.position.y = 1.62; g.add(agar);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.06, 10, 48), dishMat);
    rim.rotation.x = Math.PI / 2; rim.position.y = 1.78; g.add(rim);
    var tray = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.2, 3.4),
      new THREE.MeshStandardMaterial(mat(0x4a5568, { roughness: 0.6, metalness: 0.6 })));
    tray.position.y = 0.9; g.add(tray);
    var N = 26;
    var cellMat = new THREE.MeshStandardMaterial(mat(0x7ee2a8, { transparent: true, opacity: 0.92, roughness: 0.5 }));
    var cells = [];
    function hash(i, s) {
      var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
      return x - Math.floor(x);
    }
    for (var i = 0; i < N; i++) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.13 + 0.07 * hash(i, 1), 14, 12), cellMat);
      g.add(m);
      cells.push({
        mesh: m,
        ang: hash(i, 2) * Math.PI * 2,
        rad: 0.25 + Math.sqrt(hash(i, 3)) * 1.15,
        base: 0.7 + 0.6 * hash(i, 4)
      });
    }
    scene.add(g);
    return {
      group: g,
      update: function (t) {
        var conc = readFirst(["concRange"], 50); // live-link
        var time = readFirst(["timeRange"], 50); // live-link
        var growth = clamp01(conc / 100) * (0.35 + 0.65 * clamp01(time / 100));
        var n = 1 + Math.round(growth * (N - 1));
        var spread = 0.55 + 0.45 * clamp01(time / 100);
        for (var i = 0; i < N; i++) {
          var c = cells[i];
          var on = i < n; // colonies multiply / spread with conc + time
          c.mesh.visible = on;
          if (!on) continue;
          var a = c.ang + 0.06 * Math.sin(t * 0.3 + i);
          c.mesh.position.set(Math.cos(a) * c.rad * spread, 1.78, Math.sin(a) * c.rad * spread);
          c.mesh.scale.setScalar(Math.max(0.05, c.base * (0.85 + 0.15 * Math.sin(t * 2.0 + i * 1.7))));
        }
      }
    };
  }

  function buildPrism(THREE, scene) {
    var g = new THREE.Group();
    var steel = new THREE.MeshStandardMaterial(mat(0x8fa3c7, { roughness: 0.4, metalness: 0.8 }));
    var stand = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 1.6), steel);
    stand.position.y = 0.9; g.add(stand);
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 12), steel);
    post.position.y = 1.6; g.add(post);
    var shape = new THREE.Shape();
    shape.moveTo(-1.1, -0.95); shape.lineTo(1.1, -0.95); shape.lineTo(0, 0.95); shape.closePath();
    var geo = new THREE.ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: false });
    geo.center();
    var glassMat = new THREE.MeshPhysicalMaterial
      ? new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.42, roughness: 0.05 })
      : new THREE.MeshStandardMaterial(mat(0x9fd8ff, { transparent: true, opacity: 0.42 }));
    var prism = new THREE.Mesh(geo, glassMat);
    prism.position.y = 2.55; g.add(prism);
    function rayMesh(color) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.4, 8),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 }));
      m.rotation.z = Math.PI / 2;
      return m;
    }
    var inPivot = new THREE.Group(); inPivot.position.y = 2.55; g.add(inPivot);
    var inRay = rayMesh(0xffd166); inRay.position.x = -2.35; inPivot.add(inRay);
    var outPivot = new THREE.Group(); outPivot.position.y = 2.55; g.add(outPivot);
    var outRay = rayMesh(0xff9a3c); outRay.position.x = 2.35; outPivot.add(outRay);
    var glow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff2d9 }));
    glow.position.y = 2.55; g.add(glow);
    scene.add(g);
    return {
      group: g,
      update: function (t) {
        var ang = readFirst(["angleRange"], 35); // live-link: incidence angle
        var tilt = Math.max(-0.3, Math.min(0.3, (ang - 35) * 0.012));
        inPivot.rotation.z = tilt;
        outPivot.rotation.z = -0.38 - tilt * 1.6;
        var shimmer = 0.75 + 0.15 * Math.sin(t * 3.0);
        inRay.material.opacity = shimmer;
        outRay.material.opacity = shimmer;
        glow.scale.setScalar(1 + 0.18 * Math.sin(t * 3.0));
      }
    };
  }

  var BUILDERS = {
    "optical-bench": buildOpticalBench,
    "pendulum": buildPendulum,
    "burette": buildBurette,
    "titration": buildBurette,
    "thermo-beaker": buildThermoBeaker,
    "circuit": buildCircuit,
    "magnet": buildMagnet,
    "microscope": buildMicroscope,
    "bio-dish": buildBioDish,
    "prism": buildPrism
  };

  async function loadThree() {
    try {
      return await import("three"); // importmap (online shell provides it)
    } catch (e) {
      return await import(CDN_URL); // absolute CDN fallback
    }
  }

  async function initOne(mount) {
    var kind = (mount.getAttribute("data-apparatus") || "optical-bench").toLowerCase();
    mount.classList.add("os-3d");
    if (!hasWebGL()) { renderFallback(mount, kind); return; }
    var THREE;
    try {
      THREE = await loadThree();
    } catch (e) { renderFallback(mount, kind); return; }
    try {
      var W = Math.max(280, mount.clientWidth || 640), H = 420;
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H);
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", "3D apparatus viewer (" + kind + ").");
      mount.appendChild(renderer.domElement);
      var scene = new THREE.Scene();
      scene.background = null;
      var cam = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
      cam.position.set(0, 3.2, 9.5); cam.lookAt(0, 1.8, 0);
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      var key = new THREE.DirectionalLight(0xfff2d9, 1.1);
      key.position.set(4, 7, 5); scene.add(key);
      var rim = new THREE.DirectionalLight(0x9fd8ff, 0.4);
      rim.position.set(-5, 3, -4); scene.add(rim);
      var builder = BUILDERS[kind] || buildOpticalBench;
      var rig = builder(THREE, scene);
      // minimal drag-orbit (no addons): horizontal drag steers a target
      // yaw; the frame loop damps the rig toward it for smooth motion.
      var targetYaw = 0, dragging = false, lastX = 0, lastTouch = 0;
      var cv = renderer.domElement;
      cv.style.touchAction = "pan-y";
      cv.style.cursor = "grab";
      cv.tabIndex = 0;
      cv.setAttribute("aria-label", "3D apparatus viewer (" + kind + "). Drag or use left and right arrow keys to rotate.");
      function endDrag() {
        dragging = false;
        try { cv.style.cursor = "grab"; } catch (err) {}
      }
      cv.addEventListener("pointerdown", function (e) {
        dragging = true; lastX = e.clientX; lastTouch = performance.now();
        try { cv.style.cursor = "grabbing"; } catch (err) {}
        try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
        cv.addEventListener(ev, endDrag);
      });
      cv.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        try { e.preventDefault(); } catch (err) {} // avoid scroll fight mid-drag
        targetYaw += (e.clientX - lastX) * 0.008; lastX = e.clientX;
        lastTouch = performance.now();
      });
      cv.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { targetYaw -= 0.15; lastTouch = performance.now(); try { e.preventDefault(); } catch (err) {} }
        else if (e.key === "ArrowRight") { targetYaw += 0.15; lastTouch = performance.now(); try { e.preventDefault(); } catch (err) {} }
      });
      function onResize() {
        try {
          var nw = Math.max(280, mount.clientWidth || W);
          renderer.setSize(nw, H);
          cam.aspect = nw / H; cam.updateProjectionMatrix();
        } catch (e) {}
      }
      try { window.addEventListener("resize", onResize); } catch (e) {}
      if (reducedMotion()) { rig.group.rotation.y = targetYaw; rig.update(0.6); renderer.render(scene, cam); return; }
      var t0 = performance.now(), last = t0, yawSm = 0;
      (function frame(now) {
        try {
          var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
          if (!dragging && (now - lastTouch) > 4000) targetYaw += dt * 0.12; // idle turntable
          yawSm += (targetYaw - yawSm) * (1 - Math.exp(-8 * dt)); // damped yaw
          rig.group.rotation.y = yawSm;
          rig.update((now - t0) / 1000);
          renderer.render(scene, cam);
        } catch (e) {}
        requestAnimationFrame(frame);
      })(t0);
    } catch (e) { renderFallback(mount, kind); }
  }

  function initAll() {
    var mounts = document.querySelectorAll("#apparatus3d[data-apparatus], [data-os-3d]");
    mounts.forEach(function (m) {
      if (m.getAttribute("data-os-3d-done")) return;
      m.setAttribute("data-os-3d-done", "1");
      initOne(m);
    });
  }

  window.OSApparatus3D = { init: initAll, kinds: Object.keys(BUILDERS) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();
})();
