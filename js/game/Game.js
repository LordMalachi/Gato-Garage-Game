/**
 * Game - Main game controller that coordinates all systems
 */
class Game {
    constructor() {
        // Core state
        this.state = new GameState();

        // Progression system (before other systems that depend on it)
        this.progressionSystem = new ProgressionSystem(this.state);

        // Systems
        this.clickSystem = new ClickSystem(this.state);
        this.upgradeSystem = new UpgradeSystem(this.state);
        this.workerSystem = new WorkerSystem(this.state);
        this.carQueueSystem = new CarQueueSystem(this.state, this.progressionSystem);
        this.achievementSystem = new AchievementSystem(this.state);

        // Initialize repair completion service
        RepairCompletionService.init(this.state, this.progressionSystem);

        // Rendering
        this.renderer = new Renderer('game-canvas');

        // UI
        this.uiManager = new UIManager(this.state);
        this.shopUI = new ShopUI(this.upgradeSystem, this.workerSystem);
        this.statsUI = new StatsUI(this.state, this.clickSystem, this.workerSystem);

        // Save manager
        this.saveManager = new SaveManager(this.state);
        this.audioManager = new AudioManager();

        // Game loop
        this.gameLoop = new GameLoop(
            (dt) => this.update(dt),
            (interp) => this.render(interp)
        );

        // Settings modal state
        this.settingsModal = null;
        this.confirmModal = null;
        this.confirmCallback = null;
        this.startModal = null;
        this.runtimeStarted = false;

        // Setup
        this.setupClickHandler();
        this.setupMenuButtons();
        this.setupSettingsModal();
        this.setupStartModal();
    }

    /**
     * Initialize and start the game
     */
    init() {
        console.log('Initializing Gato Garage...');

        // Initial UI render before start choice
        this.refreshUI();
        this.updateSaveStatus();

        if (this.saveManager.hasSave()) {
            this.showStartModal();
        } else {
            this.startNewGame();
        }

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
        this.uiManager.updateQueueStatus(this.carQueueSystem.getQueueInfo());
        this.uiManager.updateCombo(this.clickSystem.getCombo());

        // Update progression UI
        this.uiManager.updateProgressionUI(this.progressionSystem.getProgressInfo());
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
        const canvas = this.renderer.canvas;
        if (!clickArea || !canvas) {
            console.warn('Click area or canvas not found');
            return;
        }

        const handlePointer = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            // Ignore clicks/taps outside the rendered canvas area.
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                return;
            }

            this.handleClick(x, y);
        };

        clickArea.addEventListener('click', (event) => {
            handlePointer(event.clientX, event.clientY);
        });

        // Also handle touch for future mobile support
        clickArea.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            handlePointer(touch.clientX, touch.clientY);
        }, { passive: false });
    }

    /**
     * Handle a click/tap on the game area
     * @param {number} screenX - Screen X coordinate (relative to click area)
     * @param {number} screenY - Screen Y coordinate (relative to click area)
     */
    handleClick(screenX, screenY) {
        // Convert screen coordinates to internal resolution coordinates
        // The renderer uses internal resolution (320x288) but canvas display size varies
        const canvas = this.renderer.canvas;
        const internalWidth = this.renderer.internalWidth;
        const internalHeight = this.renderer.internalHeight;

        // Use actual rendered display size
        const rect = canvas.getBoundingClientRect();
        const displayWidth = rect.width || canvas.width;
        const displayHeight = rect.height || canvas.height;

        // Scale screen coordinates to internal resolution
        const x = (screenX / displayWidth) * internalWidth;
        const y = (screenY / displayHeight) * internalHeight;

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
                this.openSettings();
            });
        }
    }

    /**
     * Setup settings modal handlers
     */
    setupSettingsModal() {
        this.settingsModal = document.getElementById('settings-modal');
        this.confirmModal = document.getElementById('confirm-modal');

        // Close button
        const closeBtn = document.getElementById('settings-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSettings());
        }

        // Load game button
        const loadBtn = document.getElementById('load-game-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadSavedGame());
        }

        // Export save button
        const exportBtn = document.getElementById('export-save-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSave());
        }

        // Import save button
        const importBtn = document.getElementById('import-save-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importSave());
        }

        // Clear saves button
        const clearBtn = document.getElementById('clear-save-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.showConfirm(
                    'Clear All Saves?',
                    'This will permanently delete all saved progress. This cannot be undone!',
                    () => this.clearAllSaves()
                );
            });
        }

        // Music controls
        const musicVolume = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        const musicMute = document.getElementById('music-mute');
        const { volume, muted } = this.audioManager.getSettings();

        if (musicVolume) {
            musicVolume.value = String(Math.round(volume * 100));
            musicVolume.addEventListener('input', (event) => {
                const percent = Number(event.target.value) || 0;
                this.audioManager.setVolume(percent / 100);
                this.updateMusicVolumeLabel(percent);
            });
        }

        if (musicVolumeValue) {
            this.updateMusicVolumeLabel(Math.round(volume * 100));
        }

        if (musicMute) {
            musicMute.checked = muted;
            musicMute.addEventListener('change', (event) => {
                this.audioManager.setMuted(event.target.checked);
            });
        }

        // Confirm modal buttons
        const confirmYes = document.getElementById('confirm-yes-btn');
        const confirmNo = document.getElementById('confirm-no-btn');
        if (confirmYes) {
            confirmYes.addEventListener('click', () => {
                if (this.confirmCallback) {
                    this.confirmCallback();
                }
                this.hideConfirm();
            });
        }
        if (confirmNo) {
            confirmNo.addEventListener('click', () => this.hideConfirm());
        }

        // Close modals on background click
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettings();
                }
            });
        }
        if (this.confirmModal) {
            this.confirmModal.addEventListener('click', (e) => {
                if (e.target === this.confirmModal) {
                    this.hideConfirm();
                }
            });
        }
    }

    /**
     * Setup startup modal handlers
     */
    setupStartModal() {
        this.startModal = document.getElementById('start-modal');
        const continueBtn = document.getElementById('continue-save-btn');
        const newGameBtn = document.getElementById('new-game-btn');
        const startMessage = document.getElementById('start-message');

        if (startMessage) {
            startMessage.textContent = this.saveManager.hasSave()
                ? 'Save data found. Continue your garage or start over?'
                : 'Start a new garage?';
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.continueFromSave());
        }

        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.startNewGame());
        }
    }

    /**
     * Start periodic systems once
     */
    startRuntime() {
        if (this.runtimeStarted) return;
        this.runtimeStarted = true;
        this.statsUI.start();
        this.saveManager.startAutoSave();
        this.gameLoop.start();
        this.audioManager.start();
    }

    /**
     * Refresh all game-facing UI
     */
    refreshUI() {
        this.uiManager.updateAll();
        this.shopUI.renderUpgrades();
        this.shopUI.renderWorkers();
        this.statsUI.forceUpdate();
    }

    /**
     * Ensure the player has a current car after state loads
     */
    ensureActiveCar() {
        if (!this.state.currentCar && this.state.carQueue.length === 0) {
            this.carQueueSystem.forceSpawn();
        } else if (!this.state.currentCar && this.state.carQueue.length > 0) {
            this.state.currentCar = this.state.carQueue.shift();
        }
    }

    /**
     * Show startup modal
     */
    showStartModal() {
        if (this.startModal) {
            this.startModal.classList.remove('hidden');
        }
    }

    /**
     * Hide startup modal
     */
    hideStartModal() {
        if (this.startModal) {
            this.startModal.classList.add('hidden');
        }
    }

    /**
     * Start a new game run
     */
    startNewGame() {
        this.hideStartModal();
        this.state.reset();
        this.carQueueSystem.forceSpawn();
        this.refreshUI();
        EventBus.emit(GameEvents.NOTIFICATION, { message: 'Started a new garage run!' });
        this.startRuntime();
    }

    /**
     * Continue from local save
     */
    continueFromSave() {
        const offlineProgress = this.saveManager.load();
        if (offlineProgress === null) {
            EventBus.emit(GameEvents.NOTIFICATION, { message: 'Save load failed. Starting new game.' });
            this.startNewGame();
            return;
        }

        this.state.recalculateStats();
        this.ensureActiveCar();
        this.refreshUI();
        this.hideStartModal();
        EventBus.emit(GameEvents.NOTIFICATION, { message: 'Loaded saved game!' });

        if (offlineProgress.earnings > 0) {
            EventBus.emit(GameEvents.OFFLINE_EARNINGS, offlineProgress);
        }

        this.startRuntime();
    }

    /**
     * Open settings modal
     */
    openSettings() {
        this.updateSaveStatus();
        this.updateMusicSettings();
        if (this.settingsModal) {
            this.settingsModal.classList.remove('hidden');
        }
    }

    /**
     * Sync music settings controls with current values
     */
    updateMusicSettings() {
        const musicVolume = document.getElementById('music-volume');
        const musicMute = document.getElementById('music-mute');
        const { volume, muted } = this.audioManager.getSettings();

        if (musicVolume) {
            const percent = Math.round(volume * 100);
            musicVolume.value = String(percent);
            this.updateMusicVolumeLabel(percent);
        }

        if (musicMute) {
            musicMute.checked = muted;
        }
    }

    /**
     * Update music volume label text
     * @param {number} percent - Volume percent (0-100)
     */
    updateMusicVolumeLabel(percent) {
        const musicVolumeValue = document.getElementById('music-volume-value');
        if (musicVolumeValue) {
            musicVolumeValue.textContent = `${percent}%`;
        }
    }

    /**
     * Close settings modal
     */
    closeSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('hidden');
        }
    }

    /**
     * Update save status display in settings
     */
    updateSaveStatus() {
        const statusEl = document.getElementById('save-status');
        const loadBtn = document.getElementById('load-game-btn');

        if (statusEl) {
            if (this.saveManager.hasSave()) {
                statusEl.textContent = 'Save data found!';
                statusEl.className = 'save-status has-save';
                if (loadBtn) loadBtn.disabled = false;
            } else {
                statusEl.textContent = 'No saved game found.';
                statusEl.className = 'save-status no-save';
                if (loadBtn) loadBtn.disabled = true;
            }
        }
    }

    /**
     * Load saved game from settings
     */
    loadSavedGame() {
        if (!this.saveManager.hasSave()) {
            EventBus.emit(GameEvents.NOTIFICATION, { message: 'No save data found!' });
            return;
        }

        this.showConfirm(
            'Load Saved Game?',
            'This will replace your current progress with the saved game.',
            () => {
                console.log('Attempting to load saved game...');
                const offlineProgress = this.saveManager.load();

                // offlineProgress can be { earnings: 0, time: 0 } which is truthy
                // We need to check if load actually succeeded
                if (offlineProgress !== null) {
                    console.log('Load returned:', offlineProgress);

                    // Recalculate all stats from loaded data
                    this.state.recalculateStats();
                    console.log('Stats recalculated:', {
                        clickPower: this.state.clickPower,
                        autoRepairRate: this.state.autoRepairRate,
                        currency: this.state.currency
                    });

                    this.ensureActiveCar();
                    this.refreshUI();
                    this.uiManager.updateQueueStatus(this.carQueueSystem.getQueueInfo());

                    EventBus.emit(GameEvents.NOTIFICATION, { message: 'Game loaded!' });
                    this.closeSettings();

                    // Show offline earnings if any
                    if (offlineProgress.earnings > 0) {
                        EventBus.emit(GameEvents.OFFLINE_EARNINGS, offlineProgress);
                    }
                } else {
                    console.error('Load failed - returned null');
                    EventBus.emit(GameEvents.NOTIFICATION, { message: 'Failed to load save!' });
                }
            }
        );
    }

    /**
     * Export save to textarea
     */
    exportSave() {
        // Save current state first
        this.saveManager.save();

        const exportData = this.saveManager.exportSave();
        const textarea = document.getElementById('save-data-text');

        if (textarea && exportData) {
            textarea.value = exportData;
            textarea.select();
            EventBus.emit(GameEvents.NOTIFICATION, { message: 'Save exported! Copy the text.' });
        } else {
            EventBus.emit(GameEvents.NOTIFICATION, { message: 'No save to export!' });
        }
    }

    /**
     * Import save from textarea
     */
    importSave() {
        const textarea = document.getElementById('save-data-text');
        const importData = textarea?.value?.trim();

        if (!importData) {
            EventBus.emit(GameEvents.NOTIFICATION, { message: 'Paste save data first!' });
            return;
        }

        this.showConfirm(
            'Import Save?',
            'This will replace your current progress with the imported save.',
            () => {
                const success = this.saveManager.importSave(importData);

                if (success) {
                    this.state.recalculateStats();
                    this.ensureActiveCar();
                    this.refreshUI();
                    this.updateSaveStatus();

                    EventBus.emit(GameEvents.NOTIFICATION, { message: 'Save imported!' });
                    textarea.value = '';
                    this.closeSettings();
                } else {
                    EventBus.emit(GameEvents.NOTIFICATION, { message: 'Invalid save data!' });
                }
            }
        );
    }

    /**
     * Clear all saves
     */
    clearAllSaves() {
        this.saveManager.deleteSave();
        this.updateSaveStatus();
        EventBus.emit(GameEvents.NOTIFICATION, { message: 'All saves cleared!' });
    }

    /**
     * Show confirmation modal
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {Function} callback - Function to call on confirm
     */
    showConfirm(title, message, callback) {
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        this.confirmCallback = callback;

        if (this.confirmModal) {
            this.confirmModal.classList.remove('hidden');
        }
    }

    /**
     * Hide confirmation modal
     */
    hideConfirm() {
        if (this.confirmModal) {
            this.confirmModal.classList.add('hidden');
        }
        this.confirmCallback = null;
    }

    /**
     * Save and stop the game (for page unload)
     */
    shutdown() {
        this.saveManager.save();
        this.saveManager.stopAutoSave();
        this.statsUI.stop();
        this.gameLoop.stop();
        this.audioManager.stop();
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
