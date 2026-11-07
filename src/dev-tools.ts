import './dev-theme.css';
import type { PotokPoll } from './potok';

// Dev only (main.ts imports it in its DEV block): fills an empty dev store
// with polls in every state. `?lang=en` or `?lang=sr-Cyrl` tries a language.
// To start over: localStorage.removeItem('potok-dev:polls').

const POLLS_STORAGE_KEY = 'potok-dev:polls';

const base = {
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
} satisfies Partial<PotokPoll>;

const polls: PotokPoll[] = [
  {
    ...base,
    id: 3,
    question: 'Gde idemo na izlet?',
    voters_count: 4,
    closes_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    options: [
      { id: 31, text: 'More', votes_count: null, mine: false },
      { id: 32, text: 'Planina', votes_count: null, mine: false },
    ],
  },
  {
    ...base,
    id: 2,
    question: 'Da li usvajamo godišnji izveštaj?',
    secret: true,
    voted: true,
    can_vote: false,
    voters_count: 7,
    options: [
      { id: 21, text: 'Za', votes_count: null, mine: false },
      { id: 22, text: 'Protiv', votes_count: null, mine: false },
      { id: 23, text: 'Uzdržan', votes_count: null, mine: false },
    ],
  },
  {
    ...base,
    id: 1,
    question: 'Kog dana je sastanak?',
    open: false,
    closed_at: new Date(Date.now() - 86_400_000).toISOString(),
    can_vote: false,
    can_see_results: true,
    can_see_details: true,
    voted: true,
    voters_count: 6,
    outcome: 'passed',
    winner_option_id: 11,
    options: [
      { id: 11, text: 'Utorak', votes_count: 4, mine: true },
      { id: 12, text: 'Sreda', votes_count: 2, mine: false },
    ],
  },
];

export function seedDevPolls() {
  const lang = new URLSearchParams(location.search).get('lang');
  if (lang) document.documentElement.lang = lang;

  if (!localStorage.getItem(POLLS_STORAGE_KEY)) {
    localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(polls));
  }
}
