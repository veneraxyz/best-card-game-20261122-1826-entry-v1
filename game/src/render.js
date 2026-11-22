// render.js — DOM rendering of EMBER DUEL: title, table, hands, bars, log.
// Builds plain DOM elements (no canvas): cards stay crisp and legible at
// thumbnail size, and every value is real text.

import { SUITS, effectText } from './cards.js';

const $ = (id) => document.getElementById(id);

function showScreen(name) {
  for (const id of ['screen-title', 'screen-table', 'screen-end']) {
    $(id).classList.toggle('hidden', id !== `screen-${name}`);
  }
}

// --- cards ---------------------------------------------------------------

function cardElement(card, index, playable) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `card suit-${card.suit}${playable ? '' : ' unaffordable'}`;
  el.dataset.index = String(index);
  el.style.setProperty('--suit', suit.color);
  el.style.setProperty('--suit-dark', suit.dark);
  el.style.setProperty('--suit-glow', suit.glow);
  el.style.animationDelay = `${index * 60}ms`;
  el.innerHTML =
    `<div class="card-cost">${card.cost}</div>` +
    `<div class="card-glyph">${suit.glyph}</div>` +
    `<div class="card-value">${card.value}</div>` +
    `<div class="card-name">${card.name}</div>` +
    `<div class="card-suit">${suit.name} · ${card.type}</div>` +
    `<div class="card-effect">${effectText(card)}</div>` +
    `<div class="card-key">${index + 1}</div>`;
  return el;
}

function cardBackElement(index) {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.style.animationDelay = `${index * 40}ms`;
  el.innerHTML = '<div class="card-back-glyph">▲</div><div class="card-back-name">VEX</div>';
  return el;
}

// --- bars, mana, log -----------------------------------------------------

function renderHpBar(fillEl, textEl, shieldEl, fighter) {
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  fillEl.style.width = `${pct}%`;
  textEl.textContent = `${fighter.hp} / ${fighter.maxHp}`;
  if (fighter.shield > 0) {
    shieldEl.textContent = `SHIELD ${fighter.shield}`;
    shieldEl.classList.remove('hidden');
  } else {
    shieldEl.classList.add('hidden');
  }
}

function renderMana(rowEl, fighter) {
  rowEl.innerHTML = '';
  for (let i = 0; i < fighter.maxMana; i++) {
    const gem = document.createElement('span');
    gem.className = `mana-gem${i < fighter.mana ? ' filled' : ''}`;
    gem.textContent = '◆';
    rowEl.appendChild(gem);
  }
  const label = document.createElement('span');
  label.className = 'mana-label';
  label.textContent = `${fighter.mana}/${fighter.maxMana} mana`;
  rowEl.appendChild(label);
}

function renderLog(state) {
  const logEl = $('battle-log');
  logEl.innerHTML = '';
  for (const line of state.log.slice(-4)) {
    const p = document.createElement('p');
    p.textContent = line;
    logEl.appendChild(p);
  }
  logEl.scrollTop = logEl.scrollHeight;
}

// --- screens -------------------------------------------------------------

function renderTitle(state, best) {
  showScreen('title');
  const wins = best.wins || 0;
  const losses = best.losses || 0;
  $('best-line').textContent =
    wins + losses > 0
      ? `Best result — ${wins} win${wins === 1 ? '' : 's'} · ${losses} loss${losses === 1 ? '' : 'es'}`
      : 'No duels yet — your first ember awaits.';
}

function renderTable(state) {
  showScreen('table');
  $('round-num').textContent = String(state.round);

  // Vex's hand: face-down card backs, count shown.
  const aiHand = $('ai-hand');
  aiHand.innerHTML = '';
  state.ai.hand.forEach((_, i) => aiHand.appendChild(cardBackElement(i)));
  $('ai-hand-count').textContent = `${state.ai.hand.length} cards`;

  renderHpBar($('ai-hp-fill'), $('ai-hp-text'), $('ai-shield'), state.ai);
  renderMana($('ai-mana'), state.ai);
  $('ai-deck').textContent = String(state.ai.deck.length);

  // Player's hand: face-up, playable cards bright, unaffordable dimmed.
  const hand = $('player-hand');
  hand.innerHTML = '';
  state.player.hand.forEach((card, i) => {
    hand.appendChild(cardElement(card, i, state.player.mana >= card.cost));
  });

  renderHpBar($('player-hp-fill'), $('player-hp-text'), $('player-shield'), state.player);
  renderMana($('player-mana'), state.player);
  $('player-deck').textContent = String(state.player.deck.length);
  $('player-discard').textContent = String(state.player.discard.length);

  const endBtn = $('btn-end-turn');
  endBtn.disabled = state.turn !== 'player' || state.over;
  endBtn.textContent = state.turn === 'player' ? 'END TURN  (Space)' : "VEX'S TURN…";

  renderLog(state);
}

function renderEnd(state) {
  showScreen('end');
  const won = state.winner === 'player';
  $('end-title').textContent = won ? 'VICTORY' : 'DEFEAT';
  $('end-title').className = `end-title ${won ? 'win' : 'loss'}`;
  $('end-emblem').textContent = won ? '★' : '✖';
  $('end-emblem').className = `end-emblem ${won ? 'win' : 'loss'}`;
  $('end-sub').textContent = won
    ? 'The cinders are yours. Vex bows to the new Ember Champion.'
    : 'Vex keeps the embers… this time. Stoke the fire and duel again.';
  $('end-stats').innerHTML =
    `<div><span>${state.stats.rounds}</span> rounds</div>` +
    `<div><span>${state.stats.cardsPlayed}</span> cards played</div>` +
    `<div><span>${state.stats.damageDealt}</span> damage dealt</div>`;
}

// Render whatever screen the state is on.
export function render(state, best) {
  if (state.screen === 'title') renderTitle(state, best);
  else if (state.screen === 'table') renderTable(state);
  else renderEnd(state);
}

// A short floating note ("Not enough mana") with a shake on the hand.
export function showToast(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.classList.remove('hidden');
  const hand = $('player-hand');
  hand.classList.remove('shake');
  void hand.offsetWidth; // restart the shake animation
  hand.classList.add('shake');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 1400);
}
