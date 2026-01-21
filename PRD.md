Product Requirements Document (PRD)

Product Name: Tag Arena
Type: Real-time Multiplayer Casual Web Game

1. Objective

Build a fast, browser-based multiplayer game where players compete to avoid being “It”.
The player who spends the highest total time as “It” during a round is the loser.

The game must be:

Free to play

No login required

Join with a name

Real-time multiplayer

Simple, chaotic, replayable

2. Target Users

Casual players

Students / friends

2–10 players per room

Sessions of 1–3 minutes

3. Core Game Loop

Player opens website

Enters a name

Joins game room

One player is randomly chosen as “It”

Players move around the arena

“It” tries to tag another player

Tagged player becomes new “It”

Time spent as “It” is tracked

When timer ends:

Player with highest “It” time loses

Game resets → players can rejoin

4. Game Rules
4.1 Movement

Top-down 2D arena

Keyboard or joystick controls

Smooth movement

Collision detection

4.2 “It” Mechanics

Only one “It” at any time

“It” can tag players by touching them

Tag cooldown: 1 second (no instant re-tag spam)

4.3 Speed Boost (Energy Based)

Only “It” can boost.

Parameter	Value
Max Energy	100
Boost Cost	25
Boost Duration	0.4s
Boost Multiplier	2x
Energy Regen	10/sec

Rules:

Boost consumes energy

No boost if energy < cost

Energy regenerates slowly

Visual energy bar required

4.4 Arena Behavior

Arena shrinks slowly over time

Forces player interaction

Prevents hiding

4.5 Scoring

Each player tracks:

timeAsIt (seconds)


At round end:

Player with highest timeAsIt = Loser


Optional:

Show leaderboard after each round

5. Multiplayer Requirements
Feature	Requirement
Player Join	Unique name
Realtime Sync	≤ 100ms perceived latency
State Sync	10–15 updates/sec max
Rooms	Single room initially
Disconnect Handling	Remove player instantly
Server	Supabase Realtime
6. Game State Model
{
  itPlayerId,
  players: {
    id: {
      x,
      y,
      timeAsIt,
      energy,
      isBoosting,
      connected
    }
  },
  arenaRadius,
  roundTimeLeft
}

7. Realtime Events
Event	Description
join	Player joins
leave	Player leaves
move	Position update
tag	“It” transfer
boost	Speed boost activation
sync	State correction
8. Backend Requirements (Supabase)

Supabase Realtime Channels for multiplayer

PostgreSQL for:

Name uniqueness

Optional stats

No persistent session storage required

RLS enabled

9. Frontend Requirements

HTML5 Canvas or Phaser.js

Supabase JS SDK

Vite for dev

Smooth rendering loop (60fps)

Responsive UI

Mobile compatible (optional)

10. UI Requirements

Screens:

Name Entry Screen

Lobby (Waiting for players)

Game Screen

Result Screen

Must show:

Current “It”

Energy bar

Time left

Player scores (live)

Arena boundary

11. Performance Targets
Metric	Target
Latency	< 150ms
Frame rate	60 FPS
Concurrent players	10 per room
Supabase messages	< 20/sec per client
12. Security

anon key only in frontend

service_role only in MCP

DB unique constraint on player name

RLS enforced

13. Out of Scope (For Now)

Accounts / login

Payments

Chat system

Match history

Anti-cheat

Voice chat

14. MVP Definition

Version 1 is complete when:

Players can join with name

Multiplayer movement works

“It” tagging works

Energy boost works

Arena shrinks

Timer ends game

Loser is calculated correctly

Game resets cleanly

15. Success Criteria

Game is playable with 4+ players

No major lag

Clear winner/loser logic

Players replay without instructions