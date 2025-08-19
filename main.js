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
    };

    const siteManager = new SiteManager(sceneManager.scene, sceneManager.gltfLoader, onTransitionEnd);

    const switchSite = (index) => {
        if (siteManager.isTransitioning) return;
        uiManager.setTransitioning(true);
        uiManager.hideDescription();
        const siteInfo = siteManager.switchSite(index, sceneManager.clock);
        if (siteInfo) {
            uiManager.updateSiteDescription(siteInfo.description);
            sceneManager.animateCameraToTarget(new THREE.Vector3(0, 2, 5), new THREE.Vector3(0, 0, 0));
        } else {
            // If switchSite fails (e.g. invalid index), unlock UI
            uiManager.setTransitioning(false);
        }
    };

    const uiManager = new UIManager(siteManager.sitesData, switchSite, navigationControls, siteDescription);

    // Initial setup
    uiManager.createNavigationButtons();
    loadingIndicator.style.display = 'flex';

    // Use the GLTFLoader's manager to detect when all initial assets are loaded.
    sceneManager.gltfLoader.manager.onLoad = () => {
        loadingIndicator.style.display = 'none';
        // Load the first site.
        switchSite(0);
    };

    sceneManager.gltfLoader.manager.onStart = () => {
        console.log('Loading assets...');
    };

    sceneManager.gltfLoader.manager.onError = (url) => {
        console.error('Error loading assets from ' + url);
        loadingIndicator.textContent = `Error loading asset: ${url}. Please refresh.`;
    };


    sceneManager.render((delta, elapsedTime) => {
        siteManager.update(delta, elapsedTime);
    });

    // Keyboard controls
    window.addEventListener('keydown', (event) => {
        const key = parseInt(event.key);
        if (!isNaN(key) && key > 0 && key <= siteManager.sitesData.length) {
            switchSite(key - 1);
        }
    });
});
