// SiteManager.js
import * as THREE from 'three';

export default class SiteManager {
    constructor(scene, gltfLoader, onTransitionEndCallback) {
        this.scene = scene;
        this.gltfLoader = gltfLoader;
        this.onTransitionEnd = onTransitionEndCallback;

        this.sitesData = [
            {
                name: "Parrot's Perch",
                modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Parrot.glb',
                description: "A colorful parrot rests in a lush, jungle-like clearing. The vibrant foliage and ancient trees create a serene, natural atmosphere.",
                createFunc: this.createParrotSite.bind(this)
            },
            {
                name: "Duck's Pond",
                modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Duck.glb',
                description: "A gentle duck glides across a tranquil pond. The water ripples softly, reflecting the sky above.",
                createFunc: this.createDuckSite.bind(this)
            },
            {
                name: "Horse's Meadow",
                modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Horse.glb',
                description: "A majestic horse stands in a wide, open meadow. A rustic fence lines the field, adding to the pastoral charm.",
                createFunc: this.createHorseSite.bind(this)
            },
            {
                name: "Flamingo Beach",
                modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo.glb',
                description: "A graceful flamingo wades in the shallow waters of a sandy beach. The sun glistens on its vibrant pink feathers.",
                createFunc: this.createFlamingoSite.bind(this)
            }
        ];

        this.currentSiteIndex = -1;
        this.currentSiteGroup = null;
        this.outgoingSiteGroup = null;
        this.incomingSiteGroup = null;
        this.isTransitioning = false;
        this.transitionDuration = 1.0;
        this.transitionStartTime = 0;
    }

    createGroundPlane(color, size = 20) {
        const groundGeometry = new THREE.PlaneGeometry(size, size);
        const groundMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.2 });
        const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = -1;
        groundPlane.receiveShadow = true;
        return groundPlane;
    }

    createParrotSite(modelUrl) {
        const siteGroup = new THREE.Group();
        // Diorama elements
        siteGroup.add(this.createGroundPlane(0x228B22)); // ForestGreen
        for (let i = 0; i < 5; i++) {
            const tree = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 2, 8), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            tree.position.set((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10);
            tree.castShadow = true;
            siteGroup.add(tree);
        }
        this.loadAndAddModel(modelUrl, siteGroup, { scale: 0.5 });
        return siteGroup;
    }

    createFlamingoSite(modelUrl) {
        const siteGroup = new THREE.Group();
        siteGroup.add(this.createGroundPlane(0xF4A460)); // SandyBrown
        this.loadAndAddModel(modelUrl, siteGroup, { scale: 0.5 });
        return siteGroup;
    }

    createDuckSite(modelUrl) {
        const siteGroup = new THREE.Group();
        const pond = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshStandardMaterial({ color: 0x4682B4, transparent: true, opacity: 0.7 }));
        pond.rotation.x = -Math.PI / 2;
        pond.position.y = -0.9;
        siteGroup.add(pond);
        this.loadAndAddModel(modelUrl, siteGroup, { scale: 1.0 });
        return siteGroup;
    }

    createHorseSite(modelUrl) {
        const siteGroup = new THREE.Group();
        siteGroup.add(this.createGroundPlane(0x90EE90)); // LightGreen
        // Simple fence
        for (let i = 0; i < 10; i++) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            post.position.set(-5 + i, -0.75, -5);
            siteGroup.add(post);
        }
        this.loadAndAddModel(modelUrl, siteGroup, { scale: 0.5 });
        return siteGroup;
    }

    loadAndAddModel(modelUrl, siteGroup, { scale = 1.0 }) {
        if (!this.gltfLoader) return;
        this.gltfLoader.load(modelUrl, (gltf) => {
            const model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.position.y = -1;
            model.traverse(node => { if (node.isMesh) node.castShadow = true; });
            siteGroup.add(model);

            if (gltf.animations && gltf.animations.length) {
                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
                siteGroup.userData.mixer = mixer;
            }
        }, undefined, (error) => {
            console.error(`Error loading model from ${modelUrl}:`, error);
        });
    }

    switchSite(index, clock) {
        if (this.isTransitioning || index === this.currentSiteIndex) {
            return;
        }
        if (index < 0 || index >= this.sitesData.length) {
            console.warn("Invalid site index:", index);
            return;
        }

        this.isTransitioning = true;
        this.transitionStartTime = clock.getElapsedTime();

        if (this.currentSiteGroup) {
            this.outgoingSiteGroup = this.currentSiteGroup;
            if (this.outgoingSiteGroup.userData.mixer) {
                this.outgoingSiteGroup.userData.mixer.stopAllAction();
            }
        }

        this.currentSiteIndex = index;
        const newSiteData = this.sitesData[this.currentSiteIndex];
        this.incomingSiteGroup = newSiteData.createFunc(newSiteData.modelUrl);
        this.setGroupOpacity(this.incomingSiteGroup, 0);
        this.scene.add(this.incomingSiteGroup);

        // The main app will handle camera and description updates
        return {
            description: newSiteData.description
        };
    }

    update(delta, elapsedTime) {
        if (this.currentSiteGroup && this.currentSiteGroup.userData.mixer) {
            this.currentSiteGroup.userData.mixer.update(delta);
        }

        if (this.isTransitioning) {
            const progress = Math.min((elapsedTime - this.transitionStartTime) / this.transitionDuration, 1);

            if (this.outgoingSiteGroup) {
                this.setGroupOpacity(this.outgoingSiteGroup, 1 - progress);
            }
            if (this.incomingSiteGroup) {
                this.setGroupOpacity(this.incomingSiteGroup, progress);
            }

            if (progress >= 1) {
                if (this.outgoingSiteGroup) {
                    this.scene.remove(this.outgoingSiteGroup);
                }
                this.outgoingSiteGroup = null;
                this.currentSiteGroup = this.incomingSiteGroup;
                this.incomingSiteGroup = null;
                this.isTransitioning = false;
                if (this.onTransitionEnd) {
                    this.onTransitionEnd();
                }
            }
        }
    }

    setGroupOpacity(group, opacity) {
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

    getCurrentSiteData() {
        return this.sitesData[this.currentSiteIndex];
    }
}
