/**
 * NipShopSystem - Handles permanent meta upgrades purchased with Gato Nip.
 */
class NipShopSystem {
    /**
     * @param {GameState} gameState - State reference
     */
    constructor(gameState) {
        this.state = gameState;
    }

    /**
     * Get upgrade cost at current level.
     * @param {string} upgradeId - Nip upgrade ID
     * @returns {number} Cost for next level
     */
    getCost(upgradeId) {
        const upgrade = NipUpgradeData[upgradeId];
        if (!upgrade) return Infinity;
        const level = this.state.getNipUpgradeLevel(upgradeId);
        return calculateNipUpgradeCost(upgrade, level);
    }

    /**
     * Check if an upgrade can be purchased.
     * @param {string} upgradeId - Nip upgrade ID
     * @returns {boolean} True if purchase is possible
     */
    canPurchase(upgradeId) {
        const upgrade = NipUpgradeData[upgradeId];
        if (!upgrade) return false;

        const level = this.state.getNipUpgradeLevel(upgradeId);
        if (level >= upgrade.maxLevel) return false;

        const cost = this.getCost(upgradeId);
        return this.state.prestigeCurrency >= cost;
    }

    /**
     * Purchase one level of a Nip upgrade.
     * @param {string} upgradeId - Nip upgrade ID
     * @returns {boolean} True if purchased
     */
    purchase(upgradeId) {
        if (!this.canPurchase(upgradeId)) return false;

        const upgrade = NipUpgradeData[upgradeId];
        const cost = this.getCost(upgradeId);
        const currentLevel = this.state.getNipUpgradeLevel(upgradeId);

        if (!this.state.spendPrestigeCurrency(cost)) return false;

        const newLevel = currentLevel + 1;
        this.state.setNipUpgradeLevel(upgradeId, newLevel);
        this.state.recalculateStats();

        EventBus.emit(GameEvents.NIP_UPGRADE_PURCHASED, {
            upgradeId,
            newLevel,
            cost,
            upgrade
        });

        return true;
    }

    /**
     * Get display data for a Nip upgrade.
     * @param {string} upgradeId - Nip upgrade ID
     * @returns {Object|null} Upgrade display info
     */
    getUpgradeInfo(upgradeId) {
        const upgrade = NipUpgradeData[upgradeId];
        if (!upgrade) return null;

        const level = this.state.getNipUpgradeLevel(upgradeId);
        const cost = this.getCost(upgradeId);
        const isMaxed = level >= upgrade.maxLevel;
        const canPurchase = this.canPurchase(upgradeId);

        return {
            id: upgrade.id,
            name: upgrade.name,
            description: upgrade.description,
            level,
            maxLevel: upgrade.maxLevel,
            cost,
            isMaxed,
            canPurchase,
            effect: upgrade.effect
        };
    }

    /**
     * Get display data for all Nip upgrades.
     * @returns {Array<Object>} Nip upgrade info list
     */
    getAllUpgradeInfo() {
        return getNipUpgradeList().map((upgrade) => this.getUpgradeInfo(upgrade.id));
    }
}
