# TACTICAL ASSESSMENT REPORT: WESTERN AUSTRALIA 3D SITES VIEWER

**TO:** COMMAND
**FROM:** JULES (NAVY SEAL / SENIOR ENGINEER)
**DATE:** 2024-05-24
**SUBJECT:** REPOSITORY ASSESSMENT & TRANSFORMATION ROADMAP

---

## 1. SITUATIONAL ANALYSIS

The current codebase represents a functional prototype of a 3D visualization tool. While the tactical logic for scene management and transitions is sound, the infrastructure is fragile and unsuited for a hostile production environment.

### Critical Intelligence
- **Architecture:** Vanilla JavaScript (ES Modules). No build pipeline.
- **Dependencies:** "Broken Arrow" state. `package.json` tracks dependencies, but `index.html` bypasses them via CDN. This creates a high risk of version mismatch and instability.
- **Assets:** Local assets confirmed in `sitesConfig.js`. Deployment Brief (2024-05-22) contained outdated intel regarding external dependencies.
- **Security:** CSP exists but relies on CDNs. No strict asset hashing.
- **UX/A11y:** Strong foundation. Focus management and screen reader support are present. Visual feedback for loading is primitive.

---

## 2. THREAT ASSESSMENT & GAPS

### GAP A: INFRASTRUCTURE VULNERABILITY (SEVERITY: CRITICAL)
- **Current State:** No bundler. Code is served as raw ES modules.
- **Risk:**
    - **Performance:** High network latency due to waterfall requests (hundreds of HTTP requests for Three.js modules).
    - **Reliability:** Dependency on external CDNs (`jsdelivr.net`) creates an external failure point.
    - **Security:** Lack of minification/obfuscation exposes raw logic.
- **Tactical Solution:** Implement **Vite** as the build engine. Bundle all dependencies.

### GAP B: DEPENDENCY INTEGRITY (SEVERITY: HIGH)
- **Current State:** Version mismatch between `npm test` (local `node_modules`) and production (CDN).
- **Risk:** Tests may pass locally but code fails in production due to API differences in Three.js versions.
- **Tactical Solution:** Eliminate CDN. Import `three` and `tween.js` directly from `node_modules` and bundle them.

### GAP C: USER EXPERIENCE FRICTION (SEVERITY: MEDIUM)
- **Current State:** Loading indicator is a text string.
- **Risk:** Users perceive the app as "stalled" without granular visual feedback.
- **Tactical Solution:** Implement a graphical progress bar and smoother transition overlays.

---

## 3. STRATEGIC IMPLEMENTATION PLAN

### PHASE 1: FORTIFICATION (INFRASTRUCTURE) - **IMMEDIATE ACTION**
**Objective:** Establish a robust build pipeline.
1.  **Install Vite:** Modern, fast bundler.
2.  **Refactor Entry Point:** Move `index.html` to root (already there), update script tags to use module resolution.
3.  **Eliminate CDNs:** Remove `importmap` and CDN links.
4.  **Configure Build:** Set up `vite.config.js` for production hashing and splitting.

### PHASE 2: UX ENHANCEMENT (ENGAGEMENT)
**Objective:** Improve perceived performance and polish.
1.  **Visual Loading:** Replace text loader with a CSS-animated progress bar.
2.  **Error Recovery:** Enhance the "Retry" UI to be more inviting.

### PHASE 3: COMPLIANCE & VERIFICATION
**Objective:** Ensure mission success.
1.  **Type Safety:** Add JSDoc type checking to critical paths.
2.  **Linting:** Enforce strict linting rules.
3.  **CI/CD:** Update GitHub Actions to use `npm run build` instead of manual copying.

---

## 4. EXECUTION ORDERS

I am proceeding immediately with **Phase 1 (Fortification)** to secure the perimeter.

**Step 1:** Install Vite and plugins.
**Step 2:** Configure `vite.config.js`.
**Step 3:** Sanitize `index.html` (Remove CDN).
**Step 4:** Verify build integrity.
