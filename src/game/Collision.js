// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - COLLISION DETECTION
// Utility functions for collision detection
// ═══════════════════════════════════════════════════════════════════════════════

import { GAME } from '../constants.js';

/**
 * Check if two players are colliding (circle-to-circle)
 */
export function playersCollide(player1, player2) {
    const dx = player1.x - player2.x;
    const dy = player1.y - player2.y;
    const distanceSquared = dx * dx + dy * dy;
    const minDistance = GAME.PLAYER_RADIUS * 2;
    return distanceSquared < minDistance * minDistance;
}

/**
 * Check if a player is outside the arena boundary
 */
export function isOutsideArena(player, arenaRadius, centerX, centerY) {
    const dx = player.x - centerX;
    const dy = player.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance > arenaRadius - GAME.PLAYER_RADIUS;
}

/**
 * Get the distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a player's position to stay within the arena
 */
export function clampToArena(player, arenaRadius, centerX, centerY) {
    const dx = player.x - centerX;
    const dy = player.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = arenaRadius - GAME.PLAYER_RADIUS;

    if (dist > maxDist) {
        const angle = Math.atan2(dy, dx);
        return {
            x: centerX + Math.cos(angle) * maxDist,
            y: centerY + Math.sin(angle) * maxDist
        };
    }

    return { x: player.x, y: player.y };
}

/**
 * Get collision point between two players (for effects)
 */
export function getCollisionPoint(player1, player2) {
    return {
        x: (player1.x + player2.x) / 2,
        y: (player1.y + player2.y) / 2
    };
}

export default {
    playersCollide,
    isOutsideArena,
    distance,
    clampToArena,
    getCollisionPoint
};
