/**
 * Car entity - Represents a vehicle being repaired in the garage
 */
class Car {
    /**
     * Create a new car
     * @param {Object} carDef - Car definition from CarData
     */
    constructor(carDef) {
        this.id = carDef.id;
        this.name = carDef.name;
        this.repairCost = carDef.repairCost;
        this.baseValue = carDef.baseValue;
        this.color = carDef.color;
        this.rarity = carDef.rarity;

        // Current repair state
        this.repairProgress = 0;
        this.createdAt = Date.now();
    }

    /**
     * Apply repair points to this car
     * @param {number} amount - Repair points to apply
     * @returns {boolean} True if car is now fully repaired
     */
    repair(amount) {
        this.repairProgress = Math.min(this.repairProgress + amount, this.repairCost);
        return this.isFullyRepaired();
    }

    /**
     * Check if the car is fully repaired
     * @returns {boolean} True if fully repaired
     */
    isFullyRepaired() {
        return this.repairProgress >= this.repairCost;
    }

    /**
     * Get the repair progress as a percentage (0-1)
     * @returns {number} Progress percentage
     */
    getProgressPercent() {
        return this.repairProgress / this.repairCost;
    }

    /**
     * Get the value of this car (with potential bonuses)
     * @param {number} [valueMultiplier=1] - Bonus multiplier
     * @returns {number} Final value
     */
    getValue(valueMultiplier = 1) {
        return Math.floor(this.baseValue * valueMultiplier);
    }

    /**
     * Get remaining repair points needed
     * @returns {number} Points remaining
     */
    getRemainingRepair() {
        return Math.max(0, this.repairCost - this.repairProgress);
    }

    /**
     * Serialize car for saving
     * @returns {Object} Serialized car data
     */
    serialize() {
        return {
            id: this.id,
            repairProgress: this.repairProgress,
            createdAt: this.createdAt
        };
    }

    /**
     * Create a car from saved data
     * @param {Object} data - Saved car data
     * @returns {Car} Restored car instance
     */
    static deserialize(data) {
        const carDef = CarData[data.id];
        if (!carDef) {
            console.warn(`Unknown car type: ${data.id}, using hatchback`);
            return new Car(CarData.hatchback);
        }

        const car = new Car(carDef);
        car.repairProgress = data.repairProgress || 0;
        car.createdAt = data.createdAt || Date.now();
        return car;
    }
}
