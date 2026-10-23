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
  { id: 'p2', name: 'Mira', class: 'Cleric', level: 5, dex: 10, wis: 16, spellStat: 'wis', currentHp: 40, maxHp: 40, initiative: 5, ac: 18, acEffect: 'mageArmor',
    inventory: [
      { id: 'i1', name: 'Mace', itemType: 'weapon', equipped: true, description: 'A flanged mace.' },
      { id: 'i2', name: 'Holy Symbol', itemType: 'gear', equipped: true, description: 'Spellcasting focus.' },
      { id: 'i3', name: 'Dagger', itemType: 'weapon', equipped: false },
    ],
  },
];

const templates = [{ id: 't-ogre', name: 'Ogre', maxHp: 59, ac: 11, cr: '2', xp: 450 }];

const ogre = {
  id: 'enemy-1', name: 'Ogre', currentHp: 59, maxHp: 59, initiative: 9, cr: '2',
  speed: '40 ft., climb 20 ft.',
  traits: [
    { name: 'Legendary Resistance (3/Day)', description: 'Chooses to succeed instead.' },
    { name: 'Keen Smell', description: 'Advantage on smell checks.' },
  ],
  actions: [
    { name: 'Club', description: '+6 to hit, 13 (2d8+4) bludgeoning.' },
    { name: 'Rock Throw (Recharge 5-6)', description: 'Hurls a boulder.' },
  ],
  reactions: [{ name: 'Parry', description: '+2 AC against one melee attack.' }],
  notes: 'Spellcasting (DC 12, +4): 1st (2 slots): shield.',
  legendaryActions: [
    { name: 'Club Swing', description: 'One club attack.' },
    { name: 'Stomp (2 Actions)', description: 'DC 14 Str save or prone.' },
  ],
};

const jsonResponse = (data) => ({ ok: true, json: async () => data });

function mockFetch(encounter = { enemies: [ogre] }, partyData = party) {
  const routes = {
    '/api/party': jsonResponse(partyData),
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

// The initiative bar (Current Order button + TurnTracker) only renders on the
// Initiative tab (the default), above the combatant tables.
const initBar = () => document.querySelector('[data-testid="initiative-bar"]');
const tracker = () => initBar().children[1];
// The order only renders inside the Current Order modal now
const orderModal = () => screen.getByText('Initiative Order').closest('.fixed');

const click = (el) => act(() => { fireEvent.click(el); });

const openOrderModal = async () => {
  click(screen.getByText('Current Order'));
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
// "Up Next" shows ONLY the next combatant (title = their name); the full
// order lives in the modal the card opens.
const nextName = () => within(tracker()).getByTestId('up-next').title;
const reactionButton = (modal, name) =>
  within(within(modal).getByText(name).closest('[class*="rounded-lg"]')).getByText('Reaction');
const legendaryModal = () => screen.getByText(/Slot a creature in/).closest('.fixed');
const ogrePips = () => within(legendaryModal()).getAllByTitle(/^Ogre: legendary action/);
const openLegendary = async () => {
  click(within(tracker()).getByTitle('Slot in a legendary action'));
  await flush();
  return legendaryModal();
};
const economy = () => within(tracker()).getByText('This Turn').parentElement;
const speeds = () => within(tracker()).getByTestId('speeds').textContent;

const postCalls = (fetchMock, url) =>
  fetchMock.mock.calls.filter(([u, opts]) => u === url && opts?.method === 'POST');

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
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
    // Up Next lives in the header row beside the turn info
    expect(within(tracker()).getByTestId('up-next').closest('.text-xs')).toHaveTextContent(/Turn 1 \/ 4.*Up Next/);
    // only the next combatant is shown — the rest stays in the modal
    expect(within(tracker()).queryByText('Wolfy')).not.toBeInTheDocument();
  });

  it('the order opens only from Current Order above the tracker (no duplicate Full Order button)', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    expect(within(tracker()).queryByRole('button', { name: /Full Order/ })).not.toBeInTheDocument();
    click(screen.getByRole('button', { name: /Current Order/ }));
    await flush();
    const modal = orderModal();
    for (const name of ['Theren', 'Mira', 'Wolfy', 'Ogre']) {
      expect(within(modal).getByText(name)).toBeInTheDocument();
    }
    expect(within(modal).getByText('Round 1')).toBeInTheDocument();
  });

  it('Up Next wraps into the next round from the last combatant', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(screen.getByText('← Back')); // wraps to Ogre
    await flush();
    expect(nowName()).toBe('Ogre');
    expect(nextName()).toBe('Theren');
  });

  it('End Combat asks for confirmation and can be cancelled', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(within(tracker()).getByText('End Combat'));
    await flush();
    expect(within(tracker()).getByText('End combat and reset the round?')).toBeInTheDocument();

    // cancel keeps combat running
    click(within(tracker()).getByText('Cancel'));
    await flush();
    expect(nowName()).toBe('Theren');

    // confirming actually ends it
    click(within(tracker()).getByText('End Combat'));
    await flush();
    click(within(tracker()).getByText('End Combat')); // the red confirm button
    await flush();
    expect(screen.getByText('Start Combat')).toBeInTheDocument();
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

    click(screen.getByText('Current Order'));
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

    // the Initiative tab carries the Enemies section (as a table) under the tracker
    const enemiesCol = document.querySelector('main section[aria-label="Enemies"]');
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

  it('tracks legendary actions from the header button and refreshes them on the creature\'s turn', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    // no sprawling panel on the bar — just the header button
    expect(within(tracker()).queryByText('Legendary Actions')).not.toBeInTheDocument();

    let modal = await openLegendary();
    expect(within(modal).getByText('3/3')).toBeInTheDocument();
    click(ogrePips()[0]);
    await flush();
    expect(within(legendaryModal()).getByText('2/3')).toBeInTheDocument();
    // clicking a spent pip un-spends it
    click(ogrePips()[0]);
    await flush();
    expect(within(legendaryModal()).getByText('3/3')).toBeInTheDocument();
    click(ogrePips()[1]); // spends two
    await flush();
    expect(within(legendaryModal()).getByText('1/3')).toBeInTheDocument();
    // pips don't start an interrupt
    click(within(legendaryModal()).getByText('Cancel'));
    await flush();
    expect(nowName()).toBe('Theren');
    // the header button mirrors what's left
    expect(within(tracker()).getByTitle('Ogre: 1/3 left')).toBeInTheDocument();

    fetchMock.mockClear();
    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.enemies[0].legendaryActionsUsed).toBe(2);

    // Theren → Mira → Wolfy → Ogre: the Ogre's turn refreshes its budget
    for (let i = 0; i < 3; i++) click(screen.getByText('End Turn →'));
    await flush();
    expect(nowName()).toBe('Ogre');
    expect(within(tracker()).getByTitle('Ogre: 3/3 left')).toBeInTheDocument();
  });

  it('This Turn tracks action and bonus action, resetting on the next turn, and lists speeds', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    // movement is tracked at the table — no form, just the speeds
    expect(within(economy()).queryByLabelText('Feet moved this turn')).not.toBeInTheDocument();
    expect(within(economy()).queryByText('Dash')).not.toBeInTheDocument();
    expect(speeds()).toBe('Speed30 ft'); // no speed on the sheet → 30

    click(within(economy()).getByText('Action'));
    await flush();
    expect(within(economy()).getByText('Action')).toHaveAttribute('aria-pressed', 'true');
    expect(within(economy()).getByText('Bonus')).toHaveAttribute('aria-pressed', 'false');

    fetchMock.mockClear();
    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.turnUsage).toEqual({ id: 'p1', action: true, bonus: false });

    click(screen.getByText('End Turn →'));
    await flush();
    expect(nowName()).toBe('Mira');
    expect(within(economy()).getByText('Action')).toHaveAttribute('aria-pressed', 'false');
  });

  it('the This Turn reaction is the same toggle as the order modal\'s', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(within(economy()).getByText('Reaction'));
    await flush();
    const modal = await openOrderModal();
    expect(reactionButton(modal, 'Theren')).toHaveAttribute('aria-pressed', 'true');
  });

  it('lists a monster\'s abilities on its turn and tracks limited uses', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    // party turn: no monster panel
    expect(within(tracker()).queryByText('Club')).not.toBeInTheDocument();

    click(screen.getByText('← Back')); // Ogre
    await flush();
    expect(nowName()).toBe('Ogre');
    // every movement mode is listed
    expect(speeds()).toBe('Speed40 ftclimb 20 ft');

    // actions / reactions as chips, usage parenthetical stripped
    expect(within(tracker()).getByText('Club')).toBeInTheDocument();
    expect(within(tracker()).getByText('Parry')).toBeInTheDocument();
    // passive traits are not listed; limited-use traits are tracked
    expect(within(tracker()).queryByText('Keen Smell')).not.toBeInTheDocument();
    // limited uses are pips like spell slots; a recharge ability gets one
    expect(within(tracker()).getAllByTitle(/^Legendary Resistance: use/)).toHaveLength(3);
    expect(within(tracker()).getAllByTitle(/^Rock Throw: use/)).toHaveLength(1);
    // spell slots parsed from the stat block
    expect(within(tracker()).getAllByTitle(/^1st-level slots: use/)).toHaveLength(2);

    // pick an ability → its text + Use spends the action and the recharge
    click(within(tracker()).getAllByText('Rock Throw')[0]);
    await flush();
    expect(within(tracker()).getByText(/Hurls a boulder/)).toBeInTheDocument();
    click(within(tracker()).getByText('Use (Action)'));
    await flush();
    expect(within(economy()).getByText('Action')).toHaveAttribute('aria-pressed', 'true');
    // a spent recharge ability offers Recharge instead of a disabled Spent
    expect(within(tracker()).queryByText('Spent')).not.toBeInTheDocument();
    expect(within(tracker()).getByText('Recharge')).not.toBeDisabled();

    expect(within(tracker()).getByTitle('Rock Throw: use 1 (spent)')).toHaveAttribute('aria-pressed', 'true');
    expect(within(tracker()).queryByText('Roll')).not.toBeInTheDocument();

    // recharged at the table: the Recharge button restores it
    click(within(tracker()).getByText('Recharge'));
    await flush();
    expect(within(tracker()).getByText('Use (Action)')).not.toBeDisabled();

    // a reaction ability spends the reaction
    click(within(tracker()).getByText('Parry'));
    await flush();
    click(within(tracker()).getByText('Use (Reaction)'));
    await flush();
    expect(within(economy()).getByText('Reaction')).toHaveAttribute('aria-pressed', 'true');

    // limited-use pips persist on the enemy
    click(within(tracker()).getByTitle('Legendary Resistance: use 1'));
    click(within(tracker()).getAllByTitle(/^1st-level slots: use/)[0]);
    fetchMock.mockClear();
    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.enemies[0].abilityUses).toEqual({ 'Rock Throw (Recharge 5-6)': 0, 'Legendary Resistance (3/Day)': 1 });
    expect(body.enemies[0].spellSlots1stUsed).toBe(1);
  });

  it('Expand shows every ability in full with its own Use button, and the choice sticks', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(screen.getByText('← Back')); // Ogre
    await flush();

    expect(within(tracker()).queryByTestId('abilities-expanded')).not.toBeInTheDocument();
    click(within(tracker()).getByRole('button', { name: /Expand/ }));
    await flush();
    const panel = within(tracker()).getByTestId('abilities-expanded');
    expect(localStorage.getItem('dm-combat-abilities-expanded')).toBe('1');

    // full text without clicking, numbers highlighted
    expect(within(panel).getByText('+6 to hit')).toHaveClass('text-amber-300');
    expect(within(panel).getByText('13 (2d8+4)')).toHaveClass('text-red-300');
    expect(within(panel).getByText(/Hurls a boulder/)).toBeInTheDocument();
    // traits too — passive ones (no Use) and limited ones (Use, uses left)
    const traits = within(panel).getByRole('region', { name: 'Traits' });
    expect(within(traits).getByText(/Advantage on smell checks/)).toBeInTheDocument();
    expect(within(traits).getByText('3/3 left')).toBeInTheDocument();
    expect(within(traits).getAllByRole('button')).toHaveLength(1);

    // a row's Use spends its economy slot
    const parryRow = within(panel).getByText(/against one melee attack/).closest('li');
    click(within(parryRow).getByText('Use (Reaction)'));
    await flush();
    expect(within(economy()).getByText('Reaction')).toHaveAttribute('aria-pressed', 'true');

    click(within(tracker()).getByRole('button', { name: /Collapse/ }));
    await flush();
    expect(within(tracker()).queryByTestId('abilities-expanded')).not.toBeInTheDocument();
    expect(localStorage.getItem('dm-combat-abilities-expanded')).toBe('0');
  });

  it('restores the expanded abilities view from localStorage', async () => {
    localStorage.setItem('dm-combat-abilities-expanded', '1');
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(screen.getByText('← Back')); // Ogre
    await flush();
    expect(within(tracker()).getByTestId('abilities-expanded')).toBeInTheDocument();
    expect(within(tracker()).getByRole('button', { name: /Collapse/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('spending a legendary action from the interrupt charges its cost', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(screen.getByTitle('Slot in a legendary action'));
    await flush();
    click(screen.getByText('2 legendary actions'));
    await flush();

    click(within(tracker()).getByText('Stomp (2 Actions)'));
    await flush();
    expect(within(tracker()).getByText('1/3')).toBeInTheDocument();
    // only one action left: Stomp is no longer affordable, Club Swing is
    expect(within(tracker()).getByText('Stomp (2 Actions)').closest('button')).toBeDisabled();
    expect(within(tracker()).getByText('Club Swing').closest('button')).not.toBeDisabled();
  });

  it('reactions are ticked off in the order modal and refresh on that combatant\'s turn', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    let modal = await openOrderModal();
    click(reactionButton(modal, 'Theren'));
    click(reactionButton(modal, 'Ogre'));
    await flush();
    expect(reactionButton(modal, 'Theren')).toHaveAttribute('aria-pressed', 'true');
    // toggling the reaction does not move the turn pointer
    click(within(modal).getByText('Done'));
    await flush();
    expect(nowName()).toBe('Theren');

    fetchMock.mockClear();
    await act(async () => { vi.advanceTimersByTime(1100); });
    const body = JSON.parse(postCalls(fetchMock, '/api/encounter').at(-1)[1].body);
    expect(body.reactionsUsed).toEqual({ p1: true, 'enemy-1': true });

    // walk to the Ogre; Back onto Wolfy does NOT refresh anything, but the
    // Ogre's own turn does
    for (let i = 0; i < 3; i++) click(screen.getByText('End Turn →'));
    await flush();
    expect(nowName()).toBe('Ogre');
    modal = await openOrderModal();
    expect(reactionButton(modal, 'Ogre')).toHaveAttribute('aria-pressed', 'false');
    expect(reactionButton(modal, 'Theren')).toHaveAttribute('aria-pressed', 'true');
    click(within(modal).getByText('Done'));
    await flush();

    // Theren's turn comes back around in round 2 → refreshed
    click(screen.getByText('End Turn →'));
    await flush();
    expect(nowName()).toBe('Theren');
    modal = await openOrderModal();
    expect(reactionButton(modal, 'Theren')).toHaveAttribute('aria-pressed', 'false');
  });

  it('stepping Back onto a combatant does not refresh their reaction', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    click(screen.getByText('End Turn →')); // Mira
    await flush();
    const modal = await openOrderModal();
    click(reactionButton(modal, 'Theren'));
    click(within(modal).getByText('Done'));
    await flush();

    click(screen.getByText('← Back')); // back to Theren
    await flush();
    expect(nowName()).toBe('Theren');
    expect(reactionButton(await openOrderModal(), 'Theren')).toHaveAttribute('aria-pressed', 'true');
  });

  it('limited abilities are pips: click to spend, click a spent pip to restore', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(screen.getByText('← Back')); // Ogre
    await flush();

    // single-use recharge ability: one pip, no dice roll
    const rock = () => within(tracker()).getByTitle(/^Rock Throw: use 1/);
    expect(within(tracker()).queryByText('Roll')).not.toBeInTheDocument();
    expect(within(tracker()).getByText('Recharge 5+')).toBeInTheDocument();
    click(rock());
    await flush();
    expect(rock()).toHaveAttribute('aria-pressed', 'true');
    expect(rock()).toHaveAttribute('title', 'Rock Throw: use 1 (spent)');
    click(rock());
    await flush();
    expect(rock()).toHaveAttribute('aria-pressed', 'false');

    // 3/Day = three pips, spent left to right
    const lr = () => within(tracker()).getAllByTitle(/^Legendary Resistance: use/);
    const spent = () => lr().filter(p => p.getAttribute('aria-pressed') === 'true').length;
    click(lr()[0]);
    await flush();
    click(lr()[1]);
    await flush();
    expect(spent()).toBe(2);
    click(lr()[2]);
    await flush();
    expect(spent()).toBe(3);
    // clicking a spent pip restores it and everything after it
    click(lr()[0]);
    await flush();
    expect(spent()).toBe(0);
  });

  it('the Now card carries the combatant\'s card buttons, and Escape closes their modal', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    // party member: the same contextual buttons as their card
    const nowCard = within(tracker()).getByText('Now').parentElement;
    click(within(nowCard).getByRole('button', { name: 'Character Sheet' }));
    await flush();
    expect(screen.getByText('Ability Scores')).toBeInTheDocument();
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    await flush();
    expect(screen.queryByText('Ability Scores')).not.toBeInTheDocument();

    // enemy turn: stat block / notes / quick actions instead
    click(screen.getByText('← Back')); // Ogre
    await flush();
    const ogreCard = within(tracker()).getByText('Now').parentElement;
    expect(within(ogreCard).queryByRole('button', { name: 'Character Sheet' })).not.toBeInTheDocument();
    expect(within(ogreCard).getByRole('button', { name: 'View Stat Block' })).toBeInTheDocument();
    expect(within(ogreCard).getByRole('button', { name: 'Quick Actions' })).toBeInTheDocument();
  });

  it('companions get no card buttons on the Now card', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(screen.getByText('End Turn →'));
    click(screen.getByText('End Turn →')); // Wolfy
    await flush();
    expect(nowName()).toBe('Wolfy');
    const nowCard = within(tracker()).getByText('Now').parentElement;
    // the name (opens the detail drawer) is the only button
    expect(within(nowCard).getAllByRole('button').map(b => b.title)).toEqual(['Show full details']);
  });

  it('party members show spell DC / to-hit and their equipped weapons and gear', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    // Theren has no spellcasting stat → no spells line
    expect(within(tracker()).queryByTestId('spellcasting')).not.toBeInTheDocument();

    click(screen.getByText('End Turn →')); // Mira: cleric 5, WIS 16 → DC 14, +6
    await flush();
    expect(within(tracker()).getByTestId('spellcasting')).toHaveTextContent('SpellsDC 14+6 to hit');

    // equipped weapon with sheet math (STR 10 → +0, prof +3), equipped gear;
    // the unequipped dagger stays off
    const mace = within(economy()).getByTitle('A flanged mace.');
    expect(mace).toHaveTextContent('Mace+3 to hit1d6 bludgeoning');
    expect(within(economy()).getByTitle('Spellcasting focus.')).toHaveTextContent('Holy Symbol');
    expect(within(economy()).queryByText('Dagger')).not.toBeInTheDocument();
  });

  it('Expand on a party turn lists attacks, castable spells with slots, and resources', async () => {
    // Mira as a prepared caster with slots, spells and a resource
    const caster = {
      ...party[1],
      resources: [
        { id: 'r1', name: '1st Level Spell Slots', current: 1, max: 2 },
        { id: 'r2', name: '2nd Level Spell Slots', current: 1, max: 1 },
        { id: 'r3', name: 'Channel Divinity', current: 2, max: 2 },
      ],
      features: [{ id: 'f1', name: 'Channel Divinity', description: 'Turn Undead or Divine Spark.' }],
      spells: [
        { id: 's1', name: 'Sacred Flame', level: 0, castTime: 'Action', range: '60 feet', description: 'DC Dexterity save or 1d8 radiant damage.' },
        { id: 's2', name: 'Healing Word', level: 1, castTime: 'Bonus Action', range: '60 feet', prepared: true, description: 'Regain 2d4 hit points.' },
        { id: 's3', name: 'Spiritual Weapon', level: 2, castTime: 'Bonus Action', range: '60 feet', prepared: true, concentration: true, description: 'Deals 1d8 force damage.' },
        { id: 's4', name: 'Bless', level: 1, castTime: 'Action', prepared: false, description: 'Not prepared today.' },
        { id: 's5', name: 'Shield of Faith', level: 1, castTime: 'Bonus Action', prepared: true, description: '+2 AC.' },
        { id: 's6', name: 'Ceremony', level: 1, castTime: '1 hour', prepared: true, description: 'Out of combat.' },
      ],
    };
    const fetchMock = mockFetch(undefined, [party[0], caster]);
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(screen.getByText('End Turn →')); // Mira
    await flush();

    // collapsed: the kit chips as before, plus the toggle
    expect(within(economy()).getByTitle('A flanged mace.')).toBeInTheDocument();
    click(within(economy()).getByRole('button', { name: /Expand/ }));
    await flush();
    const panel = within(tracker()).getByTestId('party-expanded');

    // attacks: sheet math, Attack spends the Action
    const attacks = within(panel).getByRole('region', { name: 'Attacks' });
    expect(within(attacks).getByText('+3 to hit')).toBeInTheDocument();
    expect(within(attacks).getByText('1d6+0 bludgeoning')).toBeInTheDocument();
    click(within(attacks).getByText('Attack (Action)'));
    await flush();
    expect(within(economy()).getByRole('button', { name: 'Action' })).toHaveAttribute('aria-pressed', 'true');

    // spells: unprepared and long-cast spells are left out; grouped by economy
    const spellsBox = within(panel).getByRole('region', { name: 'Spells' });
    expect(within(spellsBox).getByText('Sacred Flame')).toBeInTheDocument();
    expect(within(spellsBox).queryByText('Bless')).not.toBeInTheDocument();
    expect(within(spellsBox).queryByText('Ceremony')).not.toBeInTheDocument();
    expect(within(spellsBox).getByText('1d8 force damage')).toHaveClass('text-red-300');

    // Cast a 1st-level spell: spends the bonus action and the last 1st slot
    fetchMock.mockClear();
    const healRow = within(spellsBox).getByText('Healing Word').closest('li');
    click(within(healRow).getByText('Cast (Bonus Action)'));
    await flush();
    expect(within(economy()).getByRole('button', { name: 'Bonus' })).toHaveAttribute('aria-pressed', 'true');
    await act(async () => { vi.advanceTimersByTime(1100); });
    let saved = JSON.parse(postCalls(fetchMock, '/api/party').at(-1)[1].body).find(p => p.id === 'p2');
    expect(saved.resources.find(r => r.id === 'r1').current).toBe(0);

    // the next 1st-level cast upcasts into the 2nd-level slot; then no slots left
    const shieldRow = within(spellsBox).getByText('Shield of Faith').closest('li');
    click(within(shieldRow).getByText('Cast (Bonus Action)'));
    await act(async () => { vi.advanceTimersByTime(1100); });
    saved = JSON.parse(postCalls(fetchMock, '/api/party').at(-1)[1].body).find(p => p.id === 'p2');
    expect(saved.resources.find(r => r.id === 'r2').current).toBe(0);
    expect(within(shieldRow).getByText('No slots')).toBeDisabled();
    // cantrips never need a slot
    expect(within(within(spellsBox).getByText('Sacred Flame').closest('li')).getByText('Cast (Action)')).not.toBeDisabled();

    // other resources as pips with the matching feature text
    const resources = within(panel).getByRole('region', { name: 'Resources' });
    expect(within(resources).getAllByRole('button', { name: 'Spend Channel Divinity' })).toHaveLength(2);
    expect(within(resources).getByText('Turn Undead or Divine Spark.')).toBeInTheDocument();
    // gear stays as a chip; the weapon isn't repeated as one
    expect(within(panel).getByTitle('Spellcasting focus.')).toBeInTheDocument();
    expect(within(panel).queryByTitle('A flanged mace.')).not.toBeInTheDocument();
  });

  it('clicking a weapon opens what it does, with the to-hit breakdown; Escape closes it', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(screen.getByText('End Turn →')); // Mira
    await flush();

    click(within(economy()).getByTitle('A flanged mace.'));
    await flush();
    const modal = screen.getByRole('heading', { name: 'Mace' }).closest('.fixed');
    expect(within(modal).getByText('STR +0 + Prof +3')).toBeInTheDocument();
    expect(within(modal).getByText('A flanged mace.')).toBeInTheDocument();
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    await flush();
    expect(screen.queryByRole('heading', { name: 'Mace' })).not.toBeInTheDocument();

    // gear opens too (description only, no attack block)
    click(within(economy()).getByTitle('Spellcasting focus.'));
    await flush();
    const gear = screen.getByRole('heading', { name: 'Holy Symbol' }).closest('.fixed');
    expect(within(gear).queryByText('To Hit')).not.toBeInTheDocument();
  });

  it('monsters get no party loadout or party spell line', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(screen.getByText('← Back')); // Ogre
    await flush();
    expect(within(tracker()).queryByTestId('spellcasting')).not.toBeInTheDocument();
    expect(within(economy()).queryByText('Weapons')).not.toBeInTheDocument();
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

  it('restores spent reactions from the saved encounter', async () => {
    mockFetch({
      enemies: [ogre],
      combatActive: true,
      round: 2,
      turnIndex: 0,
      turnId: 'p1',
      reactionsUsed: { p2: true },
    });
    render(<CombatPage />);
    await settle();

    const modal = await openOrderModal();
    expect(reactionButton(modal, 'Mira')).toHaveAttribute('aria-pressed', 'true');
    expect(reactionButton(modal, 'Theren')).toHaveAttribute('aria-pressed', 'false');
  });
});
