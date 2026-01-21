# Tag Arena – Notebook Edition  
**Design Specification v2.0**  
Style: Hand-Drawn / Doodle / School Notebook  
Platform: Web (Desktop & Mobile)

---

## 1. Core Art Direction

**Theme:**  
The entire game takes place inside a bored student’s notebook.  
Everything must look like it was drawn using:
- Pens  
- Pencils  
- Crayons  
- Highlighters  
- Markers  
- Tape and paper scraps  

Nothing is digital.  
Nothing is perfect.  
Everything is slightly messy and alive.

Animation style is **“line boiling”**:
- Small jitter
- Slight rotation
- Slight scale changes
- No smooth tweens

---

## 2. Background & Paper World

| Element | Description |
|------|-----------|
Base Color | `#F4F1EA` (Off-white notebook paper) |
Texture | Crumpled paper / light grain |
Details | Pencil smudges, coffee stains, margin doodles |
Rule | Background never distracts from gameplay |

The paper is the arena.

---

## 3. Ink-Based Color Palette

All colors represent physical tools, not digital lighting.

| Role | Tool | Color | Visual Behavior |
|------|------|------|----------------|
Safe Players | Blue Ballpoint Pen | `#0044CC` | Thin, neat strokes |
IT Player | Angry Red Crayon | `#D92B2B` | Thick, messy scribbles |
Boost / Urgency | Yellow Highlighter | `#FFF000` | Semi-transparent marker bleed |
Arena Boundary | Black Sharpie | `#333333` | Thick, wobbly, uneven |
UI Containers | Pencil | `#666666` | Light sketch lines |
Text | Ink Black | `#111111` | Handwritten |

Never use flat fills.  
Always apply texture:
- Pencil grain
- Crayon wax
- Highlighter bleed

---

## 4. Typography

| Usage | Font | Feel |
|------|------|-----|
Titles / Timer / Alerts | Permanent Marker / Rock Salt | Bold felt-tip pen |
Player Names / Stats | Architects Daughter / Gochi Hand | Neat handwriting |

No modern UI fonts.  
Everything must look written by hand.

---

## 5. Player Design

### Safe Player
- Simple blue pen circle or stick figure
- Smiley face
- Clean linework
- No trail
- Calm, readable

### IT Player
- Filled with chaotic red crayon scribbles
- Angry face: `>_<`
- Surrounded by frantic black/red sketch cloud
- Trail:
  - Pencil dust
  - Eraser crumbs
  - Scribble particles

IT must look unstable and dangerous.

---

## 6. Arena Boundary

- Hand-drawn freehand circle
- Thick Sharpie strokes
- Uneven thickness
- Corners overlap

Shrinking behavior:
| Phase | Look |
|------|-----|
Normal | Single thick marker line |
Closing | Line gets darker, thicker, layered |
Critical | Multiple frantic overlapping strokes |

Danger is shown by messiness, not glow.

---

## 7. Boost Mechanic

Boost Bar:
- Pencil-drawn curved arc under IT player
- Filled with yellow highlighter texture

Using boost:
- Highlighter looks erased
- Smudge marks
- Uneven depletion
- Aggressive rubbing feel

---

## 8. UI as Physical Paper Objects

UI elements never float.  
They are **attached** to the paper.

| UI Element | Look |
|-----------|------|
Timer | Yellow sticky note, curled corner |
Loserboard | Torn scrap of notebook paper, taped |
Name Input | Scotch-taped rectangle |
Play Button | Ink stamp inside wobbly circle |
Results | Teacher grading stamp |

When someone is IT:
- Their name is circled wildly in red pen

Loser:
- Skull doodle or angry scribble

---

## 9. Screens

### 9.1 Landing Screen
- Looks like notebook cover
- Title in huge doodle letters
- Input = taped paper
- Play button = stamped
- Cursor = blinking pencil tip

---

### 9.2 Game HUD
- Timer on sticky note
- Loserboard on taped scrap
- No floating UI panels
- Everything slightly tilted

---

### 9.3 Tag Transition

When tag occurs:
- Comic speech bubble: **“POOF!”**, **“TAG!”**
- Thick marker outline
- Short pencil scribble screen overlay
- Like shaking an Etch A Sketch

No neon flashes.  
No glow.

---

### 9.4 Results Screen

Theme: Teacher grading paper.

Loser:
- Huge red **“F-”**
- Or **“SEE ME AFTER CLASS”**

Play Again:
- Crumpled paper ball
- Text: `RETRY?`

---

## 10. Wobble Rules (Mandatory)

All shapes must:
- Jitter slightly
- Never be perfectly straight
- Borders overshoot
- Corners overlap
- Small random rotation per frame

This is non-negotiable.

---

## 11. Particles & FX

Use:
- Scribbles
- Dots
- “x” marks
- Paper shreds
- Pencil dust

Never:
- Soft circles
- Glow
- Digital sparks

---

## 12. Performance Guidelines

- Use small PNG textures
- Pre-render crayon/pencil sprites
- Animate via transform + rotation
- Avoid heavy real-time filters

---

## 13. Emotional Goal

The game must feel like:

> “Someone was bored in class and accidentally made a chaotic multiplayer game in their notebook.”

It should be:
- Funny  
- Messy  
- Expressive  
- Unique  
- Instantly recognizable  

This is not a skin.  
This is a full artistic identity.
