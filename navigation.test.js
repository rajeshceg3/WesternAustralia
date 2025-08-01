import AppContext from './main.js';
import * as THREE from 'three';

global.THREE = THREE;

describe('AppContext.switchSite Detailed Logic', () => {
    let mockScene, mockClock, mockDescriptionElement, mockControls, mockCamera;
    let mockCreateSite1, mockCreateSite2, mockCreateSite3;

    beforeEach(() => {
        // Mock TWEEN
        global.TWEEN = {
            Tween: jest.fn(() => ({
                to: jest.fn(() => ({
                    easing: jest.fn(() => ({
                        start: jest.fn(),
                    })),
                })),
            })),
            Easing: {
                Quadratic: {
                    InOut: jest.fn(),
                },
            },
        };

        // Mock dependencies
        mockScene = { add: jest.fn(), remove: jest.fn() };
        mockClock = { getElapsedTime: jest.fn(() => 123) };
        mockDescriptionElement = {
            textContent: '',
            classList: { remove: jest.fn(), add: jest.fn() }
        };
        mockCamera = new THREE.PerspectiveCamera();
        mockControls = { target: new THREE.Vector3(0, 0, 0) };

        // Set mocks into AppContext
        AppContext.setScene(mockScene);
        AppContext.setClock(mockClock);
        AppContext.setCamera(mockCamera);
        AppContext.setDescriptionElement(mockDescriptionElement);
        AppContext.setControls(mockControls);
        AppContext.setNavigationControlsContainer({ querySelectorAll: jest.fn(() => []), appendChild: jest.fn() });

        // --- NEW TESTING STRATEGY ---
        // Create mock functions for site creation
        mockCreateSite1 = jest.fn().mockReturnValue({ isGroup: true, name: "MockedSite1", userData: {} });
        mockCreateSite2 = jest.fn().mockReturnValue({ isGroup: true, name: "MockedSite2", userData: {} });
        mockCreateSite3 = jest.fn().mockReturnValue({ isGroup: true, name: "MockedSite3", userData: {} });

        // Get the real data to use as a base
        const realSitesData = AppContext.getSitesData();

        // Create a mock sitesData array that uses our mock functions
        const mockSitesData = [
            { ...realSitesData[0], createFunc: mockCreateSite1 },
            { ...realSitesData[1], createFunc: mockCreateSite2 },
            { ...realSitesData[2], createFunc: mockCreateSite3 },
        ];

        // Spy on getSitesData and return our mocked array
        jest.spyOn(AppContext, 'getSitesData').mockReturnValue(mockSitesData);
        // Also spy on setGroupOpacity as it's not relevant to this logic test
        jest.spyOn(AppContext, 'setGroupOpacity').mockImplementation(() => {});

        // Reset state before each test
        AppContext.setCurrentSiteIndex(0);
        AppContext.setIsTransitioning(false);
        AppContext.setCurrentSiteGroup({ isGroup: true, name: "InitialGroup", userData: {} });
        AppContext.setOutgoingSiteGroup(null);
        AppContext.setIncomingSiteGroup(null);
        AppContext.setTransitionStartTime(0);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('successfully switches from site 0 to site 1', () => {
        AppContext.switchSite(1);

        expect(AppContext.getCurrentSiteIndex()).toBe(1);
        expect(AppContext.getIsTransitioning()).toBe('crossfade');

        // Now we check if our injected mock function was called
        expect(mockCreateSite2).toHaveBeenCalledTimes(1);

        const newIncomingGroup = AppContext.getIncomingSiteGroup();
        expect(newIncomingGroup).toBeDefined();
        expect(newIncomingGroup.name).toBe("MockedSite2");

        expect(mockScene.add).toHaveBeenCalledWith(newIncomingGroup);
    });

    test('should not switch if newIndex is the same as currentSiteIndex and a site is loaded', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        AppContext.switchSite(0);
        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(mockCreateSite1).not.toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
    });

    test('should not switch if a transition is in progress', () => {
        AppContext.setIsTransitioning(true);
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        AppContext.switchSite(1);
        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(mockCreateSite2).not.toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
    });

    test('switches correctly when currentSiteGroup is null', () => {
        AppContext.setCurrentSiteGroup(null);
        AppContext.switchSite(1);
        expect(AppContext.getIsTransitioning()).toBe('crossfade');
        expect(AppContext.getOutgoingSiteGroup()).toBeNull();
        expect(mockCreateSite2).toHaveBeenCalledTimes(1);
        const newIncomingGroup = AppContext.getIncomingSiteGroup();
        expect(newIncomingGroup.name).toBe("MockedSite2");
    });
});
