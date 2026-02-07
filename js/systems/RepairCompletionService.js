/**
 * RepairCompletionService - Centralized handler for completing car repairs
 * Eliminates duplicated logic between ClickSystem and WorkerSystem
 */
const RepairCompletionService = {
    state: null,
    progressionSystem: null,

    /**
     * Initialize the service with game state and progression system
     * @param {GameState} gameState - Game state reference
     * @param {ProgressionSystem} progressionSystem - Progression system reference
     */
    init(gameState, progressionSystem) {
        this.state = gameState;
        this.progressionSystem = progressionSystem;
    },

    /**
     * Complete the current car repair and process payment
     * @param {boolean} isAutoRepair - Whether this was an auto-repair (from workers)
     * @returns {Object|null} Repair result with car and payment, or null if no car
     */
    completeRepair(isAutoRepair = false, clickBonusMultiplier = 1) {
        const car = this.state.currentCar;
        if (!car) return null;

        // Calculate payment
        const baseValue = car.getValue();
        const valueMultiplier = this.state.getCarValueMultiplier();
        let payment = Math.floor(baseValue * valueMultiplier * clickBonusMultiplier);
        let contractResult = null;

        if (car.contractMeta) {
            const now = Date.now();
            const completedInTime = !car.contractMeta.expired && now <= (car.contractMeta.expiresAt || 0);
            const payoutMultiplier = completedInTime ? (car.contractMeta.payoutMultiplier || 1) : 1;
            const bonusXP = completedInTime ? (car.contractMeta.bonusXP || 0) : 0;

            payment = Math.floor(payment * payoutMultiplier);

            if (this.progressionSystem && bonusXP > 0) {
                const scaledBonusXP = Math.floor(bonusXP * (this.state.xpMultiplier || 1));
                this.progressionSystem.addXP(scaledBonusXP);
            }

            contractResult = {
                id: car.contractMeta.id,
                label: car.contractMeta.label,
                completedInTime,
                payoutMultiplier,
                bonusXP
            };
        }

        // Add currency
        this.state.addCurrency(payment);

        // Track cars repaired
        if (typeof this.state.carsRepaired === 'number') {
            this.state.carsRepaired++;
        }

        // Award XP based on original repair cost (before tier scaling)
        if (this.progressionSystem) {
            const tier = car.tier || 1;
            const multiplier = 1 + (tier - 1) * 0.5;
            const baseCost = tier > 1 ? Math.floor(car.repairCost / multiplier) : car.repairCost;
            const xpEarned = Math.floor((baseCost / 10) * (this.state.xpMultiplier || 1));
            this.progressionSystem.addXP(xpEarned);
        }

        // Emit completion event
        EventBus.emit(GameEvents.CAR_REPAIRED, {
            car,
            payment,
            isAutoRepair,
            clickBonusMultiplier,
            contractResult
        });

        // Clear current car (CarQueueSystem will assign next)
        this.state.currentCar = null;
        this.state.currentCarStartTime = null;
        this.state.lastCarRepairedAt = Date.now();

        return { car, payment };
    }
};
