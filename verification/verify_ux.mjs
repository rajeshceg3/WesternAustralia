import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:4173');

        await page.screenshot({ path: 'verification/debug_initial.png' });

        console.log('Waiting for help button...');
        await page.waitForSelector('#helpToggleBtn', { timeout: 5000 });

        console.log('Clicking help button...');
        await page.click('#helpToggleBtn');

        console.log('Waiting for modal...');
        const modal = page.locator('#helpModal');
        await modal.waitFor({ state: 'visible', timeout: 5000 });

        console.log('Taking screenshot...');
        await page.screenshot({ path: 'verification/help_modal.png' });

        console.log('Done.');
    } catch (e) {
        console.error('SCRIPT ERROR:', e);
        await page.screenshot({ path: 'verification/debug_error.png' });
    } finally {
        await browser.close();
    }
})();
