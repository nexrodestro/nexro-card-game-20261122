// Ember Court — the duel state machine: rounds, ember, life, block,
// same-suit Surge combos, and the win/loss conditions.
// One duel: two 20-life duelists, a hand of 5, draw 1 per round, ember
// grows +1 per round (cap 10) and unspent ember carries over (cap 10).
import { Deck } from './deck.js';
import { SUITS, surgeLine } from './cards.js';

export const START_LIFE = 20;
export const HAND_SIZE = 5;
export const MAX_EMBER = 10;

/** The other side of a duel. */
export function other(side) {
  return side === 'you' ? 'warden' : 'you';
}

/** One duelist's mutable state. */
function newFighter(seed) {
  return {
    life: START_LIFE,
    block: 0,
    ember: 1,
    hand: [],
    deck: new Deck(seed),
    playedSuits: {},
    surgeReady: false,
    surgedSuits: {},
    damageDealt: 0,
    roundsWon: 0,
  };
}

export class Duel {
  constructor(seed = 1) {
    this.seed = seed;
    this.you = newFighter(seed);
    this.warden = newFighter(seed + 101);
    this.round = 1;
    this.phase = 'title';
    this.over = false;
    this.winner = null;
    this.log = [];
    this.lastSurge = null;
    this.lastEvents = [];
    this.you.hand = this.you.deck.draw(HAND_SIZE);
    this.warden.hand = this.warden.deck.draw(HAND_SIZE);
  }

  fighter(side) {
    return side === 'you' ? this.you : this.warden;
  }

  get score() {
    return this.you.damageDealt + this.you.roundsWon * 10;
  }

  /** Ember gained at the start of a round: the round number, capped at 10. */
  emberGain() {
    return Math.min(MAX_EMBER, this.round);
  }

  /** Start a round: clear block, grow ember, draw 1, reset suit tracking. */
  startRound() {
    for (const side of ['you', 'warden']) {
      const f = this.fighter(side);
      f.block = 0;
      f.ember = Math.min(MAX_EMBER, f.ember + this.emberGain());
      f.playedSuits = {};
      f.surgedSuits = {};
      f.surgeReady = false;
      f.hand.push(...f.deck.draw(1));
    }
    this.lastSurge = null;
    this.lastEvents = [];
    this.log.push(`Round ${this.round} begins.`);
  }

  /** Damage after block; returns the life actually lost. */
  applyDamage(side, amount) {
    const f = this.fighter(side);
    const absorbed = Math.min(f.block, amount);
    f.block -= absorbed;
    const hurt = amount - absorbed;
    f.life = Math.max(0, f.life - hurt);
    return hurt;
  }

  heal(side, amount) {
    const f = this.fighter(side);
    f.life = Math.min(START_LIFE, f.life + amount);
  }

  /** Play the card at handIndex for a side. Returns the events it caused. */
  playCard(side, handIndex) {
    const f = this.fighter(side);
    const foe = this.fighter(other(side));
    const events = [];
    if (this.over || this.phase !== 'table') return events;
    if (handIndex < 0 || handIndex >= f.hand.length) return events;
    const card = f.hand[handIndex];
    if (card.cost > f.ember) return events;
    f.ember -= card.cost;
    f.hand.splice(handIndex, 1);
    f.deck.discardCard(card);

    let mult = 1;
    if (f.surgeReady && card.type !== 'surge') {
      mult = card.value;
      f.surgeReady = false;
      events.push({ kind: 'doubled', text: `${card.name} doubled x${mult}!` });
    }
    const who = side === 'you' ? 'You' : 'Warden';
    if (card.type === 'strike') {
      const dmg = card.value * mult;
      const hurt = this.applyDamage(other(side), dmg);
      f.damageDealt += hurt;
      events.push({ kind: 'damage', text: `${who} strike ${card.name} for ${dmg}` });
      if (foe.life <= 0) this.endDuel(side);
    } else if (card.type === 'guard') {
      f.block += card.value * mult;
      events.push({ kind: 'block', text: `${who} guard ${card.name} +${card.value * mult} block` });
    } else if (card.type === 'kindle') {
      const drawn = f.deck.draw(card.value * mult);
      f.hand.push(...drawn);
      events.push({ kind: 'draw', text: `${who} draw ${drawn.length} cards` });
    } else if (card.type === 'surge') {
      f.surgeReady = true;
      events.push({ kind: 'surge-card', text: `${who} primes a Surge — next card doubles` });
    }

    // Same-suit Surge: a suit played twice in one round fires its bonus.
    f.playedSuits[card.suit] = (f.playedSuits[card.suit] || 0) + 1;
    if (f.playedSuits[card.suit] === 2 && !f.surgedSuits[card.suit]) {
      f.surgedSuits[card.suit] = true;
      const line = surgeLine(card.suit);
      this.lastSurge = line;
      events.push({ kind: 'suit-surge', text: line });
      if (card.suit === 'flame') {
        const hurt = this.applyDamage(other(side), 3);
        f.damageDealt += hurt;
        if (foe.life <= 0) this.endDuel(side);
      } else if (card.suit === 'tide') {
        this.heal(side, 3);
      } else if (card.suit === 'thorn') {
        f.block += 4;
        const hurt = this.applyDamage(other(side), 2);
        f.damageDealt += hurt;
        if (foe.life <= 0) this.endDuel(side);
      } else if (card.suit === 'gale') {
        f.hand.push(...f.deck.draw(1));
      }
    }

    this.lastEvents = events;
    for (const e of events) this.log.push(e.text);
    return events;
  }

  /** End the duel: the side that reduced the other to 0 wins the round count. */
  endDuel(winnerSide) {
    if (this.over) return;
    this.over = true;
    this.winner = winnerSide;
    if (winnerSide === 'you') this.you.roundsWon += 1;
    else this.warden.roundsWon += 1;
    this.phase = winnerSide === 'you' ? 'win' : 'loss';
    this.log.push(winnerSide === 'you' ? 'Victory — the Warden falls.' : 'Defeat — your ember fades.');
  }

  /** Advance to the next round (called after the Warden has acted). */
  nextRound() {
    if (this.over) return;
    this.round += 1;
    this.startRound();
  }
}
