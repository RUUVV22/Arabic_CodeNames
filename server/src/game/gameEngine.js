const { ARABIC_WORDS } = require('../data/arabicWords');
const { CARD, TEAM } = require('./constants');

function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createBoard(random = Math.random, words = ARABIC_WORDS) {
  if (words.length < 25) {
    throw new Error('The word database must contain at least 25 unique words.');
  }

  const selectedWords = shuffle(words, random).slice(0, 25);
  const startingTeam = random() < 0.5 ? TEAM.RED : TEAM.BLUE;
  const secondTeam = startingTeam === TEAM.RED ? TEAM.BLUE : TEAM.RED;
  const identities = shuffle([
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(secondTeam),
    ...Array(7).fill(CARD.NEUTRAL),
    CARD.ASSASSIN,
  ], random);

  return {
    startingTeam,
    cards: selectedWords.map((word, index) => ({
      id: `card-${index + 1}`,
      word,
      type: identities[index],
      revealed: false,
      revealedBy: null,
    })),
  };
}

function normalizeArabic(value = '') {
  return String(value)
    .trim()
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

module.exports = { createBoard, normalizeArabic, shuffle };
