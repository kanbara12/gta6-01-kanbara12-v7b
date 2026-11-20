// On-foot combat: the player figure, a pistol that stays visible in
// his hand from the shot camera, three yard enemies with health bars,
// muzzle flash, bounties, and enemies who shoot back when the player
// gets close.

import * as THREE from 'three';
import { G, WEAPONS, CFG } from '../core/config.js';

export function buildPlayerFigure() {
  const g = new THREE.Group();
  const jacket = new THREE.MeshStandardMaterial({ color: 0x1f2a3a, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc89878, roughness: 0.8 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.36), jacket);
  body.position.y = 1.15; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), skin);
  head.position.y = 1.75; g.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0xc01818, roughness: 0.7 }));
  cap.position.y = 1.92; g.add(cap);
  for (const s of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.22), pants);
    leg.position.set(0, 0.4, s); g.add(leg);
  }
  // Pistol, held out on the camera side of the body where the shot
  // camera can see it: dark slide and grip, never a pale ball.
  const gun = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.11),
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5, metalness: 0.4 }));
  grip.position.y = -0.06; gun.add(grip);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.35, metalness: 0.8 }));
  barrel.position.set(0.28, 0.06, 0); gun.add(barrel);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.8 }));
  slide.position.set(0.26, 0.13, 0); gun.add(slide);
  // Muzzle flash: a starburst, not a ball — a bright core plus crossed
  // planes and a forward cone, all lit by the flash point light.
  const flashGroup = new THREE.Group();
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0 });
  const flashCore = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), flashMat);
  flashCore.position.set(0.6, 0.06, 0); flashGroup.add(flashCore);
  const flashMat2 = new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const spikeH = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.22), flashMat2);
  spikeH.position.set(0.62, 0.06, 0); flashGroup.add(spikeH);
  const spikeV = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.95), flashMat2);
  spikeV.position.set(0.62, 0.06, 0); flashGroup.add(spikeV);
  const flashCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 10), flashMat2);
  flashCone.rotation.z = -Math.PI / 2; flashCone.position.set(0.85, 0.06, 0); flashGroup.add(flashCone);
  gun.add(flashGroup);
  gun.position.set(0.28, 1.3, 0.3);
  g.add(gun);
  G.player.gun = gun; G.player.flashMat = flashMat; G.player.flashMat2 = flashMat2;
  G.player.flashGroup = flashGroup;
  const light = new THREE.PointLight(0xffd27a, 0, 12);
  light.position.set(0.8, 1.4, 0.3); g.add(light);
  G.player.flashLight = light;

  g.position.set(G.player.x, 0, G.player.z);
  G.scene.add(g);
  G.player.group = g;
  return g;
}

export function buildEnemies() {
  const spots = [[156, 158], [162, 156], [168, 158]];
  spots.forEach(([x, z], i) => {
    const g = new THREE.Group();
    const shirt = new THREE.MeshStandardMaterial({ color: 0x8e2f26, roughness: 0.9 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xb08060, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.36), shirt);
    body.position.y = 1.15; body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), skin);
    head.position.y = 1.75; g.add(head);
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 }));
    gun.position.set(0.3, 1.25, 0.25); g.add(gun);
    // Health bar: dark backing plus a green-to-red fill that shrinks.
    // Wide enough to read at 15 m in the mission frame.
    const barBg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x220000, depthTest: false }));
    barBg.position.y = 2.4; g.add(barBg);
    const barFg = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x37d67a, depthTest: false }));
    barFg.position.set(0, 2.4, 0.01); g.add(barFg);
    g.position.set(x, 0, z);
    G.scene.add(g);
    G.enemies.push({ group: g, barFg, x, z, hp: 100, alive: true, shootTimer: 1 + i });
  });
}

let lastShot = 0;

export function tryShoot(now) {
  const w = WEAPONS[G.weapon];
  if (now - lastShot < w.rate) return;
  lastShot = now;
  G.flashUntil = now + (G.shotFlash ? 999 : 0.09);
  // Hit the nearest enemy inside the aim cone.
  let best = null, bestScore = 1e9;
  const aimX = Math.cos(G.player.heading), aimZ = -Math.sin(G.player.heading);
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const dx = e.x - G.player.x, dz = e.z - G.player.z;
    const d = Math.hypot(dx, dz);
    if (d > w.range) continue;
    const dot = (dx * aimX + dz * aimZ) / (d || 1);
    if (dot < 0.82 && d > 3) continue;
    if (d < bestScore) { bestScore = d; best = e; }
  }
  if (best) {
    best.hp -= w.damage;
    best.barFg.scale.x = Math.max(0.01, best.hp / 100);
    best.barFg.position.x = -(1.05 * (1 - best.hp / 100)) / 2;
    best.barFg.material.color.set(best.hp > 50 ? 0x37d67a : best.hp > 25 ? 0xffb020 : 0xff3b30);
    if (best.hp <= 0) {
      best.alive = false;
      best.group.rotation.x = -Math.PI / 2;
      best.group.position.y = 0.3;
      G.targetsDown++;
      G.cash += CFG.yardBounty;
      G.popups.push({ text: `BOUNTY +$${CFG.yardBounty}`, until: G.time + 1.6, big: false });
    }
  }
}

export function updateCombat(dt) {
  const p = G.player;
  if (p.group) {
    p.group.position.set(p.x, 0, p.z);
    p.group.rotation.y = -p.heading;
  }
  const flashing = G.time < G.flashUntil;
  if (p.flashMat) {
    p.flashMat.opacity = flashing ? 0.95 : 0;
    if (p.flashMat2) p.flashMat2.opacity = flashing ? 0.9 : 0;
    if (p.flashGroup) p.flashGroup.visible = flashing;
    p.flashLight.intensity = flashing ? 14 : 0;
  }
  // Enemies edge toward the player and shoot back inside 20 metres.
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const dx = p.x - e.x, dz = p.z - e.z;
    const d = Math.hypot(dx, dz) || 1;
    e.group.lookAt(p.x, 0, p.z);
    if (d > 6 && d < 40) {
      e.x += (dx / d) * 1.6 * dt; e.z += (dz / d) * 1.6 * dt;
      e.group.position.set(e.x, 0, e.z);
    }
    if (d < 20) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 1.4;
        G.hp = Math.max(5, G.hp - 3);
      }
    }
  }
}

export function updatePlayerOnFoot(dt) {
  if (!G.player.onFoot || G.mode !== 'play') return;
  const p = G.player;
  const move = ((G.keys.up ? 1 : 0) - (G.keys.down ? 1 : 0));
  const strafe = ((G.keys.right ? 1 : 0) - (G.keys.left ? 1 : 0));
  const sp = CFG.walkSpeed * (G.keys.boost ? 1.5 : 1);
  const mx = Math.cos(p.heading) * move + Math.cos(p.heading - Math.PI / 2) * strafe;
  const mz = -Math.sin(p.heading) * move - Math.sin(p.heading - Math.PI / 2) * strafe;
  const len = Math.hypot(mx, mz) || 1;
  p.x += (mx / len) * sp * dt * (move || strafe ? 1 : 0);
  p.z += (mz / len) * sp * dt * (move || strafe ? 1 : 0);
  p.x = Math.max(-CFG.worldHalf, Math.min(CFG.worldHalf, p.x));
  p.z = Math.max(-48, Math.min(268, p.z));
  if (G.keys.shoot) tryShoot(G.time);
}
