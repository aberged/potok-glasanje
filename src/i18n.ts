// The app's words. Potok's page says its language on the frame's <html lang>
// ("sr", "sr-Cyrl" or "en"), and nothing else tells an app. Serbian is the
// reference, as in Potok, and Cyrillic comes from it.

const sr = {
  title: 'Glasanja',
  newPoll: 'Novo glasanje',
  statusOpen: 'Otvorena',
  statusWaiting: 'Čekaju moj glas',
  statusClosed: 'Završena',
  loading: 'Učitavam glasanja…',
  emptyOpen: 'Nema glasanja u toku.',
  emptyWaiting: 'Nijedno glasanje ne čeka tvoj glas.',
  emptyClosed: 'Nema završenih glasanja.',
  loadMore: 'Učitaj ranija glasanja',
  vote: 'Glasaj',
  changeVote: 'Promeni glas',
  details: 'Detalji',
  open: 'Otvori',
  secret: 'Tajno glasanje',
  public: 'Javno glasanje',
  ended: 'Završeno',
  voted: 'Glasalo',
  until: 'Do',
  yourVote: 'tvoj izbor',
  recorded: 'Tvoj glas je zabeležen.',
  decided: 'Odlučeno',
  notDecided: 'Nije odlučeno',
  noQuorum: 'Nema kvoruma',
  tied: 'Nerešeno',
  failed: 'Glasanja se nisu učitala. Pokušaj ponovo.',
  retry: 'Pokušaj ponovo',
  outdated: 'Otvori stranicu ponovo da bi radilo glasanje.',
};

type Key = keyof typeof sr;

const en: Record<Key, string> = {
  title: 'Polls',
  newPoll: 'New poll',
  statusOpen: 'Open',
  statusWaiting: 'Waiting for my vote',
  statusClosed: 'Finished',
  loading: 'Loading polls…',
  emptyOpen: 'No polls in progress.',
  emptyWaiting: 'No poll is waiting for you.',
  emptyClosed: 'No finished polls.',
  loadMore: 'Load earlier polls',
  vote: 'Vote',
  changeVote: 'Change vote',
  details: 'Details',
  open: 'Open',
  secret: 'Secret poll',
  public: 'Public poll',
  ended: 'Ended',
  voted: 'Voted',
  until: 'Until',
  yourVote: 'your choice',
  recorded: 'Your vote is recorded.',
  decided: 'Decided',
  notDecided: 'Not decided',
  noQuorum: 'No quorum',
  tied: 'Tied',
  failed: 'The polls did not load. Try again.',
  retry: 'Try again',
  outdated: 'Open the page again for polls to work.',
};

const LETTERS: Record<string, string> = {
  a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и',
  j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у',
  v: 'в', z: 'з', ž: 'ж',
};

const PAIRS: Record<string, string> = { lj: 'љ', nj: 'њ', dž: 'џ' };

/** Serbian Latin as Cyrillic: the app's own words, never what people typed. */
export function toCyrillic(text: string): string {
  return text.replace(/lj|nj|dž|[a-zčćđšž]/giu, (latin) => {
    const lower = latin.toLowerCase();
    const cyrillic = PAIRS[lower] ?? LETTERS[lower] ?? latin;

    return latin[0] === latin[0].toUpperCase() && latin[0] !== latin[0].toLowerCase()
      ? cyrillic.toUpperCase()
      : cyrillic;
  });
}

export type Language = 'sr' | 'sr-Cyrl' | 'en';

export function language(tag: string): Language {
  if (tag === 'en') return 'en';
  return tag === 'sr-Cyrl' ? 'sr-Cyrl' : 'sr';
}

export function translator(tag: string) {
  const lang = language(tag);

  return (key: Key): string => {
    if (lang === 'en') return en[key];
    return lang === 'sr-Cyrl' ? toCyrillic(sr[key]) : sr[key];
  };
}

export type Translate = ReturnType<typeof translator>;
