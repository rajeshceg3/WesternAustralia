const { test, expect } = require('@playwright/test');

test.describe('User Journey', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for canvas to be present
        await page.waitForSelector('#webglCanvas');
        // Wait for initial transition to complete
        await expect(page.locator('#navigationControls')).not.toHaveClass(/transitioning/, { timeout: 10000 });
    });

    test('should load the application with 3D canvas and controls', async ({ page }) => {
        await expect(page).toHaveTitle(/Western Australia 3D Sites/i);

        const canvas = page.locator('#webglCanvas');
        await expect(canvas).toBeVisible();
        await expect(canvas).toHaveAttribute('role', 'img');

        const nav = page.locator('#navigationControls');
        await expect(nav).toBeVisible();

        const desc = page.locator('#siteDescription');
        await expect(desc).toBeVisible();
    });

    test('should navigate through sites using buttons', async ({ page }) => {
        const nextBtn = page.getByRole('button', { name: 'Next' });
        const prevBtn = page.getByRole('button', { name: 'Previous' });
        const nav = page.locator('#navigationControls');
        const description = page.locator('#siteDescription');

        // Wait for initial description
        await expect(description).toContainText('colorful parrot');

        // Click Next
        await nextBtn.click();
        await expect(description).toContainText('white stork');
        await expect(nav).not.toHaveClass(/transitioning/);

        // Click Next again
        await nextBtn.click();
        await expect(description).toContainText('majestic horse');
        await expect(nav).not.toHaveClass(/transitioning/);

        // Click Prev
        await prevBtn.click();
        await expect(description).toContainText('white stork');
        await expect(nav).not.toHaveClass(/transitioning/);
    });

    test('should support keyboard navigation', async ({ page }) => {
        const description = page.locator('#siteDescription');
        const nav = page.locator('#navigationControls');

        // Focus body to ensure keys work
        await page.locator('body').click();

        // Arrow Right
        await page.keyboard.press('ArrowRight');
        await expect(description).toContainText('white stork');
        await expect(nav).not.toHaveClass(/transitioning/);

        // Arrow Left
        await page.keyboard.press('ArrowLeft');
        await expect(description).toContainText('colorful parrot');
        await expect(nav).not.toHaveClass(/transitioning/);
    });

    test('should maintain accessibility attributes', async ({ page }) => {
        const nav = page.locator('#navigationControls');
        await expect(nav).toHaveAttribute('aria-label', 'Site Navigation');

        const nextBtn = page.getByRole('button', { name: 'Next' });

        // During transition, it should be disabled/aria-disabled
        await nextBtn.click();
        await expect(nav).toHaveClass(/transitioning/);
        await expect(nextBtn).toHaveAttribute('aria-disabled', 'true');

        // Wait for transition to end (approx 1s)
        await expect(nav).not.toHaveClass(/transitioning/, { timeout: 5000 });
        await expect(nextBtn).not.toHaveAttribute('aria-disabled');
    });

    test('should not have console errors', async ({ page }) => {
        const errors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.reload();
        await page.waitForTimeout(1000);

        expect(errors).toEqual([]);
    });
});
