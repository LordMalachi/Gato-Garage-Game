/**
 * RepairCompletionService - Centralized handler for completing car repairs
 * Eliminates duplicated logic between ClickSystem and WorkerSystem
 */
const RepairCompletionService = {
    state: null,

    /**
     * Initialize the service with game state
     * @param {GameState} gameState - Game state reference
     */
    init(gameState) {
        this.state = gameState;
    },

    /**
     * Complete the current car repair and process payment
     * @param {boolean} isAutoRepair - Whether this was an auto-repair (from workers)
     * @returns {Object|null} Repair result with car and payment, or null if no car
     */
    completeRepair(isAutoRepair = false) {
        const car = this.state.currentCar;
        if (!car) return null;

        // Calculate payment
        const baseValue = car.getValue();
        const valueMultiplier = this.state.getCarValueMultiplier();
        const payment = Math.floor(baseValue * valueMultiplier);

        // Add currency
        this.state.addCurrency(payment);

        // Track cars repaired
        if (typeof this.state.carsRepaired === 'number') {
            this.state.carsRepaired++;
        }

        // Emit completion event
        EventBus.emit(GameEvents.CAR_REPAIRED, {
            car,
            payment,
            isAutoRepair
        });

        // Clear current car (CarQueueSystem will assign next)
        this.state.currentCar = null;
        this.state.currentCarStartTime = null;
        this.state.lastCarRepairedAt = Date.now();

        return { car, payment };
    }
};
