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
function mockFetch({ fail = false } = {}) {
  const fn = vi.fn(async (url, opts = {}) => {
    if (opts.method === 'POST') return jsonResponse({ success: true });
    if (fail) return jsonResponse(null, false);
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

  it('ignores leading/trailing spaces in the search', async () => {
    mockFetch();
    render(<MonstersPage />);
    await settle();
    fireEvent.change(screen.getByPlaceholderText('Search monsters by name...'), { target: { value: '  Beholder ' } });
    expect(screen.getByText('Beholder')).toBeInTheDocument();
    expect(screen.queryByText('Aboleth')).not.toBeInTheDocument();
  });
});
