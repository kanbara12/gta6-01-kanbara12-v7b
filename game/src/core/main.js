// SUNCOAST: HEATLINE — boot and main loop.
// The game is a Three.js open world that runs offline from static files:
// a beachfront city to drive and walk, traffic and pedestrians, police
// and a helicopter, eight story contracts worth $22,450, combat, a full
// HUD with a round minimap, synth audio, and save/load.

import * as THREE from 'three';
import { G, CFG, SHOTS, WEAPONS, repForJob } from './config.js';
import { buildRenderer, buildSky } from './render.js';
import { bindInput, held } from './input.js';
import { buildCity } from '../world/city.js';
import { buildHeroCar, updateCar, updateSmoke } from '../vehicles/hero.js';
import { buildTraffic, updateTraffic } from '../vehicles/traffic.js';
import { buildHeli, updateHeli } from '../vehicles/heli.js';
import { ensurePolice, updatePolice } from '../ai/police.js';
import { buildWalkers, updateWalkers } from '../ai/walkers.js';
import { buildPlayerFigure, buildEnemies, tryShoot, updateCombat, updatePlayerOnFoot } from '../combat/fight.js';
import { setMission, updateMissions, buildStashes, currentMission } from '../missions/story.js';
import { buildHud, updateHud, showPause, showStart, showDialogue } from '../ui/hud.js';
import { applyShot } from '../ui/shots.js';
import { ensureAudio, updateAudio, setMuted, sfxShot, sfxUi } from '../audio/sound.js';
import { saveGame, loadGame } from '../save/store.js';

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1);
CFG.seed = seed;

if (shotName && SHOTS[shotName]) G.tod = SHOTS[shotName].tod;

buildRenderer();
buildSky(G.tod);
buildCity();
buildHeroCar();
buildTraffic();
buildHeli();
buildWalkers();
buildEnemies();
buildStashes();
buildPlayerFigure();
ensurePolice();
buildHud();

const clock = new THREE.Clock();
const camTarget = new THREE.Vector3(0, 2, 0);
const camPos = new THREE.Vector3(-30, 30, 40);
// A warm light that rides above the hero car at night, so the car and
// the road around it read in the dark instead of going black.
const carLight = new THREE.PointLight(0xffc36a, 0, 48, 1.1);
G.scene.add(carLight);

function startGame() {
  ensureAudio();
  G.mode = 'play';
  showStart(false);
  setMission(0);
  G.elapsed = 0;
  G.rep = 0;
  G.startedAt = G.time;
  // Spawn on foot beside the car, facing it, so ENTER is one step away.
  G.player.x = G.car.x - 3; G.player.z = G.car.z + 2;
  G.player.heading = Math.atan2(-(G.car.z - G.player.z), G.car.x - G.player.x);
  G.player.group.position.set(G.player.x, 0, G.player.z);
  G.player.group.rotation.y = -G.player.heading;
  showDialogue('rae', 9);
  sfxUi();
}

function enterCar() {
  if (G.car.inCar) {
    // Step out beside the car.
    G.car.inCar = false;
    G.player.onFoot = true;
    G.player.x = G.car.x - Math.sin(G.car.heading) * 3;
    G.player.z = G.car.z - Math.cos(G.car.heading) * 3;
    G.player.heading = G.car.heading;
    G.player.group.visible = true;
    G.car.speed = 0;
    return;
  }
  const d = Math.hypot(G.player.x - G.car.x, G.player.z - G.car.z);
  if (d < 4.5) {
    G.car.inCar = true;
    G.player.onFoot = false;
    G.player.group.visible = false;
    // Snap to the road grid: the player walks up to the car at an angle,
    // but the car must leave along the road, not diagonally off it.
    G.car.heading = Math.round(G.player.heading / (Math.PI / 2)) * (Math.PI / 2);
    sfxUi();
  }
}

function togglePause() {
  if (G.mode === 'play') { G.mode = 'pause'; showPause(true); }
  else if (G.mode === 'pause') { G.mode = 'play'; showPause(false); }
}

function useAbility(which) {
  if (G.mode !== 'play' || G.abilities[which] > 0) return;
  if (which === 'rae') {
    G.wanted = Math.max(0, G.wanted - 1);
    G.abilities.rae = 45;
    G.popups.push({ text: 'CLEAN SLATE — HEAT DOWN', until: G.time + 1.8, big: false });
  } else if (which === 'sable') {
    G.abilities.sable = 30;
    G.popups.push({ text: 'EYES UP — POLICE MARKED', until: G.time + 1.8, big: false });
  } else {
    G.cond = 100; G.fuel = 100;
    G.abilities.marlo = 30;
    G.popups.push({ text: 'PIT STOP — CAR RESTORED', until: G.time + 1.8, big: false });
  }
}

bindInput({
  onPress(name) {
    if (name === 'enter' && G.mode === 'play') enterCar();
    if (name === 'pause') togglePause();
    if (name === 'hideHud') {
      const hud = document.getElementById('hud');
      hud.style.display = hud.style.display === 'none' ? 'block' : 'none';
    }
    if (name === 'mute') setMuted(!G.muted);
    if (name === 'radio') { G.station = (G.station + 1) % 3; sfxUi(); }
    if (name === 'abilityRae') useAbility('rae');
    if (name === 'abilitySable') useAbility('sable');
    if (name === 'abilityMarlo') useAbility('marlo');
    if (name === 'shoot' && G.mode === 'play' && G.player.onFoot) { tryShoot(G.time); sfxShot(); }
    if (name.startsWith('w')) G.weapon = Number(name.slice(1)) - 1;
  },
});

document.getElementById('enter-btn').addEventListener('click', startGame);
document.getElementById('resume-btn').addEventListener('click', togglePause);
document.getElementById('save-btn').addEventListener('click', () => { saveGame(); sfxUi(); });
document.getElementById('load-btn').addEventListener('click', () => {
  if (loadGame()) { G.mode = 'play'; showPause(false); }
});

function updateCamera(dt) {
  const cam = G.camera;
  let px, py, pz, lx, ly, lz;
  if (G.shot === 'start') {
    // Wide establishing: high on the city side of the road, looking
    // north across the car, the boardwalk and the sand to the ocean.
    // The car sits small mid-frame, the ferris wheel stands to the
    // right, sand and ocean run across the back of the frame.
    px = G.car.x - 32; py = 22; pz = G.car.z - 18;
    lx = G.car.x + 20; ly = 1; lz = -6;
  } else if (G.shot === 'chase') {
    // Downtown pursuit: pulled back and higher, looking down at the car
    // so the WHOLE car sits in frame above the HUD, with the heli, the
    // roadblocks and the flanking unit ahead of it.
    const f = [Math.cos(G.car.heading), -Math.sin(G.car.heading)];
    const r = [Math.sin(G.car.heading), Math.cos(G.car.heading)];
    px = G.car.x - f[0] * 13 + r[0] * 3.2; py = 6.8; pz = G.car.z - f[1] * 13 + r[1] * 3.2;
    lx = G.car.x + f[0] * 6; ly = 1.6; lz = G.car.z + f[1] * 6;
  } else if (G.shot === 'mission') {
    const f = [Math.cos(G.player.heading), -Math.sin(G.player.heading)];
    px = G.player.x - f[0] * 6.5; py = 3.2; pz = G.player.z - f[1] * 6.5;
    lx = G.player.x + f[0] * 5; ly = 1.5; lz = G.player.z + f[1] * 5;
  } else if (G.shot === 'end') {
    // Loop complete at the lighthouse: the car parked in front of the
    // tower, the tower rising behind it, ocean beyond.
    px = G.car.x + 18; py = 6; pz = G.car.z + 16;
    lx = G.car.x - 6; ly = 2; lz = G.car.z - 4;
  } else if (G.car.inCar) {
    // Low close rear three-quarter: the car's flank, hood slope, raked
    // glass and wheels all read in one frame.
    const h = G.car.heading;
    const fx = Math.cos(h), fz = -Math.sin(h);
    const rx = Math.sin(h), rz = Math.cos(h);
    px = G.car.x - fx * 6.8 + rx * 5.0; py = 2.6; pz = G.car.z - fz * 6.8 + rz * 5.0;
    lx = G.car.x + fx * 7; ly = 1.2; lz = G.car.z + fz * 7;
  } else if (G.mode === 'menu') {
    const a = G.time * 0.08;
    px = G.car.x + Math.cos(a) * 26; py = 12; pz = G.car.z + Math.sin(a) * 26;
    lx = G.car.x; ly = 1; lz = G.car.z;
  } else {
    const h = G.player.heading;
    const fx = Math.cos(h), fz = -Math.sin(h);
    px = G.player.x - fx * 5.5; py = 2.5; pz = G.player.z - fz * 5.5;
    lx = G.player.x + fx * 5; ly = 1.4; lz = G.player.z + fz * 5;
  }
  const k = 1 - Math.exp(-dt * (G.shot ? 10 : 5));
  camPos.x += (px - camPos.x) * k;
  camPos.y += (py - camPos.y) * k;
  camPos.z += (pz - camPos.z) * k;
  camTarget.x += (lx - camTarget.x) * k;
  camTarget.y += (ly - camTarget.y) * k;
  camTarget.z += (lz - camTarget.z) * k;
  cam.position.copy(camPos);
  cam.lookAt(camTarget);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  G.time += dt;
  if (G.mode === 'play') {
    G.elapsed += dt;
    // Staged scenes cruise at their table speed; free play drives.
    if (G.shot && G.car.inCar && !G.loopDone) {
      const staged = SHOTS[G.shot].speedKmh / 3.6;
      G.car.speed = staged;
      G.car.x = Math.max(-270, Math.min(270, G.car.x + Math.cos(G.car.heading) * staged * dt));
      G.car.z = Math.max(-46, Math.min(268, G.car.z - Math.sin(G.car.heading) * staged * dt));
      G.car.group.position.set(G.car.x, 0, G.car.z);
      G.car.group.rotation.y = -G.car.heading;
    } else {
      updateCar(dt);
    }
    updatePlayerOnFoot(dt);
    updateTraffic(dt);
    updatePolice(dt);
    updateHeli(dt);
    updateWalkers(dt);
    updateCombat(dt);
    updateMissions(dt);
    updateSmoke(dt);
    updateAudio(dt);
    for (const key of ['rae', 'sable', 'marlo']) {
      if (G.abilities[key] > 0) G.abilities[key] -= dt;
    }
    G.popups = G.popups.filter((p) => p.until > G.time);
  }
  if (G.ocean) G.ocean.material.map.offset.x += dt * 0.008;
  if (G.foam) G.foam.material.opacity = 0.28 + Math.sin(G.time * 1.4) * 0.1;
  if (G.wheel) G.wheel.rotation.z += dt * 0.12;
  if (G.lightBeam) G.lightBeam.rotation.y += dt * 0.5;
  if (G.marker.mesh) {
    const s = 1 + Math.sin(G.time * 3) * 0.12;
    G.marker.mesh.scale.set(s, s, 1);
  }
  updateCamera(dt);
  if (G.tod === 'night') {
    carLight.intensity = 70;
    carLight.position.set(G.car.inCar ? G.car.x : G.player.x, 7, G.car.inCar ? G.car.z : G.player.z);
  } else {
    carLight.intensity = 0;
  }
  updateHud();
  G.renderer.render(G.scene, G.camera);
}

// Boot: a shot URL jumps straight into the staged scene; otherwise the
// start screen waits for ENTER THE CITY.
if (shotName && SHOTS[shotName]) {
  applyShot(shotName);
  G.mode = 'play';
  showStart(false);
  // Place the chase camera near its target at once, no long swoop.
  updateCamera(1);
} else {
  setMission(0);
  G.player.group.visible = true;
  showStart(true);
}

window.__suncoast = { G, CFG, startGame, enterCar };
animate();
