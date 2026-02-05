/**
 * Car definitions for vehicles that come into the garage
 * Each car type has different repair requirements and values
 */
const CarData = {
    hatchback: {
        id: 'hatchback',
        name: 'Hatchback',
        repairCost: 50, // Points needed to repair
        baseValue: 25,   // Payment on completion
        color: '#94a3b8', // Gray
        rarity: 'common',
        weight: 30 // Spawn weight
    },

    sedan: {
        id: 'sedan',
        name: 'Sedan',
        repairCost: 100,
        baseValue: 50,
        color: '#60a5fa', // Blue
        rarity: 'common',
        weight: 25
    },

    suv: {
        id: 'suv',
        name: 'SUV',
        repairCost: 200,
        baseValue: 120,
        color: '#34d399', // Teal
        rarity: 'common',
        weight: 20
    },

    pickup: {
        id: 'pickup',
        name: 'Pickup Truck',
        repairCost: 300,
        baseValue: 180,
        color: '#fb923c', // Orange
        rarity: 'uncommon',
        weight: 12
    },

    sportsCar: {
        id: 'sportsCar',
        name: 'Sports Car',
        repairCost: 500,
        baseValue: 350,
        color: '#f87171', // Red
        rarity: 'uncommon',
        weight: 8
    },

    vintage: {
        id: 'vintage',
        name: 'Vintage Classic',
        repairCost: 800,
        baseValue: 600,
        color: '#fbbf24', // Gold
        rarity: 'rare',
        weight: 4
    },

    cyberCar: {
        id: 'cyberCar',
        name: 'Cyber Vehicle',
        repairCost: 1500,
        baseValue: 1200,
        color: '#22d3d3', // Cyan
        rarity: 'rare',
        weight: 2
    },

    hypercar: {
        id: 'hypercar',
        name: 'Hypercar',
        repairCost: 3000,
        baseValue: 2500,
        color: '#a855f7', // Purple
        rarity: 'legendary',
        weight: 1
    }
};

/**
 * Rarity colors for UI display
 */
const RarityColors = {
    common: '#94a3b8',
    uncommon: '#4ade80',
    rare: '#60a5fa',
    legendary: '#a855f7'
};

/**
 * Get a random car type based on weights
 * @returns {Object} Random car definition
 */
function getRandomCar() {
    const cars = Object.values(CarData);
    const totalWeight = cars.reduce((sum, car) => sum + car.weight, 0);

    let random = Math.random() * totalWeight;

    for (const car of cars) {
        random -= car.weight;
        if (random <= 0) {
            return car;
        }
    }

    // Fallback to first car
    return cars[0];
}

/**
 * Get all car types sorted by value
 * @returns {Array} Array of car definitions
 */
function getCarList() {
    return Object.values(CarData).sort((a, b) => a.baseValue - b.baseValue);
}
