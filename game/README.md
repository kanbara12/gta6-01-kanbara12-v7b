# SUNCOAST: HEATLINE source outline

A Three.js 0.160.0 open-world crime game in plain static files. Open `index.html` from any static server; it loads nothing from the network.

## Source outline

- `src/core/config.js`: shared state, the eight-contract economy, the screenshot staging table, crew lines, radio stations, weapons, police callsigns
- `src/core/input.js`: keyboard and mouse, one held-key state for driving, walking and shooting
- `src/core/render.js`: renderer, gradient sky dome with sun disc and glow, soft clouds, sunset and night light
- `src/core/main.js`: boot, the main loop, the chase camera, entering and leaving the car, pause, abilities
- `src/world/city.js`: ground, roads, ocean and beach, 190-plus buildings, palms, boardwalk kiosks, ferris wheel, pier, lighthouse, marina, industrial yard, garage, safehouse, mission marker
- `src/world/textures.js`: procedural canvas textures: lit windows, road, sand, water, kiosk signs
- `src/vehicles/hero.js`: the HEATLINE GT coupe and arcade driving with drift payouts and building collision
- `src/vehicles/traffic.js`: eighteen traffic cars on the beach road, avenue and cross streets, plus the police cruiser
- `src/vehicles/heli.js`: SKY-1 with spinning rotors, spotlight cone and light pool
- `src/ai/police.js`: pursuit with ramming, flanking and roadblocks, building avoidance, line-of-sight SEARCH, the named panel rows
- `src/ai/walkers.js`: twenty pedestrians with a walking gait who scatter from speeding cars and gunfire
- `src/combat/fight.js`: the player figure, visible pistol and muzzle flash, three yard enemies with health bars, bounties
- `src/missions/story.js`: the eight contracts, marker payouts, street stashes, garage repaint, safehouse heal
- `src/ui/hud.js`: mission and money panels, named police panel, radio and weapons, speedometer, round minimap, dialogue, popups, pause menu
- `src/ui/shots.js`: the five `?shot=` scenes, staged from one table so job, cash, REP, jobs done, wanted, timer and speed always agree
- `src/audio/sound.js`: synthesised engine, three radio stations, shot and pickup effects
- `src/save/store.js`: localStorage save and load from the pause menu

## Economy

Eight contracts pay $19,750. Start cash is $1,250 and the yard pays $450 in bounties, so the loop closes at $22,450. The pause menu shows the same total, and so does the end scene.

## Screenshots

Four submitted frames, all genuine gameplay at 1280x720 with seed 1:

1. `1-start.jpg`, `?shot=start`, wide establishing shot, JOB 1/8, $1,250, 0:47 / PAR 1:00, 128 km/h
2. `2-play.jpg`, `?shot=play`, low close beach-road chase, JOB 2/8, $3,750, 1:12 / PAR 1:30, 141 km/h, Rae on the radio
3. `3-chase.jpg`, `?shot=chase`, night downtown pursuit under SKY-1, JOB 5/8, $13,200, 2:09 / PAR 2:30, 152 km/h, wanted 3, drift popup
4. `4-mission.jpg`, `?shot=mission`, on-foot yard sweep, JOB 4/8, $9,550, 2:32 / PAR 3:00, TARGETS 2/3, Marlo on the radio

The fifth scene, `?shot=end`, closes the loop at the lighthouse with $22,450, REP 10 and 8 jobs done. It is prepared in the game and noted here because the kit caps `screenshots/` at four files.

## Third-party code

Three.js 0.160.0, MIT license, vendored at `game/vendor/three.module.min.js` with its license at `game/vendor/LICENSE-threejs.txt`. See `THIRD-PARTY-NOTICES.md`.
