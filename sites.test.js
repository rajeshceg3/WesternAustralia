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
        const siteData = { modelUrl: 'mockUrl' };
        const siteGroup = siteManager.createParrotSite(siteData);
        expect(siteGroup.isGroup).toBe(true);
        expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        expect(mockGltfLoader.load).toHaveBeenCalledWith(expect.any(String), expect.any(Function), undefined, expect.any(Function));
    });

    test('createStorkSite returns a THREE.Group object', () => {
        const siteData = { modelUrl: 'mockUrl' };
        const siteGroup = siteManager.createStorkSite(siteData);
        expect(siteGroup.isGroup).toBe(true);
        expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        expect(mockGltfLoader.load).toHaveBeenCalledWith(expect.any(String), expect.any(Function), undefined, expect.any(Function));
    });

    test('createHorseSite returns a THREE.Group object', () => {
        const siteData = { modelUrl: 'mockUrl' };
        const siteGroup = siteManager.createHorseSite(siteData);
        expect(siteGroup.isGroup).toBe(true);
        expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        expect(mockGltfLoader.load).toHaveBeenCalledWith(expect.any(String), expect.any(Function), undefined, expect.any(Function));
    });

    test('createFlamingoSite returns a THREE.Group object', () => {
        const siteData = { modelUrl: 'mockUrl' };
        const siteGroup = siteManager.createFlamingoSite(siteData);
        expect(siteGroup.isGroup).toBe(true);
        expect(THREE.Mesh).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        expect(mockGltfLoader.load).toHaveBeenCalledWith(expect.any(String), expect.any(Function), undefined, expect.any(Function));
    });
});
