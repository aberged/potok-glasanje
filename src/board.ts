import type { PotokError, PotokPoll, PotokPollListOptions } from './potok';

// The board: what the app knows of the group's polls and how a change gets in.
// The server decides who sees what, so all this holds is what it answered for
// this viewer, and every change reads the poll again. An app never counts votes,
// never votes and never changes a poll: `openPoll` and `openPollForm` open
// Potok's own page for that.

export type Status = NonNullable<PotokPollListOptions['status']>;

export type Board = {
  loaded: boolean;
  failed: boolean;
  /** The page was opened before this API existed. */
  outdated: boolean;
  status: Status;
  polls: PotokPoll[];
  hasMore: boolean;
  canStart: boolean;
  /** Someone without an account: they read the public polls and log in to vote. */
  guest: boolean;
};

export const emptyBoard = (): Board => ({
  loaded: false,
  failed: false,
  outdated: false,
  status: 'open',
  polls: [],
  hasMore: false,
  canStart: false,
  guest: false,
});

const isError = (reply: { ok: boolean }): reply is PotokError => !reply.ok;

/** Whether the poll belongs on the board's list as it stands. */
export function fits(poll: PotokPoll, status: Status): boolean {
  if (status === 'closed') return !poll.open;
  if (status === 'waiting') return poll.open && poll.can_vote && !poll.voted;
  return poll.open;
}

/** The list with `poll` in its place, or out of it, newest first. */
export function merged(polls: PotokPoll[], poll: PotokPoll, status: Status): PotokPoll[] {
  const others = polls.filter((row) => row.id !== poll.id);

  return fits(poll, status)
    ? [...others, poll].sort((a, b) => b.id - a.id)
    : others;
}

/** The share of voters that chose an answer; several answers can sum past 100. */
export function percent(votes: number | null, voters: number): number {
  if (!votes || voters === 0) return 0;
  return Math.round((votes / voters) * 100);
}

export async function loadPage(board: Board): Promise<Board> {
  const reply = await window.potok.listPolls({ status: board.status });

  if (isError(reply)) {
    return {
      ...board,
      loaded: true,
      failed: reply.error !== 'unknown_method',
      outdated: reply.error === 'unknown_method',
    };
  }

  return {
    ...board,
    loaded: true,
    failed: false,
    outdated: false,
    polls: reply.polls,
    hasMore: reply.has_more,
  };
}

export async function loadMore(board: Board): Promise<Board> {
  const last = board.polls.at(-1);
  if (!last) return board;

  const reply = await window.potok.listPolls({ status: board.status, beforeId: last.id });
  if (isError(reply)) return board;

  return { ...board, polls: [...board.polls, ...reply.polls], hasMore: reply.has_more };
}

/** Reads the poll again after it changed, or takes it off the board when it is gone. */
export async function refreshPoll(board: Board, id: number): Promise<Board> {
  const reply = await window.potok.getPoll(id);

  if (reply.ok) return { ...board, polls: merged(board.polls, reply.poll, board.status) };

  return reply.error === 'not_found'
    ? { ...board, polls: board.polls.filter((poll) => poll.id !== id) }
    : board;
}
