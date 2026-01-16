
import UIManager from '../../UIManager.js';

describe('UIManager Extended Tests', () => {
    let uiManager;
    let mockSwitchSite;
    let mockNavigationContainer;
    let mockDescriptionElement;
    let sitesData;

    beforeEach(() => {
        sitesData = [
            { name: 'Site 1', description: 'Desc 1' },
            { name: 'Site 2', description: 'Desc 2' },
            { name: 'Site 3', description: 'Desc 3' }
        ];
        mockSwitchSite = jest.fn();
        mockNavigationContainer = document.createElement('div');
        mockDescriptionElement = document.createElement('div');

        uiManager = new UIManager(sitesData, mockSwitchSite, mockNavigationContainer, mockDescriptionElement);
        uiManager.createNavigationButtons();
    });

    test('createNavigationButtons creates Prev/Next buttons', () => {
        const buttons = mockNavigationContainer.querySelectorAll('button');
        // 3 sites + Prev + Next = 5 buttons
        expect(buttons.length).toBe(5);
        expect(buttons[0].textContent).toBe('Previous');
        expect(buttons[4].textContent).toBe('Next');
    });

    test('Prev button wraps around', () => {
        // Initial state index is undefined/null usually, but let's assume updateActiveButton(0) was called
        uiManager.updateActiveButton(0);

        uiManager.navigatePrevious();
        expect(mockSwitchSite).toHaveBeenCalledWith(2);
    });

    test('Next button wraps around', () => {
        uiManager.updateActiveButton(2);

        uiManager.navigateNext();
        expect(mockSwitchSite).toHaveBeenCalledWith(0);
    });

    test('Next button increments', () => {
        uiManager.updateActiveButton(0);

        uiManager.navigateNext();
        expect(mockSwitchSite).toHaveBeenCalledWith(1);
    });

    test('Prev button decrements', () => {
        uiManager.updateActiveButton(1);

        uiManager.navigatePrevious();
        expect(mockSwitchSite).toHaveBeenCalledWith(0);
    });

    test('ARIA attributes are set correctly on updateActiveButton', () => {
        uiManager.updateActiveButton(1);

        const siteButtons = uiManager.siteButtons;
        expect(siteButtons[0].getAttribute('aria-current')).toBeNull();
        expect(siteButtons[1].getAttribute('aria-current')).toBe('true');
        expect(siteButtons[2].getAttribute('aria-current')).toBeNull();
    });

    test('Disabling buttons sets aria-disabled', () => {
        uiManager.setTransitioning(true);
        const allButtons = uiManager.navButtons;
        allButtons.forEach(btn => {
            expect(btn.getAttribute('aria-disabled')).toBe('true');
        });

        uiManager.setTransitioning(false);
        allButtons.forEach(btn => {
            expect(btn.hasAttribute('aria-disabled')).toBe(false);
        });
    });
});
