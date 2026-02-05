/**
 * Renderer - Canvas rendering for the game area
 * Uses placeholder graphics until real sprites are available
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

        // Internal resolution (Game Boy inspired)
        this.internalWidth = 320;
        this.internalHeight = 288;

        // Create offscreen buffer
        this.buffer = document.createElement('canvas');
        this.buffer.width = this.internalWidth;
        this.buffer.height = this.internalHeight;
        this.bufferCtx = this.buffer.getContext('2d');
        this.bufferCtx.imageSmoothingEnabled = false;

        // Colors from theme
        this.colors = {
            background: '#0a1628',
            garage: '#1e293b',
            floor: '#334155',
            gateFrame: '#1e3a5f',
            gate: '#0f172a',
            gatoGreen: '#4ade80',
            gatoGreenDark: '#22c55e',
            cream: '#fef3c7',
            navy: '#1e3a5f',
            pink: '#f472b6',
            cyan: '#22d3d3'
        };

        // Animation state
        this.gatoFrame = 0;
        this.gatoAnimTimer = 0;
        this.workerPositions = [];

        // Resize handling
        this.setupResize();
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
            let width = rect.width;
            let height = rect.height;

            if (width / height > aspectRatio) {
                width = height * aspectRatio;
            } else {
                height = width / aspectRatio;
            }

            this.canvas.width = width;
            this.canvas.height = height;
            this.ctx.imageSmoothingEnabled = false;
        };

        resize();
        window.addEventListener('resize', resize);
    }

    /**
     * Clear the buffer
     */
    clear() {
        this.bufferCtx.fillStyle = this.colors.background;
        this.bufferCtx.fillRect(0, 0, this.internalWidth, this.internalHeight);
    }

    /**
     * Render the game state
     * @param {GameState} state - Current game state
     * @param {number} interpolation - Frame interpolation (0-1)
     */
    render(state, interpolation) {
        this.clear();

        // Draw garage background
        this.drawGarage();

        // Draw car queue in background
        this.drawCarQueue(state.carQueue);

        // Draw current car
        if (state.currentCar) {
            this.drawCurrentCar(state.currentCar);
        } else {
            this.drawEmptyBay();
        }

        // Draw main character (Gato-san)
        this.drawGatoSan(state, interpolation);

        // Draw workers
        this.drawWorkers(state.workers);

        // Scale buffer to display canvas
        this.ctx.drawImage(
            this.buffer,
            0, 0,
            this.canvas.width,
            this.canvas.height
        );
    }

    /**
     * Draw the garage background
     */
    drawGarage() {
        const ctx = this.bufferCtx;

        // Back wall
        ctx.fillStyle = this.colors.garage;
        ctx.fillRect(0, 0, this.internalWidth, this.internalHeight * 0.6);

        // Floor
        ctx.fillStyle = this.colors.floor;
        ctx.fillRect(0, this.internalHeight * 0.6, this.internalWidth, this.internalHeight * 0.4);

        // Floor tiles pattern
        ctx.strokeStyle = this.colors.garage;
        ctx.lineWidth = 1;
        for (let x = 0; x < this.internalWidth; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, this.internalHeight * 0.6);
            ctx.lineTo(x, this.internalHeight);
            ctx.stroke();
        }

        // Garage door frame
        ctx.fillStyle = this.colors.gateFrame;
        ctx.fillRect(10, 20, 140, 130);

        // Garage door (slightly open)
        ctx.fillStyle = this.colors.gate;
        ctx.fillRect(15, 25, 130, 115);

        // Door lines
        ctx.strokeStyle = this.colors.gateFrame;
        ctx.lineWidth = 2;
        for (let y = 35; y < 140; y += 20) {
            ctx.beginPath();
            ctx.moveTo(15, y);
            ctx.lineTo(145, y);
            ctx.stroke();
        }

        // Neon sign "GATO GARAGE"
        this.drawNeonSign(170, 30, "GATO");
        this.drawNeonSign(170, 55, "GARAGE");

        // Tool rack on wall
        this.drawToolRack(250, 80);
    }

    /**
     * Draw neon text
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text to draw
     */
    drawNeonSign(x, y, text) {
        const ctx = this.bufferCtx;

        // Glow effect
        ctx.shadowColor = this.colors.gatoGreen;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.colors.gatoGreen;
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(text, x, y);

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    /**
     * Draw tool rack decoration
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    drawToolRack(x, y) {
        const ctx = this.bufferCtx;

        // Rack board
        ctx.fillStyle = this.colors.gateFrame;
        ctx.fillRect(x, y, 50, 60);

        // Tool shapes (simple rectangles)
        ctx.fillStyle = this.colors.cream;
        ctx.fillRect(x + 5, y + 5, 8, 30);  // Wrench
        ctx.fillRect(x + 18, y + 10, 6, 25); // Screwdriver
        ctx.fillRect(x + 30, y + 5, 12, 8);  // Hammer head
        ctx.fillRect(x + 33, y + 13, 6, 25); // Hammer handle
    }

    /**
     * Draw the current car being repaired
     * @param {Car} car - Current car
     */
    drawCurrentCar(car) {
        const ctx = this.bufferCtx;
        const x = 60;
        const y = 150;
        const width = 100;
        const height = 50;

        // Car body
        ctx.fillStyle = car.color;
        ctx.fillRect(x, y, width, height);

        // Car roof
        ctx.fillRect(x + 20, y - 25, 60, 30);

        // Windows
        ctx.fillStyle = this.colors.cyan;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + 25, y - 20, 20, 20);
        ctx.fillRect(x + 50, y - 20, 25, 20);
        ctx.globalAlpha = 1;

        // Wheels
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x + 25, y + height, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + width - 25, y + height, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hubcaps
        ctx.fillStyle = this.colors.cream;
        ctx.beginPath();
        ctx.arc(x + 25, y + height, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + width - 25, y + height, 5, 0, Math.PI * 2);
        ctx.fill();

        // Repair progress bar above car
        const barWidth = width;
        const barHeight = 8;
        const barX = x;
        const barY = y - 45;
        const progress = car.getProgressPercent();

        // Background
        ctx.fillStyle = this.colors.gate;
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress fill
        ctx.fillStyle = this.colors.gatoGreen;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Border
        ctx.strokeStyle = this.colors.gatoGreenDark;
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Rarity indicator
        const rarityColors = {
            common: this.colors.cream,
            uncommon: this.colors.gatoGreen,
            rare: this.colors.cyan,
            legendary: '#a855f7'
        };
        ctx.fillStyle = rarityColors[car.rarity] || this.colors.cream;
        ctx.fillRect(x + width - 10, y, 10, 10);
    }

    /**
     * Draw empty repair bay
     */
    drawEmptyBay() {
        const ctx = this.bufferCtx;
        const x = 60;
        const y = 150;

        // Dotted outline where car would be
        ctx.strokeStyle = this.colors.gateFrame;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y - 25, 100, 75);
        ctx.setLineDash([]);

        // "WAITING" text
        ctx.fillStyle = this.colors.gateFrame;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('WAITING...', x + 15, y + 25);
    }

    /**
     * Draw the main character Gato-san
     * @param {GameState} state - Game state
     * @param {number} interpolation - Animation interpolation
     */
    drawGatoSan(state, interpolation) {
        const ctx = this.bufferCtx;
        const x = 180;
        const y = 140;

        // Update animation
        this.gatoAnimTimer += 16; // Approximate frame time
        if (this.gatoAnimTimer > 500) {
            this.gatoFrame = (this.gatoFrame + 1) % 2;
            this.gatoAnimTimer = 0;
        }

        // Simple placeholder character
        // Body (maid dress - navy blue)
        ctx.fillStyle = this.colors.navy;
        ctx.fillRect(x - 15, y, 30, 45);

        // Apron (cream)
        ctx.fillStyle = this.colors.cream;
        ctx.fillRect(x - 10, y + 5, 20, 35);

        // Head
        ctx.fillStyle = this.colors.cream;
        ctx.fillRect(x - 12, y - 25, 24, 25);

        // Hair (green)
        ctx.fillStyle = this.colors.gatoGreen;
        ctx.fillRect(x - 14, y - 30, 28, 15);

        // Cat ears
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 25);
        ctx.lineTo(x - 8, y - 40);
        ctx.lineTo(x - 4, y - 25);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 4, y - 25);
        ctx.lineTo(x + 8, y - 40);
        ctx.lineTo(x + 12, y - 25);
        ctx.fill();

        // Inner ears
        ctx.fillStyle = this.colors.pink;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 27);
        ctx.lineTo(x - 8, y - 35);
        ctx.lineTo(x - 6, y - 27);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 6, y - 27);
        ctx.lineTo(x + 8, y - 35);
        ctx.lineTo(x + 10, y - 27);
        ctx.fill();

        // Eyes (simple dots)
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x - 6, y - 18, 4, 4);
        ctx.fillRect(x + 2, y - 18, 4, 4);

        // Mouth (cute cat smile)
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 10);
        ctx.lineTo(x, y - 8);
        ctx.lineTo(x + 3, y - 10);
        ctx.stroke();

        // Tail
        const tailWave = Math.sin(Date.now() / 200) * 5;
        ctx.fillStyle = this.colors.gatoGreen;
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 30);
        ctx.quadraticCurveTo(x + 30 + tailWave, y + 20, x + 35 + tailWave, y + 35);
        ctx.quadraticCurveTo(x + 30 + tailWave, y + 25, x + 15, y + 35);
        ctx.fill();

        // Tool in hand (if repairing)
        if (state.currentCar) {
            ctx.fillStyle = this.colors.cream;
            ctx.fillRect(x - 25, y + 10, 15, 4);
            ctx.fillRect(x - 28, y + 5, 6, 14);
        }

        // Maid headpiece
        ctx.fillStyle = this.colors.cream;
        ctx.fillRect(x - 10, y - 32, 20, 5);
    }

    /**
     * Draw hired workers
     * @param {Array} workers - Array of Worker instances
     */
    drawWorkers(workers) {
        if (workers.length === 0) return;

        const ctx = this.bufferCtx;
        const startX = 220;
        const startY = 200;
        const spacing = 25;

        // Only show first 4 workers visually
        const visibleWorkers = workers.slice(0, 4);

        visibleWorkers.forEach((worker, index) => {
            const x = startX + (index % 2) * spacing;
            const y = startY + Math.floor(index / 2) * 30;

            // Mini worker sprite
            // Body
            ctx.fillStyle = worker.color;
            ctx.fillRect(x - 6, y, 12, 18);

            // Head
            ctx.fillStyle = this.colors.cream;
            ctx.fillRect(x - 5, y - 10, 10, 10);

            // Ears
            ctx.fillStyle = worker.color;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 8);
            ctx.lineTo(x - 3, y - 15);
            ctx.lineTo(x - 1, y - 8);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + 1, y - 8);
            ctx.lineTo(x + 3, y - 15);
            ctx.lineTo(x + 5, y - 8);
            ctx.fill();
        });

        // If more workers, show count
        if (workers.length > 4) {
            ctx.fillStyle = this.colors.cream;
            ctx.font = '6px "Press Start 2P", monospace';
            ctx.fillText(`+${workers.length - 4}`, startX + 50, startY + 20);
        }
    }

    /**
     * Draw car queue in background
     * @param {Array} carQueue - Array of cars in queue
     */
    drawCarQueue(carQueue) {
        const ctx = this.bufferCtx;
        const startX = 180;
        const y = 250;
        const spacing = 25;

        carQueue.forEach((car, index) => {
            const x = startX + index * spacing;

            // Mini car
            ctx.fillStyle = car.color;
            ctx.fillRect(x, y, 20, 12);
            ctx.fillRect(x + 4, y - 6, 12, 8);

            // Wheels
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(x + 5, y + 12, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 15, y + 12, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Get canvas element for click handling
     * @returns {HTMLCanvasElement} Canvas element
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Convert screen coordinates to game coordinates
     * @param {number} screenX - Screen X
     * @param {number} screenY - Screen Y
     * @returns {Object} Game coordinates {x, y}
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
