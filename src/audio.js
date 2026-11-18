// Efectos de sonido sintetizados con WebAudio (sin archivos).
let ctx = null;
export const audio = { enabled: true };

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.08, slide = 0, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, vol = 0.1, freq = 1200) {
  const c = ac();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination);
  s.start();
}

export function sfx(name) {
  if (!audio.enabled) return;
  try {
    switch (name) {
      case 'swing': noise(0.12, 0.12, 2200); break;
      case 'cannon': noise(0.45, 0.35, 160); tone(70, 0.3, 'sine', 0.12, -30); break;
      case 'hit': noise(0.1, 0.25, 700); tone(160, 0.1, 'square', 0.05, -80); break;
      case 'hurt': tone(220, 0.15, 'sawtooth', 0.06, -120); break;
      case 'coin': tone(988, 0.08, 'square', 0.05); tone(1319, 0.18, 'square', 0.05, 0, 0.08); break;
      case 'level': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.08, 0, i * 0.1)); break;
      case 'chop': noise(0.08, 0.2, 500); tone(120, 0.06, 'square', 0.04); break;
      case 'mine': noise(0.06, 0.2, 3000); tone(600, 0.05, 'triangle', 0.05); break;
      case 'quest': [659, 784, 988].forEach((f, i) => tone(f, 0.2, 'triangle', 0.08, 0, i * 0.12)); break;
      case 'click': tone(660, 0.04, 'triangle', 0.04); break;
      case 'die': tone(300, 0.4, 'sawtooth', 0.06, -220); break;
      case 'drink': tone(400, 0.2, 'sine', 0.08, 300); break;
    }
  } catch (e) { /* audio no disponible */ }
}
