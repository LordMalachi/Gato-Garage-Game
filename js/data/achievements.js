/**
 * Achievement definitions for Gato Garage
 * Categories: Clicks, Currency, Cars, Workers, Upgrades
 */
const AchievementData = {
    // Click achievements
    firstClick: {
        id: 'firstClick',
        name: 'First Click',
        description: 'Perform your first repair click',
        icon: '🔧',
        condition: { type: 'totalClicks', value: 1 }
    },
    clickApprentice: {
        id: 'clickApprentice',
        name: 'Click Apprentice',
        description: 'Click 100 times',
        icon: '🔨',
        condition: { type: 'totalClicks', value: 100 }
    },
    clickMaster: {
        id: 'clickMaster',
        name: 'Click Master',
        description: 'Click 1,000 times',
        icon: '⚒️',
        condition: { type: 'totalClicks', value: 1000 }
    },
    clickLegend: {
        id: 'clickLegend',
        name: 'Click Legend',
        description: 'Click 10,000 times',
        icon: '🏆',
        condition: { type: 'totalClicks', value: 10000 }
    },

    // Currency achievements
    gettingStarted: {
        id: 'gettingStarted',
        name: 'Getting Started',
        description: 'Earn $100 total',
        icon: '💵',
        condition: { type: 'totalEarned', value: 100 }
    },
    moneyMaker: {
        id: 'moneyMaker',
        name: 'Money Maker',
        description: 'Earn $10,000 total',
        icon: '💰',
        condition: { type: 'totalEarned', value: 10000 }
    },
    wealthyMechanic: {
        id: 'wealthyMechanic',
        name: 'Wealthy Mechanic',
        description: 'Earn $100,000 total',
        icon: '🤑',
        condition: { type: 'totalEarned', value: 100000 }
    },
    garageEmpire: {
        id: 'garageEmpire',
        name: 'Garage Empire',
        description: 'Earn $1,000,000 total',
        icon: '👑',
        condition: { type: 'totalEarned', value: 1000000 }
    },

    // Car achievements
    firstRepair: {
        id: 'firstRepair',
        name: 'First Repair',
        description: 'Complete your first car repair',
        icon: '🚗',
        condition: { type: 'carsRepaired', value: 1 }
    },
    tenCars: {
        id: 'tenCars',
        name: 'Getting Busy',
        description: 'Repair 10 cars',
        icon: '🚙',
        condition: { type: 'carsRepaired', value: 10 }
    },
    carCollector: {
        id: 'carCollector',
        name: 'Car Collector',
        description: 'Repair 100 cars',
        icon: '🏎️',
        condition: { type: 'carsRepaired', value: 100 }
    },
    masterMechanic: {
        id: 'masterMechanic',
        name: 'Master Mechanic',
        description: 'Repair 1,000 cars',
        icon: '🔥',
        condition: { type: 'carsRepaired', value: 1000 }
    },

    // Worker achievements
    firstHire: {
        id: 'firstHire',
        name: 'First Hire',
        description: 'Hire your first cat-maid',
        icon: '🐱',
        condition: { type: 'totalWorkers', value: 1 }
    },
    smallTeam: {
        id: 'smallTeam',
        name: 'Small Team',
        description: 'Have 5 workers',
        icon: '👥',
        condition: { type: 'totalWorkers', value: 5 }
    },
    fullStaff: {
        id: 'fullStaff',
        name: 'Full Staff',
        description: 'Have 10 workers',
        icon: '🏢',
        condition: { type: 'totalWorkers', value: 10 }
    },
    catArmy: {
        id: 'catArmy',
        name: 'Cat Army',
        description: 'Have 25 workers',
        icon: '⭐',
        condition: { type: 'totalWorkers', value: 25 }
    },

    // Upgrade achievements
    firstUpgrade: {
        id: 'firstUpgrade',
        name: 'First Upgrade',
        description: 'Purchase your first tool upgrade',
        icon: '📦',
        condition: { type: 'totalUpgrades', value: 1 }
    },
    toolEnthusiast: {
        id: 'toolEnthusiast',
        name: 'Tool Enthusiast',
        description: 'Purchase 10 upgrades',
        icon: '🛠️',
        condition: { type: 'totalUpgrades', value: 10 }
    },
    fullyEquipped: {
        id: 'fullyEquipped',
        name: 'Fully Equipped',
        description: 'Purchase 50 upgrades',
        icon: '💎',
        condition: { type: 'totalUpgrades', value: 50 }
    }
};

/**
 * Get list of all achievements for display
 * @returns {Array} Array of achievement definitions
 */
function getAchievementList() {
    return Object.values(AchievementData);
}
