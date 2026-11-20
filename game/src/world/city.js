// Suncoast itself: the ground, roads, ocean and beach, the 190-plus
// buildings, palms, boardwalk kiosks, ferris wheel, pier, lighthouse,
// marina, industrial yard, garage and safehouse. The city is laid out on
// a grid with real streets, so the minimap, the police and the missions
// all read the same streets.

import * as THREE from 'three';
import { G, CFG, mulberry32 } from '../core/config.js';
import { windowsTexture, roadTexture, sandTexture, waterTexture, kioskSignTexture } from './textures.js';

const PALETTES = [
  { base: '#3a2f28', lit: '#ffbf5e' },
  { base: '#2c3444', lit: '#ffd27a' },
  { base: '#443028', lit: '#ff9e4a' },
  { base: '#33302e', lit: '#ffe08a' },
];

function box(w, h, d, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  (parent || G.scene).add(m);
  return m;
}

export function buildCity() {
  const scene = G.scene;
  const rnd = mulberry32(CFG.seed);

  // Ground: city slab, sand strip, ocean.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(620, 300),
    new THREE.MeshStandardMaterial({ color: 0x3d3a38, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 140);
  ground.receiveShadow = true; scene.add(ground);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(620, 44),
    new THREE.MeshStandardMaterial({ map: sandTexture(), roughness: 1 }));
  sand.material.map.repeat.set(8, 1);
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.05, -29);
  sand.receiveShadow = true; scene.add(sand);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(760, 420),
    new THREE.MeshStandardMaterial({ map: waterTexture(), color: 0x9fc8d8, roughness: 0.3, metalness: 0.2 }));
  water.material.map.repeat.set(6, 4);
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.15, -260);
  scene.add(water);
  G.ocean = water;

  const foam = new THREE.Mesh(new THREE.PlaneGeometry(620, 5),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(0, 0.1, -50);
  scene.add(foam);
  G.foam = foam;

  // Roads: beach road along the shore, one avenue, five cross streets.
  const roadTex = roadTexture();
  const beachRoad = new THREE.Mesh(new THREE.PlaneGeometry(580, 14),
    new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 }));
  beachRoad.material.map = roadTex.clone();
  beachRoad.material.map.repeat.set(9, 1); beachRoad.material.map.needsUpdate = true;
  beachRoad.rotation.x = -Math.PI / 2; beachRoad.position.set(0, 0.08, 0);
  beachRoad.receiveShadow = true; scene.add(beachRoad);

  const avenue = new THREE.Mesh(new THREE.PlaneGeometry(580, 15),
    new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.9 }));
  avenue.rotation.x = -Math.PI / 2; avenue.position.set(0, 0.08, CFG.avenueZ);
  avenue.receiveShadow = true; scene.add(avenue);

  for (const cx of [-160, -80, 0, 80, 160]) {
    const street = new THREE.Mesh(new THREE.PlaneGeometry(12, 250),
      new THREE.MeshStandardMaterial({ color: 0x2e2e33, roughness: 0.9 }));
    street.rotation.x = -Math.PI / 2; street.position.set(cx, 0.08, 135);
    street.receiveShadow = true; scene.add(street);
  }
  // Sidewalk on the city side of the beach road.
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(580, 5),
    new THREE.MeshStandardMaterial({ color: 0x8a7a66, roughness: 1 }));
  walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0.1, 9.5);
  walk.receiveShadow = true; scene.add(walk);

  // Buildings: varied heights and palettes, lit windows, warm bounce
  // keeps the sunset-facing walls readable.
  const winTex = PALETTES.map((p, i) => windowsTexture(p.base, p.lit, 0.55, 11 + i * 7));
  const topMat = new THREE.MeshStandardMaterial({ color: 0x54463a, roughness: 1 });
  let count = 0;
  const blocked = (x, z) =>
    (z > 108 && z < 132) || [-160, -80, 0, 80, 160].some((cx) => Math.abs(x - cx) < 12) ||
    (x > 108 && x < 176 && z > 122 && z < 182) || // industrial yard
    (Math.abs(x + 45) < 18 && Math.abs(z - 55) < 16) || // garage
    (Math.abs(x - 95) < 16 && Math.abs(z - 55) < 14) || // safehouse
    (x < -200 && z < 60); // marina
  for (let gx = -252; gx <= 252; gx += 28) {
    for (let gz = 28; gz <= 252; gz += 26) {
      if (blocked(gx, gz)) continue;
      const downtown = Math.abs(gx) < 80 && gz > 60 && gz < 220;
      const h = downtown ? 26 + rnd() * 46 : 8 + rnd() * 20;
      const w = 15 + rnd() * 8, d = 14 + rnd() * 8;
      const pi = Math.floor(rnd() * PALETTES.length);
      const side = new THREE.MeshStandardMaterial({
        map: winTex[pi], emissiveMap: winTex[pi], emissive: 0xffc36a,
        emissiveIntensity: 0.85, roughness: 0.9,
      });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
        [side, side, topMat, topMat, side, side]);
      b.position.set(gx + (rnd() - 0.5) * 4, h / 2, gz + (rnd() - 0.5) * 4);
      b.castShadow = true; b.receiveShadow = true;
      scene.add(b);
      G.buildings.push({ minX: b.position.x - w / 2, maxX: b.position.x + w / 2,
        minZ: b.position.z - d / 2, maxZ: b.position.z + d / 2 });
      count++;
      if (rnd() < 0.4) {
        const h2 = 5 + rnd() * 9;
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(9, h2, 8),
          [side, side, topMat, topMat, side, side]);
        b2.position.set(b.position.x + 13, h2 / 2, b.position.z + 6);
        b2.castShadow = true; scene.add(b2);
        G.buildings.push({ minX: b2.position.x - 4.5, maxX: b2.position.x + 4.5,
          minZ: b2.position.z - 4, maxZ: b2.position.z + 4 });
        count++;
      }
    }
  }
  G.buildingCount = count;

  buildPalms(rnd);
  buildBoardwalk(rnd);
  buildFerrisWheel();
  buildPier();
  buildLighthouse();
  buildYard();
  buildMarina(rnd);
  buildGarageAndSafehouse();
  buildMarker();
}

function buildPalms(rnd) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 });
  const frondMats = [0x2e7d32, 0x388e3c, 0x1b5e20].map((c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide }));
  for (let i = 0; i < 64; i++) {
    const x = -270 + i * 8.5 + (rnd() - 0.5) * 4;
    const z = rnd() < 0.6 ? -11.5 : 11.5;
    const h = 7 + rnd() * 3.5;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, h, 6), trunkMat);
    trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
    const fronds = 9;
    for (let f = 0; f < fronds; f++) {
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 3.8), frondMats[f % 3]);
      fr.position.y = h + 0.2;
      fr.rotation.y = (f / fronds) * Math.PI * 2;
      fr.rotation.x = -1.05 - rnd() * 0.3;
      fr.translateY(1.2);
      g.add(fr);
    }
    g.position.set(x, 0, z);
    g.rotation.z = (rnd() - 0.5) * 0.1;
    G.scene.add(g);
  }
}

function buildBoardwalk(rnd) {
  const names = ['TACOS', 'SURF SHOP', 'ICE COLD', 'PIER DOGS', 'SUNSET BAR', 'SHAVE ICE', 'BAIT SHOP', 'ARCADE'];
  const roofCols = [0xc0392b, 0x2471a3, 0x8e44ad, 0x1e8449];
  names.forEach((name, i) => {
    const x = -126 + i * 36;
    const g = new THREE.Group();
    const body = box(10, 4.5, 7, new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 }), 0, 2.25, 0, g);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.5, 2.6, 4),
      new THREE.MeshStandardMaterial({ color: roofCols[i % 4], roughness: 0.8 }));
    roof.position.y = 5.8; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 2),
      new THREE.MeshBasicMaterial({ map: kioskSignTexture(name, '#241a12', '#ffd27a') }));
    sign.position.set(0, 4.4, 3.55); g.add(sign);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(8, 3),
      new THREE.MeshBasicMaterial({ color: 0xffc36a, transparent: true, opacity: 0.55 }));
    glow.position.set(0, 1.8, 3.52); g.add(glow);
    const awning = box(10.5, 0.25, 2.4, new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.9 }), 0, 3.4, 4.2, g);
    g.position.set(x, 0, -13.5);
    G.scene.add(g);
  });
}

function buildFerrisWheel() {
  const g = new THREE.Group();
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd43d2a, roughness: 0.5, metalness: 0.3 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(15, 0.55, 10, 40), rimMat);
  rim.castShadow = true; g.add(rim);
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d2, roughness: 0.6 });
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 29, 0.5), spokeMat);
    s.rotation.z = (i / 8) * Math.PI; g.add(s);
  }
  const gondolaMat = new THREE.MeshStandardMaterial({ color: 0x2471a3, roughness: 0.6 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2, 2), gondolaMat);
    cab.position.set(Math.cos(a) * 15, Math.sin(a) * 15, 0);
    g.add(cab);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2, 12), spokeMat);
  hub.rotation.x = Math.PI / 2; g.add(hub);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, metalness: 0.5 });
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(1, 18, 1), legMat);
    leg.position.set(s * 6, -8, 0); leg.rotation.z = s * 0.35; g.add(leg);
  }
  g.position.set(35, 17, -16);
  // Turned 45 degrees so the rim reads as a wheel from the beach road
  // (looking east) and from the ocean side (looking south) alike.
  g.rotation.y = Math.PI / 4;
  G.scene.add(g);
  G.wheel = g;
}

function buildPier() {
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x7a5c3e, roughness: 1 });
  const deck = box(10, 0.6, 46, deckMat, 60, 1.2, -72);
  const hut = box(7, 4, 6, new THREE.MeshStandardMaterial({ color: 0x2471a3, roughness: 0.8 }), 60, 3.4, -90);
  const hutRoof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 2.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 }));
  hutRoof.position.set(60, 6.4, -90); hutRoof.rotation.y = Math.PI / 4; G.scene.add(hutRoof);
  for (let z = -54; z > -94; z -= 8) {
    for (const x of [56, 64]) box(0.6, 3, 0.6, deckMat, x, 0, z);
  }
}

function buildLighthouse() {
  const g = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.2, 26, 12),
    new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.8 }));
  tower.position.y = 13; tower.castShadow = true; g.add(tower);
  for (const y of [8, 18]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.7, 3, 12),
      new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 }));
    band.position.y = y; g.add(band);
  }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffd27a, emissiveIntensity: 2 }));
  lamp.position.y = 27; g.add(lamp);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(9, 40, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  beam.rotation.z = Math.PI / 2; beam.position.set(20, 27, 0); g.add(beam);
  G.lightBeam = beam;
  g.position.set(-250, 0, -40);
  G.scene.add(g);
}

function buildYard() {
  const g = new THREE.Group();
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(64, 56),
    new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 1 }));
  lot.rotation.x = -Math.PI / 2; lot.position.y = 0.06; lot.receiveShadow = true; g.add(lot);
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8, metalness: 0.5 });
  for (const [w, d, x, z] of [[64, 0.4, 0, -28], [64, 0.4, 0, 28], [0.4, 56, -32, 0], [0.4, 56, 32, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, 3, d), fenceMat);
    f.position.set(x, 1.5, z); g.add(f);
  }
  const cols = [0x8e3b2f, 0x2f5d8e, 0x3f7d4a, 0xb98a2e];
  const rnd = mulberry32(7);
  const spots = [[-18, -14], [-6, -16], [8, -12], [-20, 2], [14, 4], [-8, 12], [10, 16], [20, -8]];
  spots.forEach(([x, z], i) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(11, 2.6, 2.6),
      new THREE.MeshStandardMaterial({ color: cols[i % 4], roughness: 0.85, metalness: 0.2 }));
    c.position.set(x, 1.3 + (i % 3 === 0 ? 2.6 : 0), z);
    c.rotation.y = (i % 2) * 0.12; c.castShadow = true; g.add(c);
    if (i % 3 === 0) {
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(11, 2.6, 2.6), c.material);
      c2.position.set(x, 1.3, z); c2.rotation.y = c.rotation.y; c2.castShadow = true; g.add(c2);
    }
  });
  for (let i = 0; i < 8; i++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x8a6a3e, roughness: 1 }));
    crate.position.set(-24 + rnd() * 48, 1.1, -22 + rnd() * 44);
    crate.rotation.y = rnd() * 1.5; crate.castShadow = true; g.add(crate);
  }
  g.position.set(140, 0, 150);
  G.scene.add(g);
}

function buildMarina(rnd) {
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 });
  box(40, 0.8, 6, dockMat, -228, 0.6, -18);
  box(6, 0.8, 30, dockMat, -212, 0.6, -32);
  for (let i = 0; i < 3; i++) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(9, 1.6, 3),
      new THREE.MeshStandardMaterial({ color: [0xf0f0f0, 0x2471a3, 0xc0392b][i], roughness: 0.5 }));
    hull.position.y = 0.4; boat.add(hull);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 }));
    cab.position.set(-1, 1.8, 0); boat.add(cab);
    boat.position.set(-240 - i * 4, 0, -34 - i * 10);
    boat.rotation.y = 0.3;
    G.scene.add(boat);
  }
}

function buildGarageAndSafehouse() {
  const garage = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(22, 7, 16),
    new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 }));
  walls.position.y = 3.5; walls.castShadow = true; garage.add(walls);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.5),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.4 }));
  door.position.set(0, 2.75, 8.05); garage.add(door);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.4),
    new THREE.MeshBasicMaterial({ map: kioskSignTexture('GARAGE', '#1a1a1a', '#ffd27a') }));
  sign.position.set(0, 6.4, 8.1); garage.add(sign);
  garage.position.set(-45, 0, 55);
  G.scene.add(garage);

  const house = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(13, 6, 11),
    new THREE.MeshStandardMaterial({ color: 0xd8c49a, roughness: 0.9 }));
  body.position.y = 3; body.castShadow = true; house.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x8e3b2f, roughness: 0.9 }));
  roof.position.y = 7.6; roof.rotation.y = Math.PI / 4; house.add(roof);
  const porch = new THREE.Mesh(new THREE.PlaneGeometry(3, 4),
    new THREE.MeshBasicMaterial({ color: 0xffc36a, transparent: true, opacity: 0.6 }));
  porch.position.set(0, 2, 5.55); house.add(porch);
  house.position.set(95, 0, 55);
  G.scene.add(house);
}

// The mission marker: a glowing disc on the ground plus a modest beam,
// never a pillar that eats a third of the frame.
function buildMarker() {
  const disc = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.4, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2; disc.position.set(G.marker.x, 0.15, G.marker.z);
  G.scene.add(disc);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 7, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.set(G.marker.x, 3.5, G.marker.z);
  G.scene.add(beam);
  G.marker.mesh = disc; G.marker.beam = beam;
}

export function moveMarker(x, z) {
  G.marker.x = x; G.marker.z = z;
  if (G.marker.mesh) { G.marker.mesh.position.set(x, 0.15, z); G.marker.beam.position.set(x, 3.5, z); }
}
