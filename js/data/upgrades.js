/**
 * Upgrade definitions for tools and equipment
 * Each upgrade increases the player's click power or provides other bonuses
 */
const UpgradeData = {
    wrench: {
        id: 'wrench',
        name: 'Better Wrench',
        description: '+1 repair/click',
        baseCost: 15,
        maxLevel: 100,
        costGrowth: 1.12,
        effect: {
            type: 'clickPower',
            value: 1
        }
    },

    toolbox: {
        id: 'toolbox',
        name: 'Pro Toolbox',
        description: '+5 repair/click',
        baseCost: 150,
        maxLevel: 50,
        costGrowth: 1.14,
        effect: {
            type: 'clickPower',
            value: 5
        }
    },

    impactDriver: {
        id: 'impactDriver',
        name: 'Impact Driver',
        description: '+15 repair/click',
        baseCost: 1000,
        maxLevel: 30,
        costGrowth: 1.15,
        effect: {
            type: 'clickPower',
            value: 15
        }
    },

    hydraulicLift: {
        id: 'hydraulicLift',
        name: 'Hydraulic Lift',
        description: '+50 repair/click',
        baseCost: 8000,
        maxLevel: 20,
        costGrowth: 1.16,
        effect: {
            type: 'clickPower',
            value: 50
        }
    },

    diagnosticComputer: {
        id: 'diagnosticComputer',
        name: 'Diagnostic PC',
        description: '+10% car value',
        baseCost: 5000,
        maxLevel: 10,
        costGrowth: 1.5,
        effect: {
            type: 'carValueBonus',
            value: 0.10
        }
    },

    neonSign: {
        id: 'neonSign',
        name: 'Neon Sign',
        description: '+5% all income',
        baseCost: 25000,
        maxLevel: 10,
        costGrowth: 2.0,
        effect: {
            type: 'incomeMultiplier',
            value: 0.05
        }
    },

    turboCharger: {
        id: 'turboCharger',
        name: 'Turbo Charger',
        description: '+200 repair/click',
        baseCost: 100000,
        maxLevel: 15,
        costGrowth: 1.18,
        effect: {
            type: 'clickPower',
            value: 200
        }
    },

    cyberTools: {
        id: 'cyberTools',
        name: 'Cyber Tools',
        description: '+1000 repair/click',
        baseCost: 1000000,
        maxLevel: 10,
        costGrowth: 1.20,
        effect: {
            type: 'clickPower',
            value: 1000
        }
    }
};

/**
 * Get ordered list of upgrades for display
 * @returns {Array} Array of upgrade definitions
 */
function getUpgradeList() {
    return [
        UpgradeData.wrench,
        UpgradeData.toolbox,
        UpgradeData.impactDriver,
        UpgradeData.hydraulicLift,
        UpgradeData.diagnosticComputer,
        UpgradeData.neonSign,
        UpgradeData.turboCharger,
        UpgradeData.cyberTools
    ];
}

/**
 * Calculate the cost of an upgrade at a given level
 * @param {Object} upgrade - Upgrade definition
 * @param {number} level - Current level
 * @returns {number} Cost for next level
 */
function calculateUpgradeCost(upgrade, level) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costGrowth, level));
}
