// Shared state and tuning for SUNCOAST: HEATLINE.
// One mutable game object (G) is passed around by every module, so the
// mission index, cash, REP, jobs done, wanted level and timer always move
// together. Nothing in here draws anything; it only names the numbers.

export const CFG = {
  worldHalf: 280,
  roadZ: 0,
  avenueZ: 120,
  startCash: 1250,
  loopTotal: 22450,
  yardBounty: 150,
  maxSpeed: 42, // m/s, about 151 km/h
  accel: 14,
  brake: 26,
  reverseMax: 9,
  walkSpeed: 6.5,
  seed: 1,
};

// The eight contracts, in story order. Payouts add up with the start cash
// and the three yard bounties to exactly $22,450.
export const MISSIONS = [
  { title: 'A FAVOR IN THE HEAT', pay: 2500, par: 60, wanted: 0,
    objective: 'Meet the fixer Rae at the glowing marker',
    marker: [48, 0], district: 'Beachfront', street: 'Beachfront Rd' },
  { title: 'LOOSE CARGO', pay: 2500, par: 90, wanted: 0,
    objective: 'Pick up the sealed package at the next marker',
    marker: [-140, 0], district: 'Beachfront', street: 'Beachfront Rd' },
  { title: 'THE QUIET EXIT', pay: 3000, par: 120, wanted: 0,
    objective: 'Deliver the package across town, low heat',
    marker: [200, 120], district: 'Downtown', street: 'Meridian Ave' },
  { title: 'STREET SWEEP', pay: 3500, par: 180, wanted: 2,
    objective: 'Clear the hostile crew in the industrial yard',
    marker: [140, 150], district: 'Industrial', street: 'Yard Row' },
  { title: 'NO WITNESSES', pay: 4250, par: 150, wanted: 3,
    objective: 'Reach the garage and lose the heat',
    marker: [-45, 55], district: 'Downtown', street: 'Harbor St' },
  { title: 'LAST LIGHT', pay: 2000, par: 150, wanted: 4,
    objective: 'Final run at dusk, police roadblocks',
    marker: [240, 120], district: 'Downtown', street: 'Meridian Ave' },
  { title: 'THE MARINA SWAP', pay: 1500, par: 120, wanted: 1,
    objective: 'Case swap at the marina, boat and dock',
    marker: [-225, 30], district: 'Marina', street: 'Dockside Way' },
  { title: 'NORTH LIGHT', pay: 1500, par: 120, wanted: 1,
    objective: 'North-beach run to the lighthouse, loop closes',
    marker: [-250, -40], district: 'North Beach', street: 'Lighthouse Point' },
];

// REP shown while a job is running. The yard sweep pays one extra REP
// while it runs, and the final run pays two extra, so the meter reads
// 0, 1, 2, 4, 5, 6, 7, 10 across jobs 1 to 8, and 10 when the loop closes.
export function repForJob(job) {
  return (job - 1) + (job >= 4 ? 1 : 0) + (job >= 8 ? 2 : 0);
}

// Exact staging for the five screenshot scenes. Cash, REP, jobs done,
// wanted, timer and speed are set together from one row, never one at a
// time, so no frame can show JOB 5/8 with $1,250 or 0 JOBS DONE.
export const SHOTS = {
  start:   { job: 1, cash: 1250,  timer: 47,  speedKmh: 128, wanted: 0, tod: 'sunset', dialogue: null,
             place: 'beach', cam: 'wide' },
  play:    { job: 2, cash: 3750,  timer: 72,  speedKmh: 141, wanted: 0, tod: 'sunset', dialogue: 'rae',
             place: 'beach', cam: 'low34' },
  chase:   { job: 5, cash: 13200, timer: 129, speedKmh: 152, wanted: 3, tod: 'night', dialogue: 'sable',
             place: 'downtown', cam: 'highwide', drift: true },
  mission: { job: 4, cash: 9550,  timer: 152, speedKmh: 0,   wanted: 2, tod: 'sunset', dialogue: 'marlo',
             place: 'yard', cam: 'foot', targetsDown: 2, flash: true },
  end:     { job: 8, cash: 22450, timer: 0,   speedKmh: 0,   wanted: 0, tod: 'sunset', dialogue: 'raeEnd',
             place: 'lighthouse', cam: 'end', complete: true },
};

export const CREW_LINES = {
  rae: { name: 'RAE', role: 'FIXER', initial: 'R', color: '#b388ff',
    text: 'Heatline, you made it. Package moves tonight, drive like the city owes you money.' },
  sable: { name: 'SABLE', role: 'LOOKOUT', initial: 'S', color: '#5ec8e8',
    text: 'Eyes up, SKY-1 is on you and two units are closing on your flank. Do not stop in these streets — the roadblocks are already up ahead.' },
  marlo: { name: 'MARLO', role: 'DRIVER', initial: 'M', color: '#e8b25e',
    text: 'The yard crew skimmed our cut. I keep the engine running, you handle the yard.' },
  raeEnd: { name: 'RAE', role: 'FIXER', initial: 'R', color: '#b388ff',
    text: 'Loop closed, $22,450, and the whole coast is still talking about the Heatline. Same time tomorrow.' },
};

export const STATIONS = [
  { name: 'SHORELINE 96.7', track: 'Sunset Run', scale: [0, 3, 5, 7, 10] },
  { name: 'PIER 102.5', track: 'Neon Tide', scale: [0, 2, 3, 7, 8] },
  { name: 'DUNE 89.9', track: 'Dust and Gold', scale: [0, 2, 5, 7, 9] },
];

export const WEAPONS = [
  { key: '1', name: 'PISTOL', damage: 34, range: 34, rate: 0.28 },
  { key: '2', name: 'SMG', damage: 16, range: 30, rate: 0.09 },
  { key: '3', name: 'SHOTGUN', damage: 22, range: 18, rate: 0.7 },
  { key: '4', name: 'BAT', damage: 45, range: 2.6, rate: 0.5 },
];

export const POLICE_NAMES = ['SNOOK-10', 'SNOOK-11', 'SNOOK-12', 'SNOOK-13'];

// Deterministic random, so the city, traffic and walkers land the same
// way on every load with seed 1.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fmtMoney(n) { return '$' + n.toLocaleString('en-US'); }
export function fmtClock(sec) {
  const s = Math.max(0, Math.floor(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// The live game state. Every module reads and writes this one object.
export const G = {
  scene: null, camera: null, renderer: null,
  mode: 'menu', // menu | play | pause
  shot: null, shotName: null,
  tod: 'sunset',
  time: 0,
  keys: {},
  cash: CFG.startCash, rep: 0, jobsDone: 0, missionIndex: 0, // 0-based
  wanted: 0, wantedLabel: 'CLEAR',
  elapsed: 0, par: 60,
  hp: 100, fuel: 100, cond: 100,
  station: 0, muted: false, weapon: 0,
  player: { x: 2, z: 10, heading: 0, onFoot: true, group: null, gun: null },
  car: { x: 0, z: 0, heading: 0, speed: 0, steer: 0, group: null, inCar: false,
         brakeGlow: null, driftChain: 0, driftTimer: 0, driftEarned: 0, smoke: [] },
  marker: { x: 48, z: 0, mesh: null, beam: null },
  police: [], heli: null, heliState: { angle: 0, height: 26, radius: 30 },
  traffic: [], walkers: [], enemies: [], targetsDown: 0,
  buildings: [], roadblocks: [],
  ocean: null, sunDisc: null, wheel: null,
  popups: [], dialogue: null, driftPopupUntil: 0, flashUntil: 0,
  abilities: { rae: 0, sable: 0, marlo: 0 },
  paused: false, loopDone: false, startedAt: 0,
  shotFlash: false, testNote: '',
};
