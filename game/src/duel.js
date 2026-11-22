// Ember Court — the duel itself: rounds, ember, life, block, win and loss.
// One duel: two duelists, 20 Ember (life) each, an ember pool that grows
// +1 per round up to 10, a hand of 5, one card drawn per round. First
// duelist to 0 life loses. Score = damage dealt + 3 per round the player
// out-damaged the Warden.

import { buildDeckCards, surgeBonus } from './cards.js';
import { Deck, makeRng } from './deck.js';

export const MAX_LIFE = 20;
export const MAX_EMBER = 10;
export const HAND_SIZE = 5;

/** One side of the table. `isPlayer` picks the human's side. */
export function makeDuelist(isPlayer, rng) {
  return {
    isPlayer,
    life: MAX_LIFE,
    ember: 1,
    emberMax: 1,
    block: 0,
    hand: [],
    played: [],
    deck: new Deck(buildDeckCards(), rng),
    reflect: 0,
    doubled: false,
    surgeSuits: new Set(),
  };
}

export class Duel {
  constructor(seed = 1) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.player = makeDuelist(true, this.rng);
    this.warden = makeDuelist(false, this.rng);
    this.round = 1;
    this.phase = 'title';
    this.score = 0;
    this.damageDealt = 0;
    this.roundsWon = 0;
    this.log = 'The duel begins. Play a card, then End Round.';
    this.surgeCallout = '';
    this.winner = null;
    this.roundDamage = { player: 0, warden: 0 };
  }

  /** Deal the opening hands and open round 1. */
  start() {
    this.player.hand = this.player.deck.draw(HAND_SIZE);
    this.warden.hand = this.warden.deck.draw(HAND_SIZE);
    this.phase = 'player';
    this.log = 'Round 1 begins. Your move — play cards, then End Round.';
    return this;
  }

  /** Begin a new round: ember grows, both sides draw, block fades. */
  startRound() {
    this.round += 1;
    for (const side of [this.player, this.warden]) {
      side.emberMax = Math.min(MAX_EMBER, side.emberMax + 1);
      side.ember = side.emberMax;
      side.block = 0;
      side.reflect = 0;
      side.doubled = false;
      side.played = [];
      side.surgeSuits = new Set();
      side.hand.push(...side.deck.draw(1));
    }
    this.roundDamage = { player: 0, warden: 0 };
    this.surgeCallout = '';
    this.phase = 'player';
    this.log = `Round ${this.round} begins.`;
  }

  /** Can this side afford and play the card at `index` right now? */
  canPlay(side, index) {
    const card = side.hand[index];
    if (!card || this.phase !== 'player' || side !== this.player) return false;
    if (this.winner) return false;
    return card.cost <= side.ember;
  }

  /** Play the card at `index` from `side`'s hand. Returns the played card or null. */
  playCard(side, index) {
    const card = side.hand[index];
    if (!card) return null;
    if (side === this.player && !this.canPlay(side, index)) return null;
    if (card.cost > side.ember) return null;
    side.ember -= card.cost;
    side.hand.splice(index, 1);
    side.played.push(card);
    side.deck.discardCards([card]);

    const mult = side.doubled ? 2 : 1;
    if (side.doubled) side.doubled = false;

    if (card.type === 'Strike') {
      this.dealDamage(side, card.value * mult);
    } else if (card.type === 'Guard') {
      side.block += card.value * mult;
      this.log = `${side.isPlayer ? 'You gain' : 'Warden gains'} ${card.value * mult} block.`;
    } else if (card.type === 'Kindle') {
      // Kindle draws its value in cards; a doubled Kindle draws double.
      side.hand.push(...side.deck.draw(card.value * mult));
      this.log = `${side.isPlayer ? 'You draw' : 'Warden draws'} ${card.value * mult} cards.`;
    } else if (card.type === 'Surge') {
      side.doubled = true;
      this.log = `${side.isPlayer ? 'Your' : 'Warden’s'} next card is doubled.`;
    }

    this.checkSurge(side, card);
    this.checkWinner();
    return card;
  }

  /** Two cards of the same suit in one round trigger that suit's Surge. */
  checkSurge(side, card) {
    // Already surged with this suit this round: a suit surges at most once.
    if (side.surgeSuits.has(card.suit)) return;
    const playedSame = side.played.filter((c) => c.suit === card.suit).length;
    if (playedSame < 2) return;
    side.surgeSuits.add(card.suit);
    const bonus = surgeBonus(card.suit);
    const who = side.isPlayer ? 'You' : 'Warden';
    if (bonus.damage) this.dealDamage(side, bonus.damage);
    if (bonus.heal) {
      side.life = Math.min(MAX_LIFE, side.life + bonus.heal);
      this.log = `${who} heal ${bonus.heal} from the Tide.`;
    }
    if (bonus.block) side.block += bonus.block;
    if (bonus.reflect) side.reflect += bonus.reflect;
    if (bonus.draw) side.hand.push(...side.deck.draw(bonus.draw));
    const suitName = card.suit.toUpperCase();
    const what =
      bonus.damage ? `+${bonus.damage} damage`
      : bonus.heal ? `heal ${bonus.heal}`
      : bonus.block ? `+${bonus.block} block, reflect ${bonus.reflect}`
      : 'draw 1 extra';
    this.surgeCallout = `${suitName} SURGE ${what}`;
    this.log = `${who} trigger ${suitName} SURGE — ${what}!`;
    this.checkWinner();
  }

  /** Damage from `attacker` to the other side, soaked by block first. */
  dealDamage(attacker, amount) {
    const defender = attacker === this.player ? this.warden : this.player;
    const soaked = Math.min(defender.block, amount);
    defender.block -= soaked;
    const dealt = amount - soaked;
    defender.life = Math.max(0, defender.life - dealt);
    if (attacker === this.player) {
      this.damageDealt += dealt;
      this.roundDamage.player += dealt;
    } else {
      this.roundDamage.warden += dealt;
    }
    // Thorn reflect: the defender's stored reflect bites back.
    if (defender.reflect > 0 && dealt > 0) {
      const back = Math.min(defender.reflect, dealt);
      attacker.life = Math.max(0, attacker.life - back);
      this.log = `Thorns reflect ${back} damage back!`;
    }
    if (dealt > 0) {
      this.log = `${attacker.isPlayer ? 'You deal' : 'Warden deals'} ${dealt} damage.`;
    }
  }

  /** Score the round, then hand the turn to the Warden. Called by End Round. */
  endPlayerTurn() {
    if (this.phase !== 'player' || this.winner) return;
    if (this.roundDamage.player > this.roundDamage.warden) this.roundsWon += 1;
    this.score = this.damageDealt + this.roundsWon * 3;
    this.phase = 'warden';
  }

  /** The Warden plays its telegraphed hand, then the next round opens. */
  resolveWardenTurn(playFn) {
    if (this.phase !== 'warden' || this.winner) return;
    playFn(this.warden);
    this.checkWinner();
    if (!this.winner) this.startRound();
  }

  checkWinner() {
    if (this.winner) return;
    if (this.warden.life <= 0) {
      this.winner = 'player';
      this.phase = 'over';
      this.score = this.damageDealt + this.roundsWon * 3;
    } else if (this.player.life <= 0) {
      this.winner = 'warden';
      this.phase = 'over';
      this.score = this.damageDealt + this.roundsWon * 3;
    }
  }
}
