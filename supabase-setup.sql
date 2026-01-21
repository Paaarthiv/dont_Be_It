-- ═══════════════════════════════════════════════════════════════════════════════
-- TAG ARENA - DATABASE SETUP
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create players table for name uniqueness tracking
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  room text DEFAULT 'main',
  joined_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (join game)
CREATE POLICY "Anyone can insert" ON players 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read (check name availability)
CREATE POLICY "Anyone can read" ON players 
  FOR SELECT 
  USING (true);

-- Allow users to delete their own entry (leave game)
CREATE POLICY "Anyone can delete" ON players 
  FOR DELETE 
  USING (true);

-- Index for faster name lookups
CREATE INDEX IF NOT EXISTS players_name_idx ON players(name);

-- Clean up old entries (optional - can run periodically)
-- DELETE FROM players WHERE joined_at < NOW() - INTERVAL '1 day';
