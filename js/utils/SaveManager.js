/**
 * SaveManager - Handles saving and loading game state to localStorage
 */
class SaveManager {
    /**
     * Create save manager
     * @param {GameState} gameState - Game state reference
     */
    constructor(gameState) {
        this.state = gameState;
        this.saveKey = 'gato-garage-save';
        this.version = 1; // Increment when save format changes
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
    }

    /**
     * Save game state to localStorage
     * @returns {boolean} True if save successful
     */
    save() {
        try {
            const serializedState = this.state.serialize();
            console.log('Saving state:', {
                currency: serializedState.currency,
                upgrades: Object.keys(serializedState.upgrades).length,
                workers: serializedState.workers.length,
                currentCar: serializedState.currentCar?.id,
                carQueue: serializedState.carQueue.length
            });

            const saveData = {
                version: this.version,
                timestamp: Date.now(),
                state: serializedState
            };

            const saveString = JSON.stringify(saveData);
            localStorage.setItem(this.saveKey, saveString);

            EventBus.emit(GameEvents.GAME_SAVED, { timestamp: saveData.timestamp });
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            console.error('Error stack:', error.stack);
            return false;
        }
    }

    /**
     * Load game state from localStorage
     * @returns {Object|null} Offline progress info or null if no save
     */
    load() {
        try {
            const saveString = localStorage.getItem(this.saveKey);
            if (!saveString) {
                console.log('No save data found');
                return null;
            }

            console.log('Loading save data...');
            const saveData = JSON.parse(saveString);
            console.log('Parsed save data:', saveData);

            // Validate save data structure
            if (!saveData.state) {
                console.error('Invalid save data: missing state object');
                return null;
            }

            // Version migration if needed
            if (saveData.version < this.version) {
                this.migrate(saveData);
            }

            // Load state
            console.log('Deserializing state...');
            this.state.deserialize(saveData.state);
            console.log('State after deserialize:', {
                currency: this.state.currency,
                upgrades: this.state.upgrades,
                workers: this.state.workers.length,
                currentCar: this.state.currentCar?.name,
                carQueue: this.state.carQueue.length
            });

            // Calculate offline progress
            const offlineProgress = this.calculateOfflineProgress(saveData.timestamp);

            EventBus.emit(GameEvents.GAME_LOADED, {
                timestamp: saveData.timestamp,
                offlineProgress
            });

            console.log('Game loaded successfully');
            return offlineProgress;
        } catch (error) {
            console.error('Failed to load game:', error);
            console.error('Error stack:', error.stack);
            return null;
        }
    }

    /**
     * Calculate offline progress while player was away
     * @param {number} lastSaveTime - Timestamp of last save
     * @returns {Object} Offline progress info
     */
    calculateOfflineProgress(lastSaveTime) {
        const now = Date.now();
        const offlineTime = now - lastSaveTime;

        // Cap at 8 hours
        const maxOfflineTime = 8 * 60 * 60 * 1000;
        const effectiveTime = Math.min(offlineTime, maxOfflineTime);

        // Only count if away for at least 1 minute
        if (effectiveTime < 60000) {
            return { earnings: 0, time: 0 };
        }

        // Calculate offline earnings at 50% efficiency
        const offlineEfficiency = 0.5;
        const autoRepairRate = this.state.autoRepairRate;

        if (autoRepairRate <= 0) {
            return { earnings: 0, time: effectiveTime };
        }

        // Estimate cars repaired based on average car value and repair cost
        const avgCarValue = 100; // Rough average
        const avgRepairCost = 150; // Rough average

        const totalRepair = autoRepairRate * (effectiveTime / 1000) * offlineEfficiency;
        const carsRepaired = Math.floor(totalRepair / avgRepairCost);
        const earnings = Math.floor(carsRepaired * avgCarValue * this.state.getCarValueMultiplier() * this.state.incomeMultiplier);

        // Apply earnings
        if (earnings > 0) {
            this.state.currency += earnings;
            this.state.totalEarned += earnings;

            EventBus.emit(GameEvents.OFFLINE_EARNINGS, {
                time: effectiveTime,
                earnings,
                carsRepaired
            });
        }

        return {
            earnings,
            time: effectiveTime,
            carsRepaired
        };
    }

    /**
     * Migrate save data from older versions
     * @param {Object} saveData - Old save data
     */
    migrate(saveData) {
        console.log(`Migrating save from version ${saveData.version} to ${this.version}`);

        // Add migration logic here as versions change
        // For now, just update version
        saveData.version = this.version;
    }

    /**
     * Start auto-save timer
     */
    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveTimer = setInterval(() => {
            this.save();
        }, this.autoSaveInterval);
        console.log('Auto-save started');
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * Export save as Base64 string
     * @returns {string} Base64 encoded save
     */
    exportSave() {
        const saveString = localStorage.getItem(this.saveKey);
        if (!saveString) return '';

        try {
            return btoa(saveString);
        } catch (error) {
            console.error('Failed to export save:', error);
            return '';
        }
    }

    /**
     * Import save from Base64 string
     * @param {string} base64String - Base64 encoded save
     * @returns {boolean} True if import successful
     */
    importSave(base64String) {
        try {
            const saveString = atob(base64String);
            JSON.parse(saveString); // Validate JSON
            localStorage.setItem(this.saveKey, saveString);
            return this.load() !== null;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }

    /**
     * Delete save data
     * @returns {boolean} True if delete successful
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('Save deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    /**
     * Check if save exists
     * @returns {boolean} True if save exists
     */
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }
}
