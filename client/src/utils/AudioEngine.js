// ============================================================
// AudioEngine.js — Enhanced with Instrument Profiles & Volume
// ============================================================

const NOTES = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98, 'A6': 1760.00, 'B6': 1975.53,
  'REST': 0
};

// Flat octave mapping — all rows start at C4
const KEY_MAP = {
  // Bottom row
  'z': 'C4', 'x': 'D4', 'c': 'E4', 'v': 'F4', 'b': 'G4', 'n': 'A4', 'm': 'B4',
  // Middle row
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5', 'l': 'D5',
  // Top row
  'q': 'C4', 'w': 'D4', 'e': 'E4', 'r': 'F4', 't': 'G4', 'y': 'A4', 'u': 'B4', 'i': 'C5', 'o': 'D5', 'p': 'E5',
  // Numbers (Accidentals)
  '1': 'C#4', '2': 'D#4', '3': 'F#4', '4': 'G#4', '5': 'A#4', '6': 'C#5', '7': 'D#5', '8': 'F#5', '9': 'G#5', '0': 'A#5'
};

// Chord intervals (semitones) for harmony on space
const CHORD_INTERVALS = [0, 4, 7]; // Major chord: root, major 3rd, perfect 5th

export const INSTRUMENTS = {
  PIANO: 'Piano',
  SYNTH: 'Synth',
  MARIMBA: 'Marimba',
};

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.volume = 0.75;
    this.instrument = INSTRUMENTS.PIANO;
    this.lastNoteFrequency = null;
    this.chordMode = false;
    this._initialized = false;
  }

  _init() {
    if (this._initialized) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.audioCtx.destination);
    this._initialized = true;
  }

  resume() {
    this._init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.audioCtx.currentTime, 0.05);
    }
  }

  setInstrument(name) {
    this.instrument = name;
  }

  setChordMode(enabled) {
    this.chordMode = enabled;
  }

  playNoteForKey(char) {
    this.resume();
    if (!char) return;
    const noteName = KEY_MAP[char.toLowerCase()];
    if (!noteName) return;
    const frequency = NOTES[noteName];
    if (!frequency) return;

    this.lastNoteFrequency = frequency;
    this._playByInstrument(frequency, false);
  }

  playChord() {
    if (!this.lastNoteFrequency) return;
    this.resume();
    const root = this.lastNoteFrequency;
    CHORD_INTERVALS.forEach((semitones, i) => {
      const freq = root * Math.pow(2, semitones / 12);
      setTimeout(() => this._playByInstrument(freq, false, true), i * 30);
    });
  }

  playError() {
    this.resume();
    this._playToneRaw(NOTES['C4'], 'square', true);
    this._playToneRaw(NOTES['F#4'], 'square', true);
  }

  _playByInstrument(frequency, isError) {
    switch (this.instrument) {
      case INSTRUMENTS.SYNTH:
        this._playSynth(frequency);
        break;
      case INSTRUMENTS.MARIMBA:
        this._playMarimba(frequency);
        break;
      case INSTRUMENTS.PIANO:
      default:
        this._playPiano(frequency);
        break;
    }
  }

  _playPiano(frequency) {
    const t = this.audioCtx.currentTime;
    const duration = 2.5;
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.5, t + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);
    gainNode.connect(this.masterGain);

    const osc1 = this.audioCtx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = frequency;
    osc1.connect(gainNode);

    const osc2 = this.audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    const g2 = this.audioCtx.createGain();
    g2.gain.value = 0.4;
    osc2.connect(g2);
    g2.connect(gainNode);

    const osc3 = this.audioCtx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 3.01;
    const g3 = this.audioCtx.createGain();
    g3.gain.setValueAtTime(0, t);
    g3.gain.linearRampToValueAtTime(0.2, t + 0.01);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc3.connect(g3);
    g3.connect(gainNode);

    [osc1, osc2, osc3].forEach(o => { o.start(t); o.stop(t + duration); });
  }

  _playSynth(frequency) {
    const t = this.audioCtx.currentTime;
    const duration = 1.2;
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.35, t + 0.08); // slow attack = pad feel
    gainNode.gain.setValueAtTime(0.35, t + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);
    gainNode.connect(this.masterGain);

    // Detuned saw waves for lush synth pad
    for (let i = 0; i < 3; i++) {
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = frequency * (1 + (i - 1) * 0.003); // slight detune
      const g = this.audioCtx.createGain();
      g.gain.value = 0.15;
      osc.connect(g);
      g.connect(gainNode);
      osc.start(t);
      osc.stop(t + duration);
    }

    // Sub bass
    const sub = this.audioCtx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = frequency * 0.5;
    const subG = this.audioCtx.createGain();
    subG.gain.value = 0.2;
    sub.connect(subG);
    subG.connect(gainNode);
    sub.start(t);
    sub.stop(t + duration);
  }

  _playMarimba(frequency) {
    const t = this.audioCtx.currentTime;
    const duration = 1.0;
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.6, t + 0.005); // very sharp attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);
    gainNode.connect(this.masterGain);

    // Marimba = strong fundamental + 4th harmonic
    const osc1 = this.audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = frequency;
    osc1.connect(gainNode);

    const osc2 = this.audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 3.99; // approx 2 octaves for marimba timbre
    const g2 = this.audioCtx.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(0.3, t + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12); // very fast decay for overtone
    osc2.connect(g2);
    g2.connect(gainNode);

    [osc1, osc2].forEach(o => { o.start(t); o.stop(t + duration); });
  }

  _playToneRaw(frequency, type = 'square', isError = false) {
    this.resume();
    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.2, t + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gainNode);
    gainNode.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

export default new AudioEngine();
