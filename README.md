# MIME - Flappy Arms Prototype

A simple 2D side-scroller prototype featuring a mime character with floppy puppet arms that flail around in funny ways.

## Features

- **Platformer Movement**: Move left/right and jump
- **Floppy Puppet Arms**: Each arm has 3 segments (upper arm, forearm, hand) with springy physics
- **Impulse-Based Controls**: Tap keys to make arms flail with random variation
- **Satisfying Physics**: Spring forces, damping, and angular velocity for natural motion

## How to Play

1. Open `index.html` in any modern web browser
2. Use the controls below to move and flail!

### Controls

- **A/D** - Move left/right
- **Space** or **W** - Jump
- **Q** - Left arm flap
- **E** - Right arm flap
- **R** - Both arms flap
- **F** - Brace (hold arms in place briefly)

## Technical Details

- Pure HTML5 Canvas and JavaScript (no dependencies)
- Delta time-based physics for consistent motion
- Spring physics simulation for arm segments
- Camera follows player on X axis
- Parallax background effect

## Development

This is a core prototype focusing on movement feel and satisfying flappy arm physics. No NPCs, no scoring, no objectives - just movement and fun arm flailing!

Built as requested in the problem statement with:
- MimeBody platformer character
- 6 arm segments total (3 per arm)
- Impulse-based tap controls
- Stable puppet arm physics
- Visual polish with proper draw ordering
