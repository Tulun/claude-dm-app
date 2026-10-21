import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));

import CharacterCard from '../../app/combat/components/CharacterCard';
import { TOOLTIP_DELAY_MS } from '../../app/utils/timings.js';
import CombatantTable from '../../app/combat/components/CombatantTable.jsx';

const goblin = { id: 'e1', name: 'Goblin', cr: '1/4', currentHp: 7, maxHp: 7, ac: 15, conditions: [{ name: 'Prone' }] };
const hero = { id: 'p1', name: 'Theren', class: 'Ranger', level: 5, currentHp: 30, maxHp: 30, ac: 15 };

// Stateful harness so the open picker sees each update, like the page does.
function Harness({ initial, isEnemy, table = false, spy }) {
  const [c, setC] = useState(initial);
  const onUpdate = (u) => { spy?.(u); setC(u); };
  return table
    ? <CombatantTable combatants={[c]} isEnemy={isEnemy} onUpdate={onUpdate} onRemove={vi.fn()} templates={[]} />
    : <CharacterCard character={c} isEnemy={isEnemy} onUpdate={onUpdate} onRemove={vi.fn()} />;
}

describe('condition chips + picker', () => {
  it('the + button and chips use the shared Tooltip (short hover delay), not a native title', () => {
    vi.useFakeTimers();
    try {
      render(<Harness initial={goblin} isEnemy />);
      const add = screen.getByLabelText('Add condition to Goblin');
      expect(add).not.toHaveAttribute('title');
      fireEvent.mouseEnter(add.parentElement);
      act(() => { vi.advanceTimersByTime(TOOLTIP_DELAY_MS - 1); });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(1); });
      expect(screen.getByRole('tooltip')).toHaveTextContent('Add or remove conditions');
      fireEvent.mouseLeave(add.parentElement);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // leaving before the delay cancels it
      const chip = screen.getByText('Prone').closest('span');
      expect(chip).not.toHaveAttribute('title');
      fireEvent.mouseEnter(chip.parentElement);
      fireEvent.mouseLeave(chip.parentElement);
      act(() => { vi.advanceTimersByTime(TOOLTIP_DELAY_MS); });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      fireEvent.mouseEnter(chip.parentElement);
      act(() => { vi.advanceTimersByTime(TOOLTIP_DELAY_MS); });
      expect(screen.getByRole('tooltip').textContent.length).toBeGreaterThan(10);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows active conditions on the card and removes one with a single click', () => {
    const spy = vi.fn();
    render(<Harness initial={goblin} isEnemy spy={spy} />);
    expect(screen.getByText('Prone')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Remove Prone from Goblin'));
    expect(spy).toHaveBeenLastCalledWith({ ...goblin, conditions: [] });
    expect(screen.queryByText('Prone')).not.toBeInTheDocument();
  });

  it('the picker toggles conditions on and off immediately, no Save step', () => {
    const spy = vi.fn();
    render(<Harness initial={hero} isEnemy={false} spy={spy} />);
    fireEvent.click(screen.getByLabelText('Add condition to Theren'));
    const poisoned = screen.getByRole('button', { name: /Poisoned/, pressed: false });
    fireEvent.click(poisoned);
    expect(spy).toHaveBeenLastCalledWith({ ...hero, conditions: [{ name: 'Poisoned' }] });
    expect(screen.getByRole('button', { name: /Poisoned/, pressed: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Concentrating/ }));
    fireEvent.click(screen.getByRole('button', { name: /Poisoned/, pressed: true }));
    expect(spy).toHaveBeenLastCalledWith({ ...hero, conditions: [{ name: 'Concentrating' }] });
  });

  it('exhaustion uses a level stepper and shows its level on the chip', () => {
    const spy = vi.fn();
    render(<Harness initial={hero} isEnemy={false} spy={spy} />);
    fireEvent.click(screen.getByLabelText('Add condition to Theren'));
    expect(screen.getByLabelText('Decrease exhaustion')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Increase exhaustion'));
    fireEvent.click(screen.getByLabelText('Increase exhaustion'));
    expect(screen.getByTestId('exhaustion-level')).toHaveTextContent('2');
    expect(screen.getByText('Exhaustion 2')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Decrease exhaustion'));
    fireEvent.click(screen.getByLabelText('Decrease exhaustion'));
    expect(spy).toHaveBeenLastCalledWith({ ...hero, conditions: [] });
  });

  it('Clear all empties the list; Done closes the picker', () => {
    const spy = vi.fn();
    render(<Harness initial={{ ...goblin, conditions: [{ name: 'Prone' }, { name: 'Stunned' }] }} isEnemy spy={spy} />);
    fireEvent.click(screen.getByLabelText('Add condition to Goblin'));
    fireEvent.click(screen.getByText('Clear all'));
    expect(spy.mock.lastCall[0].conditions).toEqual([]);
    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
  });

  it('table rows get the same chips and picker', () => {
    const spy = vi.fn();
    render(<Harness initial={goblin} isEnemy table spy={spy} />);
    expect(screen.getByText('Prone')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Add condition to Goblin'));
    fireEvent.click(screen.getByRole('button', { name: /Grappled/ }));
    expect(spy).toHaveBeenLastCalledWith({ ...goblin, conditions: [{ name: 'Prone' }, { name: 'Grappled' }] });
  });

  it('the picker sets a duration in rounds or until end of next turn, shown on the chip', () => {
    const spy = vi.fn();
    render(<Harness initial={{ ...goblin, conditions: [{ name: 'Frightened' }] }} isEnemy spy={spy} />);
    // untimed: no duration on the chip
    expect(screen.queryByTestId('condition-duration')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Add condition to Goblin'));
    const select = screen.getByLabelText('Frightened duration');
    fireEvent.change(select, { target: { value: 'rounds' } });
    expect(spy.mock.lastCall[0].conditions).toEqual([{ name: 'Frightened', rounds: 1 }]);
    fireEvent.change(screen.getByLabelText('Frightened rounds'), { target: { value: '10' } });
    expect(spy.mock.lastCall[0].conditions).toEqual([{ name: 'Frightened', rounds: 10 }]);
    // an empty/zero entry mid-typing is ignored rather than clearing the timer
    fireEvent.change(screen.getByLabelText('Frightened rounds'), { target: { value: '' } });
    expect(spy.mock.lastCall[0].conditions).toEqual([{ name: 'Frightened', rounds: 10 }]);
    fireEvent.change(select, { target: { value: 'eont' } });
    expect(spy.mock.lastCall[0].conditions).toEqual([{ name: 'Frightened', until: 'endOfNextTurn' }]);
    expect(screen.queryByLabelText('Frightened rounds')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByTestId('condition-duration')).toHaveTextContent('next turn');
    fireEvent.click(screen.getByLabelText('Add condition to Goblin'));
    fireEvent.change(screen.getByLabelText('Frightened duration'), { target: { value: 'none' } });
    expect(spy.mock.lastCall[0].conditions).toEqual([{ name: 'Frightened' }]);
  });

  it('shows remaining rounds on the chip; Exhaustion gets no duration control', () => {
    render(<Harness initial={{ ...goblin, conditions: [{ name: 'Stunned', rounds: 3 }, { name: 'Exhaustion', level: 1 }] }} isEnemy />);
    expect(screen.getByTestId('condition-duration')).toHaveTextContent('3r');
    // the remove button keeps the plain label
    expect(screen.getByLabelText('Remove Stunned from Goblin')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Add condition to Goblin'));
    expect(screen.getByLabelText('Stunned duration')).toHaveValue('rounds');
    expect(screen.getByLabelText('Stunned rounds')).toHaveValue(3);
    expect(screen.queryByLabelText('Exhaustion duration')).not.toBeInTheDocument();
  });

  it('no duration section while nothing (but Exhaustion) is active', () => {
    render(<Harness initial={hero} isEnemy={false} />);
    fireEvent.click(screen.getByLabelText('Add condition to Theren'));
    expect(screen.queryByText('Duration')).not.toBeInTheDocument();
  });
});

describe('combat notes', () => {
  it('party members get a Combat Notes button and the modal is free text only', () => {
    const spy = vi.fn();
    render(<Harness initial={hero} isEnemy={false} spy={spy} />);
    // party cards keep Combat Notes in the ⋯ menu
    fireEvent.click(screen.getByLabelText('More actions for Theren'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Combat Notes' }));
    expect(screen.queryByText('Quick add:')).not.toBeInTheDocument();
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: '  Hiding behind the pillar  ' } });
    fireEvent.keyDown(box, { key: 'Enter', metaKey: true });
    expect(spy).toHaveBeenLastCalledWith({ ...hero, combatNotes: 'Hiding behind the pillar' });
    // the note shows on the card
    expect(screen.getByText('Hiding behind the pillar')).toBeInTheDocument();
  });
});
