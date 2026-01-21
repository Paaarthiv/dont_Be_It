// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - WOBBLE SYSTEM
// Global "hand-drawn jitter" system - use everywhere for consistent notebook feel
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WOBBLE CONFIG
 * Single source of truth for all jitter parameters
 */
export const WOBBLE_CONFIG = {
    // Rotation (radians)
    ROTATION_MAX: 0.05,      // ±2.8 degrees
    ROTATION_SPEED: 3,       // Animation speed

    // Scale variance
    SCALE_MIN: 0.98,
    SCALE_MAX: 1.02,
    SCALE_SPEED: 2,

    // Position jitter (pixels)
    POSITION_MAX: 2,
    POSITION_SPEED: 4,

    // Line drawing
    LINE_JITTER: 3,          // Max offset for line points
    SEGMENT_LENGTH: 15       // Distance between wobble points
};

/**
 * Pseudo-random noise function based on seed and time
 * Returns value between -1 and 1
 */
export function noise(seed, time) {
    const x = Math.sin(seed * 12.9898 + time * 0.01) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Get wobble transform values for a given element/time
 * @param {number} seed - Unique ID for this element
 * @param {number} time - Current time (performance.now() / 1000)
 * @returns {Object} - { rotation, scaleX, scaleY, offsetX, offsetY }
 */
export function getWobble(seed, time) {
    const cfg = WOBBLE_CONFIG;

    return {
        rotation: noise(seed, time * cfg.ROTATION_SPEED) * cfg.ROTATION_MAX,
        scaleX: cfg.SCALE_MIN + (noise(seed + 100, time * cfg.SCALE_SPEED) + 1) / 2 * (cfg.SCALE_MAX - cfg.SCALE_MIN),
        scaleY: cfg.SCALE_MIN + (noise(seed + 200, time * cfg.SCALE_SPEED) + 1) / 2 * (cfg.SCALE_MAX - cfg.SCALE_MIN),
        offsetX: noise(seed + 300, time * cfg.POSITION_SPEED) * cfg.POSITION_MAX,
        offsetY: noise(seed + 400, time * cfg.POSITION_SPEED) * cfg.POSITION_MAX
    };
}

/**
 * Apply wobble transform to canvas context
 * MUST call ctx.save() before and ctx.restore() after
 */
export function applyWobbleToCanvas(ctx, x, y, seed, time) {
    const w = getWobble(seed, time);

    ctx.translate(x + w.offsetX, y + w.offsetY);
    ctx.rotate(w.rotation);
    ctx.scale(w.scaleX, w.scaleY);
    ctx.translate(-x, -y);
}

/**
 * Get CSS transform string for wobble
 * @param {number} seed - Unique ID
 * @param {number} time - Current time
 * @returns {string} - CSS transform value
 */
export function getWobbleCSS(seed, time) {
    const w = getWobble(seed, time);
    return `translate(${w.offsetX}px, ${w.offsetY}px) rotate(${w.rotation}rad) scale(${w.scaleX}, ${w.scaleY})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAWING HELPERS (use wobble internally)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draws a wobbly circle (like a hand-drawn loop)
 */
export function drawWobblyCircle(ctx, x, y, radius, color, lineWidth, time, fill = false) {
    const cfg = WOBBLE_CONFIG;
    const points = Math.max(8, Math.floor(2 * Math.PI * radius / cfg.SEGMENT_LENGTH));
    const angleStep = (Math.PI * 2) / points;

    ctx.beginPath();

    // Draw 2 loops for messy look if stroking, 1 if filling
    const loops = fill ? 1 : 2;

    for (let loop = 0; loop < loops; loop++) {
        for (let i = 0; i <= points; i++) {
            const angle = i * angleStep;

            // Noise based on angle, time, and loop index
            const offset = noise(i + loop * 100, time) * cfg.LINE_JITTER;
            const r = radius + offset;

            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
    }

    ctx.closePath();

    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    }

    if (!fill || lineWidth > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
}

/**
 * Draws a "scribble" fill (dense chaotic lines)
 */
export function drawScribble(ctx, x, y, radius, color, time) {
    const lines = 10;
    ctx.beginPath();
    ctx.moveTo(x - radius, y - radius);

    for (let i = 0; i < lines; i++) {
        const x1 = x - radius + Math.random() * radius * 2;
        const y1 = y - radius + Math.random() * radius * 2;
        const x2 = x - radius + Math.random() * radius * 2;
        const y2 = y - radius + Math.random() * radius * 2;

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Outline
    drawWobblyCircle(ctx, x, y, radius, color, 3, time);
}

/**
 * Draws text with wobble applied
 */
export function drawWobblyText(ctx, text, x, y, font, color, time) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';

    const w = getWobble(text.length, time);

    ctx.save();
    ctx.translate(x + w.offsetX, y + w.offsetY);
    ctx.rotate(w.rotation);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

/**
 * Draw a wobbly rectangle
 */
export function drawWobblyRect(ctx, x, y, width, height, color, lineWidth, time) {
    const cfg = WOBBLE_CONFIG;
    const j = (seed) => noise(seed, time) * cfg.LINE_JITTER * 0.5;

    ctx.beginPath();
    ctx.moveTo(x + j(1), y + j(2));
    ctx.lineTo(x + width + j(3), y + j(4));
    ctx.lineTo(x + width + j(5), y + height + j(6));
    ctx.lineTo(x + j(7), y + height + j(8));
    ctx.closePath();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}
