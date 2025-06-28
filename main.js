// Basic Three.js scene setup

// At the top of main.js, or in a new app-context.js if we were modularizing more
const AppContext = (function() {
    // All variables previously in main()'s direct scope go here
    let scene, renderer, camera, clock, composer;
    // Site Management
    const sitesData = [
        {
            name: "Site 1 (Pinnacles-like)",
            createFunc: null, // Will be assigned actual function below
            bgColor: 0xFAEBD7, // AntiqueWhite
            description: "Placeholder for The Pinnacles: Thousands of limestone pillars rising from the yellow sands of Nambung National Park."
        },
        {
            name: "Site 2 (Wave Rock-like)",
            createFunc: null, // Will be assigned actual function below
            bgColor: 0xFFE4B5,   // Moccasin
            description: "Placeholder for Wave Rock: A giant, multi-coloured granite wave about to crash into the bush. Located near Hyden."
        },
        {
            name: "Site 3 (Gorge/Pillars)",
            createFunc: null, // Will be assigned actual function below
            bgColor: 0xB0C4DE,    // LightSteelBlue
            description: "Placeholder for a Karijini-style Gorge: Ancient, deep gorges with dramatic rock formations and seasonal waterfalls."
        }
    ];
    let currentSiteIndex = 0; // Initialized as it was in main (actually -1 then 0 in old main)
    let currentSiteGroup = null;
    let isTransitioning = false; // Can be false, 'initial_in', or 'crossfade'
    let transitionDuration = 1.0; // Duration in seconds (increased for smoother crossfade)
    let transitionStartTime = 0;
    let outgoingSiteGroup = null;
    let incomingSiteGroup = null;
    let descriptionElement = null;
    let navigationControlsContainer = null;
    let controls = null; // For OrbitControls

    // Placeholder/Site creation functions remain internal or are also exposed if tested directly
    // These will return basic THREE.Group for testing switchSite logic,
    // but in the actual app, they create detailed sites.
    function createPlaceholderSite1() {
        const group = new THREE.Group();
        // Simplified for refactoring step - actual content was removed by prior step, will be re-added if needed
        // For testing, returning a mock group is fine.
        // Actual implementation will be inside initMainLogic or called by it.
        return group;
    }
    function createPlaceholderSite2() {
        const group = new THREE.Group();
        return group;
    }
    function createPlaceholderSite3() {
        const group = new THREE.Group();
        return group;
    }

    // Update sitesData to use these actual functions
    sitesData[0].createFunc = createPlaceholderSite1;
    sitesData[1].createFunc = createPlaceholderSite2;
    sitesData[2].createFunc = createPlaceholderSite3;

    function setGroupOpacity(group, opacity) {
        if (!group) return;
        group.traverse(child => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    mat.transparent = true;
                    mat.opacity = opacity;
                });
            }
        });
    }

    function _updateNavigationButtons() {
        if (!navigationControlsContainer) return;

        // Handle prev/next buttons specifically by ID
        const prevButton = navigationControlsContainer.querySelector('#prevButton');
        const nextButton = navigationControlsContainer.querySelector('#nextButton');

        if (prevButton) {
            prevButton.disabled = currentSiteIndex <= 0;
        }
        if (nextButton) {
            // Assuming sitesData is available in this scope
            nextButton.disabled = currentSiteIndex >= sitesData.length - 1;
        }

        // Handle active state for site-specific buttons
        // Assuming site-specific buttons are direct children and don't have #prevButton or #nextButton ID
        // And they are the ones that should get the 'active' class.
        const siteButtons = Array.from(navigationControlsContainer.querySelectorAll('button:not(#prevButton):not(#nextButton)'));
        siteButtons.forEach((button, siteButtonIndex) => {
            if (siteButtonIndex === currentSiteIndex) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function _switchSite(index) {
        // Guard clauses
        if (isTransitioning || (index === currentSiteIndex && currentSiteGroup && !isTransitioning)) {
            console.warn("Transition in progress or site already loaded/targetted:", index, "current:", currentSiteIndex, "transitioning:", isTransitioning);
            return;
        }
        if (index < 0 || index >= sitesData.length) {
            console.warn("Invalid site index:", index);
            return;
        }

        if (currentSiteGroup) {
            outgoingSiteGroup = currentSiteGroup;
        }

        currentSiteIndex = index;
        const newSiteData = sitesData[currentSiteIndex];
        incomingSiteGroup = newSiteData.createFunc();
        setGroupOpacity(incomingSiteGroup, 0);
        if (scene) scene.add(incomingSiteGroup); // Check if scene exists

        if (descriptionElement) {
            descriptionElement.classList.remove('visible');
            descriptionElement.textContent = newSiteData.description;
        }

        _updateNavigationButtons();
        if (controls) controls.target.set(0, 0, 0);

        isTransitioning = 'crossfade';
        if (clock) transitionStartTime = clock.getElapsedTime(); // Check if clock exists
        currentSiteGroup = null; // Set to null, incoming becomes current after transition
    }

    function initMainLogic() {
        // Most of the original main() content goes here
        // Three.js setup, event listeners, render loop initiation
        const canvas = document.querySelector('#webglCanvas');
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        descriptionElement = document.getElementById('siteDescription');
        navigationControlsContainer = document.getElementById('navigationControls');
        const loadingIndicator = document.getElementById('loadingIndicator');

        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 5;
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.z = 5;
        camera.position.y = 2;
        camera.lookAt(0, 0, 0);

        scene = new THREE.Scene();
        clock = new THREE.Clock();
        clock.start();

        // Loading Manager (adapted from original main)
        const manager = new THREE.LoadingManager();
        manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
            if (loadingIndicator) loadingIndicator.style.display = 'flex';
        };
        manager.onLoad = function () {
            console.log( 'Loading complete!');
            if (loadingIndicator) {
                loadingIndicator.style.transition = 'opacity 0.5s';
                loadingIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                }, 500);
            }
            const initialSiteData = sitesData[currentSiteIndex]; // currentSiteIndex is 0 by default
            currentSiteGroup = initialSiteData.createFunc();
            setGroupOpacity(currentSiteGroup, 0);
            scene.add(currentSiteGroup);

            if (descriptionElement) {
                descriptionElement.textContent = initialSiteData.description;
                descriptionElement.classList.remove('visible');
            }
            console.log(`Initial site: ${initialSiteData.name}`);
            if(controls) controls.target.set(0,0,0);

            isTransitioning = 'initial_in';
            transitionStartTime = clock.getElapsedTime();
        };
        manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };
        manager.onError = function ( url ) {
            console.error( 'There was an error loading ' + url );
            if (loadingIndicator) {
                loadingIndicator.innerHTML = '<p>Error loading assets. Please try refreshing.</p>';
                loadingIndicator.style.display = 'flex';
            }
        };

        // Skybox, Environment Map, Controls, Lighting, Post-processing (copied from original main, ensuring variables are AppContext scoped)
        // Skybox and Environment Map
        const rgbeLoader = new THREE.RGBELoader(manager);
        rgbeLoader.load('https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr', function(texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.background = envMap;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
        }, undefined, function(error) {
            console.error('An error occurred loading the HDR skybox:', error);
            scene.background = new THREE.Color(0x202025);
        });

        // OrbitControls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 20;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xFFFFEE, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 30;
        directionalLight.shadow.camera.left = -7;
        directionalLight.shadow.camera.right = 7;
        directionalLight.shadow.camera.top = 7;
        directionalLight.shadow.camera.bottom = -7;
        directionalLight.shadow.bias = -0.0005;

        // Post-processing
        try {
            composer = new THREE.EffectComposer(renderer);
            const renderPass = new THREE.RenderPass(scene, camera);
            composer.addPass(renderPass);
            const bloomPass = new THREE.BloomPass(1.5, 25, 5.0, 256);
            composer.addPass(bloomPass);
            const bokehPass = new THREE.BokehPass(scene, camera, {
                focus: 5.0, aperture: 0.020, maxblur: 0.008,
                width: window.innerWidth, height: window.innerHeight
            });
            composer.addPass(bokehPass);
            const copyPass = new THREE.ShaderPass(THREE.CopyShader);
            copyPass.renderToScreen = true;
            composer.addPass(copyPass);
        } catch (error) {
            console.error('Error setting up post-processing:', error);
            composer = null;
        }

        // Create navigation buttons dynamically (from original main)
        sitesData.forEach((site, index) => {
            if (!navigationControlsContainer) return;
            const button = document.createElement('button');
            button.textContent = `Site ${index + 1}`;
            button.addEventListener('click', () => {
                if (!isTransitioning && index !== currentSiteIndex) {
                    _switchSite(index);
                }
            });
            navigationControlsContainer.appendChild(button);
        });
        currentSiteIndex = 0; // Set initial site index for UI consistency
        _updateNavigationButtons(); // Initialize button states

        // Start render loop (define render function inside AppContext or make it callable)
        requestAnimationFrame(render);


        // Event Listeners (from original main, adapted for AppContext)
        document.getElementById('prevButton')?.addEventListener('click', () => {
            if (currentSiteIndex > 0) {
                _switchSite(currentSiteIndex - 1);
            }
        });
        document.getElementById('nextButton')?.addEventListener('click', () => {
            if (currentSiteIndex < sitesData.length - 1) {
                _switchSite(currentSiteIndex + 1);
            }
        });
        window.addEventListener('resize', () => {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
            if (composer) composer.setSize(window.innerWidth, window.innerHeight);
        });
        window.addEventListener('keydown', (event) => {
            if (event.key === '1') _switchSite(0);
            else if (event.key === '2') _switchSite(1);
            else if (event.key === '3') _switchSite(2);
        });
    }

    function render() {
        const elapsedTime = clock.getElapsedTime();
        if (isTransitioning === 'initial_in') {
            const deltaTime = elapsedTime - transitionStartTime;
            let progress = Math.min(deltaTime / transitionDuration, 1);
            if (currentSiteGroup) setGroupOpacity(currentSiteGroup, progress);
            if (descriptionElement && progress > 0.2) descriptionElement.classList.add('visible');
            if (progress >= 1) {
                if (currentSiteGroup) setGroupOpacity(currentSiteGroup, 1);
                isTransitioning = false;
                _updateNavigationButtons();
                if (descriptionElement) descriptionElement.classList.add('visible');
            }
        } else if (isTransitioning === 'crossfade') {
            const deltaTime = elapsedTime - transitionStartTime;
            let progress = Math.min(deltaTime / transitionDuration, 1);
            if (outgoingSiteGroup) setGroupOpacity(outgoingSiteGroup, 1 - progress);
            if (incomingSiteGroup) setGroupOpacity(incomingSiteGroup, progress);
            if (descriptionElement && progress > 0.5) descriptionElement.classList.add('visible');
            if (progress >= 1) {
                if (outgoingSiteGroup && scene) scene.remove(outgoingSiteGroup); // Check scene
                // Dispose geometry/material of outgoingSiteGroup (omitted for brevity, but important in real app)
                outgoingSiteGroup = null;
                currentSiteGroup = incomingSiteGroup;
                incomingSiteGroup = null;
                if (currentSiteGroup) setGroupOpacity(currentSiteGroup, 1);
                if (descriptionElement) descriptionElement.classList.add('visible');
                isTransitioning = false;
            }
        }
        if (controls) controls.update();
        if (composer) composer.render();
        else if (renderer && scene && camera) renderer.render(scene, camera); // Fallback if composer failed
        requestAnimationFrame(render);
    }


    // Public API for testing
    return {
        // State
        getSitesData: () => sitesData,
        getCurrentSiteIndex: () => currentSiteIndex,
        setCurrentSiteIndex: (idx) => currentSiteIndex = idx,
        getIsTransitioning: () => isTransitioning,
        setIsTransitioning: (val) => isTransitioning = val,
        setCurrentSiteGroup: (group) => currentSiteGroup = group,
        getCurrentSiteGroup: () => currentSiteGroup,
        setOutgoingSiteGroup: (group) => outgoingSiteGroup = group,
        getOutgoingSiteGroup: () => outgoingSiteGroup,
        setIncomingSiteGroup: (group) => incomingSiteGroup = group,
        getIncomingSiteGroup: () => incomingSiteGroup,
        setTransitionStartTime: (time) => transitionStartTime = time,
        // Mockable dependencies
        setScene: (mockScene) => scene = mockScene,
        setClock: (mockClock) => clock = mockClock,
        setDescriptionElement: (el) => descriptionElement = el,
        setNavigationControlsContainer: (el) => navigationControlsContainer = el,
        setControls: (mockControls) => controls = mockControls,
        // Functions
        switchSite: _switchSite,
        setGroupOpacity,
        updateNavigationButtons: _updateNavigationButtons,
        createPlaceholderSite1, // Exposing for potential spy
        createPlaceholderSite2,
        createPlaceholderSite3,
        initMainLogic
    };
})();

// function updateNavigationButtons() { //This is the old global one, should be removed or ensured it's not used.
    // This function will be moved into AppContext or removed if fully mocked
//    const prevButton = document.getElementById('prevButton');
//    const nextButton = document.getElementById('nextButton');
//
//    if (prevButton) {
//        prevButton.disabled = currentSiteIndex <= 0; // These would use AppContext.getCurrentSiteIndex()
//        prevButton.classList.toggle('active', false);
//    }
//    if (nextButton) {
//        nextButton.disabled = currentSiteIndex >= sitesData.length - 1; // AppContext.getSitesData().length
//        nextButton.classList.toggle('active', false);
//    }
//}

// Add event listeners for navigation buttons are now inside AppContext.initMainLogic

function main() { // HTML still calls main(), so this function should start the app via AppContext
    AppContext.initMainLogic();
}

// The actual main() call is now done by the HTML which calls the function main().
// The try-catch block should ideally be inside main() or initMainLogic to handle errors during app initialization.
// For simplicity of this refactoring step, leaving the try-catch around the AppContext.initMainLogic() call at the bottom of the file.
// However, the script is loaded with `defer`, so `main()` is called after DOM parsing.
// The `AppContext.initMainLogic()` call at the very end of the script might be redundant if HTML `onload` or `main()` call is the entry point.
// Let's ensure only `main()` is the entry point from HTML, and it calls `AppContext.initMainLogic()`.

// Remove the direct call to AppContext.initMainLogic() here, as main() will call it.
// try {
// AppContext.initMainLogic();
// } catch (error) {
// console.error('Error initializing application:', error);
// const loadingIndicator = document.getElementById('loadingIndicator');
// if (loadingIndicator) {
// loadingIndicator.innerHTML = '<p>Error initializing 3D scene. Please check console and refresh.</p>';
//    }
//}
// --- End of section to be moved into AppContext --- is misleading, as initMainLogic is now defined.


// --- Unit Test Section ---
// Note: These tests are basic and run in the same environment as the application.
// They are intended for simple logic checks, not for comprehensive testing.
// Due to dependencies (like THREE.Clock, DOM elements, and scene graph manipulations),
// some tests are limited to checking guard clauses or simple state changes.

function testSitesDataIntegrity() {
    console.group("--- Test: sitesData Integrity ---");

    console.assert(Array.isArray(sitesData), "sitesData should be an array.");
    if (!Array.isArray(sitesData)) {
        console.error("sitesData is not an array. Further tests skipped.");
        console.groupEnd();
        return;
    }

    console.assert(sitesData.length > 0, "sitesData should not be empty.");

    sitesData.forEach((site, index) => {
        console.group(`Testing site data at index ${index}: ${site.name || 'Unknown Name'}`);
        console.assert(typeof site.name === 'string', `Site ${index} 'name' should be a string.`);
        console.assert(typeof site.description === 'string', `Site ${index} 'description' should be a string.`);
        console.assert(typeof site.createFunc === 'function', `Site ${index} 'createFunc' should be a function.`);
        console.groupEnd();
    });

    console.groupEnd();
}

function testSwitchSiteLogic() {
    console.group("--- Test: switchSite Logic ---");

    // Prerequisite: sitesData must exist and have some length, clock must be initialized.
    if (!sitesData || sitesData.length === 0 || !clock) {
        console.error("Cannot run testSwitchSiteLogic: sitesData or clock not initialized.");
        console.groupEnd();
        return;
    }

    // Store initial state to attempt restoration (limited effectiveness)
    const initialCurrentSiteIndex = currentSiteIndex;
    const initialIsTransitioning = isTransitioning;

    // Test 1: Switch to an invalid negative index
    console.log("Test 1: Switch to invalid negative index (-1)");
    currentSiteIndex = 0; // Known start
    isTransitioning = false;
    switchSite(-1);
    console.assert(currentSiteIndex === 0, "currentSiteIndex should remain 0 after trying to switch to -1.");
    console.assert(isTransitioning === false, "isTransitioning should remain false after trying to switch to -1.");

    // Test 2: Switch to an invalid high index
    console.log(`Test 2: Switch to invalid high index (${sitesData.length})`);
    currentSiteIndex = 0; // Known start
    isTransitioning = false;
    switchSite(sitesData.length);
    console.assert(currentSiteIndex === 0, `currentSiteIndex should remain 0 after trying to switch to ${sitesData.length}.`);
    console.assert(isTransitioning === false, `isTransitioning should remain false after trying to switch to ${sitesData.length}.`);

    // Test 3: Switch to the current site index (should not trigger transition)
    if (sitesData.length > 0) {
        currentSiteIndex = 0; // Known start
        isTransitioning = false; // Ensure not transitioning
        // To properly test this, currentSiteGroup needs to be non-null, indicating site is loaded.
        // This setup is complex here. We assume if !isTransitioning and index is current, it should bail.
        // The `currentSiteGroup && !isTransitioning` part of the guard is hard to reliably mock here.
        // The `(index === currentSiteIndex && !isTransitioning)` part is what we primarily test.
        console.log(`Test 3: Switch to current site index (0) while not transitioning`);
        switchSite(0);
        console.assert(currentSiteIndex === 0, "currentSiteIndex should remain 0 after trying to switch to current index.");
        console.assert(isTransitioning === false, "isTransitioning should remain false after trying to switch to current index.");
    }

    // Test 4: Attempt to switch while a transition is already in progress
    if (sitesData.length > 1) {
        console.log("Test 4: Attempt to switch while already transitioning");
        currentSiteIndex = 0; // Known start
        isTransitioning = true; // Simulate a transition in progress
        switchSite(1); // Attempt to switch to a different valid site
        console.assert(currentSiteIndex === 0, "currentSiteIndex should remain 0 when trying to switch while already transitioning.");
        // isTransitioning should also remain true, but switchSite doesn't modify it if it's already true and bails.
        console.assert(isTransitioning === true, "isTransitioning should remain true.");
    }

    // Test 5: Successful switch (limited test due to side effects)
    // This test WILL call createFunc and modify global state more deeply.
    // It's included to check the basic path but is not a pure unit test.
    if (sitesData.length > 1) {
        console.log("Test 5: Switch to a valid different site (e.g., site 1)");
        currentSiteIndex = 0; // Start at site 0
        isTransitioning = false;
        // Mock parts that interact with 3D objects if possible, or ensure cleanup.
        // For now, we accept it will call createFunc for incomingSiteGroup.
        // outgoingSiteGroup will be the current currentSiteGroup (if any from previous app state).

        // Minimal setup for a successful switch to proceed far enough
        if (!currentSiteGroup && sitesData[0]) { // If no site is loaded (e.g. tests run before full app init)
           // currentSiteGroup = sitesData[0].createFunc(); // Avoid this if createFunc is heavy
           // For this test, we'll assume currentSiteGroup might be null or a real group.
        }

        switchSite(1);
        console.assert(currentSiteIndex === 1, "currentSiteIndex should be 1 after switching to site 1.");
        // If switchSite was successful, it should set isTransitioning.
        // The type of transition depends on whether currentSiteGroup was initially null or not.
        // Given the test setup, it's hard to guarantee which state ('initial_in' or 'crossfade') it will be.
        // We expect it to be some form of transitioning.
        console.assert(isTransitioning === 'crossfade' || isTransitioning === 'initial_in', "isTransitioning should be true (crossfade or initial_in) after valid switch.");

        // Clean up from Test 5: Reset isTransitioning to allow other tests or app to run cleanly.
        // This is a hack due to lack of proper test isolation.
        if (isTransitioning) { // If the switch actually happened and set isTransitioning
            // Simulate transition completion for cleanup:
            if (isTransitioning === 'crossfade') {
                if (outgoingSiteGroup) scene.remove(outgoingSiteGroup); // Minimal cleanup
                currentSiteGroup = incomingSiteGroup;
            }
            isTransitioning = false;
            outgoingSiteGroup = null;
            incomingSiteGroup = null;
        }
    }

    // Restore initial state (partially)
    currentSiteIndex = initialCurrentSiteIndex;
    isTransitioning = initialIsTransitioning;
    // Note: Deeper state like scene graph, created groups are not reset here.

    console.groupEnd();
}


function runAllUnitTests() {
    console.log("===== Starting All Unit Tests =====");
    testSitesDataIntegrity();
    testSwitchSiteLogic();
    // Add calls to other test functions here
    console.log("===== All Unit Tests Complete =====");
}

// Ensure clock is initialized if testSwitchSiteLogic relies on it for transitionStartTime.
// If main() initializes clock, tests depending on it should run after that part of main().
// For safety, tests that modify global state heavily are best run in isolation.
