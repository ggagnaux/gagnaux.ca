/**
 * EP-133 Simulator - Configuration
 * Centralized configuration constants
 */


const CONFIG = {
    // Audio Configuration
    AUDIO: {
        // Pad frequencies (in Hz)
        FREQUENCIES: {
            '1': 261.63, // C4
            '2': 293.66, // D4
            '3': 329.63, // E4
            '4': 349.23, // F4
            '5': 392.00, // G4
            '6': 440.00, // A4
            '7': 493.88, // B4
            '8': 523.25, // C5
            '9': 587.33, // D5
            '0': 659.25  // E5
        },

        // Envelope settings
        ENVELOPE: {
            ATTACK: 0.01,
            RELEASE: 0.5,
            PEAK_GAIN: 0.1,
            SUSTAIN_GAIN: 0.01
        },

        // Oscillator settings
        DEFAULT_WAVEFORM: 'sine',
        NOTE_DURATION: 0.5
    },

    // Sequencer Configuration
    SEQUENCER: {
        MIN_TEMPO: 60,
        MAX_TEMPO: 180,
        DEFAULT_TEMPO: 133,
        STEPS_PER_PATTERN: 16,
        PPQ: 4 // Pulses per quarter note (16th notes)
    },

    // UI Configuration
    UI: {
        DEFAULT_TRANSFORM_ANGLE: 0,

        THEMES: {
            DARK: 'dark',
            LIGHT: 'light'
        },

        // DOM Selectors
        SELECTORS: {
            DEVICE: '.ep133-device',
            PADS: '.pad',
            HALF_PADS: '.half-pad',
            KNOBS: '.knob',
            TABS: '.tab',
            MENU_BTNS: '.menu-btn',
            CONTROL_BTNS: '.mode-btn',
            STATUS_ICONS: '.status-icon',
            SLIDER: '.slider'
        },

        // Startup selector checks to catch wiring drift between HTML/CSS/JS
        SELECTOR_SANITY_CHECKS: {
            DEVICE: 1,
            PADS: 1,
            HALF_PADS: 1,
            KNOBS: 1,
            TABS: 1,
            MENU_BTNS: 1,
            CONTROL_BTNS: 1,
            STATUS_ICONS: 1
        },

        // Knob rotation range (in degrees)
        KNOB_ROTATION: {
            MIN: -135,
            MAX: 135
        }
    },

    // LocalStorage Keys
    STORAGE: {
        THEME: 'ep133-theme',
        DEFAULT_VOLUME: 'ep133-default-volume',
        DEFAULT_TEMPO: 'ep133-default-tempo',
        TRANSFORM: 'ep133-transform',
        SHOW_TOOLTIPS: 'ep133-show-tooltips',
        ENABLE_SOUNDS: 'ep133-enable-sounds'
    }
};
