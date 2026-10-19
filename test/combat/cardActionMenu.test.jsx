import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));

import CharacterCard from '../../app/combat/components/CharacterCard';

const druid = {
  id: 'p1', name: 'Efa', class: 'Druid', level: 4, currentHp: 35, maxHp: 35, ac: 15,
  wis: 16, spellStat: 'wis',
  spells: [{ id: 's1', name: 'Cure Wounds', level: 1, prepared: true }],
  inventory: [{ id: 'i1', name: 'Rope' }],
  resources: [{ id: 'r1', name: 'Wild Shape', current: 2, max: 2 }],
};
const goblin = { id: 'e1', name: 'Goblin', cr: '1/4', currentHp: 7, maxHp: 7, ac: 15 };

const renderCard = (c, isEnemy = false) =>
  render(<CharacterCard character={c} isEnemy={isEnemy} onUpdate={vi.fn()} onRemove={vi.fn()} onToggleExpand={vi.fn()} />);

describe('party card ⋯ menu', () => {
  it('collapses the header icons into one menu button', () => {
    renderCard(druid);
    for (const label of ['Character Sheet', 'Inventory', 'Spellbook', 'Resources', 'Wild Shape', 'Combat Notes']) {
      expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('More actions for Efa'));
    const menu = screen.getByRole('menu');
    expect(within(menu).getAllByRole('menuitem').map(i => i.textContent.replace(/[^\w ]/gu, '').trim())).toEqual([
      'Character Sheet', 'Inventory', 'Spellbook', 'Resources', 'Wild Shape', 'Combat Notes', 'Edit Character',
    ]);
    expect(within(menu).getByRole('menuitem', { name: 'Edit Character' })).toHaveAttribute('href', '/character?id=p1&type=party');
  });

  it('a menu item opens its modal and closes the menu', () => {
    renderCard(druid);
    fireEvent.click(screen.getByLabelText('More actions for Efa'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Combat Notes' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('Escape closes the menu', () => {
    renderCard(druid);
    fireEvent.click(screen.getByLabelText('More actions for Efa'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('the name opens the character sheet; the DC chip opens the spellbook', () => {
    renderCard(druid);
    expect(screen.queryByText('Saving Throws')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Efa' }));
    expect(screen.getByText('Saving Throws')).toBeInTheDocument();
    cleanup();
    renderCard(druid);
    expect(screen.queryByText('Cure Wounds')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Open spellbook'));
    expect(screen.getAllByText('Cure Wounds').length).toBeGreaterThan(0);
  });

  it('DC chip is a plain badge when the caster has no spellbook', () => {
    renderCard({ ...druid, spells: [] });
    expect(screen.queryByTitle('Open spellbook')).not.toBeInTheDocument();
  });

  it('flags active Innate Sorcery beside the name', () => {
    const sorc = { id: 'p2', name: 'Marshuh', class: 'Sorcerer', level: 4, currentHp: 30, maxHp: 30, ac: 14 };
    const { rerender } = renderCard(sorc);
    expect(screen.queryByLabelText('Innate Sorcery active')).not.toBeInTheDocument();
    rerender(<CharacterCard character={{ ...sorc, innateSorcery: true }} isEnemy={false} onUpdate={vi.fn()} />);
    expect(screen.getByLabelText('Innate Sorcery active')).toBeInTheDocument();
  });

  it('enemy cards keep their icon row (no menu)', () => {
    renderCard(goblin, true);
    expect(screen.getByRole('button', { name: 'View Stat Block' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Combat Notes' })).toBeInTheDocument();
    expect(screen.queryByLabelText('More actions for Goblin')).not.toBeInTheDocument();
  });
});
