1. Overview

This is a real-time multiplayer casual web game where players join with a name, one player is “It”, and the player who spends the most time as “It” loses. The game uses Supabase as the backend server (Realtime + Database) and a lightweight frontend game engine.

No traditional Node.js backend server is required. Supabase acts as the authoritative multiplayer backend.

2. Architecture
Browser Game Client
        ↓
Supabase Realtime (multiplayer sync)
Supabase PostgreSQL (name uniqueness, optional stats)


Supabase = Server
Frontend = Game Engine + UI

3. Frontend Stack
Component	Technology
Game Rendering	HTML5 Canvas or Phaser.js
Language	JavaScript (ES6+)
Bundler / Dev Server	Vite
Networking	Supabase JS SDK
Multiplayer Sync	Supabase Realtime Channels
State Management	Local JS game state
Hosting	Vercel / Netlify / Cloudflare Pages

Recommended:

Use Phaser.js if you want faster development for movement, collision, and sprites.

Use Canvas + Vanilla JS if you want full control and minimal abstraction.

4. Backend Stack (Supabase)
Feature	Supabase Service
Realtime Multiplayer	Supabase Realtime Channels
Player Registration	PostgreSQL
Name Uniqueness	PostgreSQL Unique Constraint
Security	Row Level Security (RLS)
Optional Server Logic	Supabase Edge Functions

Supabase replaces:

Node.js

WebSocket servers

Session memory servers

5. Database Schema (Minimal)
players table
id uuid primary key default gen_random_uuid(),
name text unique,
room text,
joined_at timestamp default now()


Purpose:

Enforces unique player names

Allows safe multiplayer sessions

Cleans up when players leave

Optional future tables:

stats (rounds played, losses)

matches (game history)

6. Realtime Events

Supabase Channel:

game-room-1


Event Types:

Event	Purpose
join	Player joins game
move	Position update
tag	Transfer “It” status
boost	Activate speed boost
leave	Player disconnects
sync	Periodic state correction

Do NOT send updates every frame.
Send at most 10–15 updates per second.

7. Core Game State Model
{
  itPlayerId,
  players: {
    id: {
      x,
      y,
      timeAsIt,
      energy,
      isBoosting
    }
  },
  arenaRadius,
  roundTimeLeft
}

8. Speed Boost System (Energy Based)

Constants:

MAX_ENERGY = 100
BOOST_COST = 25
BOOST_DURATION = 0.4s
BOOST_MULTIPLIER = 2x
ENERGY_REGEN = 10/sec


Rules:

Only “It” can boost

Boost consumes energy

Energy regenerates over time

No infinite speed advantage

9. Security Rules

Keys:

Key	Usage
anon public key	Frontend only
service_role key	MCP / Admin only

Never expose:

service_role key in frontend

GitHub repos

Screenshots

10. MCP Environment

Required MCPs:

MCP	Purpose
Supabase MCP	Database + Realtime + Functions
Filesystem MCP	Code creation/editing
Shell MCP	Run npm, build, install
Git MCP	Version control
HTTP MCP	API + multiplayer testing

This gives Antigravity full backend + code control.

11. Hosting
Layer	Platform
Frontend	Vercel / Netlify
Backend	Supabase

Free tier is sufficient.

12. Final Stack Summary
Frontend:
- JavaScript
- HTML5 Canvas / Phaser.js
- Supabase JS SDK
- Vite

Backend:
- Supabase Realtime
- Supabase PostgreSQL
- Optional Edge Functions

Infrastructure:
- Supabase MCP
- Filesystem MCP
- Shell MCP
- Git MCP
- HTTP MCP