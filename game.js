// MIME - Flappy Arms Prototype
// A 2D side-scroller with floppy puppet arms

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.8;
const GROUND_Y = 500;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;

// Input state
const keys = {};
let lastFlapTime = {
    left: 0,
    right: 0,
    both: 0
};
const FLAP_COOLDOWN = 0.08; // seconds

// Camera
let cameraX = 0;

// Player body
class MimeBody {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.isGrounded = false;
        this.moveSpeed = 5;
        this.jumpPower = -15;
    }

    update(dt) {
        // Horizontal movement
        if (keys['a'] || keys['A']) {
            this.vx = -this.moveSpeed;
            this.facing = -1;
        } else if (keys['d'] || keys['D']) {
            this.vx = this.moveSpeed;
            this.facing = 1;
        } else {
            this.vx = 0;
        }

        // Apply horizontal velocity
        this.x += this.vx;

        // Vertical movement (gravity and jumping)
        if (!this.isGrounded) {
            this.vy += GRAVITY;
        }

        // Jump
        if ((keys[' '] || keys['w'] || keys['W']) && this.isGrounded) {
            this.vy = this.jumpPower;
            this.isGrounded = false;
        }

        // Apply vertical velocity
        this.y += this.vy;

        // Ground collision
        if (this.y >= GROUND_Y - PLAYER_HEIGHT) {
            this.y = GROUND_Y - PLAYER_HEIGHT;
            this.vy = 0;
            this.isGrounded = true;
        }

        // Keep player in bounds (with some margin for world)
        if (this.x < 0) this.x = 0;
    }

    getLeftShoulderPos() {
        return {
            x: this.x + 10 * this.facing,
            y: this.y + 15
        };
    }

    getRightShoulderPos() {
        return {
            x: this.x + 20 * this.facing,
            y: this.y + 15
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(-cameraX, 0);
        
        // Draw simple body (rectangle)
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - PLAYER_WIDTH/2, this.y, PLAYER_WIDTH, PLAYER_HEIGHT);
        
        // Draw head
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes based on facing direction
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 4 * this.facing, this.y + 8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 4 * this.facing, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Arm segment
class ArmSegment {
    constructor(length, thickness) {
        this.length = length;
        this.thickness = thickness;
        this.angle = Math.PI / 2; // Start pointing down
        this.avel = 0; // Angular velocity
        this.x = 0;
        this.y = 0;
    }

    update(dt, targetAngle, springStrength, damping, isBracing) {
        // Apply spring force toward target angle
        const actualSpring = isBracing ? springStrength * 0.2 : springStrength;
        this.avel += (targetAngle - this.angle) * actualSpring * dt;
        
        // Apply damping
        const actualDamping = isBracing ? 0.85 : damping;
        this.avel *= actualDamping;
        
        // Update angle
        this.angle += this.avel;
        
        // Clamp angle to prevent infinite spinning
        const maxAngle = Math.PI * 0.75; // 135 degrees
        this.angle = Math.max(-maxAngle, Math.min(maxAngle, this.angle));
    }

    applyImpulse(impulse) {
        this.avel += impulse;
    }

    getEndpoint() {
        return {
            x: this.x + Math.cos(this.angle) * this.length,
            y: this.y + Math.sin(this.angle) * this.length
        };
    }

    draw(ctx, color = '#333') {
        ctx.save();
        ctx.translate(-cameraX, 0);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const end = this.getEndpoint();
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        // Draw joint
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Arm (collection of segments)
class Arm {
    constructor(side) { // side: 'left' or 'right'
        this.side = side;
        this.upperArm = new ArmSegment(30, 8);
        this.forearm = new ArmSegment(25, 6);
        this.hand = new ArmSegment(15, 5);
        
        // Physics parameters
        this.springStrength = 8;
        this.damping = 0.92;
    }

    update(dt, shoulderPos, facing, isBracing) {
        // Target angle is "down" (90 degrees / PI/2)
        const baseTargetAngle = Math.PI / 2;
        
        // Upper arm
        this.upperArm.x = shoulderPos.x;
        this.upperArm.y = shoulderPos.y;
        this.upperArm.update(dt, baseTargetAngle, this.springStrength, this.damping, isBracing);
        
        // Forearm (connected to upper arm end)
        const upperEnd = this.upperArm.getEndpoint();
        this.forearm.x = upperEnd.x;
        this.forearm.y = upperEnd.y;
        this.forearm.update(dt, baseTargetAngle, this.springStrength * 1.2, this.damping, isBracing);
        
        // Hand (connected to forearm end)
        const forearmEnd = this.forearm.getEndpoint();
        this.hand.x = forearmEnd.x;
        this.hand.y = forearmEnd.y;
        this.hand.update(dt, baseTargetAngle, this.springStrength * 1.3, this.damping, isBracing);
    }

    applyFlap(strength) {
        // Add random impulses to each segment
        // Forearm and hand get stronger impulses for floppy feel
        const randomFactor = () => 0.8 + Math.random() * 0.4;
        
        this.upperArm.applyImpulse(strength * 0.4 * randomFactor());
        this.forearm.applyImpulse(strength * 0.8 * randomFactor());
        this.hand.applyImpulse(strength * 1.2 * randomFactor());
    }

    draw(ctx, facing) {
        const color = this.side === 'left' ? '#555' : '#444';
        this.upperArm.draw(ctx, color);
        this.forearm.draw(ctx, color);
        this.hand.draw(ctx, color);
    }
}

// Game state
class Game {
    constructor() {
        this.player = new MimeBody(400, 100);
        this.leftArm = new Arm('left');
        this.rightArm = new Arm('right');
        this.braceTimer = 0;
        this.time = 0;
    }

    update(dt) {
        this.time += dt;
        
        // Update player
        this.player.update(dt);
        
        // Update camera to follow player
        const targetCameraX = this.player.x - canvas.width / 2;
        cameraX = targetCameraX;
        
        // Update brace timer
        if (this.braceTimer > 0) {
            this.braceTimer -= dt;
        }
        const isBracing = this.braceTimer > 0;
        
        // Handle arm flap inputs
        this.handleFlapInputs();
        
        // Update arms
        const leftShoulder = this.player.getLeftShoulderPos();
        const rightShoulder = this.player.getRightShoulderPos();
        
        this.leftArm.update(dt, leftShoulder, this.player.facing, isBracing);
        this.rightArm.update(dt, rightShoulder, this.player.facing, isBracing);
    }

    handleFlapInputs() {
        const now = this.time;
        
        // Q - Left arm flap
        if (keys['q'] || keys['Q']) {
            if (now - lastFlapTime.left > FLAP_COOLDOWN) {
                this.leftArm.applyFlap(-8 - Math.random() * 4);
                lastFlapTime.left = now;
            }
        }
        
        // E - Right arm flap
        if (keys['e'] || keys['E']) {
            if (now - lastFlapTime.right > FLAP_COOLDOWN) {
                this.rightArm.applyFlap(-8 - Math.random() * 4);
                lastFlapTime.right = now;
            }
        }
        
        // R - Both arms flap
        if (keys['r'] || keys['R']) {
            if (now - lastFlapTime.both > FLAP_COOLDOWN) {
                this.leftArm.applyFlap(-6 - Math.random() * 2);
                this.rightArm.applyFlap(-6 - Math.random() * 2);
                lastFlapTime.both = now;
            }
        }
        
        // F - Brace
        if (keys['f'] || keys['F']) {
            this.braceTimer = 0.25;
        }
    }

    draw() {
        // Clear canvas
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background clouds (simple)
        ctx.save();
        ctx.translate(-cameraX * 0.5, 0); // Parallax effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 5; i++) {
            const cloudX = i * 300 + 100;
            ctx.beginPath();
            ctx.arc(cloudX, 80 + i * 20, 30, 0, Math.PI * 2);
            ctx.arc(cloudX + 25, 80 + i * 20, 35, 0, Math.PI * 2);
            ctx.arc(cloudX + 50, 80 + i * 20, 30, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // Draw ground
        ctx.save();
        ctx.translate(-cameraX, 0);
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(-1000, GROUND_Y, 5000, canvas.height - GROUND_Y);
        
        // Draw grass on ground
        ctx.fillStyle = '#5a9c4a';
        ctx.fillRect(-1000, GROUND_Y, 5000, 10);
        ctx.restore();
        
        // Determine draw order based on facing
        if (this.player.facing > 0) {
            // Facing right: left arm behind, right arm in front
            this.leftArm.draw(ctx, this.player.facing);
            this.player.draw(ctx);
            this.rightArm.draw(ctx, this.player.facing);
        } else {
            // Facing left: right arm behind, left arm in front
            this.rightArm.draw(ctx, this.player.facing);
            this.player.draw(ctx);
            this.leftArm.draw(ctx, this.player.facing);
        }
    }
}

// Input handling
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game loop
const game = new Game();
let lastTime = performance.now();

function gameLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update and draw
    game.update(dt);
    game.draw();
    
    requestAnimationFrame(gameLoop);
}

// Start the game
requestAnimationFrame(gameLoop);
