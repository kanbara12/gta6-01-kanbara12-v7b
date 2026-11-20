// Save and load through localStorage. The pause menu offers both;
// nothing is written without the player asking.

import { G, repForJob } from '../core/config.js';
import { setMission } from '../missions/story.js';

const KEY = 'suncoast-heatline-save-v1';

export function saveGame() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      cash: G.cash, missionIndex: G.missionIndex, jobsDone: G.jobsDone,
      rep: G.rep, hp: G.hp, fuel: G.fuel,
    }));
    return true;
  } catch { return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    G.cash = d.cash; G.jobsDone = d.jobsDone; G.rep = d.rep;
    G.hp = d.hp ?? 100; G.fuel = d.fuel ?? 100;
    setMission(d.missionIndex || 0);
    G.rep = repForJob(G.missionIndex + 1);
    G.elapsed = 0;
    return true;
  } catch { return false; }
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}
