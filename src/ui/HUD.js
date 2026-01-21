// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - HUD (Heads-Up Display)
// Timer and Loserboard UI
// ═══════════════════════════════════════════════════════════════════════════════

import { GAME } from '../constants.js';

export class HUD {
    constructor() {
        this.container = document.getElementById('hud');
        this.timerValue = document.getElementById('roundTimer');
        this.loserboardList = document.getElementById('loserboardList');

        this.lastLeaderboard = [];
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }

    updateTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        this.timerValue.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        // Add critical class when low
        if (seconds <= GAME.CRITICAL_TIME) {
            this.timerValue.classList.add('critical');
        } else {
            this.timerValue.classList.remove('critical');
        }
    }

    updateLoserboard(players) {
        // Only update if changed
        const currentJson = JSON.stringify(players.map(p => ({
            name: p.name,
            time: Math.floor(p.timeAsIt * 10),
            isIt: p.isIt
        })));

        if (currentJson === this.lastLeaderboardJson) return;
        this.lastLeaderboardJson = currentJson;

        // Clear and rebuild
        this.loserboardList.innerHTML = '';

        players.forEach((player, index) => {
            const li = document.createElement('li');

            // Top loser gets skull
            if (index === 0 && player.timeAsIt > 0) {
                li.classList.add('top-loser');
            }

            // Current IT is highlighted
            if (player.isIt) {
                li.classList.add('is-it');
            }

            li.innerHTML = `
        <span class="name">${this.escapeHtml(player.name)}</span>
        <span class="time">${player.timeAsIt.toFixed(1)}s</span>
      `;

            this.loserboardList.appendChild(li);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default HUD;
