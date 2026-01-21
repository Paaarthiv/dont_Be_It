// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - ARENA
// Handles arena rendering, grid, boundary, and shrinking logic
// ═══════════════════════════════════════════════════════════════════════════════

import { COLORS, GAME, GRID, ANIMATIONS } from '../constants.js';
import { drawWobblyCircle } from './renderUtils.js';

export class Arena {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.centerX = width / 2;
        this.centerY = height / 2;

        // Arena radius (shrinks over time)
        this.radius = GAME.ARENA_INITIAL_RADIUS;
        this.targetRadius = GAME.ARENA_INITIAL_RADIUS;

        // Shrink state
        this.isShrinking = false;
        this.phase = 'normal'; // 'normal' | 'closing' | 'critical'

        // Pulse animation
        this.pulseTime = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────────────────────────
    update(deltaTime, timeRemaining, totalTime) {
        // Update shrink progress based on time remaining
        const progress = 1 - (timeRemaining / totalTime);
        this.targetRadius = GAME.ARENA_INITIAL_RADIUS -
            (GAME.ARENA_INITIAL_RADIUS - GAME.ARENA_MIN_RADIUS) * progress;

        // Smooth shrink
        this.radius += (this.targetRadius - this.radius) * deltaTime * 2;

        // Determine phase
        if (timeRemaining <= GAME.CRITICAL_TIME) {
            this.phase = 'critical';
        } else if (this.radius < GAME.ARENA_INITIAL_RADIUS * 0.7) {
            this.phase = 'closing';
        } else {
            this.phase = 'normal';
        }

        // Update pulse
        this.pulseTime += deltaTime / 1000; // Convert to seconds for simplified noise
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────────
    render(ctx, dimmed = false) {
        const alpha = dimmed ? 0.5 : 1;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Render background
        this.renderBackground(ctx);

        // Render grid
        this.renderGrid(ctx);

        // Render boundary
        this.renderBoundary(ctx);

        ctx.restore();
    }

    renderBackground(ctx) {
        // Just clear/fill with paper color
        ctx.fillStyle = COLORS.BG;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    renderGrid(ctx) {
        ctx.strokeStyle = COLORS.GRID;
        ctx.lineWidth = 1;
        ctx.globalAlpha = GRID.OPACITY;

        // Vertical lines (Rule lines)
        for (let x = 0; x <= this.width; x += GRID.SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y += GRID.SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }

    renderBoundary(ctx) {
        let boundaryColor = COLORS.BOUNDARY;
        let lineWidth = 3;

        // Intensify wobble/color based on phase
        if (this.phase === 'critical') {
            boundaryColor = COLORS.DANGER;
            lineWidth = 5;
        }

        // Use the new hand-drawn circle util
        // We pass 'pulseTime' as the time factor for the noise
        drawWobblyCircle(
            ctx,
            this.centerX,
            this.centerY,
            this.radius,
            boundaryColor,
            lineWidth,
            this.pulseTime
        );

        // If in closing/critical phase, maybe draw a second faint red circle indicating danger zone?
        if (this.phase !== 'normal') {
            drawWobblyCircle(
                ctx,
                this.centerX,
                this.centerY,
                this.radius + 5,
                COLORS.DANGER,
                1,
                this.pulseTime + 10 // Offset time for different wobble
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GETTERS
    // ─────────────────────────────────────────────────────────────────────────────
    getRadius() {
        return this.radius;
    }

    getCenter() {
        return { x: this.centerX, y: this.centerY };
    }
}

export default Arena;
