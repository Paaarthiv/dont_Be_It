// ═══════════════════════════════════════════════════════════════════════════════
// TAG ARENA - INPUT HANDLER
// Handles keyboard and touch input for player movement
// ═══════════════════════════════════════════════════════════════════════════════

export class Input {
    constructor() {
        this.keys = new Map();
        this.boostPressed = false;
        this.boostJustPressed = false;

        this.setupKeyboardListeners();
        this.setupTouchListeners();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // KEYBOARD
    // ─────────────────────────────────────────────────────────────────────────────
    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            // Prevent scrolling with arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }

            if (!this.keys.get(e.code)) {
                this.keys.set(e.code, true);

                // Track boost just pressed
                if (e.code === 'Space') {
                    this.boostJustPressed = true;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });

        // Clear keys when window loses focus
        window.addEventListener('blur', () => {
            this.keys.clear();
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TOUCH (Mobile) - Virtual Joystick
    // ─────────────────────────────────────────────────────────────────────────────
    setupTouchListeners() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.isTouching = false;
        this.joystickRadius = 50;

        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
                this.touchCurrentX = touch.clientX;
                this.touchCurrentY = touch.clientY;
                this.isTouching = true;

                // Double tap for boost
                const now = Date.now();
                if (this.lastTapTime && now - this.lastTapTime < 300) {
                    this.boostJustPressed = true;
                }
                this.lastTapTime = now;
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0 && this.isTouching) {
                const touch = e.touches[0];
                this.touchCurrentX = touch.clientX;
                this.touchCurrentY = touch.clientY;
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            this.isTouching = false;
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchCurrentX = 0;
            this.touchCurrentY = 0;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // INPUT QUERIES
    // ─────────────────────────────────────────────────────────────────────────────
    isKeyDown(code) {
        // Check keyboard
        if (this.keys.get(code)) return true;

        // Check touch joystick
        if (this.isTouching) {
            const dx = this.touchCurrentX - this.touchStartX;
            const dy = this.touchCurrentY - this.touchStartY;
            const threshold = 20;

            if (code === 'ArrowUp' || code === 'KeyW') return dy < -threshold;
            if (code === 'ArrowDown' || code === 'KeyS') return dy > threshold;
            if (code === 'ArrowLeft' || code === 'KeyA') return dx < -threshold;
            if (code === 'ArrowRight' || code === 'KeyD') return dx > threshold;
        }

        return false;
    }

    consumeBoostPress() {
        const wasPressed = this.boostJustPressed;
        this.boostJustPressed = false;
        return wasPressed;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────────────
    destroy() {
        // Listeners are attached to window, they'll be garbage collected
        this.keys.clear();
    }
}

export default Input;
