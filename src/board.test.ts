import { describe, expect, it, vi } from 'vitest';
import { emptyBoard, fits, loadMore, loadPage, merged, percent, refreshPoll } from './board';
import { language, toCyrillic, translator } from './i18n';
import type { PotokPoll } from './potok';

function poll(attrs: Partial<PotokPoll> = {}): PotokPoll {
  return {
    id: 1,
    question: 'Q?',
    description: '',
    kind: 'single',
    max_choices: null,
    closes_at: null,
    closed_at: null,
    open: true,
    secret: false,
    public: false,
    can_vote: true,
    voted: false,
    can_see_results: false,
    can_see_details: false,
    can_manage: false,
    voters_count: 0,
    outcome: null,
    winner_option_id: null,
    options: [],
    ...attrs,
  };
}

function stubPotok(calls: Partial<typeof window.potok>) {
  vi.stubGlobal('window', { potok: calls });
}

describe('fits', () => {
  it('keeps open polls among the open ones', () => {
    expect(fits(poll(), 'open')).toBe(true);
    expect(fits(poll({ open: false }), 'open')).toBe(false);
  });

  it('keeps finished polls among the finished ones', () => {
    expect(fits(poll({ open: false }), 'closed')).toBe(true);
    expect(fits(poll(), 'closed')).toBe(false);
  });

  it('holds in waiting what the viewer can still vote in', () => {
    expect(fits(poll(), 'waiting')).toBe(true);
    expect(fits(poll({ voted: true }), 'waiting')).toBe(false);
    expect(fits(poll({ can_vote: false }), 'waiting')).toBe(false);
  });
});

describe('merged', () => {
  it('puts a new poll on top', () => {
    const rows = merged([poll({ id: 1 })], poll({ id: 2 }), 'open');
    expect(rows.map((row) => row.id)).toEqual([2, 1]);
  });

  it('replaces a poll in its place', () => {
    const rows = merged([poll({ id: 2 }), poll({ id: 1 })], poll({ id: 1, voters_count: 3 }), 'open');
    expect(rows.map((row) => [row.id, row.voters_count])).toEqual([[2, 0], [1, 3]]);
  });

  it('takes out a poll that no longer belongs', () => {
    const rows = merged([poll({ id: 1 })], poll({ id: 1, open: false }), 'open');
    expect(rows).toEqual([]);
  });
});

describe('percent', () => {
  it('is the share of voters', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(2, 3)).toBe(67);
  });

  it('holds nothing for no votes and for hidden counts', () => {
    expect(percent(0, 0)).toBe(0);
    expect(percent(null, 5)).toBe(0);
  });
});

describe('loading', () => {
  it('takes the page the server gives', async () => {
    stubPotok({ listPolls: async () => ({ ok: true, polls: [poll()], has_more: true }) });

    const board = await loadPage(emptyBoard());

    expect(board.loaded).toBe(true);
    expect(board.polls).toHaveLength(1);
    expect(board.hasMore).toBe(true);
  });

  it('says so when the page predates the API', async () => {
    stubPotok({ listPolls: async () => ({ ok: false, error: 'unknown_method' }) });

    const board = await loadPage(emptyBoard());

    expect(board.outdated).toBe(true);
    expect(board.failed).toBe(false);
  });

  it('reads on from the last poll', async () => {
    const listPolls = vi.fn(async () => ({ ok: true as const, polls: [poll({ id: 1 })], has_more: false }));
    stubPotok({ listPolls });

    const board = await loadMore({ ...emptyBoard(), polls: [poll({ id: 2 })] });

    expect(listPolls).toHaveBeenCalledWith({ status: 'open', beforeId: 2 });
    expect(board.polls.map((row) => row.id)).toEqual([2, 1]);
  });
});

describe('refreshPoll', () => {
  it('reads the poll again', async () => {
    stubPotok({ getPoll: async () => ({ ok: true, poll: poll({ voters_count: 5 }) }) });

    const board = await refreshPoll({ ...emptyBoard(), polls: [poll()] }, 1);

    expect(board.polls[0].voters_count).toBe(5);
  });

  it('takes a deleted poll off the board', async () => {
    stubPotok({ getPoll: async () => ({ ok: false, error: 'not_found' }) });

    const board = await refreshPoll({ ...emptyBoard(), polls: [poll()] }, 1);

    expect(board.polls).toEqual([]);
  });

  it('leaves the board as it is when the page does not answer', async () => {
    stubPotok({ getPoll: async () => ({ ok: false, error: 'disconnected' }) });

    const board = await refreshPoll({ ...emptyBoard(), polls: [poll()] }, 1);

    expect(board.polls).toHaveLength(1);
  });
});

describe('languages', () => {
  it('reads the frame\'s language', () => {
    expect(language('en')).toBe('en');
    expect(language('sr-Cyrl')).toBe('sr-Cyrl');
    expect(language('sr')).toBe('sr');
    expect(language('')).toBe('sr');
  });

  it('writes Serbian in Cyrillic', () => {
    expect(toCyrillic('Čekaju moj glas')).toBe('Чекају мој глас');
    expect(toCyrillic('Učitaj ranija glasanja')).toBe('Учитај ранија гласања');
    expect(toCyrillic('Nije odlučeno')).toBe('Није одлучено');
    expect(toCyrillic('Ljudi, džem, Njiva')).toBe('Људи, џем, Њива');
  });

  it('gives each language its words', () => {
    expect(translator('en')('newPoll')).toBe('New poll');
    expect(translator('sr')('newPoll')).toBe('Novo glasanje');
    expect(translator('sr-Cyrl')('newPoll')).toBe('Ново гласање');
  });
});
