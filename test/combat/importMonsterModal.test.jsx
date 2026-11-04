// ImportMonsterModal — multi-screenshot import. A big stat block (e.g. a
// beholder) can be split across several screenshots that are sent together
// and parsed into ONE monster.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportMonsterModal, { withBook } from '../../app/combat/components/ImportMonsterModal.jsx';

const png = (name, body = name) => new File([body], name, { type: 'image/png' });

const renderModal = (props = {}) =>
  render(<ImportMonsterModal isOpen onClose={vi.fn()} onImport={vi.fn()} {...props} />);

const addFiles = (files) =>
  fireEvent.change(screen.getByTestId('import-file-input'), { target: { files } });

const shots = () => screen.queryAllByTestId('import-screenshot');
const shotAlts = () => shots().map(s => s.querySelector('img').getAttribute('src'));

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({
    json: async () => ({ success: true, monster: { name: 'Beholder', traits: [], actions: [] } }),
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe('ImportMonsterModal — multiple screenshots', () => {
  it('accepts several files at once and keeps selection order', async () => {
    renderModal();
    addFiles([png('top'), png('bottom')]);
    await waitFor(() => expect(shots()).toHaveLength(2));
    expect(shotAlts()[0]).toContain(btoa('top'));
    expect(shotAlts()[1]).toContain(btoa('bottom'));
    expect(screen.getByText(/2 screenshots will be combined/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Parse 2 Images/ })).toBeInTheDocument();
  });

  it('appends a second screenshot added later', async () => {
    renderModal();
    addFiles([png('top')]);
    await waitFor(() => expect(shots()).toHaveLength(1));
    expect(screen.getByText(/Add another screenshot/)).toBeInTheDocument();
    addFiles([png('bottom')]);
    await waitFor(() => expect(shots()).toHaveLength(2));
  });

  it('reorders and removes screenshots', async () => {
    renderModal();
    addFiles([png('top'), png('bottom')]);
    await waitFor(() => expect(shots()).toHaveLength(2));

    fireEvent.click(screen.getByLabelText('Move screenshot 2 earlier'));
    expect(shotAlts()[0]).toContain(btoa('bottom'));

    fireEvent.click(screen.getByLabelText('Remove screenshot 1'));
    expect(shots()).toHaveLength(1);
    expect(shotAlts()[0]).toContain(btoa('top'));
  });

  it('posts all screenshots in display order in one request', async () => {
    renderModal();
    addFiles([png('top'), png('bottom')]);
    await waitFor(() => expect(shots()).toHaveLength(2));
    fireEvent.click(screen.getByLabelText('Move screenshot 2 earlier'));

    fireEvent.click(screen.getByRole('button', { name: /Parse 2 Images/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.images).toEqual([
      { data: btoa('bottom'), mediaType: 'image/png' },
      { data: btoa('top'), mediaType: 'image/png' },
    ]);
    await screen.findByText(/Monster Parsed Successfully/);
  });

  it('caps the list at 6 screenshots', async () => {
    renderModal();
    addFiles(Array.from({ length: 7 }, (_, i) => png(`p${i}`)));
    await waitFor(() => expect(shots()).toHaveLength(6));
    expect(screen.getByText(/at most 6 screenshots/)).toBeInTheDocument();
    // Drop zone disappears once full
    expect(screen.queryByTestId('import-file-input')).toBeNull();
  });

  it('ignores non-image files', async () => {
    renderModal();
    addFiles([new File(['x'], 'notes.txt', { type: 'text/plain' }), png('top')]);
    await waitFor(() => expect(shots()).toHaveLength(1));
  });
});

describe('ImportMonsterModal — source book tag', () => {
  const parseOne = async (props) => {
    renderModal(props);
    addFiles([png('top')]);
    await waitFor(() => expect(shots()).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: /Parse Image/ }));
    await screen.findByText(/Monster Parsed Successfully/);
  };

  it('tags the imported monster with the chosen book and remembers it', async () => {
    const onImport = vi.fn();
    await parseOne({ onImport });
    fireEvent.change(screen.getByLabelText(/Source book/), { target: { value: '  MM 2014 ' } });
    fireEvent.click(screen.getByRole('button', { name: /Import Monster/ }));
    expect(onImport).toHaveBeenCalledWith(expect.objectContaining({ name: 'Beholder', book: 'MM 2014' }));
    expect(localStorage.getItem('import-monster-book')).toBe('MM 2014');
  });

  it('prefills the last book and leaves the tag off when cleared', async () => {
    localStorage.setItem('import-monster-book', 'VGtM');
    const onImport = vi.fn();
    await parseOne({ onImport });
    expect(screen.getByLabelText(/Source book/)).toHaveValue('VGtM');
    fireEvent.change(screen.getByLabelText(/Source book/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Import Monster/ }));
    expect('book' in onImport.mock.calls[0][0]).toBe(false);
  });

  it('withBook trims, sets, or drops the tag', () => {
    expect(withBook({ name: 'X' }, ' MM 2024 ')).toEqual({ name: 'X', book: 'MM 2024' });
    expect(withBook({ name: 'X', book: 'Old' }, '')).toEqual({ name: 'X' });
  });
});
