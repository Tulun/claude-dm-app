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

import FeaturesTab from '../../app/character/components/tabs/FeaturesTab.jsx';
import CharacterPage from '../../app/character/page.jsx';

describe('FeaturesTab — merged features + feats', () => {
  it('renders class features and the feats section in one tab', () => {
    const character = {
      id: 'p1', name: 'Efa',
      classes: [{ name: 'Druid', level: 4 }],
      features: [],
    };
    render(<FeaturesTab character={character} onUpdate={vi.fn()} />);
    expect(screen.getByText('Class Features (2024 PHB)')).toBeInTheDocument();
    expect(screen.getByText('Feats & Other Features')).toBeInTheDocument();
    expect(screen.getByText(/Add Feat\/Feature/)).toBeInTheDocument();
  });

  it('renders existing features: known feats as standard entries, unknown as editable custom', () => {
    const character = {
      id: 'p1', name: 'Marshuh',
      classes: [{ name: 'Sorcerer', level: 4 }],
      features: [
        { id: 'f-1', name: 'Inspiring Leader', description: 'Rousing speech.' },
        { id: 'f-2', name: 'Metamagic', description: 'Twin/Quicken', custom: true },
      ],
    };
    render(<FeaturesTab character={character} onUpdate={vi.fn()} />);
    // Known feat renders as read-only expandable text
    expect(screen.getByText('Inspiring Leader')).toBeInTheDocument();
    // Custom feature renders as editable inputs
    expect(screen.getByDisplayValue('Metamagic')).toBeInTheDocument();
  });

  it('adds a feat from the picker via onUpdate("features", ...)', () => {
    const onUpdate = vi.fn();
    const character = { id: 'p1', name: 'Efa', classes: [{ name: 'Druid', level: 4 }], features: [] };
    render(<FeaturesTab character={character} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText(/Add Feat\/Feature/));
    fireEvent.click(screen.getByText('Alert'));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [field, value] = onUpdate.mock.calls[0];
    expect(field).toBe('features');
    expect(value).toHaveLength(1);
    expect(value[0].name).toBe('Alert');
    expect(value[0].id).toMatch(/^feature-/);
  });

  it('supports per-feat notes on standard entries (kept from the removed Feats tab)', () => {
    const onUpdate = vi.fn();
    const character = {
      id: 'p1', name: 'Vesna',
      classes: [{ name: 'Ranger', level: 4 }],
      features: [{ id: 'f-1', name: 'Resilient', description: 'Save proficiency.' }],
    };
    render(<FeaturesTab character={character} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText('Resilient'));
    fireEvent.change(screen.getByPlaceholderText(/Notes/), { target: { value: 'chose WIS' } });
    const [field, value] = onUpdate.mock.calls[0];
    expect(field).toBe('features');
    expect(value[0].notes).toBe('chose WIS');
  });
});

describe('CharacterPage — feats tab merged into features', () => {
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

  it('no longer offers a separate feats tab', async () => {
    mockFetch([{ id: 'p1', name: 'Efa', class: 'Druid', level: 4 }]);
    render(<CharacterPage />);
    await flush();
    expect(screen.queryByRole('button', { name: 'feats' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'features' })).toBeInTheDocument();
  });

  it('folds legacy character.feats into features and persists the merge on next save', async () => {
    const fetchMock = mockFetch([{
      id: 'p1', name: 'Braadlei', class: 'Bard', level: 3,
      features: [{ id: 'f-1', name: 'Inspiring Leader', description: 'Rousing speech.' }],
      feats: [{ id: 'feat-1', name: 'Alert', description: '+5 Initiative.', notes: 'from old tab' }],
    }]);
    render(<CharacterPage />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'features' }));
    // Both the features entry and the folded legacy feat are visible
    expect(screen.getByText('Inspiring Leader')).toBeInTheDocument();
    expect(screen.getByText('Alert')).toBeInTheDocument();

    // The fold alone must not trigger an echo save
    await act(async () => { vi.advanceTimersByTime(1600); });
    await flush();
    expect(postCalls(fetchMock, '/api/party')).toHaveLength(0);

    // After a real edit, the merged shape is what gets persisted
    fireEvent.click(screen.getByText('Alert'));
    fireEvent.change(screen.getByPlaceholderText(/Notes/), { target: { value: 'updated note' } });
    await act(async () => { vi.advanceTimersByTime(1600); });
    await flush();
    const posts = postCalls(fetchMock, '/api/party');
    expect(posts.length).toBeGreaterThan(0);
    const saved = JSON.parse(posts.at(-1)[1].body).find(c => c.id === 'p1');
    expect(saved.features.map(f => f.name)).toEqual(['Inspiring Leader', 'Alert']);
    expect(saved.features.find(f => f.name === 'Alert').notes).toBe('updated note');
    expect(saved.feats).toEqual([]);
  });
});
