import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/templates',
}));

import TemplatesPage from '../../app/templates/page.jsx';

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

beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Templates library page', () => {
  it('does not echo the loaded library back to the API', async () => {
    const fetchMock = mockFetch();
    render(<TemplatesPage />);
    await settle();
    expect(screen.getByText('Beholder')).toBeInTheDocument();
    expect(posts(fetchMock)).toHaveLength(0);
  });

  it('rows link to the monster page; Edit and New go to the editor', async () => {
    mockFetch();
    render(<TemplatesPage />);
    await settle();
    expect(screen.getByText('Beholder').closest('a')).toHaveAttribute('href', '/templates/mm-beholder');
    expect(screen.getByRole('link', { name: 'Edit Beholder' })).toHaveAttribute('href', '/templates/mm-beholder?edit=1');
    expect(screen.getByRole('link', { name: /New Template/ })).toHaveAttribute('href', '/templates/new');
  });

  it('deleting saves immediately', async () => {
    const fetchMock = mockFetch();
    render(<TemplatesPage />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Goblin Boss' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Delete' })); });
    expect(posts(fetchMock)).toHaveLength(1);
    expect(JSON.parse(posts(fetchMock)[0][1].body).map(t => t.id)).toEqual(['mm-beholder', 'mm-aboleth', 'mm-kobold']);
  });

  it('never saves the built-in fallback over the real file after a failed load', async () => {
    const fetchMock = mockFetch({ fail: true });
    render(<TemplatesPage />);
    await settle();
    const del = screen.getAllByRole('button', { name: /^Delete / })[0];
    fireEvent.click(del);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Delete' })); });
    expect(posts(fetchMock)).toHaveLength(0);
  });

  it('labels rows with their source book and filters by it', async () => {
    mockFetch();
    render(<TemplatesPage />);
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

  it('remembers the search when coming back from a monster page', async () => {
    mockFetch();
    const { unmount } = render(<TemplatesPage />);
    await settle();
    fireEvent.change(screen.getByPlaceholderText('Search templates by name...'), { target: { value: 'gob' } });
    unmount();

    render(<TemplatesPage />);
    await settle();
    expect(screen.getByPlaceholderText('Search templates by name...')).toHaveValue('gob');
    expect(screen.queryByText('Beholder')).not.toBeInTheDocument();
  });
});
