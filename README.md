# Trophy Atlas — GTA VI guide, tracker and platinum roadmap

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy
with its official name, description and grade, a guide written in plain words, a checkpoint
checklist that saves in your browser, filters by grade / chapter / kind / status, a spoiler setting
for the hidden trophies, export and import of your progress, and a roadmap to the platinum that
counts each phase and flags the missable trophies.

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Teguhhardian12/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Teguhhardian12/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty — $250 in USDC shared
by the top 50 entries. The entry lives in the open at [make.fun](https://make.fun).

## Run it

```
node serve.ts                                          # serves app/ at http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts    # writes the dossier
node tools/shoot.mjs                                  # regenerates screenshots/
```

## What is in here

| Path | What it is |
|---|---|
| `app/` | the app: `index.html`, `app.js`, `style.css`, and `app/data/trophies.json` (the 55 trophies, grades, chapters and guides) |
| `screenshots/` | three captures (`1-checklist.jpg` is the cover) |
| `shots.json` | the screenshot recipes (`?shot=` scenes) |
| `tools/shoot.mjs` | headless-Chrome screenshot runner |
| `main.ts` | copies `app/` and `screenshots/` to the output and writes `dossier.json` |
| `vendor/` | make.fun's dossier library, unmodified |

Trophy names, descriptions and grades are the official PlayStation 5 list; the guides are written for
this entry. Licence: MIT (see `LICENSE`).
