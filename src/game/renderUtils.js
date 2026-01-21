// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - RENDER UTILS
// Re-exports wobble system for backward compatibility
// ═══════════════════════════════════════════════════════════════════════════════

// Re-export everything from the unified wobble system
export {
    WOBBLE_CONFIG,
    noise,
    getWobble,
    applyWobbleToCanvas,
    getWobbleCSS,
    drawWobblyCircle,
    drawScribble,
    drawWobblyText,
    drawWobblyRect
} from '../utils/wobble.js';
