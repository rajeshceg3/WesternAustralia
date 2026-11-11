# Verify WesternAustralia
Western Australia - wildlife studies, three.js constellation scenes (vite; own puppeteer suite at verification/check.cjs).
## Launch
npm install, then npm run dev or npm run build && npm run preview; npm test runs the full puppeteer interaction suite.
## Doctor
`python3 .cursor/skills/verify-western-australia/verify.py`
## Drive
Builds with vite and renders the built app in headless Chromium asserting the boot marker and zero JS console errors.
## Evidence
`.cursor/skills/verify-western-australia/evidence.json`
## Cleanup
Static server terminated after the render.
## Known boundaries
Render smoke only; scene quality and e2e suites (cypress/playwright/puppeteer) not exercised here.
