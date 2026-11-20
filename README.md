[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Three.js 0.160.0](https://img.shields.io/badge/Three.js-0.160.0-blue.svg)](game/vendor/LICENSE-threejs.txt)
[![make.fun gta6-01](https://img.shields.io/badge/make.fun-gta6--01-orange.svg)](https://make.fun)

# SUNCOAST: HEATLINE

An open-world crime game for the make.fun gta6-01 bounty, built with Three.js 0.160.0 and plain static files. No build step, no network request while playing: every texture is drawn on canvas at runtime, every sound is synthesised live with WebAudio, and the only library is Three.js vendored under `game/vendor/`.

## The game

You drive the HEATLINE GT along the Suncoast beachfront, work eight contracts for fixer Rae, and close the loop at the lighthouse. The city has 190-plus buildings, a boardwalk with kiosks, a turning ferris wheel, a pier, a marina, an industrial yard, a garage and a safehouse. Eighteen traffic cars loop the avenues, twenty walkers use the sidewalks, and the police answer with named units, roadblocks and the SKY-1 helicopter when the heat rises.

The eight jobs pay $19,750 in story money. With the $1,250 you start with and $450 in yard bounties, the loop closes at exactly $22,450.

| Job | Contract | Pay | Cash after |
| --- | --- | --- | --- |
| 1 | A FAVOR IN THE HEAT | $2,500 | $3,750 |
| 2 | LOOSE CARGO | $2,500 | $6,250 |
| 3 | THE QUIET EXIT | $3,000 | $9,250 |
| 4 | STREET SWEEP | $3,500 + $450 bounties | $13,200 |
| 5 | NO WITNESSES | $4,250 | $17,450 |
| 6 | LAST LIGHT | $2,000 | $19,450 |
| 7 | THE MARINA SWAP | $1,500 | $20,950 |
| 8 | NORTH LIGHT | $1,500 | $22,450 |

## How to play

Serve the game and open it in desktop Chrome:

```
node serve.ts
```

then open http://localhost:8080. WASD drives and walks, E enters or leaves the car, mouse or Space shoots, 1-4 switch weapons, Z / X / C call the crew, R changes radio station, M mutes, P pauses, H hides the HUD.

The HUD shows the mission panel with a live timer and marker distance, cash, HP and REP, wanted stars, a named police panel with live distances, the radio and weapon slots, crew abilities, a speedometer with fuel and condition, and a round minimap with the district, street and jobs done.

## Screenshots

The four shots in `screenshots/` are genuine gameplay frames, each staged from the same table the game runs on:

1. `1-start.jpg`, wide establishing shot over the beachfront, JOB 1/8, $1,250
2. `2-play.jpg`, low close chase on the beach road at 141 km/h, JOB 2/8, $3,750
3. `3-chase.jpg`, night downtown pursuit under SKY-1, JOB 5/8, $13,200
4. `4-mission.jpg`, on-foot yard sweep, JOB 4/8, $9,550

A fifth scene, the loop closing at the lighthouse with $22,450, is prepared in the game as `?shot=end&seed=1` and noted here because the kit caps `screenshots/` at four files.

## Layout

- `game/index.html`: page, import map, HUD markup and styling
- `game/src/core/`: shared state and economy, input, renderer and sky, boot and main loop
- `game/src/world/`: the city, procedural textures
- `game/src/vehicles/`: hero car and driving, traffic, helicopter
- `game/src/ai/`: police pursuit, pedestrians
- `game/src/combat/`: on-foot combat and yard enemies
- `game/src/characters/`: the player figure and crew are built in `combat/fight.js` and named in `core/config.js`
- `game/src/missions/`: the eight-contract story loop
- `game/src/ui/`: HUD, minimap and screenshot staging
- `game/src/audio/`: synthesised sound and radio
- `game/src/save/`: localStorage save and load
- `game/vendor/`: Three.js 0.160.0, MIT, see `game/THIRD-PARTY-NOTICES.md`

## License

MIT. See `LICENSE`.
