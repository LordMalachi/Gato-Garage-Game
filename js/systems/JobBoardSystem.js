/**
 * JobBoardSystem - Generates optional contracts with timed bonuses.
 */
class JobBoardSystem {
    /**
     * @param {GameState} gameState - State reference
     * @param {ProgressionSystem} progressionSystem - Progression reference
     */
    constructor(gameState, progressionSystem) {
        this.state = gameState;
        this.progressionSystem = progressionSystem;
        this.maxContracts = 3;
        this.refreshInterval = 25000;
        this.refreshTimer = 0;

        this.jobFlavors = [
            'Fleet Rush',
            'Express Detail',
            'VIP Priority',
            'Tow Truck Special',
            'Night Shift Rescue',
            'Rush Bay Order'
        ];

        EventBus.on(GameEvents.CAR_REPAIRED, (data) => this.handleCarRepaired(data));
        this.refreshContracts(true);
    }

    /**
     * Update timers and contract expiration.
     * @param {number} deltaMs - Fixed timestep delta
     */
    update(deltaMs) {
        this.refreshTimer += deltaMs;

        if (this.state.activeJobContract && Date.now() > this.state.activeJobContract.expiresAt) {
            this.expireActiveContract();
        }

        if (this.refreshTimer >= this.refreshInterval) {
            this.refreshTimer = 0;
            this.refreshContracts();
        }
    }

    /**
     * Ensure board has contracts, optionally replacing all.
     * @param {boolean} [replaceAll=false] - Whether to replace all contract entries
     */
    refreshContracts(replaceAll = false) {
        if (replaceAll) {
            this.state.jobContracts = [];
        }

        if (this.state.jobContracts.length > this.maxContracts) {
            this.state.jobContracts = this.state.jobContracts.slice(0, this.maxContracts);
        }

        while (this.state.jobContracts.length < this.maxContracts) {
            this.state.jobContracts.push(this.generateContract());
        }

        EventBus.emit(GameEvents.JOB_BOARD_UPDATED, this.getBoardInfo());
    }

    /**
     * Reconcile contracts after loading a save.
     */
    reconcileAfterLoad() {
        if (this.state.activeJobContract && Date.now() > this.state.activeJobContract.expiresAt) {
            this.expireActiveContract();
            return;
        }

        if (this.state.activeJobContract) {
            const contractId = this.state.activeJobContract.id;
            const hasContractCar = (
                (this.state.currentCar && this.state.currentCar.contractMeta && this.state.currentCar.contractMeta.id === contractId) ||
                this.state.carQueue.some((car) => car.contractMeta && car.contractMeta.id === contractId)
            );

            if (!hasContractCar) {
                this.spawnContractCar(this.state.activeJobContract);
            }
        }

        this.refreshContracts();
    }

    /**
     * Accept a contract and queue its car.
     * @param {string} contractId - Contract ID
     * @returns {Object} Result object
     */
    acceptContract(contractId) {
        if (this.state.activeJobContract) {
            return { ok: false, message: 'You already have an active contract.' };
        }

        const index = this.state.jobContracts.findIndex((contract) => contract.id === contractId);
        if (index === -1) {
            return { ok: false, message: 'Contract not found.' };
        }

        const contract = this.state.jobContracts.splice(index, 1)[0];
        const activeContract = {
            ...contract,
            acceptedAt: Date.now(),
            expiresAt: Date.now() + contract.durationMs
        };

        this.state.activeJobContract = activeContract;
        this.spawnContractCar(activeContract);
        this.refreshContracts();

        EventBus.emit(GameEvents.JOB_ACCEPTED, { contract: activeContract });
        EventBus.emit(GameEvents.NOTIFICATION, {
            message: `Accepted: ${activeContract.label} (${activeContract.carName})`
        });

        return { ok: true };
    }

    /**
     * Abandon the active contract and remove its queued/current car.
     * @returns {boolean} True if a contract was abandoned
     */
    abandonActiveContract() {
        const active = this.state.activeJobContract;
        if (!active) return false;

        const contractId = active.id;
        let removedCurrent = false;

        if (this.state.currentCar && this.state.currentCar.contractMeta && this.state.currentCar.contractMeta.id === contractId) {
            this.state.currentCar = null;
            this.state.currentCarStartTime = null;
            removedCurrent = true;
        }

        this.state.carQueue = this.state.carQueue.filter((car) => {
            return !(car.contractMeta && car.contractMeta.id === contractId);
        });

        this.state.activeJobContract = null;
        this.state.contractsFailed += 1;
        this.refreshContracts();

        if (removedCurrent && this.state.carQueue.length > 0) {
            this.state.currentCar = this.state.carQueue.shift();
            this.state.currentCarStartTime = Date.now();
            EventBus.emit(GameEvents.CAR_STARTED, {
                car: this.state.currentCar,
                queueLength: this.state.carQueue.length
            });
        }

        EventBus.emit(GameEvents.JOB_FAILED, {
            contract: active,
            reason: 'abandoned'
        });
        EventBus.emit(GameEvents.NOTIFICATION, {
            message: `Contract abandoned: ${active.label}`
        });

        return true;
    }

    /**
     * Get display info for the board.
     * @returns {Object} Board display data
     */
    getBoardInfo() {
        const active = this.state.activeJobContract
            ? {
                ...this.state.activeJobContract,
                timeRemainingMs: Math.max(0, this.state.activeJobContract.expiresAt - Date.now())
            }
            : null;

        return {
            contracts: [...this.state.jobContracts],
            activeContract: active,
            completed: this.state.contractsCompleted,
            failed: this.state.contractsFailed
        };
    }

    /**
     * Generate one contract from unlocked cars.
     * @returns {Object} Contract data
     */
    generateContract() {
        const unlockedCars = this.state.unlockedCars
            .map((id) => CarData[id])
            .filter(Boolean);

        const pool = unlockedCars.length > 0 ? unlockedCars : [CarData.hatchback];
        const carDef = pool[Math.floor(Math.random() * pool.length)];
        const rarityBonus = this.getRarityBonus(carDef.rarity);
        const tierBonus = Math.max(0, this.state.currentTier - 1) * 0.05;

        const repairMultiplier = Number((1.1 + Math.random() * 0.5 + rarityBonus * 0.2 + tierBonus).toFixed(2));
        const payoutMultiplier = Number((1.25 + Math.random() * 0.75 + rarityBonus * 0.25).toFixed(2));
        const durationSec = Math.max(20, Math.floor(65 - rarityBonus * 18 - tierBonus * 50 + Math.random() * 14));
        const bonusXP = Math.max(8, Math.floor((carDef.repairCost / 8) * (1 + rarityBonus * 0.5)));
        const flavor = this.jobFlavors[Math.floor(Math.random() * this.jobFlavors.length)];

        return {
            id: this.generateId(),
            carId: carDef.id,
            carName: carDef.name,
            rarity: carDef.rarity,
            label: `${flavor} (${carDef.name})`,
            repairMultiplier,
            payoutMultiplier,
            bonusXP,
            durationMs: durationSec * 1000,
            createdAt: Date.now()
        };
    }

    /**
     * Spawn the contract car as current job or queue priority.
     * @param {Object} contract - Active contract data
     */
    spawnContractCar(contract) {
        const carDef = CarData[contract.carId] || CarData.hatchback;
        const contractCar = new Car(carDef);

        const tier = this.progressionSystem.getCurrentTier();
        contractCar.applyTierScaling(tier);
        contractCar.repairCost = Math.max(1, Math.floor(contractCar.repairCost * contract.repairMultiplier));
        contractCar.contractMeta = {
            id: contract.id,
            label: contract.label,
            payoutMultiplier: contract.payoutMultiplier,
            bonusXP: contract.bonusXP,
            expiresAt: contract.expiresAt,
            expired: false
        };

        if (!this.state.currentCar) {
            this.state.currentCar = contractCar;
            this.state.currentCarStartTime = Date.now();
            EventBus.emit(GameEvents.CAR_STARTED, {
                car: this.state.currentCar,
                queueLength: this.state.carQueue.length
            });
            return;
        }

        if (this.state.carQueue.length >= 5) {
            this.state.carQueue.pop();
        }
        this.state.carQueue.unshift(contractCar);
    }

    /**
     * Expire the current active contract.
     */
    expireActiveContract() {
        const active = this.state.activeJobContract;
        if (!active) return;

        this.markContractCarExpired(active.id);
        this.state.activeJobContract = null;
        this.state.contractsFailed += 1;
        this.refreshContracts();

        EventBus.emit(GameEvents.JOB_FAILED, {
            contract: active,
            reason: 'expired'
        });
        EventBus.emit(GameEvents.NOTIFICATION, {
            message: `Contract expired: ${active.label}`
        });
    }

    /**
     * Mark a contract car as expired so it no longer receives timed rewards.
     * @param {string} contractId - Contract ID
     */
    markContractCarExpired(contractId) {
        if (this.state.currentCar && this.state.currentCar.contractMeta && this.state.currentCar.contractMeta.id === contractId) {
            this.state.currentCar.contractMeta.expired = true;
        }

        this.state.carQueue.forEach((car) => {
            if (car.contractMeta && car.contractMeta.id === contractId) {
                car.contractMeta.expired = true;
            }
        });
    }

    /**
     * Handle completion/failure when a contract car is repaired.
     * @param {Object} data - CAR_REPAIRED event payload
     */
    handleCarRepaired(data) {
        const contractMeta = data && data.car && data.car.contractMeta;
        if (!contractMeta) return;

        const active = this.state.activeJobContract;
        if (!active || active.id !== contractMeta.id) return;

        const completedInTime = !!(data.contractResult && data.contractResult.completedInTime);
        this.state.activeJobContract = null;

        if (completedInTime) {
            this.state.contractsCompleted += 1;
            EventBus.emit(GameEvents.JOB_COMPLETED, {
                contract: active,
                payout: data.payment
            });
            EventBus.emit(GameEvents.NOTIFICATION, {
                message: `Contract complete: ${active.label}`
            });
        } else {
            this.state.contractsFailed += 1;
            EventBus.emit(GameEvents.JOB_FAILED, {
                contract: active,
                reason: 'late'
            });
            EventBus.emit(GameEvents.NOTIFICATION, {
                message: `Contract failed (late): ${active.label}`
            });
        }

        this.refreshContracts();
    }

    /**
     * Get rarity bonus scalar.
     * @param {string} rarity - Car rarity
     * @returns {number} Bonus scalar
     */
    getRarityBonus(rarity) {
        switch (rarity) {
            case 'legendary':
                return 1.2;
            case 'rare':
                return 0.8;
            case 'uncommon':
                return 0.45;
            default:
                return 0.2;
        }
    }

    /**
     * Generate a stable-ish unique ID for contracts.
     * @returns {string} Unique contract ID
     */
    generateId() {
        const rand = Math.random().toString(36).slice(2, 8);
        return `job-${Date.now()}-${rand}`;
    }
}
