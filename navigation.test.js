// Presumes main.js is modified to expose AppContext
// And that AppContext and its methods are accessible in the test environment.
// This might require Node's vm module to run main.js in a context
// and extract AppContext, or a build step if main.js becomes a module.
// For now, assume AppContext is globally available after main.js is conceptually "loaded".

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
        jest.spyOn(AppContext, 'createPlaceholderSite1').mockReturnValue({ isGroup: true, traverse: jest.fn(), name: "MockedSite1" });
        jest.spyOn(AppContext, 'createPlaceholderSite2').mockReturnValue({ isGroup: true, traverse: jest.fn(), name: "MockedSite2" });
        jest.spyOn(AppContext, 'createPlaceholderSite3').mockReturnValue({ isGroup: true, traverse: jest.fn(), name: "MockedSite3" });

        jest.spyOn(AppContext, 'setGroupOpacity').mockImplementation(() => {}); // Mock implementation to avoid actual traverse logic
        jest.spyOn(AppContext, 'updateNavigationButtons').mockImplementation(() => {});


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

        expect(AppContext.updateNavigationButtons).toHaveBeenCalled();
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

describe('AppContext.updateNavigationButtons', () => {
    let mockPrevButton, mockNextButton, mockSiteButton1, mockSiteButton2, mockSiteButton3;
    let mockSiteButtons;
    let mockNavControlsContainer;

    beforeEach(() => {
        // Create mock buttons
        mockPrevButton = { disabled: false, querySelector: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } };
        mockNextButton = { disabled: false, querySelector: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } };
        mockSiteButton1 = { disabled: false, classList: { add: jest.fn(), remove: jest.fn() } };
        mockSiteButton2 = { disabled: false, classList: { add: jest.fn(), remove: jest.fn() } };
        mockSiteButton3 = { disabled: false, classList: { add: jest.fn(), remove: jest.fn() } };
        mockSiteButtons = [mockSiteButton1, mockSiteButton2, mockSiteButton3];

        // Mock navigationControlsContainer
        mockNavControlsContainer = {
            querySelector: jest.fn((selector) => {
                if (selector === '#prevButton') return mockPrevButton;
                if (selector === '#nextButton') return mockNextButton;
                return null;
            }),
            querySelectorAll: jest.fn((selector) => {
                if (selector === 'button:not(#prevButton):not(#nextButton)') return mockSiteButtons;
                return []; // Should not happen in these tests
            })
        };

        AppContext.setNavigationControlsContainer(mockNavControlsContainer);
        AppContext.setCurrentSiteIndex(0); // Default to first site
        AppContext.setIsTransitioning(false); // Default to not transitioning
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Restores spies, including any on AppContext.getSitesData if used
    });

    test('Scenario 1: First site selected (index 0)', () => {
        AppContext.setCurrentSiteIndex(0);
        AppContext.setIsTransitioning(false); // Explicitly set for clarity, though beforeEach covers it
        AppContext.updateNavigationButtons();

        expect(mockPrevButton.disabled).toBe(true);
        expect(mockNextButton.disabled).toBe(false);
        // All site buttons should be enabled because isTransitioning is false
        mockSiteButtons.forEach(button => expect(button.disabled).toBe(false));
        expect(mockSiteButton1.classList.add).toHaveBeenCalledWith('active');
        expect(mockSiteButton2.classList.remove).toHaveBeenCalledWith('active');
        expect(mockSiteButton3.classList.remove).toHaveBeenCalledWith('active');
    });

    test('Scenario 2: Middle site selected (index 1)', () => {
        AppContext.setCurrentSiteIndex(1);
        AppContext.setIsTransitioning(false); // Explicitly set
        AppContext.updateNavigationButtons();

        expect(mockPrevButton.disabled).toBe(false);
        expect(mockNextButton.disabled).toBe(false);
        mockSiteButtons.forEach(button => expect(button.disabled).toBe(false));
        expect(mockSiteButton1.classList.remove).toHaveBeenCalledWith('active');
        expect(mockSiteButton2.classList.add).toHaveBeenCalledWith('active');
        expect(mockSiteButton3.classList.remove).toHaveBeenCalledWith('active');
    });

    test('Scenario 3: Last site selected (index 2)', () => {
        AppContext.setCurrentSiteIndex(2);
        AppContext.setIsTransitioning(false); // Explicitly set
        AppContext.updateNavigationButtons();

        expect(mockPrevButton.disabled).toBe(false);
        expect(mockNextButton.disabled).toBe(true);
        mockSiteButtons.forEach(button => expect(button.disabled).toBe(false));
        expect(mockSiteButton1.classList.remove).toHaveBeenCalledWith('active');
        expect(mockSiteButton2.classList.remove).toHaveBeenCalledWith('active');
        expect(mockSiteButton3.classList.add).toHaveBeenCalledWith('active');
    });

    test('Scenario 4: Only one site in total (not transitioning)', () => {
        AppContext.setCurrentSiteIndex(0);
        AppContext.setIsTransitioning(false); // Explicitly set for clarity

        const singleSiteData = [{ name: "Single Site", createFunc: jest.fn(), description: "desc", bgColor: 0x000000 }];
        const sitesDataSpy = jest.spyOn(AppContext, 'getSitesData').mockReturnValue(singleSiteData);

        // Adjust querySelectorAll for site-specific buttons
        mockNavControlsContainer.querySelectorAll = jest.fn((selector) => {
            if (selector === 'button:not(#prevButton):not(#nextButton)') return [mockSiteButton1];
            return [];
        });

        AppContext.updateNavigationButtons();

        expect(mockPrevButton.disabled).toBe(true); // currentSiteIndex is 0
        expect(mockNextButton.disabled).toBe(true); // currentSiteIndex is 0, and sites.length is 1 (0 >= 1-1)

        expect(mockSiteButton1.disabled).toBe(false); // Not transitioning
        expect(mockSiteButton1.classList.add).toHaveBeenCalledWith('active');

        // Ensure other site buttons (mockSiteButton2, mockSiteButton3) were not affected by this call,
        // as they were not part of the querySelectorAll result for site-specific buttons.
        expect(mockSiteButton2.classList.add).not.toHaveBeenCalled();
        expect(mockSiteButton2.classList.remove).not.toHaveBeenCalled();
        expect(mockSiteButton3.classList.add).not.toHaveBeenCalled();
        expect(mockSiteButton3.classList.remove).not.toHaveBeenCalled();

        sitesDataSpy.mockRestore(); // Restore spy, though afterEach will also do it.
    });

    test('when transitioning (at first site), all buttons disabled, active class still set', () => {
        AppContext.setCurrentSiteIndex(0);
        AppContext.setIsTransitioning(true);

        // Ensure AppContext.getSitesData() would return the default 3 sites.
        // This is usually covered by not mocking it here if the default is 3 sites.
        // If a previous test mocked it to something else, afterEach should restore it.
        // For safety, if a specific length is assumed for active class assertions on siteButtons:
        jest.spyOn(AppContext, 'getSitesData').mockReturnValue([{}, {}, {}]); // Assuming 3 sites for mockSiteButtons indices

        AppContext.updateNavigationButtons();

        expect(mockPrevButton.disabled).toBe(true);
        expect(mockNextButton.disabled).toBe(true);
        mockSiteButtons.forEach(button => expect(button.disabled).toBe(true));

        expect(mockSiteButton1.classList.add).toHaveBeenCalledWith('active');
        expect(mockSiteButton2.classList.remove).toHaveBeenCalledWith('active');
        expect(mockSiteButton3.classList.remove).toHaveBeenCalledWith('active');
    });

    test('when transitioning (at middle site), all buttons disabled, active class still set', () => {
        AppContext.setCurrentSiteIndex(1);
        AppContext.setIsTransitioning(true);
        jest.spyOn(AppContext, 'getSitesData').mockReturnValue([{}, {}, {}]); // Assuming 3 sites

        AppContext.updateNavigationButtons();

        expect(mockPrevButton.disabled).toBe(true);
        expect(mockNextButton.disabled).toBe(true);
        mockSiteButtons.forEach(button => expect(button.disabled).toBe(true));

        expect(mockSiteButton1.classList.remove).toHaveBeenCalledWith('active');
        expect(mockSiteButton2.classList.add).toHaveBeenCalledWith('active');
        expect(mockSiteButton3.classList.remove).toHaveBeenCalledWith('active');
    });
});
