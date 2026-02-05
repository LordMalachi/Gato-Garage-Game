/**
 * StatsUI - Updates stats display in the UI
 */
class StatsUI {
    /**
     * Create stats UI
     * @param {GameState} gameState - Game state reference
     * @param {ClickSystem} clickSystem - Click system reference
     * @param {WorkerSystem} workerSystem - Worker system reference
     */
    constructor(gameState, clickSystem, workerSystem) {
        this.state = gameState;
        this.clickSystem = clickSystem;
        this.workerSystem = workerSystem;

        // DOM elements
        this.elements = {
            currencyValue: document.getElementById('currency-value'),
            clickPower: document.getElementById('click-power'),
            autoRate: document.getElementById('auto-rate')
        };

        // Update interval
        this.updateInterval = null;
    }

    /**
     * Start periodic updates
     */
    start() {
        // Update immediately
        this.update();

        // Update every 100ms for smooth display
        this.updateInterval = setInterval(() => this.update(), 100);
    }

    /**
     * Stop periodic updates
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update all stats displays
     */
    update() {
        // Update currency
        if (this.elements.currencyValue) {
            const formatted = NumberFormatter.format(this.state.currency);
            if (this.elements.currencyValue.textContent !== formatted) {
                this.elements.currencyValue.textContent = formatted;
            }
        }

        // Update click power (with combo)
        if (this.elements.clickPower) {
            const effectivePower = this.clickSystem.getEffectiveClickPower();
            const formatted = NumberFormatter.format(effectivePower);
            if (this.elements.clickPower.textContent !== formatted) {
                this.elements.clickPower.textContent = formatted;
            }
        }

        // Update auto rate
        if (this.elements.autoRate) {
            const rate = this.workerSystem.getTotalRepairRate();
            const formatted = NumberFormatter.format(rate);
            if (this.elements.autoRate.textContent !== formatted) {
                this.elements.autoRate.textContent = formatted;
            }
        }
    }

    /**
     * Force update all displays
     */
    forceUpdate() {
        this.update();
    }
}
