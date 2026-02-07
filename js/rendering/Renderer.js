/**
 * Renderer - Canvas rendering for the game area
 * Pixel-perfect rendering with Game Boy inspired aesthetics
 */
class Renderer {
    /**
     * Create renderer
     * @param {string} canvasId - ID of canvas element
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;

        // Internal resolution (Game Boy Color inspired - 160x144 * 2)
        this.internalWidth = 320;
        this.internalHeight = 288;

        // Create offscreen buffer at internal resolution
        this.buffer = document.createElement('canvas');
        this.buffer.width = this.internalWidth;
        this.buffer.height = this.internalHeight;
        this.bufferCtx = this.buffer.getContext('2d');
        this.bufferCtx.imageSmoothingEnabled = false;

        // Colors from theme - limited palette for retro feel
        this.colors = {
            // Background tones
            bg0: '#0a1628',      // Darkest
            bg1: '#1e293b',      // Dark
            bg2: '#334155',      // Medium
            bg3: '#475569',      // Light

            // Character colors
            gatoGreen: '#4ade80',
            gatoGreenDark: '#22c55e',
            gatoGreenLight: '#86efac',

            // Accent colors
            cream: '#fef3c7',
            creamDark: '#fde68a',
            navy: '#1e3a5f',
            navyDark: '#0f172a',
            pink: '#f472b6',
            pinkDark: '#db2777',
            cyan: '#22d3d3',
            cyanDark: '#0891b2',
            purple: '#a855f7',

            // Utility
            black: '#0f0f1a',
            white: '#f8fafc'
        };

        // Animation state
        this.time = 0;
        this.gatoFrame = 0;
        this.gatoAnimTimer = 0;

        // Car transition effect state
        this.lastCarId = null;
        this.lastCarWasDamaged = true;
        this.transitionEffect = {
            active: false,
            startTime: 0,
            duration: 600, // ms
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        // Background image dimensions (for proper scaling)
        this.bgAspectRatio = 1.5; // Will be updated when image loads

        // Cheese sprite timing
        this.cheeseCelebrateDuration = 2000; // ms
        this.cheeseAnnoyedThreshold = 10000; // ms

        // Resize handling
        this.setupResize();
    }

    /**
     * Trigger the car fixed transition effect
     */
    triggerTransition() {
        this.transitionEffect.active = true;
        this.transitionEffect.startTime = this.time;
        // Standard position for car on lift
        this.transitionEffect.x = 80;
        this.transitionEffect.y = 130;
        this.transitionEffect.width = 140;
        this.transitionEffect.height = 140;
    }

    /**
     * Setup canvas resize handling
     */
    setupResize() {
        const resize = () => {
            const container = this.canvas.parentElement;
            const rect = container.getBoundingClientRect();

            // Maintain aspect ratio
            const aspectRatio = this.internalWidth / this.internalHeight;
            let displayWidth = rect.width;
            let displayHeight = rect.height;

            // Calculate size that fits within container while maintaining aspect ratio
            if (displayWidth / displayHeight > aspectRatio) {
                // Container is wider than needed - constrain by height
                displayWidth = displayHeight * aspectRatio;
            } else {
                // Container is taller than needed - constrain by width
                displayHeight = displayWidth / aspectRatio;
            }

            // Round to integer for crisp pixels
            displayWidth = Math.floor(displayWidth);
            displayHeight = Math.floor(displayHeight);

            // Set internal resolution (fixed - this is the pixel buffer)
            this.canvas.width = this.internalWidth;
            this.canvas.height = this.internalHeight;

            // Set display size via CSS (this controls how it appears on screen)
            this.canvas.style.width = displayWidth + 'px';
            this.canvas.style.height = displayHeight + 'px';

            // Disable smoothing after resize
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.mozImageSmoothingEnabled = false;
            this.ctx.webkitImageSmoothingEnabled = false;
            this.ctx.msImageSmoothingEnabled = false;
        };

        resize();
        window.addEventListener('resize', resize);
    }

    /**
     * Draw a pixel-perfect rectangle
     */
    drawRect(x, y, w, h, color) {
        this.bufferCtx.fillStyle = color;
        this.bufferCtx.fillRect(
            Math.floor(x),
            Math.floor(y),
            Math.floor(w),
            Math.floor(h)
        );
    }

    /**
     * Draw a pixel-perfect outlined rectangle
     */
    drawRectOutline(x, y, w, h, color, lineWidth = 2) {
        const ctx = this.bufferCtx;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(
            Math.floor(x) + 0.5,
            Math.floor(y) + 0.5,
            Math.floor(w),
            Math.floor(h)
        );
    }

    /**
     * Draw pixel text
     */
    drawText(text, x, y, color, size = 8) {
        const ctx = this.bufferCtx;
        ctx.fillStyle = color;
        ctx.font = `${size}px "Press Start 2P", monospace`;
        ctx.fillText(text, Math.floor(x), Math.floor(y));
    }

    /**
     * Clear the buffer
     */
    clear() {
        this.drawRect(0, 0, this.internalWidth, this.internalHeight, this.colors.bg0);
    }

    /**
     * Render the game state
     * @param {GameState} state - Current game state
     * @param {number} interpolation - Frame interpolation (0-1)
     */
    render(state, interpolation) {
        this.time += 16; // Approximate frame time

        this.clear();

        // Draw layers back to front
        this.drawGarageBackground();

        // Draw current car on the lift
        if (state.currentCar) {
            this.drawCurrentCar(state.currentCar);
        } else {
            // Reset car tracking when no car present
            this.lastCarId = null;
            this.lastCarWasDamaged = true;
            this.drawEmptyBay();
        }

        // Draw Cheese (cat maid hero) to the right of the car bay
        this.drawCheese(state);

        // Draw characters (only if using procedural background)
        const bgImage = Assets.get('garageBackground');
        if (!bgImage) {
            this.drawWorkers(state.workers);
        }

        // Draw queue display at bottom
        this.drawCarQueue(state.carQueue);

        // Draw particles (on top of everything)
        if (state.particleSystem) {
            this.drawParticles(state.particleSystem);
        }

        // Scale buffer to display canvas with nearest-neighbor
        this.ctx.drawImage(
            this.buffer,
            0, 0,
            this.canvas.width,
            this.canvas.height
        );
    }

    /**
     * Draw particles from system
     * @param {ParticleSystem} system 
     */
    drawParticles(system) {
        const ctx = this.bufferCtx;
        ctx.save();

        for (const p of system.particles) {
            const lifePercent = p.life / p.maxLife;
            ctx.globalAlpha = Math.min(1, lifePercent * 2);
            ctx.fillStyle = p.color;

            if (p.type === 'square') {
                ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
            } else if (p.type === 'text') {
                ctx.font = `${p.size}px "Press Start 2P"`;
                ctx.fillText(p.text, Math.floor(p.x), Math.floor(p.y));
            }
        }

        ctx.restore();
    }

    /**
     * Draw the garage background
     */
    drawGarageBackground() {
        const bgImage = Assets.get('garageBackground');

        if (bgImage) {
            // Draw the background image scaled to fill the internal buffer
            this.bufferCtx.drawImage(
                bgImage,
                0, 0,
                this.internalWidth, this.internalHeight
            );
        } else {
            // Fallback to procedural background if image not loaded
            this.drawProceduralBackground();
        }
    }

    /**
     * Draw procedural fallback background (used if image fails to load)
     */
    drawProceduralBackground() {
        // Back wall with gradient effect (using bands)
        this.drawRect(0, 0, this.internalWidth, 180, this.colors.bg1);
        this.drawRect(0, 0, this.internalWidth, 20, this.colors.bg0);

        // Floor
        this.drawRect(0, 180, this.internalWidth, 108, this.colors.bg2);

        // Floor tile grid pattern
        for (let x = 0; x < this.internalWidth; x += 32) {
            this.drawRect(x, 180, 2, 108, this.colors.bg1);
        }
        for (let y = 180; y < this.internalHeight; y += 24) {
            this.drawRect(0, y, this.internalWidth, 2, this.colors.bg1);
        }

        // Garage door frame (left side)
        this.drawRect(8, 24, 150, 140, this.colors.navy);
        this.drawRect(12, 28, 142, 132, this.colors.navyDark);

        // Garage door panels (rolled up look)
        for (let y = 32; y < 155; y += 20) {
            this.drawRect(14, y, 138, 16, this.colors.bg0);
            this.drawRect(14, y, 138, 2, this.colors.navy);
            this.drawRect(14, y + 14, 138, 2, this.colors.navyDark);
        }

        // Door track lines
        this.drawRect(12, 28, 4, 132, this.colors.bg3);
        this.drawRect(150, 28, 4, 132, this.colors.bg3);

        // Neon sign on wall
        this.drawNeonSign(170, 35);

        // Tool pegboard
        this.drawToolRack(255, 60);

        // Workbench
        this.drawWorkbench(220, 150);

        // Light fixture (simple)
        this.drawRect(100, 8, 60, 8, this.colors.bg3);
        this.drawRect(110, 16, 40, 4, this.colors.cream);
    }

    /**
     * Draw neon sign "GATO GARAGE"
     */
    drawNeonSign(x, y) {
        const ctx = this.bufferCtx;

        // Sign backing board
        this.drawRect(x - 4, y - 12, 78, 50, this.colors.navyDark);
        this.drawRectOutline(x - 4, y - 12, 78, 50, this.colors.navy, 2);

        // Neon glow effect (layered rectangles behind text)
        ctx.shadowColor = this.colors.gatoGreen;
        ctx.shadowBlur = 15;

        // GATO text
        this.drawText('GATO', x, y, this.colors.gatoGreen, 12);
        // GARAGE text
        this.drawText('GARAGE', x - 2, y + 22, this.colors.gatoGreenLight, 10);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Accent dots (like neon tube connectors)
        this.drawRect(x + 62, y - 8, 4, 4, this.colors.gatoGreen);
        this.drawRect(x + 62, y + 26, 4, 4, this.colors.gatoGreen);
    }

    /**
     * Draw tool pegboard
     */
    drawToolRack(x, y) {
        // Pegboard
        this.drawRect(x, y, 56, 80, this.colors.bg3);
        this.drawRectOutline(x, y, 56, 80, this.colors.navy, 2);

        // Peg holes pattern
        for (let py = y + 8; py < y + 75; py += 12) {
            for (let px = x + 8; px < x + 52; px += 12) {
                this.drawRect(px, py, 4, 4, this.colors.bg1);
            }
        }

        // Tools hanging
        // Wrench
        this.drawRect(x + 8, y + 12, 6, 24, this.colors.cream);
        this.drawRect(x + 6, y + 32, 10, 8, this.colors.cream);

        // Screwdriver
        this.drawRect(x + 22, y + 8, 4, 20, this.colors.creamDark);
        this.drawRect(x + 20, y + 28, 8, 12, this.colors.pink);

        // Hammer
        this.drawRect(x + 36, y + 10, 14, 8, this.colors.bg3);
        this.drawRect(x + 40, y + 18, 6, 20, this.colors.creamDark);

        // Pliers
        this.drawRect(x + 12, y + 50, 8, 20, this.colors.cyan);
        this.drawRect(x + 10, y + 48, 12, 6, this.colors.cyanDark);
    }

    /**
     * Draw workbench
     */
    drawWorkbench(x, y) {
        // Bench top
        this.drawRect(x, y, 90, 12, this.colors.creamDark);
        this.drawRect(x, y, 90, 4, this.colors.cream);

        // Legs
        this.drawRect(x + 4, y + 12, 8, 30, this.colors.bg3);
        this.drawRect(x + 78, y + 12, 8, 30, this.colors.bg3);

        // Items on bench
        this.drawRect(x + 20, y - 8, 16, 8, this.colors.cyan); // Toolbox
        this.drawRect(x + 50, y - 6, 12, 6, this.colors.pink); // Part
        this.drawRect(x + 70, y - 10, 8, 10, this.colors.gatoGreen); // Can
    }

    /**
     * Draw the current car being repaired
     * @param {Car} car - Current car
     */
    drawCurrentCar(car) {
        // Position car on the lift area (centered on the lift pits in background)
        const x = 80;
        const y = 130;
        const carWidth = 140;
        const carHeight = 140;

        // Check if car just transitioned from damaged to repaired (crossed 50%)
        const isDamaged = car.getProgressPercent() < 0.5;
        const carChanged = this.lastCarId !== car.id;
        const stateChanged = !carChanged && this.lastCarWasDamaged && !isDamaged;

        if (stateChanged) {
            // Trigger transition effect
            this.transitionEffect.active = true;
            this.transitionEffect.startTime = this.time;
            this.transitionEffect.x = x;
            this.transitionEffect.y = y;
            this.transitionEffect.width = carWidth;
            this.transitionEffect.height = carHeight;
        }

        // Update tracking
        this.lastCarId = car.id;
        this.lastCarWasDamaged = isDamaged;

        // Try to draw car sprite
        const spriteKey = car.getCurrentSprite();
        const sprite = spriteKey ? Assets.get(spriteKey) : null;

        if (sprite) {
            // Draw car sprite centered on lift
            this.bufferCtx.drawImage(
                sprite,
                x, y,
                carWidth, carHeight
            );
        } else {
            // Fallback to procedural car drawing
            this.drawProceduralCar(car, x + 20, y + 40);
        }

        // Draw transition effect if active
        if (this.transitionEffect.active) {
            this.drawCarTransitionEffect();
        }

        // Progress bar above car
        this.drawProgressBar(x + 10, y - 25, carWidth - 20, 14, car.getProgressPercent());

        // Rarity badge
        this.drawRarityBadge(x + carWidth - 20, y + 10, car.rarity);

        // Sparks if being repaired (animated) - only on damaged cars
        if (car.getProgressPercent() > 0 && car.getProgressPercent() < 0.5) {
            this.drawRepairSparks(x + carWidth / 2, y + carHeight / 2);
        }
    }

    /**
     * Draw procedural car (fallback if sprites unavailable)
     * @param {Car} car - Car to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawProceduralCar(car, x, y) {
        // Car shadow
        this.drawRect(x + 5, y + 50, 95, 8, this.colors.bg1);

        // Car body (main rectangle)
        this.drawRect(x, y + 10, 100, 40, car.color);

        // Car roof
        this.drawRect(x + 20, y - 10, 60, 24, car.color);

        // Roof highlight
        this.drawRect(x + 22, y - 8, 56, 4, this.colors.white);

        // Windows
        this.drawRect(x + 24, y - 6, 24, 18, this.colors.cyan);
        this.drawRect(x + 52, y - 6, 26, 18, this.colors.cyan);

        // Window glare
        this.drawRect(x + 26, y - 4, 8, 8, this.colors.cyanDark);
        this.drawRect(x + 54, y - 4, 8, 8, this.colors.cyanDark);

        // Window frames
        this.drawRect(x + 48, y - 6, 4, 18, car.color);

        // Headlights
        this.drawRect(x - 2, y + 16, 6, 10, this.colors.cream);
        this.drawRect(x - 2, y + 34, 6, 8, this.colors.pink);

        // Taillights
        this.drawRect(x + 96, y + 18, 6, 8, this.colors.pink);
        this.drawRect(x + 96, y + 32, 6, 8, this.colors.pinkDark);

        // Wheels
        this.drawWheel(x + 22, y + 48);
        this.drawWheel(x + 78, y + 48);

        // Grill
        this.drawRect(x + 2, y + 26, 8, 16, this.colors.bg0);
        for (let gy = y + 28; gy < y + 40; gy += 4) {
            this.drawRect(x + 4, gy, 4, 2, this.colors.bg3);
        }

        // Door lines
        this.drawRect(x + 35, y + 12, 2, 36, this.shadeColor(car.color, -20));
        this.drawRect(x + 65, y + 12, 2, 36, this.shadeColor(car.color, -20));

        // Door handles
        this.drawRect(x + 40, y + 28, 8, 4, this.colors.cream);
        this.drawRect(x + 70, y + 28, 8, 4, this.colors.cream);
    }

    /**
     * Draw a wheel
     */
    drawWheel(x, y) {
        // Tire
        this.drawRect(x - 10, y - 10, 20, 20, this.colors.black);

        // Inner tire
        this.drawRect(x - 8, y - 8, 16, 16, '#1a1a2e');

        // Hubcap
        this.drawRect(x - 5, y - 5, 10, 10, this.colors.bg3);

        // Hub center
        this.drawRect(x - 2, y - 2, 4, 4, this.colors.cream);
    }

    /**
     * Draw progress bar
     */
    drawProgressBar(x, y, width, height, progress) {
        // Background
        this.drawRect(x, y, width, height, this.colors.bg0);

        // Border
        this.drawRectOutline(x, y, width, height, this.colors.gatoGreenDark, 2);

        // Fill
        const fillWidth = Math.floor((width - 4) * progress);
        if (fillWidth > 0) {
            this.drawRect(x + 2, y + 2, fillWidth, height - 4, this.colors.gatoGreen);

            // Highlight on fill
            this.drawRect(x + 2, y + 2, fillWidth, 2, this.colors.gatoGreenLight);
        }

        // Percentage text
        const percent = Math.floor(progress * 100);
        this.drawText(`${percent}%`, x + width / 2 - 12, y + height - 3, this.colors.cream, 6);
    }

    /**
     * Draw rarity badge
     */
    drawRarityBadge(x, y, rarity) {
        const rarityConfig = {
            common: { color: this.colors.bg3, text: 'C' },
            uncommon: { color: this.colors.gatoGreen, text: 'U' },
            rare: { color: this.colors.cyan, text: 'R' },
            legendary: { color: this.colors.purple, text: 'L' }
        };

        const config = rarityConfig[rarity] || rarityConfig.common;

        this.drawRect(x, y, 14, 14, config.color);
        this.drawRectOutline(x, y, 14, 14, this.colors.white, 1);
        this.drawText(config.text, x + 4, y + 11, this.colors.white, 8);
    }

    /**
     * Draw repair sparks
     */
    drawRepairSparks(x, y) {
        const sparkTime = (this.time / 100) % 10;

        for (let i = 0; i < 3; i++) {
            const angle = (sparkTime + i * 3) * 0.5;
            const dist = 10 + Math.sin(this.time / 50 + i) * 5;
            const sx = x + Math.cos(angle) * dist;
            const sy = y + Math.sin(angle) * dist - 10;

            if ((Math.floor(this.time / 100) + i) % 2 === 0) {
                this.drawRect(sx, sy, 3, 3, this.colors.cream);
            }
        }
    }

    /**
     * Draw car transition effect (flash + sparkles when car is repaired)
     */
    drawCarTransitionEffect() {
        const effect = this.transitionEffect;
        const elapsed = this.time - effect.startTime;
        const progress = elapsed / effect.duration;

        if (progress >= 1) {
            effect.active = false;
            return;
        }

        const ctx = this.bufferCtx;
        // Use last known position or default center
        const centerX = (effect.x !== undefined ? effect.x : 80) + (effect.width !== undefined ? effect.width : 140) / 2;
        const centerY = (effect.y !== undefined ? effect.y : 130) + (effect.height !== undefined ? effect.height : 140) / 2;

        // Phase 1: White flash (0-30%)
        if (progress < 0.3) {
            const flashProgress = progress / 0.3;
            const flashAlpha = Math.sin(flashProgress * Math.PI) * 0.6;

            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(effect.x, effect.y, effect.width, effect.height);
        }

        // Phase 2: Expanding ring (10-60%)
        if (progress > 0.1 && progress < 0.6) {
            const ringProgress = (progress - 0.1) / 0.5;
            const ringRadius = ringProgress * 80;
            const ringAlpha = (1 - ringProgress) * 0.8;

            ctx.strokeStyle = `rgba(74, 222, 128, ${ringAlpha})`; // gatoGreen
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Phase 3: Sparkles burst outward (20-100%)
        if (progress > 0.2) {
            const sparkProgress = (progress - 0.2) / 0.8;
            const numSparkles = 8;

            for (let i = 0; i < numSparkles; i++) {
                const angle = (i / numSparkles) * Math.PI * 2;
                const dist = sparkProgress * 70;
                const sparkX = centerX + Math.cos(angle) * dist;
                const sparkY = centerY + Math.sin(angle) * dist;
                const sparkAlpha = (1 - sparkProgress) * 1;
                const sparkSize = (1 - sparkProgress) * 6 + 2;

                // Draw sparkle (small cross/star shape)
                ctx.fillStyle = `rgba(254, 243, 199, ${sparkAlpha})`; // cream color
                ctx.fillRect(sparkX - sparkSize / 2, sparkY - 1, sparkSize, 2);
                ctx.fillRect(sparkX - 1, sparkY - sparkSize / 2, 2, sparkSize);
            }
        }

        // Phase 4: "FIXED!" text pop (30-90%)
        if (progress > 0.3 && progress < 0.9) {
            const textProgress = (progress - 0.3) / 0.6;
            const textAlpha = textProgress < 0.2 ? textProgress / 0.2 : (textProgress > 0.8 ? (1 - textProgress) / 0.2 : 1);
            const textScale = 1 + Math.sin(textProgress * Math.PI) * 0.2;
            const textY = effect.y - 10 - textProgress * 15;

            ctx.save();
            ctx.globalAlpha = textAlpha;
            ctx.font = `${Math.floor(10 * textScale)}px "Press Start 2P", monospace`;
            ctx.fillStyle = this.colors.gatoGreen;
            ctx.textAlign = 'center';
            ctx.fillText('FIXED!', centerX, textY);
            ctx.restore();
        }
    }

    /**
     * Draw empty repair bay
     */
    drawEmptyBay() {
        // Position to match car lift area
        const x = 80;
        const y = 130;
        const width = 140;
        const height = 100;

        // Dashed outline
        const ctx = this.bufferCtx;
        ctx.strokeStyle = this.colors.gatoGreen;
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 10, y + 20, width - 20, height);
        ctx.setLineDash([]);

        // Waiting text
        const pulse = Math.sin(this.time / 500) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        this.drawText('WAITING...', x + 35, y + 75, this.colors.gatoGreen, 8);
        ctx.globalAlpha = 1;
    }

    /**
     * Draw Cheese sprite with state-based expressions
     */
    drawCheese(state) {
        const spriteKey = this.getCheeseSpriteKey(state);
        const sprite = Assets.get(spriteKey);

        // Position to the right of the lift bay
        const x = 235;
        const y = 145;
        const width = 70;
        const height = 100;

        if (sprite) {
            this.bufferCtx.drawImage(sprite, x, y, width, height);
        } else {
            // Fallback to procedural character if sprite missing
            this.drawGatoSan(state, 0);
        }
    }

    /**
     * Pick the appropriate Cheese sprite based on game state
     * @returns {string} Asset key
     */
    getCheeseSpriteKey(state) {
        const now = Date.now();

        if (state.lastCarRepairedAt && (now - state.lastCarRepairedAt) <= this.cheeseCelebrateDuration) {
            return 'cheeseGoodJob';
        }

        if (!state.currentCar) {
            return 'cheeseNormal';
        }

        if (state.currentCarStartTime && (now - state.currentCarStartTime) >= this.cheeseAnnoyedThreshold) {
            return 'cheeseAnnoyed';
        }

        return 'cheeseWrench';
    }

    /**
     * Draw the main character Gato-san
     */
    drawGatoSan(state, interpolation) {
        const x = 185;
        const y = 155;

        // Animation
        this.gatoAnimTimer += 16;
        if (this.gatoAnimTimer > 400) {
            this.gatoFrame = (this.gatoFrame + 1) % 2;
            this.gatoAnimTimer = 0;
        }

        const bounce = this.gatoFrame === 1 ? -2 : 0;

        // Shadow
        this.drawRect(x - 14, y + 44, 28, 6, this.colors.bg1);

        // Tail (animated)
        const tailWave = Math.sin(this.time / 150) * 8;
        this.drawTail(x + 12, y + 25, tailWave);

        // Body (maid dress)
        this.drawRect(x - 12, y + bounce, 24, 44, this.colors.navy);

        // Dress details
        this.drawRect(x - 10, y + 38 + bounce, 20, 6, this.colors.navyDark);

        // Apron
        this.drawRect(x - 8, y + 4 + bounce, 16, 32, this.colors.cream);
        this.drawRect(x - 6, y + 6 + bounce, 12, 2, this.colors.creamDark);

        // Apron bow (back)
        this.drawRect(x + 10, y + 12 + bounce, 8, 8, this.colors.cream);
        this.drawRect(x + 14, y + 8 + bounce, 6, 4, this.colors.cream);
        this.drawRect(x + 14, y + 20 + bounce, 6, 4, this.colors.cream);

        // Arms
        this.drawRect(x - 16, y + 4 + bounce, 6, 20, this.colors.navy);
        this.drawRect(x + 10, y + 4 + bounce, 6, 20, this.colors.navy);

        // Hands
        this.drawRect(x - 16, y + 22 + bounce, 6, 6, this.colors.cream);
        this.drawRect(x + 10, y + 22 + bounce, 6, 6, this.colors.cream);

        // Tool in hand if working
        if (state.currentCar) {
            this.drawRect(x - 24, y + 16 + bounce, 12, 4, this.colors.creamDark);
            this.drawRect(x - 26, y + 12 + bounce, 6, 12, this.colors.bg3);
        }

        // Head
        this.drawRect(x - 10, y - 22 + bounce, 20, 22, this.colors.cream);

        // Hair (green)
        this.drawRect(x - 12, y - 28 + bounce, 24, 14, this.colors.gatoGreen);
        this.drawRect(x - 10, y - 30 + bounce, 20, 4, this.colors.gatoGreenDark);

        // Bangs
        this.drawRect(x - 8, y - 16 + bounce, 6, 6, this.colors.gatoGreen);
        this.drawRect(x + 2, y - 16 + bounce, 6, 6, this.colors.gatoGreen);

        // Cat ears
        this.drawEar(x - 10, y - 38 + bounce, false);
        this.drawEar(x + 4, y - 38 + bounce, true);

        // Maid headband
        this.drawRect(x - 8, y - 30 + bounce, 16, 4, this.colors.cream);
        // Headband ruffle
        this.drawRect(x - 6, y - 34 + bounce, 12, 4, this.colors.cream);

        // Eyes
        const blinkFrame = Math.floor(this.time / 2000) % 20;
        if (blinkFrame === 0) {
            // Blinking
            this.drawRect(x - 6, y - 14 + bounce, 5, 2, this.colors.black);
            this.drawRect(x + 1, y - 14 + bounce, 5, 2, this.colors.black);
        } else {
            // Open eyes
            this.drawRect(x - 6, y - 16 + bounce, 5, 5, this.colors.black);
            this.drawRect(x + 1, y - 16 + bounce, 5, 5, this.colors.black);
            // Eye highlights
            this.drawRect(x - 5, y - 15 + bounce, 2, 2, this.colors.white);
            this.drawRect(x + 2, y - 15 + bounce, 2, 2, this.colors.white);
        }

        // Blush
        this.drawRect(x - 8, y - 10 + bounce, 4, 2, this.colors.pink);
        this.drawRect(x + 4, y - 10 + bounce, 4, 2, this.colors.pink);

        // Mouth (cat smile)
        this.drawRect(x - 2, y - 6 + bounce, 1, 2, this.colors.black);
        this.drawRect(x + 1, y - 6 + bounce, 1, 2, this.colors.black);
        this.drawRect(x - 1, y - 4 + bounce, 2, 1, this.colors.black);

        // Collar bow
        this.drawRect(x - 4, y - 2 + bounce, 8, 6, this.colors.gatoGreen);
        this.drawRect(x - 2, y + bounce, 4, 4, this.colors.gatoGreenDark);
    }

    /**
     * Draw cat ear
     */
    drawEar(x, y, flip) {
        const ctx = this.bufferCtx;
        ctx.fillStyle = this.colors.gatoGreen;

        ctx.beginPath();
        if (flip) {
            ctx.moveTo(x, y + 12);
            ctx.lineTo(x + 3, y);
            ctx.lineTo(x + 8, y + 12);
        } else {
            ctx.moveTo(x, y + 12);
            ctx.lineTo(x + 5, y);
            ctx.lineTo(x + 8, y + 12);
        }
        ctx.fill();

        // Inner ear
        ctx.fillStyle = this.colors.pink;
        ctx.beginPath();
        if (flip) {
            ctx.moveTo(x + 2, y + 10);
            ctx.lineTo(x + 4, y + 4);
            ctx.lineTo(x + 6, y + 10);
        } else {
            ctx.moveTo(x + 2, y + 10);
            ctx.lineTo(x + 4, y + 4);
            ctx.lineTo(x + 6, y + 10);
        }
        ctx.fill();
    }

    /**
     * Draw tail
     */
    drawTail(x, y, wave) {
        const ctx = this.bufferCtx;
        ctx.fillStyle = this.colors.gatoGreen;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 15 + wave, y - 10, x + 25 + wave, y + 5);
        ctx.quadraticCurveTo(x + 20 + wave, y + 10, x + 15 + wave, y + 5);
        ctx.quadraticCurveTo(x + 10 + wave, y, x, y + 6);
        ctx.fill();
    }

    /**
     * Draw hired workers
     */
    drawWorkers(workers) {
        if (workers.length === 0) return;

        const startX = 230;
        const startY = 195;
        const spacing = 22;

        // Only show first 6 workers visually
        const visibleWorkers = workers.slice(0, 6);

        visibleWorkers.forEach((worker, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = startX + col * spacing;
            const y = startY + row * 35;

            this.drawMiniWorker(x, y, worker.color);
        });

        // Worker count if more
        if (workers.length > 6) {
            this.drawText(`+${workers.length - 6}`, startX + 70, startY + 25, this.colors.cream, 8);
        }
    }

    /**
     * Draw mini worker sprite
     */
    drawMiniWorker(x, y, color) {
        // Shadow
        this.drawRect(x - 4, y + 18, 10, 3, this.colors.bg1);

        // Body
        this.drawRect(x - 4, y, 10, 16, color);

        // Apron
        this.drawRect(x - 2, y + 2, 6, 10, this.colors.cream);

        // Head
        this.drawRect(x - 3, y - 8, 8, 8, this.colors.cream);

        // Hair
        this.drawRect(x - 4, y - 10, 10, 4, color);

        // Ears
        this.drawRect(x - 4, y - 13, 3, 4, color);
        this.drawRect(x + 3, y - 13, 3, 4, color);

        // Eyes
        this.drawRect(x - 2, y - 6, 2, 2, this.colors.black);
        this.drawRect(x + 2, y - 6, 2, 2, this.colors.black);
    }

    /**
     * Draw car queue in background
     */
    drawCarQueue(carQueue) {
        // Queue label
        this.drawText('QUEUE', 10, this.internalHeight - 8, this.colors.gatoGreen, 6);

        const startX = 50;
        const y = this.internalHeight - 45;
        const spacing = 55;

        carQueue.forEach((car, index) => {
            const x = startX + index * spacing;
            this.drawMiniCarSprite(x, y, car);
        });

        // Empty slots
        for (let i = carQueue.length; i < 5; i++) {
            const x = startX + i * spacing;
            this.drawRect(x, y, 48, 32, 'rgba(0,0,0,0.3)');
            this.drawRectOutline(x, y, 48, 32, this.colors.bg3, 1);
        }
    }

    /**
     * Draw mini car sprite for queue
     */
    drawMiniCarSprite(x, y, car) {
        const spriteKey = car.spriteDamaged; // Always show damaged in queue
        const sprite = spriteKey ? Assets.get(spriteKey) : null;

        if (sprite) {
            // Draw small version of car sprite
            this.bufferCtx.drawImage(sprite, x, y, 48, 32);
        } else {
            // Fallback to procedural mini car
            this.drawMiniCar(x + 13, y + 5, car.color);
        }
    }

    /**
     * Draw mini car for queue (procedural fallback)
     */
    drawMiniCar(x, y, color) {
        // Body
        this.drawRect(x, y, 22, 12, color);

        // Roof
        this.drawRect(x + 4, y - 6, 14, 8, color);

        // Windows
        this.drawRect(x + 6, y - 4, 10, 5, this.colors.cyan);

        // Wheels
        this.drawRect(x + 2, y + 10, 6, 6, this.colors.black);
        this.drawRect(x + 14, y + 10, 6, 6, this.colors.black);
    }

    /**
     * Shade a hex color
     */
    shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    /**
     * Get canvas element
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Convert screen to game coordinates
     */
    screenToGame(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.internalWidth / rect.width;
        const scaleY = this.internalHeight / rect.height;

        return {
            x: (screenX - rect.left) * scaleX,
            y: (screenY - rect.top) * scaleY
        };
    }
}
