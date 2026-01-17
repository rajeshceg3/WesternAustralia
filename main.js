import SceneManager from './SceneManager.js';
import SiteManager from './SiteManager.js';
import UIManager from './UIManager.js';
import * as THREE from 'three';

import WebGL from 'three/examples/jsm/capabilities/WebGL.js';

// Enable Three.js file cache
THREE.Cache.enabled = true;

document.addEventListener('DOMContentLoaded', () => {
    if (!WebGL.isWebGL2Available()) {
        const warning = WebGL.getWebGL2ErrorMessage();
        document.body.appendChild(warning);
        document.getElementById('loadingIndicator').style.display = 'none';
        return;
    }

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

        // Preload next site
        // const nextIndex = (siteManager.currentSiteIndex + 1) % siteManager.sitesData.length;
        // siteManager.preloadSite(nextIndex);
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

        uiManager.showError(
            url,
            () => {
                // Retry callback
                // Ensure render loop is running (it might have stopped after errors)
                sceneManager.restartRenderLoop((delta, elapsedTime) => {
                    siteManager.update(delta, elapsedTime);
                });
                switchSite(siteManager.currentSiteIndex, true);
            },
            () => {
                // Dismiss callback
                uiManager.hideLoading();
            },
        );
    };

    sceneManager.gltfLoader.manager.onLoad = () => {
        // Only hide the loading indicator if no errors occurred.
        // If errors occurred, the indicator contains the error message and retry button.
        if (!loadingError) {
            uiManager.hideLoading();
        } else {
            console.warn('Loading finished but errors were detected. Placeholders used.');
        }
    };

    const switchSite = (index, force = false) => {
        // Pass force to siteManager to allow retrying current site
        if (!force && siteManager.isTransitioning) return;

        // Reset error state for new site load, if we want to allow retries or new navigations
        loadingError = false;

        uiManager.showLoading();

        uiManager.setTransitioning(true);
        uiManager.hideDescription();

        const onProgress = (xhr) => {
            if (loadingError) return; // Prevent overwriting error message
            if (xhr.lengthComputable) {
                const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
                uiManager.updateLoadingProgress(percentComplete);
            }
        };

        const siteInfo = siteManager.switchSite(index, sceneManager.clock, onProgress, force);
        if (siteInfo) {
            uiManager.updateSiteDescription(siteInfo.description);
            // Update canvas accessibility label
            const siteName = siteManager.sitesData[index].name;
            canvas.setAttribute('aria-label', `3D View of ${siteName}`);

            // Update document title for accessibility and context
            document.title = `${siteName} - Western Australia 3D Sites`;

            // Update on-screen site title
            const siteTitleElement = document.getElementById('currentSiteTitle');
            if (siteTitleElement) {
                siteTitleElement.textContent = siteName;
            }

            sceneManager.animateCameraToTarget(new THREE.Vector3(0, 2, 5), new THREE.Vector3(0, 0, 0));
        } else {
            // If switchSite fails (e.g. invalid index), unlock UI
            uiManager.setTransitioning(false);
            loadingIndicator.style.display = 'none';
        }
    };

    const uiManager = new UIManager(
        siteManager.sitesData,
        switchSite,
        navigationControls,
        siteDescription,
        loadingIndicator,
    );

    // Initial setup
    uiManager.createNavigationButtons();

    // Start loading the first site immediately.
    switchSite(0);

    sceneManager.render((delta, elapsedTime) => {
        siteManager.update(delta, elapsedTime);
    });

    // Keyboard controls
    window.addEventListener('keydown', (event) => {
        // Prevent interference if user is interacting with UI elements
        const tagName = document.activeElement.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') {
            return;
        }

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
