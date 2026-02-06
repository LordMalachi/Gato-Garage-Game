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
     * @param {number} x - Click X coordinate (relative to game area, in internal resolution)
     * @param {number} y - Click Y coordinate (relative to game area, in internal resolution)
     * @returns {Object|null} Click result with repair amount and position
     */
    handleClick(x, y) {
        // No current car to repair
        if (!this.state.currentCar) {
            return null;
        }

        // Check if click is within car hitbox
        // Car is drawn at (80, 130) with size 140x140 in internal resolution
        // Add some padding for forgiving click detection
        const carHitbox = {
            x: 70,      // Slight padding left
            y: 100,     // Include progress bar area above car
            width: 160, // Slight padding right
            height: 180 // Include area below car
        };

        if (x < carHitbox.x || x > carHitbox.x + carHitbox.width ||
            y < carHitbox.y || y > carHitbox.y + carHitbox.height) {
            // Click was outside car area
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
        const payoutBonus = 1 + Math.max(0, this.comboMultiplier - 1) * 0.5;
        RepairCompletionService.completeRepair(false, payoutBonus);
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
