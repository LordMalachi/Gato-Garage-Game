/**
 * ProgressionSystem - Manages XP, garage levels, difficulty tiers, and car unlocks
 * Implements a progression system where players level up by repairing cars,
 * unlock new car types at milestones, and face scaled difficulty in higher tiers
 */
class ProgressionSystem {
    /**
     * Create progression system
     * @param {GameState} gameState - Game state reference
     */
    constructor(gameState) {
        this.state = gameState;
    }

    /**
     * Car unlock milestones - defines which cars unlock at each level
     */
    static CAR_UNLOCKS = {
        1: ['hatchback'],      // Starting car
        3: ['sedan'],          // Early progression
        6: ['suv'],            // Commitment check
        10: ['pickup'],        // First tier transition
        15: ['sportsCar'],     // Mid-game
        22: ['vintage'],       // Requires mixed repairs
        30: ['cyberCar'],      // Late game
        40: ['hypercar']       // Endgame chase
    };

    /**
     * Generate XP table for performance (pre-calculated cumulative XP per level)
     * Formula: XP for level N = 100 * (1.15 ^ (N - 1))
     * Returns cumulative XP required to reach each level
     */
    static generateXPTable() {
        // Level 1 starts at 0 XP
        // Level 2 starts at 100 XP
        // Level N starts at sum(prev)
        const table = [0];
        let cumulative = 0;

        for (let level = 1; level <= 100; level++) {
            const xpForLevel = Math.floor(100 * Math.pow(1.15, level - 1));
            cumulative += xpForLevel;
            table.push(cumulative);
        }

        return table;
    }

    /**
     * Pre-calculated XP table for fast lookup
     */
    static XP_TABLE = ProgressionSystem.generateXPTable();

    /**
     * Award XP to the player and check for level ups
     * @param {number} amount - XP amount to award
     */
    addXP(amount) {
        if (amount <= 0) return;

        const oldLevel = this.state.garageLevel;
        const oldTier = this.state.currentTier;

        // Add XP
        this.state.garageXP += amount;

        // Calculate new level
        const newLevel = this.calculateLevelFromXP(this.state.garageXP);

        // Emit XP earned event
        EventBus.emit(GameEvents.XP_EARNED, {
            amount,
            totalXP: this.state.garageXP,
            currentLevel: newLevel
        });

        // Check for level up
        if (newLevel > oldLevel) {
            this.state.garageLevel = newLevel;

            // Check tier change (every 10 levels)
            const newTier = this.getCurrentTier();
            const tierChanged = newTier > oldTier;

            if (tierChanged) {
                this.state.currentTier = newTier;
            }

            // Check for car unlocks
            this.checkCarUnlocks(newLevel);

            // Emit level up event
            EventBus.emit(GameEvents.LEVEL_UP, {
                oldLevel,
                newLevel,
                tier: newTier
            });

            // Emit tier up event if tier changed
            if (tierChanged) {
                EventBus.emit(GameEvents.TIER_UP, {
                    oldTier,
                    newTier,
                    level: newLevel
                });
            }
        }
    }

    /**
     * Calculate current level from total XP using binary search
     * @param {number} xp - Total XP
     * @returns {number} Current level
     */
    calculateLevelFromXP(xp) {
        const table = ProgressionSystem.XP_TABLE;

        // Binary search: find highest index where table[index] <= xp
        let left = 0;
        let right = table.length - 1;

        while (left < right) {
            const mid = Math.floor((left + right + 1) / 2);
            if (table[mid] <= xp) {
                left = mid;
            } else {
                right = mid - 1;
            }
        }

        // Table index 0 = level 1, index 1 = level 2, etc.
        return left + 1;
    }

    /**
     * Get cumulative XP required to reach a specific level
     * Level 1 = 0 XP (table[0]), Level 2 = 100 XP (table[1]), etc.
     * @param {number} level - Target level (1-based)
     * @returns {number} Cumulative XP required
     */
    getXPForLevel(level) {
        if (level <= 1) return 0;
        const index = level - 1;
        if (index >= ProgressionSystem.XP_TABLE.length) {
            // Extrapolate for very high levels
            const lastIndex = ProgressionSystem.XP_TABLE.length - 1;
            const lastKnownXP = ProgressionSystem.XP_TABLE[lastIndex];
            const extraLevels = index - lastIndex;
            const extraXP = Math.floor(100 * Math.pow(1.15, lastIndex) * extraLevels);
            return lastKnownXP + extraXP;
        }
        return ProgressionSystem.XP_TABLE[index];
    }

    /**
     * Get XP remaining until next level
     * @returns {number} XP needed for next level
     */
    getRemainingXP() {
        const currentLevel = this.state.garageLevel;
        const nextLevelXP = this.getXPForLevel(currentLevel + 1);
        const currentXP = this.state.garageXP;
        return Math.max(0, nextLevelXP - currentXP);
    }

    /**
     * Get current difficulty tier based on garage level
     * Tier increases every 10 levels: 1-9=T1, 10-19=T2, 20-29=T3, etc.
     * @returns {number} Current tier (1-based)
     */
    getCurrentTier() {
        return Math.floor(this.state.garageLevel / 10) + 1;
    }

    /**
     * Get tier scaling multiplier
     * @param {number} tier - Tier number
     * @returns {number} Multiplier (1.0x, 1.5x, 2.0x, etc.)
     */
    getTierMultiplier(tier) {
        return 1 + (tier - 1) * 0.5;
    }

    /**
     * Check and unlock cars at the new level
     * @param {number} newLevel - The new level reached
     */
    checkCarUnlocks(newLevel) {
        const unlocks = ProgressionSystem.CAR_UNLOCKS[newLevel];

        if (!unlocks) return;

        unlocks.forEach(carId => {
            if (!this.state.unlockedCars.includes(carId)) {
                this.state.unlockedCars.push(carId);

                // Get car name for notification
                const carDef = CarData[carId];
                const carName = carDef ? carDef.name : carId;

                EventBus.emit(GameEvents.CAR_UNLOCKED, {
                    carId,
                    carName,
                    level: newLevel
                });
            }
        });
    }

    /**
     * Check if a specific car is unlocked
     * @param {string} carId - Car ID to check
     * @returns {boolean} True if unlocked
     */
    isCarUnlocked(carId) {
        return this.state.unlockedCars.includes(carId);
    }

    /**
     * Get the next car unlock info
     * @returns {Object|null} {carId, carName, level} or null if all unlocked
     */
    getNextUnlock() {
        const currentLevel = this.state.garageLevel;
        const unlockLevels = Object.keys(ProgressionSystem.CAR_UNLOCKS)
            .map(Number)
            .sort((a, b) => a - b);

        // Find next unlock level
        for (const level of unlockLevels) {
            if (level > currentLevel) {
                const carIds = ProgressionSystem.CAR_UNLOCKS[level];
                const carId = carIds[0]; // Take first car of unlock
                const carDef = CarData[carId];

                return {
                    carId,
                    carName: carDef ? carDef.name : carId,
                    level
                };
            }
        }

        return null; // All cars unlocked
    }

    /**
     * Get progression info for UI display
     * @returns {Object} Progression info
     */
    getProgressInfo() {
        const level = this.state.garageLevel;
        const xp = this.state.garageXP;
        const currentLevelXP = this.getXPForLevel(level);
        const nextLevelXP = this.getXPForLevel(level + 1);
        const xpIntoLevel = xp - currentLevelXP;
        const xpForNextLevel = nextLevelXP - currentLevelXP;
        const progress = xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0;
        const tier = this.getCurrentTier();
        const nextUnlock = this.getNextUnlock();

        return {
            level,
            xp: xpIntoLevel,
            nextLevelXP: xpForNextLevel,
            totalXP: this.state.garageXP,
            progress,
            tier,
            tierMultiplier: this.getTierMultiplier(tier),
            nextUnlock,
            unlockedCars: this.state.unlockedCars.length,
            totalCars: Object.keys(CarData).length
        };
    }

    /**
     * Get all unlocked cars for a specific level (for migration)
     * @param {number} level - Level to check
     * @returns {Array<string>} Array of unlocked car IDs
     */
    static getUnlockedCarsForLevel(level) {
        const unlocked = [];
        const unlockLevels = Object.keys(ProgressionSystem.CAR_UNLOCKS)
            .map(Number)
            .sort((a, b) => a - b);

        for (const unlockLevel of unlockLevels) {
            if (unlockLevel <= level) {
                unlocked.push(...ProgressionSystem.CAR_UNLOCKS[unlockLevel]);
            }
        }

        return unlocked;
    }
}
