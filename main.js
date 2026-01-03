import SceneManager from './SceneManager.js';
import SiteManager from './SiteManager.js';
import UIManager from './UIManager.js';
import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('webglCanvas');
    const navigationControls = document.getElementById('navigationControls');
    const siteDescription = document.getElementById('siteDescription');
    const loadingIndicator = document.getElementById('loadingIndicator');

    const sceneManager = new SceneManager(canvas);

    const onTransitionEnd = () => {
        uiManager.setTransitioning(false);
        uiManager.updateActiveButton(siteManager.currentSiteIndex);
        uiManager.showDescription();
        siteDescription.focus();
    };

    const siteManager = new SiteManager(sceneManager.scene, sceneManager.gltfLoader, onTransitionEnd);

    // Error tracking for loading
    let loadingError = false;

    // Configure LoadingManager callbacks BEFORE starting any loads (switchSite)
    sceneManager.gltfLoader.manager.onStart = (url, itemsLoaded, itemsTotal) => {
        console.log(`Loading started: ${url} (${itemsLoaded}/${itemsTotal})`);
        // We do not reset loadingError here because onStart can be called multiple times
        // We reset it in switchSite
    };

    sceneManager.gltfLoader.manager.onError = (url) => {
        console.error('Error loading assets from ' + url);
        loadingError = true;
        loadingIndicator.textContent = `Error loading ${url}. Using placeholder.`;
    };

    sceneManager.gltfLoader.manager.onLoad = () => {
        loadingIndicator.style.display = 'none';
        if (loadingError) {
            console.warn('Loading finished but errors were detected. Placeholders used.');
        }
    };

    const switchSite = (index) => {
        if (siteManager.isTransitioning) return;

        // Reset error state for new site load, if we want to allow retries or new navigations
        // However, if the error is fatal (network down), it might persist.
        // For now, let's assume a new attempt might succeed or we want to clear the old error.
        loadingError = false;
        loadingIndicator.textContent = 'Loading...';
        // We only show the indicator if we anticipate a load.
        // SiteManager calls loadAndAddModel.
        // We can preemptively show it, but LoadingManager will handle it if we want?
        // Actually, if we switch sites, we expect loading.
        // But if the model is cached, it might be instant.
        // Let's rely on LoadingManager.
        // Wait, if I hide it in onLoad, I need to show it somewhere.
        // Usually onStart? But onStart might be too late if we want instant feedback?
        // Let's show it here if we know we are fetching data?
        // SiteManager always calls loadAndAddModel.
        loadingIndicator.style.display = 'flex';

        uiManager.setTransitioning(true);
        uiManager.hideDescription();
        const siteInfo = siteManager.switchSite(index, sceneManager.clock);
        if (siteInfo) {
            uiManager.updateSiteDescription(siteInfo.description);
            sceneManager.animateCameraToTarget(new THREE.Vector3(0, 2, 5), new THREE.Vector3(0, 0, 0));
        } else {
            // If switchSite fails (e.g. invalid index), unlock UI
            uiManager.setTransitioning(false);
            loadingIndicator.style.display = 'none';
        }
    };

    const uiManager = new UIManager(siteManager.sitesData, switchSite, navigationControls, siteDescription);

    // Initial setup
    uiManager.createNavigationButtons();

    // Start loading the first site immediately.
    switchSite(0);

    sceneManager.render((delta, elapsedTime) => {
        siteManager.update(delta, elapsedTime);
    });

    // Keyboard controls
    window.addEventListener('keydown', (event) => {
        const key = event.key;

        // Number keys
        const numKey = parseInt(key);
        if (!isNaN(numKey) && numKey > 0 && numKey <= siteManager.sitesData.length) {
            switchSite(numKey - 1);
            return;
        }

        // Arrow keys
        if (key === 'ArrowLeft') {
            uiManager.navigatePrevious();
        } else if (key === 'ArrowRight') {
            uiManager.navigateNext();
        }
    });
});
