const fs = require('node:fs');
const path = require('node:path');

const SAMPLE_RATE = 22_050;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

function envelope(time, start, duration) {
  const local = time - start;
  if (local < 0 || local >= duration) return 0;
  const attack = Math.min(1, local / 0.018);
  const release = Math.min(1, (duration - local) / 0.07);
  return attack * release;
}

function render(events, tail = 0.08) {
  const duration = Math.max(...events.map((event) => event.start + event.duration)) + tail;
  const samples = new Int16Array(Math.ceil(duration * SAMPLE_RATE));
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / SAMPLE_RATE;
    let value = 0;
    events.forEach((event) => {
      const local = time - event.start;
      if (local < 0 || local >= event.duration) return;
      const ratio = local / event.duration;
      const frequency = event.frequency + ((event.toFrequency ?? event.frequency) - event.frequency) * ratio;
      const phase = 2 * Math.PI * frequency * local;
      const wave = event.wave === 'square' ? Math.sign(Math.sin(phase)) : Math.sin(phase);
      value += wave * envelope(time, event.start, event.duration) * (event.gain ?? 0.24);
    });
    samples[index] = Math.max(-1, Math.min(1, value)) * 32_767;
  }
  return samples;
}

function wavBuffer(samples) {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  for (let index = 0; index < samples.length; index += 1) buffer.writeInt16LE(samples[index], 44 + index * 2);
  return buffer;
}

const sounds = {
  select: [
    { start: 0, duration: 0.16, frequency: 125, toFrequency: 105, gain: 0.2 },
    { start: 0.18, duration: 0.16, frequency: 120, toFrequency: 100, gain: 0.2 },
    { start: 0.36, duration: 0.2, frequency: 115, toFrequency: 90, gain: 0.23 },
  ],
  turn: [
    { start: 0, duration: 0.2, frequency: 523.25, gain: 0.22 },
    { start: 0.15, duration: 0.28, frequency: 659.25, gain: 0.24 },
  ],
  clue: [
    { start: 0, duration: 0.18, frequency: 783.99, gain: 0.2 },
    { start: 0.13, duration: 0.27, frequency: 1046.5, gain: 0.2 },
  ],
  correct: [
    { start: 0, duration: 0.18, frequency: 523.25, gain: 0.23 },
    { start: 0.12, duration: 0.26, frequency: 783.99, gain: 0.24 },
  ],
  wrong: [
    { start: 0, duration: 0.23, frequency: 246.94, toFrequency: 185, gain: 0.24 },
    { start: 0.16, duration: 0.3, frequency: 196, toFrequency: 146.83, gain: 0.2 },
  ],
  assassin: [
    { start: 0, duration: 0.7, frequency: 92.5, toFrequency: 48, gain: 0.32, wave: 'square' },
    { start: 0, duration: 0.72, frequency: 138.59, toFrequency: 73.42, gain: 0.14 },
  ],
  victory: [
    { start: 0, duration: 0.25, frequency: 523.25, gain: 0.22 },
    { start: 0.18, duration: 0.25, frequency: 659.25, gain: 0.22 },
    { start: 0.36, duration: 0.45, frequency: 783.99, gain: 0.25 },
  ],
  defeat: [
    { start: 0, duration: 0.3, frequency: 329.63, gain: 0.2 },
    { start: 0.22, duration: 0.3, frequency: 246.94, gain: 0.22 },
    { start: 0.44, duration: 0.5, frequency: 164.81, gain: 0.24 },
  ],
  join: [
    { start: 0, duration: 0.14, frequency: 659.25, gain: 0.17 },
    { start: 0.1, duration: 0.2, frequency: 880, gain: 0.18 },
  ],
  leave: [
    { start: 0, duration: 0.17, frequency: 440, gain: 0.16 },
    { start: 0.12, duration: 0.24, frequency: 293.66, gain: 0.18 },
  ],
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
Object.entries(sounds).forEach(([name, events]) => {
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.wav`), wavBuffer(render(events)));
});

console.log(`Generated ${Object.keys(sounds).length} sound effects in ${OUTPUT_DIR}`);
