// UIManager.js

export default class UIManager {
    constructor(sitesData, switchSiteCallback, navigationContainer, descriptionElement) {
        this.sitesData = sitesData;
        this.switchSiteCallback = switchSiteCallback;
        this.navigationContainer = navigationContainer;
        this.descriptionElement = descriptionElement;
        this.navButtons = [];
    }

    createNavigationButtons() {
        // Clear existing buttons
        this.navigationContainer.innerHTML = '';
        this.navButtons = [];

        this.sitesData.forEach((site, index) => {
            const button = document.createElement('button');
            button.textContent = site.name;
            button.setAttribute('aria-label', `View site ${index + 1}: ${site.name}`);
            button.addEventListener('click', () => {
                // Inhibit clicking if a transition is active
                if (this.navigationContainer.classList.contains('transitioning')) return;
                this.switchSiteCallback(index);
            });
            this.navigationContainer.appendChild(button);
            this.navButtons.push(button);
        });
    }

    updateActiveButton(activeIndex) {
        this.navButtons.forEach((button, index) => {
            if (index === activeIndex) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    updateSiteDescription(description) {
        this.descriptionElement.textContent = description;
    }

    showDescription() {
        this.descriptionElement.classList.add('visible');
    }

    hideDescription() {
        this.descriptionElement.classList.remove('visible');
    }

    setTransitioning(isTransitioning) {
        if (isTransitioning) {
            this.navigationContainer.classList.add('transitioning');
            this.navButtons.forEach(btn => {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
        } else {
            this.navigationContainer.classList.remove('transitioning');
            this.navButtons.forEach(btn => {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });
        }
    }
}
