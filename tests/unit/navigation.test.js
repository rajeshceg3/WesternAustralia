import SiteManager from '../../SiteManager.js';
import * as THREE from 'three';

// Mock Three.js components
jest.mock('three', () => {
    const originalThree = jest.requireActual('three');
    const MockGroup = jest.fn(function () {
        this.isGroup = true;
        this.add = jest.fn();
        this.traverse = jest.fn();
        this.position = { set: jest.fn() };
        this.rotation = { set: jest.fn() };
        this.scale = { set: jest.fn() };
        this.userData = {}; // Ensure userData exists
        return this;
    });
    return {
        ...originalThree,
        Group: MockGroup,
    };
});

describe('SiteManager.switchSite', () => {
    let siteManager;
    let mockScene;
    let mockGltfLoader;
    let onTransitionEndCallback;

    beforeEach(() => {
        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
        };
        mockGltfLoader = {
            load: jest.fn(),
        };
        onTransitionEndCallback = jest.fn();

        siteManager = new SiteManager(mockScene, mockGltfLoader, onTransitionEndCallback);

        // Mock the createFunc for each site to return a new mock group
        siteManager.sitesData.forEach((site) => {
            site.createFunc = jest.fn(() => new THREE.Group());
        });
    });

    test('successfully switches from no site to site 0', () => {
        const mockClock = { getElapsedTime: () => 0 };
        const siteInfo = siteManager.switchSite(0, mockClock);

        expect(siteManager.currentSiteIndex).toBe(0);
        expect(siteManager.isTransitioning).toBe(true);
        expect(siteManager.incomingSiteGroup.isGroup).toBe(true);
        expect(mockScene.add).toHaveBeenCalledWith(siteManager.incomingSiteGroup);
        expect(siteInfo.description).toBe(siteManager.sitesData[0].description);
        expect(siteManager.sitesData[0].createFunc).toHaveBeenCalled();
    });

    test('successfully switches from site 0 to site 1', () => {
        // First, set up initial state as if site 0 is active
        siteManager.currentSiteIndex = 0;
        siteManager.currentSiteGroup = new THREE.Group(); // This will have userData from our mock

        const mockClock = { getElapsedTime: () => 0 };
        const siteInfo = siteManager.switchSite(1, mockClock);

        expect(siteManager.currentSiteIndex).toBe(1);
        expect(siteManager.isTransitioning).toBe(true);
        expect(siteManager.outgoingSiteGroup).toBe(siteManager.currentSiteGroup);
        expect(siteManager.incomingSiteGroup.isGroup).toBe(true);
        expect(mockScene.add).toHaveBeenCalledWith(siteManager.incomingSiteGroup);
        expect(siteInfo.description).toBe(siteManager.sitesData[1].description);
        expect(siteManager.sitesData[1].createFunc).toHaveBeenCalled();
    });

    test('does not switch if index is the same as current', () => {
        siteManager.currentSiteIndex = 0;
        const result = siteManager.switchSite(0, {});
        expect(result).toBeUndefined();
        expect(siteManager.isTransitioning).toBe(false);
    });

    test('does not switch if a transition is in progress', () => {
        siteManager.isTransitioning = true;
        const result = siteManager.switchSite(1, {});
        expect(result).toBeUndefined();
    });

    test('does not switch for an invalid index', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const result = siteManager.switchSite(99, {});
        expect(result).toBeUndefined();
        expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid site index:', 99);
        consoleWarnSpy.mockRestore();
    });
});
