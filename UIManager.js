// UIManager.js

export default class UIManager {
    constructor(
        sitesData,
        switchSiteCallback,
        navigationContainer,
        descriptionElement,
        loadingIndicator,
    ) {
        this.sitesData = sitesData;
        this.switchSiteCallback = switchSiteCallback;
        this.navigationContainer = navigationContainer;
        this.descriptionElement = descriptionElement;
        this.loadingIndicator = loadingIndicator;
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
        prevButton.setAttribute('aria-label', 'Go to previous site');
        prevButton.title = 'Previous Site (Left Arrow)';
        prevButton.addEventListener('click', () => this.navigatePrevious());
        this.navigationContainer.appendChild(prevButton);
        this.navButtons.push(prevButton); // Add to general list for disabling

        this.sitesData.forEach((site, index) => {
            const button = document.createElement('button');
            button.textContent = site.name;
            button.setAttribute('aria-label', `View site ${index + 1}: ${site.name}`);
            button.title = `View ${site.name} (Key ${index + 1})`;
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
        nextButton.setAttribute('aria-label', 'Go to next site');
        nextButton.title = 'Next Site (Right Arrow)';
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
        let newIndex = this.currentIndex - 1;
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
            this.navButtons.forEach((btn) => {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.setAttribute('aria-disabled', 'true');
                // btn.disabled = true; // Removed to maintain focusability
            });
        } else {
            this.navigationContainer.classList.remove('transitioning');
            this.navButtons.forEach((btn) => {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.removeAttribute('aria-disabled');
                // btn.disabled = false;
            });
        }
    }

    showLoading(message = 'Loading...') {
        if (!this.loadingIndicator) return;
        this.loadingIndicator.innerHTML = `<p id="loadingText">${message}</p>`;
        this.loadingIndicator.style.display = 'flex';
        this.loadingIndicator.style.backgroundColor = '#1a1a1a';
    }

    updateLoadingProgress(percent) {
        const p = document.getElementById('loadingText');
        if (p) p.textContent = `Loading... ${percent}%`;
    }

    hideLoading() {
        if (!this.loadingIndicator) return;
        this.loadingIndicator.style.display = 'none';
    }

    showError(url, retryCallback, dismissCallback) {
        if (!this.loadingIndicator) return;

        this.loadingIndicator.innerHTML = '';
        this.loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent

        const errorContainer = document.createElement('div');
        errorContainer.id = 'errorContainer';
        errorContainer.setAttribute('role', 'alert');
        errorContainer.style.backgroundColor = '#1a1a1a';
        errorContainer.style.padding = '20px';
        errorContainer.style.borderRadius = '8px';
        errorContainer.style.textAlign = 'center';
        errorContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

        const msg = document.createElement('p');
        msg.textContent = `Error loading ${url}. Using placeholder.`;
        msg.style.marginBottom = '15px';
        errorContainer.appendChild(msg);

        if (retryCallback) {
            const retryBtn = document.createElement('button');
            retryBtn.textContent = 'Retry Loading';
            retryBtn.style.marginRight = '10px';
            retryBtn.style.padding = '8px 16px';
            retryBtn.style.cursor = 'pointer';
            retryBtn.onclick = retryCallback;
            errorContainer.appendChild(retryBtn);
        }

        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.style.padding = '8px 16px';
        dismissBtn.style.cursor = 'pointer';
        dismissBtn.onclick = dismissCallback || (() => this.hideLoading());
        errorContainer.appendChild(dismissBtn);

        this.loadingIndicator.appendChild(errorContainer);
    }
}
