import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/characters',
}));

import CharactersPage from '../../app/characters/page.jsx';
import { defaultPartyData } from '../../app/components/defaultData.js';

const party = [
  { id: 'p1', name: 'Theren', class: 'Ranger', level: 5, currentHp: 38, maxHp: 44, ac: 15 },
];
const npcs = [
  { id: 'dm-npc-1', name: 'Bartender Olm', class: 'Commoner', level: 1, maxHp: 12, currentHp: 12, isDmNpc: true },
];

const jsonResponse = (data) => ({ ok: true, json: async () => data });

function mockFetch({ partyData = party, npcData = npcs } = {}) {
  const fn = vi.fn(async (url, opts = {}) => {
    if (opts.method === 'POST') return jsonResponse({ success: true });
    if (url === '/api/party') return jsonResponse(partyData);
    if (url === '/api/dm-npcs') return jsonResponse(npcData);
    return jsonResponse(null);
  });
  global.fetch = fn;
  return fn;
}

const flush = () => act(async () => {});
const settle = async () => {
  await flush();
  await act(async () => { vi.advanceTimersByTime(1100); });
  await flush();
};

const postCalls = (fetchMock, url) =>
  fetchMock.mock.calls.filter(([u, opts]) => u === url && opts?.method === 'POST');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CharactersPage — loading', () => {
  it('renders party members and DM NPCs from the API', async () => {
    mockFetch();
    render(<CharactersPage />);
    await settle();

    expect(screen.getByText('Theren')).toBeInTheDocument();
    expect(screen.getByText('Bartender Olm')).toBeInTheDocument();
  });

  it('falls back to the default party when the API returns null', async () => {
    mockFetch({ partyData: null });
    render(<CharactersPage />);
    await settle();

    for (const member of defaultPartyData) {
      expect(screen.getByText(member.name)).toBeInTheDocument();
    }
  });

  it('does not echo loaded data back to the API after load', async () => {
    const fetchMock = mockFetch();
    render(<CharactersPage />);
    await settle();

    expect(postCalls(fetchMock, '/api/party')).toHaveLength(0);
    expect(postCalls(fetchMock, '/api/dm-npcs')).toHaveLength(0);
  });
});

describe('CharactersPage — DM NPC management', () => {
  it('creates a new NPC through the form and persists it', async () => {
    const fetchMock = mockFetch();
    const { container } = render(<CharactersPage />);
    await settle();
    fetchMock.mockClear();

    fireEvent.click(screen.getByText('New NPC'));
    fireEvent.change(container.querySelector('input[name="npcName"]'), { target: { value: 'Captain Reva' } });
    fireEvent.change(container.querySelector('input[name="npcClass"]'), { target: { value: 'Fighter' } });
    fireEvent.change(container.querySelector('input[name="npcHP"]'), { target: { value: '30' } });

    // jsdom does not implement named property access on forms (form.npcName),
    // which the submit handler relies on — shim it the way browsers behave.
    const form = container.querySelector('form');
    for (const el of form.elements) {
      if (el.name) form[el.name] = el;
    }
    fireEvent.click(screen.getByText('Create NPC'));

    expect(screen.getByText('Captain Reva')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(1100); });
    await flush();

    const saves = postCalls(fetchMock, '/api/dm-npcs');
    expect(saves).toHaveLength(1);
    const saved = JSON.parse(saves[0][1].body);
    const reva = saved.find((n) => n.name === 'Captain Reva');
    expect(reva).toMatchObject({ class: 'Fighter', maxHp: 30, currentHp: 30, isDmNpc: true, level: 1 });
  });

  it('adds an NPC to the party as a linked copy', async () => {
    const fetchMock = mockFetch();
    render(<CharactersPage />);
    await settle();
    fetchMock.mockClear();

    fireEvent.click(screen.getByText('Add to Party'));

    // the copy appears in the party section with a remove control
    expect(screen.getAllByText('Bartender Olm').length).toBe(2);
    expect(screen.getByText('NPC added to party')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(1100); });
    await flush();

    const saves = postCalls(fetchMock, '/api/party');
    expect(saves).toHaveLength(1);
    const saved = JSON.parse(saves[0][1].body);
    const copy = saved.find((p) => p.sourceNpcId === 'dm-npc-1');
    expect(copy).toBeTruthy();
    expect(copy.currentHp).toBe(12);
    // the original NPC record is untouched
    expect(saved.some((p) => p.id === 'dm-npc-1')).toBe(false);
  });

  it('deletes an NPC after confirmation', async () => {
    mockFetch();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CharactersPage />);
    await settle();

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.queryByText('Bartender Olm')).not.toBeInTheDocument();
  });

  it('does not delete when confirmation is declined', async () => {
    mockFetch();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CharactersPage />);
    await settle();

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Bartender Olm')).toBeInTheDocument();
  });

  it('persists deleting the last NPC (empty list is saved)', async () => {
    const fetchMock = mockFetch();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CharactersPage />);
    await settle();
    fetchMock.mockClear();

    fireEvent.click(screen.getByText('Delete'));
    await act(async () => { vi.advanceTimersByTime(1100); });
    await flush();

    const saves = postCalls(fetchMock, '/api/dm-npcs');
    expect(saves).toHaveLength(1);
    expect(JSON.parse(saves[0][1].body)).toEqual([]);
  });
});
