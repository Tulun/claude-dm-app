// Tests for app/dm/components/VaultTab.jsx — the read-only Campaign dashboard
// over the Obsidian vault. The key invariant (analogous to the save-echo rule
// for auto-saving pages): this tab must NEVER issue a POST.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VaultTab from '../../app/dm/components/VaultTab.jsx';

const NOW = Date.now();

const vaultIndex = {
  configured: true,
  vaultPath: '/vault',
  notes: [
    { path: 'Current Session 2/00-Lore dump.md', name: '00-Lore dump', folder: 'Current Session 2', dir: 'Current Session 2', mtime: NOW - 60_000, excerpt: 'Lore recap' },
    { path: 'Current Session 2/01-Gear.md', name: '01-Gear', folder: 'Current Session 2', dir: 'Current Session 2', mtime: NOW - 120_000, excerpt: 'Shopping' },
    { path: 'NPCs/Delina.md', name: 'Delina', folder: 'NPCs', dir: 'NPCs', mtime: NOW - 3_600_000, excerpt: 'An elven bard' },
    { path: 'PCs/Tidus.md', name: 'Tidus', folder: 'PCs', dir: 'PCs', mtime: NOW - 7_200_000, excerpt: '' },
    { path: 'PCs 2/Auld Nain.md', name: 'Auld Nain', folder: 'PCs 2', dir: 'PCs 2', mtime: NOW - 7_200_000, excerpt: '' },
  ],
};

const jsonResponse = (data) => ({ ok: true, json: async () => data });

function mockFetch({ index = vaultIndex, note } = {}) {
  const fn = vi.fn(async (url) => {
    if (url.startsWith('/api/vault?path=')) {
      return jsonResponse(note || { path: 'NPCs/Delina.md', name: 'Delina', dir: 'NPCs', mtime: NOW, content: 'An elven bard.\n' });
    }
    if (url === '/api/vault') return jsonResponse(index);
    return jsonResponse(null);
  });
  global.fetch = fn;
  return fn;
}

const flush = () => act(async () => {});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VaultTab', () => {
  it('shows the setup panel when the vault is not configured', async () => {
    mockFetch({ index: { configured: false, error: 'OBSIDIAN_VAULT_PATH is not set. Add it to .env.local.' } });
    render(<VaultTab />);
    await flush();

    expect(screen.getByText('Connect your Obsidian vault')).toBeInTheDocument();
    expect(screen.getByText(/OBSIDIAN_VAULT_PATH is not set/)).toBeInTheDocument();
  });

  it('renders session prep in order, folder groups merged across duplicates, and recents', async () => {
    mockFetch();
    render(<VaultTab />);
    await flush();

    expect(screen.getByText('Current Session')).toBeInTheDocument();
    const sessionTitles = screen.getByText('Current Session').closest('div');
    expect(sessionTitles.textContent.indexOf('00-Lore dump')).toBeLessThan(sessionTitles.textContent.indexOf('01-Gear'));

    // PCs and PCs 2 merge into one "PCs" section (heading text = name + count).
    const folderHeadings = screen.getAllByRole('heading', { level: 2 })
      .filter(h => h.textContent.startsWith('PCs'));
    expect(folderHeadings).toHaveLength(1);
    expect(screen.getAllByText('Tidus').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Auld Nain').length).toBeGreaterThan(0);

    expect(screen.getByText('Recently edited')).toBeInTheDocument();
    expect(screen.getByText(/Vault cleanup hint/i)).toBeInTheDocument();
  });

  it('opens a note in the reader modal on click', async () => {
    mockFetch();
    render(<VaultTab />);
    await flush();

    fireEvent.click(screen.getAllByText('Delina')[0]);
    await flush();

    expect(screen.getByText('An elven bard.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delina' })).toBeInTheDocument();
  });

  it('filters notes by search query', async () => {
    mockFetch();
    render(<VaultTab />);
    await flush();

    fireEvent.change(screen.getByPlaceholderText(/Search 5 notes/), { target: { value: 'delina' } });
    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(screen.getByText('Delina')).toBeInTheDocument();
    expect(screen.queryByText('Tidus')).toBeNull();
  });

  it('re-scans the vault when the window regains focus', async () => {
    const fetchMock = mockFetch();
    render(<VaultTab />);
    await flush();
    expect(fetchMock.mock.calls.filter(([u]) => u === '/api/vault')).toHaveLength(1);

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(fetchMock.mock.calls.filter(([u]) => u === '/api/vault')).toHaveLength(2);
  });

  it('is strictly read-only: never issues a POST, even after browsing', async () => {
    const fetchMock = mockFetch();
    render(<VaultTab />);
    await flush();

    fireEvent.click(screen.getAllByText('Delina')[0]);
    await flush();
    fireEvent.click(screen.getByTitle(/Re-scan the vault/));
    await flush();

    const posts = fetchMock.mock.calls.filter(([, opts]) => opts?.method && opts.method !== 'GET');
    expect(posts).toHaveLength(0);
  });
});
