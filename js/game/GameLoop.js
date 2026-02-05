/**
 * GameLoop - Fixed timestep game loop with variable rendering
 * Ensures consistent game logic regardless of frame rate
 */
class GameLoop {
    /**
     * Create a new game loop
     * @param {Function} updateFn - Update function called with fixed timestep
     * @param {Function} renderFn - Render function called each frame
     */
    constructor(updateFn, renderFn) {
        this.update = updateFn;
        this.render = renderFn;

        // Timing configuration
        this.targetFPS = 60;
        this.timestep = 1000 / this.targetFPS; // ~16.67ms per update
        this.maxFrameTime = 250; // Cap to prevent spiral of death

        // State
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameId = null;

        // Performance tracking
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;

        // Bind the loop function to preserve context
        this.loop = this.loop.bind(this);
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.frameId = requestAnimationFrame(this.loop);

        console.log('Game loop started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        if (!this.running) return;

        this.running = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }

        console.log('Game loop stopped');
    }

    /**
     * Pause the game loop (continues rendering but no updates)
     */
    pause() {
        this.paused = true;
    }

    /**
     * Resume from paused state
     */
    resume() {
        if (this.paused) {
            this.paused = false;
            this.lastTime = performance.now();
            this.accumulator = 0;
        }
    }

    /**
     * Toggle pause state
     * @returns {boolean} New paused state
     */
    togglePause() {
        if (this.paused) {
            this.resume();
        } else {
            this.pause();
        }
        return this.paused;
    }

    /**
     * Main loop function
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    loop(currentTime) {
        if (!this.running) return;

        // Schedule next frame immediately
        this.frameId = requestAnimationFrame(this.loop);

        // Calculate frame time
        let frameTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap frame time to prevent spiral of death
        if (frameTime > this.maxFrameTime) {
            frameTime = this.maxFrameTime;
        }

        // Update FPS counter
        this.updateFPS(currentTime);

        // If paused, only render
        if (this.paused) {
            this.render(0);
            return;
        }

        // Accumulate time
        this.accumulator += frameTime;

        // Fixed timestep updates
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }

        // Render with interpolation factor for smooth animations
        // interpolation = how far we are into the next update (0-1)
        const interpolation = this.accumulator / this.timestep;
        this.render(interpolation);
    }

    /**
     * Update FPS counter
     * @param {number} currentTime - Current timestamp
     */
    updateFPS(currentTime) {
        this.frameCount++;

        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
    }

    /**
     * Get current FPS
     * @returns {number} Frames per second
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Check if loop is running
     * @returns {boolean} Running state
     */
    isRunning() {
        return this.running;
    }

    /**
     * Check if loop is paused
     * @returns {boolean} Paused state
     */
    isPaused() {
        return this.paused;
    }
}
