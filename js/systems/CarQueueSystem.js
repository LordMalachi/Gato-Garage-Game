/**
 * CarQueueSystem - Manages the queue of cars waiting for repair
 */
class CarQueueSystem {
    /**
     * Create car queue system
     * @param {GameState} gameState - Game state reference
     */
    constructor(gameState) {
        this.state = gameState;

        // Configuration
        this.maxQueueSize = 5;
        this.baseSpawnInterval = 8000; // 8 seconds base
        this.minSpawnInterval = 2000;  // Minimum 2 seconds

        // Timing
        this.spawnTimer = 0;
    }

    /**
     * Update the car queue system
     * @param {number} deltaMs - Time since last update in milliseconds
     */
    update(deltaMs) {
        // Update spawn timer
        this.spawnTimer += deltaMs;

        // Try to spawn new cars
        const spawnInterval = this.getSpawnInterval();
        while (this.spawnTimer >= spawnInterval && this.canSpawnCar()) {
            this.spawnCar();
            this.spawnTimer -= spawnInterval;
        }

        // Cap timer to prevent buildup
        if (this.spawnTimer > spawnInterval * 2) {
            this.spawnTimer = spawnInterval;
        }

        // Ensure there's a current car if queue has cars
        this.assignNextCar();
    }

    /**
     * Get current spawn interval based on game progress
     * @returns {number} Spawn interval in milliseconds
     */
    getSpawnInterval() {
        // Spawn faster with more workers (up to 75% reduction)
        const workerBonus = Math.min(this.state.workers.length * 0.05, 0.75);
        const interval = this.baseSpawnInterval * (1 - workerBonus);
        return Math.max(interval, this.minSpawnInterval);
    }

    /**
     * Check if a new car can be spawned
     * @returns {boolean} True if can spawn
     */
    canSpawnCar() {
        return this.state.carQueue.length < this.maxQueueSize;
    }

    /**
     * Spawn a new random car into the queue
     */
    spawnCar() {
        const carDef = getRandomCar();
        const car = new Car(carDef);

        this.state.carQueue.push(car);

        EventBus.emit(GameEvents.CAR_QUEUED, {
            car,
            queueLength: this.state.carQueue.length
        });
    }

    /**
     * Assign the next car from queue if no current car
     */
    assignNextCar() {
        if (!this.state.currentCar && this.state.carQueue.length > 0) {
            this.state.currentCar = this.state.carQueue.shift();

            EventBus.emit(GameEvents.CAR_STARTED, {
                car: this.state.currentCar,
                queueLength: this.state.carQueue.length
            });
        }
    }

    /**
     * Force spawn a car (for initial game start)
     */
    forceSpawn() {
        if (this.canSpawnCar()) {
            this.spawnCar();
        }
        this.assignNextCar();
    }

    /**
     * Get queue info for UI
     * @returns {Object} Queue info object
     */
    getQueueInfo() {
        return {
            currentCar: this.state.currentCar,
            queue: this.state.carQueue,
            queueLength: this.state.carQueue.length,
            maxSize: this.maxQueueSize,
            spawnInterval: this.getSpawnInterval(),
            timeToNextSpawn: Math.max(0, this.getSpawnInterval() - this.spawnTimer)
        };
    }

    /**
     * Get current car info for UI
     * @returns {Object|null} Current car info or null
     */
    getCurrentCarInfo() {
        const car = this.state.currentCar;
        if (!car) {
            return null;
        }

        return {
            name: car.name,
            rarity: car.rarity,
            color: car.color,
            progress: car.getProgressPercent(),
            repairProgress: car.repairProgress,
            repairCost: car.repairCost,
            value: car.getValue(this.state.getCarValueMultiplier())
        };
    }
}
