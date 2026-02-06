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
            playTime: document.getElementById('stat-play-time'),
            garageLevel: document.getElementById('stat-garage-level'),
            currentTier: document.getElementById('stat-current-tier'),
            totalXP: document.getElementById('stat-total-xp'),
            unlockedCars: document.getElementById('stat-unlocked-cars'),
            achievementSummary: document.getElementById('achievement-summary'),
            achievementsList: document.getElementById('achievements-list')
        };

        // Update interval
        this.updateInterval = null;
        this.achievementRenderKey = '';
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
        this.updateAchievements();
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

        // Progression stats
        if (this.elements.garageLevel) {
            const formatted = this.state.garageLevel.toString();
            if (this.elements.garageLevel.textContent !== formatted) {
                this.elements.garageLevel.textContent = formatted;
            }
        }

        if (this.elements.currentTier) {
            const formatted = `Tier ${this.state.currentTier}`;
            if (this.elements.currentTier.textContent !== formatted) {
                this.elements.currentTier.textContent = formatted;
            }
        }

        if (this.elements.totalXP) {
            const formatted = NumberFormatter.format(this.state.garageXP);
            if (this.elements.totalXP.textContent !== formatted) {
                this.elements.totalXP.textContent = formatted;
            }
        }

        if (this.elements.unlockedCars) {
            const totalCars = Object.keys(CarData).length;
            const formatted = `${this.state.unlockedCars.length} / ${totalCars}`;
            if (this.elements.unlockedCars.textContent !== formatted) {
                this.elements.unlockedCars.textContent = formatted;
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

    /**
     * Update achievement summary and compact list
     */
    updateAchievements() {
        const achievementList = getAchievementList();
        const unlockedCount = achievementList.filter(a => !!this.state.achievements[a.id]).length;
        const renderKey = `${unlockedCount}:${Object.keys(this.state.achievements).join(',')}`;

        if (this.elements.achievementSummary) {
            this.elements.achievementSummary.textContent = `${unlockedCount} / ${achievementList.length} unlocked`;
        }

        if (!this.elements.achievementsList) return;
        if (this.achievementRenderKey === renderKey) return;
        this.achievementRenderKey = renderKey;

        const sorted = [...achievementList].sort((a, b) => {
            const aUnlocked = !!this.state.achievements[a.id];
            const bUnlocked = !!this.state.achievements[b.id];
            if (aUnlocked !== bUnlocked) return aUnlocked ? 1 : -1;
            return a.condition.value - b.condition.value;
        });

        const top = sorted.slice(0, 6);
        this.elements.achievementsList.innerHTML = '';

        top.forEach(achievement => {
            const unlocked = !!this.state.achievements[achievement.id];
            const item = document.createElement('div');
            item.className = `achievement-item${unlocked ? ' unlocked' : ''}`;
            item.innerHTML = `
                <div class="achievement-title">${achievement.icon} ${achievement.name}</div>
                <div>${achievement.description}</div>
            `;
            this.elements.achievementsList.appendChild(item);
        });
    }
}
