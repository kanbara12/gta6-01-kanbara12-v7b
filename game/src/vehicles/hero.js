// The HEATLINE GT: a low red sports coupe built so it reads as a coupe
// from the low rear three-quarter camera, with a sloped hood, raked
// glass, flared arches over real wheels, a wing on mounts, twin
// exhausts, a glowing brake bar and a driver in the seat. The same file
// holds the arcade driving: throttle, brake, steering that bites harder
// at speed, drift with smoke and payouts, and building collision.

import * as THREE from 'three';
import { G, CFG } from '../core/config.js';
import { held } from '../core/input.js';

const RED = 0xc01818;

export function buildHeroCar() {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: RED, metalness: 0.65, roughness: 0.28 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x101418, metalness: 0.95, roughness: 0.12 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.6, roughness: 0.4 });

  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; g.add(mesh); return mesh; };

  // Low body, long nose, cabin set back.
  add(new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.55, 1.9), paint), 0, 0.62, 0);
  // Sloped hood, clearly lower than the roofline, with a grille band under it.
  const hood = add(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 1.78), paint), 1.62, 0.86, 0);
  hood.rotation.z = -0.16;
  add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 1.7), trim), 2.22, 0.52, 0);
  // Raked glass cabin: windshield and rear glass lean back hard, the
  // sunset catches them, side glass on both flanks.
  const cabin = add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 1.66), glass), -0.45, 1.12, 0);
  cabin.rotation.z = 0.1;
  const shield = add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 1.6), glass), 0.52, 1.1, 0);
  shield.rotation.z = -0.62;
  const rearGlass = add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 1.6), glass), -1.38, 1.08, 0);
  rearGlass.rotation.z = -0.62;
  // Flared arches over real wheels with visible rims.
  const archMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
  for (const [wx, wz] of [[1.45, 0.95], [1.45, -0.95], [-1.45, 0.95], [-1.45, -0.95]]) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.1, 8, 16, Math.PI), archMat);
    arch.position.set(wx, 0.42, wz);
    arch.rotation.y = Math.PI / 2;
    g.add(arch);
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 18), dark);
    tire.rotation.x = Math.PI / 2; wheel.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.3 }));
    rim.rotation.x = Math.PI / 2; wheel.add(rim);
    wheel.position.set(wx, 0.38, wz);
    wheel.castShadow = true;
    g.add(wheel);
  }
  // Wing on short mounts, twin exhausts, glowing brake bar, headlights.
  add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 1.75), paint), -2.05, 1.08, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.12), trim), -2.0, 0.9, 0.6);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.12), trim), -2.0, 0.9, -0.6);
  for (const s of [-0.35, 0.35]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 10), trim);
    pipe.rotation.z = Math.PI / 2; add(pipe, -2.25, 0.42, s);
  }
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, emissive: 0xff1a1a, emissiveIntensity: 1.6 });
  add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 1.5), brakeMat), -2.22, 0.78, 0);
  G.car.brakeGlow = brakeMat;
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffe9a8, emissiveIntensity: 1.4 });
  add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.4), headMat), 2.26, 0.72, 0.6);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.4), headMat), 2.26, 0.72, -0.6);
  // Driver: torso and helmet readable through the glass and above the door.
  add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x2b3a55, roughness: 0.8 })), -0.45, 1.05, 0.35);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.4 })), -0.45, 1.48, 0.35);

  g.position.set(G.car.x, 0, G.car.z);
  g.rotation.y = -G.car.heading;
  G.scene.add(g);
  G.car.group = g;
  return g;
}

function collideBuildings(x, z, r) {
  for (const b of G.buildings) {
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
    const dx = x - cx, dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * r; z = cz + (dz / d) * r;
    }
  }
  return [x, z];
}

export function updateCar(dt) {
  const car = G.car;
  if (!car.inCar) return;
  const fwd = held('up'), back = held('down');
  const steerIn = (held('left') ? 1 : 0) - (held('right') ? 1 : 0);
  if (fwd) car.speed += CFG.accel * dt * (held('boost') ? 1.25 : 1);
  else if (back) car.speed -= (car.speed > 0.5 ? CFG.brake : CFG.accel * 0.7) * dt;
  else car.speed -= Math.sign(car.speed) * 6 * dt;
  car.speed = Math.max(-CFG.reverseMax, Math.min(CFG.maxSpeed, car.speed));
  if (Math.abs(car.speed) < 0.05) car.speed = 0;

  const spd = Math.abs(car.speed);
  const steerRate = 1.9 * Math.min(1, spd / 14 + 0.25);
  car.heading += steerIn * steerRate * dt * Math.sign(car.speed || 1) * (car.speed < 0 ? -1 : 1);
  car.steer = steerIn;

  // Drift: hard steering at speed pays, with smoke and a floating popup.
  const drifting = Math.abs(steerIn) > 0.5 && spd > 20;
  if (drifting) {
    car.driftTimer += dt;
    if (car.driftTimer > 0.9) {
      car.driftChain = Math.min(5, car.driftChain + 1);
      car.driftTimer = 0;
      const pay = 50 * car.driftChain;
      car.driftEarned += pay;
      G.cash += pay;
      G.popups.push({ text: `DRIFT x${car.driftChain} +$${pay}`, until: G.time + 1.6, big: true });
      spawnSmoke();
    }
  } else {
    car.driftTimer = 0;
    car.driftChain = Math.max(0, car.driftChain - dt * 0.5);
  }

  const nx = car.x + Math.cos(car.heading) * car.speed * dt;
  const nz = car.z - Math.sin(car.heading) * car.speed * dt;
  const [cx, cz] = collideBuildings(nx, nz, 2.4);
  if (cx !== nx || cz !== nz) car.speed *= 0.55;
  car.x = Math.max(-CFG.worldHalf, Math.min(CFG.worldHalf, cx));
  car.z = Math.max(-46, Math.min(268, cz));
  car.group.position.set(car.x, 0, car.z);
  car.group.rotation.y = -car.heading;
  // Body roll into the turn, brake lights flare under braking.
  car.group.rotation.z = -steerIn * Math.min(0.09, spd * 0.002);
  G.car.brakeGlow.emissiveIntensity = back && car.speed > 1 ? 2.6 : 1.6;
  G.fuel = Math.max(0, G.fuel - spd * dt * 0.004);
}

function spawnSmoke() {
  if (!G.car.group) return;
  const puff = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 }));
  puff.position.set(G.car.x - Math.cos(G.car.heading) * 2, 0.5, G.car.z + Math.sin(G.car.heading) * 2);
  G.scene.add(puff);
  G.car.smoke.push({ mesh: puff, life: 0.9 });
}

export function updateSmoke(dt) {
  for (let i = G.car.smoke.length - 1; i >= 0; i--) {
    const s = G.car.smoke[i];
    s.life -= dt;
    s.mesh.scale.multiplyScalar(1 + dt * 2);
    s.mesh.material.opacity = Math.max(0, s.life * 0.5);
    if (s.life <= 0) { G.scene.remove(s.mesh); G.car.smoke.splice(i, 1); }
  }
}
