// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - MAIN GAME CLASS
// Core game loop, state management, and orchestration
// ═══════════════════════════════════════════════════════════════════════════════

import { GAME, COLORS, ANIMATIONS } from '../constants.js';
import { Player } from './Player.js';
import { Arena } from './Arena.js';
import { Input } from './Input.js';
import { playersCollide, getCollisionPoint } from './Collision.js';
import { drawWobblyCircle } from './renderUtils.js';

export class Game {
    constructor(canvas, multiplayer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.multiplayer = multiplayer;

        // Set canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Game objects
        this.arena = new Arena(this.canvas.width, this.canvas.height);
        this.input = new Input();
        this.players = new Map();
        this.localPlayer = null;

        // Game state
        this.state = 'waiting'; // 'waiting' | 'playing' | 'ended'
        this.itPlayerId = null;
        this.roundEndTime = 0; // Absolute timestamp when round ends
        this.totalRoundTime = GAME.ROUND_DURATION;

        // Effects state
        this.dimmed = false;
        this.dimEndTime = 0;
        this.particles = [];

        // Timing
        this.lastTime = 0;
        this.lastSyncTime = 0;

        // Callbacks
        this.onTagLocal = null;
        this.onRoundEnd = null;
        this.onPlayerCountChange = null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────────────────────
    resize() {
        // Responsive sizing
        const maxWidth = Math.min(window.innerWidth * 0.95, GAME.WIDTH);
        const maxHeight = Math.min(window.innerHeight * 0.9, GAME.HEIGHT);
        const scale = Math.min(maxWidth / GAME.WIDTH, maxHeight / GAME.HEIGHT);

        this.canvas.width = GAME.WIDTH;
        this.canvas.height = GAME.HEIGHT;
        this.canvas.style.width = `${GAME.WIDTH * scale}px`;
        this.canvas.style.height = `${GAME.HEIGHT * scale}px`;

        // Update arena center if exists
        if (this.arena) {
            this.arena.width = this.canvas.width;
            this.arena.height = this.canvas.height;
            this.arena.centerX = this.canvas.width / 2;
            this.arena.centerY = this.canvas.height / 2;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PLAYER MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────────
    addLocalPlayer(id, name) {
        const center = this.arena.getCenter();
        const player = new Player(
            id,
            name,
            center.x + (Math.random() - 0.5) * 100,
            center.y + (Math.random() - 0.5) * 100,
            true
        );
        this.localPlayer = player;
        this.players.set(id, player);
        this.notifyPlayerCountChange();
        return player;
    }

    addRemotePlayer(id, name, x, y) {
        if (this.players.has(id)) return this.players.get(id);

        const player = new Player(id, name, x, y, false);
        this.players.set(id, player);
        this.notifyPlayerCountChange();
        return player;
    }

    removePlayer(id) {
        this.players.delete(id);
        this.notifyPlayerCountChange();

        // If IT player left, reassign
        if (this.itPlayerId === id && this.players.size > 0) {
            this.assignRandomIt();
        }
    }

    getPlayer(id) {
        return this.players.get(id);
    }

    notifyPlayerCountChange() {
        if (this.onPlayerCountChange) {
            this.onPlayerCountChange(this.players.size);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GAME STATE
    // ─────────────────────────────────────────────────────────────────────────────
    startGame() {
        if (this.players.size < GAME.MIN_PLAYERS) return false;

        this.state = 'playing';
        // Use absolute wall-clock time so timer works correctly in background tabs
        this.roundEndTime = Date.now() + (GAME.ROUND_DURATION * 1000);
        this.arena.radius = GAME.ARENA_INITIAL_RADIUS;

        // Reset all players
        this.players.forEach(player => {
            player.timeAsIt = 0;
            player.isIt = false;
            player.energy = GAME.MAX_ENERGY;
        });

        // Assign random IT
        this.assignRandomIt();

        return true;
    }

    assignRandomIt() {
        const playerIds = Array.from(this.players.keys());
        if (playerIds.length === 0) return;

        const randomId = playerIds[Math.floor(Math.random() * playerIds.length)];
        this.setItPlayer(randomId);
    }

    setItPlayer(playerId, fromTag = false) {
        // Clear previous IT
        if (this.itPlayerId) {
            const prevIt = this.players.get(this.itPlayerId);
            if (prevIt) prevIt.stopBeingIt();
        }

        // Set new IT
        this.itPlayerId = playerId;
        const newIt = this.players.get(playerId);
        if (newIt) {
            newIt.becomeIt();

            // Trigger tag alert for local player
            if (newIt.isLocal && fromTag && this.onTagLocal) {
                this.onTagLocal();
            }
        }
    }

    endRound() {
        this.state = 'ended';

        // Find loser (highest timeAsIt)
        let loser = null;
        let maxTime = -1;

        this.players.forEach(player => {
            if (player.timeAsIt > maxTime) {
                maxTime = player.timeAsIt;
                loser = player;
            }
        });

        if (this.onRoundEnd && loser) {
            this.onRoundEnd(loser.name, loser.timeAsIt);
        }
    }

    resetGame() {
        this.state = 'waiting';
        this.roundEndTime = 0;
        this.arena.radius = GAME.ARENA_INITIAL_RADIUS;
        this.itPlayerId = null;

        // Reset player positions
        const center = this.arena.getCenter();
        this.players.forEach(player => {
            player.x = center.x + (Math.random() - 0.5) * 100;
            player.y = center.y + (Math.random() - 0.5) * 100;
            player.timeAsIt = 0;
            player.isIt = false;
            player.energy = GAME.MAX_ENERGY;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GAME LOOP
    // ─────────────────────────────────────────────────────────────────────────────
    start() {
        this.lastTime = performance.now();
        this.isVisible = true;
        this.backgroundInterval = null;

        // Handle visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab is now hidden - use setInterval to keep running
                this.isVisible = false;
                if (!this.backgroundInterval) {
                    this.backgroundInterval = setInterval(() => {
                        this.backgroundLoop();
                    }, 1000 / 30); // 30 FPS in background (lower to save CPU)
                }
            } else {
                // Tab is visible again - switch back to requestAnimationFrame
                this.isVisible = true;
                if (this.backgroundInterval) {
                    clearInterval(this.backgroundInterval);
                    this.backgroundInterval = null;
                }
                this.lastTime = performance.now();
                // Restart the render loop
                this.loop();
            }
        });

        this.loop();
    }

    loop() {
        const now = performance.now();
        const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1); // Cap at 100ms to prevent huge jumps
        this.lastTime = now;

        this.update(deltaTime);
        this.render();

        if (this.isVisible) {
            requestAnimationFrame(() => this.loop());
        }
    }

    backgroundLoop() {
        const now = performance.now();
        const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        // Only update logic, skip rendering when in background
        this.update(deltaTime);
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Calculate remaining time from absolute wall-clock time
        // This ensures timer stays synced even when tab is in background
        const remainingMs = this.roundEndTime - Date.now();
        const roundTimeRemaining = Math.max(0, remainingMs / 1000);

        if (roundTimeRemaining <= 0) {
            this.endRound();
            return;
        }

        // Update arena shrinking
        this.arena.update(deltaTime, roundTimeRemaining, this.totalRoundTime);

        // Check for boost input (local player only)
        if (this.localPlayer && this.input.consumeBoostPress()) {
            if (this.localPlayer.tryBoost()) {
                this.multiplayer?.sendBoost();
            }
        }

        // Update players
        const arenaRadius = this.arena.getRadius();
        const center = this.arena.getCenter();

        this.players.forEach(player => {
            player.update(deltaTime, this.input, arenaRadius, center.x, center.y);
        });

        // Check for tags (only IT can tag)
        this.checkTags();

        // Sync position to network
        this.syncToNetwork();

        // Update dim effect
        if (this.dimmed && performance.now() >= this.dimEndTime) {
            this.dimmed = false;
        }

        // Update particles
        this.updateParticles(deltaTime);
    }

    checkTags() {
        if (!this.itPlayerId) {
            return;
        }

        const itPlayer = this.players.get(this.itPlayerId);
        if (!itPlayer) {
            return;
        }

        // Only the local IT player checks for tags (to avoid duplicate tags)
        if (!itPlayer.isLocal) {
            return;
        }

        this.players.forEach((player, id) => {
            if (id === this.itPlayerId) return;
            if (!player.canBeTagged()) return;

            // For remote players, use targetX/Y for collision (matches visual position better)
            const p1x = itPlayer.x;
            const p1y = itPlayer.y;
            const p2x = player.isLocal ? player.x : player.targetX;
            const p2y = player.isLocal ? player.y : player.targetY;

            const dx = p1x - p2x;
            const dy = p1y - p2y;
            const distanceSquared = dx * dx + dy * dy;
            const minDistance = GAME.PLAYER_RADIUS * 2;

            if (distanceSquared < minDistance * minDistance) {
                // Tag occurred!
                console.log('TAG DETECTED!', itPlayer.name, 'tagged', player.name);
                this.handleTag(itPlayer, player);
            }
        });
    }

    handleTag(tagger, tagged) {
        console.log('HANDLING TAG:', tagger.name, '->', tagged.name);

        // Create explosion effect at collision point
        const point = getCollisionPoint(tagger, tagged);
        this.createExplosion(point.x, point.y);

        // Trigger screen shake
        this.triggerShake();

        // Dim the screen
        this.dimmed = true;
        this.dimEndTime = performance.now() + ANIMATIONS.TAG_ALERT_DURATION;

        // Transfer IT status
        this.setItPlayer(tagged.id, true);

        // Notify network
        this.multiplayer?.sendTag(tagged.id);
    }

    triggerShake() {
        this.canvas.classList.remove('shake');
        void this.canvas.offsetWidth; // Force reflow
        this.canvas.classList.add('shake');
        setTimeout(() => {
            this.canvas.classList.remove('shake');
        }, 500);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PARTICLES / EFFECTS
    // ─────────────────────────────────────────────────────────────────────────────
    createExplosion(x, y) {
        const particleCount = 15;
        const color = COLORS.DANGER; // Explosion color (Crayon dust)

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = 100 + Math.random() * 100;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 2 + Math.random(),
                // Random type: 0 = dot, 1 = star/X
                type: Math.random() > 0.7 ? 1 : 0,
                color: color
            });
        }
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= p.decay * deltaTime;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // NETWORK SYNC
    // ─────────────────────────────────────────────────────────────────────────────
    syncToNetwork() {
        if (!this.localPlayer || !this.multiplayer) return;

        const now = performance.now();
        if (now - this.lastSyncTime < GAME.SYNC_INTERVAL) return;

        this.lastSyncTime = now;
        this.multiplayer.sendMove(
            this.localPlayer.x,
            this.localPlayer.y,
            this.localPlayer.isBoosting
        );
    }

    handleRemoteMove(playerId, x, y, isBoosting) {
        const player = this.players.get(playerId);
        if (player && !player.isLocal) {
            player.targetX = x;
            player.targetY = y;
            player.isBoosting = isBoosting;
        }
    }

    handleRemoteTag(newItId) {
        this.setItPlayer(newItId, this.localPlayer?.id === newItId);

        // Create explosion at new IT's position
        const newIt = this.players.get(newItId);
        if (newIt) {
            this.createExplosion(newIt.x, newIt.y);
            this.dimmed = true;
            this.dimEndTime = performance.now() + ANIMATIONS.TAG_ALERT_DURATION;
        }
    }

    handleRemoteBoost(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.isBoosting = true;
            player.boostEndTime = performance.now() + GAME.BOOST_DURATION * 1000;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────────
    render() {
        const ctx = this.ctx;

        // Clear
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Determine if we should dim (during tag alert)
        const dimOthers = this.dimmed;

        // Layer 0-1: Background and Arena
        this.arena.render(ctx, dimOthers);

        // Layer 2: Safe players (non-IT)
        this.players.forEach(player => {
            if (!player.isIt) {
                player.render(ctx, dimOthers);
            }
        });

        // Layer 3: IT player (always full brightness)
        this.players.forEach(player => {
            if (player.isIt) {
                player.render(ctx, false);
            }
        });

        // Particles (Top layer)
        this.renderParticles(ctx);
    }

    renderParticles(ctx) {
        ctx.save();
        const time = performance.now() / 1000;

        this.particles.forEach(p => {
            // Fade out
            ctx.globalAlpha = Math.max(0, p.life);

            if (p.type === 1) {
                // "X" or "Star" shape for debris
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p.x - 4, p.y - 4);
                ctx.lineTo(p.x + 4, p.y + 4);
                ctx.moveTo(p.x + 4, p.y - 4);
                ctx.lineTo(p.x - 4, p.y + 4);
                ctx.stroke();
            } else {
                // Irregular crumb/dot
                drawWobblyCircle(
                    ctx,
                    p.x,
                    p.y,
                    3,
                    p.color,
                    1,
                    time + p.life,
                    true // Filled
                );
            }
        });
        ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GETTERS
    // ─────────────────────────────────────────────────────────────────────────────
    getTimeRemaining() {
        if (this.state !== 'playing') return GAME.ROUND_DURATION;
        const remainingMs = this.roundEndTime - Date.now();
        return Math.max(0, remainingMs / 1000);
    }

    getLeaderboard() {
        const players = Array.from(this.players.values());
        return players
            .map(p => ({
                id: p.id,
                name: p.name,
                timeAsIt: p.timeAsIt,
                isIt: p.isIt
            }))
            .sort((a, b) => b.timeAsIt - a.timeAsIt);
    }

    getState() {
        return this.state;
    }

    getPlayerCount() {
        return this.players.size;
    }
}

export default Game;
