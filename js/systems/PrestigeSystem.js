/**
 * PrestigeSystem - Handles "Reborn" mechanics
 * Allows players to reset progress for permanent multipliers
 */
class PrestigeSystem {
    constructor(state, audioManager) {
        this.state = state;
        this.audioManager = audioManager;
        this.baseCost = 1000000; // $1M to start getting Gato Nip
    }

    /**
     * Calculate how much Gato Nip would be earned if resetting now
     * Formula: floor(sqrt(lifetimeEarnings / 1,000,000)) - totalLifetimeNipEarned
     */
    calculateClaimableNip() {
        if (this.state.lifetimeEarnings < this.baseCost) return 0;

        const totalPotentialNip = Math.floor(Math.sqrt(this.state.lifetimeEarnings / this.baseCost));
        const earnedTotal = this.state.totalPrestigeEarned || this.state.prestigeCurrency;
        const claimable = totalPotentialNip - earnedTotal;

        return Math.max(0, claimable);
    }

    /**
     * Perform the prestige reset
     */
    prestige() {
        const claimable = this.calculateClaimableNip();
        if (claimable <= 0) return false;

        // 1. Save permanent values
        const newPrestigeCurrency = this.state.prestigeCurrency + claimable;
        const newTotalPrestigeEarned = (this.state.totalPrestigeEarned || this.state.prestigeCurrency) + claimable;
        const currentLifetimeEarnings = this.state.lifetimeEarnings;
        const savedNipUpgrades = { ...this.state.nipUpgrades };

        // 2. Add to stats
        EventBus.emit(GameEvents.NOTIFICATION, {
            message: `ASCENDED! +${claimable} Gato Nip`,
            type: 'prestige'
        });

        // 3. Reset Game State
        this.state.reset();

        // 4. Restore permanent values
        this.state.prestigeCurrency = newPrestigeCurrency;
        this.state.totalPrestigeEarned = newTotalPrestigeEarned;
        this.state.nipUpgrades = savedNipUpgrades;
        this.state.lifetimeEarnings = currentLifetimeEarnings;

        // 5. Recalculate multipliers
        this.state.recalculateStats();
        EventBus.emit(GameEvents.PRESTIGE_CURRENCY_CHANGED, this.state.prestigeCurrency);

        // 6. Save immediately
        // (Caller should trigger save)

        return true;
    }

    /**
     * Get next Gato Nip threshold
     */
    getNextNipCost() {
        const earnedTotal = this.state.totalPrestigeEarned || this.state.prestigeCurrency;
        const currentTotal = earnedTotal + this.calculateClaimableNip();
        const nextTotal = currentTotal + 1;
        // Inverse of formula: cost = nip^2 * baseCost
        const reqEarnings = (nextTotal * nextTotal) * this.baseCost;
        return reqEarnings - this.state.lifetimeEarnings;
    }
}
