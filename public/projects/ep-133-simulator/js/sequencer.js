/**
 * EP-133 Simulator - Sequencer
 * Manages timing, patterns, and playback
 */

class Sequencer {
    constructor(audioEngine, uiManager) {
        this.audioEngine = audioEngine;
        this.uiManager = uiManager;

        this.isPlaying = false;
        this.isRecording = false;
        this.bpm = CONFIG.SEQUENCER.DEFAULT_TEMPO;
        this.currentStep = 0;
        this.intervalId = null;

        // Pattern storage (placeholder for future implementation)
        this.patterns = {
            1: { steps: Array(16).fill(null), bpm: this.bpm }
        };
        this.currentPatternId = 1;
    }

    /**
     * Set BPM and restart if playing
     * @param {number} bpm - Beats per minute
     */
    setBpm(bpm) {
        this.bpm = Math.max(
            CONFIG.SEQUENCER.MIN_TEMPO,
            Math.min(CONFIG.SEQUENCER.MAX_TEMPO, bpm)
        );

        // If playing, restart with new BPM
        if (this.isPlaying) {
            this.restart();
        }
    }

    /**
     * Start the sequencer
     */
    start() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.audioEngine.resume();
        this.uiManager.updatePlayState(true);

        this.runLoop();
    }

    /**
     * Stop the sequencer
     */
    stop() {
        this.isPlaying = false;
        this.currentStep = 0;
        this.uiManager.updatePlayState(false);

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Toggle play/stop
     */
    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Toggle recording mode
     */
    toggleRecord() {
        this.isRecording = !this.isRecording;
        this.uiManager.updateRecordState(this.isRecording);
    }

    /**
     * Restart the sequencer (clears interval and starts fresh)
     */
    restart() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.runLoop();
    }

    /**
     * Main sequencer loop
     */
    runLoop() {
        const stepTime = (60000 / this.bpm) / 4; // Calculate time per 16th note

        this.intervalId = setInterval(() => {
            this.processStep();
        }, stepTime);
    }

    /**
     * Process current step
     */
    processStep() {
        // Visual update
        this.uiManager.highlightStep(this.currentStep);

        // TODO: Trigger sounds based on pattern data
        // const stepData = this.patterns[this.currentPatternId].steps[this.currentStep];
        // if (stepData) { ... }

        // Advance to next step
        this.currentStep = (this.currentStep + 1) % CONFIG.SEQUENCER.STEPS_PER_PATTERN;
    }
}
