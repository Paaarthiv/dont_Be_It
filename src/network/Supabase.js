// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - SUPABASE CLIENT
// Database and Realtime connection setup
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://mvlkwaxnmmqqvxkvrkmm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bGt3YXhubW1xcXZ4a3Zya21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODk4NzcsImV4cCI6MjA4NDU2NTg3N30.aoJtHzSQmAWwDb9yt68yDtRlAYpOODx1vVAgZf9Jn50';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: {
        params: {
            eventsPerSecond: 15
        }
    }
});

// Database helpers
export async function checkNameExists(name) {
    // TEMPORARY: Skip database check since table doesn't exist yet
    // Once you run supabase-setup.sql, you can restore the original logic
    try {
        const { data, error } = await supabase
            .from('players')
            .select('name')
            .eq('name', name)
            .maybeSingle();

        // If there's ANY error (including table not existing), allow the name
        if (error) {
            console.warn('Name check skipped (table may not exist):', error.message);
            return false; // Allow name
        }

        return !!data;
    } catch (e) {
        console.warn('Name check failed:', e);
        return false; // Allow name on any error
    }
}

export async function registerPlayer(name, room = 'main') {
    const { data, error } = await supabase
        .from('players')
        .insert([{ name, room }])
        .select()
        .single();

    if (error) {
        console.error('Error registering player:', error);
        return null;
    }

    return data;
}

export async function removePlayer(playerId) {
    const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

    if (error) {
        console.error('Error removing player:', error);
    }
}

export default supabase;
