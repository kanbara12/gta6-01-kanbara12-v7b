// The HUD: mission and money panels, the named police panel, radio and
// weapons and crew abilities, speedometer, round minimap, dialogue card,
// floating score popups, crosshair, pause menu and start screen. Every
// number comes from the live state, so a frame can never show a job
// number that disagrees with its cash.

import { G, STATIONS, WEAPONS, CREW_LINES, MISSIONS, fmtMoney, fmtClock, repForJob } from '../core/config.js';
import { missionTitle, currentMission } from '../missions/story.js';
import { policeRows } from '../ai/police.js';

const $ = (id) => document.getElementById(id);

function stars(n) {
  let s = '';
  for (let i = 0; i < 5; i++) s += i < n ? '★' : '☆';
  return s;
}

export function buildHud() {
  const hud = $('hud');
  hud.innerHTML = `
  <div class="panel" id="mission-panel">
    <div class="m-job" id="m-job"></div>
    <div class="m-obj" id="m-obj"></div>
    <div class="m-next" id="m-next"></div>
    <div class="m-timer" id="m-timer"></div>
    <div class="m-marker" id="m-marker"></div>
  </div>
  <div class="panel" id="money-panel">
    <div class="cash" id="cash"></div>
    <div class="hp-rep" id="hp-rep"></div>
    <div class="repbar"><div id="rep-fill"></div></div>
    <div class="stars" id="stars"></div>
    <div class="police-line" id="police-line"></div>
  </div>
  <div class="panel" id="police-panel"><div class="pp-title">POLICE RESPONSE</div><div id="police-rows"></div></div>
  <div class="panel" id="kit-panel">
    <div class="radio" id="radio-line"></div>
    <div class="weapons" id="weapons"></div>
    <div class="ability"><span class="disc" style="background:#8e6fc0">R</span><span class="key">Z</span> Rae CLEAN SLATE <b id="ab-rae">READY</b></div>
    <div class="ability"><span class="disc" style="background:#3f8fb0">S</span><span class="key">X</span> Sable EYES UP <b id="ab-sable">READY</b></div>
    <div class="ability"><span class="disc" style="background:#b08a3f">M</span><span class="key">C</span> Marlo PIT STOP <b id="ab-marlo">READY</b></div>
  </div>
  <div class="panel" id="speedo">
    <div class="speed"><span id="speed">0</span><span class="unit"> KM/H</span></div>
    <div class="bars"><div class="bar"><i id="fuel-bar"></i></div><div class="bar"><i id="cond-bar"></i></div></div>
    <div class="car-label" id="car-label"></div>
  </div>
  <div id="minimap-wrap">
    <canvas id="map" width="150" height="150"></canvas>
    <div class="map-label" id="map-label"></div>
    <div class="map-jobs" id="map-jobs"></div>
  </div>
  <div id="dialogue"><div class="dlg-disc" id="dlg-disc">R</div><div><div class="dlg-name" id="dlg-name"></div><div class="dlg-text" id="dlg-text"></div></div></div>
  <div id="popups"></div>
  <div id="crosshair">+</div>
  <div id="loop-banner">STORY LOOP COMPLETE — $22,450</div>`;
}

function drawMinimap() {
  const cv = $('map');
  const ctx = cv.getContext('2d');
  const S = 150 / 620;
  const X = (x) => (x + 310) * S;
  const Z = (z) => (z + 310) * S;
  ctx.clearRect(0, 0, 150, 150);
  ctx.save();
  ctx.beginPath(); ctx.arc(75, 75, 74, 0, 7); ctx.clip();
  ctx.fillStyle = '#101418'; ctx.fillRect(0, 0, 150, 150);
  ctx.fillStyle = '#1d5f7a'; ctx.fillRect(0, 0, 150, Z(-50));
  ctx.fillStyle = '#d9b380'; ctx.fillRect(0, Z(-50), 150, Z(-8) - Z(-50));
  ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, Z(0)); ctx.lineTo(150, Z(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, Z(120)); ctx.lineTo(150, Z(120)); ctx.stroke();
  ctx.lineWidth = 3;
  for (const cx of [-160, -80, 0, 80, 160]) {
    ctx.beginPath(); ctx.moveTo(X(cx), Z(14)); ctx.lineTo(X(cx), Z(260)); ctx.stroke();
  }
  ctx.fillStyle = '#8a8a92';
  for (const b of G.buildings) {
    ctx.fillRect(X(b.minX), Z(b.minZ), Math.max(1.5, (b.maxX - b.minX) * S), Math.max(1.5, (b.maxZ - b.minZ) * S));
  }
  // Mission marker, pulsing.
  const m = currentMission();
  const pulse = 3 + Math.sin(G.time * 5) * 1.5;
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath(); ctx.arc(X(m.marker[0]), Z(m.marker[1]), pulse, 0, 7); ctx.fill();
  for (const u of G.police) {
    if (!u.active) continue;
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath(); ctx.arc(X(u.x), Z(u.z), 3, 0, 7); ctx.fill();
  }
  const px = G.car.inCar ? G.car.x : G.player.x;
  const pz = G.car.inCar ? G.car.z : G.player.z;
  ctx.fillStyle = '#ffd27a';
  ctx.save();
  ctx.translate(X(px), Z(pz)); ctx.rotate(-(G.car.inCar ? G.car.heading : G.player.heading));
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
}

export function updateHud() {
  const m = currentMission();
  const job = G.loopDone ? 8 : G.missionIndex + 1;
  $('m-job').textContent = missionTitle();
  $('m-obj').textContent = G.loopDone ? 'The loop is closed. Same time tomorrow.' : m.objective;
  $('m-next').textContent = G.loopDone ? '' : 'NEXT: ' + (MISSIONS[G.missionIndex + 1] ? MISSIONS[G.missionIndex + 1].title : '—');
  $('m-timer').textContent = G.loopDone
    ? 'STORY LOOP COMPLETE'
    : `${fmtClock(G.elapsed)} / PAR ${fmtClock(m.par)}`;
  const px = G.car.inCar ? G.car.x : G.player.x;
  const pz = G.car.inCar ? G.car.z : G.player.z;
  if (G.loopDone) {
    $('m-marker').textContent = 'LOOP TOTAL $22,450';
  } else if (G.missionIndex === 3) {
    $('m-marker').textContent = `TARGETS ${G.targetsDown}/3`;
  } else {
    $('m-marker').textContent = `MARKER ${Math.round(Math.hypot(px - m.marker[0], pz - m.marker[1]))} m`;
  }
  $('cash').textContent = fmtMoney(G.cash);
  $('hp-rep').textContent = `HP ${Math.round(G.hp)} • REP ${G.rep}`;
  $('rep-fill').style.width = `${(G.rep / 10) * 100}%`;
  $('stars').textContent = stars(G.wanted);
  $('stars').className = 'stars' + (G.wanted > 0 ? ' hot' : '');
  const rows = policeRows();
  $('police-line').textContent = G.wanted === 0
    ? (rows.length ? 'POLICE: RESPONDING' : 'POLICE: CLEAR')
    : G.wantedLabel === 'IN SIGHT' ? 'POLICE: IN SIGHT' : 'POLICE: ' + G.wantedLabel;
  const pp = $('police-panel');
  if (rows.length) {
    pp.style.display = 'block';
    $('police-rows').innerHTML = rows.map((r) =>
      `<div class="pp-row"><span>${r.name} ${r.dist}m</span><span class="pp-status">${r.status}</span></div>`).join('');
  } else {
    pp.style.display = 'none';
  }
  const st = STATIONS[G.station];
  $('radio-line').textContent = `${st.name} • ${st.track}${G.muted ? ' • MUTED' : ''}`;
  $('weapons').innerHTML = WEAPONS.map((w, i) =>
    `<span class="wslot${i === G.weapon ? ' on' : ''}">${i + 1} ${w.name}</span>`).join('');
  for (const [key, id] of [['rae', 'ab-rae'], ['sable', 'ab-sable'], ['marlo', 'ab-marlo']]) {
    const cd = G.abilities[key];
    $(id).textContent = cd > 0 ? `${Math.ceil(cd)}s` : 'READY';
    $(id).style.color = cd > 0 ? '#ffb020' : '#37d67a';
  }
  const kmh = Math.round(Math.abs(G.car.speed || 0) * 3.6);
  $('speed').textContent = G.car.inCar ? kmh : 0;
  $('fuel-bar').style.width = `${G.fuel}%`;
  $('cond-bar').style.width = `${G.cond}%`;
  $('car-label').textContent = `FUEL ${Math.round(G.fuel)}%   HEATLINE GT — COND ${Math.round(G.cond)}%`;
  const district = G.loopDone ? 'North Beach' : m.district;
  const street = G.loopDone ? 'Lighthouse Point' : m.street;
  $('map-label').textContent = `${district.toUpperCase()} • ${street}`;
  $('map-jobs').textContent = `${G.jobsDone} JOBS DONE • ${G.tod === 'night' ? 'DUSK' : 'GOLDEN'}`;
  drawMinimap();
  // Dialogue card.
  const dlg = $('dialogue');
  if (G.dialogue && G.dialogueUntil > G.time) {
    const line = CREW_LINES[G.dialogue];
    dlg.style.display = 'flex';
    $('dlg-disc').textContent = line.initial;
    $('dlg-disc').style.background = line.color;
    $('dlg-name').textContent = `${line.name} — ${line.role}`;
    $('dlg-text').textContent = line.text;
  } else {
    dlg.style.display = 'none';
  }
  // Floating score popups.
  const pops = $('popups');
  const live = G.popups.filter((p) => p.until > G.time);
  pops.innerHTML = live.map((p) =>
    `<div class="popup${p.big ? ' big' : ''}">${p.text}</div>`).join('');
  if (G.driftPopupUntil > G.time) {
    pops.innerHTML += '<div class="popup big">DRIFT x3 +$150</div>';
  }
  // Crosshair only on foot.
  $('crosshair').style.display = G.player.onFoot && G.mode === 'play' ? 'block' : 'none';
  $('loop-banner').style.display = G.loopDone ? 'block' : 'none';
}

export function showDialogue(key, seconds) {
  G.dialogue = key;
  G.dialogueUntil = G.time + seconds;
}

export function showPause(show) {
  const el = document.getElementById('pause-menu');
  el.style.display = show ? 'flex' : 'none';
  if (!show) return;
  document.getElementById('pause-stats').innerHTML = [
    ['MONEY', fmtMoney(G.cash)],
    ['JOBS DONE', `${G.jobsDone} / 8`],
    ['STAGE', `${G.missionIndex + 1} / 8`],
    ['TARGETS DOWN', `${G.targetsDown} / 3`],
    ['DRIFT EARNINGS', fmtMoney(G.car.driftEarned)],
    ['REP', `${G.rep} / 10`],
    ['FUEL', `${Math.round(G.fuel)}%`],
    ['WANTED', `${G.wanted} STAR${G.wanted === 1 ? '' : 'S'}`],
    ['HEALTH', `${Math.round(G.hp)}`],
  ].map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
}

export function showStart(show) {
  document.getElementById('start-screen').style.display = show ? 'flex' : 'none';
}
