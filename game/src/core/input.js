// Keyboard and mouse input. Keys are tracked in G.keys so the driving,
// walking and shooting code all read the same held-key state. Mouse aim
// only matters on foot; driving is keyboard only.

import { G } from './config.js';

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'boost', ShiftRight: 'boost',
  Space: 'shoot',
  KeyE: 'enter',
  KeyP: 'pause', Escape: 'pause',
  KeyH: 'hideHud',
  KeyM: 'mute',
  KeyR: 'radio',
  KeyZ: 'abilityRae', KeyX: 'abilitySable', KeyC: 'abilityMarlo',
  Digit1: 'w1', Digit2: 'w2', Digit3: 'w3', Digit4: 'w4',
};

export function bindInput(handlers) {
  window.addEventListener('keydown', (ev) => {
    const name = KEYMAP[ev.code];
    if (!name) return;
    if (['up', 'down', 'left', 'right', 'shoot'].includes(name)) ev.preventDefault();
    if (!ev.repeat) {
      G.keys[name] = true;
      if (handlers.onPress) handlers.onPress(name, ev);
    }
  });
  window.addEventListener('keyup', (ev) => {
    const name = KEYMAP[ev.code];
    if (name) G.keys[name] = false;
  });
  window.addEventListener('blur', () => { G.keys = {}; });
  window.addEventListener('mousedown', (ev) => {
    if (ev.button === 0 && G.mode === 'play' && G.player.onFoot) {
      G.keys.shoot = true;
      if (handlers.onPress) handlers.onPress('shoot', ev);
    }
  });
  window.addEventListener('mouseup', (ev) => {
    if (ev.button === 0) G.keys.shoot = false;
  });
  window.addEventListener('contextmenu', (ev) => ev.preventDefault());
}

export function held(name) { return !!G.keys[name]; }
