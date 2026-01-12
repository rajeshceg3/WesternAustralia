# INTELLIGENCE BRIEFING: VULNERABILITY & BUG ASSESSMENT
**Target:** Western Australia 3D Sites Viewer
**Officer:** Jules, QA Task Force
**Date:** Current

## 1. Executive Summary
A comprehensive audit of the target application revealed multiple vulnerabilities ranging from architectural fragility to user experience degradation. While the core system is functional, several critical weaknesses compromise operational reliability and security posture.

## 2. Findings by Category

### A. Architectural Vulnerabilities (Critical)
*   **Fragile Data Coupling in `SiteManager.js`**:
    *   **Description**: The methods `createParrotSite`, `createStorkSite`, etc., use hardcoded indices (e.g., `this.sitesData[0]`) to retrieve model URLs.
    *   **Impact**: Reordering the `sitesData` array results in incorrect models being loaded for a site (e.g., "Parrot's Perch" loading the Stork model). This is a logic bomb waiting to happen during maintenance.
    *   **Recommendation**: Decouple creation methods from array indices. Pass the site data object directly to the creation function.

### B. User Experience (UX) (High)
*   **Keyboard Navigation Failure**:
    *   **Description**: The global keyboard event listener in `main.js` explicitly blocks Arrow Key navigation if `document.activeElement` is a `<button>`.
    *   **Impact**: Users relying on keyboard navigation who tab to a UI button (e.g., "Next") find that their Arrow keys suddenly stop working for site switching, breaking standard interaction expectations.
    *   **Recommendation**: Allow Arrow keys to trigger site navigation even when buttons are focused, unless the button specifically consumes those keys (which these do not).

### C. Error Handling & Resilience (Medium)
*   **Obscured Failure State**:
    *   **Description**: When a GLB model fails to load, `SiteManager.js` correctly creates a red wireframe placeholder. However, `main.js` leaves the opaque `loadingIndicator` (now displaying an error message) overlaid on the screen.
    *   **Impact**: The user is blocked from seeing the fallback placeholder content. The system's resilience mechanism (placeholder) is rendered useless by its error reporting mechanism.
    *   **Recommendation**: Modify the error UI to be non-blocking (e.g., semi-transparent or toast-based) or allow dismissing the error to view the placeholder.

### D. Security (Medium)
*   **Weak Content Security Policy (CSP)**:
    *   **Description**: The CSP in `index.html` allows `'unsafe-inline'` for `style-src`.
    *   **Impact**: Increases attack surface for XSS attacks that might attempt to inject malicious styles.
    *   **Recommendation**: Move all inline styles to `style.css` and enforce a stricter CSP.

### E. Accessibility (Low)
*   **Generic Canvas Role**:
    *   **Description**: The canvas has `role="img"`. While acceptable, it provides limited context for screen readers regarding the interactive 3D nature.
    *   **Recommendation**: Ensure `aria-label` is dynamically updated (currently implemented) and consider `role="region"` with a description if interaction becomes more complex.

## 3. Mission Plan
The following remediation steps are authorized for immediate execution:
1.  **Refactor**: Rewrite `SiteManager` creation logic to eliminate index dependency.
2.  **Patch**: Update `main.js` keyboard listener to restore Arrow key functionality.
3.  **Enhance**: Adjust Error UI to allow placeholder visibility.
4.  **Harden**: Migrate inline CSS and tighten CSP.

**End of Briefing.**
