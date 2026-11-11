import UIManager from '../../UIManager.js';

describe('UIManager', () => {
    let uiManager;
    let mockSwitchSiteCallback;
    let navContainer;
    let descriptionElement;
    let sitesData;

    beforeEach(() => {
        sitesData = [
            { name: 'Site 1', description: 'Desc 1' },
            { name: 'Site 2', description: 'Desc 2' },
        ];
        mockSwitchSiteCallback = jest.fn();
        navContainer = document.createElement('nav');
        descriptionElement = document.createElement('div');

        uiManager = new UIManager(sitesData, mockSwitchSiteCallback, navContainer, descriptionElement);
    });

    test('createNavigationButtons should create buttons', () => {
        uiManager.createNavigationButtons();
        const buttons = navContainer.querySelectorAll('button');
        // Prev + 2 sites + Next = 4 buttons
        expect(buttons.length).toBe(4);
        expect(buttons[0].textContent).toBe('Previous');
        expect(buttons[1].textContent).toBe('Site 1');
        expect(buttons[2].textContent).toBe('Site 2');
        expect(buttons[3].textContent).toBe('Next');
    });

    test('updateActiveButton should set aria-current', () => {
        uiManager.createNavigationButtons();
        uiManager.updateActiveButton(0);

        const siteButtons = uiManager.siteButtons;
        expect(siteButtons[0].getAttribute('aria-current')).toBe('true');
        expect(siteButtons[1].hasAttribute('aria-current')).toBe(false);
    });

    test('updateSiteDescription should update text', () => {
        uiManager.updateSiteDescription('New Description');
        expect(descriptionElement.textContent).toBe('New Description');
    });

    test('setTransitioning should disable/enable buttons', () => {
        uiManager.createNavigationButtons();

        // Disable
        uiManager.setTransitioning(true);
        expect(navContainer.classList.contains('transitioning')).toBe(true);
        const btn = navContainer.querySelector('button');
        expect(btn.getAttribute('aria-disabled')).toBe('true');

        // Enable
        uiManager.setTransitioning(false);
        expect(navContainer.classList.contains('transitioning')).toBe(false);
        expect(btn.hasAttribute('aria-disabled')).toBe(false);
    });

    test('navigateNext should call switchSiteCallback with correct index', () => {
        uiManager.createNavigationButtons();
        uiManager.currentIndex = 0;
        uiManager.navigateNext();
        expect(mockSwitchSiteCallback).toHaveBeenCalledWith(1);

        uiManager.currentIndex = 1;
        uiManager.navigateNext();
        expect(mockSwitchSiteCallback).toHaveBeenCalledWith(0); // Loop back
    });

    test('navigatePrevious should call switchSiteCallback with correct index', () => {
        uiManager.createNavigationButtons();
        uiManager.currentIndex = 1;
        uiManager.navigatePrevious();
        expect(mockSwitchSiteCallback).toHaveBeenCalledWith(0);

        uiManager.currentIndex = 0;
        uiManager.navigatePrevious();
        expect(mockSwitchSiteCallback).toHaveBeenCalledWith(1); // Loop back
    });
});
