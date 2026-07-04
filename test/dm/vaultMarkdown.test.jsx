// Tests for app/dm/components/VaultMarkdown.jsx — the read-only markdown
// renderer for Obsidian notes. It builds React nodes directly; the key
// invariant is that it introduces NO dangerouslySetInnerHTML (the app's only
// sanctioned sink is the spellbook — see the frontend-patterns skill).

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VaultMarkdown from '../../app/dm/components/VaultMarkdown.jsx';

describe('VaultMarkdown', () => {
  it('renders headings, paragraphs, bold, and lists', () => {
    const content = '# The Great Swamp\n\nAn odd **fog** has befallen the swamp.\n\n- Delina\n- Marcus Voss\n';
    render(<VaultMarkdown content={content} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The Great Swamp');
    expect(screen.getByText('fog').tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual(['Delina', 'Marcus Voss']);
  });

  it('strips frontmatter instead of rendering it', () => {
    render(<VaultMarkdown content={'---\ntags: npc\n---\nShe sings.\n'} />);
    expect(screen.queryByText(/tags:/)).toBeNull();
    expect(screen.getByText('She sings.')).toBeInTheDocument();
  });

  it('renders raw HTML in notes as inert text, not markup', () => {
    const { container } = render(
      <VaultMarkdown content={'<img src=x onerror=alert(1)> and <script>alert(2)</script>\n'} />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('renders wikilinks to known notes as buttons that open them', () => {
    const onOpenNote = vi.fn();
    const notesByName = new Map([['gaia', 'Lore/Gaia.md']]);
    render(
      <VaultMarkdown content={'Ask [[Gaia]] about [[Unknown Place]].\n'} notesByName={notesByName} onOpenNote={onOpenNote} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gaia' }));
    expect(onOpenNote).toHaveBeenCalledWith('Lore/Gaia.md');
    // Unresolved links render as plain styled text, not buttons.
    expect(screen.queryByRole('button', { name: 'Unknown Place' })).toBeNull();
    expect(screen.getByText('Unknown Place')).toBeInTheDocument();
  });

  it('honors wikilink aliases and heading anchors', () => {
    const onOpenNote = vi.fn();
    const notesByName = new Map([['gaia', 'Lore/Gaia.md']]);
    render(
      <VaultMarkdown content={'See [[Gaia#Origins|the goddess]].\n'} notesByName={notesByName} onOpenNote={onOpenNote} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'the goddess' }));
    expect(onOpenNote).toHaveBeenCalledWith('Lore/Gaia.md');
  });

  it('only links external URLs with http(s) schemes', () => {
    const { container } = render(
      <VaultMarkdown content={'[safe](https://example.com) [evil](javascript:alert(1))\n'} />
    );
    const links = [...container.querySelectorAll('a')];
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
    // The javascript: link is rendered as plain text, not an anchor.
    expect(container.textContent).toContain('evil');
  });

  it('uses no dangerouslySetInnerHTML anywhere in its output', () => {
    const { container } = render(
      <VaultMarkdown content={'# Hi\n\n**bold** [[link]] `code`\n\n> quote\n\n---\n\n1. one\n'} />
    );
    expect(container.innerHTML).not.toContain('alert');
    expect(container.querySelector('hr')).toBeInTheDocument();
    expect(container.querySelector('blockquote')).toBeInTheDocument();
    expect(container.querySelector('ol')).toBeInTheDocument();
  });
});
