/**
 * Worker definitions for auto-repair cat-maids
 * Each worker type provides automatic repair per second
 */
const WorkerData = {
    juniorMaid: {
        id: 'juniorMaid',
        name: 'Junior Cat-Maid',
        description: 'A trainee mechanic',
        baseCost: 50,
        repairRate: 1, // repair points per second
        costGrowth: 1.15,
        color: '#86efac', // Light green
        flavorText: '"Nyaa~ I\'ll do my best!"'
    },

    seniorMaid: {
        id: 'seniorMaid',
        name: 'Senior Cat-Maid',
        description: 'Experienced mechanic',
        baseCost: 500,
        repairRate: 5,
        costGrowth: 1.14,
        color: '#4ade80', // Gato green
        flavorText: '"Leave it to me, Master~"'
    },

    masterMaid: {
        id: 'masterMaid',
        name: 'Master Cat-Maid',
        description: 'Expert mechanic',
        baseCost: 5000,
        repairRate: 25,
        costGrowth: 1.13,
        color: '#22c55e', // Dark green
        flavorText: '"Precision is my specialty."'
    },

    gearhead: {
        id: 'gearhead',
        name: 'Gearhead Neko',
        description: 'Speed specialist',
        baseCost: 50000,
        repairRate: 100,
        costGrowth: 1.12,
        color: '#f472b6', // Cyber pink
        flavorText: '"Fast and purr-fect!"'
    },

    roboMaid: {
        id: 'roboMaid',
        name: 'Robo-Maid',
        description: 'Cybernetic helper',
        baseCost: 500000,
        repairRate: 500,
        costGrowth: 1.11,
        color: '#22d3d3', // Cyber cyan
        flavorText: '"BEEP BOOP. REPAIR INITIATED."'
    },

    legendaryMaid: {
        id: 'legendaryMaid',
        name: 'Legendary Maid',
        description: 'The ultimate mechanic',
        baseCost: 10000000,
        repairRate: 5000,
        costGrowth: 1.10,
        color: '#a855f7', // Cyber purple
        flavorText: '"Time to show you true skill."'
    }
};

/**
 * Get ordered list of workers for display
 * @returns {Array} Array of worker definitions
 */
function getWorkerList() {
    return [
        WorkerData.juniorMaid,
        WorkerData.seniorMaid,
        WorkerData.masterMaid,
        WorkerData.gearhead,
        WorkerData.roboMaid,
        WorkerData.legendaryMaid
    ];
}

/**
 * Calculate the cost of hiring another worker of a given type
 * @param {Object} workerDef - Worker definition
 * @param {number} owned - Number already owned
 * @returns {number} Cost for next worker
 */
function calculateWorkerCost(workerDef, owned) {
    return Math.floor(workerDef.baseCost * Math.pow(workerDef.costGrowth, owned));
}
