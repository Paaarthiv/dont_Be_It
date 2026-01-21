// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - MAIN ENTRY POINT
// Application initialization and orchestration
// ═══════════════════════════════════════════════════════════════════════════════

import { Game } from './src/game/Game.js';
import { Multiplayer } from './src/network/Multiplayer.js';
import { Landing } from './src/ui/Landing.js';
import { HUD } from './src/ui/HUD.js';
import { Alerts } from './src/ui/Alerts.js';
import { Results } from './src/ui/Results.js';
import { GAME } from './src/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION STATE
// ─────────────────────────────────────────────────────────────────────────────
let game = null;
let multiplayer = null;
let landing = null;
let hud = null;
let alerts = null;
let results = null;

const waitingScreen = document.getElementById('waitingScreen');
const currentPlayersEl = document.getElementById('currentPlayers');

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────
async function init() {
    // Initialize UI components
    landing = new Landing();
    hud = new HUD();
    alerts = new Alerts();
    results = new Results();

    // Initialize multiplayer
    multiplayer = new Multiplayer();

    // Initialize game
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas, multiplayer);

    // Wire up UI handlers
    setupLandingHandlers();
    setupGameHandlers();
    setupMultiplayerHandlers();
    setupResultsHandlers();

    // Start the game loop (renders even before playing)
    game.start();

    console.log('Tag Arena initialized');
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING SCREEN HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
function setupLandingHandlers() {
    landing.onPlay = async (name) => {
        try {
            // Join the multiplayer session
            const playerId = await multiplayer.join(name);

            // Add local player to game
            game.addLocalPlayer(playerId, name);

            // Hide landing, show waiting
            landing.hide();
            showWaiting();
            hud.show();

            // Check if we can start
            checkGameStart();
        } catch (error) {
            console.error('Failed to join:', error);
            alert('Failed to join game. Please try again.');
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
function setupGameHandlers() {
    // When local player becomes IT
    game.onTagLocal = () => {
        alerts.showTagAlert();
    };

    // When round ends
    game.onRoundEnd = (loserName, timeAsIt) => {
        hud.hide();
        results.show(loserName, timeAsIt);
    };

    // Player count changes
    game.onPlayerCountChange = (count) => {
        landing.updatePlayerCount(count);
        updateWaitingCount(count);
        checkGameStart();
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTIPLAYER HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
function setupMultiplayerHandlers() {
    // Player joins
    multiplayer.onPlayerJoin = (id, name, x, y) => {
        game.addRemotePlayer(id, name, x, y);
        checkGameStart();
    };

    // Player leaves
    multiplayer.onPlayerLeave = (id) => {
        game.removePlayer(id);
    };

    // Player moves
    multiplayer.onPlayerMove = (id, x, y, isBoosting) => {
        game.handleRemoteMove(id, x, y, isBoosting);
    };

    // Tag event
    multiplayer.onTag = (newItId) => {
        game.handleRemoteTag(newItId);
    };

    // Boost event
    multiplayer.onBoost = (playerId) => {
        game.handleRemoteBoost(playerId);
    };

    // Game start (from host)
    multiplayer.onGameStart = (itPlayerId) => {
        hideWaiting();
        game.startGame();
        game.setItPlayer(itPlayerId, game.localPlayer?.id === itPlayerId);
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
function setupResultsHandlers() {
    results.onPlayAgain = () => {
        results.hide();
        game.resetGame();
        showWaiting();
        hud.show();
        checkGameStart();
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// WAITING SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function showWaiting() {
    waitingScreen.classList.remove('hidden');
    waitingScreen.classList.add('active');
}

function hideWaiting() {
    waitingScreen.classList.add('hidden');
    waitingScreen.classList.remove('active');
}

function updateWaitingCount(count) {
    if (currentPlayersEl) {
        currentPlayersEl.textContent = count;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME START CHECK
// ─────────────────────────────────────────────────────────────────────────────
function checkGameStart() {
    const playerCount = game.getPlayerCount();

    // Need minimum players to start
    if (playerCount >= GAME.MIN_PLAYERS && game.getState() === 'waiting') {
        // Host starts the game
        if (multiplayer.getIsHost()) {
            setTimeout(() => {
                // Double check we still have enough players
                if (game.getPlayerCount() >= GAME.MIN_PLAYERS && game.getState() === 'waiting') {
                    startGameAsHost();
                }
            }, 1500); // Give a moment for everyone to sync
        }
    }
}

function startGameAsHost() {
    const success = game.startGame();
    if (success) {
        hideWaiting();

        // Broadcast game start to others
        multiplayer.sendGameStart(game.itPlayerId);

        // Show alert if local player is IT
        if (game.localPlayer?.isIt) {
            alerts.showTagAlert();
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD UPDATE LOOP
// ─────────────────────────────────────────────────────────────────────────────
function startHUDUpdates() {
    // Use setInterval instead of requestAnimationFrame so it runs in background
    setInterval(() => {
        if (game && game.getState() === 'playing') {
            hud.updateTimer(game.getTimeRemaining());
            hud.updateLoserboard(game.getLeaderboard());
        }
    }, 100); // Update every 100ms (10 FPS for HUD is enough)
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('beforeunload', async () => {
    if (multiplayer) {
        await multiplayer.leave();
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    init();
    startHUDUpdates();
});
