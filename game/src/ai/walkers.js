// Pedestrians: twenty walkers on the sidewalks with a real gait, legs
// and arms swinging instead of sliding capsules. They stroll their
// blocks, turn toward the player when he walks close, and scatter away
// from a speeding car or gunfire.

import * as THREE from 'three';
import { G, CFG, mulberry32 } from '../core/config.js';

const SHIRTS = [0xd8d8d8, 0x5a8a5a, 0xa55a5a, 0x5a6a9a, 0xc8a54a, 0x7a5a8a];

export function buildWalkers() {
  const rnd = mulberry32(4242);
  for (let i = 0; i < 20; i++) {
    const g = new THREE.Group();
    const shirt = new THREE.MeshStandardMaterial({ color: SHIRTS[i % SHIRTS.length], roughness: 0.9 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc89878, roughness: 0.8 });
    const pants = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), shirt);
    body.position.y = 1.15; body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), skin);
    head.position.y = 1.72; g.add(head);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.2), pants);
    legL.position.set(0, 0.38, 0.14); g.add(legL);
    const legR = legL.clone(); legR.position.z = -0.14; g.add(legR);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), shirt);
    armL.position.set(0, 1.2, 0.26); g.add(armL);
    const armR = armL.clone(); armR.position.z = -0.26; g.add(armR);
    const beach = i < 10;
    const w = {
      group: g, legL, legR, armL, armR, phase: rnd() * 6.28,
      x: -260 + rnd() * 520, z: beach ? 9.5 : 112 + (rnd() < 0.5 ? -6 : 6),
      dir: rnd() < 0.5 ? 1 : -1, speed: 1 + rnd() * 0.8,
      min: -260, max: 260, flee: 0, fx: 0, fz: 0,
    };
    g.position.set(w.x, 0, w.z);
    G.scene.add(g);
    G.walkers.push(w);
  }
}

export function updateWalkers(dt) {
  const px = G.car.inCar ? G.car.x : G.player.x;
  const pz = G.car.inCar ? G.car.z : G.player.z;
  const carSpeed = Math.abs(G.car.speed || 0);
  for (const w of G.walkers) {
    const d = Math.hypot(w.x - px, w.z - pz);
    if (w.flee <= 0 && ((G.car.inCar && carSpeed > 10 && d < 9) || (G.flashUntil > G.time && d < 22))) {
      w.flee = 1.6;
      w.fx = (w.x - px) / (d || 1); w.fz = (w.z - pz) / (d || 1);
    }
    if (w.flee > 0) {
      w.flee -= dt;
      w.x += w.fx * 4.5 * dt; w.z += w.fz * 4.5 * dt;
      w.group.rotation.y = Math.atan2(-w.fz, w.fx);
    } else {
      w.x += w.dir * w.speed * dt;
      if (w.x > w.max) { w.x = w.max; w.dir = -1; }
      if (w.x < w.min) { w.x = w.min; w.dir = 1; }
      // Close on foot: pause and turn toward the player.
      if (!G.car.inCar && d < 4) {
        w.group.rotation.y = Math.atan2(-(pz - w.z), px - w.x);
      } else {
        w.group.rotation.y = w.dir > 0 ? 0 : Math.PI;
      }
    }
    w.phase += dt * (w.flee > 0 ? 11 : 6);
    const swing = Math.sin(w.phase) * 0.55;
    w.legL.rotation.x = swing; w.legR.rotation.x = -swing;
    w.armL.rotation.x = -swing * 0.7; w.armR.rotation.x = swing * 0.7;
    w.group.position.set(w.x, 0, w.z);
  }
}
