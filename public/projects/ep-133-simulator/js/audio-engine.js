/**
 * EP-133 Simulator - Audio Engine
 * Manages Web Audio API and sound generation
 */

class AudioEngine {
    constructor() {
        this.context = null;
        this.oscillators = {};
        this.masterGain = null;
        this.volume = 0.5;
        this.enabled = false;
    }

    /**
     * Initialize the audio context and master gain
     */
    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.setVolume(this.volume * 100); // Convert to 0-100 range
            this.enabled = true;
            console.log('Audio Engine initialized');
        } catch (error) {
            console.error('Audio context not supported', error);
            this.enabled = false;
        }
    }

    /**
     * Resume audio context if suspended
     */
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    /**
     * Set master volume
     * @param {number} value - Volume level (0-100)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(100, value)) / 100;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.context.currentTime);
        }
    }

    /**
     * Play sound for a specific pad
     * @param {string} padId - Pad identifier
     */
    playPadSound(padId) {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Stop existing sound for this pad
        this.stopPadSound(padId);

        const frequency = CONFIG.AUDIO.FREQUENCIES[padId];
        if (!frequency) return; // Not a musical pad

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = CONFIG.AUDIO.DEFAULT_WAVEFORM;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

        // Apply envelope
        const now = this.context.currentTime;
        gainNode.gain.setValueAtTime(CONFIG.AUDIO.ENVELOPE.PEAK_GAIN, now);
        gainNode.gain.exponentialRampToValueAtTime(
            CONFIG.AUDIO.ENVELOPE.SUSTAIN_GAIN,
            now + CONFIG.AUDIO.NOTE_DURATION
        );

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start();
        oscillator.stop(now + CONFIG.AUDIO.NOTE_DURATION);

        // Store reference
        this.oscillators[padId] = { osc: oscillator, gain: gainNode };

        // Cleanup after playback
        oscillator.onended = () => {
            delete this.oscillators[padId];
        };
    }

    /**
     * Stop sound for a specific pad
     * @param {string} padId - Pad identifier
     */
    stopPadSound(padId) {
        if (this.oscillators[padId]) {
            try {
                const { osc, gain } = this.oscillators[padId];
                // Quick fade out to avoid clicks
                gain.gain.cancelScheduledValues(this.context.currentTime);
                gain.gain.setValueAtTime(gain.gain.value, this.context.currentTime);
                gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.05);
                osc.stop(this.context.currentTime + 0.05);
            } catch (e) {
                // Ignore errors if already stopped
            }
            delete this.oscillators[padId];
        }
    }

    /**
     * Stop all currently playing sounds
     */
    stopAllSounds() {
        Object.keys(this.oscillators).forEach(padId => this.stopPadSound(padId));
    }
}
