/**
 * EventBus - Simple pub/sub system for decoupled communication between game systems
 */
const EventBus = {
    events: {},

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    },

    /**
     * Subscribe to an event (only fires once)
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    },

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function to remove
     */
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    },

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} data - Data to pass to handlers
     */
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    },

    /**
     * Remove all listeners for an event or all events
     * @param {string} [event] - Event name (optional, clears all if not provided)
     */
    clear(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }
};

// Event name constants for type safety and discoverability
const GameEvents = {
    // Click events
    CLICK_PERFORMED: 'click:performed',
    CLICK_POWER_CHANGED: 'click:power:changed',

    // Currency events
    CURRENCY_CHANGED: 'currency:changed',
    CURRENCY_EARNED: 'currency:earned',
    CURRENCY_SPENT: 'currency:spent',
    PRESTIGE_CURRENCY_CHANGED: 'prestige:currency:changed',

    // Car events
    CAR_QUEUED: 'car:queued',
    CAR_STARTED: 'car:started',
    CAR_REPAIRED: 'car:repaired',
    CAR_PROGRESS: 'car:progress',

    // Upgrade events
    UPGRADE_PURCHASED: 'upgrade:purchased',
    UPGRADE_AVAILABLE: 'upgrade:available',
    NIP_UPGRADE_PURCHASED: 'nip:upgrade:purchased',

    // Worker events
    WORKER_HIRED: 'worker:hired',
    WORKER_WORKING: 'worker:working',

    // Game events
    GAME_SAVED: 'game:saved',
    GAME_LOADED: 'game:loaded',
    GAME_RESET: 'game:reset',

    // Achievement events
    ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',

    // Offline events
    OFFLINE_EARNINGS: 'offline:earnings',

    // UI events
    NOTIFICATION: 'ui:notification',
    SHOP_UPDATED: 'ui:shop:updated',

    // Progression events
    XP_EARNED: 'progression:xp:earned',
    LEVEL_UP: 'progression:level:up',
    TIER_UP: 'progression:tier:up',
    CAR_UNLOCKED: 'progression:car:unlocked',

    // Job board events
    JOB_BOARD_UPDATED: 'job:board:updated',
    JOB_ACCEPTED: 'job:accepted',
    JOB_COMPLETED: 'job:completed',
    JOB_FAILED: 'job:failed'
};
