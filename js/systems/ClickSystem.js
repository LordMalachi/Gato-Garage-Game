/**
 * ClickSystem - Handles click-to-repair mechanics
 */
class ClickSystem {
    /**
     * Create click system
     * @param {GameState} gameState - Game state reference
     */
    constructor(gameState) {
        this.state = gameState;

        // Combo system
        this.comboMultiplier = 1;
        this.maxCombo = 2.0;
        this.comboDecayRate = 0.5; // Decay per second
        this.comboGainPerClick = 0.1;
        this.lastClickTime = 0;
        this.comboTimeout = 1000; // Reset combo after 1 second

        // Click effect tracking
        this.recentClicks = []; // For visual effects
    }

    /**
     * Handle a click on the game area
     * @param {number} x - Click X coordinate (relative to game area)
     * @param {number} y - Click Y coordinate (relative to game area)
     * @returns {Object|null} Click result with repair amount and position
     */
    handleClick(x, y) {
        // No current car to repair
        if (!this.state.currentCar) {
            return null;
        }

        const now = performance.now();

        // Update combo
        if (now - this.lastClickTime < this.comboTimeout) {
            this.comboMultiplier = Math.min(
                this.comboMultiplier + this.comboGainPerClick,
                this.maxCombo
            );
        } else {
            this.comboMultiplier = 1;
        }
        this.lastClickTime = now;

        // Calculate repair amount
        const baseRepair = this.state.clickPower;
        const repairAmount = Math.floor(baseRepair * this.comboMultiplier);

        // Apply repair to current car
        const wasRepaired = this.state.currentCar.repair(repairAmount);

        // Update click stats
        this.state.totalClicks++;

        // Emit click event for visual effects
        const clickResult = {
            x,
            y,
            amount: repairAmount,
            combo: this.comboMultiplier,
            isCrit: this.comboMultiplier >= 1.5,
            timestamp: now
        };

        EventBus.emit(GameEvents.CLICK_PERFORMED, clickResult);
        EventBus.emit(GameEvents.CAR_PROGRESS, {
            car: this.state.currentCar,
            progress: this.state.currentCar.getProgressPercent()
        });

        // Track for effects
        this.recentClicks.push(clickResult);
        if (this.recentClicks.length > 10) {
            this.recentClicks.shift();
        }

        // Check if car is now repaired
        if (wasRepaired) {
            this.completeRepair();
        }

        return clickResult;
    }

    /**
     * Complete the current car repair and process payment
     */
    completeRepair() {
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
            payment
        });

        // Clear current car (CarQueueSystem will assign next)
        this.state.currentCar = null;
        this.state.currentCarStartTime = null;
        this.state.lastCarRepairedAt = Date.now();
    }

    /**
     * Update combo decay over time
     * @param {number} deltaMs - Time since last update in milliseconds
     */
    update(deltaMs) {
        // Decay combo if not clicking
        const now = performance.now();
        if (now - this.lastClickTime > this.comboTimeout) {
            this.comboMultiplier = Math.max(
                1,
                this.comboMultiplier - this.comboDecayRate * (deltaMs / 1000)
            );
        }
    }

    /**
     * Get current combo multiplier
     * @returns {number} Current combo (1.0 - maxCombo)
     */
    getCombo() {
        return this.comboMultiplier;
    }

    /**
     * Get effective click power with combo
     * @returns {number} Current click power
     */
    getEffectiveClickPower() {
        return Math.floor(this.state.clickPower * this.comboMultiplier);
    }
}
