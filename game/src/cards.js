// cards.js — the four original suits and the 30-card deck of EMBER DUEL.
// Suits are told apart by colour AND shape AND name, never by text alone.

// Suit glyphs are plain geometric shapes (no emoji font needed):
// Ember = triangle, Tide = circle, Leaf = diamond, Stone = square.
export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', color: '#ff6b35', dark: '#a83208', glow: '#ff9a3c' },
  tide: { name: 'Tide', glyph: '●', color: '#38b6ff', dark: '#0b5e8a', glow: '#7fd4ff' },
  leaf: { name: 'Leaf', glyph: '◆', color: '#4ade80', dark: '#166534', glow: '#86efac' },
  stone: { name: 'Stone', glyph: '■', color: '#c08a5e', dark: '#6b4a2f', glow: '#e0a878' },
};

// Card types and what they do:
//   strike   — deal value damage.
//   guard    — gain value shield.
//   mend     — heal value HP (never above 30).
//   surge    — deal value damage AND draw 1 card.
//   bulwark  — gain value shield AND deal half value damage (rounded down).
export const CARD_TYPES = {
  strike: { label: 'Strike', effect: (v) => `Deal ${v} damage.` },
  guard: { label: 'Guard', effect: (v) => `Gain ${v} shield.` },
  mend: { label: 'Mend', effect: (v) => `Heal ${v} HP.` },
  surge: { label: 'Surge', effect: (v) => `Deal ${v} damage. Draw 1 card.` },
  bulwark: { label: 'Bulwark', effect: (v) => `Gain ${v} shield. Deal ${Math.floor(v / 2)} damage.` },
};

// The deck, as data: [name, suit, type, cost, value]. Exactly 30 cards.
// Ember burns, Tide mends and surges, Leaf guards, Stone hits hard and holds.
const DECK_LIST = [
  ['Ember Spark', 'ember', 'strike', 1, 3],
  ['Ember Spark', 'ember', 'strike', 1, 3],
  ['Cinder Slash', 'ember', 'strike', 2, 5],
  ['Cinder Slash', 'ember', 'strike', 2, 5],
  ['Flame Lash', 'ember', 'strike', 2, 4],
  ['Inferno Burst', 'ember', 'strike', 3, 7],
  ['Wildfire', 'ember', 'strike', 3, 6],
  ['Tide Mend', 'tide', 'mend', 2, 5],
  ['Tide Mend', 'tide', 'mend', 2, 5],
  ['Tide Mend', 'tide', 'mend', 2, 5],
  ['Deep Mend', 'tide', 'mend', 3, 6],
  ['Tide Surge', 'tide', 'surge', 3, 4],
  ['Tide Surge', 'tide', 'surge', 3, 4],
  ['Riptide', 'tide', 'surge', 4, 5],
  ['Riptide', 'tide', 'surge', 4, 5],
  ['Leaf Guard', 'leaf', 'guard', 1, 4],
  ['Leaf Guard', 'leaf', 'guard', 1, 4],
  ['Thornwall', 'leaf', 'guard', 2, 6],
  ['Thornwall', 'leaf', 'guard', 2, 6],
  ['Canopy Guard', 'leaf', 'guard', 3, 8],
  ['Canopy Guard', 'leaf', 'guard', 3, 8],
  ['Briar Guard', 'leaf', 'guard', 2, 5],
  ['Stone Bulwark', 'stone', 'bulwark', 4, 8],
  ['Stone Bulwark', 'stone', 'bulwark', 4, 8],
  ['Granite Bulwark', 'stone', 'bulwark', 5, 10],
  ['Granite Bulwark', 'stone', 'bulwark', 5, 10],
  ['Stone Strike', 'stone', 'strike', 2, 5],
  ['Stone Strike', 'stone', 'strike', 2, 5],
  ['Boulder Slam', 'stone', 'strike', 3, 7],
  ['Boulder Slam', 'stone', 'strike', 3, 7],
];

let nextUid = 1;

// Build a fresh 30-card deck (new card objects, unique ids).
export function buildDeck() {
  return DECK_LIST.map(([name, suit, type, cost, value]) => ({
    uid: nextUid++,
    name,
    suit,
    type,
    cost,
    value,
  }));
}

// One-line effect text for a card, shown on its face.
export function effectText(card) {
  return CARD_TYPES[card.type].effect(card.value);
}

// The big centre number on a card face: damage, shield or heal amount.
export function cardValue(card) {
  return card.value;
}
