import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';

const nav = vi.hoisted(() => ({ params: { id: 'mm-beholder' }, search: '', push: null, replace: null }));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn() }),
  useParams: () => nav.params,
  useSearchParams: () => new URLSearchParams(nav.search),
  usePathname: () => `/templates/${nav.params.id}`,
}));

import MonsterDetailPage from '../../app/templates/[id]/page.jsx';

const beholder = {
  id: 'mm-beholder', name: 'Beholder', size: 'Large', creatureType: 'Aberration', ac: 18, maxHp: 190,
  hitDice: '20d10+80', speed: '5, fly 40 (hover)', cr: '13', xp: 10000, profBonus: 5,
  str: 16, dex: 14, con: 18, int: 17, wis: 15, cha: 17, savingThrows: 'Con +9, Wis +7', skills: 'Perception +12',
  immunities: 'Prone', senses: 'Darkvision 120 ft., Passive Perception 22', languages: 'Deep Speech, Undercommon',
  isNpc: false, source: 'mm', notes: 'Alignment: Lawful Evil. Legendary Action Uses: 3 (4 in Lair).',
  traits: [{ name: 'Legendary Resistance (3/Day, or 4/Day in Lair)', description: 'It can choose to succeed instead.' }],
  actions: [
    { name: 'Bite', description: 'Melee Attack Roll: +8, reach 5 ft. Hit: 13 (3d6 + 3) Piercing damage.' },
    { name: 'Eye Rays', description: 'Roll 1d10:\n1. Charm Ray. Wisdom Saving Throw: DC 16.\n2. Fear Ray. Failure: 14 (4d6) Psychic damage.' },
  ],
  legendaryActions: [{ name: 'Chomp', description: 'The beholder makes two Bite attacks.' }],
};
const goblin = { id: 'tpl-goblin', name: 'Goblin Boss', source: 'custom', ac: 15, maxHp: 21, cr: '1', traits: [], actions: [] };
const conflux = [{ id: 'cc-aboleth-hatchling', name: 'Aboleth Hatchling', source: 'conflux', ac: 14, maxHp: 7, cr: '1', traits: [], actions: [] }];

const jsonResponse = (data, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => data });

function mockFetch({ templates = [beholder, goblin], fail = false } = {}) {
  const fn = vi.fn(async (url, opts = {}) => {
    if (opts.method === 'POST') return jsonResponse({ success: true });
    if (fail) return jsonResponse({ error: 'boom' }, false);
    if (url === '/api/templates?source=conflux') return jsonResponse(conflux);
    if (url === '/api/templates') return jsonResponse(templates);
    return jsonResponse(null);
  });
  global.fetch = fn;
  return fn;
}

const posts = (fetchMock) => fetchMock.mock.calls.filter(([u, o]) => u === '/api/templates' && o?.method === 'POST');
const postedBody = (fetchMock, i = 0) => JSON.parse(posts(fetchMock)[i][1].body);
const flush = () => act(async () => {});
const settle = async () => {
  await flush();
  await act(async () => { vi.advanceTimersByTime(1600); });
  await flush();
};

beforeEach(() => {
  vi.useFakeTimers();
  nav.params = { id: 'mm-beholder' };
  nav.search = '';
  nav.push = vi.fn();
  nav.replace = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Monster detail page — view', () => {
  it('renders the full stat block and never saves on load', async () => {
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();

    expect(screen.getByRole('heading', { name: 'Beholder' })).toBeInTheDocument();
    expect(screen.getByText('Large Aberration, Lawful Evil')).toBeInTheDocument();
    expect(screen.getByTestId('vital-ac')).toHaveTextContent('18');
    expect(screen.getByTestId('vital-speed')).toHaveTextContent('fly 40 ft (hover)');
    // Proficient saves come from the savingThrows text; the rest are plain mods.
    expect(screen.getByTestId('ability-con')).toHaveTextContent('save +9');
    expect(screen.getByTestId('ability-str')).toHaveTextContent('save +3');
    expect(screen.getByText('Passive Perception 22')).toBeInTheDocument();
    expect(screen.getByText('3 per round (4 in lair)')).toBeInTheDocument();
    // Numbered eye-ray lines render as their own named list items.
    const actions = screen.getByTestId('section-actions');
    expect(within(actions).getByText('Charm Ray.')).toBeInTheDocument();
    expect(within(actions).getByText('Fear Ray.')).toBeInTheDocument();
    expect(posts(fetchMock)).toHaveLength(0);
  });

  it('shows a not-found message for an unknown id', async () => {
    nav.params = { id: 'mm-nope' };
    mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    expect(screen.getByText(/No monster with id/)).toBeInTheDocument();
  });

  it('refuses to edit when the library failed to load (no fallback overwrite)', async () => {
    const fetchMock = mockFetch({ fail: true });
    render(<MonsterDetailPage />);
    await settle();
    expect(screen.getByText(/Nothing can be saved/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
    expect(posts(fetchMock)).toHaveLength(0);
  });
});

describe('Monster detail page — editing', () => {
  it('edits and saves the whole library with only this monster changed', async () => {
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();

    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    expect(screen.getByTestId('stat-block-form')).toBeInTheDocument();
    expect(screen.getByTestId('live-preview')).toBeInTheDocument();

    const ac = screen.getAllByRole('textbox').find(el => el.value === '18');
    fireEvent.change(ac, { target: { value: '19' } });
    fireEvent.change(screen.getByLabelText('Action 1 name'), { target: { value: 'Big Bite' } });
    // Live preview follows the form.
    expect(within(screen.getByTestId('live-preview')).getByText('Big Bite')).toBeInTheDocument();

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/ })); });
    await flush();

    expect(posts(fetchMock)).toHaveLength(1);
    const body = postedBody(fetchMock);
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({ id: 'mm-beholder', ac: 19 });
    expect(body[0].actions[0].name).toBe('Big Bite');
    expect(body[1]).toEqual(goblin);
    expect(screen.queryByTestId('stat-block-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('vital-ac')).toHaveTextContent('19');
  });

  it('shows and edits the source book', async () => {
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    expect(screen.getByTestId('book-badge')).toHaveTextContent('MM 2024');

    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const book = screen.getByLabelText(/Source book/);
    expect(book).toHaveValue('');
    expect(book).toHaveAttribute('placeholder', 'MM 2024 (auto)');
    fireEvent.change(book, { target: { value: 'VGtM' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/ })); });
    await flush();

    expect(postedBody(fetchMock)[0]).toMatchObject({ id: 'mm-beholder', book: 'VGtM' });
    expect(screen.getByTestId('book-badge')).toHaveTextContent('VGtM');
  });

  it('adds, reorders and removes ability entries', async () => {
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));

    fireEvent.click(screen.getByRole('button', { name: /Add Bonus Action/ }));
    fireEvent.change(screen.getByLabelText('Bonus Action 1 name'), { target: { value: 'Float' } });
    const actions = screen.getByTestId('edit-section-actions');
    fireEvent.click(within(actions).getAllByRole('button', { name: 'Move down' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove legendary action 1' }));

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/ })); });
    await flush();
    const saved = postedBody(fetchMock)[0];
    expect(saved.bonusActions).toEqual([{ name: 'Float', description: '' }]);
    expect(saved.actions.map(a => a.name)).toEqual(['Eye Rays', 'Bite']);
    expect(saved.legendaryActions).toEqual([]);
  });

  it('saving without changes does not POST', async () => {
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/ })); });
    await flush();
    expect(posts(fetchMock)).toHaveLength(0);
    expect(screen.queryByTestId('stat-block-form')).not.toBeInTheDocument();
  });

  it('opens straight into the editor with ?edit=1', async () => {
    nav.search = 'edit=1';
    mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    expect(screen.getByTestId('stat-block-form')).toBeInTheDocument();
  });

  it('cancel discards edits', async () => {
    mockFetch();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MonsterDetailPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    fireEvent.change(screen.getByLabelText('Action 1 name'), { target: { value: 'Nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByTestId('section-actions')).toHaveTextContent('Bite');
    expect(screen.queryByText('Nope')).not.toBeInTheDocument();
  });
});

describe('Monster detail page — create, duplicate, delete, Conflux', () => {
  it('/templates/new creates a custom template and moves to its page', async () => {
    nav.params = { id: 'new' };
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();

    fireEvent.change(screen.getByPlaceholderText('Creature name'), { target: { value: 'Cave Troll' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Create/ })); });
    await flush();

    const body = postedBody(fetchMock);
    expect(body).toHaveLength(3);
    const created = body[2];
    expect(created).toMatchObject({ name: 'Cave Troll', source: 'custom', ac: 10, maxHp: 10, traits: [], actions: [] });
    expect(created.id).toMatch(/^tpl-/);
    expect(nav.replace).toHaveBeenCalledWith(`/templates/${created.id}`);
  });

  it('requires a name to create', async () => {
    nav.params = { id: 'new' };
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Create/ })); });
    expect(posts(fetchMock)).toHaveLength(0);
  });

  it('duplicates into a custom copy and opens it for editing', async () => {
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Duplicate/ })); });
    await flush();
    const copy = postedBody(fetchMock)[2];
    expect(copy).toMatchObject({ name: 'Beholder (Copy)', source: 'custom', ac: 18 });
    expect(copy.id).not.toBe('mm-beholder');
    expect(nav.push).toHaveBeenCalledWith(`/templates/${copy.id}?edit=1`);
  });

  it('deletes after confirming and returns to the library', async () => {
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Delete monster' }));
    expect(posts(fetchMock)).toHaveLength(0);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Delete Beholder' })); });
    await flush();
    expect(postedBody(fetchMock)).toEqual([goblin]);
    expect(nav.push).toHaveBeenCalledWith('/templates');
  });

  it('shows Conflux creatures and saves edits as a custom copy', async () => {
    nav.params = { id: 'cc-aboleth-hatchling' };
    const fetchMock = mockFetch();
    render(<MonsterDetailPage />);
    await settle();
    expect(screen.getByRole('heading', { name: 'Aboleth Hatchling' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete monster' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Save as Copy/ })); });
    await flush();
    const body = postedBody(fetchMock);
    expect(body).toHaveLength(3);
    expect(body[2]).toMatchObject({ name: 'Aboleth Hatchling', source: 'custom' });
    expect(body[2].id).toMatch(/^tpl-/);
  });
});
