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

// Layout: main.children[0] is the initiative bar (header + TurnTracker);
// below it a tab strip (Party & Allies | Enemies | Table) shows the matching
// <section>s — Party by default, only the Table tab shows both.
const showTab = (name) => fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${name}`) }));
const getColumns = () => {
  const main = document.querySelector('main');
  // (jsdom's selector engine trips on the "&" in an attribute selector)
  const section = (label) => [...main.querySelectorAll('section')].find(el => el.getAttribute('aria-label') === label) || null;
  return { initCol: main.children[0], partyCol: section('Party & Allies'), enemiesCol: section('Enemies') };
};

const postCalls = (fetchMock, url) =>
  fetchMock.mock.calls.filter(([u, opts]) => u === url && opts?.method === 'POST');

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear(); // the selected tab persists per viewer — don't leak it between tests
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

    const { partyCol, enemiesCol } = getColumns();
    expect(within(partyCol).getByText('Theren')).toBeInTheDocument();
    expect(within(partyCol).getByText('Mira')).toBeInTheDocument();
    expect(enemiesCol).toBeNull(); // Party tab is the default
    showTab('Enemies');
    expect(within(getColumns().enemiesCol).getByText('Ogre')).toBeInTheDocument();
    // the order (incl. companions) lives in the Manage Order modal;
    // active + inCombat companion joins initiative, benched companion does not
    fireEvent.click(screen.getByText('Manage Order'));
    expect(screen.getByText('Wolfy')).toBeInTheDocument();
    expect(screen.queryByText('Benchwarmer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Done'));
    // the Enemies encounter bar: real buttons, labelled for an existing fight
    expect(screen.getByRole('button', { name: 'Load Encounter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Lair Action' })).toBeInTheDocument();
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

  it('does not echo loaded data back to the API after load', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();

    expect(postCalls(fetchMock, '/api/party')).toHaveLength(0);
    expect(postCalls(fetchMock, '/api/templates')).toHaveLength(0);
    expect(postCalls(fetchMock, '/api/encounter')).toHaveLength(0);
  });

  it('the party Add button opens the Add Party Member modal', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    const { partyCol } = getColumns();
    fireEvent.click(within(partyCol).getByText('Add'));
    expect(screen.getByText('Add Party Member')).toBeInTheDocument();
  });
});

describe('CombatPage — initiative', () => {
  it('Sort by Init orders combatants by descending initiative', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    // The order only renders inside the Manage Order modal; the main column
    // is the turn tracker.
    fireEvent.click(screen.getByText('Manage Order'));
    fireEvent.click(screen.getByText('Sort by Init'));

    const modal = screen.getByText('Initiative Order').closest('.fixed');
    const names = within(modal)
      .getAllByText(/^(Theren|Mira|Ogre|Wolfy)$/)
      .map((el) => el.textContent.match(/^(Theren|Mira|Ogre|Wolfy)/)[0]);
    expect(names).toEqual(['Theren', 'Ogre', 'Wolfy', 'Mira']); // 15, 9, 8, 5
  });

  it('adding lair actions puts them in the initiative order; several get numbered', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    showTab('Enemies'); // the lair-action shortcut lives in the Enemies section
    fireEvent.click(screen.getByRole('button', { name: 'Add Lair Action' }));
    // it shows up right there in the Enemies section (it used to vanish into
    // the Manage Order modal only)
    const enemiesSection = screen.getByRole('region', { name: 'Enemies' });
    expect(within(enemiesSection).getByText('Lair Action')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Manage Order'));
    const modal = screen.getByText('Initiative Order').closest('.fixed');
    expect(within(modal).getByText('Lair Action')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Done'));
    // the option stays: an encounter can hold several lair actions
    fireEvent.click(screen.getByRole('button', { name: 'Add Lair Action' }));
    expect(within(enemiesSection).getByText('Lair Action 1')).toBeInTheDocument();
    expect(within(enemiesSection).getByText('Lair Action 2')).toBeInTheDocument();
    expect(within(enemiesSection).queryByText('Lair Action')).not.toBeInTheDocument();
  });

  it('reads a legacy single lairAction from the saved fight and saves it back as lairActions', async () => {
    const fetchMock = mockFetch({
      '/api/encounter': jsonResponse({ ...activeEncounter, lairAction: { initiative: 20, notes: 'Old style' } }),
    });
    render(<CombatPage />);
    await settle();
    showTab('Enemies');
    expect(within(screen.getByRole('region', { name: 'Enemies' })).getByText('Old style')).toBeInTheDocument();
    fetchMock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Add Lair Action' }));
    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.lairAction).toBeUndefined();
    expect(body.lairActions).toHaveLength(2);
    // keeps the old fixed initiative id so a saved order still finds it
    expect(body.lairActions[0]).toEqual({ id: 'lair-action', initiative: 20, notes: 'Old style' });
  });

  it('the Enemies section lair card edits notes and initiative, and removes it', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    fetchMock.mockClear();

    showTab('Enemies');
    fireEvent.click(screen.getByRole('button', { name: 'Add Lair Action' }));
    const section = () => screen.getByRole('region', { name: 'Enemies' });
    fireEvent.click(within(section()).getByText('Click to add description...'));
    const notes = within(section()).getByPlaceholderText('Describe the lair action...');
    fireEvent.change(notes, { target: { value: 'Magma erupts' } });
    fireEvent.blur(notes);
    fireEvent.click(within(section()).getByText('20'));
    const init = within(section()).getByDisplayValue('20');
    fireEvent.change(init, { target: { value: '18' } });
    fireEvent.blur(init);
    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.lairActions).toEqual([{ id: expect.stringMatching(/^lair-/), initiative: 18, notes: 'Magma erupts' }]);

    fireEvent.click(within(section()).getByLabelText('Remove Lair Action'));
    expect(within(section()).queryByLabelText('Remove Lair Action')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Lair Action' })).toBeInTheDocument();
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

    showTab('Enemies');
    const { enemiesCol } = getColumns();
    fireEvent.click(within(enemiesCol).getByLabelText('Clear encounter'));

    expect(within(enemiesCol).queryByText('Ogre')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([u, o]) => u === '/api/encounter' && o?.method === 'DELETE')).toBe(true);
  });

  it('loading a saved encounter instantiates numbered enemies from templates and saves', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    fetchMock.mockClear();

    showTab('Enemies');
    fireEvent.click(screen.getByText('Load Encounter'));
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

describe('CombatPage — Party / Enemies / Table tabs', () => {

  it('defaults to the Party tab and each tab shows only its own cards', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    expect(screen.getByRole('tab', { name: /^Party & Allies/ })).toHaveAttribute('aria-selected', 'true');
    expect(getColumns().partyCol).not.toBeNull();
    expect(getColumns().enemiesCol).toBeNull();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    showTab('Enemies');
    expect(screen.getByRole('tab', { name: /^Enemies/ })).toHaveAttribute('aria-selected', 'true');
    expect(getColumns().partyCol).toBeNull();
    expect(within(getColumns().enemiesCol).getByText('Ogre')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(localStorage.getItem('dm-combat-view-mode')).toBe('enemies');
  });

  it('tab labels carry party and enemy counts', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    expect(screen.getByRole('tab', { name: /^Party & Allies/ })).toHaveTextContent('Party & Allies2');
    expect(screen.getByRole('tab', { name: /^Enemies/ })).toHaveTextContent('Enemies1');
  });

  it('the Table tab shows party and enemy tables together', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();

    showTab('Table');
    const { partyCol, enemiesCol } = getColumns();
    const partyTable = within(partyCol).getByRole('table', { name: 'Party table' });
    expect(within(partyTable).getByText('Theren')).toBeInTheDocument();
    expect(within(partyTable).getByText('Mira')).toBeInTheDocument();
    const enemyTable = within(enemiesCol).getByRole('table', { name: 'Enemies table' });
    expect(within(enemyTable).getByText('Ogre')).toBeInTheDocument();
    expect(localStorage.getItem('dm-combat-view-mode')).toBe('table');

    showTab('Party & Allies');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(localStorage.getItem('dm-combat-view-mode')).toBe('party');
  });

  it('restores the saved tab on load without echoing a save', async () => {
    localStorage.setItem('dm-combat-view-mode', 'table');
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();

    expect(screen.getByRole('tab', { name: /^Table/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('table', { name: 'Party table' })).toBeInTheDocument();
    expect(postCalls(fetchMock, '/api/party')).toHaveLength(0);
    expect(postCalls(fetchMock, '/api/encounter')).toHaveLength(0);
  });

  it('the legacy "cards" value falls back to the Party tab', async () => {
    localStorage.setItem('dm-combat-view-mode', 'cards');
    mockFetch();
    render(<CombatPage />);
    await settle();
    expect(screen.getByRole('tab', { name: /^Party & Allies/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('an HP edit in the table auto-saves the party like a card edit', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    showTab('Table');
    fetchMock.mockClear();

    fireEvent.click(screen.getByLabelText('Current HP for Theren'));
    const input = screen.getByLabelText('Current HP for Theren');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await act(async () => { vi.advanceTimersByTime(1100); });
    await flush();

    const saves = postCalls(fetchMock, '/api/party');
    expect(saves).toHaveLength(1);
    expect(JSON.parse(saves[0][1].body).find((p) => p.id === 'p1').currentHp).toBe(10);
  });

  it('falls back to the Party tab when localStorage throws', async () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    mockFetch();
    render(<CombatPage />);
    await settle();
    expect(screen.getByRole('tab', { name: /^Party & Allies/ })).toHaveAttribute('aria-selected', 'true');
    spy.mockRestore();
  });
});

describe('CombatPage — conditions', () => {
  it('a condition added from a party card persists through the party auto-save', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    fetchMock.mockClear();

    fireEvent.click(screen.getByLabelText('Add condition to Theren'));
    fireEvent.click(screen.getByRole('button', { name: /Restrained/ }));
    fireEvent.click(screen.getByText('Done'));
    await act(async () => { vi.advanceTimersByTime(1100); });
    await flush();

    const saves = postCalls(fetchMock, '/api/party');
    expect(saves).toHaveLength(1);
    expect(JSON.parse(saves[0][1].body).find((p) => p.id === 'p1').conditions).toEqual([{ name: 'Restrained' }]);
  });

  it('removing an enemy condition chip persists through the encounter auto-save', async () => {
    const fetchMock = mockFetch({
      '/api/encounter': jsonResponse({ enemies: [{ ...activeEncounter.enemies[0], conditions: [{ name: 'Prone' }] }] }),
    });
    render(<CombatPage />);
    await settle();
    showTab('Enemies');
    fetchMock.mockClear();

    fireEvent.click(screen.getByLabelText('Remove Prone from Ogre'));
    await act(async () => { vi.advanceTimersByTime(1100); });
    await flush();

    const saves = postCalls(fetchMock, '/api/encounter');
    expect(saves).toHaveLength(1);
    expect(JSON.parse(saves[0][1].body).enemies[0].conditions).toEqual([]);
  });
});

describe('CombatPage — duplicate enemy', () => {
  it('Duplicate adds a fresh copy right after the original, in the cards and a manual order, and saves', async () => {
    const fetchMock = mockFetch({
      '/api/encounter': jsonResponse({
        enemies: [
          { id: 'enemy-1', name: 'Ogre', currentHp: 20, maxHp: 59, initiative: 9, cr: '2', conditions: [{ name: 'Prone' }] },
          { id: 'enemy-2', name: 'Goblin', currentHp: 7, maxHp: 7, initiative: 14 },
        ],
        initiativeOrder: ['enemy-2', 'enemy-1'],
      }),
    });
    render(<CombatPage />);
    await settle();
    fetchMock.mockClear();
    showTab('Enemies');
    fireEvent.click(screen.getByLabelText('More actions for Ogre'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(screen.getByLabelText('More actions for Ogre 2')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.enemies.map(e => e.name)).toEqual(['Ogre 1', 'Ogre 2', 'Goblin']);
    const copy = body.enemies[1];
    expect(copy).toMatchObject({ currentHp: 59, maxHp: 59, initiative: 9 });
    expect(copy.conditions).toBeUndefined();
    expect(body.initiativeOrder).toEqual(['enemy-2', 'enemy-1', copy.id]);
  });
});

describe('CombatPage — enemy numbering', () => {
  it('numbers same-named enemies already in the saved fight', async () => {
    mockFetch({
      '/api/encounter': jsonResponse({ enemies: [
        { id: 'enemy-1', name: 'Goblin Boss', currentHp: 21, maxHp: 21 },
        { id: 'enemy-2', name: 'Goblin Boss', currentHp: 21, maxHp: 21 },
      ] }),
    });
    render(<CombatPage />);
    await settle();
    showTab('Enemies');
    expect(screen.getByLabelText('More actions for Goblin Boss 1')).toBeInTheDocument();
    expect(screen.getByLabelText('More actions for Goblin Boss 2')).toBeInTheDocument();
  });

  it('Add to Combat numbers new monsters past the ones already fighting', async () => {
    const fetchMock = mockFetch({ '/api/encounter': jsonResponse({ enemies: [] }) });
    render(<CombatPage />);
    await settle();
    showTab('Enemies');
    for (const confirm of ['Load Encounter', 'Add to Combat']) {
      fireEvent.click(screen.getByRole('button', { name: 'Load Encounter' }));
      fireEvent.click(screen.getByText('Goblin Ambush', { selector: 'span' }));
      // the modal's confirm button is the last one with that name
      fireEvent.click(screen.getAllByRole('button', { name: confirm }).at(-1));
    }
    fetchMock.mockClear();
    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.enemies.map(e => e.name)).toEqual(['Goblin 1', 'Goblin 2', 'Goblin 3', 'Goblin 4']);
  });
});

describe('CombatPage — encounter bar', () => {
  it('splits into the encounter bar (name + Load Encounter) and an actions bar (Clear, Add Lair Action, Add Monster)', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    showTab('Enemies');
    const bar = screen.getByTestId('encounter-name').parentElement;
    expect(within(bar).getByRole('button', { name: 'Load Encounter' })).toBeInTheDocument();
    expect(within(bar).queryByRole('button', { name: 'Add Monster' })).not.toBeInTheDocument();
    const actions = screen.getByRole('toolbar', { name: 'Encounter actions' });
    expect(within(actions).getAllByRole('button').map(b => b.textContent)).toEqual(['Clear', 'Add Lair Action', 'Add Monster']);
  });

  const lairEncounter = {
    id: 'enc-2', name: 'Dragon Lair',
    monsters: [{ id: 'm2', templateId: 't-ogre', name: 'Ogre', quantity: 1 }],
    lairActions: [{ id: 'lair-saved', initiative: 20, notes: 'The ceiling collapses' }],
  };
  const encounterName = () => screen.getByTestId('encounter-name').textContent;

  it('names an existing fight with no saved source "Unsaved encounter" (not a link)', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    showTab('Enemies');
    expect(encounterName()).toBe('EncounterUnsaved encounter');
    expect(within(screen.getByTestId('encounter-name')).queryByRole('link')).not.toBeInTheDocument();
  });

  it('Replace Enemies swaps in a saved encounter with its lair action, names it (the name links to its editor), and saves', async () => {
    const fetchMock = mockFetch({ '/api/encounters': jsonResponse([...savedEncounters, lairEncounter]) });
    render(<CombatPage />);
    await settle();
    fetchMock.mockClear();

    showTab('Enemies');
    fireEvent.click(screen.getByText('Load Encounter'));
    expect(screen.getByText('Lair action')).toBeInTheDocument(); // chip in the picker
    fireEvent.click(screen.getByText('Dragon Lair'));
    fireEvent.click(screen.getByText('Replace Enemies'));

    expect(encounterName()).toBe('EncounterDragon Lair');
    expect(screen.getByRole('link', { name: 'Dragon Lair' })).toHaveAttribute('href', '/encounters?edit=enc-2&from=combat');
    const section = screen.getByRole('region', { name: 'Enemies' });
    expect(within(section).getByText('The ceiling collapses')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.enemies.map(e => e.name)).toEqual(['Ogre']);
    expect(body.enemies[0].id).not.toBe('enemy-1'); // the old Ogre is gone
    // fresh id per load, so loading the same encounter twice can't collide
    expect(body.lairActions).toEqual([{ id: expect.stringMatching(/^lair-/), initiative: 20, notes: 'The ceiling collapses' }]);
    expect(body.lairActions[0].id).not.toBe('lair-saved');
    expect(body.loadedEncounter).toEqual({ id: 'enc-2', name: 'Dragon Lair' });
  });

  it('Add to Combat appends its lair actions to the existing ones and keeps the first loaded name', async () => {
    mockFetch({
      '/api/encounter': jsonResponse({ ...activeEncounter, lairAction: { initiative: 10, notes: 'Mine' }, loadedEncounter: { id: 'enc-1', name: 'Goblin Ambush' } }),
      '/api/encounters': jsonResponse([...savedEncounters, lairEncounter]),
    });
    render(<CombatPage />);
    await settle();
    showTab('Enemies');
    expect(encounterName()).toBe('EncounterGoblin Ambush');
    fireEvent.click(screen.getByText('Load Encounter'));
    fireEvent.click(screen.getByText('Dragon Lair'));
    fireEvent.click(screen.getByText('Add to Combat'));
    const section = screen.getByRole('region', { name: 'Enemies' });
    expect(within(section).getByText('Mine')).toBeInTheDocument();
    expect(within(section).getByText('The ceiling collapses')).toBeInTheDocument();
    expect(encounterName()).toBe('EncounterGoblin Ambush');
  });

  it('shows the library\'s current name; a deleted source keeps its stored name but is no longer an edit link', async () => {
    mockFetch({
      '/api/encounter': jsonResponse({ ...activeEncounter, loadedEncounter: { id: 'enc-1', name: 'Old Name' } }),
    });
    const { unmount } = render(<CombatPage />);
    await settle();
    showTab('Enemies');
    expect(encounterName()).toBe('EncounterGoblin Ambush');
    unmount();

    mockFetch({
      '/api/encounter': jsonResponse({ ...activeEncounter, loadedEncounter: { id: 'gone', name: 'Old Name' } }),
    });
    render(<CombatPage />);
    await settle();
    expect(encounterName()).toBe('EncounterOld Name');
    expect(screen.queryByRole('link', { name: 'Old Name' })).not.toBeInTheDocument();
  });

  it('Clear resets the bar to "None loaded"', async () => {
    mockFetch({
      '/api/encounter': jsonResponse({ ...activeEncounter, loadedEncounter: { id: 'enc-1', name: 'Goblin Ambush' } }),
    });
    render(<CombatPage />);
    await settle();
    showTab('Enemies');
    fireEvent.click(screen.getByLabelText('Clear encounter'));
    expect(encounterName()).toBe('EncounterNone loaded');
    expect(screen.getByRole('button', { name: 'Load Encounter' })).toBeInTheDocument();
  });
});
