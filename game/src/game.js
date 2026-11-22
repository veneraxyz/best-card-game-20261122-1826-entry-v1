// game.js — the state machine, turn logic and Vex's AI for EMBER DUEL.
// Pure game rules live here: no DOM, no sound. The driver (main.js) calls
// these functions and re-renders after each step.

import { buildDeck } from './cards.js';
import { mulberry32, shuffle } from './rng.js';

export const MAX_HP = 30;
export const HAND_SIZE = 5;
export const MAX_MANA = 10;

// Mana for a round: 3 on round 1, +1 each round, capped at 10.
export function manaForRound(round) {
  return Math.min(MAX_MANA, 3 + (round - 1));
}

function makeFighter() {
  return {
    hp: MAX_HP,
    maxHp: MAX_HP,
    shield: 0,
    mana: 0,
    maxMana: 3,
    deck: [],
    hand: [],
    discard: [],
  };
}

// Create a fresh game. seed drives every shuffle and draw.
export function createGame(seed) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    rng,
    screen: 'title', // 'title' | 'table' | 'win' | 'loss'
    round: 1,
    turn: 'player', // 'player' | 'ai'
    player: makeFighter(),
    ai: makeFighter(),
    log: [],
    stats: { rounds: 0, cardsPlayed: 0, damageDealt: 0 },
    over: false,
    winner: null, // 'player' | 'ai'
  };
  state.player.deck = shuffle(buildDeck(), rng);
  state.ai.deck = shuffle(buildDeck(), rng);
  return state;
}

export function addLog(state, text) {
  state.log.push(text);
  if (state.log.length > 40) state.log.shift();
}

// Draw up to n cards into a fighter's hand. When the deck empties, the
// discard pile is shuffled back in. Hand stays at most HAND_SIZE cards;
// extra draws are skipped (the card is lost, as in a real duel).
export function drawCards(state, fighter, n) {
  for (let i = 0; i < n; i++) {
    if (fighter.hand.length >= HAND_SIZE) return;
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.deck = shuffle(fighter.discard, state.rng);
      fighter.discard = [];
    }
    fighter.hand.push(fighter.deck.pop());
  }
}

// Damage hits shield first, then HP. HP never drops below 0.
export function dealDamage(target, amount) {
  let left = amount;
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, left);
    target.shield -= absorbed;
    left -= absorbed;
  }
  target.hp = Math.max(0, target.hp - left);
  return amount;
}

// Start a player's turn: new round, full mana, draw up to a full hand.
export function startPlayerTurn(state) {
  state.turn = 'player';
  state.player.maxMana = manaForRound(state.round);
  state.player.mana = state.player.maxMana;
  drawCards(state, state.player, HAND_SIZE - state.player.hand.length);
}

// Start the AI's turn: full mana, draw up to a full hand.
export function startAiTurn(state) {
  state.turn = 'ai';
  state.ai.maxMana = manaForRound(state.round);
  state.ai.mana = state.ai.maxMana;
  drawCards(state, state.ai, HAND_SIZE - state.ai.hand.length);
}

// Can this fighter afford the card at hand index?
export function canPlay(fighter, index) {
  const card = fighter.hand[index];
  return card !== undefined && fighter.mana >= card.cost;
}

// Play the card at hand index for `who` ('player' | 'ai').
// Returns { ok: true } or { ok: false, reason: 'mana' }.
export function playCard(state, who, index) {
  const me = who === 'player' ? state.player : state.ai;
  const foe = who === 'player' ? state.ai : state.player;
  const card = me.hand[index];
  if (!card) return { ok: false, reason: 'empty' };
  if (me.mana < card.cost) return { ok: false, reason: 'mana' };

  me.mana -= card.cost;
  me.hand.splice(index, 1);
  me.discard.push(card);

  const whoName = who === 'player' ? 'You' : 'Vex';
  if (card.type === 'strike') {
    dealDamage(foe, card.value);
    addLog(state, `${whoName} played ${card.name} for ${card.value} damage.`);
    if (who === 'player') state.stats.damageDealt += card.value;
  } else if (card.type === 'guard') {
    me.shield += card.value;
    addLog(state, `${whoName} gained ${card.value} shield.`);
  } else if (card.type === 'mend') {
    const healed = Math.min(card.value, me.maxHp - me.hp);
    me.hp += healed;
    addLog(state, `${whoName} healed ${healed} HP.`);
  } else if (card.type === 'surge') {
    dealDamage(foe, card.value);
    drawCards(state, me, 1);
    addLog(state, `${whoName} played ${card.name} for ${card.value} damage and drew a card.`);
    if (who === 'player') state.stats.damageDealt += card.value;
  } else if (card.type === 'bulwark') {
    me.shield += card.value;
    const dmg = Math.floor(card.value / 2);
    dealDamage(foe, dmg);
    addLog(state, `${whoName} gained ${card.value} shield and dealt ${dmg} damage.`);
    if (who === 'player') state.stats.damageDealt += dmg;
  }

  if (who === 'player') state.stats.cardsPlayed += 1;
  checkEnd(state);
  return { ok: true };
}

// End the game immediately when either fighter hits 0 HP.
export function checkEnd(state) {
  if (state.over) return;
  if (state.ai.hp <= 0) {
    state.over = true;
    state.winner = 'player';
    state.screen = 'win';
    state.stats.rounds = state.round;
  } else if (state.player.hp <= 0) {
    state.over = true;
    state.winner = 'ai';
    state.screen = 'loss';
    state.stats.rounds = state.round;
  }
}

// --- Vex, the Cinder Warden: simple greedy AI ---------------------------
// Reads its own hand and picks one card to play, or -1 to pass:
//   1. Heal when hurt (hp <= 12) if a Mend is affordable.
//   2. Guard when exposed (shield 0 and hp < 20) if a Guard/Bulwark is affordable.
//   3. Otherwise the affordable damage card with the biggest value.
//   4. Nothing affordable: pass.
export function aiChoosePlay(state) {
  const ai = state.ai;
  const affordable = ai.hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => card.cost <= ai.mana);
  if (affordable.length === 0) return -1;

  if (ai.hp <= 10) {
    const mend = affordable.find(({ card }) => card.type === 'mend');
    if (mend) return mend.i;
  }
  if (ai.shield === 0 && ai.hp < 15) {
    const guard = affordable
      .filter(({ card }) => card.type === 'guard' || card.type === 'bulwark')
      .sort((a, b) => b.card.value - a.card.value)[0];
    if (guard) return guard.i;
  }
  const damage = affordable
    .filter(({ card }) => card.type === 'strike' || card.type === 'surge' || card.type === 'bulwark')
    .sort((a, b) => b.card.value - a.card.value)[0];
  if (damage) return damage.i;
  // No damage in hand: play the cheapest thing affordable (a guard or mend).
  return affordable.sort((a, b) => a.card.cost - b.card.cost)[0].i;
}

// Begin a new duel from the title screen.
export function startDuel(state) {
  const fresh = createGame(state.seed);
  fresh.screen = 'table';
  startPlayerTurn(fresh);
  addLog(fresh, 'The duel begins. You go first — spend your mana well.');
  return fresh;
}
