// Street traffic: eighteen cars looping the beach road, the avenue and
// the cross streets in varied colours, headlights on at dusk, plus the
// plain police cruiser the pursuit code dresses up with a light bar.

import * as THREE from 'three';
import { G, CFG, mulberry32 } from '../core/config.js';

const COLORS = [0x3a6ea5, 0xc0c0c0, 0x2e2e2e, 0x8e6a3e, 0x5a7d4a, 0x7a3a5a, 0xd8d8d8, 0x4a4a6a, 0xb8642a];

export function buildTrafficCar(color, police) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x14181c, metalness: 0.9, roughness: 0.15 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.7, 1.8), paint);
  body.position.y = 0.6; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 0.55, 1.6), glass);
  cabin.position.set(-0.2, 1.2, 0); g.add(cabin);
  const dark = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 });
  for (const [wx, wz] of [[1.3, 0.85], [1.3, -0.85], [-1.3, 0.85], [-1.3, -0.85]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 12), dark);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(wx, 0.34, wz); g.add(wheel);
  }
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffe9a8, emissiveIntensity: 1.2 });
  for (const s of [-0.55, 0.55]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.3), headMat);
    h.position.set(1.98, 0.6, s); g.add(h);
  }
  if (police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }));
    bar.position.set(-0.2, 1.55, 0); g.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 }));
    red.position.set(-0.2, 1.66, 0.32); g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2244ff, emissive: 0x2244ff, emissiveIntensity: 2 }));
    blue.position.set(-0.2, 1.66, -0.32); g.add(blue);
  }
  return g;
}

const LANES = [
  { axis: 'x', lane: -3.5, from: -270, to: 270, dir: 1 },
  { axis: 'x', lane: 3.5, from: 270, to: -270, dir: -1 },
  { axis: 'x', lane: 116.5, from: -270, to: 270, dir: 1 },
  { axis: 'x', lane: 123.5, from: 270, to: -270, dir: -1 },
  { axis: 'z', lane: -80, from: 20, to: 260, dir: 1 },
  { axis: 'z', lane: 80, from: 260, to: 20, dir: -1 },
];

export function buildTraffic() {
  const rnd = mulberry32(99);
  for (let i = 0; i < 18; i++) {
    const lane = LANES[i % LANES.length];
    const group = buildTrafficCar(COLORS[i % COLORS.length], false);
    const t = {
      group, lane,
      pos: lane.from + rnd() * (lane.to - lane.from),
      speed: (9 + rnd() * 7) * lane.dir,
    };
    G.scene.add(group);
    G.traffic.push(t);
  }
}

export function updateTraffic(dt) {
  for (const t of G.traffic) {
    t.pos += t.speed * dt;
    if (t.lane.dir > 0 && t.pos > t.lane.to) t.pos = t.lane.from;
    if (t.lane.dir < 0 && t.pos < t.lane.to) t.pos = t.lane.from;
    if (t.lane.axis === 'x') {
      t.group.position.set(t.pos, 0, t.lane.lane);
      t.group.rotation.y = t.lane.dir > 0 ? 0 : Math.PI;
    } else {
      t.group.position.set(t.lane.lane, 0, t.pos);
      t.group.rotation.y = t.lane.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
  }
  // Gentle nudge if the hero clips a traffic car: no ghosting through.
  if (G.car.inCar) {
    for (const t of G.traffic) {
      const dx = G.car.x - t.group.position.x;
      const dz = G.car.z - t.group.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 3.4 && d > 0.01) {
        G.car.x = t.group.position.x + (dx / d) * 3.4;
        G.car.z = t.group.position.z + (dz / d) * 3.4;
        G.car.speed *= 0.6;
      }
    }
  }
}
