/**
 * AudioManager - Handles background music playback and audio settings, plus synthesized SFX.
 */
class AudioManager {
    constructor() {
        this.settingsKey = 'gato-garage-audio-settings';
        // Music tracks
        this.musicPath = 'assets/sounds/music/Gato_Garage.mp3';
        this.music = null;

        // Audio Context for SFX
        this.audioCtx = null;
        this.sfxGainNode = null;

        // State
        this.started = false;
        this.unlockListenersAttached = false;

        // Defaults
        const savedSettings = this.loadSettings();
        this.musicVolume = savedSettings.musicVolume !== undefined ? savedSettings.musicVolume : 0.4;
        this.sfxVolume = savedSettings.sfxVolume !== undefined ? savedSettings.sfxVolume : 0.5;
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
        this.applyMusicVolume();
    }

    /**
     * Initialize AudioContext for SFX on first interaction
     */
    initAudioContext() {
        if (this.audioCtx) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();

            // Create a master gain node for SFX
            this.sfxGainNode = this.audioCtx.createGain();
            this.sfxGainNode.connect(this.audioCtx.destination);
            this.applySfxVolume();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    /**
     * Start background music playback and init context
     */
    start() {
        this.started = true;
        this.tryPlayMusic();
        // Context will be initialized on user interaction via unlock listeners
        // or immediately if already allowed.
    }

    /**
     * Stop music playback
     */
    stop() {
        if (!this.music) return;
        this.music.pause();
        this.music.currentTime = 0;

        if (this.audioCtx && this.audioCtx.state === 'running') {
            this.audioCtx.suspend();
        }
    }

    /**
     * Update music volume
     * @param {number} volume - Volume from 0.0 to 1.0
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.applyMusicVolume();
        this.saveSettings();
    }

    /**
     * Update SFX volume
     * @param {number} volume - Volume from 0.0 to 1.0
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.applySfxVolume();
        this.saveSettings();
    }

    /**
     * Mute or unmute all audio
     * @param {boolean} muted - Whether audio should be muted
     */
    setMuted(muted) {
        this.muted = Boolean(muted);
        this.applyMusicVolume();

        if (this.muted) {
            this.music.pause();
            if (this.audioCtx) this.audioCtx.suspend();
        } else {
            if (this.started) this.tryPlayMusic();
            if (this.audioCtx) this.audioCtx.resume();
        }

        this.saveSettings();
    }

    /**
     * Get current audio settings
     */
    getSettings() {
        return {
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
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
            // Init Web Audio API if needed
            this.initAudioContext();

            // Resume context if suspended
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            // Play music
            if (this.started && !this.muted) {
                this.music.play().catch(e => console.warn('Music play failed', e));
            }

            this.detachUnlockListeners();
        };

        const events = ['click', 'touchstart', 'keydown', 'mousedown'];
        events.forEach(e => document.addEventListener(e, unlock, { once: true, capture: true }));
        this.unlockHandler = unlock;
    }

    detachUnlockListeners() {
        this.unlockListenersAttached = false;
        // Listeners are {once: true} so they remove themselves, but we clear flag
    }

    applyMusicVolume() {
        if (!this.music) return;
        this.music.volume = this.muted ? 0 : this.musicVolume;
    }

    applySfxVolume() {
        if (!this.sfxGainNode) return;
        this.sfxGainNode.gain.setValueAtTime(this.muted ? 0 : this.sfxVolume, this.audioCtx.currentTime);
    }

    loadSettings() {
        const defaults = { musicVolume: 0.4, sfxVolume: 0.5, muted: false };
        try {
            const raw = localStorage.getItem(this.settingsKey);
            if (!raw) return defaults;
            return { ...defaults, ...JSON.parse(raw) };
        } catch (error) {
            return defaults;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(this.getSettings()));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }

    // --- SYNTHESIZED SFX ---

    /**
     * Play a sound using an oscillator
     */
    playTone({ freq = 440, type = 'sine', duration = 0.1, ramp = null, vol = 1.0 }) {
        if (this.muted || !this.audioCtx || this.sfxVolume <= 0) return;

        // Improve latency handling
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        // Frequency ramp (slide)
        if (ramp) {
            osc.frequency.exponentialRampToValueAtTime(ramp, t + duration);
        }

        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        osc.connect(gain);
        gain.connect(this.sfxGainNode);

        osc.start(t);
        osc.stop(t + duration + 0.1);

        // Cleanup
        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, (duration + 0.1) * 1000);
    }

    playClick() {
        // High pitched short beep
        this.playTone({ freq: 880, type: 'square', duration: 0.05, vol: 0.1 });
    }

    playCoin() {
        // High coin sound (two tones)
        this.playTone({ freq: 1200, type: 'sine', duration: 0.1, vol: 0.3 });
        setTimeout(() => {
            this.playTone({ freq: 1800, type: 'sine', duration: 0.2, vol: 0.3 });
        }, 50);
    }

    playRepair() {
        // Mechanical ratchet (low burst)
        this.playTone({ freq: 100, type: 'sawtooth', duration: 0.08, ramp: 50, vol: 0.2 });
    }

    playPurchase() {
        // Register cha-ching
        this.playTone({ freq: 600, type: 'square', duration: 0.1, vol: 0.2 });
        setTimeout(() => {
            this.playTone({ freq: 1200, type: 'square', duration: 0.3, vol: 0.2 });
        }, 80);
    }

    playUnlock() {
        // Victory jingle
        const now = 0;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => {
                this.playTone({ freq, type: 'triangle', duration: 0.2, vol: 0.3 });
            }, i * 100);
        });
    }

    playError() {
        this.playTone({ freq: 150, type: 'sawtooth', duration: 0.2, ramp: 100, vol: 0.2 });
    }
}
