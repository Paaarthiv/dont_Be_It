// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - PLAYER ENTITY
// Handles player rendering, movement, boost, and trail effects
// ═══════════════════════════════════════════════════════════════════════════════

import { COLORS, GAME, TRAIL } from '../constants.js';
import { drawWobblyCircle, drawScribble, drawWobblyText } from './renderUtils.js';

export class Player {
    constructor(id, name, x, y, isLocal = false) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isLocal = isLocal;

        // IT status
        this.isIt = false;
        this.timeAsIt = 0;
        this.lastTagTime = 0;

        // Boost system
        this.energy = GAME.MAX_ENERGY;
        this.isBoosting = false;
        this.boostEndTime = 0;

        // Trail for IT player (stores last positions)
        this.trail = [];
        this.lastTrailTime = 0;

        // Interpolation for remote players
        this.targetX = x;
        this.targetY = y;
        this.interpolationSpeed = 10; // Higher = faster catch up
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────────────────────────
    update(deltaTime, input, arenaRadius, centerX, centerY) {
        if (this.isLocal) {
            this.updateLocalMovement(deltaTime, input);
        } else {
            this.updateRemoteInterpolation(deltaTime);
        }

        // Clamp to arena boundary
        this.clampToArena(arenaRadius, centerX, centerY);

        // Update boost state
        this.updateBoost(deltaTime);

        // Update energy regeneration
        this.updateEnergy(deltaTime);

        // Update trail (IT player only)
        if (this.isIt) {
            this.updateTrail();
        }

        // Track time as IT
        if (this.isIt) {
            this.timeAsIt += deltaTime;
        }
    }

    updateLocalMovement(deltaTime, input) {
        // Get movement direction from input
        let dx = 0;
        let dy = 0;

        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) dy -= 1;
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) dy += 1;
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) dx -= 1;
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) dx += 1;

        // Normalize diagonal movement
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx /= length;
            dy /= length;
        }

        // Calculate speed
        let speed = GAME.PLAYER_SPEED;
        if (this.isBoosting) {
            speed *= GAME.BOOST_MULTIPLIER;
        }

        // Apply movement
        this.vx = dx * speed;
        this.vy = dy * speed;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }

    updateRemoteInterpolation(deltaTime) {
        // Smoothly interpolate to target position
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        this.x += dx * this.interpolationSpeed * deltaTime;
        this.y += dy * this.interpolationSpeed * deltaTime;
    }

    clampToArena(arenaRadius, centerX, centerY) {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = arenaRadius - GAME.PLAYER_RADIUS;

        if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            this.x = centerX + Math.cos(angle) * maxDistance;
            this.y = centerY + Math.sin(angle) * maxDistance;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // BOOST
    // ─────────────────────────────────────────────────────────────────────────────
    tryBoost() {
        if (!this.isIt) return false;
        if (this.energy < GAME.BOOST_COST) return false;
        if (this.isBoosting) return false;

        this.energy -= GAME.BOOST_COST;
        this.isBoosting = true;
        this.boostEndTime = performance.now() + GAME.BOOST_DURATION * 1000;

        return true;
    }

    updateBoost(deltaTime) {
        if (this.isBoosting && performance.now() >= this.boostEndTime) {
            this.isBoosting = false;
        }
    }

    updateEnergy(deltaTime) {
        if (!this.isBoosting && this.energy < GAME.MAX_ENERGY) {
            this.energy = Math.min(GAME.MAX_ENERGY, this.energy + GAME.ENERGY_REGEN * deltaTime);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TRAIL
    // ─────────────────────────────────────────────────────────────────────────────
    updateTrail() {
        const now = performance.now();
        if (now - this.lastTrailTime > 60) { // Every 60ms - adjusted for messy look
            this.trail.unshift({ x: this.x, y: this.y, seed: Math.random() * 100 });
            if (this.trail.length > TRAIL.LENGTH) {
                this.trail.pop();
            }
            this.lastTrailTime = now;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TAGGING
    // ─────────────────────────────────────────────────────────────────────────────
    canBeTagged() {
        return performance.now() - this.lastTagTime > GAME.TAG_COOLDOWN;
    }

    becomeIt() {
        this.isIt = true;
        this.lastTagTime = performance.now();
        this.trail = [];
    }

    stopBeingIt() {
        this.isIt = false;
        this.trail = [];
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // COLLISION
    // ─────────────────────────────────────────────────────────────────────────────
    collidesWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Slightly forgiving collision for hand drawn feel
        return distance < GAME.PLAYER_RADIUS * 2 * 0.9;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────────
    render(ctx, dimmed = false) {
        const alpha = dimmed ? 0.5 : 1;
        const time = performance.now() / 1000;

        ctx.save();
        ctx.globalAlpha = alpha;

        // 1. Draw Trail (IT only) - Messy red crumbs
        if (this.isIt && this.trail.length > 0) {
            this.trail.forEach((pos, i) => {
                const trailAlpha = (1 - (i + 1) / (TRAIL.LENGTH + 1)) * TRAIL.OPACITY_DECAY * alpha;

                // Draw small messy dots
                drawWobblyCircle(
                    ctx,
                    pos.x,
                    pos.y,
                    GAME.PLAYER_RADIUS * 0.6,
                    this.hexToRgba(COLORS.DANGER, trailAlpha),
                    0, // 0 width = fill
                    time + i, // Offset time
                    true // Fill
                );
            });
        }

        // 2. Draw Player Body
        if (this.isIt) {
            // IT PLAYER: Red Crayon Scribble
            drawScribble(ctx, this.x, this.y, GAME.PLAYER_RADIUS, COLORS.DANGER, time);

            // Heavy outline
            drawWobblyCircle(
                ctx,
                this.x,
                this.y,
                GAME.PLAYER_RADIUS,
                COLORS.DANGER,
                3,
                time
            );
        } else {
            // SAFE PLAYER: Blue Ballpoint
            // Just an outline, maybe 2 loops
            drawWobblyCircle(
                ctx,
                this.x,
                this.y,
                GAME.PLAYER_RADIUS,
                COLORS.SAFE,
                2,
                time
            );

            // Maybe a smiley face or simple mark inside?
            // Simple center dot
            ctx.beginPath();
            ctx.fillStyle = COLORS.SAFE;
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Draw Boost Bar (IT only)
        if (this.isIt) {
            this.renderBoostBar(ctx, alpha, time);
        }

        // 4. Draw Name label
        // Use 'Permanent Marker' or 'Gochi Hand' style font
        drawWobblyText(
            ctx,
            this.name,
            this.x,
            this.y - GAME.PLAYER_RADIUS - 15,
            '16px "Gochi Hand"', // Ensure this font matches CSS import
            COLORS.TEXT,
            time
        );

        ctx.restore();
    }

    renderBoostBar(ctx, alpha, time) {
        const barY = this.y + GAME.PLAYER_RADIUS + 12;
        const barWidth = 40;
        const barHeight = 6;
        const energyPercent = this.energy / GAME.MAX_ENERGY;

        // Background (Pencil outline)
        ctx.strokeStyle = this.hexToRgba(COLORS.UI_BORDER, alpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Rough rectangle
        ctx.rect(this.x - barWidth / 2, barY, barWidth, barHeight);
        ctx.stroke();

        // Fill (Highlighter Yellow)
        if (energyPercent > 0) {
            ctx.fillStyle = this.hexToRgba(COLORS.ACCENT, alpha * 0.8);
            // Messy fill
            const fillWidth = Math.max(0, barWidth * energyPercent - 2);
            if (fillWidth > 0) {
                ctx.fillRect(this.x - barWidth / 2 + 1, barY + 1, fillWidth, barHeight - 2);
            }
        }
    }

    hexToRgba(hex, alpha) {
        // Hex to RGBA helper
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SERIALIZATION
    // ─────────────────────────────────────────────────────────────────────────────
    toNetworkState() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            isIt: this.isIt,
            timeAsIt: this.timeAsIt,
            isBoosting: this.isBoosting
        };
    }

    applyNetworkState(state) {
        this.targetX = state.x;
        this.targetY = state.y;
        this.isIt = state.isIt;
        this.timeAsIt = state.timeAsIt;
        this.isBoosting = state.isBoosting;
    }
}

export default Player;
