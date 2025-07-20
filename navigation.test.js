import AppContext from './main.js';
import * as THREE from 'three';

global.THREE = THREE;

// It's good practice to ensure THREE is available if AppContext relies on it at a global scope,
// or ensure AppContext encapsulates its THREE dependency fully.
// For testing, we can mock THREE if it's directly used by AppContext in a way that affects tests.
// const THREE = { Group: jest.fn() }; // Example mock

describe('AppContext.switchSite Detailed Logic', () => {
    let mockScene, mockClock, mockDescriptionElement, mockControls;
    // sitesDataFromApp will be AppContext.getSitesData(), which uses the real createFuncs.
    // We will spy on those createFuncs (createPlaceholderSite1, etc.)

    beforeEach(() => {
        // Mock dependencies that AppContext.switchSite will use
        mockScene = { add: jest.fn(), remove: jest.fn() }; // Added remove for cleanup in transitions
        mockClock = { getElapsedTime: jest.fn(() => 123) }; // Returns a mock time
        mockDescriptionElement = {
            textContent: '',
            classList: { remove: jest.fn(), add: jest.fn() }
        };
        mockControls = { target: { set: jest.fn() } };

        // Set these mocks into AppContext
        AppContext.setScene(mockScene);
        AppContext.setClock(mockClock);
        AppContext.setDescriptionElement(mockDescriptionElement);
        AppContext.setControls(mockControls);
        // AppContext.setNavigationControlsContainer can be a dummy object if not directly tested here
        AppContext.setNavigationControlsContainer({ querySelectorAll: jest.fn(() => []), appendChild: jest.fn() });


        // Spy on functions within AppContext that are called by switchSite
        // These are the actual site creation functions now part of AppContext
        jest.spyOn(AppContext, 'createPlaceholderSite1').mockReturnValue({ isGroup: true, traverse: jest.fn(), name: "MockedSite1", userData: {} });
        jest.spyOn(AppContext, 'createPlaceholderSite2').mockReturnValue({ isGroup: true, traverse: jest.fn(), name: "MockedSite2", userData: {} });
        jest.spyOn(AppContext, 'createPlaceholderSite3').mockReturnValue({ isGroup: true, traverse: jest.fn(), name: "MockedSite3", userData: {} });

        jest.spyOn(AppContext, 'setGroupOpacity').mockImplementation(() => {}); // Mock implementation to avoid actual traverse logic


        // Reset state before each test using AppContext's own setters
        AppContext.setCurrentSiteIndex(0); // Start at site 0
        AppContext.setIsTransitioning(false);
        // Simulate that a site is already loaded (e.g., site 0)
        // The createPlaceholderSite1 spy will return the mock group.
        AppContext.setCurrentSiteGroup(AppContext.createPlaceholderSite1());
        AppContext.setOutgoingSiteGroup(null);
        AppContext.setIncomingSiteGroup(null);
        AppContext.setTransitionStartTime(0);
    });

    afterEach(() => {
        // Restore any spied functions to their original implementations
        jest.restoreAllMocks();
    });

    test('successfully switches from site 0 to site 1', () => {
        const initialSiteGroup = AppContext.getCurrentSiteGroup(); // Should be the mock from createPlaceholderSite1
        expect(initialSiteGroup.name).toBe("MockedSite1"); // Ensure initial setup is correct

        AppContext.switchSite(1); // Attempt to switch to Site 1 (which calls createPlaceholderSite2)

        expect(AppContext.getCurrentSiteIndex()).toBe(1);
        expect(AppContext.getIsTransitioning()).toBe('crossfade');

        // Check if the previously current group (MockedSite1) is now the outgoing group
        expect(AppContext.getOutgoingSiteGroup()).toBe(initialSiteGroup);

        // Check if site 1's createFunc (createPlaceholderSite2) was called
        expect(AppContext.createPlaceholderSite2).toHaveBeenCalledTimes(1);
        const newIncomingGroup = AppContext.getIncomingSiteGroup();
        expect(newIncomingGroup).toBeDefined();
        expect(newIncomingGroup.isGroup).toBe(true);
        expect(newIncomingGroup.name).toBe("MockedSite2"); // Check it's the correct mock

        expect(AppContext.setGroupOpacity).toHaveBeenCalledWith(newIncomingGroup, 0);
        expect(mockScene.add).toHaveBeenCalledWith(newIncomingGroup);

        const sitesData = AppContext.getSitesData();
        expect(mockDescriptionElement.textContent).toBe(sitesData[1].description);
        expect(mockDescriptionElement.classList.remove).toHaveBeenCalledWith('visible');

        expect(mockControls.target.set).toHaveBeenCalledWith(0, 0, 0);
        expect(mockClock.getElapsedTime).toHaveBeenCalled(); // To set transitionStartTime

        // currentSiteGroup is set to null during transition, incoming takes over after fade
        expect(AppContext.getCurrentSiteGroup()).toBeNull();
    });

    test('should not switch if newIndex is the same as currentSiteIndex and a site is loaded', () => {
        AppContext.setCurrentSiteIndex(0);
        // CurrentSiteGroup is already set by beforeEach to MockedSite1
        expect(AppContext.getCurrentSiteGroup()).not.toBeNull();
        AppContext.setIsTransitioning(false);

        // Spy on console.warn for this specific test
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        AppContext.switchSite(0); // Attempt to switch to the same site

        expect(consoleWarnSpy).toHaveBeenCalledWith("Transition in progress or site already loaded/targetted:", 0, "current:", 0, "transitioning:", false);
        expect(AppContext.getCurrentSiteIndex()).toBe(0); // Index should not change
        expect(AppContext.getIsTransitioning()).toBe(false); // Should not start transitioning
        consoleWarnSpy.mockRestore();
    });

    test('should not switch if newIndex is negative', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        AppContext.switchSite(-1);
        expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid site index:", -1);
        expect(AppContext.getCurrentSiteIndex()).toBe(0); // Index should not change
        expect(AppContext.getIsTransitioning()).toBe(false);
        consoleWarnSpy.mockRestore();
    });

    test('should not switch if newIndex is out of bounds', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const sitesData = AppContext.getSitesData();
        AppContext.switchSite(sitesData.length);
        expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid site index:", sitesData.length);
        expect(AppContext.getCurrentSiteIndex()).toBe(0); // Index should not change
        expect(AppContext.getIsTransitioning()).toBe(false);
        consoleWarnSpy.mockRestore();
    });

    test('should not switch if a transition is already in progress', () => {
        AppContext.setIsTransitioning(true); // Simulate transition in progress
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        AppContext.switchSite(1); // Attempt to switch to a different site

        expect(consoleWarnSpy).toHaveBeenCalledWith("Transition in progress or site already loaded/targetted:", 1, "current:", 0, "transitioning:", true);
        expect(AppContext.getCurrentSiteIndex()).toBe(0); // Index should not change
        expect(AppContext.getIsTransitioning()).toBe(true); // State should remain transitioning
        consoleWarnSpy.mockRestore();
    });

    test('switches correctly when currentSiteGroup is null (e.g. initial load to a specific site)', () => {
        AppContext.setCurrentSiteIndex(0); // Start at 0, but pretend no site is "active" yet
        AppContext.setCurrentSiteGroup(null); // Explicitly set to null
        AppContext.setIsTransitioning(false);

        AppContext.switchSite(1); // Switch to site 1

        expect(AppContext.getCurrentSiteIndex()).toBe(1);
        expect(AppContext.getIsTransitioning()).toBe('crossfade');
        expect(AppContext.getOutgoingSiteGroup()).toBeNull(); // No previously active site group

        expect(AppContext.createPlaceholderSite2).toHaveBeenCalledTimes(1);
        const newIncomingGroup = AppContext.getIncomingSiteGroup();
        expect(newIncomingGroup).toBeDefined();
        expect(newIncomingGroup.name).toBe("MockedSite2");

        expect(AppContext.setGroupOpacity).toHaveBeenCalledWith(newIncomingGroup, 0);
        expect(mockScene.add).toHaveBeenCalledWith(newIncomingGroup);
    });
});

// All tests related to updateNavigationButtons are removed since the UI has changed.
