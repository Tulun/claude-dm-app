import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));

import CombatantTable from '../../app/combat/components/CombatantTable.jsx';

const wizard = {
  id: 'p1', name: 'Elara', class: 'Wizard', level: 5, spellStat: 'int',
  str: 8, dex: 14, con: 12, int: 18, wis: 10, cha: 13,
  currentHp: 20, maxHp: 30, tempHp: 5, ac: 12, tempAC: 2, initiative: 14, speed: 30,
};

const ogre = {
  id: 'e1', name: 'Ogre', cr: '2', str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7,
  currentHp: 59, maxHp: 59, ac: 11, initiative: 9, speed: '40, climb 20',
  actions: [{ name: 'Greatclub', description: 'Melee' }],
};

const row = (id) => screen.getByTestId(`combatant-row-${id}`);

describe('CombatantTable', () => {
  it('renders one row per combatant with AC, HP, temp HP, spell DC, speed and all six abilities', () => {
    render(<CombatantTable combatants={[wizard]} isEnemy={false} onUpdate={vi.fn()} onRemove={vi.fn()} templates={[]} />);
    const r = within(row('p1'));
    expect(r.getByText('Elara')).toBeInTheDocument();
    expect(r.getByText('Wizard 5')).toBeInTheDocument();
    // card display AC: stored 12 + temp 2, added at display time only
    expect(r.getByLabelText('Temp AC for Elara')).toHaveTextContent('14');
    expect(r.getByLabelText('Current HP for Elara')).toHaveTextContent('20');
    expect(r.getByText('30')).toBeInTheDocument();
    expect(r.getByLabelText('Temp HP for Elara')).toHaveTextContent('+5');
    // 8 + prof 3 + INT 4
    expect(r.getByText('15')).toBeInTheDocument();
    expect(r.getByText('30 ft')).toBeInTheDocument();
    // canonical modifiers (getMod from rules.js)
    expect(r.getByText('18').nextSibling).toHaveTextContent('+4');
    expect(r.getByText('8').nextSibling).toHaveTextContent('-1');
    // party rows link to the sheet editor
    expect(r.getByLabelText('Edit Character')).toHaveAttribute('href', '/character?id=p1&type=party');
  });

  it('enemy rows show CR, extra speed modes and a remove button', () => {
    render(<CombatantTable combatants={[ogre]} isEnemy onUpdate={vi.fn()} onRemove={vi.fn()} templates={[]} />);
    const r = within(row('e1'));
    expect(r.getByText('CR 2')).toBeInTheDocument();
    expect(r.getByTitle('40 ft · climb 20 ft')).toHaveTextContent('40 ft +1');
    expect(r.getByLabelText('Remove from Combat')).toBeInTheDocument();
    expect(r.queryByLabelText('Edit Character')).not.toBeInTheDocument();
  });

  it('HP, temp HP and temp AC edits go through onUpdate with the card semantics', () => {
    const onUpdate = vi.fn();
    render(<CombatantTable combatants={[wizard]} isEnemy={false} onUpdate={onUpdate} onRemove={vi.fn()} templates={[]} />);

    fireEvent.click(screen.getByLabelText('Current HP for Elara'));
    const hp = screen.getByLabelText('Current HP for Elara');
    fireEvent.change(hp, { target: { value: '12' } });
    fireEvent.keyDown(hp, { key: 'Enter' });
    expect(onUpdate).toHaveBeenLastCalledWith({ ...wizard, currentHp: 12 });

    // negative HP is rejected, like the card badge
    onUpdate.mockClear();
    fireEvent.click(screen.getByLabelText('Current HP for Elara'));
    fireEvent.change(screen.getByLabelText('Current HP for Elara'), { target: { value: '-3' } });
    fireEvent.blur(screen.getByLabelText('Current HP for Elara'));
    expect(onUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Temp HP for Elara'));
    fireEvent.change(screen.getByLabelText('Temp HP for Elara'), { target: { value: '8' } });
    fireEvent.keyDown(screen.getByLabelText('Temp HP for Elara'), { key: 'Enter' });
    expect(onUpdate).toHaveBeenLastCalledWith({ ...wizard, tempHp: 8 });

    // blank temp AC clears to 0
    fireEvent.click(screen.getByLabelText('Temp AC for Elara'));
    fireEvent.change(screen.getByLabelText('Temp AC for Elara'), { target: { value: '' } });
    fireEvent.keyDown(screen.getByLabelText('Temp AC for Elara'), { key: 'Enter' });
    expect(onUpdate).toHaveBeenLastCalledWith({ ...wizard, tempAC: 0 });
  });

  it('Escape cancels an inline edit without updating', () => {
    const onUpdate = vi.fn();
    render(<CombatantTable combatants={[wizard]} isEnemy={false} onUpdate={onUpdate} onRemove={vi.fn()} templates={[]} />);
    fireEvent.click(screen.getByLabelText('Current HP for Elara'));
    fireEvent.change(screen.getByLabelText('Current HP for Elara'), { target: { value: '1' } });
    fireEvent.keyDown(screen.getByLabelText('Current HP for Elara'), { key: 'Escape' });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Current HP for Elara')).toHaveTextContent('20');
  });

  it('action buttons open the shared card modals', () => {
    const onRemove = vi.fn();
    render(<CombatantTable combatants={[ogre]} isEnemy onUpdate={vi.fn()} onRemove={onRemove} templates={[]} />);
    expect(screen.getByLabelText('Quick Actions')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Remove from Combat'));
    expect(screen.getByText('Kill Ogre?')).toBeInTheDocument();
  });

  it('party rows open the character sheet modal', () => {
    render(<CombatantTable combatants={[wizard]} isEnemy={false} onUpdate={vi.fn()} onRemove={vi.fn()} templates={[]} />);
    fireEvent.click(screen.getByLabelText('Character Sheet'));
    expect(screen.getByText('Ability Scores')).toBeInTheDocument();
  });

  it('wild shape swaps in beast AC and physical scores and locks temp AC', () => {
    const druid = {
      ...wizard, id: 'p2', name: 'Bryn', class: 'Druid', spellStat: 'wis',
      wildShapeActive: true, wildShapeFormId: 'f1',
      wildShapeForms: [{ id: 'f1', name: 'Wolf', ac: 13, str: 12, dex: 15, con: 12, speed: 40 }],
    };
    render(<CombatantTable combatants={[druid]} isEnemy={false} onUpdate={vi.fn()} onRemove={vi.fn()} templates={[]} />);
    const r = within(row('p2'));
    expect(r.getByText(/Wolf/)).toBeInTheDocument();
    expect(r.getByLabelText('Temp AC for Bryn')).toHaveTextContent('13');
    expect(r.getByLabelText('Temp AC for Bryn')).toBeDisabled();
    expect(r.getByText('15')).toHaveClass('font-mono');
    expect(r.getByText('40 ft')).toBeInTheDocument();
  });
});
