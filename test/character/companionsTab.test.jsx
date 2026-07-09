import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams('id=p1&type=party'),
  usePathname: () => '/character',
}));

import CompanionsTab from '../../app/character/components/tabs/CompanionsTab.jsx';
import CharacterPage from '../../app/character/page.jsx';

const squeakers = {
  id: 'companion-1', name: 'Squeakers', type: 'familiar', form: 'Rat',
  ac: 10, maxHp: 1, currentHp: 1, speed: '30 ft.',
  str: 3, dex: 15, con: 10, int: 3, wis: 12, cha: 7,
  senses: '', languages: '', abilities: '', actions: '', notes: '',
  active: true, inCombat: false,
};

describe('CompanionsTab', () => {
  it('renders the companion list, not class features', () => {
    const character = { id: 'p1', name: 'Efa', companions: [squeakers] };
    render(<CompanionsTab character={character} onUpdate={vi.fn()} />);
    expect(screen.getByText('Squeakers')).toBeInTheDocument();
    expect(screen.getByText('(Familiar)')).toBeInTheDocument();
    expect(screen.getByText('AC 10')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();
    // Regression guard: this tab was once clobbered by a copy of FeaturesTab
    expect(screen.queryByText(/Class Features/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Add Feat/)).not.toBeInTheDocument();
  });

  it('adds a new companion with a generateId-style id via onUpdate', () => {
    const onUpdate = vi.fn();
    const character = { id: 'p1', name: 'Efa', companions: [] };
    render(<CompanionsTab character={character} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText('Add Companion'));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [field, value] = onUpdate.mock.calls[0];
    expect(field).toBe('companions');
    expect(value).toHaveLength(1);
    expect(value[0].id).toMatch(/^companion-/);
    expect(value[0].type).toBe('familiar');
    expect(value[0].active).toBe(true);
  });

  it('toggles the inCombat flag consumed by the combat page', () => {
    const onUpdate = vi.fn();
    const character = { id: 'p1', name: 'Efa', companions: [squeakers] };
    render(<CompanionsTab character={character} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle('Add to initiative tracker'));
    const [field, value] = onUpdate.mock.calls[0];
    expect(field).toBe('companions');
    expect(value[0].inCombat).toBe(true);
  });

  it('shows canonical ability modifiers from rules.js (dex 15 → +2)', () => {
    const character = { id: 'p1', name: 'Efa', companions: [squeakers] };
    render(<CompanionsTab character={character} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByText('Squeakers'));
    expect(screen.getByText('+2')).toBeInTheDocument(); // dex 15
    expect(screen.getAllByText('-4').length).toBe(2); // str 3 and int 3
  });

  it('offers "Hide this tab" only in the empty state when onHideTab is provided', () => {
    const onHideTab = vi.fn();
    const character = { id: 'p1', name: 'Bard', companions: [] };
    render(<CompanionsTab character={character} onUpdate={vi.fn()} onHideTab={onHideTab} />);
    fireEvent.click(screen.getByText('Hide this tab'));
    expect(onHideTab).toHaveBeenCalledTimes(1);
  });
});

describe('CharacterPage — companions tab gating', () => {
  const jsonResponse = (data) => ({ ok: true, json: async () => data });

  function mockFetch(partyData) {
    const fn = vi.fn(async (url, opts = {}) => {
      if (opts.method === 'POST') return jsonResponse({ success: true });
      if (url === '/api/party') return jsonResponse(partyData);
      if (url === '/api/templates') return jsonResponse([]);
      return jsonResponse(null);
    });
    global.fetch = fn;
    return fn;
  }

  const flush = () => act(async () => {});

  const postCalls = (fetchMock, url) =>
    fetchMock.mock.calls.filter(([u, opts]) => u === url && opts?.method === 'POST');

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the companions tab when the character already has companions', async () => {
    mockFetch([{ id: 'p1', name: 'Efa', class: 'Druid', level: 4, companions: [squeakers] }]);
    render(<CharacterPage />);
    await flush();
    expect(screen.getByRole('button', { name: 'companions' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Companions' })).not.toBeInTheDocument();
  });

  it('hides the companions tab for characters without companions and offers opt-in', async () => {
    mockFetch([{ id: 'p1', name: 'Braadlei', class: 'Bard', level: 3 }]);
    render(<CharacterPage />);
    await flush();
    expect(screen.queryByRole('button', { name: 'companions' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Companions' })).toBeInTheDocument();
  });

  it('opting in shows the tab, opens it, and persists companionsEnabled', async () => {
    const fetchMock = mockFetch([{ id: 'p1', name: 'Braadlei', class: 'Bard', level: 3 }]);
    render(<CharacterPage />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: '+ Companions' }));
    expect(screen.getByRole('button', { name: 'companions' })).toBeInTheDocument();
    expect(screen.getByText(/No companions yet/)).toBeInTheDocument();

    // debounced sheet save fires with the flag persisted
    await act(async () => { vi.advanceTimersByTime(1600); });
    await flush();
    const posts = postCalls(fetchMock, '/api/party');
    expect(posts.length).toBeGreaterThan(0);
    const saved = JSON.parse(posts.at(-1)[1].body);
    expect(saved.find(c => c.id === 'p1').companionsEnabled).toBe(true);
  });

  it('"Hide this tab" removes the tab again and persists the opt-out', async () => {
    const fetchMock = mockFetch([{ id: 'p1', name: 'Braadlei', class: 'Bard', level: 3, companionsEnabled: true }]);
    render(<CharacterPage />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'companions' }));
    fireEvent.click(screen.getByText('Hide this tab'));
    expect(screen.queryByRole('button', { name: 'companions' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Companions' })).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(1600); });
    await flush();
    const posts = postCalls(fetchMock, '/api/party');
    const saved = JSON.parse(posts.at(-1)[1].body);
    expect(saved.find(c => c.id === 'p1').companionsEnabled).toBe(false);
  });
});
