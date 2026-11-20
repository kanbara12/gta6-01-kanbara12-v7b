// SKY-1, the police helicopter: a big dark airframe with a glass cabin,
// tail boom and tail rotor, skids, a spinning main rotor with a blur
// disc, and a spotlight cone plus a bright pool on the road that tracks
// the hero car. It orbits at wanted 3 and up, never clipped by the top
// of the frame in the staged chase.

import * as THREE from 'three';
import { G } from '../core/config.js';

export function buildHeli() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1c2733, metalness: 0.6, roughness: 0.45 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0e1418, metalness: 0.95, roughness: 0.12 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.1, 2.6), bodyMat);
  body.castShadow = true; g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 2.2), glass);
  nose.position.set(3.2, -0.1, 0); g.add(nose);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.7, 0.7), bodyMat);
  boom.position.set(-5.4, 0.5, 0); g.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 1.4), bodyMat);
  fin.position.set(-8.4, 1.2, 0); g.add(fin);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.6, 0.4), bodyMat);
  tailRotor.position.set(-8.5, 0.6, 0.5); g.add(tailRotor);
  G.heliTailRotor = tailRotor;
  for (const s of [-0.9, 0.9]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 0.14), bodyMat);
    skid.position.set(0, -1.5, s); g.add(skid);
  }
  const rotor = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(11, 0.12, 0.7), bodyMat);
  rotor.add(blade);
  const blade2 = blade.clone(); blade2.rotation.y = Math.PI / 2; rotor.add(blade2);
  const blur = new THREE.Mesh(new THREE.CircleGeometry(5.6, 32),
    new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  blur.rotation.x = -Math.PI / 2; rotor.add(blur);
  rotor.position.y = 1.5; g.add(rotor);
  G.heliRotor = rotor;
  // Spotlight: a soft translucent cone and a bright pool where it lands.
  const cone = new THREE.Mesh(new THREE.ConeGeometry(5.5, 22, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  cone.position.y = -12; g.add(cone);
  G.heliCone = cone;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(4, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.22, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  G.scene.add(pool);
  G.heliPool = pool;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.5, 2.65),
    new THREE.MeshStandardMaterial({ color: 0xd8a020, roughness: 0.5 }));
  stripe.position.y = 0.4; g.add(stripe);

  g.visible = false;
  pool.visible = false;
  G.scene.add(g);
  G.heli = g;
}

export function updateHeli(dt) {
  if (!G.heli) return;
  const active = (G.wanted >= 3 || G.shotHeli) && G.mode === 'play';
  G.heli.visible = active;
  G.heliPool.visible = active;
  if (!active) return;
  const st = G.heliState;
  if (!G.shot) st.angle += dt * 0.45;
  const px = G.car.inCar ? G.car.x : G.player.x;
  const pz = G.car.inCar ? G.car.z : G.player.z;
  const hx = px + Math.cos(st.angle) * st.radius;
  const hz = pz + Math.sin(st.angle) * st.radius * 0.7;
  G.heli.position.set(hx, st.height, hz);
  G.heli.lookAt(px, 0, pz);
  G.heliRotor.rotation.y += dt * 22;
  G.heliTailRotor.rotation.x += dt * 30;
  // The cone hangs straight down from the heli; the pool sits on the
  // road under the player, so the beam reads as tracking the car.
  G.heliPool.position.set(px, 0.2, pz);
  const pulse = 0.2 + Math.sin(G.time * 3) * 0.04;
  G.heliPool.material.opacity = pulse;
}
