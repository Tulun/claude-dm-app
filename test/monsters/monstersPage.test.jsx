import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/monsters',
}));

import MonstersPage from '../../app/monsters/page.jsx';

const templates = [
  { id: 'mm-beholder', name: 'Beholder', source: 'mm', size: 'Large', creatureType: 'Aberration', cr: '13', ac: 18, maxHp: 190, speed: 5, traits: [], actions: [] },
  { id: 'mm-aboleth', name: 'Aboleth', source: 'mm', edition: '2024', size: 'Large', creatureType: 'Aberration', cr: '10', ac: 17, maxHp: 150, speed: 10, traits: [], actions: [] },
  { id: 'mm-kobold', name: 'Kobold Scale', source: 'mm', book: 'VGtM', size: 'Small', creatureType: 'Dragon', cr: '1', ac: 15, maxHp: 27, speed: 30, traits: [], actions: [] },
  { id: 'tpl-goblin', name: 'Goblin Boss', source: 'custom', size: 'Small', creatureType: 'Humanoid', cr: '1', ac: 15, maxHp: 21, speed: 30, traits: [], actions: [] },
];

const jsonResponse = (data, ok = true) => ({ ok, json: async () => data });
const conflux = [
  { id: 'cc-old-ooze', name: 'Old Ooze', source: 'conflux', cr: '2', ac: 8, maxHp: 30, speed: 10, traits: [], actions: [], confluxAdded: '1.50',
    confluxGroups: [{ name: 'Oozes', section: 'Oozes', cr: '0-20', url: 'https://homebrewery.naturalcrit.com/share/oozes', order: 9 }] },
  { id: 'cc-gazer', name: 'Gazer', source: 'conflux', cr: '1/2', ac: 13, maxHp: 13, speed: 0, traits: [], actions: [], confluxUpdated: '1.58',
    confluxGroups: [{ name: 'Beholders', section: 'Aberrations', cr: '½-24', url: 'https://homebrewery.naturalcrit.com/share/beholders', order: 2 }] },
  { id: 'cc-carrion-ghoul', name: 'Carrion Ghoul', source: 'conflux', cr: '3', ac: 13, maxHp: 40, speed: 30, traits: [], actions: [], confluxUpdated: '1.58', confluxRenamedFrom: 'Fleshseeker Ghoul' },
  { id: 'cc-river-otter', name: 'River Otter', source: 'conflux', cr: '0', ac: 12, maxHp: 4, speed: 20, traits: [], actions: [], confluxAdded: '1.58' },
];
function mockFetch({ fail = false } = {}) {
  const fn = vi.fn(async (url, opts = {}) => {
    if (opts.method === 'POST') return jsonResponse({ success: true });
    if (fail) return jsonResponse(null, false);
    if (String(url).includes('source=conflux')) return jsonResponse(conflux);
    return jsonResponse(templates);
  });
  global.fetch = fn;
  return fn;
}
const posts = (fetchMock) => fetchMock.mock.calls.filter(([, o]) => o?.method === 'POST');
const settle = async () => {
  await act(async () => {});
  await act(async () => { vi.advanceTimersByTime(1600); });
  await act(async () => {});
};

beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Monsters library page', () => {
  it('does not echo the loaded library back to the API', async () => {
    const fetchMock = mockFetch();
    render(<MonstersPage />);
    await settle();
    expect(screen.getByText('Beholder')).toBeInTheDocument();
    expect(posts(fetchMock)).toHaveLength(0);
  });

  it('rows link to the monster page; Edit and New go to the editor', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    expect(screen.getByText('Beholder').closest('a')).toHaveAttribute('href', '/monsters/mm-beholder');
    expect(screen.getByRole('link', { name: 'Edit Beholder' })).toHaveAttribute('href', '/monsters/mm-beholder?edit=1');
    expect(screen.getByRole('link', { name: /New Monster/ })).toHaveAttribute('href', '/monsters/new');
  });

  it('Import from Image sits in the header and opens the import dialog', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    const header = screen.getByRole('heading', { name: /^Monsters$/ }).parentElement;
    expect(header).toContainElement(screen.getByRole('button', { name: /Import from Image/ }));
    expect(header).toContainElement(screen.getByRole('link', { name: /New Monster/ }));
    fireEvent.click(screen.getByRole('button', { name: /Import from Image/ }));
    expect(screen.getByText(/Import Monster from Image/)).toBeInTheDocument();
  });

  it('deleting saves immediately', async () => {
    const fetchMock = mockFetch();
    render(<MonstersPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Goblin Boss' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Delete' })); });
    expect(posts(fetchMock)).toHaveLength(1);
    expect(JSON.parse(posts(fetchMock)[0][1].body).map(t => t.id)).toEqual(['mm-beholder', 'mm-aboleth', 'mm-kobold']);
  });

  it('never saves the built-in fallback over the real file after a failed load', async () => {
    const fetchMock = mockFetch({ fail: true });
    render(<MonstersPage />);
    await settle();
    const del = screen.getAllByRole('button', { name: /^Delete / })[0];
    fireEvent.click(del);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Delete' })); });
    expect(posts(fetchMock)).toHaveLength(0);
  });

  it('labels rows with their source book and filters by it', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    const rowText = () => screen.getAllByTestId('template-row').map(r => r.textContent);
    expect(rowText().find(t => t.includes('Beholder'))).toContain('MM 2014');
    expect(rowText().find(t => t.includes('Aboleth'))).toContain('MM 2024');
    expect(rowText().find(t => t.includes('Kobold Scale'))).toContain('VGtM');

    fireEvent.click(screen.getByRole('button', { name: /^Book/ }));
    fireEvent.click(screen.getByRole('button', { name: 'VGtM' }));
    expect(screen.getAllByTestId('template-row')).toHaveLength(1);
    expect(screen.getByText('Kobold Scale')).toBeInTheDocument();
  });

  it('filters by 2024 habitat (MM 2024 stat blocks only)', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /^Habitat/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Underdark' }));
    expect(screen.getAllByTestId('template-row').map(r => r.textContent).join()).toContain('Aboleth');
    expect(screen.getAllByTestId('template-row')).toHaveLength(1);
    expect(screen.getByText('Underdark', { selector: 'span' })).toBeInTheDocument();
  });

  it('Flee Mortals monsters have their own tab, off Official and Custom, with no By Book index', async () => {
    templates.push({ id: 'fm-test-brute', name: 'Testbeast Brute', source: 'custom', book: 'Flee Mortals', size: 'Large', creatureType: 'Monstrosity', cr: '4', ac: 15, maxHp: 60, speed: 30, traits: [], actions: [] });
    try {
      mockFetch();
      render(<MonstersPage />);
      await settle();
      expect(screen.queryByText('Testbeast Brute')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'By Book' })).toBeInTheDocument();
      // A book picked on Official doesn't hide everything on the Flee Mortals tab
      fireEvent.click(screen.getByRole('button', { name: /^Book/ }));
      fireEvent.click(screen.getByRole('button', { name: 'VGtM' }));
      fireEvent.click(screen.getByRole('button', { name: 'Flee Mortals' }));
      expect(screen.getAllByTestId('template-row').map(r => r.textContent)).toEqual([expect.stringContaining('Testbeast Brute')]);
      expect(screen.queryByRole('button', { name: 'By Book' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Book/ })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
      expect(screen.queryByText('Testbeast Brute')).not.toBeInTheDocument();
      expect(screen.getByText('Goblin Boss')).toBeInTheDocument();
    } finally {
      templates.pop();
    }
  });

  it('a monster imported from an official book is listed under Official, not Custom', async () => {
    templates.push({ id: 'imported-9', name: 'Githyanki Knight', source: 'custom', book: 'MM 2024', cr: '8', ac: 18, maxHp: 117, speed: 30, traits: [], actions: [] });
    try {
      mockFetch();
      render(<MonstersPage />);
      await settle();
      expect(screen.getByText('Githyanki Knight')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
      expect(screen.queryByText('Githyanki Knight')).not.toBeInTheDocument();
      expect(screen.getByText('Goblin Boss')).toBeInTheDocument();
    } finally {
      templates.pop();
    }
  });

  it('remembers the search when coming back from a monster page', async () => {
    mockFetch();
    const { unmount } = render(<MonstersPage />);
    await settle();
    fireEvent.change(screen.getByPlaceholderText('Search monsters by name...'), { target: { value: 'gob' } });
    unmount();

    render(<MonstersPage />);
    await settle();
    expect(screen.getByPlaceholderText('Search monsters by name...')).toHaveValue('gob');
    expect(screen.queryByText('Beholder')).not.toBeInTheDocument();
  });

  it('defaults to card view: type, CR and book, but no AC / HP / speed', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    expect(screen.getByRole('button', { name: 'Card view' })).toHaveAttribute('aria-pressed', 'true');
    const card = screen.getAllByTestId('template-row').find(r => r.textContent.includes('Beholder'));
    expect(card.textContent).toContain('Large Aberration');
    expect(card.textContent).toContain('CR13');
    expect(card.textContent).toContain('MM 2014');
    expect(card.textContent).not.toMatch(/AC 18|HP 190/);
  });

  it('list view keeps the AC / HP / speed summary, and the choice is remembered', async () => {
    mockFetch();
    const { unmount } = render(<MonstersPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    const row = screen.getAllByTestId('template-row').find(r => r.textContent.includes('Beholder'));
    expect(row.textContent).toContain('AC 18 • HP 190');
    unmount();

    render(<MonstersPage />);
    await settle();
    expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no Enemies/NPCs filter, and a legacy isNpc flag hides nothing', async () => {
    templates.push({ id: 'tpl-barkeep', name: 'Barkeep', source: 'custom', isNpc: true, cr: '0', ac: 10, maxHp: 4, speed: 30, traits: [], actions: [] });
    try {
      mockFetch();
      render(<MonstersPage />);
      await settle();
      expect(screen.queryByRole('button', { name: /^npcs$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^enemies$/i })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
      expect(screen.getByText('Barkeep')).toBeInTheDocument();
      expect(screen.getByText('Goblin Boss')).toBeInTheDocument();
    } finally {
      templates.pop();
    }
  });

  it('the Conflux tab\'s Latest filter lists only the newest release, new before updated, read-only', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    expect(screen.queryByRole('button', { name: /^Latest/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Conflux' }));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Latest (1.58)' }));
    const rows = screen.getAllByTestId('template-row');
    expect(rows.map(r => r.querySelector('a').textContent)).toEqual([
      expect.stringContaining('River Otter'), expect.stringContaining('Gazer'), expect.stringContaining('Carrion Ghoul'),
    ]);
    expect(screen.queryByText('Old Ooze')).not.toBeInTheDocument();
    expect(screen.getByText(/Conflux 1\.58/).parentElement.textContent).toMatch(/1 new, 2 updated/);
    expect(rows[0].textContent).toContain('New');
    expect(rows[2].textContent).toContain('Updated');
    expect(screen.getByTitle('Updated in Conflux 1.58 (was Fleshseeker Ghoul)')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Edit / })).not.toBeInTheDocument();
    // Toggling it off brings back the whole list
    fireEvent.click(screen.getByRole('button', { name: 'Latest (1.58)' }));
    expect(screen.getByText('Old Ooze')).toBeInTheDocument();
  });

  it('a saved filter from the old Latest Conflux tab restores as Conflux + Latest', async () => {
    sessionStorage.setItem('templates-library-filters', JSON.stringify({ sourceFilter: 'latest' }));
    mockFetch();
    render(<MonstersPage />);
    await settle();
    await settle();
    expect(screen.getByRole('button', { name: 'Latest (1.58)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Old Ooze')).not.toBeInTheDocument();
    expect(screen.getByText('River Otter')).toBeInTheDocument();
  });

  it('the full Conflux tab badges the latest changes too', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Conflux' }));
    await settle();
    const ooze = screen.getAllByTestId('template-row').find(r => r.textContent.includes('Old Ooze'));
    const otter = screen.getAllByTestId('template-row').find(r => r.textContent.includes('River Otter'));
    expect(ooze.textContent).not.toMatch(/New|Updated/);
    expect(otter.textContent).toContain('New');
  });

  it('ignores leading/trailing spaces in the search', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    fireEvent.change(screen.getByPlaceholderText('Search monsters by name...'), { target: { value: '  Beholder ' } });
    expect(screen.getByText('Beholder')).toBeInTheDocument();
    expect(screen.queryByText('Aboleth')).not.toBeInTheDocument();
  });

  it('sidebar swaps the main view to a grouped index (by creature type) and back', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'By Creature Type' }));
    expect(screen.queryAllByTestId('template-row')).toHaveLength(0);
    const groups = screen.getAllByTestId('monster-group');
    expect(groups.map(g => g.querySelector('h3').textContent)).toEqual(['Aberration2', 'Dragon1']);
    expect(groups[0].textContent.indexOf('Aboleth')).toBeLessThan(groups[0].textContent.indexOf('Beholder'));
    expect(screen.getByRole('link', { name: 'Kobold Scale' })).toHaveAttribute('href', '/monsters/mm-kobold');
    // Sidebar lists the groups as jump links; the layout toggle is hidden
    expect(screen.getByRole('button', { name: /^Aberration/ })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Layout' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All Monsters' }));
    expect(screen.getAllByTestId('template-row')).toHaveLength(3);
  });

  it('grouped index honours the search and is remembered per tab', async () => {
    mockFetch();
    const { unmount } = render(<MonstersPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'By Challenge Rating' }));
    fireEvent.change(screen.getByPlaceholderText(/Search monsters/), { target: { value: 'b' } });
    expect(screen.getAllByTestId('monster-group').map(g => g.querySelector('h3').textContent)).toEqual(['CR 11', 'CR 101', 'CR 131']);
    unmount();
    render(<MonstersPage />);
    await settle();
    expect(screen.getByRole('button', { name: 'By Challenge Rating' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByTestId('monster-group')).toHaveLength(3);
  });

  it('Conflux tabs add a "By Conflux Group" index: catalog sections, CR range and a Homebrewery link per group', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    // Not offered on the Official tab
    expect(screen.queryByRole('button', { name: 'By Conflux Group' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Conflux' }));
    await settle();
    // Conflux creatures carry no book, so no By Book index
    expect(screen.queryByRole('button', { name: 'By Book' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'By Conflux Group' }));
    // Catalog order (Aberrations before Oozes), creatures with no group last
    expect(screen.getAllByTestId('monster-group-section').map(h => h.textContent)).toEqual(['Aberrations', 'Oozes', 'Ungrouped']);
    const groups = screen.getAllByTestId('monster-group');
    expect(groups.map(g => g.querySelector('h3').firstChild.textContent)).toEqual(['Beholders', 'Oozes', 'Ungrouped']);
    expect(groups[0].textContent).toContain('CR ½-24');
    expect(screen.getAllByRole('link', { name: /Homebrewery/ })[0]).toHaveAttribute('href', 'https://homebrewery.naturalcrit.com/share/beholders');
    expect(groups[2].textContent).toMatch(/River Otter.*Carrion Ghoul/); // CR order within a group
    // The sidebar jumps by section, not by every group
    expect(screen.getByRole('button', { name: /^Aberrations/ })).toBeInTheDocument();

    // Back on Official the choice falls back to All Monsters (and is kept for Conflux)
    fireEvent.click(screen.getByRole('button', { name: 'Official' }));
    expect(screen.getAllByTestId('template-row').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Conflux' }));
    await settle();
    expect(screen.getByRole('button', { name: 'By Conflux Group' })).toHaveAttribute('aria-pressed', 'true');
  });
});
