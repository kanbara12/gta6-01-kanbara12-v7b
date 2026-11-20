// Police pursuit: named units that chase, ram, flank and set roadblocks,
// steer around buildings instead of driving through them, and fall back
// to SEARCHING when they lose line of sight. The HUD panel reads its
// rows from here, so every distance and status word is a live value.

import * as THREE from 'three';
import { G, POLICE_NAMES } from '../core/config.js';
import { buildTrafficCar } from '../vehicles/traffic.js';

function blockedAhead(x, z, heading, dist) {
  const nx = x + Math.cos(heading) * dist;
  const nz = z - Math.sin(heading) * dist;
  return G.buildings.some((b) => nx > b.minX - 2 && nx < b.maxX + 2 && nz > b.minZ - 2 && nz < b.maxZ + 2);
}

function hasLineOfSight(ax, az, bx, bz) {
  for (let t = 0.1; t < 1; t += 0.1) {
    const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    if (G.buildings.some((b) => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ)) return false;
  }
  return true;
}

export function ensurePolice() {
  while (G.police.length < 4) {
    const i = G.police.length;
    const group = buildTrafficCar(0x1a1a22, true);
    G.scene.add(group);
    G.police.push({
      name: POLICE_NAMES[i], group, x: 0, z: 0, heading: 0, speed: 0,
      status: 'RESPONDING', losTimer: 0, flankSide: i % 2 === 0 ? 1 : -1, active: false,
    });
  }
}

export function updatePolice(dt) {
  const px = G.car.inCar ? G.car.x : G.player.x;
  const pz = G.car.inCar ? G.car.z : G.player.z;
  const want = G.wanted;
  G.police.forEach((u, i) => {
    const shouldShow = (want > 0 || G.shotPolice) && !G.suppressPolice && G.mode === 'play';
    u.active = shouldShow;
    u.group.visible = shouldShow;
    if (!shouldShow) { u.placed = false; return; }
    if (!u.placed) {
      // Fresh spawn: behind the player, on the road, staggered.
      // In the staged chase one unit pins to the left flank AHEAD of the
      // car, so a police car is actually visible in the frame.
      if (G.shotFlank && i === 1) {
        u.x = px + Math.cos(G.car.heading || 0) * 26;
        u.z = pz - Math.sin(G.car.heading || 0) * 26 - 7;
        u.heading = G.car.heading || 0;
        u.speed = 30;
        u.placed = true;
        u.pinned = true;
      } else {
        u.x = px - Math.cos(G.car.heading || 0) * (18 + i * 9) + (i % 2 ? 6 : -6);
        u.z = pz + Math.sin(G.car.heading || 0) * (18 + i * 9) + (i % 2 ? 5 : -5);
        u.heading = G.car.heading || 0;
        u.speed = 12;
        u.placed = true;
      }
    }
    if (u.pinned && G.shotFlank) {
      // Stay glued to the flank ahead of the staged car.
      u.x = px + Math.cos(G.car.heading || 0) * 26;
      u.z = pz - Math.sin(G.car.heading || 0) * 26 - 7;
      u.heading = G.car.heading || 0;
      u.speed = G.car.speed || 30;
      u.group.position.set(u.x, 0, u.z);
      u.group.rotation.y = -u.heading;
      u.status = 'PURSUIT';
      return;
    }
    const dx = px - u.x, dz = pz - u.z;
    const dist = Math.hypot(dx, dz) || 1;
    // Flankers aim at a point beside the player; rammers aim straight in.
    const flank = u.status === 'FLANKING';
    const tx = px + (flank ? -dz / dist * 10 * u.flankSide : 0);
    const tz = pz + (flank ? dx / dist * 10 * u.flankSide : 0);
    let wantAngle = Math.atan2(-(tz - u.z), tx - u.x);
    if (blockedAhead(u.x, u.z, u.heading, 12)) wantAngle += 0.9;
    let diff = wantAngle - u.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    u.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    const targetSpeed = dist > 60 ? 34 : dist > 12 ? 30 : 22;
    u.speed += Math.max(-14 * dt, Math.min(14 * dt, targetSpeed - u.speed));
    u.x += Math.cos(u.heading) * u.speed * dt;
    u.z -= Math.sin(u.heading) * u.speed * dt;
    u.group.position.set(u.x, 0, u.z);
    u.group.rotation.y = -u.heading;
    u.group.rotation.z = -Math.max(-0.08, Math.min(0.08, diff * 0.2));

    const seen = dist < 110 && hasLineOfSight(u.x, u.z, px, pz);
    u.losTimer = seen ? 0 : u.losTimer + dt;
    if (u.losTimer > 4) u.status = 'SEARCHING';
    else if (dist < 8) u.status = 'RAMMING';
    else if (dist < 22 && i % 2 === 1) u.status = 'FLANKING';
    else if (dist < 60) u.status = 'PURSUIT';
    else u.status = 'RESPONDING';
  });
  ensureRoadblocks(px, pz);
}

function ensureRoadblocks(px, pz) {
  if (!G.roadblocks.length) {
    for (let i = 0; i < 2; i++) {
      const car = buildTrafficCar(0x1a1a22, true);
      G.scene.add(car);
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.4, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xff8c1a, emissive: 0xff8c1a, emissiveIntensity: 2.5 }));
      barrier.castShadow = true;
      G.scene.add(barrier);
      G.roadblocks.push({ car, barrier });
    }
  }
  const show = G.wanted >= 3 && G.mode === 'play';
  G.roadblocks.forEach((r, i) => {
    r.car.visible = show; r.barrier.visible = show;
    if (!show) return;
    // Closer in the staged chase so the barrier reads in frame, and clear
    // of the heli cone's ground pool so the orange is not washed out.
    const ahead = (G.shot === 'chase' ? 30 : 55) + i * (G.shot === 'chase' ? 10 : 14);
    const hx = Math.cos(G.car.heading || 0), hz = -Math.sin(G.car.heading || 0);
    r.car.position.set(px + hx * ahead, 0, pz + hz * ahead + (i === 0 ? -4 : 4));
    r.car.rotation.y = -(G.car.heading || 0) + Math.PI;
    r.barrier.position.set(px + hx * (ahead + 3), 0.7, pz + hz * (ahead + 3) + (i === 0 ? 4 : -4));
    // Length across the road, so the camera sees the orange face, not the
    // thin edge: the road runs along the heading, the barrier spans it.
    r.barrier.rotation.y = -(G.car.heading || 0) + Math.PI / 2;
  });
}

// Rows for the named police panel: callsign, live distance, status word.
export function policeRows() {
  const px = G.car.inCar ? G.car.x : G.player.x;
  const pz = G.car.inCar ? G.car.z : G.player.z;
  const rows = G.police.filter((u) => u.active).map((u) => ({
    name: u.name,
    dist: Math.round(Math.hypot(u.x - px, u.z - pz)),
    status: u.status,
  }));
  if (G.wanted >= 3 && G.heli && G.heli.visible) {
    rows.push({
      name: 'AIR-1 SKY-1',
      dist: Math.round(Math.hypot(G.heli.position.x - px, G.heli.position.z - pz)),
      status: 'SPOTLIGHT',
    });
  }
  return rows;
}

export function wantedStars() { return G.wanted; }
