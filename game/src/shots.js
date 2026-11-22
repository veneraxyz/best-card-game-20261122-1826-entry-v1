// shots.js — deterministic ?shot= states for screenshots and testing.
// Only used when the URL carries ?shot=title|play|win|loss (and ?seed=).
// Normal play (no query) starts at the title with a random seed.
// Every shot is reproducible: the same seed builds the same table.

import {
  createGame,
  startPlayerTurn,
  startAiTurn,
  playCard,
  addLog,
  dealDamage,
} from './game.js';

// A mid-game table that looks lived-in: round 3, both hands dealt, HP and
// shield already spent, a few cards played, log lines present.
export function buildPlayShot(seed) {
  const state = createGame(seed);
  state.screen = 'table';
  state.round = 3;

  // Round 1-2, played out quickly with the seeded deck: the player strikes,
  // Vex guards, both sides take hits — then we freeze at round 3.
  startPlayerTurn(state);
  const strikeIdx = state.player.hand.findIndex((c) => c.type === 'strike');
  if (strikeIdx >= 0) playCard(state, 'player', strikeIdx);
  const strike2 = state.player.hand.findIndex((c) => c.type === 'strike' && c.cost <= state.player.mana);
  if (strike2 >= 0) playCard(state, 'player', strike2);
  startAiTurn(state);
  const guardIdx = state.ai.hand.findIndex((c) => c.type === 'guard' || c.type === 'bulwark');
  if (guardIdx >= 0) playCard(state, 'ai', guardIdx);
  const aiStrike = state.ai.hand.findIndex((c) => c.type === 'strike' && c.cost <= state.ai.mana);
  if (aiStrike >= 0) playCard(state, 'ai', aiStrike);

  // Round 2: both sides trade blows.
  state.round = 2;
  startPlayerTurn(state);
  const s3 = state.player.hand.findIndex((c) => c.type === 'strike');
  if (s3 >= 0) playCard(state, 'player', s3);
  startAiTurn(state);
  const s4 = state.ai.hand.findIndex((c) => c.type === 'strike' || c.type === 'surge');
  if (s4 >= 0) playCard(state, 'ai', s4);

  // Round 3: fresh mana, full hand, table mid-duel.
  state.round = 3;
  startPlayerTurn(state);
  // Nudge the HP into the brief's lived-in range without faking the log:
  // the hits above already landed; top them up to the target window.
  if (state.player.hp > 24) dealDamage(state.player, state.player.hp - 24);
  if (state.ai.hp > 19) dealDamage(state.ai, state.ai.hp - 19);
  // Shields are set after the nudges so they show on the table.
  state.player.shield = 4;
  state.ai.shield = 2;
  state.player.mana = Math.min(state.player.mana, 4);
  addLog(state, 'Round 3 — the embers burn brighter now.');
  return state;
}

// An end screen with plausible stats.
export function buildEndShot(seed, won) {
  const state = createGame(seed);
  state.screen = won ? 'win' : 'loss';
  state.over = true;
  state.winner = won ? 'player' : 'ai';
  state.round = won ? 7 : 8;
  state.stats = { rounds: state.round, cardsPlayed: won ? 14 : 13, damageDealt: won ? 34 : 27 };
  if (won) {
    state.ai.hp = 0;
    state.player.hp = 11;
    state.player.shield = 3;
    addLog(state, 'You played Inferno Burst for 7 damage.');
    addLog(state, 'Vex falls — the duel is yours!');
  } else {
    state.player.hp = 0;
    state.ai.hp = 9;
    state.ai.shield = 5;
    addLog(state, 'Vex played Boulder Slam for 7 damage.');
    addLog(state, 'Vex keeps the embers… this time.');
  }
  return state;
}

// Build the state for a ?shot= query. Returns null for unknown shots.
export function buildShot(shot, seed) {
  if (shot === 'title') {
    const state = createGame(seed);
    state.screen = 'title';
    return state;
  }
  if (shot === 'play') return buildPlayShot(seed);
  if (shot === 'win') return buildEndShot(seed, true);
  if (shot === 'loss') return buildEndShot(seed, false);
  return null;
}
