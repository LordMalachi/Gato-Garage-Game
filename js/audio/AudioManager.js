/**
 * AudioManager - Handles background music playback and synthesized SFX.
 * SFX are generated with the Web Audio API using layered oscillators for
 * chunky, satisfying 8-bit style sounds.
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
     * Initialize AudioContext for SFX
     */
    initAudioContext() {
        if (this.audioCtx) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();

            // Master gain for all SFX
            this.sfxGainNode = this.audioCtx.createGain();
            this.sfxGainNode.connect(this.audioCtx.destination);
            this.applySfxVolume();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    /**
     * Ensure AudioContext is running (resumed). Call before scheduling any SFX.
     * Returns true if the context is usable.
     */
    ensureContext() {
        if (!this.audioCtx) {
            this.initAudioContext();
            if (!this.audioCtx) return false;
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx.state !== 'closed';
    }

    /**
     * Start background music playback and init context
     */
    start() {
        this.started = true;
        this.initAudioContext();
        this.tryPlayMusic();
    }

    /**
     * Stop music playback
     */
    stop() {
        if (!this.music) return;
        this.music.pause();
        this.music.currentTime = 0;
        // Don't suspend the AudioContext on stop — it causes problems resuming later
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
        this.applySfxVolume();

        if (this.muted) {
            this.music.pause();
        } else {
            if (this.started) this.tryPlayMusic();
            // Resume context so SFX works immediately after unmute
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
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
            this.initAudioContext();

            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            if (this.started && !this.muted) {
                this.music.play().catch(e => console.warn('Music play failed', e));
            }

            this.detachUnlockListeners();
        };

        this.unlockEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
        this.unlockEvents.forEach(e => document.addEventListener(e, unlock, { capture: true }));
        this.unlockHandler = unlock;
    }

    detachUnlockListeners() {
        if (!this.unlockHandler) return;
        this.unlockEvents.forEach(e => document.removeEventListener(e, this.unlockHandler, { capture: true }));
        this.unlockListenersAttached = false;
        this.unlockHandler = null;
    }

    applyMusicVolume() {
        if (!this.music) return;
        this.music.volume = this.muted ? 0 : this.musicVolume;
    }

    applySfxVolume() {
        if (!this.sfxGainNode || !this.audioCtx) return;
        const vol = this.muted ? 0 : this.sfxVolume;
        this.sfxGainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
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

    // -------------------------------------------------------------------------
    // SYNTHESIZED SFX
    // -------------------------------------------------------------------------

    /**
     * Schedule an oscillator tone on the audio context.
     * All volume values are pre-master-gain (the sfxGainNode applies on top).
     */
    playTone({ freq = 440, type = 'sine', duration = 0.12, ramp = null, vol = 1.0, delay = 0 }) {
        if (this.muted || this.sfxVolume <= 0) return;
        if (!this.ensureContext()) return;

        const t = this.audioCtx.currentTime + delay;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        if (ramp) {
            osc.frequency.exponentialRampToValueAtTime(ramp, t + duration);
        }

        // Attack + sustain + release envelope
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.005); // fast attack
        gain.gain.setValueAtTime(vol, t + duration * 0.6);  // sustain
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // release

        osc.connect(gain);
        gain.connect(this.sfxGainNode);

        osc.start(t);
        osc.stop(t + duration + 0.05);

        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
    }

    /**
     * Create a short noise burst (useful for percussive textures).
     */
    playNoise({ duration = 0.05, vol = 0.3, delay = 0 }) {
        if (this.muted || this.sfxVolume <= 0) return;
        if (!this.ensureContext()) return;

        const t = this.audioCtx.currentTime + delay;
        const bufferSize = Math.floor(this.audioCtx.sampleRate * duration);
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        // Bandpass to shape the noise
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, t);
        filter.Q.setValueAtTime(1, t);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGainNode);

        noise.start(t);
        noise.stop(t + duration + 0.01);

        noise.onended = () => {
            noise.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
    }

    // ----- Game SFX -----

    /**
     * Click / wrench tap — soft pop with slight pitch variation
     */
    playClick() {
        // Slight random pitch variation so rapid clicks don't sound robotic
        const variation = 0.95 + Math.random() * 0.1; // 0.95–1.05

        // Soft descending pop (sine avoids the harsh harmonics of square)
        this.playTone({ freq: 660 * variation, type: 'sine', duration: 0.07, ramp: 330, vol: 0.45 });
        // Gentle body knock
        this.playTone({ freq: 180 * variation, type: 'triangle', duration: 0.05, vol: 0.2 });
    }

    /**
     * Car repaired — satisfying coin / cash register "ka-ching"
     */
    playCoin() {
        // Bright high ding
        this.playTone({ freq: 1400, type: 'sine', duration: 0.15, vol: 0.6 });
        // Octave up sparkle
        this.playTone({ freq: 2100, type: 'sine', duration: 0.2, vol: 0.4, delay: 0.07 });
        // Shimmer
        this.playTone({ freq: 2800, type: 'sine', duration: 0.15, vol: 0.2, delay: 0.12 });
        // Metallic texture
        this.playNoise({ duration: 0.04, vol: 0.15 });
    }

    /**
     * Purchase upgrade or hire worker — register "cha-ching"
     */
    playPurchase() {
        // Register drawer open
        this.playTone({ freq: 500, type: 'square', duration: 0.08, vol: 0.5 });
        // Coin hit
        this.playTone({ freq: 1000, type: 'square', duration: 0.1, vol: 0.5, delay: 0.08 });
        // High ring
        this.playTone({ freq: 1500, type: 'sine', duration: 0.25, vol: 0.4, delay: 0.14 });
        // Mechanical clack
        this.playNoise({ duration: 0.03, vol: 0.2 });
    }

    /**
     * Achievement / level up / tier up — victory fanfare
     */
    playUnlock() {
        // Rising 4-note arpeggio (C5 E5 G5 C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            this.playTone({ freq, type: 'triangle', duration: 0.18, vol: 0.5, delay: i * 0.09 });
            // Harmony: quiet octave below
            this.playTone({ freq: freq / 2, type: 'triangle', duration: 0.15, vol: 0.15, delay: i * 0.09 });
        });
        // Final note held longer and louder
        this.playTone({ freq: 1046.50, type: 'sine', duration: 0.4, vol: 0.4, delay: 0.36 });
        // Sparkle noise
        this.playNoise({ duration: 0.06, vol: 0.15, delay: 0.36 });
    }

    /**
     * Error / can't afford — low buzzy rejection
     */
    playError() {
        this.playTone({ freq: 200, type: 'sawtooth', duration: 0.15, ramp: 120, vol: 0.5 });
        this.playTone({ freq: 160, type: 'square', duration: 0.15, vol: 0.3, delay: 0.1 });
    }
}
