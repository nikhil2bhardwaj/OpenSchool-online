# OpenSchool — NCERT Virtual STEM Laboratory (Online Edition)

The premium, internet-connected sibling of the offline lab. Same **78 NCERT/CBSE
experiments** and deterministic simulation kernels, dressed in an editorial
hub, fluid GSAP motion, and CDN-powered typography.

Live: `https://nikhil2bhardwaj.github.io/OpenSchool-online/`
Offline sibling (zero-dependency, USB-ready): `https://github.com/nikhil2bhardwaj/OpenSchool`

## What it is

- `index.html` — cinematic hub: featured spreads, Ctrl+K command palette,
  animated counters, skeleton loading, EN/हिं toggle.
- 78 premium lab shells: morphing tab indicator, scroll reveals, toast
  notifications, procedure wizard, quiz, viva-voce + AI examiner, CBSE report
  builder, read-aloud, bookmarks.
- Same IndexedDB notebook (`assets/js/storage.js`) — data stays on the device.
- Physics is byte-identical to the offline edition; only presentation differs.

## Requirements (differs from offline)

This edition **needs internet**: Google Fonts, GSAP + ScrollTrigger CDN, and
Three.js (where used) load from CDN. Serve over `http(s)` — do not open via
`file://` (ES modules and some CDN features are blocked from disk).

## How to use

```powershell
python -m http.server 8001
```
Open `http://localhost:8001/`. Everything else works like the offline edition:
filters → Launch Lab → Record readings → Save → Viva/Quiz → Export report.

Teachers: `teacher-dashboard.html`, timed papers at `exam.html`, equations at
`formulas.html`, kernel self-tests at `tests.html`.

## Layout

```
index.html  exam.html  formulas.html  mistakes.html  teacher-dashboard.html  tests.html
manifests/catalog.json      # 78 entries
assets/css/  assets/js/     # same kernel files as offline + online shell extras
assets/vendor/gsap/         # local fallback copy of GSAP
labs/                       # 78 experiments + template_lab.html
```

Open-source, free for educational use.
