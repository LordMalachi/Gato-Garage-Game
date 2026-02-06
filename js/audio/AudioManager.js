/**
 * AudioManager - Handles background music playback and audio settings
 */
class AudioManager {
    constructor() {
        this.settingsKey = 'gato-garage-audio-settings';
        this.musicPath = 'assets/sounds/music/Gato_Garage.mp3';
        this.music = null;
        this.started = false;
        this.unlockListenersAttached = false;

        const savedSettings = this.loadSettings();
        this.volume = savedSettings.volume;
        this.muted = savedSettings.muted;

        this.initMusic();
    }

    /**
     * Initialize music audio element
     */
    initMusic() {
        this.music = new Audio(this.musicPath);
        this.music.loop = true;
        this.music.preload = 'auto';
        this.music.volume = this.getEffectiveVolume();
    }

    /**
     * Start background music playback
     */
    start() {
        this.started = true;
        this.tryPlayMusic();
    }

    /**
     * Stop music playback
     */
    stop() {
        if (!this.music) return;
        this.music.pause();
        this.music.currentTime = 0;
    }

    /**
     * Update music volume
     * @param {number} volume - Volume from 0.0 to 1.0
     */
    setVolume(volume) {
        const clamped = Math.max(0, Math.min(1, volume));
        this.volume = clamped;
        this.applyVolume();
        this.saveSettings();
    }

    /**
     * Mute or unmute music
     * @param {boolean} muted - Whether music should be muted
     */
    setMuted(muted) {
        this.muted = Boolean(muted);
        this.applyVolume();

        if (this.muted) {
            this.music.pause();
        } else if (this.started) {
            this.tryPlayMusic();
        }

        this.saveSettings();
    }

    /**
     * Get current audio settings
     * @returns {{volume:number, muted:boolean}}
     */
    getSettings() {
        return {
            volume: this.volume,
            muted: this.muted
        };
    }

    /**
     * Try playing music and attach unlock listeners if blocked by autoplay policy
     */
    tryPlayMusic() {
        if (!this.music || this.muted) return;

        this.music.play().catch(() => {
            this.attachUnlockListeners();
        });
    }

    /**
     * Attach one-time listeners to unlock audio on user interaction
     */
    attachUnlockListeners() {
        if (this.unlockListenersAttached) return;
        this.unlockListenersAttached = true;

        const unlock = () => {
            this.tryPlayMusic();
            this.detachUnlockListeners();
        };

        document.addEventListener('pointerdown', unlock, true);
        document.addEventListener('keydown', unlock, true);
        document.addEventListener('touchstart', unlock, true);
        this.unlockHandler = unlock;
    }

    /**
     * Remove unlock listeners
     */
    detachUnlockListeners() {
        if (!this.unlockListenersAttached || !this.unlockHandler) return;

        document.removeEventListener('pointerdown', this.unlockHandler, true);
        document.removeEventListener('keydown', this.unlockHandler, true);
        document.removeEventListener('touchstart', this.unlockHandler, true);
        this.unlockListenersAttached = false;
        this.unlockHandler = null;
    }

    /**
     * Apply effective volume to audio element
     */
    applyVolume() {
        if (!this.music) return;
        this.music.volume = this.getEffectiveVolume();
    }

    /**
     * Effective volume accounting for mute state
     * @returns {number}
     */
    getEffectiveVolume() {
        return this.muted ? 0 : this.volume;
    }

    /**
     * Load saved audio settings
     * @returns {{volume:number, muted:boolean}}
     */
    loadSettings() {
        const defaults = { volume: 0.4, muted: false };
        try {
            const raw = localStorage.getItem(this.settingsKey);
            if (!raw) return defaults;

            const parsed = JSON.parse(raw);
            const volume = typeof parsed.volume === 'number' ? parsed.volume : defaults.volume;
            const muted = Boolean(parsed.muted);

            return {
                volume: Math.max(0, Math.min(1, volume)),
                muted
            };
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
            return defaults;
        }
    }

    /**
     * Persist audio settings
     */
    saveSettings() {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify({
                volume: this.volume,
                muted: this.muted
            }));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }
}
