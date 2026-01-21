// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - CONSTANTS
// Strict semantic color palette and game configuration
// ═══════════════════════════════════════════════════════════════════════════════

// Color Palette (Notebook Edition - Ink/Crayon/Highlighter)
export const COLORS = {
    BG: '#F4F1EA',        // Paper: Off-white
    GRID: 'rgba(50, 50, 50, 0.1)', // Rule lines: Faint pencil
    SAFE: '#0044CC',      // Safe: Blue Ballpoint Pen
    DANGER: '#D92B2B',    // IT: Red Crayon
    ACCENT: '#FFF000',    // Boost/Alerts: Yellow Highlighter
    BOUNDARY: '#333333',  // Arena: Black Sharpie
    TEXT: '#111111',      // Text: Ink Black
    UI_BORDER: '#666666'  // UI: Pencil Gray
};

// Wobble Configuration - Re-exported from unified wobble system
// Import WOBBLE_CONFIG from './utils/wobble.js' for the full config
export { WOBBLE_CONFIG as WOBBLE } from './utils/wobble.js';

// Game Configuration
export const GAME = {
    // Canvas
    WIDTH: 800,
    HEIGHT: 600,
    FPS: 60,

    // Player
    PLAYER_RADIUS: 25,        // Slightly larger for uneven strokes
    PLAYER_SPEED: 200,

    // Boost System (IT only)
    MAX_ENERGY: 100,
    BOOST_COST: 25,
    BOOST_DURATION: 0.4,
    BOOST_MULTIPLIER: 2,
    ENERGY_REGEN: 10,

    // Tag Mechanics
    TAG_COOLDOWN: 1000,

    // Arena
    ARENA_INITIAL_RADIUS: 350,
    ARENA_MIN_RADIUS: 100,
    ARENA_SHRINK_RATE: 10,

    // Round
    ROUND_DURATION: 90,
    CRITICAL_TIME: 10,

    // Network
    SYNC_RATE: 15,
    SYNC_INTERVAL: 1000 / 15,

    // Multiplayer
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 5
};

// Trail Configuration (for IT player - Eraser dust/crumbs)
export const TRAIL = {
    LENGTH: 8,
    OPACITY_DECAY: 0.15
};

// Animation Timings
export const ANIMATIONS = {
    TAG_FLASH_DURATION: 100,     // Comic impact frame
    TAG_ALERT_DURATION: 800,     // Longer for reading handwriting
    ARENA_PULSE_NORMAL: 1000,
    ARENA_PULSE_CRITICAL: 150    // Frantic shaking
};

// Grid Configuration
export const GRID = {
    SIZE: 30,    // Notebook rule height
    OPACITY: 0.2
};

// Realtime Channel
export const CHANNEL_NAME = 'game-room-1';
