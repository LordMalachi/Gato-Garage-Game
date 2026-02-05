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
            autoRate: document.getElementById('auto-rate'),
            // Extended stats
            totalClicks: document.getElementById('stat-total-clicks'),
            carsRepaired: document.getElementById('stat-cars-repaired'),
            totalEarned: document.getElementById('stat-total-earned'),
            totalSpent: document.getElementById('stat-total-spent'),
            playTime: document.getElementById('stat-play-time')
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

        // Update extended stats
        this.updateExtendedStats();
    }

    /**
     * Update extended statistics display
     */
    updateExtendedStats() {
        // Total clicks
        if (this.elements.totalClicks) {
            const formatted = NumberFormatter.format(this.state.totalClicks);
            if (this.elements.totalClicks.textContent !== formatted) {
                this.elements.totalClicks.textContent = formatted;
            }
        }

        // Cars repaired
        if (this.elements.carsRepaired) {
            const formatted = NumberFormatter.format(this.state.carsRepaired);
            if (this.elements.carsRepaired.textContent !== formatted) {
                this.elements.carsRepaired.textContent = formatted;
            }
        }

        // Total earned
        if (this.elements.totalEarned) {
            const formatted = NumberFormatter.formatCurrency(this.state.totalEarned);
            if (this.elements.totalEarned.textContent !== formatted) {
                this.elements.totalEarned.textContent = formatted;
            }
        }

        // Total spent
        if (this.elements.totalSpent) {
            const formatted = NumberFormatter.formatCurrency(this.state.totalSpent);
            if (this.elements.totalSpent.textContent !== formatted) {
                this.elements.totalSpent.textContent = formatted;
            }
        }

        // Play time
        if (this.elements.playTime) {
            const totalMs = this.state.totalPlayTime + this.state.getSessionTime();
            const formatted = this.formatPlayTime(totalMs);
            if (this.elements.playTime.textContent !== formatted) {
                this.elements.playTime.textContent = formatted;
            }
        }
    }

    /**
     * Format play time in human-readable format
     * @param {number} ms - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatPlayTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Force update all displays
     */
    forceUpdate() {
        this.update();
    }
}
