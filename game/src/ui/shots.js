// Screenshot staging: each ?shot= scene sets the job, cash, REP, jobs
// done, wanted level, timer, speed, police state and dialogue together
// from the plan's table, then puts the car or the player where the
// camera for that scene needs them. The four submitted frames differ in
// location, time of day, camera and gameplay mode on purpose: a wide
// high establishing shot, a low close beach-road chase, a night
// downtown pursuit under the helicopter, and an on-foot yard fight.

import { G, SHOTS, repForJob } from '../core/config.js';
import { setMission } from '../missions/story.js';
import { showDialogue } from './hud.js';

export function applyShot(name) {
  const s = SHOTS[name];
  if (!s) return false;
  G.shot = name;
  G.shotName = name;
  G.tod = s.tod;
  setMission(s.job - 1);
  G.cash = s.cash;
  G.rep = s.complete ? 10 : repForJob(s.job);
  G.jobsDone = s.complete ? 8 : s.job - 1;
  G.elapsed = s.timer;
  G.wanted = s.wanted;
  G.wantedLabel = s.wanted === 0 ? 'CLEAR' : s.wanted >= 3 ? 'IN SIGHT' : 'SEARCHING';
  G.targetsDown = s.targetsDown || 0;
  G.loopDone = !!s.complete;
  G.shotPolice = false; G.shotHeli = false; G.shotFlank = false;
  G.car.inCar = true; G.player.onFoot = false;
  G.player.group.visible = false;

  if (name === 'start') {
    G.car.x = -60; G.car.z = 0; G.car.heading = 0;
    G.car.speed = s.speedKmh / 3.6;
    if (G.sunDisc) { G.sunDisc.position.set(-250, 60, -120); G.sunDisc.lookAt(0, 40, 0); }
    if (G.sunGlow) G.sunGlow.position.set(-250, 60, -120);
  } else if (name === 'play') {
    G.car.x = -45; G.car.z = 0; G.car.heading = 0;
    G.car.speed = s.speedKmh / 3.6;
    // Wanted stays 0, but four units answer and the heli works the sky,
    // the variant the plan allows for this frame.
    G.shotPolice = true; G.shotHeli = true;
    G.heliState.angle = -0.4; G.heliState.radius = 30; G.heliState.height = 15;
    clusterTraffic(G.car.x, [-5, 5]);
  } else if (name === 'chase') {
    G.car.x = 40; G.car.z = 120; G.car.heading = 0;
    G.car.speed = s.speedKmh / 3.6;
    // Heli lower and further ahead so its rotor clears the top edge and
    // the cone lands on the road in frame; one unit pins to the left
    // flank ahead so a police car is actually visible in the frame.
    G.heliState.angle = 0.3; G.heliState.radius = 22; G.heliState.height = 11;
    G.shotFlank = true;
    G.driftPopupUntil = G.time + 999;
    clusterTraffic(G.car.x, [110, 130]);
  } else if (name === 'mission') {
    G.car.inCar = false; G.player.onFoot = true;
    G.player.group.visible = true;
    G.car.x = 110; G.car.z = 174; G.car.heading = 2.4; G.car.speed = 0;
    // Open ground in the south-east of the yard, facing north: all three
    // enemies stand 12-14 m ahead in a spread arc, no container between
    // the camera and any of them, health bars facing the camera.
    G.player.x = 162; G.player.z = 170;
    G.player.heading = Math.PI / 2;
    G.shotFlash = true;
    G.flashUntil = 1e9;
    // No police in the yard frame: the sweep is the player's job alone.
    G.suppressPolice = true;
    // TARGETS 2/3 with $9,550: two bounties are already banked, so two
    // of the three yard crew are DOWN on the ground (no health bar) and
    // only one is left standing in the open with a full green bar.
    if (G.enemies.length >= 3) {
      const down = (e) => {
        e.alive = false; e.hp = 0;
        e.group.rotation.x = -Math.PI / 2;
        e.group.position.y = 0.3;
        if (e.barBg) e.barBg.visible = false;
        if (e.barFg) e.barFg.visible = false;
      };
      down(G.enemies[1]); down(G.enemies[2]);
      const lead = G.enemies[0];
      lead.alive = true; lead.hp = 100;
      lead.x = 162; lead.z = 154;
      lead.group.position.set(162, 0, 154);
      lead.group.rotation.x = 0;
      if (lead.barBg) lead.barBg.visible = true;
      if (lead.barFg) {
        lead.barFg.visible = true;
        lead.barFg.scale.x = 1; lead.barFg.position.x = 0;
        lead.barFg.material.color.set(0x37d67a);
      }
    }
  } else if (name === 'end') {
    G.car.x = -238; G.car.z = -32; G.car.heading = 0.6; G.car.speed = 0;
    G.car.inCar = false; G.player.onFoot = true;
    G.player.group.visible = true;
    G.player.x = -234; G.player.z = -27;
    G.player.heading = Math.atan2(13, -16);
  }
  G.car.group.position.set(G.car.x, 0, G.car.z);
  G.car.group.rotation.y = -G.car.heading;
  if (s.dialogue) showDialogue(s.dialogue, 999);
  return true;
}

// Pull a few traffic cars onto the same road near the hero car, so a
// chase frame actually shows traffic instead of an empty road.
function clusterTraffic(carX, laneRange) {
  const offsets = [18, 32, -28, 48, -45, 65];
  let i = 0;
  for (const t of G.traffic) {
    if (t.lane.axis !== 'x') continue;
    if (t.lane.lane < laneRange[0] || t.lane.lane > laneRange[1]) continue;
    t.pos = carX + offsets[i % offsets.length];
    i++;
  }
}
