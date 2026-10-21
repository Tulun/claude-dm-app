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

// Default (unsorted) order: Theren, Wolfy (Theren's companion), Ogre
const party = [
  {
    id: 'p1', name: 'Theren', class: 'Ranger', level: 5, dex: 14, wis: 12,
    saveProficiencies: { str: 1, dex: 1 },
    currentHp: 38, maxHp: 44, initiative: 15, ac: 15,
    features: [{ id: 'f1', name: 'Favored Enemy', description: 'Hunter’s Mark without a slot.' }],
    companions: [
      { id: 'c1', name: 'Wolfy', active: true, inCombat: true, maxHp: 11, currentHp: 11, initiative: 8 },
    ],
  },
];

const ogre = {
  id: 'enemy-1', name: 'Ogre', size: 'Large', creatureType: 'giant', currentHp: 59, maxHp: 59,
  initiative: 9, cr: '2', speed: '40 ft., climb 20 ft.', str: 19,
  resistances: 'cold', senses: 'darkvision 60 ft.',
  traits: [{ name: 'Keen Smell', description: 'Advantage on smell checks.' }],
  actions: [{ name: 'Club', description: '+6 to hit, 13 (2d8+4) bludgeoning.' }],
  reactions: [{ name: 'Parry', description: '+2 AC against one melee attack.' }],
  legendaryActions: [{ name: 'Stomp', description: 'DC 14 Str save or prone.' }],
};

const jsonResponse = (data) => ({ ok: true, json: async () => data });

function mockFetch() {
  const routes = {
    '/api/party': jsonResponse(party),
    '/api/templates': jsonResponse([]),
    '/api/encounter': jsonResponse({ enemies: [ogre] }),
    '/api/encounters': jsonResponse([]),
  };
  const fn = vi.fn(async (url, opts = {}) => {
    if (opts.method && opts.method !== 'GET') return jsonResponse({ success: true });
    return routes[url] || jsonResponse({ success: true });
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
const tracker = () => document.querySelector('main').children[0].children[1];
const drawer = () => screen.queryByRole('complementary', { name: /^Details:/ });
const drawerName = () => within(drawer()).getByRole('heading', { level: 2 }).textContent;
const lastPost = (fetchMock, url) =>
  JSON.parse(fetchMock.mock.calls.filter(([u, o]) => u === url && o?.method === 'POST').at(-1)[1].body);

const startCombat = async () => {
  click(screen.getByText('Start Combat'));
  await flush();
};
const endTurn = () => click(screen.getByText('End Turn →'));

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('CombatPage — combatant detail drawer', () => {
  it('opens from the Now card name and follows the turn', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();

    expect(drawer()).not.toBeInTheDocument();
    click(within(tracker()).getByTitle('Show full details'));
    expect(drawerName()).toBe('Theren');
    expect(within(drawer()).getByText('Following turn')).toBeInTheDocument();
    expect(within(drawer()).getByText('Now')).toBeInTheDocument();

    endTurn();
    expect(drawerName()).toBe('Wolfy');
    endTurn();
    expect(drawerName()).toBe('Ogre');
  });

  it('Pin keeps it on one combatant; Follow turn resumes tracking', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(within(tracker()).getByTitle('Show full details'));

    click(within(drawer()).getByRole('button', { name: 'Pin' }));
    endTurn();
    expect(drawerName()).toBe('Theren');
    expect(within(drawer()).getByText('Pinned')).toBeInTheDocument();
    expect(within(drawer()).queryByText('Now')).not.toBeInTheDocument();

    click(within(drawer()).getByRole('button', { name: 'Follow turn' }));
    expect(drawerName()).toBe('Wolfy');
  });

  it('Up Next opens the drawer pinned to the next combatant', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(within(tracker()).getByTestId('up-next'));
    expect(drawerName()).toBe('Wolfy');
    expect(within(drawer()).getByText('Pinned')).toBeInTheDocument();
  });

  it("shows an enemy's full stat block from the card's Details button", async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    click(screen.getByRole('tab', { name: /Enemies/ }));
    click(screen.getByRole('button', { name: 'Details for Ogre' }));

    const d = drawer();
    expect(drawerName()).toBe('Ogre');
    expect(within(d).getByText('Large giant · CR 2')).toBeInTheDocument();
    expect(within(d).getByTestId('drawer-speed')).toHaveTextContent('40 ft · climb 20 ft');
    expect(within(d).getByText('cold')).toBeInTheDocument();
    expect(within(d).getByText('darkvision 60 ft.')).toBeInTheDocument();
    for (const text of ['Keen Smell.', 'Club.', 'Parry.', 'Stomp.']) {
      expect(within(d).getByText(text)).toBeInTheDocument();
    }
    expect(within(d).getByTestId('drawer-ability-str')).toHaveTextContent('+4');
    // legendary budget pips ride on the Legendary Actions heading
    expect(within(d).getAllByTitle(/^Ogre: legendary action/)).toHaveLength(3);
    // Not in combat: nothing to follow
    expect(within(d).queryByRole('button', { name: 'Follow turn' })).not.toBeInTheDocument();
  });

  it('icon buttons show hover tooltips portaled to <body> (the blurred drawer would mis-place them)', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    click(screen.getByRole('tab', { name: /Enemies/ }));
    click(screen.getByRole('button', { name: 'Details for Ogre' }));

    const btn = within(drawer()).getByRole('button', { name: 'View Stat Block' });
    act(() => { fireEvent.mouseEnter(btn.parentElement); });
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('View Stat Block');
    expect(tip.parentElement).toBe(document.body);
    act(() => { fireEvent.mouseLeave(btn.parentElement); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('damage and temp HP edits save through the encounter', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    click(screen.getByRole('tab', { name: /Enemies/ }));
    click(screen.getByRole('button', { name: 'Details for Ogre' }));

    const amount = within(drawer()).getByLabelText('Damage or healing for Ogre');
    act(() => { fireEvent.change(amount, { target: { value: '9' } }); });
    act(() => { fireEvent.keyDown(amount, { key: 'Enter' }); });
    expect(within(drawer()).getByTestId('drawer-hp')).toHaveTextContent('50');

    const thp = within(drawer()).getByLabelText('Temp HP for Ogre');
    act(() => { fireEvent.focus(thp); });
    act(() => { fireEvent.change(thp, { target: { value: '5' } }); });
    act(() => { fireEvent.blur(thp); });
    await act(async () => { vi.advanceTimersByTime(1100); });

    const saved = lastPost(fetchMock, '/api/encounter').enemies[0];
    expect(saved.currentHp).toBe(50);
    expect(saved.tempHp).toBe(5);
  });

  it('party members show saves and features; opened from the ⋯ menu', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    click(screen.getByRole('button', { name: 'More actions for Theren' }));
    click(screen.getByRole('menuitem', { name: 'Details' }));

    expect(drawerName()).toBe('Theren');
    expect(within(drawer()).getByTestId('drawer-ability-dex')).toHaveTextContent('save +5');
    expect(within(drawer()).getByTestId('drawer-ability-wis')).toHaveTextContent('save +1');
    expect(within(drawer()).getByText('Favored Enemy')).toBeInTheDocument();
  });

  it('companion damage writes HP back to the owner record only', async () => {
    const fetchMock = mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(within(tracker()).getByTestId('up-next')); // Wolfy

    const amount = within(drawer()).getByLabelText('Damage or healing for Wolfy');
    act(() => { fireEvent.change(amount, { target: { value: '4' } }); });
    click(within(drawer()).getByRole('button', { name: 'Damage' }));
    await act(async () => { vi.advanceTimersByTime(1100); });

    const wolfy = lastPost(fetchMock, '/api/party')[0].companions[0];
    expect(wolfy.currentHp).toBe(7);
    expect(wolfy.id).toBe('c1');
    expect(wolfy).not.toHaveProperty('ownerName');
  });

  it('opens from the order modal (closing it) and closes with ×', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    click(screen.getByText('Manage Order'));
    await flush();
    click(screen.getByRole('button', { name: 'Details for Ogre' }));

    expect(screen.queryByText('Initiative Order')).not.toBeInTheDocument();
    expect(drawerName()).toBe('Ogre');
    click(within(drawer()).getByRole('button', { name: 'Close details' }));
    expect(drawer()).not.toBeInTheDocument();
  });

  it('End Combat closes a following drawer but keeps a pinned one', async () => {
    mockFetch();
    render(<CombatPage />);
    await settle();
    await startCombat();
    click(within(tracker()).getByTitle('Show full details'));
    click(screen.getByRole('button', { name: 'End Combat' }));
    click(screen.getByRole('button', { name: 'End Combat' })); // confirm
    expect(drawer()).not.toBeInTheDocument();

    await startCombat();
    expect(drawer()).not.toBeInTheDocument();
    click(within(tracker()).getByTestId('up-next'));
    click(screen.getByRole('button', { name: 'End Combat' }));
    click(screen.getByRole('button', { name: 'End Combat' }));
    expect(drawerName()).toBe('Wolfy');
  });
});
