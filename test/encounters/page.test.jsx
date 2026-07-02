import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act, within } from '@testing-library/react';
import EncountersPage from '../../app/encounters/page';

// Navbar uses next/link and next/navigation
vi.mock('next/link', () => ({
  default: ({ href, children, ...p }) => (
    <a href={href} {...p}>
      {children}
    </a>
  ),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/encounters',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// --- Fixtures -------------------------------------------------------------

const templates = [
  {
    id: 'tpl-goblin',
    name: 'Goblin',
    size: 'Small',
    creatureType: 'Humanoid (Goblinoid)',
    ac: 15,
    maxHp: 7,
    speed: 30,
    cr: '1/4',
    xp: 50,
    isNpc: false,
  },
  {
    id: 'tpl-ogre',
    name: 'Ogre',
    size: 'Large',
    creatureType: 'Giant',
    ac: 11,
    maxHp: 59,
    speed: 40,
    cr: '2',
    xp: 450,
    isNpc: false,
  },
];

const goblinAmbush = {
  id: 'enc-1',
  name: 'Goblin Ambush',
  monsters: [{ id: 'm1', templateId: 'tpl-goblin', name: 'Goblin', customName: '', quantity: 4 }],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const ogreFight = {
  id: 'enc-2',
  name: 'Ogre Fight',
  monsters: [{ id: 'm2', templateId: 'tpl-ogre', name: 'Ogre', customName: '', quantity: 2 }],
  createdAt: '2026-01-02T00:00:00.000Z',
};

function stubFetch({
  encounters = [],
  templatesResponse = { ok: true, json: async () => templates },
  reject = false,
} = {}) {
  const fetchMock = vi.fn((url, opts = {}) => {
    if (reject) return Promise.reject(new Error('network down'));
    if (opts.method === 'POST') {
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    }
    if (String(url).includes('/api/encounters')) {
      return Promise.resolve({ ok: true, json: async () => encounters });
    }
    if (String(url).includes('/api/templates')) {
      return Promise.resolve(templatesResponse);
    }
    return Promise.resolve({ ok: false, json: async () => null });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const postCalls = (fetchMock) =>
  fetchMock.mock.calls.filter(([, opts]) => opts && opts.method === 'POST');

const renderPage = async () => {
  render(<EncountersPage />);
  await screen.findByText('Saved Encounters');
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  localStorage.clear();
});

// --- Tests ----------------------------------------------------------------

describe('EncountersPage', () => {
  it('shows Loading... until the initial fetches resolve', async () => {
    stubFetch();
    render(<EncountersPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await screen.findByText('Saved Encounters');
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders encounters from /api/encounters with XP computed from /api/templates', async () => {
    stubFetch({ encounters: [goblinAmbush, ogreFight] });
    await renderPage();
    expect(screen.getByText('Goblin Ambush')).toBeInTheDocument();
    expect(screen.getByText('Ogre Fight')).toBeInTheDocument();
    expect(screen.getByText('4 creatures')).toBeInTheDocument();
    expect(screen.getByText(`${(200).toLocaleString()} XP`)).toBeInTheDocument(); // 4 x 50
    expect(screen.getByText(`${(900).toLocaleString()} XP`)).toBeInTheDocument(); // 2 x 450
  });

  it('falls back to defaultEnemyTemplates when /api/templates fails', async () => {
    // 'mm-awakened-shrub' (10 XP) only exists in defaultEnemyTemplates
    const enc = {
      id: 'enc-shrub',
      name: 'Shrubbery',
      monsters: [
        { id: 'm1', templateId: 'mm-awakened-shrub', name: 'Awakened Shrub', customName: '', quantity: 2 },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    stubFetch({
      encounters: [enc],
      templatesResponse: { ok: false, json: async () => null },
    });
    await renderPage();
    expect(screen.getByText('2 creatures')).toBeInTheDocument();
    expect(screen.getByText(`${(20).toLocaleString()} XP`)).toBeInTheDocument();
  });

  it('falls back to defaultEnemyTemplates when /api/templates returns an empty array', async () => {
    const enc = {
      id: 'enc-shrub',
      name: 'Shrubbery',
      monsters: [
        { id: 'm1', templateId: 'mm-awakened-shrub', name: 'Awakened Shrub', customName: '', quantity: 1 },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    stubFetch({ encounters: [enc], templatesResponse: { ok: true, json: async () => [] } });
    await renderPage();
    expect(screen.getByText(`${(10).toLocaleString()} XP`)).toBeInTheDocument();
  });

  it('still renders (empty list, fallback templates) when fetch rejects entirely', async () => {
    stubFetch({ reject: true });
    await renderPage();
    expect(screen.getByText('No saved encounters yet.')).toBeInTheDocument();
  });

  it('encounters whose templateId does not resolve contribute 0 XP', async () => {
    const enc = {
      id: 'enc-x',
      name: 'Ghost Data',
      monsters: [{ id: 'm1', templateId: 'nope', name: 'Mystery', customName: '', quantity: 5 }],
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    stubFetch({ encounters: [enc] });
    await renderPage();
    // quantity is only counted when the template resolves
    expect(screen.getByText('0 creatures')).toBeInTheDocument();
    expect(screen.getAllByText('0 XP').length).toBeGreaterThan(0);
  });

  describe('localStorage party settings', () => {
    it('reads saved party size/level/calc mode on mount', async () => {
      localStorage.setItem('dm-toolkit-party-size', '6');
      localStorage.setItem('dm-toolkit-party-level', '8');
      localStorage.setItem('dm-toolkit-calc-mode', '2014');
      stubFetch();
      await renderPage();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      // 2014 mode renders the 2014 threshold labels
      expect(screen.getByText('Deadly')).toBeInTheDocument();
      expect(screen.getByText('Full day XP')).toBeInTheDocument();
    });

    it('writes defaults back to localStorage after mount', async () => {
      stubFetch();
      await renderPage();
      await waitFor(() => {
        expect(localStorage.getItem('dm-toolkit-party-size')).toBe('4');
      });
      expect(localStorage.getItem('dm-toolkit-party-level')).toBe('5');
      expect(localStorage.getItem('dm-toolkit-calc-mode')).toBe('2024');
    });

    it('persists changes to party size, level, and calc mode', async () => {
      stubFetch();
      await renderPage();
      const plus = screen.getAllByText('+');
      fireEvent.click(plus[0]); // party size 4 -> 5
      fireEvent.click(plus[1]); // party level 5 -> 6
      fireEvent.click(screen.getByText('2014 Rules'));
      await waitFor(() => {
        expect(localStorage.getItem('dm-toolkit-party-size')).toBe('5');
        expect(localStorage.getItem('dm-toolkit-party-level')).toBe('6');
        expect(localStorage.getItem('dm-toolkit-calc-mode')).toBe('2014');
      });
    });
  });

  describe('creating encounters', () => {
    it('opens the editor for the new encounter and later POSTs it', async () => {
      const fetchMock = stubFetch();
      await renderPage();
      fireEvent.click(screen.getByText('New Encounter'));
      fireEvent.change(
        screen.getByPlaceholderText("e.g., Goblin Ambush, Dragon's Lair..."),
        { target: { value: 'Dragon Fight' } }
      );
      fireEvent.click(screen.getByText('Create'));

      // Editor view replaces the list view
      expect(screen.getByDisplayValue('Dragon Fight')).toBeInTheDocument();
      expect(
        screen.getByText('No monsters yet. Click "Add Monster" to get started.')
      ).toBeInTheDocument();

      // Debounced auto-save fires ~1s later with the new encounter included
      await waitFor(
        () => {
          const posts = postCalls(fetchMock);
          expect(posts.length).toBeGreaterThan(0);
          const body = JSON.parse(posts[posts.length - 1][1].body);
          expect(body).toHaveLength(1);
          expect(body[0]).toMatchObject({ name: 'Dragon Fight', monsters: [] });
          expect(body[0].id).toMatch(/^encounter-\d+$/);
        },
        { timeout: 3000 }
      );
    });

    it('closing the editor returns to the list with the new encounter shown', async () => {
      stubFetch();
      await renderPage();
      fireEvent.click(screen.getByText('New Encounter'));
      fireEvent.click(screen.getByText('Create')); // blank name -> "New Encounter" default
      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByText('Saved Encounters')).toBeInTheDocument();
      // The card title, not the create button: both exist, so expect 2 matches
      expect(screen.getAllByText('New Encounter').length).toBe(2);
    });
  });

  it('duplicating an encounter appends a "(Copy)" entry', async () => {
    stubFetch({ encounters: [goblinAmbush] });
    await renderPage();
    fireEvent.click(screen.getByTitle('Duplicate'));
    expect(screen.getByText('Goblin Ambush (Copy)')).toBeInTheDocument();
    // Copy keeps the same monsters/XP
    expect(screen.getAllByText(`${(200).toLocaleString()} XP`)).toHaveLength(2);
  });

  it('deleting an encounter removes it after confirmation', async () => {
    stubFetch({ encounters: [goblinAmbush, ogreFight] });
    await renderPage();
    fireEvent.click(within(screen.getByText('Goblin Ambush').closest('.bg-stone-800\\/50')).getByTitle('Delete'));
    // Scope to the confirmation modal: row icon buttons also have the accessible name "Delete"
    const modal = screen.getByText('This action cannot be undone.').closest('.bg-stone-900');
    fireEvent.click(within(modal).getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('Goblin Ambush')).not.toBeInTheDocument();
    expect(screen.getByText('Ogre Fight')).toBeInTheDocument();
  });

  describe('daily tracker integration', () => {
    it('adds encounters to the planner and updates day total and percentage', async () => {
      stubFetch({ encounters: [goblinAmbush, ogreFight] });
      await renderPage();
      fireEvent.click(within(screen.getByText('Goblin Ambush').closest('.bg-stone-800\\/50')).getByTitle('Add to daily tracker'));
      fireEvent.click(within(screen.getByText('Ogre Fight').closest('.bg-stone-800\\/50')).getByTitle('Add to daily tracker'));

      // Day total = 200 + 900 = 1100 XP
      expect(screen.getByText(`${(1100).toLocaleString()} XP`)).toBeInTheDocument();
      expect(screen.getByText('2 encounters')).toBeInTheDocument();
      // maxBudget (2024, level 5, size 4) = 750*4*8 = 24000 -> round(1100/24000*100) = 5
      expect(screen.getByText('5% of daily budget')).toBeInTheDocument();
    });

    it('removes a single daily entry and clears the whole day', async () => {
      stubFetch({ encounters: [goblinAmbush] });
      await renderPage();
      const addBtn = screen.getByTitle('Add to daily tracker');
      fireEvent.click(addBtn);
      fireEvent.click(addBtn);
      expect(screen.getByText('2 encounters')).toBeInTheDocument();

      fireEvent.click(screen.getAllByText('×')[0]);
      expect(screen.getByText('1 encounter')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Clear'));
      expect(screen.getByText('Click + on encounters to add')).toBeInTheDocument();
      expect(screen.getByText('0% of daily budget')).toBeInTheDocument();
    });
  });

  describe('auto-save debounce', () => {
    it('does not echo the loaded encounters back to the API; only user edits save', async () => {
      vi.useFakeTimers();
      const fetchMock = stubFetch({ encounters: [goblinAmbush] });
      render(<EncountersPage />);

      // Flush the mocked fetch promise chain (Promise.all + res.json())
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByText('Saved Encounters')).toBeInTheDocument();

      // Fire the setTimeout(0) that enables saving, then wait well past the
      // debounce: loading alone must not write anything back.
      act(() => {
        vi.advanceTimersByTime(0);
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      await act(async () => {});
      expect(postCalls(fetchMock)).toHaveLength(0);

      // A real user edit still saves after the 1s debounce
      fireEvent.click(screen.getByTitle('Duplicate'));
      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(postCalls(fetchMock)).toHaveLength(0);

      act(() => {
        vi.advanceTimersByTime(2);
      });
      await act(async () => {});
      const posts = postCalls(fetchMock);
      expect(posts).toHaveLength(1);
      expect(posts[0][0]).toBe('/api/encounters');
      expect(posts[0][1].headers).toEqual({ 'Content-Type': 'application/json' });
      const body = JSON.parse(posts[0][1].body);
      expect(body).toHaveLength(2);
      expect(body[0]).toEqual(goblinAmbush);
      expect(body[1].name).toBe('Goblin Ambush (Copy)');
    });

    it('resets the debounce on further edits and saves the latest state', async () => {
      vi.useFakeTimers();
      const fetchMock = stubFetch({ encounters: [goblinAmbush] });
      render(<EncountersPage />);
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });
      act(() => {
        vi.advanceTimersByTime(0);
      });

      // Edit before the first save lands: duplicate the encounter at t=500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });
      fireEvent.click(screen.getByTitle('Duplicate'));
      // Old timer was cleared; at t=500+999 nothing has fired yet
      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(postCalls(fetchMock)).toHaveLength(0);

      act(() => {
        vi.advanceTimersByTime(2);
      });
      await act(async () => {});
      const posts = postCalls(fetchMock);
      expect(posts).toHaveLength(1);
      const body = JSON.parse(posts[0][1].body);
      expect(body).toHaveLength(2);
      expect(body[1].name).toBe('Goblin Ambush (Copy)');
    });
  });
});
