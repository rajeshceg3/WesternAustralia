// SiteManager.js
import * as THREE from 'three';
import { sitesConfig } from './sitesConfig.js';

export default class SiteManager {
    constructor(scene, gltfLoader, onTransitionEndCallback) {
        this.scene = scene;
        this.gltfLoader = gltfLoader;
        this.onTransitionEnd = onTransitionEndCallback;
        this.modelCache = new Map();

        this.siteCreators = {
            parrot: this.createParrotSite.bind(this),
            stork: this.createStorkSite.bind(this),
            horse: this.createHorseSite.bind(this),
            flamingo: this.createFlamingoSite.bind(this),
        };

        this.sitesData = sitesConfig.map((site) => ({
            ...site,
            createFunc: this.siteCreators[site.id],
        }));

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
        siteGroup.add(this.createGroundPlane(0x228b22)); // ForestGreen

        // Shared resources for trees
        const treeGeometry = new THREE.CylinderGeometry(0.1, 0.2, 2, 8);
        const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

        for (let i = 0; i < 5; i++) {
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
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
        siteGroup.add(this.createGroundPlane(0xf4a460)); // SandyBrown
        this.loadAndAddModel(siteData.modelUrl, siteGroup, { scale: 0.5 }, onProgress);
        this.cacheMeshes(siteGroup);
        return siteGroup;
    }

    createStorkSite(siteData, onProgress) {
        const siteGroup = new THREE.Group();
        // Add a ground plane below the pond for continuity
        siteGroup.add(this.createGroundPlane(0x228b22)); // ForestGreen ground
        const pond = new THREE.Mesh(
            new THREE.CircleGeometry(5, 32),
            new THREE.MeshStandardMaterial({ color: 0x4682b4, transparent: true, opacity: 0.7 }),
        );
        pond.rotation.x = -Math.PI / 2;
        pond.position.y = -0.9;
        siteGroup.add(pond);
        this.loadAndAddModel(siteData.modelUrl, siteGroup, { scale: 1.0 }, onProgress);
        this.cacheMeshes(siteGroup);
        return siteGroup;
    }

    createHorseSite(siteData, onProgress) {
        const siteGroup = new THREE.Group();
        siteGroup.add(this.createGroundPlane(0x90ee90)); // LightGreen

        // Shared resources for fence posts
        const postGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

        // Simple fence
        for (let i = 0; i < 10; i++) {
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(-5 + i, -0.75, -5);
            siteGroup.add(post);
        }
        this.loadAndAddModel(siteData.modelUrl, siteGroup, { scale: 0.5 }, onProgress);
        this.cacheMeshes(siteGroup);
        return siteGroup;
    }

    processLoadedModel(model, animations, siteGroup, scale) {
        model.scale.set(scale, scale, scale);
        model.position.y = -1;
        model.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
        });

        // Sync opacity with existing group elements to prevent pop-in
        let currentOpacityFactor = 1;
        let referenceMat = null;

        if (siteGroup.userData.meshMaterials && siteGroup.userData.meshMaterials.length > 0) {
            referenceMat = siteGroup.userData.meshMaterials[0];
        } else {
            const referenceMesh = siteGroup.children.find((c) => c.isMesh && c.material);
            if (referenceMesh) {
                referenceMat = Array.isArray(referenceMesh.material)
                    ? referenceMesh.material[0]
                    : referenceMesh.material;
            }
        }

        if (referenceMat) {
            if (
                referenceMat.userData.originalOpacity !== undefined &&
                referenceMat.userData.originalOpacity > 0
            ) {
                currentOpacityFactor = referenceMat.opacity / referenceMat.userData.originalOpacity;
            } else {
                currentOpacityFactor = referenceMat.opacity;
            }
        }
        this.setGroupOpacity(model, currentOpacityFactor);

        siteGroup.add(model);

        if (animations && animations.length) {
            const mixer = new THREE.AnimationMixer(model);
            animations.forEach((clip) => mixer.clipAction(clip).play());
            siteGroup.userData.mixer = mixer;
        }
        // Update cache after async load
        this.cacheMeshes(siteGroup);
    }

    loadAndAddModel(modelUrl, siteGroup, { scale = 1.0 }, onProgress) {
        if (!this.gltfLoader) return;

        if (this.modelCache.has(modelUrl)) {
            const gltf = this.modelCache.get(modelUrl);
            const clonedScene = gltf.scene.clone();
            this.processLoadedModel(clonedScene, gltf.animations, siteGroup, scale);
            if (onProgress) {
                // Simulate instant load
                onProgress({ lengthComputable: true, loaded: 100, total: 100 });
            }
            return;
        }

        this.gltfLoader.load(
            modelUrl,
            (gltf) => {
                this.modelCache.set(modelUrl, gltf);
                const clonedScene = gltf.scene.clone();
                this.processLoadedModel(clonedScene, gltf.animations, siteGroup, scale);
            },
            onProgress,
            (error) => {
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
            },
        );
    }

    preloadSite(index) {
        if (index < 0 || index >= this.sitesData.length) return;
        const modelUrl = this.sitesData[index].modelUrl;
        if (this.modelCache.has(modelUrl)) return;

        console.log(`Preloading site ${index}: ${modelUrl}`);
        this.gltfLoader.load(
            modelUrl,
            (gltf) => {
                if (!this.modelCache.has(modelUrl)) {
                    this.modelCache.set(modelUrl, gltf);
                    console.log(`Preloaded finished: ${modelUrl}`);
                }
            },
            undefined, // No onProgress
            (error) => {
                console.warn(`Failed to preload ${modelUrl}`, error);
            },
        );
    }

    switchSite(index, clock, onProgress, force = false) {
        if (this.isTransitioning || (index === this.currentSiteIndex && !force)) {
            return;
        }
        if (index < 0 || index >= this.sitesData.length) {
            console.warn('Invalid site index:', index);
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

        this.incomingSiteGroup = newSiteData.createFunc(newSiteData, onProgress);
        this.setGroupOpacity(this.incomingSiteGroup, 0);
        this.scene.add(this.incomingSiteGroup);

        return {
            description: newSiteData.description,
        };
    }

    disposeNode(node) {
        if (node.isMesh || node.isLine || node.isPoints) {
            if (node.geometry) {
                node.geometry.dispose();
            }
            if (node.material) {
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material) => {
                    const textureMaps = [
                        'map',
                        'aoMap',
                        'alphaMap',
                        'bumpMap',
                        'displacementMap',
                        'emissiveMap',
                        'envMap',
                        'lightMap',
                        'metalnessMap',
                        'normalMap',
                        'roughnessMap',
                        'clearcoatMap',
                        'clearcoatRoughnessMap',
                        'clearcoatNormalMap',
                        'sheenColorMap',
                        'sheenRoughnessMap',
                        'transmissionMap',
                        'thicknessMap',
                        'specularIntensityMap',
                        'specularColorMap',
                        'iridescenceMap',
                        'iridescenceThicknessMap',
                        'anisotropyMap',
                    ];

                    textureMaps.forEach((mapName) => {
                        if (material[mapName]) {
                            material[mapName].dispose();
                        }
                    });

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
        group.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat) => {
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
            // Ensure we have originals cached
            if (mat.userData.originalTransparent === undefined) {
                mat.userData.originalTransparent = mat.transparent;
                mat.userData.originalOpacity = mat.opacity;
            }

            if (opacity < 1) {
                mat.transparent = true;
                mat.opacity = opacity * mat.userData.originalOpacity;
            } else {
                if (mat.userData.originalTransparent !== undefined) {
                    mat.transparent = mat.userData.originalTransparent;
                    mat.opacity = mat.userData.originalOpacity;
                } else {
                    mat.transparent = false;
                    mat.opacity = 1;
                }
            }
        };

        if (group.userData.meshMaterials) {
            group.userData.meshMaterials.forEach(applyOpacity);
        } else {
            group.traverse((child) => {
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
