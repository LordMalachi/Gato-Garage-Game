/**
 * GameState - Central state management for all game data
 * All game state flows through this object
 */
class GameState {
    constructor() {
        this.reset();
    }

    /**
     * Reset state to initial values
     */
    reset() {
        // Currency
        this.currency = 0;
        this.totalEarned = 0;
        this.totalSpent = 0;

        // Stats
        this.carsRepaired = 0;

        // Click stats
        this.totalClicks = 0;
        this.clickPower = 1; // Base repair per click

        // Multipliers and bonuses
        this.carValueBonus = 0;      // Additive bonus to car value (%)
        this.incomeMultiplier = 1;   // Multiplicative bonus to all income

        // Upgrades (id -> level)
        this.upgrades = {};

        // Achievements (id -> unlock timestamp)
        this.achievements = {};

        // Workers
        this.workers = []; // Array of Worker instances
        this.workerCounts = {}; // id -> count (for cost calculation)

        // Cars
        this.currentCar = null;
        this.carQueue = []; // Array of Car instances
        this.currentCarStartTime = null;
        this.lastCarRepairedAt = 0;

        // Auto-repair rate (calculated from workers)
        this.autoRepairRate = 0;

        // Time tracking
        this.lastSaveTime = Date.now();
        this.totalPlayTime = 0;
        this.sessionStartTime = Date.now();

        // Progression
        this.garageXP = 0;
        this.garageLevel = 1;
        this.currentTier = 1;
        this.unlockedCars = ['hatchback']; // Start with only starter car

        // Prestige
        this.prestigeCurrency = 0; // "Gato Nip"
        this.lifetimeEarnings = 0; // Total earned across all runs
        this.prestigeMultiplier = 1; // Multiplier from prestige
    }

    /**
     * Add currency to the player
     * @param {number} amount - Base amount to add
     * @returns {number} Actual amount added (after multipliers)
     */
    addCurrency(amount) {
        const adjustedAmount = Math.floor(amount * this.incomeMultiplier * this.prestigeMultiplier);
        this.currency += adjustedAmount;
        this.totalEarned += adjustedAmount;
        this.lifetimeEarnings += adjustedAmount;
        EventBus.emit(GameEvents.CURRENCY_CHANGED, this.currency);
        EventBus.emit(GameEvents.CURRENCY_EARNED, adjustedAmount);
        return adjustedAmount;
    }

    /**
     * Spend currency
     * @param {number} amount - Amount to spend
     * @returns {boolean} True if successful
     */
    spendCurrency(amount) {
        if (this.currency >= amount) {
            this.currency -= amount;
            this.totalSpent += amount;
            EventBus.emit(GameEvents.CURRENCY_CHANGED, this.currency);
            EventBus.emit(GameEvents.CURRENCY_SPENT, amount);
            return true;
        }
        return false;
    }

    /**
     * Check if player can afford an amount
     * @param {number} amount - Amount to check
     * @returns {boolean} True if affordable
     */
    canAfford(amount) {
        return this.currency >= amount;
    }

    /**
     * Get the effective value multiplier for cars
     * @returns {number} Value multiplier (1 + bonuses)
     */
    getCarValueMultiplier() {
        return 1 + this.carValueBonus;
    }

    /**
     * Calculate total auto-repair rate from all workers
     * @returns {number} Total repair per second
     */
    calculateAutoRepairRate() {
        this.autoRepairRate = this.workers.reduce(
            (total, worker) => total + worker.repairRate,
            0
        );
        return this.autoRepairRate;
    }

    /**
     * Get current session play time
     * @returns {number} Time in milliseconds
     */
    getSessionTime() {
        return Date.now() - this.sessionStartTime;
    }

    /**
     * Get upgrade level
     * @param {string} upgradeId - Upgrade ID
     * @returns {number} Current level (0 if not purchased)
     */
    getUpgradeLevel(upgradeId) {
        return this.upgrades[upgradeId] || 0;
    }

    /**
     * Set upgrade level
     * @param {string} upgradeId - Upgrade ID
     * @param {number} level - New level
     */
    setUpgradeLevel(upgradeId, level) {
        this.upgrades[upgradeId] = level;
    }

    /**
     * Get count of a worker type owned
     * @param {string} workerId - Worker ID
     * @returns {number} Count owned
     */
    getWorkerCount(workerId) {
        return this.workerCounts[workerId] || 0;
    }

    /**
     * Serialize state for saving
     * @returns {Object} Serializable state object
     */
    serialize() {
        return {
            // Currency
            currency: this.currency,
            totalEarned: this.totalEarned,
            totalSpent: this.totalSpent,

            // Clicks
            totalClicks: this.totalClicks,

            // Stats
            carsRepaired: this.carsRepaired,

            // Upgrades
            upgrades: { ...this.upgrades },

            // Achievements
            achievements: { ...this.achievements },

            // Workers (serialize each)
            workers: this.workers.map(w => w.serialize()),
            workerCounts: { ...this.workerCounts },

            // Current car and queue
            currentCar: this.currentCar ? this.currentCar.serialize() : null,
            carQueue: this.carQueue.map(c => c.serialize()),

            // Time
            lastSaveTime: Date.now(),
            totalPlayTime: this.totalPlayTime + this.getSessionTime(),

            // Progression
            garageXP: this.garageXP,
            garageLevel: this.garageLevel,
            currentTier: this.currentTier,
            unlockedCars: [...this.unlockedCars],

            // Prestige
            prestigeCurrency: this.prestigeCurrency,
            lifetimeEarnings: this.lifetimeEarnings
        };
    }

    /**
     * Load state from saved data
     * @param {Object} data - Saved state object
     */
    deserialize(data) {
        // Currency
        this.currency = data.currency || 0;
        this.totalEarned = data.totalEarned || 0;
        this.totalSpent = data.totalSpent || 0;

        // Clicks
        this.totalClicks = data.totalClicks || 0;

        // Stats
        this.carsRepaired = data.carsRepaired || 0;

        // Upgrades
        this.upgrades = data.upgrades || {};

        // Achievements
        this.achievements = data.achievements || {};

        // Workers
        this.workers = (data.workers || []).map(w => Worker.deserialize(w));
        this.workerCounts = data.workerCounts || {};

        // Cars
        this.currentCar = data.currentCar ? Car.deserialize(data.currentCar) : null;
        this.carQueue = (data.carQueue || []).map(c => Car.deserialize(c));
        this.currentCarStartTime = this.currentCar ? Date.now() : null;
        this.lastCarRepairedAt = 0;

        // Time
        this.lastSaveTime = data.lastSaveTime || Date.now();
        this.totalPlayTime = data.totalPlayTime || 0;
        this.sessionStartTime = Date.now();

        // Progression
        this.garageXP = data.garageXP || 0;
        this.garageLevel = data.garageLevel || 1;
        this.currentTier = data.currentTier || 1;
        this.unlockedCars = data.unlockedCars || ['hatchback'];

        // Prestige
        this.prestigeCurrency = data.prestigeCurrency || 0;
        this.lifetimeEarnings = data.lifetimeEarnings || this.totalEarned; // Fallback for old saves

        // Recalculate derived values
        this.recalculateStats();
    }

    /**
     * Recalculate all derived stats from upgrades and workers
     */
    recalculateStats() {
        // Reset to base values
        this.clickPower = 1;
        this.carValueBonus = 0;
        this.incomeMultiplier = 1;

        // Calculate prestige multiplier (e.g., 2% per nip)
        this.prestigeMultiplier = 1 + (this.prestigeCurrency * 0.05);

        // Apply all upgrade effects
        for (const [upgradeId, level] of Object.entries(this.upgrades)) {
            const upgradeDef = UpgradeData[upgradeId];
            if (!upgradeDef) continue;

            for (let i = 0; i < level; i++) {
                this.applyUpgradeEffect(upgradeDef.effect);
            }
        }

        // Calculate auto-repair rate
        this.calculateAutoRepairRate();
    }

    /**
     * Apply a single upgrade effect
     * @param {Object} effect - Effect definition
     */
    applyUpgradeEffect(effect) {
        switch (effect.type) {
            case 'clickPower':
                this.clickPower += effect.value;
                break;
            case 'carValueBonus':
                this.carValueBonus += effect.value;
                break;
            case 'incomeMultiplier':
                this.incomeMultiplier += effect.value;
                break;
        }
    }
}
