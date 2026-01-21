// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - ALERTS UI
// "YOU ARE IT!" animation and screen flash
// ═══════════════════════════════════════════════════════════════════════════════

import { ANIMATIONS } from '../constants.js';

export class Alerts {
    constructor() {
        this.overlay = document.getElementById('alertOverlay');
        this.flash = document.getElementById('alertFlash');
        this.text = document.getElementById('alertText');

        this.hideTimeout = null;
    }

    showTagAlert() {
        // Clear any existing timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // Show overlay
        this.overlay.classList.remove('hidden');

        // Trigger flash
        this.flash.classList.remove('active');
        void this.flash.offsetWidth; // Force reflow
        this.flash.classList.add('active');

        // Trigger text animation
        this.text.classList.remove('active');
        void this.text.offsetWidth; // Force reflow
        this.text.classList.add('active');

        // Hide after duration
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, ANIMATIONS.TAG_ALERT_DURATION);
    }

    hide() {
        this.overlay.classList.add('hidden');
        this.flash.classList.remove('active');
        this.text.classList.remove('active');
    }

    setMessage(message) {
        this.text.textContent = message;
    }
}

export default Alerts;
