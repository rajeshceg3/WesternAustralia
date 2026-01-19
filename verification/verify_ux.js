const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Wait for the server to be ready
  await page.goto('http://localhost:4173');

  // Wait for loading indicator to appear or content to load
  try {
      // We expect the loading indicator to appear initially
      const loadingIndicator = page.locator('#loadingIndicator');
      if (await loadingIndicator.isVisible()) {
          console.log('Loading indicator visible');
          await page.screenshot({ path: 'verification/loading_state.png' });
      }

      // Wait for the canvas to be visible (site loaded)
      await page.waitForSelector('#webglCanvas', { state: 'visible' });
      console.log('Canvas visible');

      // Take a screenshot of the loaded state
      await page.screenshot({ path: 'verification/loaded_state.png' });

  } catch (error) {
      console.error('Error during verification:', error);
      await page.screenshot({ path: 'verification/error_state.png' });
  }

  await browser.close();
})();
