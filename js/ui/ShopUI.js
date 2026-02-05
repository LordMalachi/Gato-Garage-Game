/**
 * ShopUI - Handles the upgrade and worker shop interfaces
 */
class ShopUI {
    /**
     * Create shop UI
     * @param {UpgradeSystem} upgradeSystem - Upgrade system reference
     * @param {WorkerSystem} workerSystem - Worker system reference
     */
    constructor(upgradeSystem, workerSystem) {
        this.upgradeSystem = upgradeSystem;
        this.workerSystem = workerSystem;

        // DOM elements
        this.upgradesList = document.getElementById('upgrades-list');
        this.workersList = document.getElementById('workers-list');

        // Initial render
        this.renderUpgrades();
        this.renderWorkers();

        // Subscribe to events
        EventBus.on(GameEvents.CURRENCY_CHANGED, () => this.updateAffordability());
        EventBus.on(GameEvents.UPGRADE_PURCHASED, () => this.renderUpgrades());
        EventBus.on(GameEvents.WORKER_HIRED, () => this.renderWorkers());
    }

    /**
     * Render all upgrades
     */
    renderUpgrades() {
        if (!this.upgradesList) return;

        this.upgradesList.innerHTML = '';

        const upgrades = this.upgradeSystem.getAllUpgradeInfo();

        upgrades.forEach(upgrade => {
            const item = this.createUpgradeItem(upgrade);
            this.upgradesList.appendChild(item);
        });
    }

    /**
     * Create an upgrade item element
     * @param {Object} upgrade - Upgrade info
     * @returns {HTMLElement} Upgrade item element
     */
    createUpgradeItem(upgrade) {
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.dataset.upgradeId = upgrade.id;

        if (upgrade.isMaxed) {
            item.classList.add('disabled', 'maxed');
        } else if (!upgrade.canAfford) {
            item.classList.add('disabled');
        }

        item.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name">${upgrade.name}</div>
                <div class="shop-item-desc">${upgrade.description}</div>
                <div class="shop-item-level">Lv.${upgrade.level}${upgrade.isMaxed ? ' (MAX)' : `/${upgrade.maxLevel}`}</div>
            </div>
            <div class="shop-item-cost">
                ${upgrade.isMaxed ? 'MAXED' : NumberFormatter.formatCurrency(upgrade.cost)}
            </div>
        `;

        if (!upgrade.isMaxed) {
            item.addEventListener('click', () => this.purchaseUpgrade(upgrade.id));
        }

        return item;
    }

    /**
     * Purchase an upgrade
     * @param {string} upgradeId - Upgrade ID
     */
    purchaseUpgrade(upgradeId) {
        const success = this.upgradeSystem.purchase(upgradeId);

        if (success) {
            EventBus.emit(GameEvents.NOTIFICATION, {
                message: `Purchased ${UpgradeData[upgradeId].name}!`
            });
        }
    }

    /**
     * Render all workers
     */
    renderWorkers() {
        if (!this.workersList) return;

        this.workersList.innerHTML = '';

        const workers = this.workerSystem.getAllWorkerInfo();

        workers.forEach(worker => {
            const item = this.createWorkerItem(worker);
            this.workersList.appendChild(item);
        });
    }

    /**
     * Create a worker item element
     * @param {Object} worker - Worker info
     * @returns {HTMLElement} Worker item element
     */
    createWorkerItem(worker) {
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.dataset.workerId = worker.id;

        if (!worker.canAfford) {
            item.classList.add('disabled');
        }

        item.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name" style="color: ${worker.color}">${worker.name}</div>
                <div class="shop-item-desc">${worker.repairRate}/s repair</div>
                <div class="shop-item-level">Owned: ${worker.owned}</div>
            </div>
            <div class="shop-item-cost">
                ${NumberFormatter.formatCurrency(worker.cost)}
            </div>
        `;

        item.addEventListener('click', () => this.hireWorker(worker.id));

        return item;
    }

    /**
     * Hire a worker
     * @param {string} workerId - Worker type ID
     */
    hireWorker(workerId) {
        const success = this.workerSystem.hire(workerId);

        if (success) {
            const worker = WorkerData[workerId];
            EventBus.emit(GameEvents.NOTIFICATION, {
                message: `Hired ${worker.name}!`
            });
        }
    }

    /**
     * Update affordability state of all items
     */
    updateAffordability() {
        // Update upgrades
        const upgradeItems = this.upgradesList?.querySelectorAll('.shop-item');
        upgradeItems?.forEach(item => {
            const upgradeId = item.dataset.upgradeId;
            const info = this.upgradeSystem.getUpgradeInfo(upgradeId);

            item.classList.toggle('disabled', !info.canPurchase);

            // Update cost display
            const costEl = item.querySelector('.shop-item-cost');
            if (costEl && !info.isMaxed) {
                costEl.textContent = NumberFormatter.formatCurrency(info.cost);
            }
        });

        // Update workers
        const workerItems = this.workersList?.querySelectorAll('.shop-item');
        workerItems?.forEach(item => {
            const workerId = item.dataset.workerId;
            const info = this.workerSystem.getWorkerInfo(workerId);

            item.classList.toggle('disabled', !info.canHire);

            // Update cost display
            const costEl = item.querySelector('.shop-item-cost');
            if (costEl) {
                costEl.textContent = NumberFormatter.formatCurrency(info.cost);
            }
        });
    }
}
