// Basic Three.js scene setup
function main() {
    const canvas = document.querySelector('#webglCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const descriptionElement = document.getElementById('siteDescription');

    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 5; // Adjusted for OrbitControls
    camera.position.y = 2; // Adjust y position to look slightly down at the site
    camera.lookAt(0, 0, 0); // Ensure camera looks at the origin where the site will be centered

    const scene = new THREE.Scene();

    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1; // Allow closer zoom
    controls.maxDistance = 20; // Allow farther zoom
    // controls.maxPolarAngle = Math.PI / 2; // Keep this if you don't want to go below ground

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5); // Positioned to cast nice shadows
    scene.add(directionalLight);

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
            group.add(element);
        }
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
        group.add(mesh);
        // group.position.y = 0.5; // Lift the whole group if needed, but individual mesh adjustment is often better
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
            group.add(pillar);
        }
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
    let currentSiteIndex = 0;

    function switchSite(index) {
        if (index < 0 || index >= sitesData.length) {
            console.warn("Invalid site index:", index);
            return;
        }

        if (currentSiteGroup) {
            scene.remove(currentSiteGroup);
            // Basic geometry and material cleanup (optional but good practice)
            currentSiteGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        currentSiteIndex = index;
        const siteData = sitesData[currentSiteIndex];

        currentSiteGroup = siteData.createFunc();
        scene.add(currentSiteGroup);
        scene.background = new THREE.Color(siteData.bgColor);

        if (descriptionElement) {
            descriptionElement.textContent = siteData.description;
        } else {
            console.error("Description element not found!");
        }

        console.log(`Switched to: ${siteData.name}, Background: #${siteData.bgColor.toString(16).padStart(6, '0')}`);
        // Ensure controls target is reasonable, e.g., origin if sites are centered there
        controls.target.set(0, 0, 0);
    }

    // Initial site load
    switchSite(0);


    function render(time) {
        time *= 0.001;  // convert time to seconds

        // No specific animation for the site itself for now, OrbitControls handles camera
        // If site1 had animations, they would be updated here.
        // e.g., site1.rotation.y = time * 0.1;


        controls.update(); // only required if controls.enableDamping or controls.autoRotate are set to true
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
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

main();
