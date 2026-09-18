/* ============================================================
   Catwalk Sterren — geluidjes (WebAudio, geen bestanden nodig)
   Sound.play('pop' | 'klik' | 'ding' | 'ster' | 'tada' | 'levelup' | 'applaus' | 'fout')
   Sound.toggle() zet aan/uit; de keuze wordt bewaard.
   ============================================================ */
const Sound = (() => {
  const KEY = 'catwalk-sterren-geluid';
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === 'uit'; } catch (e) { /* geen opslag */ }

  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // één toon: frequentie, start (s vanaf nu), duur, volume, golfvorm
  function tone(freq, at, dur, vol = 0.18, type = 'sine', slide = 0) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    const t = a.currentTime + at;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  // ruis-plofje voor applaus
  function noise(at, dur, vol = 0.12) {
    const a = ac(); if (!a) return;
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 1200;
    const t = a.currentTime + at; g.gain.setValueAtTime(vol, t);
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(a.destination); s.start(t);
  }

  const FX = {
    klik: () => tone(880, 0, 0.06, 0.08, 'triangle'),
    pop: () => { tone(520, 0, 0.09, 0.16, 'sine', 300); },
    fout: () => { tone(220, 0, 0.18, 0.12, 'square', -60); },
    ding: () => { tone(1046, 0, 0.5, 0.14); tone(1568, 0.02, 0.4, 0.06); },
    ster: () => { tone(1318, 0, 0.35, 0.14); tone(1975, 0.08, 0.35, 0.08); },
    tada: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.35, 0.14, 'triangle')); tone(1046, 0.4, 0.7, 0.16); },
    levelup: () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.11, 0.3, 0.15, 'triangle')); tone(1318, 0.8, 0.9, 0.18); tone(1568, 0.8, 0.9, 0.08); },
    applaus: () => { for (let i = 0; i < 40; i++) noise(Math.random() * 1.8, 0.05 + Math.random() * 0.06, 0.08 + Math.random() * 0.08); },
  };

  function play(name) { if (muted || !FX[name]) return; try { FX[name](); } catch (e) { /* stil */ } }
  function toggle() { muted = !muted; try { localStorage.setItem(KEY, muted ? 'uit' : 'aan'); } catch (e) { /* stil */ } if (!muted) play('pop'); return !muted; }
  const isOn = () => !muted;
  return { play, toggle, isOn };
})();
