// Basic Three.js scene setup
let currentSiteIndex = 0;
let currentSiteGroup = null;

const sitesData = [
    {
        name: "Site 1",
        description: "A rocky outcrop in Western Australia featuring unique geological formations.",
        createFunc: createPlaceholderSite1
    },
    {
        name: "Site 2",
        description: "An ancient Aboriginal rock art site with wave-like formations.",
        createFunc: createPlaceholderSite2
    }
];

function switchSite(newIndex) {
    if (newIndex < 0 || newIndex >= sitesData.length || isTransitioning) return;
    
    isTransitioning = 'out';
    transitionAlpha = 1;
    transitionStartTime = clock.getElapsedTime();
    siteToLoadAfterFadeOut = newIndex;
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    
    if (prevButton) {
        prevButton.disabled = currentSiteIndex <= 0;
        prevButton.classList.toggle('active', false);
    }
    if (nextButton) {
        nextButton.disabled = currentSiteIndex >= sitesData.length - 1;
        nextButton.classList.toggle('active', false);
    }
}

// Add event listeners for navigation buttons
document.getElementById('prevButton')?.addEventListener('click', () => {
    if (currentSiteIndex > 0) {
        switchSite(currentSiteIndex - 1);
    }
});

document.getElementById('nextButton')?.addEventListener('click', () => {
    if (currentSiteIndex < sitesData.length - 1) {
        switchSite(currentSiteIndex + 1);
    }
});

function main() {
    const canvas = document.querySelector('#webglCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); // Added antialias for potentially better shadow edges
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    const descriptionElement = document.getElementById('siteDescription');
    const loadingIndicator = document.getElementById('loadingIndicator'); // Get loading indicator

    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 5; // Adjusted for OrbitControls
    camera.position.y = 2; // Adjust y position to look slightly down at the site
    camera.lookAt(0, 0, 0); // Ensure camera looks at the origin where the site will be centered

    const scene = new THREE.Scene();
    
    // Initialize clock before any animations
    const clock = new THREE.Clock();
    clock.start(); // Explicitly start the clock
    
    let composer; // Declare composer here

    // Transition variables
    let isTransitioning = false; // Can be false, 'initial_in', or 'crossfade'
    const transitionDuration = 1.0; // Duration in seconds (increased for smoother crossfade)
    let transitionStartTime = 0;
    let outgoingSiteGroup = null;
    let incomingSiteGroup = null;

    // Loading Manager
    const manager = new THREE.LoadingManager();
    manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
        console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        if (loadingIndicator) loadingIndicator.style.display = 'flex'; // Show loading indicator
    };
    manager.onLoad = function ( ) {
        console.log( 'Loading complete!');
        if (loadingIndicator) {
            loadingIndicator.style.transition = 'opacity 0.5s';
            loadingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }, 500); // Match CSS transition duration
        }

        // Start the fade-in for the first site (logic moved here)
    // currentSiteIndex is typically 0, should be set before manager.onLoad if not 0
    const initialSiteData = sitesData[currentSiteIndex];
        currentSiteGroup = initialSiteData.createFunc();
        setGroupOpacity(currentSiteGroup, 0); // Start fully transparent
        scene.add(currentSiteGroup);

        if (descriptionElement) {
            descriptionElement.textContent = initialSiteData.description;
        descriptionElement.classList.remove('visible'); // Ensure it's hidden initially
        }
        console.log(`Initial site: ${initialSiteData.name}`);
        controls.target.set(0,0,0);
    // updateNavigationButtons(); // Called at the end of 'initial_in' transition

    isTransitioning = 'initial_in'; // Trigger initial fade-in
    transitionStartTime = clock.getElapsedTime();
    };
    manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    manager.onError = function ( url ) {
        console.error( 'There was an error loading ' + url );
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<p>Error loading assets. Please try refreshing.</p>'; // Update text
            loadingIndicator.style.display = 'flex'; // Ensure it's visible
        }
    };

    // Skybox and Environment Map
    const rgbeLoader = new THREE.RGBELoader(manager); // Use existing manager
    // Default type for RGBELoader is usually fine for standard .hdr files (FloatType or HalfFloatType)
    // rgbeLoader.setDataType(THREE.UnsignedByteType); // This line was likely incorrect for true HDR .hdr files
    rgbeLoader.load('https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr', function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader(); // Pre-compile for efficiency

        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.background = envMap;
        scene.environment = envMap; // For PBR materials

        texture.dispose(); // Dispose of the original loaded texture
        pmremGenerator.dispose(); // Dispose of the PMREMGenerator
    }, undefined, function(error) {
        console.error('An error occurred loading the HDR skybox:', error);
        // Fallback: set a simple color background if HDR fails to load
        // Ensure this fallback color is distinct enough if the default black was intended to be removed.
        scene.background = new THREE.Color(0x202025); // A very dark grey/blue as fallback
    });


    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1; // Allow closer zoom
    controls.maxDistance = 20; // Allow farther zoom
    // controls.maxPolarAngle = Math.PI / 2; // Keep this if you don't want to go below ground

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Reduced intensity
    scene.add(ambientLight); // Intensity remains 0.5
    const directionalLight = new THREE.DirectionalLight(0xFFFFEE, 0.8); // Slightly warm color, reduced intensity
    directionalLight.position.set(10, 20, 5); // Steeper angle, more from one side
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Configure shadow camera properties
    directionalLight.shadow.mapSize.width = 2048; // Keep 2048x2048
    directionalLight.shadow.mapSize.height = 2048;
    // Tighter frustum for better shadow resolution on small sites
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 30; // Max distance shadows are needed
    directionalLight.shadow.camera.left = -7; // Covering an area of 14x14 units
    directionalLight.shadow.camera.right = 7;
    directionalLight.shadow.camera.top = 7;
    directionalLight.shadow.camera.bottom = -7;
    directionalLight.shadow.bias = -0.0005; // Keep bias, adjust if acne/peter-panning occurs

    // const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(shadowHelper); // Uncomment to debug shadow frustum

    try {
        // Post-processing Composer
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        // BloomPass: strength, kernelSize, sigma, resolution
        const bloomPass = new THREE.BloomPass(1.5, 25, 5.0, 256); // Reduced resolution for performance
        composer.addPass(bloomPass);

        // BokehPass for Depth of Field
        // Note: BokehPass might require specific camera near/far settings and object distances for good effect.
        // The current camera has near=0.1, far=5. Objects are relatively close.
        // Focus needs to be a value in world units from the camera.
        // If camera is at z=5, looking at origin, an object at origin is 5 units away.
        // Let's try focusing on something ~1-2 units in front of the camera (so, world z of 3-4).
        // Or, more practically, set focus to the distance of the objects (e.g. camera.position.z - target.z).
        // For now, sites are near origin (0,0,0). Camera is at (0,2,5). Distance is roughly Math.sqrt(2*2 + 5*5) ~ 5.3.
        // Let's set focus to around this distance.
        const bokehPass = new THREE.BokehPass(scene, camera, {
            focus: 5.0,       // Distance to the plane of perfect focus.
            aperture: 0.020, // DOF intensity. Smaller values for shallower depth of field.
            maxblur: 0.008,   // Max blur amount.
            width: window.innerWidth,
            height: window.innerHeight
        });
        composer.addPass(bokehPass);

        // If the last pass doesn't render to screen, add a CopyShader pass.
        // Check if bloomPass or bokehPass sets renderToScreen = true internally.
        // Based on typical Three.js examples, the last custom pass might need a copy pass.
        const copyPass = new THREE.ShaderPass(THREE.CopyShader);
        copyPass.renderToScreen = true; // Explicitly render to screen
        composer.addPass(copyPass);


    } catch (error) {
        console.error('Error setting up post-processing:', error);
        // Fallback to normal rendering
        composer = null;
    }

    // If BloomPass is the last pass, it should render to screen by default.
    // If not, or if issues, uncomment and add CopyShader pass:
    // const copyPass = new THREE.ShaderPass(THREE.CopyShader);
    // copyPass.renderToScreen = true;
    // composer.addPass(copyPass);


    // Placeholder Site Functions
    function createPlaceholderSite1() {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({
            color: 0xCD853F, // Peru (sandy/rocky)
            roughness: 0.9,
            metalness: 0.1
        });

        const mainRock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.8, 1), // Added detail to dodecahedron
            material
        );
        mainRock.position.y = 0.8;
        mainRock.castShadow = true; // Already true
        mainRock.receiveShadow = false; // Rocks typically don't receive distinct shadows on themselves from other small rocks
        group.add(mainRock);

        for (let i = 0; i < 5; i++) {
            const size = Math.random() * 0.3 + 0.1;
            const elementHeight = size * (1 + Math.random()); // Slightly shorter elements
            const element = new THREE.Mesh(
                new THREE.BoxGeometry(size, elementHeight, size),
                material
            );
            element.position.set(
                (Math.random() - 0.5) * 2.5, // Closer to center
                elementHeight / 2, // base on ground
                (Math.random() - 0.5) * 2.5 // Closer to center
            );
            element.rotation.y = Math.random() * Math.PI;
            element.castShadow = true; // Already true
            element.receiveShadow = false;
            group.add(element);
        }

        // Add particle system (dust motes)
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = [];
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.03,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending // Brighter where particles overlap
        });

        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * 3; // Spread around the site area
            const y = Math.random() * 2;         // From ground up to height of 2
            const z = (Math.random() - 0.5) * 3;
            positions.push(x, y, z);
        }
        particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const dustMotes = new THREE.Points(particles, particleMaterial);
        group.add(dustMotes);


        // Add ground plane
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x907050, // Brownish
            roughness: 1.0,
            metalness: 0.0
        });
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0;
        groundMesh.receiveShadow = true; // Already true
        group.add(groundMesh);

        return group;
    }

    function createPlaceholderSite2() {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({
            color: 0xA0522D, // Sienna color
            roughness: 0.7,
            metalness: 0.3
        });

        const waveShape = new THREE.Shape();
        waveShape.moveTo(-2, 0);
        waveShape.absarc(0, 0, 2, Math.PI, 0, false); // Semi-circle base
        waveShape.lineTo(2, -1); // Sloping down
        waveShape.absarc(0, -1, 2, 0, Math.PI, true); // Inverted semi-circle
        waveShape.lineTo(-2, 0); // Close path

        const extrudeSettings = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 };
        const geometry = new THREE.ExtrudeGeometry(waveShape, extrudeSettings);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2; // Lay it flat
        mesh.scale.set(1, 1, 1.5); // Make it a bit longer/deeper
        mesh.position.y = 0.25; // Adjust if depth/bevel makes it go through ground
        mesh.castShadow = true;    // Already true
        mesh.receiveShadow = false; // Large rock formation, less likely to self-shadow in a distinct way from small features
        group.add(mesh);

        // Add ground plane
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x707070, // Greyish
            roughness: 1.0,
            metalness: 0.0
        });
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0; // Position slightly below the wave if needed, or adjust wave position
        groundMesh.receiveShadow = true; // Already true
        group.add(groundMesh);

        return group;
    }

    function createPlaceholderSite3() {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({
            color: 0x696969, // DimGray
            roughness: 0.6,
            metalness: 0.4
        });

        for (let i = 0; i < 8; i++) {
            const height = Math.random() * 3 + 1.5;
            const radius = Math.random() * 0.3 + 0.2;
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, height, 12),
                material
            );
            pillar.position.set(
                (Math.random() - 0.5) * 4,
                height / 2, // base on ground
                (Math.random() - 0.5) * 4
            );
            pillar.castShadow = true;    // Already true
            pillar.receiveShadow = true; // Pillars could receive shadows from each other
            group.add(pillar);
        }

        // Add ground plane
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x605040, // Darker earth
            roughness: 1.0,
            metalness: 0.0
        });
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0;
        groundMesh.receiveShadow = true; // Already true
        group.add(groundMesh);

        return group;
    }

    // Site Management
    const sitesData = [
        {
            name: "Site 1 (Pinnacles-like)",
            createFunc: createPlaceholderSite1,
            bgColor: 0xFAEBD7, // AntiqueWhite
            description: "Placeholder for The Pinnacles: Thousands of limestone pillars rising from the yellow sands of Nambung National Park."
        },
        {
            name: "Site 2 (Wave Rock-like)",
            createFunc: createPlaceholderSite2,
            bgColor: 0xFFE4B5,   // Moccasin
            description: "Placeholder for Wave Rock: A giant, multi-coloured granite wave about to crash into the bush. Located near Hyden."
        },
        {
            name: "Site 3 (Gorge/Pillars)",
            createFunc: createPlaceholderSite3,
            bgColor: 0xB0C4DE,    // LightSteelBlue
            description: "Placeholder for a Karijini-style Gorge: Ancient, deep gorges with dramatic rock formations and seasonal waterfalls."
        }
    ];
    let currentSiteGroup = null;
    let currentSiteIndex = -1; // Start with -1 to indicate no site is initially fully loaded
    const navigationControlsContainer = document.getElementById('navigationControls');

    function updateNavigationButtons() {
        if (!navigationControlsContainer) return;
        const buttons = navigationControlsContainer.querySelectorAll('button');
        buttons.forEach((button, index) => {
            if (index === currentSiteIndex) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    sitesData.forEach((site, index) => {
        if (!navigationControlsContainer) return;
        const button = document.createElement('button');
        button.textContent = `Site ${index + 1}`;
        button.addEventListener('click', () => {
            if (!isTransitioning && index !== currentSiteIndex) { // Only allow click if not already transitioning and not current site
                switchSite(index);
            }
        });
        navigationControlsContainer.appendChild(button);
    });

    // Helper function to set opacity for a group and its children
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

    function switchSite(index) {
    if (isTransitioning || (index === currentSiteIndex && !isTransitioning)) { // Simplified condition
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

    currentSiteIndex = index; // Update current site index immediately
    const newSiteData = sitesData[currentSiteIndex];

    incomingSiteGroup = newSiteData.createFunc();
    setGroupOpacity(incomingSiteGroup, 0);
    scene.add(incomingSiteGroup);

        if (descriptionElement) {
        descriptionElement.classList.remove('visible'); // Hide old one first
        descriptionElement.textContent = newSiteData.description; // Update text
        // Visibility of new description will be handled in render loop or at end of transition
    }

    updateNavigationButtons(); // Update navigation buttons to reflect the new site
    controls.target.set(0, 0, 0); // Reset camera target

    isTransitioning = 'crossfade';
    transitionStartTime = clock.getElapsedTime();
    currentSiteGroup = null; // Current site group is now the incoming one, old one is outgoing
}

// Initial site load setup - MOVED to manager.onLoad
currentSiteIndex = 0; // Desired starting site index, used by manager.onLoad


function render() { // Removed 'time' parameter
    const elapsedTime = clock.getElapsedTime();

    if (isTransitioning === 'initial_in') {
        const deltaTime = elapsedTime - transitionStartTime;
        let progress = Math.min(deltaTime / transitionDuration, 1);

        if (currentSiteGroup) setGroupOpacity(currentSiteGroup, progress);

        if (descriptionElement) {
            if (progress > 0.2) { // Start fading in description a bit into the site model fade-in
                descriptionElement.classList.add('visible');
            }
        }

        if (progress >= 1) {
            if (currentSiteGroup) setGroupOpacity(currentSiteGroup, 1); // Ensure full opacity
            isTransitioning = false;
            updateNavigationButtons(); // Update buttons on initial fade-in completion
            if (descriptionElement) descriptionElement.classList.add('visible'); // Ensure description is fully visible
        }
    } else if (isTransitioning === 'crossfade') {
        const deltaTime = elapsedTime - transitionStartTime;
        let progress = Math.min(deltaTime / transitionDuration, 1);

        if (outgoingSiteGroup) {
            setGroupOpacity(outgoingSiteGroup, 1 - progress);
        }
        if (incomingSiteGroup) {
            setGroupOpacity(incomingSiteGroup, progress);
        }

        if (descriptionElement) {
            if (progress > 0.5) { // Show description when new site is reasonably visible
                descriptionElement.classList.add('visible');
            }
        }

        if (progress >= 1) {
            if (outgoingSiteGroup) {
                scene.remove(outgoingSiteGroup);
                outgoingSiteGroup.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => mat.dispose());
                    }
                });
                outgoingSiteGroup = null;
            }

            currentSiteGroup = incomingSiteGroup; // The new site is now the current one
            incomingSiteGroup = null;

            if (currentSiteGroup) setGroupOpacity(currentSiteGroup, 1); // Ensure full opacity
            if (descriptionElement) descriptionElement.classList.add('visible'); // Ensure description is visible

            // updateNavigationButtons(); // Already called at the start of switchSite
            isTransitioning = false;
        }
    }

    controls.update();
    // renderer.render(scene, camera); // Old rendering call
    if (composer) composer.render(); // New rendering call
    requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight); // Update composer size
});

// Handle background color change on 'C' key press
window.addEventListener('keydown', (event) => {
    if (event.key === '1') {
        switchSite(0);
    } else if (event.key === '2') {
        switchSite(1);
    } else if (event.key === '3') {
        switchSite(2);
    }
    // Add other key controls if needed in the future
});
}

// Wrap the main call in try-catch
try {
    main();
} catch (error) {
    console.error('Error initializing application:', error);
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.innerHTML = '<p>Error initializing 3D scene. Please check console and refresh.</p>';
    }
}


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

// To run tests when developing, you could uncomment the following line,
// or call it from the browser console, or trigger it via a UI element.
// runAllUnitTests();
// Ensure clock is initialized if testSwitchSiteLogic relies on it for transitionStartTime.
// If main() initializes clock, tests depending on it should run after that part of main().
// For safety, tests that modify global state heavily are best run in isolation.
