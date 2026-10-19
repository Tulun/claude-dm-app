import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));

import CharacterCard from '../../app/combat/components/CharacterCard';

const hero = { id: 'p1', name: 'Efa', class: 'Druid', level: 4, currentHp: 30, maxHp: 35, ac: 15, tempHp: 6 };

const setup = (c = hero, isEnemy = false) => {
  const onUpdate = vi.fn();
  render(<CharacterCard character={c} isEnemy={isEnemy} onUpdate={onUpdate} />);
  return onUpdate;
};
const openEditor = () => fireEvent.click(screen.getByLabelText('HP for Efa'));
const hpInput = () => screen.getByLabelText('Current HP for Efa');
const thpInput = () => screen.getByLabelText('Temp HP for Efa');

describe('HP pill with inline temp HP', () => {
  it('shows THP inside the pill; there is no separate THP chip', () => {
    setup();
    expect(screen.getByTestId('temp-hp')).toHaveTextContent('+6');
    expect(screen.queryByText('+THP')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Click to add/edit Temporary HP')).not.toBeInTheDocument();
  });

  it('no THP → no +N in the pill', () => {
    setup({ ...hero, tempHp: 0 });
    expect(screen.queryByTestId('temp-hp')).not.toBeInTheDocument();
  });

  it('one editor sets HP and THP together on Enter', () => {
    const onUpdate = setup();
    openEditor();
    expect(hpInput()).toHaveValue('30');
    expect(thpInput()).toHaveValue('6');
    fireEvent.change(hpInput(), { target: { value: '22' } });
    fireEvent.change(thpInput(), { target: { value: '10' } });
    fireEvent.keyDown(thpInput(), { key: 'Enter' });
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith({ ...hero, currentHp: 22, tempHp: 10 });
    expect(screen.queryByLabelText('Temp HP for Efa')).not.toBeInTheDocument();
  });

  it('moving between fields does not commit (no commit-on-blur)', () => {
    const onUpdate = setup();
    openEditor();
    fireEvent.change(hpInput(), { target: { value: '25' } });
    fireEvent.blur(hpInput());
    expect(onUpdate).not.toHaveBeenCalled();
    expect(thpInput()).toBeInTheDocument();
  });

  it('Escape cancels; an unchanged commit sends nothing', () => {
    const onUpdate = setup();
    openEditor();
    fireEvent.change(hpInput(), { target: { value: '1' } });
    fireEvent.keyDown(hpInput(), { key: 'Escape' });
    expect(onUpdate).not.toHaveBeenCalled();
    openEditor();
    fireEvent.keyDown(hpInput(), { key: 'Enter' });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('invalid fields are ignored individually (Table view rule); 0 clears THP', () => {
    const onUpdate = setup();
    openEditor();
    fireEvent.change(hpInput(), { target: { value: '-3' } });
    fireEvent.change(thpInput(), { target: { value: '0' } });
    fireEvent.keyDown(hpInput(), { key: 'Enter' });
    expect(onUpdate).toHaveBeenLastCalledWith({ ...hero, tempHp: 0 });
  });

  it('works the same on enemy cards', () => {
    const onUpdate = setup({ id: 'e1', name: 'Efa', cr: '1', currentHp: 7, maxHp: 7, ac: 12 }, true);
    openEditor();
    fireEvent.change(thpInput(), { target: { value: '4' } });
    fireEvent.keyDown(thpInput(), { key: 'Enter' });
    expect(onUpdate.mock.lastCall[0].tempHp).toBe(4);
  });
});
