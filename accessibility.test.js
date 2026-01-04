
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

describe('Accessibility Checks', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html;
    });

    test('Canvas should have aria-label', () => {
        const canvas = document.getElementById('webglCanvas');
        expect(canvas.getAttribute('aria-label')).toBeTruthy();
    });

    test('Site description should be polite live region', () => {
        const desc = document.getElementById('siteDescription');
        expect(desc.getAttribute('aria-live')).toBe('polite');
    });

    test('Loading indicator should exist', () => {
        const loader = document.getElementById('loadingIndicator');
        expect(loader).toBeTruthy();
    });
});
