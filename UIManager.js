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
        this.siteButtons = []; // Keep track of site numbered/named buttons separately

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.setAttribute('aria-label', 'View previous site');
        prevButton.addEventListener('click', () => this.navigatePrevious());
        this.navigationContainer.appendChild(prevButton);
        this.navButtons.push(prevButton); // Add to general list for disabling

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
            this.siteButtons.push(button);
        });

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.setAttribute('aria-label', 'View next site');
        nextButton.addEventListener('click', () => this.navigateNext());
        this.navigationContainer.appendChild(nextButton);
        this.navButtons.push(nextButton);
    }

    updateActiveButton(activeIndex) {
        this.siteButtons.forEach((button, index) => {
            if (index === activeIndex) {
                button.classList.add('active');
                button.setAttribute('aria-current', 'true');
            } else {
                button.classList.remove('active');
                button.removeAttribute('aria-current');
            }
        });

        // Update current index for navigation logic if needed,
        // but switchSiteCallback usually handles the state in main.js/SiteManager.
        // We need to know current index to do prev/next.
        this.currentIndex = activeIndex;
    }

    navigatePrevious() {
        if (this.navigationContainer.classList.contains('transitioning')) return;
        let newIndex = (this.currentIndex - 1);
        if (newIndex < 0) newIndex = this.sitesData.length - 1;
        this.switchSiteCallback(newIndex);
    }

    navigateNext() {
        if (this.navigationContainer.classList.contains('transitioning')) return;
        let newIndex = (this.currentIndex + 1) % this.sitesData.length;
        this.switchSiteCallback(newIndex);
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
                btn.setAttribute('aria-disabled', 'true');
            });
        } else {
            this.navigationContainer.classList.remove('transitioning');
            this.navButtons.forEach(btn => {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.removeAttribute('aria-disabled');
            });
        }
    }
}
