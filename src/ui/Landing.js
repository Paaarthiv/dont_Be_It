// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - LANDING SCREEN UI
// Name entry and validation
// ═══════════════════════════════════════════════════════════════════════════════

import { checkNameExists } from '../network/Supabase.js';

export class Landing {
    constructor() {
        this.container = document.getElementById('landing');
        this.nameInput = document.getElementById('playerName');
        this.playButton = document.getElementById('playButton');
        this.nameError = document.getElementById('nameError');
        this.playerCount = document.getElementById('playerCount');

        this.onPlay = null;
        this.validName = false;
        this.checkTimeout = null;

        this.setupListeners();
    }

    setupListeners() {
        // Input handling
        this.nameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim();

            // Clear previous timeout
            if (this.checkTimeout) {
                clearTimeout(this.checkTimeout);
            }

            // Hide button and error while typing
            this.hideError();
            this.playButton.classList.add('hidden');
            this.validName = false;

            if (name.length >= 2) {
                // Debounce name check
                this.checkTimeout = setTimeout(() => {
                    this.validateName(name);
                }, 300);
            }
        });

        // Play button
        this.playButton.addEventListener('click', () => {
            const name = this.nameInput.value.trim();
            if (name.length >= 2 && this.onPlay) {
                console.log('Play button clicked, starting with name:', name);
                this.onPlay(name);
            }
        });

        // Enter key
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.validName && this.onPlay) {
                const name = this.nameInput.value.trim();
                this.onPlay(name);
            }
        });
    }

    async validateName(name) {
        try {
            // Optimistic check: only block if explicitly returns true (exists)
            // If the table doesn't exist (likely cause of previous errors), we'll assume it's fine.
            const exists = await checkNameExists(name);

            if (exists === true) {
                this.showError();
                this.nameInput.classList.add('error');
                setTimeout(() => this.nameInput.classList.remove('error'), 400);
            } else {
                // If false (not taken) or null (table missing/error), allow it.
                this.validName = true;
                this.playButton.classList.remove('hidden');
                this.hideError(); // Ensure error is hidden if it was previously shown
            }
        } catch (error) {
            console.error('Error validating name:', error);
            // Allow play on error (optimistic)
            this.validName = true;
            this.playButton.classList.remove('hidden');
            this.hideError();
        }
    }

    showError() {
        this.nameError.classList.add('visible');
    }

    hideError() {
        this.nameError.classList.remove('visible');
    }

    updatePlayerCount(count) {
        this.playerCount.textContent = `${count} player${count !== 1 ? 's' : ''} online`;
    }

    show() {
        this.container.classList.remove('hidden');
        this.container.classList.add('active');
        this.nameInput.focus();
    }

    hide() {
        this.container.classList.add('hidden');
        this.container.classList.remove('active');
    }

    getName() {
        return this.nameInput.value.trim();
    }
}

export default Landing;
