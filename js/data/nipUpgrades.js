/**
 * Nip upgrade definitions for permanent meta progression.
 * These upgrades are purchased with Gato Nip and persist through ascension.
 */
const NipUpgradeData = {
    sharpenedPaws: {
        id: 'sharpenedPaws',
        name: 'Sharpened Paws',
        description: '+20% click repair power',
        baseCost: 1,
        maxLevel: 10,
        costGrowth: 1.85,
        effect: { type: 'clickPowerMultiplier', value: 0.20 }
    },

    tunedCrew: {
        id: 'tunedCrew',
        name: 'Tuned Crew',
        description: '+18% auto-repair output',
        baseCost: 2,
        maxLevel: 10,
        costGrowth: 1.9,
        effect: { type: 'autoRepairMultiplier', value: 0.18 }
    },

    loyalClients: {
        id: 'loyalClients',
        name: 'Loyal Clients',
        description: '+12% car value',
        baseCost: 2,
        maxLevel: 10,
        costGrowth: 1.95,
        effect: { type: 'carValueBonus', value: 0.12 }
    },

    comboInstinct: {
        id: 'comboInstinct',
        name: 'Combo Instinct',
        description: '+0.20 max combo',
        baseCost: 3,
        maxLevel: 8,
        costGrowth: 2.0,
        effect: { type: 'comboMaxBonus', value: 0.20 }
    },

    quickDispatch: {
        id: 'quickDispatch',
        name: 'Quick Dispatch',
        description: '8% faster car arrivals',
        baseCost: 3,
        maxLevel: 8,
        costGrowth: 2.05,
        effect: { type: 'queueSpawnReduction', value: 0.08 }
    },

    wisdomManuals: {
        id: 'wisdomManuals',
        name: 'Wisdom Manuals',
        description: '+10% XP gain',
        baseCost: 4,
        maxLevel: 8,
        costGrowth: 2.2,
        effect: { type: 'xpMultiplier', value: 0.10 }
    }
};

/**
 * Get ordered list of Nip upgrades for display
 * @returns {Array} Upgrade definitions
 */
function getNipUpgradeList() {
    return [
        NipUpgradeData.sharpenedPaws,
        NipUpgradeData.tunedCrew,
        NipUpgradeData.loyalClients,
        NipUpgradeData.comboInstinct,
        NipUpgradeData.quickDispatch,
        NipUpgradeData.wisdomManuals
    ];
}

/**
 * Calculate upgrade cost for a level
 * @param {Object} upgrade - Upgrade definition
 * @param {number} level - Current level
 * @returns {number} Cost to buy next level
 */
function calculateNipUpgradeCost(upgrade, level) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costGrowth, level));
}
