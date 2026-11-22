# The Ember Reliquary — best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/baijorl21/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/baijorl21/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Bounty page: https://make.fun/c/best-heist-game-20261122-0559

A top-down stealth heist in the browser. You are the Ashfox, slipping into
the Ember Reliquary museum after hours to steal the Ember Heart, a gem kept
in a glass vault at the far end of the gallery. Three guards patrol the
floor with sweeping vision cones, two ceiling cameras watch the vault and
the east corridor, and every second you spend in a cone feeds the alarm
meter. Fill it and the night is over — so is being touched by a guard.

Cross the gallery however you like: the open floor is fast but exposed, the
west service corridor is dark and slow, and the crate stacks make islands
of cover in between. Grab the Ember Heart, then get back to the service
door you came in through. Two tools help, at a price: a noisemaker you
throw with the mouse pulls the nearest guard off patrol, and a shroud
cloak makes you invisible for a few seconds. Both shave points off your
final score, so a clean ghost run still pays best.

## Controls

- WASD or arrow keys — move (hold Shift to creep slowly and quietly)
- Mouse — aim the noisemaker throw; Q or right-click to throw it
- E — shroud cloak (brief invisibility, long cooldown)
- P or Esc — pause · R — restart the night

## Run it

```sh
node serve.ts          # then open http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # hand-in dry run
```

The game is plain static files under `game/` (vanilla JS + canvas, no
build step, no network). `main.ts` copies `game/` and `screenshots/` to
the output folder and writes `dossier.json` with the vendored make.fun
library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=r9wmade1&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
