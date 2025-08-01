// Basic Three.js scene setup

import UI from './UI.js';

// At the top of main.js, or in a new app-context.js if we were modularizing more
const AppContext = (function() {
    // This self-reference is the key to making the module's internal methods testable.
    // Internal functions will call methods off of `self` instead of calling each other directly.
    // This allows spies to be attached to the public interface in tests.
    let self;

    // All variables previously in main()'s direct scope go here
    let scene, renderer, camera, clock, composer, gltfLoader, ui; // Added gltfLoader
    // Site Management
    const sitesData = [
        {
            name: "Site 1 (Pinnacles-like)",
            createFunc: null, // Will be assigned actual function below
            bgColor: 0xFAEBD7, // AntiqueWhite
            description: "This site displays a 3D model of a parrot, loaded from the Three.js examples. It showcases GLTF model loading and animation."
        },
        {
            name: "Site 2 (Wave Rock-like)",
            createFunc: null, // Will be assigned actual function below
            bgColor: 0xFFE4B5,   // Moccasin
            description: "This site features a 3D model of a duck, also from the Three.js examples. Observe the model and its simple animation."
        },
        {
            name: "Site 3 (Gorge/Pillars)",
            createFunc: null, // Will be assigned actual function below
            bgColor: 0xB0C4DE,    // LightSteelBlue
            description: "This site presents a 3D model of a horse, provided by the Three.js examples. This demonstrates loading and displaying animated characters."
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
        const siteGroup = new THREE.Group();
        if (!gltfLoader) return siteGroup; // Guard against loader not being ready

        gltfLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Parrot.glb', (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.5, 0.5, 0.5);
            model.position.y = -1;
            siteGroup.add(model);

            if (gltf.animations && gltf.animations.length) {
                const mixer = new THREE.AnimationMixer(model);
                // Play all animations
                gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play();
                });
                siteGroup.userData.mixer = mixer;
            }
        }, undefined, (error) => {
            console.error('Error loading model for Site 1 (Parrot):', error);
        });
        return siteGroup;
    }
    function createPlaceholderSite2() {
        const siteGroup = new THREE.Group();
        if (!gltfLoader) return siteGroup;

        gltfLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Duck.glb', (gltf) => {
            const model = gltf.scene;
            // Duck model is small, might need larger scale
            model.scale.set(1, 1, 1); // Adjusted scale for Duck
            model.position.y = -1;
            siteGroup.add(model);

            // Duck.glb typically doesn't have animations in the base file, but check just in case
            if (gltf.animations && gltf.animations.length) {
                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play();
                });
                siteGroup.userData.mixer = mixer;
            }
        }, undefined, (error) => {
            console.error('Error loading model for Site 2 (Duck):', error);
        });
        return siteGroup;
    }
    function createPlaceholderSite3() {
        const siteGroup = new THREE.Group();
        if (!gltfLoader) return siteGroup;

        gltfLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Horse.glb', (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.5, 0.5, 0.5);
            model.position.y = -1;
            siteGroup.add(model);

            if (gltf.animations && gltf.animations.length) {
                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play();
                });
                siteGroup.userData.mixer = mixer;
            }
        }, undefined, (error) => {
            console.error('Error loading model for Site 3 (Horse):', error);
        });
        return siteGroup;
    }

    // Update sitesData to use these actual functions
    sitesData[0].createFunc = createPlaceholderSite1;
    sitesData[1].createFunc = createPlaceholderSite2;
    sitesData[2].createFunc = createPlaceholderSite3;

    // Internal helper function to access sitesData
    // This makes it available for other internal functions like _updateNavigationButtons
    // and can also be exposed in the return object.
    function getSitesData() {
        return sitesData;
    }

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

    function _switchSite(index) {
    if (isTransitioning || (index === currentSiteIndex && currentSiteGroup && !isTransitioning && isTransitioning !== 'initial_in')) { // Allow initial load
        console.warn("Transition in progress or site already loaded/targetted:", index, "current:", currentSiteIndex, "transitioning:", isTransitioning);
        return;
    }
    // The guard clause must also use the public getter to ensure it uses
    // the same (potentially mocked) data as the rest of the function.
    if (index < 0 || index >= self.getSitesData().length) {
        console.warn("Invalid site index:", index);
        return;
    }

    isTransitioning = 'crossfade';
    if (clock) transitionStartTime = clock.getElapsedTime();

    currentSiteIndex = index;

    if (currentSiteGroup) {
        outgoingSiteGroup = currentSiteGroup;
        // Stop animation of outgoing model
        if (outgoingSiteGroup.userData.mixer) {
            outgoingSiteGroup.userData.mixer.stopAllAction();
            // delete outgoingSiteGroup.userData.mixer; // Optional: explicitly clear
        }
    }

    // Use the public getter to allow this to be mocked in tests.
    const newSiteData = self.getSitesData()[currentSiteIndex];
    incomingSiteGroup = newSiteData.createFunc();
    self.setGroupOpacity(incomingSiteGroup, 0); // Call via self to allow spying
    if (scene) scene.add(incomingSiteGroup);

    if (descriptionElement) {
        descriptionElement.classList.remove('visible');
        descriptionElement.textContent = newSiteData.description;
    }

    // Animate camera
    const targetPosition = new THREE.Vector3(0, 2, 5);
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    new TWEEN.Tween(camera.position)
        .to(targetPosition, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
    new TWEEN.Tween(controls.target)
        .to(targetLookAt, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    currentSiteGroup = null;
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

    try {
        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 100; // Increased far plane
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.z = 5;
        camera.position.y = 2;
        camera.lookAt(0, 0, 0);

        scene = new THREE.Scene();
        clock = new THREE.Clock();
        clock.start();

        // Loading Manager (adapted from original main)
        const manager = new THREE.LoadingManager(); // Manager for GLTFLoader
        const hdrLoadingManager = new THREE.LoadingManager(); // New manager for HDR

        // Optional: Add handlers to hdrLoadingManager for logging if needed
        // hdrLoadingManager.onLoad = () => { console.log('HDR Environment map loaded.'); };
        // hdrLoadingManager.onError = (url) => { console.error('Error loading HDR: ' + url); };

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
        const rgbeLoader = new THREE.RGBELoader(hdrLoadingManager); // Uses HDR manager
        // Instantiate GLTFLoader here, using the same manager
        gltfLoader = new THREE.GLTFLoader(manager); // Uses main GLTF manager
        const fontLoader = new THREE.FontLoader();

        fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            ui = new UI(scene, font);
            const nextButton = ui.createText("Next Project", new THREE.Vector3(2, 0, 0), 0.2, 0xffffff);
            nextButton.userData.onClick = () => {
                if (currentSiteIndex < sitesData.length - 1) {
                    _switchSite(currentSiteIndex + 1);
                }
            };
        });

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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 8, 0.5);
        spotLight.position.set(0, 10, 5);
        spotLight.castShadow = true;
        scene.add(spotLight);

        const directionalLight = new THREE.DirectionalLight(0xFFFFEE, 0.5);
        directionalLight.position.set(10, 20, 5);
        scene.add(directionalLight);

        // Post-processing
        try {
            composer = new THREE.EffectComposer(renderer);
            const renderPass = new THREE.RenderPass(scene, camera);
            composer.addPass(renderPass);

            const bloomPass = new THREE.BloomPass(1, 15, 2, 512);
            composer.addPass(bloomPass);

            const filmPass = new THREE.FilmPass(0.35, 0.025, 648, false);
            composer.addPass(filmPass);

            const bokehPass = new THREE.BokehPass(scene, camera, {
                focus: 5.0,
                aperture: 0.01,
                maxblur: 0.005,
                width: window.innerWidth,
                height: window.innerHeight
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

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.userData.onClick) {
                    object.userData.onClick();
                }
            }
        });
    } catch (error) {
        console.error('Error initializing application:', error);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<p>Error initializing 3D scene. Please check console and refresh.</p>';
            loadingIndicator.style.display = 'flex'; // Or 'block'
            loadingIndicator.style.opacity = '1'; // Ensure it's not transparent
        }
    }
    }

    function render() {
        const delta = clock.getDelta(); // Get delta time for animation mixers
        const elapsedTime = clock.getElapsedTime(); // Keep elapsedTime for transitions

        // Update animation mixer for the current site
        if (currentSiteGroup && currentSiteGroup.userData.mixer) {
            currentSiteGroup.userData.mixer.update(delta);
        }

        if (isTransitioning === 'initial_in') {
            const transitionDeltaTime = elapsedTime - transitionStartTime; // Use elapsedTime for transition progress
            let progress = Math.min(transitionDeltaTime / transitionDuration, 1);
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
            if (outgoingSiteGroup && scene) {
                // Ensure mixer is stopped before removing (already done in _switchSite, but good as a safeguard)
                if (outgoingSiteGroup.userData.mixer) {
                    outgoingSiteGroup.userData.mixer.stopAllAction();
                }
                scene.remove(outgoingSiteGroup);
                // Consider disposing of geometry/materials if memory becomes an issue
                // For now, let GC handle it after removal.
            }
            outgoingSiteGroup = null;
            currentSiteGroup = incomingSiteGroup;
            incomingSiteGroup = null;
                if (currentSiteGroup) setGroupOpacity(currentSiteGroup, 1);
                if (descriptionElement) descriptionElement.classList.add('visible');

            isTransitioning = false;
            _updateNavigationButtons();
            }
        }
        if (controls) controls.update();
        TWEEN.update();
        if (composer) composer.render();
        else if (renderer && scene && camera) renderer.render(scene, camera); // Fallback if composer failed
        requestAnimationFrame(render);
    }


    // Public API for testing
    self = {
        // State
        getSitesData: getSitesData, // Expose the internal function
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
        setCamera: (mockCamera) => camera = mockCamera, // Expose for testing
        setDescriptionElement: (el) => descriptionElement = el,
        setNavigationControlsContainer: (el) => navigationControlsContainer = el,
        setControls: (mockControls) => controls = mockControls,
        // Functions
        switchSite: _switchSite,
        setGroupOpacity,
        createPlaceholderSite1, // Exposing for potential spy
        createPlaceholderSite2,
        createPlaceholderSite3,
        initMainLogic
    };
    return self;
})();

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

export default AppContext;
