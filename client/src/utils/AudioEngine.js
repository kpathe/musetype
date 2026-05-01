const NOTES = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98, 'A6': 1760.00, 'B6': 1975.53,
  'REST': 0
};

// Flat octave mapping - all rows start at C4
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

class AudioEngine {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  resume() {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playNoteForKey(char) {
    this.resume();
    if (!char) return;
    
    const noteName = KEY_MAP[char.toLowerCase()];
    if (!noteName) return; // ignore unmapped keys

    const frequency = NOTES[noteName];
    if (frequency) {
      this._playTone(frequency, 'triangle', false);
    }
  }

  playError() {
    this.resume();
    this._playTone(NOTES['C4'], 'square', true);
    this._playTone(NOTES['F#4'], 'square', true);
  }

  _playTone(frequency, type = 'triangle', isError = false) {
    if (isError) {
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.05); 
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3); 
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.3);
      return;
    }

    // --- Synthesize Piano Sound ---
    const t = this.audioCtx.currentTime;
    // Pianos have a sharp attack and long exponential decay
    const duration = 2.5; 
    
    const masterGain = this.audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(0.5, t + 0.015); // hammer strike
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + duration); // string ring
    masterGain.connect(this.audioCtx.destination);

    // Fundamental (gives the body)
    const osc1 = this.audioCtx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = frequency;
    osc1.connect(masterGain);

    // Harmonic 1 (Octave higher, adds brightness)
    const osc2 = this.audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    const gain2 = this.audioCtx.createGain();
    gain2.gain.value = 0.4;
    osc2.connect(gain2);
    gain2.connect(masterGain);

    // Harmonic 2 (Octave + Fifth, adds metallic piano ping)
    const osc3 = this.audioCtx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 3.01; // slight inharmonicity
    const gain3 = this.audioCtx.createGain();
    // Decay the higher harmonics faster
    gain3.gain.setValueAtTime(0, t);
    gain3.gain.linearRampToValueAtTime(0.2, t + 0.01);
    gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc3.connect(gain3);
    gain3.connect(masterGain);

    osc1.start(t);
    osc2.start(t);
    osc3.start(t);

    osc1.stop(t + duration);
    osc2.stop(t + duration);
    osc3.stop(t + duration);
  }
}

export default new AudioEngine();
