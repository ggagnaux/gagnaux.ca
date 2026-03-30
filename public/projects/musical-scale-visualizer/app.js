const NOTE_LABELS = [
  ["C"],
  ["C#", "Db"],
  ["D"],
  ["D#", "Eb"],
  ["E"],
  ["F"],
  ["F#", "Gb"],
  ["G"],
  ["G#", "Ab"],
  ["A"],
  ["A#", "Bb"],
  ["B"]
];

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);
const WHITE_POS_IN_OCTAVE = {
  0: 0,
  2: 1,
  4: 2,
  5: 3,
  7: 4,
  9: 5,
  11: 6
};
const BLACK_POS_IN_OCTAVE = {
  1: 1,
  3: 2,
  6: 4,
  8: 5,
  10: 6
};

const SCALES = [
  { name: "Major (Ionian)", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: "Natural Minor (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: "Melodic Minor", intervals: [0, 2, 3, 5, 7, 9, 11] },
  { name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
  { name: "Major Pentatonic", intervals: [0, 2, 4, 7, 9] },
  { name: "Minor Pentatonic", intervals: [0, 3, 5, 7, 10] },
  { name: "Blues", intervals: [0, 3, 5, 6, 7, 10] },
  { name: "Whole Tone", intervals: [0, 2, 4, 6, 8, 10] },
  { name: "Chromatic", intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { name: "Harmonic Major", intervals: [0, 2, 4, 5, 7, 8, 11] },
  { name: "Phrygian Dominant", intervals: [0, 1, 4, 5, 7, 8, 10] },
  { name: "Octatonic (Whole-Half)", intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  { name: "Octatonic (Half-Whole)", intervals: [0, 1, 3, 4, 6, 7, 9, 10] }
];
const THEMES = ["dark", "light", "studio"];

const state = {
  rootPc: 0,
  scaleIndex: 0,
  theme: "dark",
  showNoteNames: true,
  showDegrees: true,
  showIntervals: true
};

const rootSelect = document.getElementById("root-select");
const scaleSelect = document.getElementById("scale-select");
const themeSelect = document.getElementById("theme-select");
const playScaleBtn = document.getElementById("play-scale-btn");
const toggleNoteNames = document.getElementById("toggle-note-names");
const toggleDegrees = document.getElementById("toggle-degrees");
const toggleIntervals = document.getElementById("toggle-intervals");
const scaleNotesEl = document.getElementById("scale-notes");
const intervalFormulaEl = document.getElementById("interval-formula");
const pianoRollEl = document.getElementById("piano-roll");

let audioContext;
let masterCompressor;

function pcToLabel(pc) {
  return NOTE_LABELS[pc].join("/");
}

function applyTheme(theme) {
  if (!THEMES.includes(theme)) {
    return;
  }

  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
}

function populateControls() {
  NOTE_LABELS.forEach((labels, pc) => {
    const option = document.createElement("option");
    option.value = String(pc);
    option.textContent = labels.join("/");
    rootSelect.appendChild(option);
  });

  SCALES.forEach((scale, idx) => {
    const option = document.createElement("option");
    option.value = String(idx);
    option.textContent = scale.name;
    scaleSelect.appendChild(option);
  });

  rootSelect.value = String(state.rootPc);
  scaleSelect.value = String(state.scaleIndex);
  themeSelect.value = state.theme;
}

function getSelectedScale() {
  return SCALES[state.scaleIndex];
}

function buildFormula(intervals) {
  const steps = [];
  const withOctave = [...intervals, 12];

  for (let i = 1; i < withOctave.length; i += 1) {
    const semitones = withOctave[i] - withOctave[i - 1];
    if (semitones === 1) {
      steps.push("H");
    } else if (semitones === 2) {
      steps.push("W");
    } else {
      steps.push(`${semitones}st`);
    }
  }

  return steps.join(" - ");
}

function ensureAudioEngine() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterCompressor = audioContext.createDynamicsCompressor();
    masterCompressor.threshold.value = -22;
    masterCompressor.knee.value = 18;
    masterCompressor.ratio.value = 3;
    masterCompressor.attack.value = 0.003;
    masterCompressor.release.value = 0.2;
    masterCompressor.connect(audioContext.destination);
  }
}

function playFrequency(frequency, startTime = null, duration = 0.9, velocity = 1) {
  ensureAudioEngine();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = startTime ?? audioContext.currentTime;
  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const toneFilter = audioContext.createBiquadFilter();

  const real = new Float32Array([0, 1.0, 0.64, 0.35, 0.21, 0.11, 0.06]);
  const imag = new Float32Array(real.length);
  const pianoWave = audioContext.createPeriodicWave(real, imag);

  osc1.setPeriodicWave(pianoWave);
  osc2.setPeriodicWave(pianoWave);
  osc1.frequency.value = frequency;
  osc2.frequency.value = frequency * 2;
  osc2.detune.value = 3;

  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(4200, now);
  toneFilter.frequency.exponentialRampToValueAtTime(1700, now + Math.min(duration * 0.8, 0.55));
  toneFilter.Q.value = 0.6;

  // Fast attack and natural decay/release approximates piano key strike.
  const peakGain = 0.28 * velocity;
  const sustainGain = 0.12 * velocity;
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, now + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(sustainGain, now + Math.min(0.08, duration * 0.25));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(toneFilter);
  toneFilter.connect(masterCompressor);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

function scheduleKeyHighlight(midi, startTime, duration) {
  const startDelay = Math.max(0, (startTime - audioContext.currentTime) * 1000);
  const activeMs = Math.max(120, Math.min(260, duration * 1000 * 0.8));

  window.setTimeout(() => {
    const key = pianoRollEl.querySelector(`.key[data-midi="${midi}"]`);
    if (!key) {
      return;
    }

    key.classList.add("playing");
    window.setTimeout(() => {
      key.classList.remove("playing");
    }, activeMs);
  }, startDelay);
}

async function playScaleOctave() {
  const scale = getSelectedScale();
  const intervals = [...scale.intervals, 12];
  const baseMidi = 60 + state.rootPc;
  const stepSeconds = 0.32;
  const noteDuration = 0.75;

  ensureAudioEngine();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const startAt = audioContext.currentTime + 0.04;
  playScaleBtn.disabled = true;

  intervals.forEach((interval, idx) => {
    const midi = baseMidi + interval;
    const velocity = idx === 0 || idx === intervals.length - 1 ? 1.05 : 0.92;
    const noteStart = startAt + (idx * stepSeconds);
    playFrequency(midiToFrequency(midi), noteStart, noteDuration, velocity);
    scheduleKeyHighlight(midi, noteStart, noteDuration);
  });

  const totalMs = ((intervals.length - 1) * stepSeconds + noteDuration) * 1000;
  window.setTimeout(() => {
    playScaleBtn.disabled = false;
  }, totalMs + 80);
}

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function getKeyPosition(midi) {
  const pc = midi % 12;
  const octave = Math.floor(midi / 12);
  const posInOctave = BLACK_PITCH_CLASSES.has(pc) ? BLACK_POS_IN_OCTAVE[pc] : WHITE_POS_IN_OCTAVE[pc];
  return (octave * 7) + posInOctave;
}

function renderScaleMeta(scale, pitchClassSet) {
  const noteNames = [];
  scale.intervals.forEach((offset) => {
    const pc = (state.rootPc + offset) % 12;
    noteNames.push(pcToLabel(pc));
  });

  scaleNotesEl.textContent = `Scale notes: ${noteNames.join(" - ")}`;

  if (state.showIntervals) {
    intervalFormulaEl.textContent = `Interval formula: ${buildFormula(scale.intervals)}`;
    intervalFormulaEl.hidden = false;
  } else {
    intervalFormulaEl.hidden = true;
  }
}

function renderPianoRoll() {
  const scale = getSelectedScale();
  const pitchClassSet = new Set(scale.intervals.map((offset) => (state.rootPc + offset) % 12));
  const degreeByPc = new Map();

  scale.intervals.forEach((offset, idx) => {
    degreeByPc.set((state.rootPc + offset) % 12, idx + 1);
  });

  const keys = [];
  const keyCount = 25;

  for (let step = 0; step < keyCount; step += 1) {
    const midi = 60 + state.rootPc + step;
    const pc = midi % 12;
    const inScale = pitchClassSet.has(pc);
    const keyType = BLACK_PITCH_CLASSES.has(pc) ? "black" : "white";
    const key = document.createElement("button");
    const keyPos = getKeyPosition(midi);

    key.type = "button";
    key.className = `key ${keyType} ${inScale ? "in" : "out"}`;
    key.setAttribute("aria-label", `${pcToLabel(pc)} key ${inScale ? "in scale" : "out of scale"}`);
    key.dataset.pos = String(keyPos);
    key.dataset.midi = String(midi);
    key.disabled = !inScale;

    if (state.showNoteNames) {
      const note = document.createElement("span");
      note.className = "key-note";
      note.textContent = pcToLabel(pc);
      key.appendChild(note);
    }

    if (state.showDegrees && inScale) {
      const degree = document.createElement("span");
      degree.className = "key-degree";
      degree.textContent = `${degreeByPc.get(pc)}`;
      key.appendChild(degree);
    }

    if (inScale) {
      key.addEventListener("click", () => {
        playFrequency(midiToFrequency(midi));
        key.classList.add("playing");
        window.setTimeout(() => key.classList.remove("playing"), 130);
      });
    }

    keys.push(key);
  }

  const numericPositions = keys.map((key) => Number(key.dataset.pos));
  const minPos = Math.min(...numericPositions);
  const maxPos = Math.max(...numericPositions);
  const keySpan = (maxPos - minPos) + 1;

  const keyboardTrack = document.createElement("div");
  keyboardTrack.className = "keyboard-track";
  keyboardTrack.style.setProperty("--key-span", String(keySpan));

  keys.forEach((key) => {
    const pos = Number(key.dataset.pos) - minPos;
    if (key.classList.contains("white")) {
      key.style.left = `calc(var(--white-key-width) * ${pos})`;
    } else {
      key.style.left = `calc((var(--white-key-width) * ${pos}) - (var(--black-key-width) / 2))`;
    }
  });

  const whiteKeys = keys.filter((key) => key.classList.contains("white"));
  const blackKeys = keys.filter((key) => key.classList.contains("black"));
  keyboardTrack.append(...whiteKeys, ...blackKeys);
  pianoRollEl.replaceChildren(keyboardTrack);
  renderScaleMeta(scale, pitchClassSet);
}

function wireEvents() {
  rootSelect.addEventListener("change", (event) => {
    state.rootPc = Number(event.target.value);
    renderPianoRoll();
  });

  scaleSelect.addEventListener("change", (event) => {
    state.scaleIndex = Number(event.target.value);
    renderPianoRoll();
  });

  themeSelect.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });

  toggleNoteNames.addEventListener("change", (event) => {
    state.showNoteNames = event.target.checked;
    renderPianoRoll();
  });

  toggleDegrees.addEventListener("change", (event) => {
    state.showDegrees = event.target.checked;
    renderPianoRoll();
  });

  toggleIntervals.addEventListener("change", (event) => {
    state.showIntervals = event.target.checked;
    renderPianoRoll();
  });

  playScaleBtn.addEventListener("click", () => {
    playScaleOctave();
  });
}

applyTheme(state.theme);
populateControls();
wireEvents();
renderPianoRoll();
