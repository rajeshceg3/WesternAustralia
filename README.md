# Western Australia: Wildlife studies

The four original animated GLB subjects are preserved: Parrot, Stork, Horse and Flamingo. Imagined settings are explicitly not documented Western Australian sites or verified native species. The flight animations replace older misleading wading descriptions.

- Subject-specific starting cameras, full orbit, zoom, arrow keys, Home/Reset.
- Model loading has a visible failure state rather than an endless loading overlay.
- Independent animation and opt-in synthesized wind, light/dark UI, explored count.
- Real morph-weight checks prove that animation changes and pause holds it.
- Original code, documents, tests and deployment workflow preserved in legacy.
- Model files are byte-identical to three.js r160; by mirada for ROME, CC BY-NC-SA 3.0. See public/asset-credits.md. This educational viewer is noncommercial. ISC code licensing does not override asset terms.

`npm ci && npm run build`; `WIDTH=390 npm test` verifies all states. THEME=0 or THEME=1 runs one theme. CI runs390 and1440.

Executed local matrices cover320/390/1440, both UI themes and motion modes, real drag, keyboard/Home/Reset, every study and guide,14px floor, no overflow, persistence and silent start. Rendered contrast400visibletextsamples min7.92:1. Actual post-gain8second sound capture passed off/replay; human listening remains unsigned. See verification scripts and evidence records.

The old GitHub Pages build is retained as a baseline, not reused as a new hosting fallback. GitHub-backed free Cloudflare Pages is the new target.
