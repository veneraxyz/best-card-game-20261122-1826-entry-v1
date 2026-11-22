[![best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/veneraxyz/best-card-game-20261122-1826-entry-v1/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/veneraxyz/best-card-game-20261122-1826-entry-v1/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# EMBER DUEL

**EMBER DUEL** is an original turn-based card battler: you vs the AI rival **Vex, the Cinder Warden**. Both duelists start at 30 HP — first to reduce the other to 0 wins. Each turn refills your mana (3 on round 1, +1 every round, capped at 10) and draws your hand up to 5 cards from a 30-card deck of four original suits: **Ember** (red triangle, damage), **Tide** (blue circle, healing and card draw), **Leaf** (green diamond, shields) and **Stone** (brown square, heavy damage and shields). Strikes, Guards, Mends, Surges and Bulwarks combine in more than one way — shield up before a big swing, surge to dig for the finisher — while Vex plays greedy and readable: he heals when hurt, guards when exposed, and swings hard when he smells blood. A scrolling battle log narrates every play, and your best result (wins/losses) is remembered between sessions.

## How to play

- **Mouse:** click a card to play it, click END TURN when done.
- **Keyboard:** `1–5` play the card in that hand slot · `Space` / `Enter` ends your turn (also starts the game from the title) · `R` restarts after a win or loss · `M` mutes/unmutes · `Esc` returns to the title.
- **Sound:** WebAudio-synthesised blips only (click, play, hit, heal, win/lose jingle) — no audio files, no network. Mute is persisted.
- A card you cannot afford does nothing except a shake and a "Not enough mana" note. HP never drops below 0 and shields never go negative.

## Run locally

```sh
node serve.ts
```

Then open http://localhost:8080 — the game is plain static files under `game/`, no build step, zero network requests.

## File layout

```
best-card-game-20261122-1826-entry-v1/
  LICENSE
  README.md
  main.ts            (copies game/ + screenshots/ to /output, writes dossier.json)
  serve.ts           (static server for game/ on localhost:8080)
  vendor/makefun-game.ts   (kit copy, unchanged)
  game/
    index.html       (loads style.css + src/main.js)
    style.css
    src/main.js      (boot, screen switching, input wiring, ?shot= handling)
    src/rng.js       (mulberry32 seeded RNG + shuffle)
    src/cards.js     (suit defs, card list, 30-card deck builder)
    src/game.js      (state machine, turn logic, Vex's AI)
    src/render.js    (DOM rendering of table, hands, bars, log)
    src/sound.js     (WebAudio synth)
    src/shots.js     (deterministic ?shot= states for screenshots)
  screenshots/
    1-title.jpg  2-play.jpg  3-win.jpg  4-loss.jpg
  shots.json         (screenshot list + the ?shot= query for each)
```

Screenshot states are reproducible: `?shot=title&seed=1`, `?shot=play&seed=1`, `?shot=win&seed=1`, `?shot=loss&seed=1`.
