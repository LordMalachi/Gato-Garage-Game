/**
 * Game - Main game controller that coordinates all systems
 */
class Game {
    constructor() {
        // Core state
        this.state = new GameState();

        // Systems
        this.clickSystem = new ClickSystem(this.state);
        this.upgradeSystem = new UpgradeSystem(this.state);
        this.workerSystem = new WorkerSystem(this.state);
        this.carQueueSystem = new CarQueueSystem(this.state);

        // Rendering
        this.renderer = new Renderer('game-canvas');

        // UI
        this.uiManager = new UIManager(this.state);
        this.shopUI = new ShopUI(this.upgradeSystem, this.workerSystem);
        this.statsUI = new StatsUI(this.state, this.clickSystem, this.workerSystem);

        // Save manager
        this.saveManager = new SaveManager(this.state);

        // Game loop
        this.gameLoop = new GameLoop(
            (dt) => this.update(dt),
            (interp) => this.render(interp)
        );

        // Setup
        this.setupClickHandler();
        this.setupMenuButtons();
    }

    /**
     * Initialize and start the game
     */
    init() {
        console.log('Initializing Gato Garage...');

        // Try to load saved game
        const offlineProgress = this.saveManager.load();

        if (offlineProgress) {
            console.log('Loaded saved game');
            // State is already loaded, just recalculate
            this.state.recalculateStats();
        } else {
            console.log('Starting new game');
            // New game - spawn initial car
            this.carQueueSystem.forceSpawn();
        }

        // Update UI with current state
        this.uiManager.updateAll();
        this.shopUI.renderUpgrades();
        this.shopUI.renderWorkers();

        // Start systems
        this.statsUI.start();
        this.saveManager.startAutoSave();
        this.gameLoop.start();

        console.log('Gato Garage started!');
    }

    /**
     * Main update function (called with fixed timestep)
     * @param {number} deltaMs - Time since last update in milliseconds
     */
    update(deltaMs) {
        // Update click system (combo decay)
        this.clickSystem.update(deltaMs);

        // Update worker auto-repair
        this.workerSystem.update(deltaMs);

        // Update car queue
        this.carQueueSystem.update(deltaMs);

        // Update UI for current car
        if (this.state.currentCar) {
            this.uiManager.updateRepairProgress(this.state.currentCar.getProgressPercent());
        }

        // Update queue display periodically
        this.uiManager.updateCarQueue(this.state.carQueue);
    }

    /**
     * Render function (called each frame)
     * @param {number} interpolation - Frame interpolation (0-1)
     */
    render(interpolation) {
        this.renderer.render(this.state, interpolation);
    }

    /**
     * Setup click handler on game canvas
     */
    setupClickHandler() {
        const clickArea = document.getElementById('click-area');
        if (!clickArea) {
            console.warn('Click area not found');
            return;
        }

        clickArea.addEventListener('click', (event) => {
            const rect = clickArea.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            this.handleClick(x, y);
        });

        // Also handle touch for future mobile support
        clickArea.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const rect = clickArea.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.handleClick(x, y);
        });
    }

    /**
     * Handle a click/tap on the game area
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    handleClick(x, y) {
        const result = this.clickSystem.handleClick(x, y);

        if (result) {
            // Update car info
            if (this.state.currentCar) {
                this.uiManager.updateCurrentCar(this.state.currentCar);
            }
        }
    }

    /**
     * Setup menu button handlers
     */
    setupMenuButtons() {
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveManager.save();
            });
        }

        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                // TODO: Implement settings modal
                console.log('Settings clicked');
            });
        }
    }

    /**
     * Save and stop the game (for page unload)
     */
    shutdown() {
        this.saveManager.save();
        this.saveManager.stopAutoSave();
        this.statsUI.stop();
        this.gameLoop.stop();
        console.log('Game shutdown');
    }

    /**
     * Pause the game
     */
    pause() {
        this.gameLoop.pause();
    }

    /**
     * Resume the game
     */
    resume() {
        this.gameLoop.resume();
    }

    /**
     * Reset game to initial state
     * @param {boolean} [keepPrestige=false] - Keep prestige progress
     */
    reset(keepPrestige = false) {
        // Save prestige if keeping
        const prestigeData = keepPrestige ? {
            prestigePoints: this.state.prestigePoints,
            prestigeMultiplier: this.state.prestigeMultiplier
        } : null;

        // Reset state
        this.state.reset();

        // Restore prestige
        if (prestigeData) {
            this.state.prestigePoints = prestigeData.prestigePoints;
            this.state.prestigeMultiplier = prestigeData.prestigeMultiplier;
        }

        // Spawn initial car
        this.carQueueSystem.forceSpawn();

        // Update UI
        this.uiManager.updateAll();
        this.shopUI.renderUpgrades();
        this.shopUI.renderWorkers();

        // Delete save
        this.saveManager.deleteSave();

        EventBus.emit(GameEvents.GAME_RESET);
    }
}
