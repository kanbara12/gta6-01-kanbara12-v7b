// Original sound, synthesised live with WebAudio: an engine hum that
// follows speed, three synth radio stations with named tracks, and
// small effects for shots, pickups and UI. Nothing is fetched; the
// context only starts after a gesture, and every call is guarded so a
// browser without audio still plays the game.

import { G, STATIONS } from '../core/config.js';

let ctx = null, master = null, engineOsc = null, engineGain = null, radioTimer = 0, noteStep = 0;

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = G.muted ? 0 : 0.5;
    master.connect(ctx.destination);
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 50;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 500;
    engineOsc.connect(filter); filter.connect(engineGain); engineGain.connect(master);
    engineOsc.start();
  } catch { ctx = null; }
}

export function setMuted(m) {
  G.muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}

function blip(freq, dur, type, vol) {
  if (!ctx || G.muted) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(master);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* audio is decoration, never a crash */ }
}

export function sfxShot() {
  if (!ctx || G.muted) return;
  try {
    const len = ctx.sampleRate * 0.12;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = 0.5;
    src.connect(g); g.connect(master); src.start();
  } catch { /* ignore */ }
}

export function sfxPickup() { blip(880, 0.12, 'sine', 0.25); blip(1320, 0.18, 'sine', 0.2); }
export function sfxUi() { blip(520, 0.07, 'triangle', 0.15); }

export function updateAudio(dt) {
  if (!ctx) return;
  try {
    if (engineOsc && engineGain) {
      const spd = Math.abs(G.car.speed || 0);
      engineOsc.frequency.value = 46 + spd * 3.2;
      engineGain.gain.value = G.car.inCar && G.mode === 'play' ? 0.05 + spd * 0.0012 : 0;
    }
    // Radio: a slow arpeggio from the station's scale, root 110 Hz.
    radioTimer -= dt;
    if (radioTimer <= 0 && !G.muted && G.mode === 'play') {
      radioTimer = 0.24;
      const st = STATIONS[G.station];
      const degree = st.scale[noteStep % st.scale.length];
      const octave = Math.floor(noteStep / st.scale.length) % 2;
      blip(110 * Math.pow(2, degree / 12 + octave), 0.22, 'square', 0.045);
      noteStep++;
    }
  } catch { /* ignore */ }
}
