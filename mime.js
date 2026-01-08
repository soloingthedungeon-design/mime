// MIME - 2D Side-Scrolling Prototype with Floppy Arms
// Physics-based arm simulation with chaotic flailing

class ArmSegment {
    constructor(length, angle = 0) {
        this.length = length;
        this.angle = angle; // Current angle in radians
        this.angularVelocity = 0; // Rate of rotation
        this.damping = 0.98; // Velocity damping factor
        this.gravity = 0.3; // Downward pull strength
    }

    update() {
        // Apply gravity pull toward hanging down (angle = PI/2 = 90 degrees)
        const targetAngle = Math.PI / 2; // Hanging down
        const angleDiff = targetAngle - this.angle;
        
        // Add gravity force proportional to distance from target
        this.angularVelocity += Math.sin(angleDiff) * this.gravity * 0.1;
        
        // Apply angular velocity
        this.angle += this.angularVelocity;
        
        // Apply damping to simulate air resistance
        this.angularVelocity *= this.damping;
        
        // Keep angle in reasonable range
        while (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
        while (this.angle < 0) this.angle += Math.PI * 2;
    }

    applyImpulse(impulse) {
        // Add angular velocity when button is tapped
        this.angularVelocity += impulse;
    }
}

class Arm {
    constructor(side, shoulderX, shoulderY) {
        this.side = side; // 'left' or 'right'
        this.shoulderX = shoulderX;
        this.shoulderY = shoulderY;
        
        // Create three segments: upper arm, forearm, hand
        this.segments = [
            new ArmSegment(30, Math.PI / 2), // Upper arm
            new ArmSegment(25, Math.PI / 2), // Forearm
            new ArmSegment(15, Math.PI / 2)  // Hand
        ];
    }

    update(shoulderX, shoulderY) {
        // Update shoulder position (reattach to body each frame)
        this.shoulderX = shoulderX;
        this.shoulderY = shoulderY;
        
        // Update each segment's physics
        this.segments.forEach(segment => segment.update());
    }

    flail() {
        // Apply impulse to all segments with some randomness for chaos
        const baseImpulse = (this.side === 'left' ? -0.5 : 0.5);
        this.segments.forEach((segment, i) => {
            const randomness = (Math.random() - 0.5) * 0.3;
            const impulse = baseImpulse * (1 + i * 0.2) + randomness;
            segment.applyImpulse(impulse);
        });
    }

    getEndPoints() {
        // Calculate positions of each segment endpoint
        const points = [{ x: this.shoulderX, y: this.shoulderY }];
        let currentX = this.shoulderX;
        let currentY = this.shoulderY;
        
        this.segments.forEach(segment => {
            currentX += Math.cos(segment.angle) * segment.length;
            currentY += Math.sin(segment.angle) * segment.length;
            points.push({ x: currentX, y: currentY });
        });
        
        return points;
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 4;
        this.jumpPower = 12;
        this.gravity = 0.5;
        this.isOnGround = false;
        
        // Create arms attached to shoulders
        this.leftArm = new Arm('left', this.x - 15, this.y + 10);
        this.rightArm = new Arm('right', this.x + 15, this.y + 10);
    }

    update(keys, groundY) {
        // Horizontal movement
        this.velocityX = 0;
        if (keys.left) this.velocityX = -this.speed;
        if (keys.right) this.velocityX = this.speed;
        
        this.x += this.velocityX;
        
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        // Ground collision
        const feetY = this.y + this.height / 2;
        if (feetY >= groundY) {
            this.y = groundY - this.height / 2;
            this.velocityY = 0;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }
        
        // Jump
        if (keys.jump && this.isOnGround) {
            this.velocityY = -this.jumpPower;
            this.isOnGround = false;
        }
        
        // Keep player on screen
        this.x = Math.max(this.width / 2, Math.min(800 - this.width / 2, this.x));
        
        // Update arms - reattach to shoulders each frame
        const leftShoulderX = this.x - 15;
        const leftShoulderY = this.y - 10;
        const rightShoulderX = this.x + 15;
        const rightShoulderY = this.y - 10;
        
        this.leftArm.update(leftShoulderX, leftShoulderY);
        this.rightArm.update(rightShoulderX, rightShoulderY);
        
        // Flail arms
        if (keys.flailLeft) {
            this.leftArm.flail();
            keys.flailLeft = false; // Only apply impulse once per tap
        }
        if (keys.flailRight) {
            this.rightArm.flail();
            keys.flailRight = false; // Only apply impulse once per tap
        }
    }

    draw(ctx) {
        // Draw arms behind body
        this.drawArm(ctx, this.leftArm);
        this.drawArm(ctx, this.rightArm);
        
        // Draw body (simple rectangle for now)
        ctx.fillStyle = '#e94560';
        ctx.fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
        
        // Draw head
        ctx.fillStyle = '#f4a261';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height / 2 - 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - this.height / 2 - 17, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - this.height / 2 - 17, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawArm(ctx, arm) {
        const points = arm.getEndPoints();
        
        // Draw segments
        for (let i = 0; i < arm.segments.length; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            // Different colors for different segments
            const colors = ['#0f3460', '#16213e', '#1a1a2e'];
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 8 - i * 2;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
        
        // Draw hand at end
        const handPos = points[points.length - 1];
        ctx.fillStyle = '#f4a261';
        ctx.beginPath();
        ctx.arc(handPos.x, handPos.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.groundY = 550;
        
        this.player = new Player(400, 300);
        
        this.keys = {
            left: false,
            right: false,
            jump: false,
            flailLeft: false,
            flailRight: false
        };
        
        this.setupInput();
        this.gameLoop();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.keys.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = true;
                    break;
                case ' ':
                case 'w':
                case 'arrowup':
                    this.keys.jump = true;
                    e.preventDefault(); // Prevent page scroll
                    break;
                case 'q':
                    this.keys.flailLeft = true;
                    break;
                case 'e':
                    this.keys.flailRight = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = false;
                    break;
                case ' ':
                case 'w':
                case 'arrowup':
                    this.keys.jump = false;
                    break;
            }
        });
    }

    update() {
        this.player.update(this.keys, this.groundY);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#0f3460';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Draw player with arms
        this.player.draw(this.ctx);
        
        // Draw status text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press Q/E to flail arms!', 10, 25);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});
