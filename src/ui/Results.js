// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - RESULTS SCREEN
// Game over modal with loser display
// ═══════════════════════════════════════════════════════════════════════════════

export class Results {
    constructor() {
        this.container = document.getElementById('resultScreen');
        this.loserName = document.getElementById('loserName');
        this.loserTime = document.getElementById('loserTime');
        this.playAgainButton = document.getElementById('playAgainButton');

        this.onPlayAgain = null;

        this.setupListeners();
    }

    setupListeners() {
        this.playAgainButton.addEventListener('click', () => {
            if (this.onPlayAgain) {
                this.onPlayAgain();
            }
        });

        // Enter key to play again
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.container.classList.contains('hidden')) {
                if (this.onPlayAgain) {
                    this.onPlayAgain();
                }
            }
        });
    }

    show(loserName, timeAsIt) {
        this.loserName.textContent = loserName;
        this.loserTime.textContent = timeAsIt.toFixed(1);
        this.container.classList.remove('hidden');
        this.container.classList.add('active');

        // Focus play again button
        setTimeout(() => {
            this.playAgainButton.focus();
        }, 100);
    }

    hide() {
        this.container.classList.add('hidden');
        this.container.classList.remove('active');
    }
}

export default Results;
