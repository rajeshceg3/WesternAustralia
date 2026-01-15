import SceneManager from './SceneManager.js';
import SiteManager from './SiteManager.js';
import UIManager from './UIManager.js';
import * as THREE from 'three';

import WebGL from 'three/examples/jsm/capabilities/WebGL.js';

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

        // Show retry button with semi-transparent background to see the placeholder
        loadingIndicator.innerHTML = '';
        loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent

        const errorContainer = document.createElement('div');
        errorContainer.id = 'errorContainer';
        errorContainer.setAttribute('role', 'alert');
        errorContainer.style.backgroundColor = '#1a1a1a';
        errorContainer.style.padding = '20px';
        errorContainer.style.borderRadius = '8px';
        errorContainer.style.textAlign = 'center';
        errorContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

        const msg = document.createElement('p');
        msg.textContent = `Error loading ${url}. Using placeholder.`;
        msg.style.marginBottom = '15px';
        errorContainer.appendChild(msg);

        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry Loading';
        retryBtn.style.marginRight = '10px';
        retryBtn.style.padding = '8px 16px';
        retryBtn.style.cursor = 'pointer';
        retryBtn.onclick = () => {
            // Retry the current site
            // Ensure render loop is running (it might have stopped after errors)
            sceneManager.restartRenderLoop((delta, elapsedTime) => {
                siteManager.update(delta, elapsedTime);
            });
            switchSite(siteManager.currentSiteIndex, true);
        };
        errorContainer.appendChild(retryBtn);

        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.style.padding = '8px 16px';
        dismissBtn.style.cursor = 'pointer';
        dismissBtn.onclick = () => {
            loadingIndicator.style.display = 'none';
        };
        errorContainer.appendChild(dismissBtn);

        loadingIndicator.appendChild(errorContainer);
    };

    sceneManager.gltfLoader.manager.onLoad = () => {
        // Only hide the loading indicator if no errors occurred.
        // If errors occurred, the indicator contains the error message and retry button.
        if (!loadingError) {
            loadingIndicator.style.display = 'none';
        } else {
            console.warn('Loading finished but errors were detected. Placeholders used.');
        }
    };

    const switchSite = (index, force = false) => {
        // Pass force to siteManager to allow retrying current site
        if (!force && siteManager.isTransitioning) return;

        // Reset error state for new site load, if we want to allow retries or new navigations
        // However, if the error is fatal (network down), it might persist.
        // For now, let's assume a new attempt might succeed or we want to clear the old error.
        loadingError = false;

        // Reset loading indicator structure
        loadingIndicator.innerHTML = '<p id="loadingText">Loading...</p>';

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
        loadingIndicator.style.backgroundColor = '#1a1a1a'; // Reset background color

        uiManager.setTransitioning(true);
        uiManager.hideDescription();

        const onProgress = (xhr) => {
            if (loadingError) return; // Prevent overwriting error message
            if (xhr.lengthComputable) {
                const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
                // Update the text content of the paragraph inside the loader
                const p = document.getElementById('loadingText');
                if (p) p.textContent = `Loading... ${percentComplete}%`;
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
