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
    let isTransitioning = false; // Can be false, 'in', or 'out'
    let transitionAlpha = 1; // Current alpha for fade
    const transitionDuration = 0.5; // Duration in seconds
    let transitionStartTime = 0;
    let siteToLoadAfterFadeOut = null; // Index of the site to load after fade out completes

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
        // currentSiteIndex is typically 0, ensured before this callback
        const initialSiteData = sitesData[currentSiteIndex]; // currentSiteIndex is 0 here
        currentSiteGroup = initialSiteData.createFunc();
        setGroupOpacity(currentSiteGroup, 0); // Start fully transparent
        scene.add(currentSiteGroup);
        if (descriptionElement) {
            descriptionElement.textContent = initialSiteData.description;
            descriptionElement.style.opacity = 0;
        }
        console.log(`Initial site: ${initialSiteData.name}`);
        controls.target.set(0,0,0);
        updateNavigationButtons(); // Call for initial state
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

    // Set a simple background color instead of skybox for now
    scene.background = new THREE.Color(0x000000);

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
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Slightly increased intensity
    directionalLight.position.set(10, 15, 10); // Adjusted position for better shadow angles
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Configure shadow camera properties
    directionalLight.shadow.mapSize.width = 2048; // Increased resolution
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.0005; // Mitigate shadow acne if necessary

    // const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(shadowHelper);

    try {
        // Post-processing Composer
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        // BloomPass: strength, kernelSize, sigma, resolution
        const bloomPass = new THREE.BloomPass(1.5, 25, 5.0, 512); // Adjusted for stronger bloom & higher res
        composer.addPass(bloomPass);
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
            new THREE.DodecahedronGeometry(0.8, 0),
            material
        );
        mainRock.position.y = 0.8;
        mainRock.castShadow = true;
        group.add(mainRock);

        for (let i = 0; i < 5; i++) {
            const size = Math.random() * 0.3 + 0.1;
            const elementHeight = size * (2 + Math.random());
            const element = new THREE.Mesh(
                new THREE.BoxGeometry(size, elementHeight, size),
                material
            );
            element.position.set(
                (Math.random() - 0.5) * 3,
                elementHeight / 2, // base on ground
                (Math.random() - 0.5) * 3
            );
            element.rotation.y = Math.random() * Math.PI;
            element.castShadow = true;
            group.add(element);
        }

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
        groundMesh.receiveShadow = true;
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
        mesh.castShadow = true;
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
        groundMesh.receiveShadow = true;
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
            pillar.castShadow = true;
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
        groundMesh.receiveShadow = true;
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
        if (isTransitioning || (index === currentSiteIndex && currentSiteGroup && !isTransitioning)) {
            console.warn("Transition in progress or site already loaded/targetted:", index, "current:", currentSiteIndex, "transitioning:", isTransitioning);
            return;
        }
        if (index < 0 || index >= sitesData.length) {
            console.warn("Invalid site index:", index);
            return;
        }

        siteToLoadAfterFadeOut = index;
        isTransitioning = 'out';
        // transitionAlpha is already 1 (or should be from previous fade in)
        transitionStartTime = clock.getElapsedTime();

        // Description will be updated when the new site is loaded after fade out,
        // but we can hide the current one immediately if it's visible.
        if (descriptionElement) {
            // Start fading out description text if it's currently visible
            // This will be more robustly handled in the render loop if we want text to fade with 3D model
        }
    }

    // Initial site load setup - MOVED to manager.onLoad
    currentSiteIndex = 0; // Desired starting site index, used by manager.onLoad


    function render() { // Removed 'time' parameter
        const elapsedTime = clock.getElapsedTime();

        if (isTransitioning) {
            const deltaTime = elapsedTime - transitionStartTime;
            let progress = Math.min(deltaTime / transitionDuration, 1);

            if (isTransitioning === 'out') {
                transitionAlpha = 1 - progress;
                setGroupOpacity(currentSiteGroup, transitionAlpha);
                if (descriptionElement) descriptionElement.style.opacity = 0; // Keep description hidden during 3D fade out

                if (progress >= 1) {
                    if (currentSiteGroup) {
                        scene.remove(currentSiteGroup);
                        currentSiteGroup.traverse(child => {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(mat => mat.dispose());
                            }
                        });
                        currentSiteGroup = null; // Clear reference
                    }

                    currentSiteIndex = siteToLoadAfterFadeOut;
                    const newSiteData = sitesData[currentSiteIndex];
                    currentSiteGroup = newSiteData.createFunc();
                    setGroupOpacity(currentSiteGroup, 0); // Prepare for fade-in
                    scene.add(currentSiteGroup);

                    if (descriptionElement) {
                        descriptionElement.textContent = newSiteData.description;
                        // Opacity will be handled by fade-in part
                    }
                    console.log(`Switched to: ${newSiteData.name}`);
                    controls.target.set(0, 0, 0);

                    isTransitioning = 'in';
                    transitionAlpha = 0; // Reset alpha for fade-in
                    transitionStartTime = elapsedTime; // Reset start time for fade-in
                }
            } else if (isTransitioning === 'in') {
                transitionAlpha = progress;
                setGroupOpacity(currentSiteGroup, transitionAlpha);
                if (descriptionElement) descriptionElement.style.opacity = transitionAlpha;

                if (progress >= 1) {
                    isTransitioning = false;
                    setGroupOpacity(currentSiteGroup, 1); // Ensure full opacity
                    if (descriptionElement) descriptionElement.style.opacity = 1;
                    updateNavigationButtons(); // Update buttons on fade-in completion
                    // Optional: Reset transparency if needed
                    // currentSiteGroup.traverse(child => {
                    //     if (child.isMesh && child.material) {
                    //         const materials = Array.isArray(child.material) ? child.material : [child.material];
                    //         materials.forEach(mat => {
                    //             if (mat.opacity >= 1) mat.transparent = false; // Example condition
                    //         });
                    //     }
                    // });
                }
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
