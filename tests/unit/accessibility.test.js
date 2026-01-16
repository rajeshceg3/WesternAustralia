
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

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

    test('Navigation container should be a nav element with label', () => {
        const nav = document.getElementById('navigationControls');
        expect(nav.tagName).toBe('NAV');
        expect(nav.getAttribute('aria-label')).toBe('Site Navigation');
    });
});
