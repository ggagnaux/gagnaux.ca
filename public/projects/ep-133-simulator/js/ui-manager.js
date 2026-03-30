/**
 * EP-133 Simulator - UI Manager
 * Manages all DOM manipulation and visual updates
 */

class UIManager {
    constructor() {
        this.elements = {};
        this.activePads = new Set();
        this.statusAnimationInterval = null;
    }

    /**
     * Initialize and cache DOM element references
     */
    init() {
        this.cacheElements();
    }

    togglePower(isOn) {
        if (this.elements.device) {
            this.elements.device.classList.toggle('powered-off', !isOn);
        }

        // Update connection status
        const connectionStatus = document.querySelector('.connection-status');
        const connectionText = document.querySelector('.connection-text');

        if (connectionStatus) {
            connectionStatus.classList.toggle('disconnected', !isOn);  // ADD THIS LINE
        }

        if (connectionText) {
            connectionText.textContent = isOn ? 'Connected' : 'Disconnected';
        }
    }

    /**
     * Cache frequently accessed DOM elements
     */
    cacheElements() {
        this.elements.device = document.querySelector(CONFIG.UI.SELECTORS.DEVICE);
        this.elements.playBtn = document.querySelector('[data-pad="play"]');
        this.elements.playIcon = document.querySelector('.play-button');
        this.elements.recBtn = document.querySelector('[data-pad="record"]');
        this.elements.recLight = document.querySelector('.status-light.red');
        this.elements.bpmDisplay = document.querySelector('.bpm-display');
        this.elements.patternNumber = document.querySelector('.pattern-number');
        this.elements.statusIcons = document.querySelectorAll(CONFIG.UI.SELECTORS.STATUS_ICONS);
    }

    /**
     * Apply theme to the document
     * @param {string} theme - Theme name ('dark' or 'light')
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        // Update active state in settings dialog if open
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    /**
     * Apply 3D transform to device
     * @param {number} angle - Transform angle in degrees
     */
    applyTransform(angle) {
        if (this.elements.device) {
            this.elements.device.style.transform = `rotateX(${angle}deg)`;
        }
    }

    /**
     * Enable or disable native tooltips (title attributes)
     * @param {boolean} enabled - Tooltip enabled state
     */
    toggleTooltips(enabled) {
        document.querySelectorAll('[title]').forEach((el) => {
            if (enabled) {
                if (el.dataset.originalTitle) {
                    el.setAttribute('title', el.dataset.originalTitle);
                }
                return;
            }

            if (!el.dataset.originalTitle) {
                el.dataset.originalTitle = el.getAttribute('title');
            }
            el.removeAttribute('title');
        });
    }

    /**
     * Update play button state
     * @param {boolean} isPlaying - Playing state
     */
    updatePlayState(isPlaying) {
        if (this.elements.playBtn) {
            this.elements.playBtn.classList.toggle('active', isPlaying);
        }
        if (this.elements.playIcon) {
            this.elements.playIcon.classList.toggle('active', isPlaying);
        }

        if (isPlaying) {
            this.startStatusAnimation();
        } else {
            this.stopStatusAnimation();
        }
    }

    /**
     * Update record button state
     * @param {boolean} isRecording - Recording state
     */
    updateRecordState(isRecording) {
        if (this.elements.recBtn) {
            this.elements.recBtn.classList.toggle('active', isRecording);
        }
        if (this.elements.recLight) {
            this.elements.recLight.classList.toggle('active', isRecording);
        }
    }

    /**
     * Highlight or unhighlight a pad
     * @param {string} padId - Pad identifier
     * @param {boolean} active - Active state
     */
    highlightPad(padId, active) {
        const pad = document.querySelector(`[data-pad="${padId}"]`);
        if (pad) {
            if (active) {
                pad.classList.add('active');
                this.activePads.add(padId);
            } else {
                pad.classList.remove('active');
                this.activePads.delete(padId);
            }
        }
    }

    /**
     * Highlight current sequencer step (placeholder)
     * @param {number} step - Step number
     */
    highlightStep(step) {
        // Simple visual metronome
        // Could be enhanced to show step position in a visual sequencer grid
    }

    /**
     * Update display elements
     * @param {object} state - Application state
     */
    updateDisplay(state) {
        if (this.elements.bpmDisplay && state.bpm) {
            this.elements.bpmDisplay.textContent = state.bpm;
        }

        if (this.elements.patternNumber && state.currentPattern) {
            this.elements.patternNumber.textContent = state.currentPattern;
        }
    }

    /**
     * Start status icon animation based on BPM
     * @param {number} bpm - Beats per minute
     */
    startStatusAnimation(bpm = 133) {
        this.stopStatusAnimation();

        const totalIcons = this.elements.statusIcons.length;
        let currentIndex = 0;

        // Calculate timing: complete cycle in one bar (4 beats)
        const cycleDuration = (60000 / bpm) * 4;
        const interval = cycleDuration / totalIcons;

        // Reset all icons
        this.elements.statusIcons.forEach(icon => icon.classList.remove('active'));

        this.statusAnimationInterval = setInterval(() => {
            // Clear previous
            const prevIndex = (currentIndex - 1 + totalIcons) % totalIcons;
            if (this.elements.statusIcons[prevIndex]) {
                this.elements.statusIcons[prevIndex].classList.remove('active');
            }

            // Set current
            if (this.elements.statusIcons[currentIndex]) {
                this.elements.statusIcons[currentIndex].classList.add('active');
            }

            currentIndex = (currentIndex + 1) % totalIcons;
        }, interval);
    }

    /**
     * Stop status icon animation
     */
    stopStatusAnimation() {
        if (this.statusAnimationInterval) {
            clearInterval(this.statusAnimationInterval);
            this.statusAnimationInterval = null;
        }
        this.elements.statusIcons.forEach(icon => icon.classList.remove('active'));
    }

    /**
     * Show a notification message
     * @param {string} message - Message to display
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--text-accent);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            z-index: 2000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}
