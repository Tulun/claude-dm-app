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
  render(<CharacterCard character={c} isEnemy={isEnemy} onUpdate={vi.fn()} onRemove={vi.fn()} />);

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

  it('the name opens the detail drawer (not the sheet); the DC chip opens the spellbook', () => {
    const onInspect = vi.fn();
    render(<CharacterCard character={druid} isEnemy={false} onUpdate={vi.fn()} onInspect={onInspect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Details for Efa' }));
    expect(onInspect).toHaveBeenCalledWith('p1');
    expect(screen.queryByText('Saving Throws')).not.toBeInTheDocument();
    cleanup();
    // the sheet is still one click away in the ⋯ menu
    renderCard(druid);
    fireEvent.click(screen.getByLabelText('More actions for Efa'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Character Sheet' }));
    expect(screen.getByText('Saving Throws')).toBeInTheDocument();
    cleanup();
    renderCard(druid);
    expect(screen.queryByText('Cure Wounds')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Open spellbook'));
    expect(screen.getAllByText('Cure Wounds').length).toBeGreaterThan(0);
  });

  it('enemy names open the drawer too; no separate details button', () => {
    const onInspect = vi.fn();
    render(<CharacterCard character={goblin} isEnemy onUpdate={vi.fn()} onRemove={vi.fn()} onInspect={onInspect} />);
    const details = screen.getAllByRole('button', { name: 'Details for Goblin' });
    expect(details).toHaveLength(1);
    expect(details[0]).toHaveTextContent('Goblin');
    fireEvent.click(details[0]);
    expect(onInspect).toHaveBeenCalledWith('e1');
  });

  it('without a drawer (onInspect) the name is plain text', () => {
    renderCard(goblin, true);
    expect(screen.queryByRole('button', { name: 'Details for Goblin' })).not.toBeInTheDocument();
    expect(screen.getByText('Goblin').tagName).toBe('H3');
    expect(screen.getByText('Goblin')).toBeInTheDocument();
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

  it('enemy cards use the ⋯ menu too, with Remove from Combat instead of Edit', () => {
    const onRemove = vi.fn();
    render(<CharacterCard character={goblin} isEnemy onUpdate={vi.fn()} onRemove={onRemove} onInspect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'View Stat Block' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('More actions for Goblin'));
    expect(within(screen.getByRole('menu')).getAllByRole('menuitem').map(i => i.textContent.replace(/[^\w ]/gu, '').trim())).toEqual([
      'Details', 'View Stat Block', 'Combat Notes', 'Remove from Combat',
    ]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove from Combat' }));
    expect(screen.getByText('Kill Goblin?')).toBeInTheDocument();
  });
});
