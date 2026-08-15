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

// Default (unsorted) order is party → companions → enemies:
// Theren, Mira, Wolfy, Ogre
const party = [
  {
    id: 'p1', name: 'Theren', class: 'Ranger', level: 5, dex: 14,
    currentHp: 38, maxHp: 44, initiative: 15, ac: 15,
    companions: [
      { id: 'c1', name: 'Wolfy', active: true, inCombat: true, maxHp: 11, currentHp: 11, initiative: 8 },
    ],
  },
  // acEffect: the Now card must show the initiative-view AC (mage armor
  // 13 + dex 0 = 13), not the stored ac of 18
  { id: 'p2', name: 'Mira', class: 'Cleric', level: 5, dex: 10, currentHp: 40, maxHp: 40, initiative: 5, ac: 18, acEffect: 'mageArmor' },
];

const templates = [{ id: 't-ogre', name: 'Ogre', maxHp: 59, ac: 11, cr: '2', xp: 450 }];

const ogre = {
  id: 'enemy-1', name: 'Ogre', currentHp: 59, maxHp: 59, initiative: 9, cr: '2',
  legendaryActions: [
    { name: 'Club Swing', description: 'One club attack.' },
    { name: 'Stomp (2 Actions)', description: 'DC 14 Str save or prone.' },
  ],
};

const jsonResponse = (data) => ({ ok: true, json: async () => data });

function mockFetch(encounter = { enemies: [ogre] }) {
  const routes = {
    '/api/party': jsonResponse(party),
    '/api/templates': jsonResponse(templates),
    '/api/encounter': jsonResponse(encounter),
    '/api/encounters': jsonResponse([]),
  };
  const fn = vi.fn(async (url, opts = {}) => {
    const route = routes[url];
    if (!route) return jsonResponse({ success: true });
    if (opts.method && opts.method !== 'GET') return jsonResponse({ success: true });
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

const initCol = () => document.querySelector('main').children[1];
const tracker = () => initCol().children[1];
// The order only renders inside the Manage Order modal now
const orderModal = () => screen.getByText('Initiative Order').closest('.fixed');

const click = (el) => act(() => { fireEvent.click(el); });

const openOrderModal = async () => {
  click(screen.getByText('Manage Order'));
  await act(async () => {});
  return orderModal();
};

const startCombat = async () => {
  click(screen.getByText('Start Combat'));
  await flush();
};

const nowName = () => {
  const heading = within(tracker()).getByText('Now');
  return heading.nextElementSibling.textContent;
};
const nextName = () => within(tracker()).getByText('Next').nextElementSibling.textContent;

const postCalls = (fetchMock, url) =>
  fetchMock.mock.calls.filter(([u, opts]) => u === url && opts?.method === 'POST');

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('CombatPage — turn tracker', () => {
  it('is idle until combat starts, then points at the first combatant', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    expect(within(tracker()).getByText(/4 combatants in the order/)).toBeInTheDocument();

    await startCombat();

    expect(within(tracker()).getByText('Round 1')).toBeInTheDocument();
    expect(within(tracker()).getByText('Turn 1 / 4')).toBeInTheDocument();
    expect(nowName()).toBe('Theren');
    expect(nextName()).toBe('Mira');
    // dex modifier rides along on the Now card (Theren dex 14 → +2)
    expect(within(tracker()).getByText('DEX +2')).toBeInTheDocument();
  });

  it('End Turn walks the order and rolls over into the next round', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(screen.getByText('End Turn →'));
    await flush();
    expect(nowName()).toBe('Mira');
    expect(nextName()).toBe('Wolfy');

    click(screen.getByText('End Turn →'));
    click(screen.getByText('End Turn →'));
    await flush();
    expect(nowName()).toBe('Ogre');
    expect(within(tracker()).getByText('Round 1')).toBeInTheDocument();

    // last combatant ends their turn -> back to the top, round advances
    click(screen.getByText('End Turn →'));
    await flush();
    expect(nowName()).toBe('Theren');
    expect(within(tracker()).getByText('Round 2')).toBeInTheDocument();
  });

  it('Back steps the pointer backwards and never goes below round 1', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(screen.getByText('End Turn →'));
    await flush();
    click(screen.getByText('← Back'));
    await flush();
    expect(nowName()).toBe('Theren');

    // stepping back off the top wraps to the end but keeps round 1
    click(screen.getByText('← Back'));
    await flush();
    expect(nowName()).toBe('Ogre');
    expect(within(tracker()).getByText('Round 1')).toBeInTheDocument();
  });

  it('marks the active and next rows in the order modal, and rows jump the pointer', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    const modal = await openOrderModal();
    expect(within(modal).getByText('Now')).toBeInTheDocument();
    expect(within(modal).getByText('Next')).toBeInTheDocument();
    // rows show the dex modifier next to AC/HP (Theren dex 14 → +2)
    expect(within(modal).getByText('DEX +2')).toBeInTheDocument();

    click(within(modal).getByText('Ogre'));
    await flush();
    click(within(modal).getByText('Done'));
    await flush();
    expect(nowName()).toBe('Ogre');
    expect(nextName()).toBe('Theren');
  });

  it('editing an initiative value does not hijack the row click', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    // clicking the initiative badge opens its editor without moving the pointer
    const modal = await openOrderModal();
    click(within(modal).getByText('5'));
    await flush();
    click(within(modal).getByText('Done'));
    await flush();
    expect(nowName()).toBe('Theren');
  });

  it('the Now card shows the initiative-view AC, not the raw stored ac', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(screen.getByText('End Turn →')); // Mira: mage armor 13, stored ac 18
    await flush();
    expect(nowName()).toBe('Mira');
    expect(within(tracker()).getByText('13')).toBeInTheDocument();
    expect(within(tracker()).queryByText('18')).not.toBeInTheDocument();
  });

  it('the pointer follows its combatant when the order is re-sorted', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(screen.getByText('End Turn →')); // Mira (initiative 5, sorts last)
    await flush();
    expect(nowName()).toBe('Mira');

    click(screen.getByText('Manage Order'));
    click(screen.getByText('Sort by Init'));
    await flush();
    click(screen.getByText('Done'));
    await flush();

    // Mira is still the active combatant, now at the bottom of the order
    expect(nowName()).toBe('Mira');
    expect(within(tracker()).getByText('Turn 4 / 4')).toBeInTheDocument();
  });

  it('clamps the pointer when the active combatant leaves the fight', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    const modal = await openOrderModal();
    click(within(modal).getByText('Ogre')); // last in the order
    await flush();
    click(within(modal).getByText('Done'));
    await flush();
    expect(nowName()).toBe('Ogre');

    const enemiesCol = document.querySelector('main').children[2];
    click(within(enemiesCol).getByTitle('Clear encounter'));
    await flush();

    // combat ended with the encounter; nothing points at a removed creature
    expect(screen.getByText('Start Combat')).toBeInTheDocument();
  });

  it('slots a legendary action in without losing the current turn', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(screen.getByText('End Turn →')); // Mira's turn
    await flush();

    click(screen.getByTitle('Slot in a legendary action'));
    await flush();
    click(screen.getByText('2 legendary actions'));
    await flush();

    // the interrupt takes over the tracker, listing what the creature can do
    expect(within(tracker()).getByText('Legendary Action')).toBeInTheDocument();
    expect(within(tracker()).getByText('Ogre')).toBeInTheDocument();
    expect(within(tracker()).getByText('Club Swing')).toBeInTheDocument();
    expect(within(tracker()).getByText(/Resuming:/)).toHaveTextContent('Mira');

    click(screen.getByText('Done'));
    await flush();

    // back to exactly where the round was
    expect(nowName()).toBe('Mira');
    expect(within(tracker()).getByText('Turn 2 / 4')).toBeInTheDocument();
  });

  it('persists turn state with the encounter and restores it on load', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    fetchMock.mockClear();

    await startCombat();
    click(screen.getByText('End Turn →'));
    await act(async () => { vi.advanceTimersByTime(1100); });

    const [, opts] = postCalls(fetchMock, '/api/encounter').at(-1);
    const body = JSON.parse(opts.body);
    expect(body.combatActive).toBe(true);
    expect(body.round).toBe(1);
    expect(body.turnIndex).toBe(1);
    expect(body.turnId).toBe('p2');
    expect(body.initiativeOrder).toEqual([]);
  });

  it('restores a combat in progress from the saved encounter', async () => {
    mockFetch({
      enemies: [ogre],
      combatActive: true,
      round: 3,
      turnIndex: 2,
      turnId: 'companion-p1-c1',
      interrupt: { id: 'enemy-1', name: 'Ogre', label: 'Legendary Action' },
    });
    render(<CombatPage />);
    await settle();

    expect(within(tracker()).getByText('Round 3')).toBeInTheDocument();
    expect(within(tracker()).getByText('Legendary Action')).toBeInTheDocument();
    expect(within(tracker()).getByText(/Resuming:/)).toHaveTextContent('Wolfy');
  });
});
