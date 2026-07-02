import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import EncounterPlanner from '../../app/encounters/EncounterPlanner';

// --- Fixtures -------------------------------------------------------------

const templates = [
  { id: 'tpl-goblin', name: 'Goblin', cr: '1/4', xp: 50 },
  { id: 'tpl-ogre', name: 'Ogre', cr: '2', xp: 450 },
];

const calcStats = (encounter) => {
  let totalXP = 0;
  let monsterCount = 0;
  encounter.monsters.forEach((m) => {
    const template = templates.find((t) => t.id === m.templateId);
    if (template) {
      totalXP += (template.xp || 0) * m.quantity;
      monsterCount += m.quantity;
    }
  });
  return { totalXP, monsterCount };
};

const encounters = [
  {
    id: 'enc-1',
    name: 'Goblin Ambush',
    monsters: [{ id: 'm1', templateId: 'tpl-goblin', name: 'Goblin', customName: '', quantity: 4 }], // 200 XP
    createdAt: '',
  },
  {
    id: 'enc-2',
    name: 'Ogre Fight',
    monsters: [{ id: 'm2', templateId: 'tpl-ogre', name: 'Ogre', customName: '', quantity: 2 }], // 900 XP
    createdAt: '',
  },
];

const defaultProps = {
  partySize: 4,
  setPartySize: vi.fn(),
  partyLevel: 5,
  setPartyLevel: vi.fn(),
  calcMode: '2024',
  setCalcMode: vi.fn(),
  dailyEncounters: [],
  encounters,
  calculateEncounterStats: calcStats,
  removeFromDaily: vi.fn(),
  clearDaily: vi.fn(),
};

const renderPlanner = (overrides = {}) =>
  render(<EncounterPlanner {...defaultProps} {...overrides} />);

const xp = (n) => `${n.toLocaleString()} XP`;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// --- Tests ----------------------------------------------------------------

describe('EncounterPlanner', () => {
  it('shows 2024 Low/Moderate/High thresholds scaled by party size', () => {
    renderPlanner(); // level 5, size 4 => 500/750/1100 per char
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText(xp(2000))).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText(xp(3000))).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(xp(4400))).toBeInTheDocument();
    // 2024 daily budget shows the 6-8 moderate encounter range
    expect(
      screen.getByText(`${(18000).toLocaleString()} - ${(24000).toLocaleString()} XP`)
    ).toBeInTheDocument();
    expect(screen.getByText('2024 DMG has no official daily budget')).toBeInTheDocument();
  });

  it('shows 2014 Easy/Medium/Hard/Deadly thresholds and full-day budget', () => {
    renderPlanner({ calcMode: '2014' });
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText(xp(1000))).toBeInTheDocument(); // low * 0.5
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText(xp(2000))).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText(xp(3000))).toBeInTheDocument();
    expect(screen.getByText('Deadly')).toBeInTheDocument();
    expect(screen.getByText(xp(4400))).toBeInTheDocument();
    // 2014 full adventuring day: 3500 * 4
    expect(screen.getByText('Full day XP')).toBeInTheDocument();
    expect(screen.getByText(xp(14000))).toBeInTheDocument();
  });

  it('rules toggle buttons call setCalcMode', () => {
    renderPlanner();
    fireEvent.click(screen.getByText('2014 Rules'));
    expect(defaultProps.setCalcMode).toHaveBeenCalledWith('2014');
    fireEvent.click(screen.getByText('2024 Rules'));
    expect(defaultProps.setCalcMode).toHaveBeenCalledWith('2024');
  });

  it('party size and level steppers call setters with clamped values', () => {
    renderPlanner();
    // Button order in the DOM: party-size row first, then party-level row
    const minus = screen.getAllByText('−');
    const plus = screen.getAllByText('+');
    fireEvent.click(minus[0]);
    expect(defaultProps.setPartySize).toHaveBeenCalledWith(3);
    fireEvent.click(plus[0]);
    expect(defaultProps.setPartySize).toHaveBeenCalledWith(5);
    fireEvent.click(minus[1]);
    expect(defaultProps.setPartyLevel).toHaveBeenCalledWith(4);
    fireEvent.click(plus[1]);
    expect(defaultProps.setPartyLevel).toHaveBeenCalledWith(6);
  });

  it('clamps party size at 1 and party level between 1 and 20', () => {
    renderPlanner({ partySize: 1, partyLevel: 20 });
    const minus = screen.getAllByText('−');
    const plus = screen.getAllByText('+');
    fireEvent.click(minus[0]);
    expect(defaultProps.setPartySize).toHaveBeenCalledWith(1); // Math.max(1, 0)
    fireEvent.click(plus[1]);
    expect(defaultProps.setPartyLevel).toHaveBeenCalledWith(20); // Math.min(20, 21)

    cleanup();
    renderPlanner({ partyLevel: 1 });
    fireEvent.click(screen.getAllByText('−')[1]);
    expect(defaultProps.setPartyLevel).toHaveBeenCalledWith(1);
  });

  it('shows the empty daily-tracker hint when no encounters are added', () => {
    renderPlanner();
    expect(screen.getByText('Click + on encounters to add')).toBeInTheDocument();
    expect(screen.getByText('0 encounters')).toBeInTheDocument();
    expect(screen.getByText(xp(0))).toBeInTheDocument();
    expect(screen.getByText('0% of daily budget')).toBeInTheDocument();
    // Clear button only appears when there are daily encounters
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('sums daily encounters (duplicates allowed) and shows budget percentage', () => {
    renderPlanner({ dailyEncounters: ['enc-1', 'enc-1', 'enc-2'] });
    // total = 200 + 200 + 900 = 1300 XP (a value distinct from the threshold rows)
    expect(screen.getByText(xp(1300))).toBeInTheDocument();
    expect(screen.getByText('3 encounters')).toBeInTheDocument();
    // maxBudget (2024) = moderate(3000) * 8 = 24000 -> round(1300/24000*100) = 5
    expect(screen.getByText('5% of daily budget')).toBeInTheDocument();
    expect(screen.getAllByText('Goblin Ambush')).toHaveLength(2);
    expect(screen.getByText('Ogre Fight')).toBeInTheDocument();
  });

  it('uses the 2014 daily budget for the percentage in 2014 mode', () => {
    renderPlanner({ calcMode: '2014', dailyEncounters: ['enc-2'] });
    // maxBudget = 3500 * 4 = 14000 -> round(900/14000*100) = 6
    expect(screen.getByText('6% of daily budget')).toBeInTheDocument();
  });

  it('silently skips daily ids that no longer resolve to an encounter', () => {
    renderPlanner({ dailyEncounters: ['gone', 'enc-1'] });
    expect(screen.getByText(xp(200))).toBeInTheDocument();
    // count still reflects the raw array length, including the dangling id
    expect(screen.getByText('2 encounters')).toBeInTheDocument();
  });

  it('remove button calls removeFromDaily with the index; Clear calls clearDaily', () => {
    renderPlanner({ dailyEncounters: ['enc-1', 'enc-2'] });
    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[1]);
    expect(defaultProps.removeFromDaily).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByText('Clear'));
    expect(defaultProps.clearDaily).toHaveBeenCalled();
  });

  it('singular label for exactly one daily encounter', () => {
    renderPlanner({ dailyEncounters: ['enc-1'] });
    expect(screen.getByText('1 encounter')).toBeInTheDocument();
  });
});
