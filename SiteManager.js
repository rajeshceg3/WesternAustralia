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
                modelUrl: './assets/models/Parrot.glb',
                description: "A colorful parrot rests in a lush, jungle-like clearing. The vibrant foliage and ancient trees create a serene, natural atmosphere.",
                createFunc: this.createParrotSite.bind(this)
            },
            {
                name: "Stork's Sanctuary",
                modelUrl: './assets/models/Stork.glb',
                description: "A white stork wades gracefully through the wetland sanctuary. Its long legs move slowly through the water as it hunts.",
                createFunc: this.createStorkSite.bind(this)
            },
            {
                name: "Horse's Meadow",
                modelUrl: './assets/models/Horse.glb',
                description: "A majestic horse stands in a wide, open meadow. A rustic fence lines the field, adding to the pastoral charm.",
                createFunc: this.createHorseSite.bind(this)
            },
            {
                name: "Flamingo Beach",
                modelUrl: './assets/models/Flamingo.glb',
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

    createParrotSite(siteData, onProgress) {
        const siteGroup = new THREE.Group();
        // Diorama elements
        siteGroup.add(this.createGroundPlane(0x228B22)); // ForestGreen
        for (let i = 0; i < 5; i++) {
            const tree = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 2, 8), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            tree.position.set((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10);
            tree.castShadow = true;
            siteGroup.add(tree);
        }
        this.loadAndAddModel(siteData.modelUrl, siteGroup, { scale: 0.5 }, onProgress);
        this.cacheMeshes(siteGroup);
        return siteGroup;
    }

    createFlamingoSite(siteData, onProgress) {
        const siteGroup = new THREE.Group();
        siteGroup.add(this.createGroundPlane(0xF4A460)); // SandyBrown
        this.loadAndAddModel(siteData.modelUrl, siteGroup, { scale: 0.5 }, onProgress);
        this.cacheMeshes(siteGroup);
        return siteGroup;
    }

    createStorkSite(siteData, onProgress) {
        const siteGroup = new THREE.Group();
        // Add a ground plane below the pond for continuity
        siteGroup.add(this.createGroundPlane(0x228B22)); // ForestGreen ground
        const pond = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshStandardMaterial({ color: 0x4682B4, transparent: true, opacity: 0.7 }));
        pond.rotation.x = -Math.PI / 2;
        pond.position.y = -0.9;
        siteGroup.add(pond);
        this.loadAndAddModel(siteData.modelUrl, siteGroup, { scale: 1.0 }, onProgress);
        this.cacheMeshes(siteGroup);
        return siteGroup;
    }

    createHorseSite(siteData, onProgress) {
        const siteGroup = new THREE.Group();
        siteGroup.add(this.createGroundPlane(0x90EE90)); // LightGreen
        // Simple fence
        for (let i = 0; i < 10; i++) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            post.position.set(-5 + i, -0.75, -5);
            siteGroup.add(post);
        }
        this.loadAndAddModel(siteData.modelUrl, siteGroup, { scale: 0.5 }, onProgress);
        this.cacheMeshes(siteGroup);
        return siteGroup;
    }

    loadAndAddModel(modelUrl, siteGroup, { scale = 1.0 }, onProgress) {
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
            // Update cache after async load
            this.cacheMeshes(siteGroup);
        }, onProgress, (error) => {
            console.error(`Error loading model from ${modelUrl}:`, error);

            // Create a placeholder if loading fails
            const placeholderGeometry = new THREE.BoxGeometry(1, 1, 1);
            const placeholderMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
            const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
            placeholder.position.y = 0;
            placeholder.scale.set(scale, scale, scale);
            siteGroup.add(placeholder);

            // Propagate error to the manager to let the UI know
            if (this.gltfLoader.manager.onError) {
                this.gltfLoader.manager.onError(modelUrl);
            }
            // Update cache even if placeholder
            this.cacheMeshes(siteGroup);
        });
    }

    switchSite(index, clock, onProgress, force = false) {
        if (this.isTransitioning || (index === this.currentSiteIndex && !force)) {
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

        // We need to inject the onProgress callback into the createFunc or modify how createFunc works.
        // The current createFuncs call loadAndAddModel directly.
        // We can override createFunc temporarily or modify them to accept options.
        // But createFunc is bound to this class.
        // Let's modify the createFuncs to accept onProgress? No, they take no args currently.
        // But we are calling newSiteData.createFunc().
        // Wait, the createFuncs are defined in sitesData as bound methods.
        // I need to change how they are called or change their signature.

        // It is cleaner to pass onProgress to createFunc.
        // I need to update all createFuncs signatures in this file.
        this.incomingSiteGroup = newSiteData.createFunc(newSiteData, onProgress);
        this.setGroupOpacity(this.incomingSiteGroup, 0);
        this.scene.add(this.incomingSiteGroup);

        // The main app will handle camera and description updates
        return {
            description: newSiteData.description
        };
    }

    disposeNode(node) {
        if (node.isMesh || node.isLine || node.isPoints) {
            if (node.geometry) {
                node.geometry.dispose();
            }
            if (node.material) {
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach(material => {
                    // Dispose of textures first
                    // Extended list of texture maps including PBR
                    const textureMaps = [
                        'map', 'aoMap', 'alphaMap', 'bumpMap', 'displacementMap',
                        'emissiveMap', 'envMap', 'lightMap', 'metalnessMap',
                        'normalMap', 'roughnessMap', 'clearcoatMap', 'clearcoatRoughnessMap',
                        'clearcoatNormalMap', 'sheenColorMap', 'sheenRoughnessMap',
                        'transmissionMap', 'thicknessMap', 'specularIntensityMap',
                        'specularColorMap', 'iridescenceMap', 'iridescenceThicknessMap',
                        'anisotropyMap'
                    ];

                    textureMaps.forEach(mapName => {
                        if (material[mapName]) {
                             material[mapName].dispose();
                        }
                    });

                    // Also iterate keys just in case we missed custom ones, but be careful
                    for (const key in material) {
                        if (material[key] && material[key].isTexture && !textureMaps.includes(key)) {
                            material[key].dispose();
                        }
                    }
                    material.dispose();
                });
            }

            if (node.skeleton) {
                node.skeleton.dispose();
            }
        }
    }

    disposeGroup(group) {
        if (!group) return;
        if (group.userData.mixer) {
            group.userData.mixer.stopAllAction();
            group.userData.mixer.uncacheRoot(group);
            delete group.userData.mixer;
        }
        group.traverse(this.disposeNode.bind(this));
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
                    this.disposeGroup(this.outgoingSiteGroup);
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

    cacheMeshes(group) {
        group.userData.meshMaterials = [];
        group.traverse(child => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    if (mat.userData.originalTransparent === undefined) {
                        mat.userData.originalTransparent = mat.transparent;
                        mat.userData.originalOpacity = mat.opacity;
                    }
                });
                group.userData.meshMaterials.push(...materials);
            }
        });
    }

    setGroupOpacity(group, opacity) {
        if (!group) return;

        const applyOpacity = (mat) => {
            if (opacity < 1) {
                mat.transparent = true;
                mat.opacity = opacity;
            } else {
                if (mat.userData.originalTransparent !== undefined) {
                    mat.transparent = mat.userData.originalTransparent;
                    mat.opacity = mat.userData.originalOpacity;
                } else {
                    // Fallback if not cached properly
                    mat.transparent = false;
                    mat.opacity = 1;
                }
            }
        };

        // Use cached materials if available, otherwise fallback to traverse
        if (group.userData.meshMaterials) {
            group.userData.meshMaterials.forEach(applyOpacity);
        } else {
            group.traverse(child => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(applyOpacity);
                }
            });
        }
    }

    getCurrentSiteData() {
        return this.sitesData[this.currentSiteIndex];
    }
}
