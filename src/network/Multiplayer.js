// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - MULTIPLAYER HANDLER
// Supabase Realtime channel management and event handling
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from './Supabase.js';
import { CHANNEL_NAME } from '../constants.js';

export class Multiplayer {
    constructor() {
        this.channel = null;
        this.localPlayerId = null;
        this.localPlayerName = null;
        this.localSpriteDataUrl = null;
        this.isHost = false;

        // Callbacks
        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        this.onPlayerMove = null;
        this.onTag = null;
        this.onBoost = null;
        this.onGameStart = null;
        this.onSync = null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CONNECTION
    // ─────────────────────────────────────────────────────────────────────────────
    async join(playerName, spriteDataUrl = null) {
        this.localPlayerId = crypto.randomUUID();
        this.localPlayerName = playerName;
        this.localSpriteDataUrl = spriteDataUrl;

        // Create Realtime channel
        this.channel = supabase.channel(CHANNEL_NAME, {
            config: {
                presence: {
                    key: this.localPlayerId
                }
            }
        });

        // Set up presence handlers
        this.channel
            .on('presence', { event: 'sync' }, () => {
                this.handlePresenceSync();
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                this.handlePresenceJoin(key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                this.handlePresenceLeave(key, leftPresences);
            });

        // Set up broadcast handlers
        this.channel
            .on('broadcast', { event: 'move' }, ({ payload }) => {
                this.handleMove(payload);
            })
            .on('broadcast', { event: 'tag' }, ({ payload }) => {
                this.handleTagEvent(payload);
            })
            .on('broadcast', { event: 'boost' }, ({ payload }) => {
                this.handleBoostEvent(payload);
            })
            .on('broadcast', { event: 'game_start' }, ({ payload }) => {
                this.handleGameStartEvent(payload);
            })
            .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
                this.handleSyncState(payload);
            });

        // Subscribe to channel
        await this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Track presence with sprite data
                await this.channel.track({
                    id: this.localPlayerId,
                    name: playerName,
                    x: 400,
                    y: 300,
                    sprite: spriteDataUrl, // Send sprite with presence
                    joinedAt: Date.now()
                });
            }
        });

        return this.localPlayerId;
    }

    async leave() {
        if (this.channel) {
            await this.channel.untrack();
            await supabase.removeChannel(this.channel);
            this.channel = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PRESENCE HANDLERS
    // ─────────────────────────────────────────────────────────────────────────────
    handlePresenceSync() {
        if (!this.channel) return;

        const state = this.channel.presenceState();
        const players = [];

        Object.entries(state).forEach(([key, presences]) => {
            if (presences && presences.length > 0) {
                const presence = presences[0];
                players.push({
                    id: presence.id,
                    name: presence.name,
                    x: presence.x || 400,
                    y: presence.y || 300,
                    sprite: presence.sprite || null
                });
            }
        });

        // Determine if we're the host (first player by joinedAt)
        const sortedPlayers = players.sort((a, b) => {
            const aJoined = state[a.id]?.[0]?.joinedAt || 0;
            const bJoined = state[b.id]?.[0]?.joinedAt || 0;
            return aJoined - bJoined;
        });

        if (sortedPlayers.length > 0) {
            this.isHost = sortedPlayers[0].id === this.localPlayerId;
        }

        // Notify about all players (including sprite)
        players.forEach(player => {
            if (player.id !== this.localPlayerId && this.onPlayerJoin) {
                this.onPlayerJoin(player.id, player.name, player.x, player.y, player.sprite);
            }
        });
    }

    handlePresenceJoin(key, newPresences) {
        if (!newPresences || newPresences.length === 0) return;

        const presence = newPresences[0];
        if (presence.id === this.localPlayerId) return;

        if (this.onPlayerJoin) {
            this.onPlayerJoin(
                presence.id,
                presence.name,
                presence.x || 400,
                presence.y || 300,
                presence.sprite || null
            );
        }
    }

    handlePresenceLeave(key, leftPresences) {
        if (!leftPresences || leftPresences.length === 0) return;

        const presence = leftPresences[0];
        if (this.onPlayerLeave) {
            this.onPlayerLeave(presence.id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // BROADCAST HANDLERS
    // ─────────────────────────────────────────────────────────────────────────────
    handleMove(payload) {
        if (payload.playerId === this.localPlayerId) return;

        if (this.onPlayerMove) {
            this.onPlayerMove(
                payload.playerId,
                payload.x,
                payload.y,
                payload.isBoosting
            );
        }
    }

    handleTagEvent(payload) {
        if (this.onTag) {
            this.onTag(payload.newItId);
        }
    }

    handleBoostEvent(payload) {
        if (payload.playerId === this.localPlayerId) return;

        if (this.onBoost) {
            this.onBoost(payload.playerId);
        }
    }

    handleGameStartEvent(payload) {
        if (this.onGameStart) {
            this.onGameStart(payload.itPlayerId);
        }
    }

    handleSyncState(payload) {
        if (this.onSync) {
            this.onSync(payload);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SEND EVENTS
    // ─────────────────────────────────────────────────────────────────────────────
    sendMove(x, y, isBoosting) {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'move',
            payload: {
                playerId: this.localPlayerId,
                x,
                y,
                isBoosting
            }
        });
    }

    sendTag(newItId) {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'tag',
            payload: {
                taggerId: this.localPlayerId,
                newItId
            }
        });
    }

    sendBoost() {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'boost',
            payload: {
                playerId: this.localPlayerId
            }
        });
    }

    sendGameStart(itPlayerId) {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'game_start',
            payload: {
                itPlayerId
            }
        });
    }

    sendSyncState(gameState) {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'sync_state',
            payload: gameState
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GETTERS
    // ─────────────────────────────────────────────────────────────────────────────
    getLocalPlayerId() {
        return this.localPlayerId;
    }

    getLocalPlayerName() {
        return this.localPlayerName;
    }

    getIsHost() {
        return this.isHost;
    }

    getPlayerCount() {
        if (!this.channel) return 0;
        const state = this.channel.presenceState();
        return Object.keys(state).length;
    }
}

export default Multiplayer;
