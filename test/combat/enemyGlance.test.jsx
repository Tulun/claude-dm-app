import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));

import CharacterCard from '../../app/combat/components/CharacterCard';

const dragon = {
  id: 'e1', name: 'Ancient Brass Dragon', size: 'Gargantuan', creatureType: 'Dragon', cr: '20',
  currentHp: 297, maxHp: 297, ac: 20, speed: '40, burrow 40, fly 80',
  str: 27, dex: 10, con: 25, int: 16, wis: 15, cha: 19,
  savingThrows: 'Dex +6, Con +13, Wis +8, Cha +10',
  senses: 'Blindsight 60 ft., Darkvision 120 ft., Passive Perception 24',
  resistances: 'Cold', immunities: 'Fire; Frightened', vulnerabilities: 'Thunder',
  traits: [{ name: 'Legendary Resistance (3/Day)', description: 'Succeed instead.' }],
  actions: [
    { name: 'Bite', description: '+14 to hit.' },
    { name: 'Breath Weapons (Recharge 5-6)', description: 'Fire breath.' },
    { name: 'Spellcasting', description: 'Spell save DC 18, +10 to hit with spell attacks. 1/day each: fly, sleep.' },
  ],
  legendaryActions: [{ name: 'Tail', description: 'Tail attack.' }],
};

const renderCard = (c = dragon, onUpdate = vi.fn()) => {
  render(<CharacterCard character={c} isEnemy onUpdate={onUpdate} onRemove={vi.fn()} onInspect={vi.fn()} />);
  return onUpdate;
};

describe('enemy card glowup', () => {
  it('subtitle reads size, type and CR', () => {
    renderCard();
    expect(screen.getByText('Gargantuan Dragon · CR 20')).toBeInTheDocument();
  });

  it('ability row leads with the modifier and marks proficient saves from the stat block', () => {
    renderCard();
    expect(screen.getByTestId('ability-str')).toHaveTextContent('+8');
    expect(screen.getByTestId('save-str')).toHaveTextContent('save +8'); // unlisted → modifier
    expect(screen.getByTestId('save-con')).toHaveTextContent('save +13');
    expect(screen.getByTestId('save-con').className).toMatch(/amber/);
    expect(screen.getByTestId('save-str').className).not.toMatch(/amber/);
  });

  it('glance shows passive Perception, senses, speeds and defenses chips', () => {
    renderCard();
    expect(screen.getByTestId('enemy-passive-perception')).toHaveTextContent('24');
    expect(screen.getByText('Darkvision 120 ft.')).toBeInTheDocument();
    expect(screen.getByTestId('enemy-speed')).toHaveTextContent('40 ft · burrow 40 ft · fly 80 ft');
    expect(screen.getByTestId('defense-vulnerabilities')).toHaveTextContent('Thunder');
    expect(screen.getByTestId('defense-resistances')).toHaveTextContent('Cold');
    expect(screen.getByTestId('defense-immunities')).toHaveTextContent(/Fire.*Frightened/);
  });

  it('limited-use pips: legendary, X/Day, recharge and per-day spells; clicking spends', () => {
    const onUpdate = renderCard();
    expect(screen.getAllByTitle(/^Legendary actions: use/)).toHaveLength(3);
    expect(screen.getAllByTitle(/^Legendary Resistance: use/)).toHaveLength(3);
    expect(screen.getAllByTitle(/^Breath Weapons: use/)).toHaveLength(1);
    expect(screen.getByText('Recharge 5+')).toBeInTheDocument();
    expect(screen.getAllByTitle(/^1\/Day spells: use/)).toHaveLength(1);

    fireEvent.click(screen.getByTitle('Legendary actions: use 1'));
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ legendaryActionsUsed: 1 }));
    fireEvent.click(screen.getByTitle('Breath Weapons: use 1'));
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      abilityUses: { 'Breath Weapons (Recharge 5-6)': 1 },
    }));
  });

  it('spellcasting DC gets a pill; action chips drop the usage parenthetical', () => {
    renderCard();
    expect(screen.getByTitle(/^Spellcasting · \+10 to hit/)).toHaveTextContent('18DC');
    expect(screen.getByRole('button', { name: 'Breath Weapons' })).toBeInTheDocument();
  });

  it('a bare monster still renders (no glance pools, dashes for passive)', () => {
    renderCard({ id: 'g', name: 'Goblin', currentHp: 7, maxHp: 7, ac: 15 });
    expect(screen.queryByLabelText('Limited uses')).not.toBeInTheDocument();
    expect(screen.getByTestId('enemy-passive-perception')).toHaveTextContent('—');
    expect(screen.getByTestId('enemy-speed')).toHaveTextContent('30 ft');
  });
});
