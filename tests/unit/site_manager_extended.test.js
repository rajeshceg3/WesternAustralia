
import SiteManager from '../../SiteManager.js';
import * as THREE from 'three';

// Mock Three.js
jest.mock('three', () => {
    const originalThree = jest.requireActual('three');
    return {
        ...originalThree,
        Group: jest.fn(function() {
            this.add = jest.fn();
            this.remove = jest.fn();
            this.traverse = jest.fn();
            this.children = [];
            this.userData = {};
            this.isGroup = true;
            return this;
        }),
        Mesh: jest.fn(function(geo, mat) {
            this.isMesh = true;
            this.geometry = geo;
            this.material = mat;
            this.position = { set: jest.fn(), y: 0 };
            this.scale = { set: jest.fn() };
            this.rotation = { x: 0 };
            return this;
        }),
        PlaneGeometry: jest.fn(),
        MeshStandardMaterial: jest.fn(),
        BoxGeometry: jest.fn(),
        Texture: jest.fn(function() {
            this.dispose = jest.fn();
            this.isTexture = true;
            return this;
        }),
        AnimationMixer: jest.fn(function() {
            this.clipAction = jest.fn(() => ({ play: jest.fn() }));
            this.update = jest.fn();
            this.stopAllAction = jest.fn();
            this.uncacheRoot = jest.fn();
            return this;
        }),
    };
});

describe('SiteManager Extended Coverage', () => {
    let siteManager;
    let mockScene;
    let mockGltfLoader;
    let onTransitionEnd;

    beforeEach(() => {
        mockScene = { add: jest.fn(), remove: jest.fn() };
        mockGltfLoader = {
            load: jest.fn(),
            manager: { onError: jest.fn() }
        };
        onTransitionEnd = jest.fn();
        siteManager = new SiteManager(mockScene, mockGltfLoader, onTransitionEnd);
    });

    describe('loadAndAddModel', () => {
        it('should load model and add to group on success', () => {
            const group = new THREE.Group();
            const modelUrl = 'test.glb';
            const onProgress = jest.fn();

            siteManager.loadAndAddModel(modelUrl, group, {}, onProgress);

            expect(mockGltfLoader.load).toHaveBeenCalledWith(
                modelUrl,
                expect.any(Function),
                onProgress,
                expect.any(Function)
            );

            // Simulate success callback
            const onLoadCallback = mockGltfLoader.load.mock.calls[0][1];
            const mockGltf = {
                scene: {
                    scale: { set: jest.fn() },
                    position: { y: 0 },
                    traverse: jest.fn(),
                    userData: {}
                },
                animations: []
            };
            onLoadCallback(mockGltf);

            expect(group.add).toHaveBeenCalledWith(mockGltf.scene);
        });

        it('should handle load error by adding placeholder', () => {
            const group = new THREE.Group();
            const modelUrl = 'fail.glb';

            siteManager.loadAndAddModel(modelUrl, group, {}, undefined);

            const onErrorCallback = mockGltfLoader.load.mock.calls[0][3];
            onErrorCallback(new Error('Load failed'));

            expect(group.add).toHaveBeenCalled(); // Should add placeholder
            // Check if placeholder is a Mesh
            const addedObj = group.add.mock.calls[0][0];
            expect(addedObj.isMesh).toBe(true);
            expect(mockGltfLoader.manager.onError).toHaveBeenCalledWith(modelUrl);
        });
    });

    describe('disposeNode', () => {
        it('should dispose geometry, material, and textures', () => {
            const geometry = { dispose: jest.fn() };
            const map = new THREE.Texture();
            const material = {
                dispose: jest.fn(),
                map: map,
                // Add a PBR map
                roughnessMap: new THREE.Texture()
            };
            const node = new THREE.Mesh(geometry, material);

            siteManager.disposeNode(node);

            expect(geometry.dispose).toHaveBeenCalled();
            expect(material.dispose).toHaveBeenCalled();
            expect(map.dispose).toHaveBeenCalled();
            expect(material.roughnessMap.dispose).toHaveBeenCalled();
        });

        it('should handle array of materials', () => {
            const geometry = { dispose: jest.fn() };
            const mat1 = { dispose: jest.fn() };
            const mat2 = { dispose: jest.fn() };
            const node = new THREE.Mesh(geometry, [mat1, mat2]);

            siteManager.disposeNode(node);

            expect(mat1.dispose).toHaveBeenCalled();
            expect(mat2.dispose).toHaveBeenCalled();
        });
    });

    describe('setGroupOpacity', () => {
        it('should set opacity correctly based on original values', () => {
            const group = new THREE.Group();
            const mat = { transparent: false, opacity: 1, userData: {} };
            const mesh = new THREE.Mesh({}, mat);

            // Mock traverse implementation for the group
            group.traverse = (cb) => cb(mesh);

            // First call caches originals
            siteManager.setGroupOpacity(group, 0.5);

            expect(mat.userData.originalOpacity).toBe(1);
            expect(mat.transparent).toBe(true);
            expect(mat.opacity).toBe(0.5);

            // Second call with 1.0 restores
            siteManager.setGroupOpacity(group, 1.0);
            expect(mat.transparent).toBe(false);
            expect(mat.opacity).toBe(1);
        });
    });
});
