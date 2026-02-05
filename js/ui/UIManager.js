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
            floatingNumbers: document.getElementById('floating-numbers'),
            notifications: document.getElementById('notifications'),
            offlineModal: document.getElementById('offline-modal'),
            offlineEarnings: document.getElementById('offline-earnings'),
            offlineOkBtn: document.getElementById('offline-ok-btn'),
            saveBtn: document.getElementById('save-btn')
        };

        this.setupEventListeners();
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
        this.showNotification(`+${NumberFormatter.formatCurrency(data.payment)}`);

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
    }
}
