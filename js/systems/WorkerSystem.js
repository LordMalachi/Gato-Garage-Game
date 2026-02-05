/**
 * WorkerSystem - Handles hiring workers and auto-repair
 */
class WorkerSystem {
    /**
     * Create worker system
     * @param {GameState} gameState - Game state reference
     */
    constructor(gameState) {
        this.state = gameState;
    }

    /**
     * Get the cost of hiring another worker of a type
     * @param {string} workerId - Worker type ID
     * @returns {number} Cost to hire
     */
    getCost(workerId) {
        const workerDef = WorkerData[workerId];
        if (!workerDef) return Infinity;

        const owned = this.state.getWorkerCount(workerId);
        return calculateWorkerCost(workerDef, owned);
    }

    /**
     * Check if a worker can be hired
     * @param {string} workerId - Worker type ID
     * @returns {boolean} True if can hire
     */
    canHire(workerId) {
        const workerDef = WorkerData[workerId];
        if (!workerDef) return false;

        const cost = this.getCost(workerId);
        return this.state.canAfford(cost);
    }

    /**
     * Hire a new worker
     * @param {string} workerId - Worker type ID
     * @returns {boolean} True if hire successful
     */
    hire(workerId) {
        if (!this.canHire(workerId)) {
            return false;
        }

        const workerDef = WorkerData[workerId];
        const cost = this.getCost(workerId);

        // Spend currency
        if (!this.state.spendCurrency(cost)) {
            return false;
        }

        // Create and add worker
        const worker = new Worker(workerDef);
        this.state.workers.push(worker);

        // Update count
        const currentCount = this.state.getWorkerCount(workerId);
        this.state.workerCounts[workerId] = currentCount + 1;

        // Recalculate auto-repair rate
        this.state.calculateAutoRepairRate();

        // Emit event
        EventBus.emit(GameEvents.WORKER_HIRED, {
            workerId,
            worker,
            cost,
            totalOwned: currentCount + 1
        });

        return true;
    }

    /**
     * Update auto-repair progress
     * @param {number} deltaMs - Time since last update in milliseconds
     */
    update(deltaMs) {
        // No current car or no workers
        if (!this.state.currentCar || this.state.workers.length === 0) {
            return;
        }

        // Calculate total repair from all workers
        let totalRepair = 0;
        for (const worker of this.state.workers) {
            totalRepair += worker.getRepairContribution(deltaMs);
        }

        if (totalRepair <= 0) return;

        // Apply repair to current car
        const wasRepaired = this.state.currentCar.repair(totalRepair);

        // Emit progress event
        EventBus.emit(GameEvents.CAR_PROGRESS, {
            car: this.state.currentCar,
            progress: this.state.currentCar.getProgressPercent()
        });

        // Emit working event for visual feedback
        EventBus.emit(GameEvents.WORKER_WORKING, {
            repairAmount: totalRepair,
            workerCount: this.state.workers.length
        });

        // Check if car is now repaired
        if (wasRepaired) {
            this.completeAutoRepair();
        }
    }

    /**
     * Complete an auto-repair and process payment
     */
    completeAutoRepair() {
        const car = this.state.currentCar;
        if (!car) return;

        // Calculate payment
        const baseValue = car.getValue();
        const valueMultiplier = this.state.getCarValueMultiplier();
        const payment = Math.floor(baseValue * valueMultiplier);

        // Add currency
        this.state.addCurrency(payment);

        // Emit completion event
        EventBus.emit(GameEvents.CAR_REPAIRED, {
            car,
            payment,
            isAutoRepair: true
        });

        // Clear current car
        this.state.currentCar = null;
    }

    /**
     * Get worker info for UI display
     * @param {string} workerId - Worker type ID
     * @returns {Object} Worker info object
     */
    getWorkerInfo(workerId) {
        const workerDef = WorkerData[workerId];
        if (!workerDef) return null;

        const owned = this.state.getWorkerCount(workerId);
        const cost = this.getCost(workerId);

        return {
            id: workerDef.id,
            name: workerDef.name,
            description: workerDef.description,
            repairRate: workerDef.repairRate,
            color: workerDef.color,
            flavorText: workerDef.flavorText,
            owned,
            cost,
            canAfford: this.state.canAfford(cost),
            canHire: this.canHire(workerId),
            totalRate: workerDef.repairRate * owned
        };
    }

    /**
     * Get all workers with current info
     * @returns {Array} Array of worker info objects
     */
    getAllWorkerInfo() {
        return getWorkerList().map(worker => this.getWorkerInfo(worker.id));
    }

    /**
     * Get total repair rate from all workers
     * @returns {number} Total repair per second
     */
    getTotalRepairRate() {
        return this.state.autoRepairRate;
    }
}
