import { html, nothing, render } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { emptyBoard, loadMore, loadPage, percent, refreshPoll, type Board, type Status } from './board';
import { translator, type Translate } from './i18n';
import type { PotokPoll, PotokPollOption } from './potok';

const statuses: { status: Status; label: 'statusOpen' | 'statusWaiting' | 'statusClosed' }[] = [
  { status: 'open', label: 'statusOpen' },
  { status: 'waiting', label: 'statusWaiting' },
  { status: 'closed', label: 'statusClosed' },
];

const emptyTexts = { open: 'emptyOpen', waiting: 'emptyWaiting', closed: 'emptyClosed' } as const;

type Ctx = {
  t: Translate;
  lang: string;
  open: (poll: PotokPoll) => void;
};

function deadline(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'sr-Latn', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// One series, so one color and no legend: each bar carries its answer's name and
// numbers. What is the viewer's is said with a check and words, not by color.
function resultRow(ctx: Ctx, poll: PotokPoll, option: PotokPollOption) {
  const share = percent(option.votes_count, poll.voters_count);

  return html`<li class="flex flex-col gap-1">
    <div class="flex items-baseline justify-between gap-3 text-sm">
      <span class=${option.id === poll.winner_option_id ? 'font-semibold' : ''}>
        ${option.text}
        ${option.mine ? html`<span class="ml-1 text-xs whitespace-nowrap opacity-70">✓ ${ctx.t('yourVote')}</span>` : nothing}
      </span>
      <span class="shrink-0 text-xs tabular-nums opacity-70">${option.votes_count} · ${share}%</span>
    </div>
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-base-300" role="presentation">
      <div class="h-full rounded-full bg-primary transition-[width] duration-300" style="width: ${Math.min(share, 100)}%"></div>
    </div>
  </li>`;
}

function answers(ctx: Ctx, poll: PotokPoll) {
  const counted = poll.can_see_results && poll.options.every((option) => option.votes_count !== null);

  return counted
    ? html`<ul class="flex flex-col gap-2.5">${poll.options.map((option) => resultRow(ctx, poll, option))}</ul>`
    : html`<ul class="flex flex-col gap-1 text-sm opacity-80">
        ${poll.options.map(
          (option) => html`<li>${option.text}${option.mine ? html` <span class="text-xs opacity-70">✓ ${ctx.t('yourVote')}</span>` : nothing}</li>`,
        )}
      </ul>`;
}

function outcome(ctx: Ctx, poll: PotokPoll) {
  if (!poll.outcome) return nothing;

  const winner = poll.options.find((option) => option.id === poll.winner_option_id);
  const text = {
    passed: winner ? `${ctx.t('decided')}: ${winner.text}` : ctx.t('decided'),
    failed: ctx.t('notDecided'),
    no_quorum: ctx.t('noQuorum'),
    tie: ctx.t('tied'),
  }[poll.outcome];

  return html`<p class="d-badge d-badge-sm h-auto self-start bg-base-100 py-1 whitespace-normal">${text}</p>`;
}

function label(ctx: Ctx, poll: PotokPoll): string | null {
  if (!poll.open) return ctx.t('ended');
  if (poll.secret) return ctx.t('secret');
  return poll.public ? ctx.t('public') : null;
}

function action(ctx: Ctx, poll: PotokPoll) {
  const text = poll.can_vote
    ? ctx.t(poll.voted ? 'changeVote' : 'vote')
    : ctx.t(poll.can_see_details ? 'details' : 'open');

  return html`<button
    type="button"
    class="d-btn d-btn-sm ${poll.can_vote && !poll.voted ? 'd-btn-primary' : 'd-btn-ghost'}"
    @click=${() => ctx.open(poll)}
  >${text}</button>`;
}

function card(ctx: Ctx, poll: PotokPoll) {
  const tag = label(ctx, poll);

  return html`<article class="d-card bg-base-200">
    <div class="d-card-body gap-3 p-4">
      <header class="flex flex-col gap-1">
        ${tag ? html`<p class="text-[11px] font-semibold tracking-wide uppercase opacity-65">${tag}</p>` : nothing}
        <h2 class="text-base font-semibold wrap-break-word">${poll.question}</h2>
      </header>
      ${outcome(ctx, poll)}
      ${answers(ctx, poll)}
      ${poll.voted && !poll.can_see_results ? html`<p class="text-xs opacity-70">${ctx.t('recorded')}</p>` : nothing}
      <footer class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-90">
        <span>${ctx.t('voted')}: <span class="tabular-nums">${poll.voters_count}</span></span>
        ${poll.open && poll.closes_at ? html`<span>${ctx.t('until')} ${deadline(poll.closes_at, ctx.lang)}</span>` : nothing}
        <span class="flex-1"></span>
        ${action(ctx, poll)}
      </footer>
    </div>
  </article>`;
}

function view(board: Board, ctx: Ctx, handlers: { status: (status: Status) => void; more: () => void; start: () => void; retry: () => void }) {
  if (board.outdated) return html`<p class="text-sm opacity-70">${ctx.t('outdated')}</p>`;

  return html`
    <header class="flex flex-wrap items-center gap-2">
      <h1 class="flex-1 text-xl font-semibold">${ctx.t('title')}</h1>
      ${board.canStart
        ? html`<button id="polls-new-poll" type="button" class="d-btn d-btn-primary d-btn-sm" @click=${handlers.start}>${ctx.t('newPoll')}</button>`
        : nothing}
    </header>

    <div role="group" class="flex flex-wrap gap-1.5">
      ${statuses.map(
        ({ status, label: text }) => html`<button
          type="button"
          aria-pressed=${String(board.status === status)}
          class="d-btn d-btn-xs ${board.status === status ? 'd-btn-primary' : 'd-btn-ghost'}"
          @click=${() => handlers.status(status)}
        >${ctx.t(text)}</button>`,
      )}
    </div>

    ${!board.loaded ? html`<p class="text-sm opacity-60">${ctx.t('loading')}</p>` : nothing}
    ${board.failed
      ? html`<p class="text-sm text-error" role="alert">
          ${ctx.t('failed')}
          <button type="button" class="d-btn d-btn-ghost d-btn-xs" @click=${handlers.retry}>${ctx.t('retry')}</button>
        </p>`
      : nothing}
    ${board.loaded && !board.failed && board.polls.length === 0
      ? html`<p class="text-sm opacity-70">${ctx.t(emptyTexts[board.status])}</p>`
      : nothing}

    ${repeat(board.polls, (poll) => poll.id, (poll) => card(ctx, poll))}

    ${board.hasMore
      ? html`<button type="button" class="d-btn d-btn-ghost d-btn-sm self-center" @click=${handlers.more}>${ctx.t('loadMore')}</button>`
      : nothing}
  `;
}

// A burst of votes is one read per poll: the page sends who changed, and this
// waits for it to settle.
const REFRESH_DELAY_MS = 250;

export function mountBoard(root: HTMLElement) {
  const lang = document.documentElement.lang;
  const t = translator(lang);
  let board = emptyBoard();
  const changed = new Set<number>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const ctx: Ctx = {
    t,
    lang,
    open: (poll) => void window.potok.openPoll(poll.id),
  };

  const draw = () => render(view(board, ctx, handlers), root);

  const put = (next: Board) => {
    board = next;
    draw();
  };

  const reload = async () => put(await loadPage(board));

  const handlers = {
    status(status: Status) {
      put({ ...board, status, polls: [], hasMore: false, loaded: false });
      void reload();
    },
    more: async () => put(await loadMore(board)),
    start: () => void window.potok.openPollForm(),
    retry: () => void reload(),
  };

  const flush = async () => {
    const ids = [...changed];
    changed.clear();

    let next = board;
    for (const id of ids) next = await refreshPoll(next, id);
    put(next);
  };

  window.potok.onPollChange((id) => {
    changed.add(id);
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), REFRESH_DELAY_MS);
  });

  draw();
  void reload();

  void window.potok.getGroup().then((reply) => {
    if (reply.ok) put({ ...board, canStart: reply.group.can_start_polls === true });
  });
}
