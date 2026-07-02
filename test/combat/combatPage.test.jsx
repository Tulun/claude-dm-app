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
import { defaultPartyData } from '../../app/components/defaultData.js';

const party = [
  {
    id: 'p1', name: 'Theren', class: 'Ranger', level: 5, dex: 14,
    currentHp: 38, maxHp: 44, initiative: 15, ac: 15,
    resources: [{ id: 'r1', name: 'Focus Points', current: 1, max: 3 }],
    companions: [
      { id: 'c1', name: 'Wolfy', active: true, inCombat: true, maxHp: 11, currentHp: 11, initiative: 8 },
      { id: 'c2', name: 'Benchwarmer', active: true, inCombat: false, maxHp: 5 },
    ],
  },
  { id: 'p2', name: 'Mira', class: 'Cleric', level: 5, dex: 10, currentHp: 40, maxHp: 40, initiative: 5, ac: 18 },
];

const templates = [
  { id: 't-goblin', name: 'Goblin', maxHp: 7, ac: 15, cr: '1/4', xp: 50 },
  { id: 't-ogre', name: 'Ogre', maxHp: 59, ac: 11, cr: '2', xp: 450 },
];

const activeEncounter = {
  enemies: [{ id: 'enemy-1', name: 'Ogre', currentHp: 59, maxHp: 59, initiative: 9, cr: '2' }],
};

const savedEncounters = [
  { id: 'enc-1', name: 'Goblin Ambush', monsters: [{ id: 'm1', templateId: 't-goblin', name: 'Goblin', quantity: 2 }] },
];

const jsonResponse = (data) => ({ ok: true, json: async () => data });

function mockFetch(overrides = {}) {
  const routes = {
    '/api/party': jsonResponse(party),
    '/api/templates': jsonResponse(templates),
    '/api/encounter': jsonResponse(activeEncounter),
    '/api/encounters': jsonResponse(savedEncounters),
    ...overrides,
  };
  const fn = vi.fn(async (url, opts = {}) => {
    const route = routes[url];
    if (!route) return jsonResponse({ success: true });
    if (route instanceof Error) throw route;
    // POST/DELETE calls get a generic success unless the test overrides them
    if (opts.method && opts.method !== 'GET') return jsonResponse({ success: true });
    return route;
  });
  global.fetch = fn;
  return fn;
}

// Flush pending microtasks (mocked fetch promises) inside act()
const flush = () => act(async () => {});

const settle = async () => {
  await flush();
  // enable encounter saving (500ms) + fire the initial party/templates auto-saves (1000ms)
  await act(async () => { vi.advanceTimersByTime(1600); });
  await flush();
};

const getColumns = () => {
  const main = document.querySelector('main');
  return { partyCol: main.children[0], initCol: main.children[1], enemiesCol: main.children[2] };
};

const postCalls = (fetchMock, url) =>
  fetchMock.mock.calls.filter(([u, opts]) => u === url && opts?.method === 'POST');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CombatPage — loading and layout', () => {
  it('renders party, enemies, companions and the lair action option after load', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    const { partyCol, initCol, enemiesCol } = getColumns();
    expect(within(partyCol).getByText('Theren')).toBeInTheDocument();
    expect(within(partyCol).getByText('Mira')).toBeInTheDocument();
    expect(within(enemiesCol).getByText('Ogre')).toBeInTheDocument();
    // active + inCombat companion joins initiative; benched companion does not
    expect(within(initCol).getByText('Wolfy')).toBeInTheDocument();
    expect(within(initCol).queryByText('Benchwarmer')).not.toBeInTheDocument();
    // saved encounters exist, so the Load Saved shortcut shows
    expect(screen.getByText('Load Saved')).toBeInTheDocument();
  });

  it('falls back to default party and templates when every fetch fails', async () => {
    global.fetch = vi.fn(async () => { throw new Error('network down'); });
    render(<CombatPage />);
    await settle();

    const { partyCol } = getColumns();
    for (const member of defaultPartyData) {
      expect(within(partyCol).getByText(member.name)).toBeInTheDocument();
    }
  });

  it('auto-saves party and templates (but not the untouched encounter) after load', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();

    expect(postCalls(fetchMock, '/api/party')).toHaveLength(1);
    expect(JSON.parse(postCalls(fetchMock, '/api/party')[0][1].body)).toEqual(party);
    expect(postCalls(fetchMock, '/api/templates')).toHaveLength(1);
    // enemies were loaded, not changed — no re-save of the encounter
    expect(postCalls(fetchMock, '/api/encounter')).toHaveLength(0);
  });
});

describe('CombatPage — initiative', () => {
  it('Sort by Init orders combatants by descending initiative', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    fireEvent.click(screen.getByText('Sort by Init'));

    const { initCol } = getColumns();
    const names = within(initCol)
      .getAllByText(/^(Theren|Mira|Ogre|Wolfy)$/)
      .map((el) => el.textContent.match(/^(Theren|Mira|Ogre|Wolfy)/)[0]);
    expect(names).toEqual(['Theren', 'Ogre', 'Wolfy', 'Mira']); // 15, 9, 8, 5
  });

  it('adding a lair action puts it in the initiative list', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    fireEvent.click(screen.getByText('+ Lair Action'));
    const { initCol } = getColumns();
    expect(within(initCol).getByText('Lair Action')).toBeInTheDocument();
    // the option disappears once one exists
    expect(screen.queryByText('+ Lair Action')).not.toBeInTheDocument();
  });
});

describe('CombatPage — party actions', () => {
  it('Rest restores all party resources to max and saves the party', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    fetchMock.mockClear();

    fireEvent.click(screen.getByText('Rest'));
    await act(async () => { vi.advanceTimersByTime(1100); });
    await flush();

    const saves = postCalls(fetchMock, '/api/party');
    expect(saves).toHaveLength(1);
    const saved = JSON.parse(saves[0][1].body);
    expect(saved.find((p) => p.id === 'p1').resources).toEqual([
      { id: 'r1', name: 'Focus Points', current: 3, max: 3 },
    ]);
  });
});

describe('CombatPage — enemies and encounters', () => {
  it('clearing enemies empties the list and DELETEs the persisted encounter', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();

    const { enemiesCol } = getColumns();
    // the trash button is the first button in the enemies header (icon-only)
    fireEvent.click(within(enemiesCol).getAllByRole('button')[0]);

    expect(within(enemiesCol).queryByText('Ogre')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([u, o]) => u === '/api/encounter' && o?.method === 'DELETE')).toBe(true);
  });

  it('loading a saved encounter instantiates numbered enemies from templates and saves', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    fetchMock.mockClear();

    fireEvent.click(screen.getByText('Load Saved'));
    fireEvent.click(screen.getByText('Goblin Ambush'));
    fireEvent.click(screen.getByText('Add to Combat')); // label because enemies already exist

    const { enemiesCol } = getColumns();
    expect(within(enemiesCol).getByText('Goblin 1')).toBeInTheDocument();
    expect(within(enemiesCol).getByText('Goblin 2')).toBeInTheDocument();
    expect(within(enemiesCol).getByText('Ogre')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(1100); });
    await flush();

    const saves = postCalls(fetchMock, '/api/encounter');
    expect(saves).toHaveLength(1);
    const savedState = JSON.parse(saves[0][1].body);
    expect(savedState.enemies.map((e) => e.name)).toEqual(['Ogre', 'Goblin 1', 'Goblin 2']);
    expect(savedState.enemies[1].maxHp).toBe(7);
    expect(savedState.enemies[1].currentHp).toBe(7); // spawned at full HP
  });
});
