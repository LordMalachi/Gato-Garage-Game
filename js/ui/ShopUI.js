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

        const gap = Math.max(0, upgrade.cost - this.upgradeSystem.state.currency);
        const gapMarkup = !upgrade.canPurchase && !upgrade.isMaxed
            ? `<div class="shop-item-gap">Need ${NumberFormatter.formatCurrency(gap)}</div>`
            : '';

        item.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name">${upgrade.name}</div>
                <div class="shop-item-desc">${upgrade.description}</div>
                <div class="shop-item-level">Lv.${upgrade.level}${upgrade.isMaxed ? ' (MAX)' : `/${upgrade.maxLevel}`}</div>
                ${gapMarkup}
            </div>
            <div class="shop-item-cost">
                ${upgrade.isMaxed ? 'MAXED' : NumberFormatter.formatCurrency(upgrade.cost)}
            </div>
        `;

        if (!upgrade.isMaxed) {
            item.addEventListener('click', (event) => this.purchaseUpgrade(upgrade.id, event));
        }

        return item;
    }

    /**
     * Purchase an upgrade
     * @param {string} upgradeId - Upgrade ID
     */
    purchaseUpgrade(upgradeId, event) {
        const buyCount = event?.shiftKey ? 10 : 1;
        let purchased = 0;
        for (let i = 0; i < buyCount; i++) {
            if (!this.upgradeSystem.purchase(upgradeId)) break;
            purchased++;
        }

        if (purchased > 0) {
            EventBus.emit(GameEvents.NOTIFICATION, {
                message: `Purchased ${UpgradeData[upgradeId].name} x${purchased}`
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

        const gap = Math.max(0, worker.cost - this.workerSystem.state.currency);
        const gapMarkup = !worker.canHire
            ? `<div class="shop-item-gap">Need ${NumberFormatter.formatCurrency(gap)}</div>`
            : '';

        item.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name" style="color: ${worker.color}">${worker.name}</div>
                <div class="shop-item-desc">${worker.repairRate}/s repair</div>
                <div class="shop-item-level">Owned: ${worker.owned}</div>
                ${gapMarkup}
            </div>
            <div class="shop-item-cost">
                ${NumberFormatter.formatCurrency(worker.cost)}
            </div>
        `;

        item.addEventListener('click', (event) => this.hireWorker(worker.id, event));

        return item;
    }

    /**
     * Hire a worker
     * @param {string} workerId - Worker type ID
     */
    hireWorker(workerId, event) {
        const buyCount = event?.shiftKey ? 10 : 1;
        let hired = 0;
        for (let i = 0; i < buyCount; i++) {
            if (!this.workerSystem.hire(workerId)) break;
            hired++;
        }

        if (hired > 0) {
            const worker = WorkerData[workerId];
            EventBus.emit(GameEvents.NOTIFICATION, {
                message: `Hired ${worker.name} x${hired}`
            });
        }
    }

    /**
     * Update affordability state of all items
     */
    updateAffordability() {
        // Full re-render keeps costs, gaps, and levels accurate.
        this.renderUpgrades();
        this.renderWorkers();
    }
}
