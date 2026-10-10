/* OpenSchool Online — apparatus3d.js
   Three.js apparatus viewer (CDN import, module script).
   Usage: <div id="apparatus3d" data-apparatus="optical-bench|pendulum|burette"></div>
          <script type="module" src="../assets/js/apparatus3d.js"></script>
   - Switches scene by the data-apparatus attribute (generic optical-bench /
     pendulum / burette dioramas; live-linked to lab sliders where present).
   - 2D-canvas fallback schematic when WebGL is missing or the CDN import fails.
   - Calm motion only (slow sway/pulse, transform-only), single RAF loop per
     viewer, frozen single frame under prefers-reduced-motion. */
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

  var BUILDERS = {
    "optical-bench": buildOpticalBench,
    "microscope": buildOpticalBench,
    "pendulum": buildPendulum,
    "burette": buildBurette,
    "titration": buildBurette
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
      // minimal drag-orbit (no addons): horizontal drag yaws the rig
      var yaw = 0, dragging = false, lastX = 0;
      renderer.domElement.style.touchAction = "pan-y";
      renderer.domElement.addEventListener("pointerdown", function (e) {
        dragging = true; lastX = e.clientX;
        try { renderer.domElement.setPointerCapture(e.pointerId); } catch (err) {}
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
        renderer.domElement.addEventListener(ev, function () { dragging = false; });
      });
      renderer.domElement.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        yaw += (e.clientX - lastX) * 0.008; lastX = e.clientX;
        rig.group.rotation.y = yaw;
      });
      function onResize() {
        try {
          var nw = Math.max(280, mount.clientWidth || W);
          renderer.setSize(nw, H);
          cam.aspect = nw / H; cam.updateProjectionMatrix();
        } catch (e) {}
      }
      try { window.addEventListener("resize", onResize); } catch (e) {}
      if (reducedMotion()) { rig.update(0.6); renderer.render(scene, cam); return; }
      var t0 = performance.now();
      (function frame(now) {
        try {
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
