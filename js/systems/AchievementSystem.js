/**
 * AchievementSystem - Tracks and awards achievements based on game progress
 */
class AchievementSystem {
    /**
     * Create achievement system
     * @param {GameState} gameState - Game state reference
     */
    constructor(gameState) {
        this.state = gameState;

        // Subscribe to relevant events
        EventBus.on(GameEvents.CLICK_PERFORMED, () => this.checkAchievements());
        EventBus.on(GameEvents.CURRENCY_EARNED, () => this.checkAchievements());
        EventBus.on(GameEvents.CAR_REPAIRED, () => this.checkAchievements());
        EventBus.on(GameEvents.WORKER_HIRED, () => this.checkAchievements());
        EventBus.on(GameEvents.UPGRADE_PURCHASED, () => this.checkAchievements());
    }

    /**
     * Check all achievements and unlock any that are newly earned
     */
    checkAchievements() {
        const achievements = getAchievementList();

        for (const achievement of achievements) {
            // Skip already unlocked
            if (this.isUnlocked(achievement.id)) {
                continue;
            }

            // Check condition
            if (this.checkCondition(achievement.condition)) {
                this.unlock(achievement);
            }
        }
    }

    /**
     * Check if an achievement condition is met
     * @param {Object} condition - Condition object with type and value
     * @returns {boolean} True if condition is met
     */
    checkCondition(condition) {
        switch (condition.type) {
            case 'totalClicks':
                return this.state.totalClicks >= condition.value;

            case 'totalEarned':
                return this.state.totalEarned >= condition.value;

            case 'carsRepaired':
                return this.state.carsRepaired >= condition.value;

            case 'totalWorkers':
                return this.state.workers.length >= condition.value;

            case 'totalUpgrades':
                return this.getTotalUpgradesPurchased() >= condition.value;

            default:
                console.warn(`Unknown achievement condition type: ${condition.type}`);
                return false;
        }
    }

    /**
     * Get total number of upgrade levels purchased
     * @returns {number} Total upgrade levels
     */
    getTotalUpgradesPurchased() {
        let total = 0;
        for (const level of Object.values(this.state.upgrades)) {
            total += level;
        }
        return total;
    }

    /**
     * Check if an achievement is unlocked
     * @param {string} achievementId - Achievement ID
     * @returns {boolean} True if unlocked
     */
    isUnlocked(achievementId) {
        return !!this.state.achievements[achievementId];
    }

    /**
     * Unlock an achievement
     * @param {Object} achievement - Achievement definition
     */
    unlock(achievement) {
        // Record unlock timestamp
        this.state.achievements[achievement.id] = Date.now();

        // Emit event for UI notification
        EventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, {
            achievement,
            timestamp: Date.now()
        });

        console.log(`🏆 Achievement unlocked: ${achievement.name}`);
    }

    /**
     * Get achievement info for UI display
     * @param {string} achievementId - Achievement ID
     * @returns {Object|null} Achievement info or null
     */
    getAchievementInfo(achievementId) {
        const achievement = AchievementData[achievementId];
        if (!achievement) return null;

        return {
            ...achievement,
            unlocked: this.isUnlocked(achievementId),
            unlockedAt: this.state.achievements[achievementId] || null
        };
    }

    /**
     * Get all achievements with unlock status
     * @returns {Array} Array of achievement info objects
     */
    getAllAchievementInfo() {
        return getAchievementList().map(a => this.getAchievementInfo(a.id));
    }

    /**
     * Get count of unlocked achievements
     * @returns {Object} Object with unlocked and total counts
     */
    getProgress() {
        const all = getAchievementList();
        const unlocked = all.filter(a => this.isUnlocked(a.id)).length;
        return {
            unlocked,
            total: all.length,
            percent: Math.floor((unlocked / all.length) * 100)
        };
    }
}
