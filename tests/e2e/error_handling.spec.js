
const { test, expect } = require('@playwright/test');

test.describe('Error Handling', () => {
    test('should handle asset loading failure gracefully', async ({ page }) => {
        // Abort requests to .glb files
        await page.route('**/*.glb', route => route.abort());

        await page.goto('/');

        // Expect console error (we can verify it if we want, but mainly we want app to survive)

        // Wait for potential error UI or just check if canvas still exists and no blocking alert
        const canvas = page.locator('#webglCanvas');
        await expect(canvas).toBeVisible();

        // Check if loading indicator goes away
        const loader = page.locator('#loadingIndicator');
        await expect(loader).not.toBeVisible({ timeout: 10000 });

        // Check if we can still navigate (circuit breaker might trigger or placeholder used)
        const nextBtn = page.getByRole('button', { name: 'Next' });
        await expect(nextBtn).toBeEnabled();

        await nextBtn.click();
        const description = page.locator('#siteDescription');
        await expect(description).toContainText('white stork');
    });
});
