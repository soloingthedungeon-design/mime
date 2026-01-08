# MIME - Floppy Arms Prototype

A 2D side-scrolling game prototype featuring a character with physics-based floppy puppet arms.

## Features

- **Side-scrolling movement**: Move left/right with A/D or arrow keys
- **Jumping**: Jump with SPACE, W, or up arrow
- **Floppy puppet arms**: Each arm has three segments (upper arm, forearm, hand)
- **Physics-based arm simulation**: Arms use fake physics with:
  - Angular velocity and acceleration
  - Damping for realistic slowdown
  - Gravity pulling arms downward
  - Chaotic pendulum-like movement
- **Impulse-based control**: Press Q/E to apply impulses that make arms flail
- **Dynamic attachment**: Arms reattach to shoulder anchors each frame

## How to Play

1. Open `index.html` in a web browser, or run a local server:
   ```bash
   python3 -m http.server 8000
   ```
   Then navigate to `http://localhost:8000`

2. **Controls**:
   - **A** or **←** - Move left
   - **D** or **→** - Move right
   - **SPACE**, **W**, or **↑** - Jump
   - **Q** - Flail left arm
   - **E** - Flail right arm

3. Experiment with flailing arms while jumping for maximum chaos!

## Technical Details

The game uses HTML5 Canvas and vanilla JavaScript. The arm physics system simulates:
- Each arm segment has an angle and angular velocity
- Gravity applies a constant downward force (toward 90 degrees)
- Damping gradually reduces angular velocity
- Button taps add angular velocity impulses with randomness for unpredictable motion
- Arms are reattached to shoulder positions each frame to follow the player body

## Files

- `index.html` - Main game page with canvas and controls
- `mime.js` - Complete game logic including physics simulation
