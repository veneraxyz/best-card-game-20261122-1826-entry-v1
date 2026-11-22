// main.js — boot, screen switching and input wiring for EMBER DUEL.
// Loads the state machine (game.js), the renderer (render.js) and the
// synth (sound.js), then runs the duel: player turn, AI turn with a
// visible delay between Vex's plays, next round.

import {
  createGame,
  startDuel,
  startPlayerTurn,
  startAiTurn,
  playCard,
  aiChoosePlay,
} from './game.js';
import { render, showToast } from './render.js';
import { sfx, isMuted, toggleMute } from './sound.js';
import { buildShot } from './shots.js';

const BEST_KEY = 'ember-duel-best';
const AI_STEP_MS = 650;

function loadBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { wins: parsed.wins || 0, losses: parsed.losses || 0 };
    }
  } catch {
    // storage unavailable: best line just stays empty
  }
  return { wins: 0, losses: 0 };
}

function saveBest(best) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    // storage unavailable: best result is session-only
  }
}

function randomSeed() {
  return (Math.random() * 0x7fffffff) | 0;
}

function querySeed() {
  const params = new URLSearchParams(window.location.search);
  const raw = Number(params.get('seed'));
  return Number.isFinite(raw) && raw !== 0 ? raw >>> 0 : randomSeed();
}

let state = null;
let best = loadBest();
let aiTimer = null;
let endSoundPlayed = false;

function rerender() {
  render(state, best);
  updateMuteButton();
}

function updateMuteButton() {
  const btn = document.getElementById('btn-mute');
  if (btn) btn.textContent = isMuted() ? 'SOUND OFF (M)' : 'SOUND ON (M)';
}

function onGameOver() {
  if (state.winner === 'player') {
    best.wins += 1;
    sfx.win();
  } else {
    best.losses += 1;
    sfx.lose();
  }
  saveBest(best);
  endSoundPlayed = true;
  rerender();
}

function onPlayCard(index) {
  if (state.screen !== 'table' || state.turn !== 'player' || state.over) return;
  const card = state.player.hand[index];
  if (!card) return;
  const result = playCard(state, 'player', index);
  if (!result.ok) {
    sfx.deny();
    showToast('Not enough mana');
    return;
  }
  if (card.type === 'mend') sfx.heal();
  else if (card.type === 'guard' || card.type === 'bulwark') sfx.shield();
  else if (card.type === 'strike' || card.type === 'surge') sfx.hit();
  else sfx.play();
  if (state.over) {
    onGameOver();
    return;
  }
  rerender();
}

function onEndTurn() {
  if (state.screen !== 'table' || state.turn !== 'player' || state.over) return;
  sfx.click();
  runAiTurn();
}

// Vex plays one card per AI_STEP_MS so each play is visible in the log,
// then the round advances and the player draws again.
function runAiTurn() {
  startAiTurn(state);
  rerender();
  const step = () => {
    if (state.over) {
      onGameOver();
      return;
    }
    const index = aiChoosePlay(state);
    if (index < 0) {
      state.round += 1;
      startPlayerTurn(state);
      state.log.push(`Round ${state.round} — your turn.`);
      rerender();
      return;
    }
    const card = state.ai.hand[index];
    playCard(state, 'ai', index);
    if (card.type === 'mend') sfx.heal();
    else if (card.type === 'guard' || card.type === 'bulwark') sfx.shield();
    else sfx.hit();
    if (state.over) {
      onGameOver();
      return;
    }
    rerender();
    aiTimer = setTimeout(step, AI_STEP_MS);
  };
  aiTimer = setTimeout(step, AI_STEP_MS);
}

function onPlayAgain() {
  clearTimeout(aiTimer);
  endSoundPlayed = false;
  state = startDuel(state);
  rerender();
}

function onTitle() {
  clearTimeout(aiTimer);
  endSoundPlayed = false;
  state.screen = 'title';
  rerender();
}

function onPlay() {
  sfx.click();
  endSoundPlayed = false;
  state = startDuel(state);
  rerender();
}

function onKeyDown(event) {
  if (event.key === 'm' || event.key === 'M') {
    toggleMute();
    updateMuteButton();
    return;
  }
  if (state.screen === 'title') {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onPlay();
    }
    return;
  }
  if (state.screen === 'table') {
    if (event.key >= '1' && event.key <= '5') {
      onPlayCard(Number(event.key) - 1);
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onEndTurn();
    } else if (event.key === 'Escape') {
      onTitle();
    }
    return;
  }
  // win / loss screens
  if (event.key === 'r' || event.key === 'R') onPlayAgain();
  else if (event.key === 'Escape') onTitle();
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = querySeed();

  if (shot) {
    state = buildShot(shot, seed) || createGame(seed);
  } else {
    state = createGame(seed);
    state.screen = 'title';
  }
  // The end shots carry their own stats; a win/loss reached in real play
  // still needs its sound and best-record update.
  if ((state.screen === 'win' || state.screen === 'loss') && !endSoundPlayed) {
    endSoundPlayed = true;
  }

  document.getElementById('btn-play').addEventListener('click', onPlay);
  document.getElementById('btn-again').addEventListener('click', onPlayAgain);
  document.getElementById('btn-title').addEventListener('click', onTitle);
  document.getElementById('btn-end-turn').addEventListener('click', onEndTurn);
  document.getElementById('btn-mute').addEventListener('click', () => {
    toggleMute();
    updateMuteButton();
  });
  document.getElementById('player-hand').addEventListener('click', (event) => {
    const cardEl = event.target.closest('.card');
    if (cardEl) onPlayCard(Number(cardEl.dataset.index));
  });
  document.addEventListener('keydown', onKeyDown);

  rerender();

  // Test hook: the Playwright play-test reads live state through this.
  window.__ember = {
    get state() {
      return state;
    },
    playCard: onPlayCard,
    endTurn: onEndTurn,
    playAgain: onPlayAgain,
    toTitle: onTitle,
    start: onPlay,
  };
}

boot();
