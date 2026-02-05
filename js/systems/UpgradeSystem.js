/**
 * UpgradeSystem - Handles purchasing and applying upgrades
 */
class UpgradeSystem {
    /**
     * Create upgrade system
     * @param {GameState} gameState - Game state reference
     */
    constructor(gameState) {
        this.state = gameState;
    }

    /**
     * Get the cost of an upgrade at the current level
     * @param {string} upgradeId - Upgrade ID
     * @returns {number} Cost for next level
     */
    getCost(upgradeId) {
        const upgrade = UpgradeData[upgradeId];
        if (!upgrade) return Infinity;

        const currentLevel = this.state.getUpgradeLevel(upgradeId);
        return calculateUpgradeCost(upgrade, currentLevel);
    }

    /**
     * Check if an upgrade can be purchased
     * @param {string} upgradeId - Upgrade ID
     * @returns {boolean} True if can purchase
     */
    canPurchase(upgradeId) {
        const upgrade = UpgradeData[upgradeId];
        if (!upgrade) return false;

        const currentLevel = this.state.getUpgradeLevel(upgradeId);

        // Check max level
        if (currentLevel >= upgrade.maxLevel) {
            return false;
        }

        // Check affordability
        const cost = this.getCost(upgradeId);
        return this.state.canAfford(cost);
    }

    /**
     * Check if an upgrade is at max level
     * @param {string} upgradeId - Upgrade ID
     * @returns {boolean} True if maxed
     */
    isMaxed(upgradeId) {
        const upgrade = UpgradeData[upgradeId];
        if (!upgrade) return true;

        return this.state.getUpgradeLevel(upgradeId) >= upgrade.maxLevel;
    }

    /**
     * Purchase an upgrade
     * @param {string} upgradeId - Upgrade ID
     * @returns {boolean} True if purchase successful
     */
    purchase(upgradeId) {
        if (!this.canPurchase(upgradeId)) {
            return false;
        }

        const upgrade = UpgradeData[upgradeId];
        const cost = this.getCost(upgradeId);
        const currentLevel = this.state.getUpgradeLevel(upgradeId);

        // Spend currency
        if (!this.state.spendCurrency(cost)) {
            return false;
        }

        // Increase level
        const newLevel = currentLevel + 1;
        this.state.setUpgradeLevel(upgradeId, newLevel);

        // Apply effect
        this.state.applyUpgradeEffect(upgrade.effect);

        // Emit event
        EventBus.emit(GameEvents.UPGRADE_PURCHASED, {
            upgradeId,
            newLevel,
            cost,
            upgrade
        });

        EventBus.emit(GameEvents.CLICK_POWER_CHANGED, this.state.clickPower);

        return true;
    }

    /**
     * Get upgrade info for UI display
     * @param {string} upgradeId - Upgrade ID
     * @returns {Object} Upgrade info object
     */
    getUpgradeInfo(upgradeId) {
        const upgrade = UpgradeData[upgradeId];
        if (!upgrade) return null;

        const currentLevel = this.state.getUpgradeLevel(upgradeId);
        const cost = this.getCost(upgradeId);
        const isMaxed = currentLevel >= upgrade.maxLevel;

        return {
            id: upgrade.id,
            name: upgrade.name,
            description: upgrade.description,
            level: currentLevel,
            maxLevel: upgrade.maxLevel,
            cost,
            canAfford: this.state.canAfford(cost),
            canPurchase: this.canPurchase(upgradeId),
            isMaxed,
            effect: upgrade.effect
        };
    }

    /**
     * Get all upgrades with current info
     * @returns {Array} Array of upgrade info objects
     */
    getAllUpgradeInfo() {
        return getUpgradeList().map(upgrade => this.getUpgradeInfo(upgrade.id));
    }
}
