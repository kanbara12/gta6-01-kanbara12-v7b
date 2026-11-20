// The story loop: eight contracts, one marker at a time, with the
// economy from the plan. Reaching a marker pays the contract and moves
// every number together. The yard contract only closes when the crew
// is down; the garage drops heat; the safehouse heals; five street
// stashes pay $250 each.

import * as THREE from 'three';
import { G, MISSIONS, CFG, repForJob, fmtMoney } from '../core/config.js';
import { moveMarker } from '../world/city.js';

export function currentMission() { return MISSIONS[G.missionIndex]; }

export function setMission(i) {
  G.missionIndex = Math.max(0, Math.min(7, i));
  const m = currentMission();
  G.par = m.par;
  G.wanted = m.wanted;
  G.wantedLabel = m.wanted === 0 ? 'CLEAR' : m.wanted >= 3 ? 'IN SIGHT' : 'SEARCHING';
  moveMarker(m.marker[0], m.marker[1]);
}

export function missionTitle() {
  if (G.loopDone) return 'LOOP COMPLETE';
  const m = currentMission();
  return `JOB ${G.missionIndex + 1}/8 • ${m.title}`;
}

export function completeMission() {
  const m = currentMission();
  G.cash += m.pay;
  G.jobsDone++;
  G.popups.push({ text: `JOB DONE +${fmtMoney(m.pay)}`, until: G.time + 2.2, big: true });
  if (G.missionIndex >= 7) {
    G.loopDone = true;
    G.wanted = 0;
    G.wantedLabel = 'CLEAR';
    G.dialogue = 'raeEnd';
    moveMarker(-250, -40);
    return;
  }
  setMission(G.missionIndex + 1);
  G.elapsed = 0;
  G.rep = repForJob(G.missionIndex + 1);
}

const STASHES = [
  { x: 100, z: 0, taken: false },
  { x: -200, z: 0, taken: false },
  { x: 0, z: 120, taken: false },
  { x: 160, z: 120, taken: false },
  { x: -100, z: 120, taken: false },
];

export function buildStashes() {
  for (const s of STASHES) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x2fae5f, emissive: 0x2fae5f, emissiveIntensity: 0.7 }),
    );
    mesh.position.set(s.x, 0.5, s.z);
    G.scene.add(mesh);
    s.mesh = mesh;
  }
}

export function updateMissions(dt) {
  if (G.mode !== 'play' || G.loopDone) return;
  // Staged screenshot scenes never advance the story: the frame has to
  // keep the cash, job and timer the staging table set.
  if (G.shot) return;
  const px = G.car.inCar ? G.car.x : G.player.x;
  const pz = G.car.inCar ? G.car.z : G.player.z;
  const m = currentMission();
  const d = Math.hypot(px - m.marker[0], pz - m.marker[1]);
  if (G.missionIndex === 3) {
    // Street sweep: the yard crew has to be down before the job closes.
    if (G.targetsDown >= 3 && d < 8) completeMission();
  } else if (d < 6) {
    completeMission();
  }
  // Street cash.
  for (const s of STASHES) {
    if (!s.taken && Math.hypot(px - s.x, pz - s.z) < 3) {
      s.taken = true;
      s.mesh.visible = false;
      G.cash += 250;
      G.popups.push({ text: 'STASH +$250', until: G.time + 1.6, big: false });
    }
  }
  // Garage repaint drops heat and refuels; safehouse heals.
  if (Math.hypot(px + 45, pz - 55) < 10 && G.wanted > 0) {
    G.wanted = Math.max(0, G.wanted - 2);
    G.fuel = 100; G.cond = 100;
    G.popups.push({ text: 'REPAINT — HEAT DOWN', until: G.time + 1.8, big: false });
  }
  if (Math.hypot(px - 95, pz - 55) < 9) G.hp = Math.min(100, G.hp + 10 * dt);
}
