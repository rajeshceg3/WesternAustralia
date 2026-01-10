import SiteManager from './SiteManager.js';
import * as THREE from 'three';

// A more robust mocking approach for Three.js
jest.mock('three', () => {
    const originalThree = jest.requireActual('three');

    // Mock Group to be a class-like function
    const MockGroup = jest.fn(function() {
        this.isGroup = true;
        this.add = jest.fn();
        this.traverse = jest.fn();
        this.position = { set: jest.fn() };
        this.rotation = { set: jest.fn() };
        this.scale = { set: jest.fn() };
        this.userData = {};
        return this;
    });

    const MockMesh = jest.fn(function() {
        this.isMesh = true;
        this.position = { set: jest.fn() };
        this.rotation = { x: 0 };
        this.castShadow = false;
        this.receiveShadow = false;
        return this;
    });

    return {
        ...originalThree,
        Group: MockGroup,
        Mesh: MockMesh,
        PlaneGeometry: jest.fn(),
        CylinderGeometry: jest.fn(),
        CircleGeometry: jest.fn(),
        BoxGeometry: jest.fn(),
        MeshStandardMaterial: jest.fn(),
    };
});

// Mock GLTFLoader
const mockGltfLoader = {
    load: jest.fn(),
};

describe('SiteManager Site Creation Functions', () => {
    let siteManager;

    beforeEach(() => {
        jest.clearAllMocks();
        siteManager = new SiteManager(new THREE.Scene(), mockGltfLoader, () => {});
    });

    test('createParrotSite returns a THREE.Group object', () => {
        const siteGroup = siteManager.createParrotSite();
        expect(siteGroup.isGroup).toBe(true);
        expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        expect(mockGltfLoader.load).toHaveBeenCalledWith(expect.any(String), expect.any(Function), undefined, expect.any(Function));
    });

    test('createStorkSite returns a THREE.Group object', () => {
        const siteGroup = siteManager.createStorkSite();
        expect(siteGroup.isGroup).toBe(true);
        expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        expect(mockGltfLoader.load).toHaveBeenCalledWith(expect.any(String), expect.any(Function), undefined, expect.any(Function));
    });

    test('createHorseSite returns a THREE.Group object', () => {
        const siteGroup = siteManager.createHorseSite();
        expect(siteGroup.isGroup).toBe(true);
        expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        expect(mockGltfLoader.load).toHaveBeenCalledWith(expect.any(String), expect.any(Function), undefined, expect.any(Function));
    });

    test('createFlamingoSite returns a THREE.Group object', () => {
        const siteGroup = siteManager.createFlamingoSite();
        expect(siteGroup.isGroup).toBe(true);
        expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        expect(mockGltfLoader.load).toHaveBeenCalledWith(expect.any(String), expect.any(Function), undefined, expect.any(Function));
    });

    test('setGroupOpacity respects originalOpacity', () => {
        const mockMat = { opacity: 0.5, userData: { originalOpacity: 0.5 }, transparent: false };
        const mockMesh = { isMesh: true, material: mockMat };
        const mockGroup = {
            traverse: jest.fn((cb) => cb(mockMesh)),
            userData: {}
        };

        siteManager.setGroupOpacity(mockGroup, 0.5);

        expect(mockMat.transparent).toBe(true);
        expect(mockMat.opacity).toBe(0.25);
    });

    test('setGroupOpacity defaults to 1 if originalOpacity missing', () => {
        const mockMat = { opacity: 0.5, userData: {}, transparent: false };
        const mockMesh = { isMesh: true, material: mockMat };
        const mockGroup = {
            traverse: jest.fn((cb) => cb(mockMesh)),
            userData: {}
        };

        siteManager.setGroupOpacity(mockGroup, 0.5);

        expect(mockMat.opacity).toBe(0.5);
    });

    test('cacheMeshes stores originalOpacity', () => {
        const mockMat = { opacity: 0.8, userData: {} };
        const mockMesh = { isMesh: true, material: mockMat };
        const mockGroup = {
            traverse: jest.fn((cb) => cb(mockMesh)),
            userData: {}
        };

        siteManager.cacheMeshes(mockGroup);

        expect(mockMat.userData.originalOpacity).toBe(0.8);
        expect(mockGroup.userData.meshMaterials).toContain(mockMat);
    });

    test('setGroupOpacity uses cached materials', () => {
        const mockMat = { opacity: 0.8, userData: { originalOpacity: 0.8 }, transparent: false };
        const mockGroup = {
            traverse: jest.fn(), // Should not be called
            userData: { meshMaterials: [mockMat] }
        };

        siteManager.setGroupOpacity(mockGroup, 0.5);

        expect(mockGroup.traverse).not.toHaveBeenCalled();
        expect(mockMat.opacity).toBe(0.4); // 0.5 * 0.8
    });
});
