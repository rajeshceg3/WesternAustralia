# DEPLOYMENT INTELLIGENCE BRIEF

**Date:** 2024-05-22
**Subject:** Repository Analysis & Deployment Strategy for Western Australia 3D Sites Viewer
**Classification:** INTERNAL USE ONLY

---

## 📌 A. Repository Intelligence Summary

**Overview**
The repository hosts a client-side 3D visualization application ("Western Australia 3D Sites") built with vanilla JavaScript (ES6 Modules) and Three.js. It allows users to navigate through different 3D scenes (Parrot, Duck, Horse, Flamingo) loaded dynamically.

**Runtime Architecture**

- **Type:** Single Page Application (SPA) / Static Site.
- **Core:** Vanilla JS with ES Modules (`type="module"`).
- **Rendering:** WebGL via Three.js (r178).
- **Dependencies:**
    - **Runtime:** Three.js and Tween.js loaded via CDN (`jsdelivr.net`) defined in an `importmap`.
    - **Dev/Test:** `jest` and `jest-environment-jsdom` managed via `package.json`.
- **Assets:** GLTF models and HDR environments are loaded from external sources (GitHub Raw, Three.js examples).

**Operational Expectations**

- Expects a modern browser with WebGL and Module support.
- Requires internet access at runtime to fetch CDN scripts and remote assets.
- No build step is strictly required for development, but artifact isolation is recommended for production.

---

## 🚨 B. Critical Risks & Findings

### 1. External Asset Dependency (High Severity)

- **Finding:** The application loads 3D models and textures from `raw.githubusercontent.com` and `threejs.org`.
- **Operational Risk:** High. GitHub Raw is not a CDN and has rate limits. If the upstream files are moved, deleted, or the user is rate-limited, the application will render empty scenes or crash.
- **Impact:** Complete feature failure (no 3D content).

### 2. Mixed Dependency Management (Medium Severity)

- **Finding:** `package.json` lists `three` and `@tweenjs/tween.js` as dependencies, but the runtime `index.html` uses hardcoded CDN URLs.
- **Operational Risk:** Version drift. The local `npm test` might run against a different version of Three.js than what is running in production via CDN.
- **Impact:** Bugs found in production that cannot be reproduced in local tests.

### 3. Missing Content Security Policy (Medium Severity)

- **Finding:** No CSP headers or meta tags.
- **Operational Risk:** The site loads scripts and assets from multiple origins (`jsdelivr.net`, `githubusercontent.com`, `threejs.org`).
- **Impact:** Vulnerable to XSS if an attacker can inject script tags, or if a CDN is compromised.

### 4. No Build Artifact Optimization (Low Severity)

- **Finding:** The app serves raw source files.
- **Operational Risk:** Performance. Browsers must fetch multiple small files. No cache busting hashes.
- **Impact:** Slower load times, potential caching issues on updates.

---

## 🧠 C. Deployment Strategy Decision

**Selected Target: GitHub Pages**

**Justification:**

1.  **Alignment with Architecture:** The application is purely static (HTML/JS). It requires no server-side processing.
2.  **Cost & Efficiency:** GitHub Pages is free, integrated, and served via a global CDN.
3.  **Operational Simplicity:** Removes the need for container management (Docker) or server maintenance.
4.  **Security:** Static hosting reduces the attack surface significantly (no backend to exploit).

**Rejected Alternatives:**

- **Docker/Containerization:** Rejected. Overkill for static files. Adds maintenance overhead (patching base images).
- **S3 + CloudFront:** Rejected. Valid choice, but adds complexity (terraform/infrastructure management) compared to the "zero-config" nature of GitHub Pages for this specific repo size.

---

## 🛠 E. Hardening & Future Improvements

**Immediate Actions (Implemented in Pipeline):**

1.  **CI Validation:** Added `npm test` and `npm audit` to gate deployments.
2.  **Artifact Isolation:** The build step copies only necessary files (`dist/`) to prevent leaking config/test files to production.

**Recommended Roadmap:**

1.  **Asset Bundling:** Introduce Vite or Webpack to bundle JS and self-host the assets. This eliminates the "External Asset Dependency" risk and improves performance.
2.  **Local Assets:** Download the GLTF models and HDR maps and commit them to the repo (or store in LFS). Stop relying on `raw.githubusercontent.com`.
3.  **CSP Implementation:** Add a strict Content-Security-Policy meta tag restricting sources to the specific CDNs used.
4.  **Version Synchronization:** Remove the CDN import map and use the bundled `node_modules` version of Three.js to ensure dev/prod parity.
