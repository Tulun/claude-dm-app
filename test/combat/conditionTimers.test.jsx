import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/combat',
}));

import CombatPage from '../../app/combat/page.jsx';

// Default (unsorted) order: Theren, Mira, Ogre.
const timedParty = [
  { id: 'p1', name: 'Theren', class: 'Ranger', level: 5, currentHp: 38, maxHp: 44, initiative: 15, ac: 15,
    conditions: [{ name: 'Frightened', rounds: 2 }, { name: 'Prone' }] },
  { id: 'p2', name: 'Mira', class: 'Cleric', level: 5, currentHp: 40, maxHp: 40, initiative: 5, ac: 18,
    conditions: [{ name: 'Blinded', until: 'endOfNextTurn' }] },
];
const timedOgre = {
  id: 'enemy-1', name: 'Ogre', currentHp: 59, maxHp: 59, initiative: 9, ac: 11, cr: '2',
  conditions: [{ name: 'Stunned', rounds: 1 }, { name: 'Poisoned' }],
};

const jsonResponse = (data) => ({ ok: true, json: async () => data });

function mockFetch(party, enemies) {
  const routes = {
    '/api/party': jsonResponse(party),
    '/api/templates': jsonResponse([]),
    '/api/encounter': jsonResponse({ enemies }),
    '/api/encounters': jsonResponse([]),
  };
  const fn = vi.fn(async (url, opts = {}) => {
    const route = routes[url];
    if (!route || (opts.method && opts.method !== 'GET')) return jsonResponse({ success: true });
    return route;
  });
  global.fetch = fn;
  return fn;
}

const flush = () => act(async () => {});
const settle = async () => {
  await flush();
  await act(async () => { vi.advanceTimersByTime(1600); });
  await flush();
};
const click = (el) => act(() => { fireEvent.click(el); });
const tracker = () => document.querySelector('[data-testid="initiative-bar"]').children[1];
const reminder = () => within(tracker()).queryByRole('status', { name: 'Condition reminder' });
const endTurn = () => click(screen.getByText('End Turn →'));
const postCalls = (fetchMock, url) =>
  fetchMock.mock.calls.filter(([u, opts]) => u === url && opts?.method === 'POST');
const lastBody = (fetchMock, url) => JSON.parse(postCalls(fetchMock, url).at(-1)[1].body);

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('CombatPage — timed conditions', () => {
  it('loading timed conditions does not echo a save', async () => {
    const fetchMock = mockFetch(timedParty, [timedOgre]);
    render(<CombatPage />);
    await settle();
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(postCalls(fetchMock, '/api/party')).toHaveLength(0);
    expect(postCalls(fetchMock, '/api/encounter')).toHaveLength(0);
  });

  it('ticks the landed-on combatant down, expires what ran out, and reminds about saves', async () => {
    const fetchMock = mockFetch(timedParty, [timedOgre]);
    render(<CombatPage />);
    await settle();

    // Theren's turn starts: Frightened 2 → 1, nothing expired, save reminder
    click(screen.getByText('Start Combat'));
    await flush();
    expect(reminder()).toHaveTextContent('End-of-turn save? Theren: Frightened');
    expect(reminder()).not.toHaveTextContent('Expired');
    expect(within(tracker()).getByTestId('condition-duration')).toHaveTextContent('1r');

    // Mira's turn starts: Blinded moves to "this turn"; Blinded allows no
    // save, so no reminder at all
    endTurn();
    await flush();
    expect(reminder()).toBeNull();
    expect(within(tracker()).getByTestId('condition-duration')).toHaveTextContent('this turn');

    // Mira's turn ends (Blinded expires) and the Ogre's starts (Stunned 1 → gone)
    endTurn();
    await flush();
    expect(reminder()).toHaveTextContent('Expired on Mira: Blinded');
    expect(reminder()).toHaveTextContent('Expired on Ogre: Stunned');
    expect(reminder()).toHaveTextContent('End-of-turn save? Ogre: Poisoned');

    await act(async () => { vi.advanceTimersByTime(1100); });
    expect(lastBody(fetchMock, '/api/encounter').enemies[0].conditions).toEqual([{ name: 'Poisoned' }]);
    const party = lastBody(fetchMock, '/api/party');
    expect(party[0].conditions).toEqual([{ name: 'Frightened', rounds: 1 }, { name: 'Prone' }]);
    expect(party[1].conditions).toEqual([]);

    // dismissible
    click(within(reminder()).getByLabelText('Dismiss reminder'));
    expect(reminder()).toBeNull();

    // Theren again (round 2): Frightened 1 → expires
    endTurn();
    await flush();
    expect(reminder()).toHaveTextContent('Expired on Theren: Frightened');
    expect(reminder()).not.toHaveTextContent('End-of-turn save?');
  });

  it('stepping Back does not tick conditions and clears the reminder', async () => {
    const fetchMock = mockFetch(timedParty, [timedOgre]);
    render(<CombatPage />);
    await settle();
    click(screen.getByText('Start Combat'));
    await flush();
    endTurn();
    await flush();
    await act(async () => { vi.advanceTimersByTime(1100); });
    const before = postCalls(fetchMock, '/api/party').length;

    click(screen.getByText('← Back'));
    await flush();
    expect(reminder()).toBeNull();
    await act(async () => { vi.advanceTimersByTime(1100); });
    // Theren's Frightened still has 1 round — Back is not a new turn
    expect(postCalls(fetchMock, '/api/party')).toHaveLength(before);
    expect(within(tracker()).getByTestId('condition-duration')).toHaveTextContent('1r');
  });

  it('untimed conditions never change on turn moves — no party/enemy saves from ticking', async () => {
    const party = timedParty.map(p => ({ ...p, conditions: [{ name: 'Prone' }] }));
    const ogre = { ...timedOgre, conditions: [{ name: 'Restrained' }] };
    const fetchMock = mockFetch(party, [ogre]);
    render(<CombatPage />);
    await settle();
    click(screen.getByText('Start Combat'));
    await flush();
    endTurn();
    await flush();
    endTurn();
    await flush();
    // Restrained usually allows a save → reminder, but nothing expired
    expect(reminder()).toHaveTextContent('End-of-turn save? Ogre: Restrained');
    expect(reminder()).not.toHaveTextContent('Expired');
    await act(async () => { vi.advanceTimersByTime(1100); });
    expect(postCalls(fetchMock, '/api/party')).toHaveLength(0);
    expect(lastBody(fetchMock, '/api/encounter').enemies[0].conditions).toEqual([{ name: 'Restrained' }]);
  });

  it('End Combat clears the reminder; restarting is a fresh turn start', async () => {
    mockFetch(timedParty, [timedOgre]);
    render(<CombatPage />);
    await settle();
    click(screen.getByText('Start Combat'));
    await flush();
    expect(reminder()).not.toBeNull();
    click(within(tracker()).getByText('End Combat'));
    click(within(tracker()).getAllByText('End Combat').at(-1));
    await flush();
    click(screen.getByText('Start Combat'));
    await flush();
    // Restarting is a fresh turn start: Frightened ticks again (1 → expired)
    expect(reminder()).toHaveTextContent('Expired on Theren: Frightened');
  });
});
