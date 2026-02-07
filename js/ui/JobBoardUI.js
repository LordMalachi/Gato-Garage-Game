/**
 * JobBoardUI - Renders and updates the contract board interface.
 */
class JobBoardUI {
    /**
     * @param {JobBoardSystem} jobBoardSystem - Job board system reference
     * @param {GameState} gameState - State reference
     */
    constructor(jobBoardSystem, gameState) {
        this.jobBoardSystem = jobBoardSystem;
        this.state = gameState;

        this.summaryEl = document.getElementById('job-board-summary');
        this.activeEl = document.getElementById('active-job-contract');
        this.listEl = document.getElementById('job-board-list');

        this.activeTimeEl = null;
        this.timer = null;

        if (!this.summaryEl || !this.activeEl || !this.listEl) {
            return;
        }

        this.bindEvents();
        this.render();
        this.startTimer();
    }

    /**
     * Subscribe to board-related events.
     */
    bindEvents() {
        EventBus.on(GameEvents.JOB_BOARD_UPDATED, () => this.render());
        EventBus.on(GameEvents.JOB_ACCEPTED, () => this.render());
        EventBus.on(GameEvents.JOB_COMPLETED, () => this.render());
        EventBus.on(GameEvents.JOB_FAILED, () => this.render());
    }

    /**
     * Start countdown refresh for active contract.
     */
    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            this.updateActiveCountdown();
        }, 250);
    }

    /**
     * Stop countdown refresh timer.
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Render the full job board.
     */
    render() {
        if (!this.listEl || !this.activeEl || !this.summaryEl) return;

        const info = this.jobBoardSystem.getBoardInfo();
        this.summaryEl.textContent = `Completed ${info.completed} | Failed ${info.failed}`;
        this.renderActiveContract(info.activeContract);
        this.renderContractList(info.contracts, !!info.activeContract);
    }

    /**
     * Render active contract card.
     * @param {Object|null} active - Active contract info
     */
    renderActiveContract(active) {
        this.activeTimeEl = null;

        if (!active) {
            this.activeEl.innerHTML = '<div class="job-empty">No active contract.</div>';
            return;
        }

        this.activeEl.innerHTML = `
            <div class="job-active-card">
                <div class="job-card-title">Active: ${active.label}</div>
                <div class="job-card-line">Payout x${active.payoutMultiplier.toFixed(2)} | XP +${active.bonusXP}</div>
                <div class="job-card-line">Repair x${active.repairMultiplier.toFixed(2)}</div>
                <div class="job-card-line">Time Left: <span class="job-active-time">--:--</span></div>
                <button type="button" class="menu-btn job-abandon-btn">Abandon</button>
            </div>
        `;

        this.activeTimeEl = this.activeEl.querySelector('.job-active-time');
        this.updateActiveCountdown();

        const abandonBtn = this.activeEl.querySelector('.job-abandon-btn');
        if (abandonBtn) {
            abandonBtn.addEventListener('click', () => {
                this.jobBoardSystem.abandonActiveContract();
            });
        }
    }

    /**
     * Render available contract list.
     * @param {Array<Object>} contracts - Available contracts
     * @param {boolean} hasActive - Whether player has active contract
     */
    renderContractList(contracts, hasActive) {
        this.listEl.innerHTML = '';

        contracts.forEach((contract) => {
            const card = document.createElement('div');
            card.className = `job-card${hasActive ? ' disabled' : ''}`;

            const acceptDisabled = hasActive;
            card.innerHTML = `
                <div class="job-card-title">${contract.label}</div>
                <div class="job-card-line">Repair x${contract.repairMultiplier.toFixed(2)}</div>
                <div class="job-card-line">Payout x${contract.payoutMultiplier.toFixed(2)} | XP +${contract.bonusXP}</div>
                <div class="job-card-line">Deadline ${Math.ceil(contract.durationMs / 1000)}s</div>
                <button type="button" class="menu-btn job-accept-btn"${acceptDisabled ? ' disabled' : ''}>Accept</button>
            `;

            const acceptBtn = card.querySelector('.job-accept-btn');
            if (acceptBtn && !acceptDisabled) {
                acceptBtn.addEventListener('click', () => {
                    const result = this.jobBoardSystem.acceptContract(contract.id);
                    if (!result.ok) {
                        EventBus.emit(GameEvents.NOTIFICATION, { message: result.message });
                    }
                });
            }

            this.listEl.appendChild(card);
        });
    }

    /**
     * Update active contract countdown text.
     */
    updateActiveCountdown() {
        if (!this.activeTimeEl) return;

        const active = this.jobBoardSystem.getBoardInfo().activeContract;
        if (!active) {
            this.activeTimeEl.textContent = '--:--';
            return;
        }

        this.activeTimeEl.textContent = this.formatTime(active.timeRemainingMs);
    }

    /**
     * Format milliseconds to MM:SS.
     * @param {number} ms - Remaining milliseconds
     * @returns {string} Time string
     */
    formatTime(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const mm = String(minutes).padStart(2, '0');
        const ss = String(seconds).padStart(2, '0');
        return `${mm}:${ss}`;
    }
}
