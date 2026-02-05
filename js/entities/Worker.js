/**
 * Worker entity - Represents a cat-maid that auto-repairs cars
 */
class Worker {
    /**
     * Create a new worker
     * @param {Object} workerDef - Worker definition from WorkerData
     */
    constructor(workerDef) {
        this.id = workerDef.id;
        this.name = workerDef.name;
        this.description = workerDef.description;
        this.repairRate = workerDef.repairRate; // Repair per second
        this.color = workerDef.color;
        this.flavorText = workerDef.flavorText;

        // Instance properties
        this.hiredAt = Date.now();
        this.totalRepairs = 0; // Track lifetime contribution
    }

    /**
     * Get repair contribution for a time delta
     * @param {number} deltaMs - Time in milliseconds
     * @returns {number} Repair points contributed
     */
    getRepairContribution(deltaMs) {
        const contribution = this.repairRate * (deltaMs / 1000);
        this.totalRepairs += contribution;
        return contribution;
    }

    /**
     * Get current repair rate (with potential bonuses)
     * @param {number} [rateMultiplier=1] - Bonus multiplier
     * @returns {number} Effective repair rate per second
     */
    getEffectiveRate(rateMultiplier = 1) {
        return this.repairRate * rateMultiplier;
    }

    /**
     * Serialize worker for saving
     * @returns {Object} Serialized worker data
     */
    serialize() {
        return {
            id: this.id,
            hiredAt: this.hiredAt,
            totalRepairs: this.totalRepairs
        };
    }

    /**
     * Create a worker from saved data
     * @param {Object} data - Saved worker data
     * @returns {Worker} Restored worker instance
     */
    static deserialize(data) {
        const workerDef = WorkerData[data.id];
        if (!workerDef) {
            console.warn(`Unknown worker type: ${data.id}, using juniorMaid`);
            return new Worker(WorkerData.juniorMaid);
        }

        const worker = new Worker(workerDef);
        worker.hiredAt = data.hiredAt || Date.now();
        worker.totalRepairs = data.totalRepairs || 0;
        return worker;
    }
}
