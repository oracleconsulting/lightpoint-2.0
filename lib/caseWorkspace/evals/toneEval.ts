const BANNED = [
  'delve',
  'leverage',
  'seamless',
  'testament',
  'pivotal',
  'crucial',
  'underscore',
  'showcase',
  'tapestry',
  'vibrant',
  'enhance',
  'foster',
  'intricate',
  'landscape',
  'not only',
  'but also',
  '—',
];

export function evaluateTone(text: string) {
  const lower = text.toLowerCase();
  const bannedFound = BANNED.filter((phrase) => lower.includes(phrase.toLowerCase()));
  const americanisms = ['organization', 'analyze', 'center'].filter((word) => lower.includes(word));
  return {
    passed: bannedFound.length === 0 && americanisms.length === 0,
    bannedFound,
    americanisms,
  };
}
