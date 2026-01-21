// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - DOODLE PAD
// "Draw Your Character" - Fast, playful scribble ritual
// ═══════════════════════════════════════════════════════════════════════════════

import { GAME, COLORS } from '../constants.js';
import { noise } from '../utils/wobble.js';

// Doodle Configuration
const DOODLE_CONFIG = {
    CANVAS_SIZE: 200,           // Drawing canvas size (display)
    OUTPUT_SIZE: 128,           // Final texture size
    DRAW_TIME: 6,               // Seconds to draw
    MAX_STROKES: 50,            // Maximum stroke count
    CIRCLE_RADIUS: 80,          // Drawing boundary radius

    // Tool configurations
    TOOLS: {
        pen: {
            name: 'Blue Pen',
            color: COLORS.SAFE,
            lineWidth: 4,
            opacity: 1
        },
        pencil: {
            name: 'Pencil',
            color: '#555555',
            lineWidth: 2,
            opacity: 0.7
        },
        crayon: {
            name: 'Red Crayon',
            color: COLORS.DANGER,
            lineWidth: 6,
            opacity: 0.85
        }
    }
};

export class DoodlePad {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.strokeCount = 0;
        this.timeRemaining = DOODLE_CONFIG.DRAW_TIME;
        this.timerInterval = null;
        this.isLocked = false;

        this.onComplete = null; // Callback when drawing is done

        this.lastX = 0;
        this.lastY = 0;

        this.centerX = DOODLE_CONFIG.CANVAS_SIZE / 2;
        this.centerY = DOODLE_CONFIG.CANVAS_SIZE / 2;

        this.createUI();
    }

    createUI() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'doodlePad';
        this.container.className = 'overlay hidden';
        this.container.innerHTML = `
            <div class="doodle-content">
                <h2 class="doodle-title">DRAW YOURSELF!</h2>
                <p class="doodle-subtitle">Scribble your character. Be quick!</p>
                
                <div class="doodle-timer">
                    <span id="doodleTime">${DOODLE_CONFIG.DRAW_TIME}</span>s
                </div>
                
                <div class="doodle-canvas-wrapper">
                    <canvas id="doodleCanvas" width="${DOODLE_CONFIG.CANVAS_SIZE}" height="${DOODLE_CONFIG.CANVAS_SIZE}"></canvas>
                    <div class="doodle-boundary"></div>
                </div>
                
                <div class="doodle-tools">
                    <button class="tool-btn active" data-tool="pen">🖊️ Pen</button>
                    <button class="tool-btn" data-tool="pencil">✏️ Pencil</button>
                    <button class="tool-btn" data-tool="crayon">🖍️ Crayon</button>
                </div>
                
                <div class="doodle-strokes">
                    <span id="strokeCount">0</span>/${DOODLE_CONFIG.MAX_STROKES} strokes
                </div>
                
                <button id="doodleDone" class="play-btn doodle-done-btn">DONE! ▶</button>
            </div>
        `;

        document.body.appendChild(this.container);

        // Get canvas
        this.canvas = document.getElementById('doodleCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Setup event listeners
        this.setupListeners();
    }

    setupListeners() {
        // Drawing events
        this.canvas.addEventListener('mousedown', (e) => this.startDraw(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.endDraw());
        this.canvas.addEventListener('mouseleave', () => this.endDraw());

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDraw(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.endDraw());

        // Tool selection
        const toolBtns = this.container.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isLocked) return;
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });

        // Done button
        document.getElementById('doodleDone').addEventListener('click', () => {
            this.finishDrawing();
        });
    }

    show() {
        this.reset();
        this.container.classList.remove('hidden');
        this.startTimer();
        this.drawBoundaryGuide();
    }

    hide() {
        this.container.classList.add('hidden');
        this.stopTimer();
    }

    reset() {
        this.isLocked = false;
        this.strokeCount = 0;
        this.timeRemaining = DOODLE_CONFIG.DRAW_TIME;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Reset UI
        document.getElementById('doodleTime').textContent = this.timeRemaining;
        document.getElementById('strokeCount').textContent = '0';

        const doneBtn = document.getElementById('doodleDone');
        doneBtn.textContent = 'DONE! ▶';
        doneBtn.classList.remove('locked');
    }

    drawBoundaryGuide() {
        // Draw faint circle guide
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, DOODLE_CONFIG.CIRCLE_RADIUS, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            document.getElementById('doodleTime').textContent = this.timeRemaining;

            if (this.timeRemaining <= 0) {
                this.finishDrawing();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getCanvasPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    isInsideCircle(x, y) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= DOODLE_CONFIG.CIRCLE_RADIUS;
    }

    clampToCircle(x, y) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > DOODLE_CONFIG.CIRCLE_RADIUS) {
            const angle = Math.atan2(dy, dx);
            return {
                x: this.centerX + Math.cos(angle) * DOODLE_CONFIG.CIRCLE_RADIUS,
                y: this.centerY + Math.sin(angle) * DOODLE_CONFIG.CIRCLE_RADIUS
            };
        }
        return { x, y };
    }

    startDraw(e) {
        if (this.isLocked || this.strokeCount >= DOODLE_CONFIG.MAX_STROKES) return;

        const pos = this.getCanvasPosition(e);
        if (!this.isInsideCircle(pos.x, pos.y)) return;

        this.isDrawing = true;
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.strokeCount++;

        document.getElementById('strokeCount').textContent = this.strokeCount;
    }

    draw(e) {
        if (!this.isDrawing || this.isLocked) return;

        let pos = this.getCanvasPosition(e);
        pos = this.clampToCircle(pos.x, pos.y);

        const tool = DOODLE_CONFIG.TOOLS[this.currentTool];
        const time = performance.now() / 1000;

        this.ctx.save();

        // Apply tool settings
        this.ctx.strokeStyle = tool.color;
        this.ctx.lineWidth = tool.lineWidth;
        this.ctx.globalAlpha = tool.opacity;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Add slight jitter for hand-drawn feel
        const jitter = noise(this.strokeCount, time) * 1;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX + jitter, this.lastY + jitter);
        this.ctx.lineTo(pos.x + jitter, pos.y + jitter);
        this.ctx.stroke();

        this.ctx.restore();

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    endDraw() {
        this.isDrawing = false;
    }

    finishDrawing() {
        if (this.isLocked) {
            // Already locked, proceed to callback
            this.proceedToGame();
            return;
        }

        this.isLocked = true;
        this.stopTimer();

        // Update UI
        const doneBtn = document.getElementById('doodleDone');
        doneBtn.textContent = 'LOCKED IN! ▶';
        doneBtn.classList.add('locked');

        // Add outline if drawing is too light
        this.addOutlineIfNeeded();

        // Short delay then allow proceeding
        setTimeout(() => {
            if (this.onComplete) {
                // Don't auto-proceed, wait for user click
            }
        }, 500);
    }

    proceedToGame() {
        const texture = this.getTexture();
        this.hide();

        if (this.onComplete) {
            this.onComplete(texture);
        }
    }

    addOutlineIfNeeded() {
        // Add a faint outline around the drawing for visibility
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-over';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, DOODLE_CONFIG.CIRCLE_RADIUS - 2, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    getTexture() {
        // Create output canvas at final size
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = DOODLE_CONFIG.OUTPUT_SIZE;
        outputCanvas.height = DOODLE_CONFIG.OUTPUT_SIZE;
        const outputCtx = outputCanvas.getContext('2d');

        // Calculate crop area (just the circle)
        const srcX = this.centerX - DOODLE_CONFIG.CIRCLE_RADIUS;
        const srcY = this.centerY - DOODLE_CONFIG.CIRCLE_RADIUS;
        const srcSize = DOODLE_CONFIG.CIRCLE_RADIUS * 2;

        // Draw cropped and scaled
        outputCtx.drawImage(
            this.canvas,
            srcX, srcY, srcSize, srcSize,
            0, 0, DOODLE_CONFIG.OUTPUT_SIZE, DOODLE_CONFIG.OUTPUT_SIZE
        );

        // Return as data URL
        return outputCanvas.toDataURL('image/png');
    }
}

export default DoodlePad;
