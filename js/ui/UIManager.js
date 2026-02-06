/**
 * UIManager - Coordinates all UI components and handles global UI updates
 */
class UIManager {
    /**
     * Create UI manager
     * @param {GameState} gameState - Game state reference
     */
    constructor(gameState) {
        this.state = gameState;

        // DOM elements
        this.elements = {
            currencyValue: document.getElementById('currency-value'),
            clickPower: document.getElementById('click-power'),
            autoRate: document.getElementById('auto-rate'),
            carName: document.getElementById('car-name'),
            carValue: document.getElementById('car-value'),
            repairBar: document.getElementById('repair-bar'),
            carQueue: document.getElementById('car-queue'),
            queueStatus: document.getElementById('queue-status'),
            floatingNumbers: document.getElementById('floating-numbers'),
            notifications: document.getElementById('notifications'),
            offlineModal: document.getElementById('offline-modal'),
            offlineEarnings: document.getElementById('offline-earnings'),
            offlineOkBtn: document.getElementById('offline-ok-btn'),
            saveBtn: document.getElementById('save-btn'),
            comboValue: document.getElementById('combo-value'),
            comboBar: document.getElementById('combo-bar'),
            progressionDisplay: document.getElementById('progression-display')
        };

        this.setupEventListeners();
        this.createProgressionUI();
    }

    /**
     * Setup event listeners for UI events
     */
    setupEventListeners() {
        // Game events
        EventBus.on(GameEvents.CURRENCY_CHANGED, (amount) => this.updateCurrency(amount));
        EventBus.on(GameEvents.CLICK_POWER_CHANGED, (power) => this.updateClickPower(power));
        EventBus.on(GameEvents.CAR_STARTED, (data) => this.updateCurrentCar(data.car));
        EventBus.on(GameEvents.CAR_PROGRESS, (data) => this.updateRepairProgress(data.progress));
        EventBus.on(GameEvents.CAR_REPAIRED, (data) => this.onCarRepaired(data));
        EventBus.on(GameEvents.CLICK_PERFORMED, (data) => this.showFloatingNumber(data));
        EventBus.on(GameEvents.OFFLINE_EARNINGS, (data) => this.showOfflineEarnings(data));
        EventBus.on(GameEvents.NOTIFICATION, (data) => this.showNotification(data.message));
        EventBus.on(GameEvents.GAME_SAVED, () => this.showNotification('Game saved!'));
        EventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (data) => {
            this.showNotification(`Achievement: ${data.achievement.name}`);
        });
        EventBus.on(GameEvents.CLICK_PERFORMED, (data) => this.updateCombo(data.combo));

        // Progression events
        EventBus.on(GameEvents.XP_EARNED, (data) => this.showFloatingXP(data.amount));
        EventBus.on(GameEvents.LEVEL_UP, (data) => {
            this.showNotification(`Level Up! Garage Level ${data.newLevel}`, 'success');
        });
        EventBus.on(GameEvents.TIER_UP, (data) => {
            this.showNotification(`Tier ${data.newTier} Unlocked! Cars are harder but more valuable!`, 'epic');
        });
        EventBus.on(GameEvents.CAR_UNLOCKED, (data) => {
            this.showNotification(`${data.carName} Unlocked!`, 'success');
        });

        // Offline modal button
        if (this.elements.offlineOkBtn) {
            this.elements.offlineOkBtn.addEventListener('click', () => {
                this.hideOfflineModal();
            });
        }
    }

    /**
     * Update currency display
     * @param {number} amount - Current currency
     */
    updateCurrency(amount) {
        if (this.elements.currencyValue) {
            this.elements.currencyValue.textContent = NumberFormatter.format(amount);

            // Bump animation
            this.elements.currencyValue.classList.add('bump');
            setTimeout(() => {
                this.elements.currencyValue.classList.remove('bump');
            }, 100);
        }
    }

    /**
     * Update click power display
     * @param {number} power - Current click power
     */
    updateClickPower(power) {
        if (this.elements.clickPower) {
            this.elements.clickPower.textContent = NumberFormatter.format(power);
        }
    }

    /**
     * Update auto repair rate display
     * @param {number} rate - Repair per second
     */
    updateAutoRate(rate) {
        if (this.elements.autoRate) {
            this.elements.autoRate.textContent = NumberFormatter.format(rate);
        }
    }

    /**
     * Update current car display
     * @param {Car} car - Current car or null
     */
    updateCurrentCar(car) {
        if (!car) {
            if (this.elements.carName) {
                this.elements.carName.textContent = 'Waiting...';
            }
            if (this.elements.carValue) {
                this.elements.carValue.textContent = '$0';
            }
            if (this.elements.repairBar) {
                this.elements.repairBar.style.width = '0%';
            }
            return;
        }

        if (this.elements.carName) {
            this.elements.carName.textContent = car.name;
            this.elements.carName.style.color = car.color;
        }

        if (this.elements.carValue) {
            const value = car.getValue(this.state.getCarValueMultiplier());
            this.elements.carValue.textContent = NumberFormatter.formatCurrency(value);
        }

        this.updateRepairProgress(car.getProgressPercent());
    }

    /**
     * Update repair progress bar
     * @param {number} progress - Progress 0-1
     */
    updateRepairProgress(progress) {
        if (this.elements.repairBar) {
            this.elements.repairBar.style.width = `${progress * 100}%`;
        }
    }

    /**
     * Handle car repaired event
     * @param {Object} data - Event data
     */
    onCarRepaired(data) {
        const comboBonus = data.clickBonusMultiplier && data.clickBonusMultiplier > 1
            ? ` (Combo +${Math.floor((data.clickBonusMultiplier - 1) * 100)}%)`
            : '';
        this.showNotification(`+${NumberFormatter.formatCurrency(data.payment)}${comboBonus}`);

        // Clear current car display
        this.updateCurrentCar(null);
    }

    /**
     * Update car queue display
     * @param {Array} queue - Array of cars in queue
     */
    updateCarQueue(queue) {
        if (!this.elements.carQueue) return;

        this.elements.carQueue.innerHTML = '';

        queue.forEach(car => {
            const carEl = document.createElement('div');
            carEl.className = 'queue-car';
            carEl.style.borderColor = car.color;
            carEl.innerHTML = `<span style="color: ${car.color}">${car.name.charAt(0)}</span>`;
            this.elements.carQueue.appendChild(carEl);
        });

        // Fill empty slots
        for (let i = queue.length; i < 5; i++) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'queue-car';
            emptyEl.innerHTML = '<span>-</span>';
            this.elements.carQueue.appendChild(emptyEl);
        }
    }

    /**
     * Update queue timing and fullness display
     * @param {Object} queueInfo - Queue info from CarQueueSystem
     */
    updateQueueStatus(queueInfo) {
        if (!this.elements.queueStatus || !queueInfo) return;

        if (queueInfo.queueLength >= queueInfo.maxSize) {
            this.elements.queueStatus.textContent = 'Queue full';
            return;
        }

        const seconds = (queueInfo.timeToNextSpawn / 1000).toFixed(1);
        this.elements.queueStatus.textContent = `Next car in ${seconds}s`;
    }

    /**
     * Update combo HUD state
     * @param {number} combo - Current combo multiplier
     */
    updateCombo(combo) {
        if (this.elements.comboValue) {
            this.elements.comboValue.textContent = `x${combo.toFixed(1)}`;
        }

        if (this.elements.comboBar) {
            const percent = Math.min(100, Math.max(0, ((combo - 1) / 1) * 100));
            this.elements.comboBar.style.width = `${percent}%`;
        }
    }

    /**
     * Show floating damage number
     * @param {Object} data - Click data with position and amount
     */
    showFloatingNumber(data) {
        if (!this.elements.floatingNumbers) return;

        const numEl = document.createElement('div');
        numEl.className = 'floating-number' + (data.isCrit ? ' crit' : '');
        numEl.textContent = '+' + NumberFormatter.format(data.amount);

        // Random offset
        const offsetX = (Math.random() - 0.5) * 40;
        numEl.style.left = `${data.x + offsetX}px`;
        numEl.style.top = `${data.y}px`;

        this.elements.floatingNumbers.appendChild(numEl);

        // Remove after animation
        setTimeout(() => {
            numEl.remove();
        }, 1000);
    }

    /**
     * Show notification message
     * @param {string} message - Message to show
     */
    showNotification(message) {
        if (!this.elements.notifications) return;

        const notifEl = document.createElement('div');
        notifEl.className = 'notification';
        notifEl.textContent = message;

        this.elements.notifications.appendChild(notifEl);

        // Remove after delay
        setTimeout(() => {
            notifEl.style.opacity = '0';
            setTimeout(() => notifEl.remove(), 300);
        }, 2000);
    }

    /**
     * Show offline earnings modal
     * @param {Object} data - Offline earnings data
     */
    showOfflineEarnings(data) {
        if (!this.elements.offlineModal || data.earnings <= 0) return;

        if (this.elements.offlineEarnings) {
            this.elements.offlineEarnings.textContent = NumberFormatter.formatCurrency(data.earnings);
        }

        this.elements.offlineModal.classList.remove('hidden');
    }

    /**
     * Hide offline earnings modal
     */
    hideOfflineModal() {
        if (this.elements.offlineModal) {
            this.elements.offlineModal.classList.add('hidden');
        }
    }

    /**
     * Update all UI elements from current state
     */
    updateAll() {
        this.updateCurrency(this.state.currency);
        this.updateClickPower(this.state.clickPower);
        this.updateAutoRate(this.state.autoRepairRate);
        this.updateCurrentCar(this.state.currentCar);
        this.updateCarQueue(this.state.carQueue);
        this.updateCombo(1);
    }

    /**
     * Create progression UI elements
     */
    createProgressionUI() {
        if (!this.elements.progressionDisplay) return;

        this.elements.progressionDisplay.innerHTML = `
            <div class="xp-bar">
                <div class="xp-info">
                    <span class="garage-level">Level 1</span>
                    <span class="tier-badge tier-1">Tier 1</span>
                </div>
                <div class="xp-progress-container">
                    <div class="xp-progress-fill"></div>
                    <span class="xp-text">0 / 100 XP</span>
                </div>
                <div class="next-unlock"></div>
            </div>
        `;
    }

    /**
     * Update progression UI display
     * @param {Object} progressInfo - Progression info from ProgressionSystem
     */
    updateProgressionUI(progressInfo) {
        if (!this.elements.progressionDisplay) return;

        const { level, xp, nextLevelXP, tier, progress, nextUnlock } = progressInfo;

        const garageLevel = this.elements.progressionDisplay.querySelector('.garage-level');
        const tierBadge = this.elements.progressionDisplay.querySelector('.tier-badge');
        const xpText = this.elements.progressionDisplay.querySelector('.xp-text');
        const xpFill = this.elements.progressionDisplay.querySelector('.xp-progress-fill');
        const nextUnlockEl = this.elements.progressionDisplay.querySelector('.next-unlock');

        if (garageLevel) {
            garageLevel.textContent = `Level ${level}`;
        }

        if (tierBadge) {
            tierBadge.textContent = `Tier ${tier}`;
            tierBadge.className = `tier-badge tier-${tier}`;
        }

        if (xpText) {
            xpText.textContent = `${NumberFormatter.format(xp)} / ${NumberFormatter.format(nextLevelXP)} XP`;
        }

        if (xpFill) {
            xpFill.style.width = `${progress * 100}%`;
        }

        if (nextUnlockEl && nextUnlock) {
            nextUnlockEl.textContent = `Next unlock: ${nextUnlock.carName} at Level ${nextUnlock.level}`;
        } else if (nextUnlockEl) {
            nextUnlockEl.textContent = 'All cars unlocked!';
        }
    }

    /**
     * Show floating XP text
     * @param {number} amount - XP amount earned
     */
    showFloatingXP(amount) {
        if (!this.elements.progressionDisplay) return;

        const xpElement = document.createElement('div');
        xpElement.className = 'floating-xp';
        xpElement.textContent = `+${amount} XP`;

        // Position near progression bar
        const rect = this.elements.progressionDisplay.getBoundingClientRect();
        xpElement.style.position = 'fixed';
        xpElement.style.left = `${rect.left + rect.width / 2}px`;
        xpElement.style.top = `${rect.top}px`;
        xpElement.style.transform = 'translateX(-50%)';

        document.body.appendChild(xpElement);

        // Remove after animation
        setTimeout(() => {
            xpElement.remove();
        }, 1500);
    }
}
