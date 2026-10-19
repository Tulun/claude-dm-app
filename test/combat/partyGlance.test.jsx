import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));

import CharacterCard from '../../app/combat/components/CharacterCard';
import PartyGlance, { getResourcePools } from '../../app/combat/components/CharacterCard/PartyGlance';

const druid = {
  id: 'p1', name: 'Efa', class: 'Druid', level: 4, currentHp: 35, maxHp: 35, ac: 15, speed: 30,
  str: 10, dex: 14, con: 14, int: 14, wis: 16, cha: 8,
  saveProficiencies: { int: 1, wis: 1 },
  skillProficiencies: { Insight: 2 },
  advantages: ['Adv. vs Poisoned'],
  resources: [
    { id: 1, name: 'Wild Shape', current: 2, max: 2 },
    { id: 2, name: '2nd Level Spell Slots', current: 3, max: 3 },
    { id: 3, name: '1st Level Spell Slot', current: 4, max: 4 },
    { id: 4, name: 'Spirit Totem', current: 1, max: 1, options: [{ name: 'Bear Spirit' }] },
    { id: 5, name: 'Lay on Hands', current: 12, max: 20 },
    { id: 6, name: 'Empty', current: 0, max: 0 },
  ],
};

describe('getResourcePools', () => {
  it('puts spell slots first by level with short labels, skips max-0 pools', () => {
    expect(getResourcePools(druid).map(p => p.label)).toEqual(['1st', '2nd', 'Wild Shape', 'Spirit Totem', 'Lay on Hands']);
  });

  it('reads the legacy spellSlots map too', () => {
    const c = { spellSlots: { level1: { current: 1, max: 2 }, level3: { current: 0, max: 2 }, level2: { max: 0 } } };
    const pools = getResourcePools(c);
    expect(pools.map(p => [p.label, p.current, p.max])).toEqual([['1st', 1, 2], ['3rd', 0, 2]]);
    expect(pools[0].set(0).spellSlots.level1).toEqual({ current: 0, max: 2 });
  });

  it('set() returns the character with only that resource changed', () => {
    const wild = getResourcePools(druid).find(p => p.label === 'Wild Shape');
    const next = wild.set(1);
    expect(next.resources[0]).toEqual({ id: 1, name: 'Wild Shape', current: 1, max: 2 });
    expect(next.resources.slice(1)).toEqual(druid.resources.slice(1));
  });
});

describe('PartyGlance', () => {
  const setup = (c = druid) => {
    const onUpdate = vi.fn();
    const onOpen = vi.fn();
    render(<PartyGlance character={c} onUpdate={onUpdate} onOpen={onOpen} />);
    return { onUpdate, onOpen };
  };
  const pool = (label) => screen.getAllByTestId('resource-pool').find(el => el.textContent.startsWith(label));

  it('a lit pip spends one, an empty pip restores one', () => {
    const { onUpdate } = setup({ ...druid, resources: [{ id: 1, name: 'Wild Shape', current: 1, max: 2 }] });
    const wild = pool('Wild Shape');
    fireEvent.click(within(wild).getByRole('button', { name: 'Spend Wild Shape' }));
    expect(onUpdate.mock.lastCall[0].resources[0].current).toBe(0);
    fireEvent.click(within(wild).getByRole('button', { name: 'Restore Wild Shape' }));
    expect(onUpdate.mock.lastCall[0].resources[0].current).toBe(2);
  });

  it('a pool with options opens the resources modal instead of spending', () => {
    const { onUpdate, onOpen } = setup();
    fireEvent.click(within(pool('Spirit Totem')).getByRole('button', { name: 'Spend Spirit Totem' }));
    expect(onOpen).toHaveBeenCalledWith('resources');
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('big pools show a counter with −/+', () => {
    const { onUpdate } = setup();
    const loh = pool('Lay on Hands');
    expect(loh).toHaveTextContent('12/20');
    fireEvent.click(within(loh).getByRole('button', { name: 'Spend Lay on Hands' }));
    expect(onUpdate.mock.lastCall[0].resources[4].current).toBe(11);
  });

  it('shows passives (sheet skill math, expertise doubles prof), speed and advantages', () => {
    setup();
    expect(screen.getByTestId('passive-perception')).toHaveTextContent('Perception13');
    expect(screen.getByTestId('passive-insight')).toHaveTextContent('Insight17'); // 10 + 3 + 2×2
    expect(screen.getByTestId('passive-investigation')).toHaveTextContent('Investigation12');
    expect(screen.getByText('30 ft')).toBeInTheDocument();
    expect(screen.getByText('Adv. vs Poisoned')).toBeInTheDocument();
  });
});

describe('CharacterCard ability row', () => {
  const renderCard = (c, props = {}) =>
    render(<CharacterCard character={c} isEnemy={false} onUpdate={vi.fn()} showResources {...props} />);

  it('party: modifier big, score small, save bonus with proficiency marked', () => {
    renderCard(druid);
    const wis = screen.getByTestId('ability-wis');
    expect(wis).toHaveTextContent('WIS 16');
    expect(wis).toHaveTextContent('+3');
    expect(screen.getByTestId('save-wis')).toHaveTextContent('save +5');
    expect(screen.getByTestId('save-wis').className).toContain('text-emerald-400');
    expect(screen.getByTestId('save-cha')).toHaveTextContent('save -1');
    expect(screen.getByTestId('save-cha').className).not.toContain('text-emerald-400');
  });

  it('wild shape: physical saves use the beast score', () => {
    const shaped = { ...druid, wildShapeActive: true, wildShapeFormId: 'w1', wildShapeForms: [{ id: 'w1', name: 'Wolf', str: 12, dex: 15, con: 12, ac: 13, speed: 40 }] };
    renderCard(shaped);
    expect(screen.getByTestId('ability-dex')).toHaveTextContent('DEX 15');
    expect(screen.getByTestId('save-dex')).toHaveTextContent('save +2');
    expect(screen.getByText('40 ft')).toBeInTheDocument();
  });

  it('enemies keep the score-first row and get no glance block', () => {
    render(<CharacterCard character={{ id: 'e1', name: 'Goblin', cr: '1/4', currentHp: 7, maxHp: 7, ac: 15, dex: 14 }} isEnemy onUpdate={vi.fn()} showResources />);
    expect(screen.queryByTestId('ability-dex')).not.toBeInTheDocument();
    expect(screen.queryByTestId('passive-perception')).not.toBeInTheDocument();
  });

  it('the glance block only shows with showResources', () => {
    renderCard(druid, { showResources: false });
    expect(screen.queryByTestId('passive-perception')).not.toBeInTheDocument();
  });
});
