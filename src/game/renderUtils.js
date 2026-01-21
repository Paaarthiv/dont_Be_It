// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - RENDER UTILS
// Helper functions for "Notebook Edition" hand-drawn effects
// ═══════════════════════════════════════════════════════════════════════════════

import { WOBBLE } from '../constants.js';

/**
 * Generates a consistent pseudo-random offset based on seed and time.
 * @param {number} seed - Unique ID or index
 * @param {number} time - Current time
 * @returns {number} - Offset value (-0.5 to 0.5 range approx)
 */
function noise(seed, time) {
    return Math.sin(seed * 12.9898 + time * WOBBLE.SPEED * 0.01) * Math.sin(seed * 78.233 + time * WOBBLE.SPEED * 0.02);
}

/**
 * Draws a wobbly circle (like a hand-drawn loop).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} radius - Radius
 * @param {string} color - Stroke color
 * @param {number} lineWidth - Line width
 * @param {number} time - Current time (for animation)
 * @param {boolean} fill - Whether to fill the circle (default false)
 */
export function drawWobblyCircle(ctx, x, y, radius, color, lineWidth, time, fill = false) {
    const points = Math.max(8, Math.floor(2 * Math.PI * radius / WOBBLE.SEGMENT_LENGTH));
    const angleStep = (Math.PI * 2) / points;

    ctx.beginPath();

    // Draw 2 loops for messy look if stroking, 1 if filling
    const loops = fill ? 1 : 2;

    for (let loop = 0; loop < loops; loop++) {
        for (let i = 0; i <= points; i++) {
            const angle = i * angleStep;

            // Noise based on angle, time, and loop index
            const offset = noise(i + loop * 100, time) * WOBBLE.JITTER_AMOUNT;
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

    // Close path loosely
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
 * Draws a "scribble" mask or fill (dense chaotic lines).
 * Used for the IT player or filled areas.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} radius 
 * @param {string} color 
 * @param {number} time 
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
 * Draws text with a wobbly baseline.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} text 
 * @param {number} x 
 * @param {number} y 
 * @param {string} font 
 * @param {string} color 
 * @param {number} time 
 */
export function drawWobblyText(ctx, text, x, y, font, color, time) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';

    // Simple rotation/offset for the whole text block
    const rot = noise(10, time) * 0.1; // Small rotation
    const offY = noise(20, time) * 2;

    ctx.save();
    ctx.translate(x, y + offY);
    ctx.rotate(rot);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}
