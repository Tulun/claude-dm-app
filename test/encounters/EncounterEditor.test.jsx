import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import EncounterEditor from '../../app/encounters/EncounterEditor';

// --- Fixtures -------------------------------------------------------------

const goblin = {
  id: 'tpl-goblin',
  name: 'Goblin',
  size: 'Small',
  creatureType: 'Humanoid (Goblinoid)',
  ac: 15,
  maxHp: 7,
  hitDice: '2d6',
  speed: 30,
  cr: '1/4',
  xp: 50,
  str: 8,
  dex: 14,
  con: 10,
  int: 10,
  wis: 8,
  cha: 8,
  senses: 'Darkvision 60 ft.',
  isNpc: false,
  traits: [{ name: 'Nimble Escape', description: 'Disengage or Hide as a bonus action.' }],
  actions: [{ name: 'Scimitar', description: 'Melee: +4 to hit, 5 (1d6+2) slashing.' }],
};

const ogre = {
  id: 'tpl-ogre',
  name: 'Ogre',
  size: 'Large',
  creatureType: 'Giant',
  ac: 11,
  maxHp: 59,
  speed: 40,
  cr: '2',
  xp: 450,
  isNpc: false,
};

const bartender = {
  id: 'tpl-npc',
  name: 'Friendly Bartender',
  size: 'Medium',
  creatureType: 'Humanoid',
  cr: '0',
  xp: 0,
  isNpc: true,
};

const templates = [goblin, ogre, bartender];

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

const goblinMonster = {
  id: 'mon-1',
  templateId: 'tpl-goblin',
  name: 'Goblin',
  customName: '',
  quantity: 3,
};

const baseEncounter = {
  id: 'enc-1',
  name: 'Goblin Ambush',
  monsters: [goblinMonster],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const emptyEncounter = { ...baseEncounter, id: 'enc-empty', name: 'Empty One', monsters: [] };

const defaultProps = {
  encounter: baseEncounter,
  templates,
  onUpdate: vi.fn(),
  onClose: vi.fn(),
  calculateEncounterStats: calcStats,
};

const renderEditor = (overrides = {}) =>
  render(<EncounterEditor {...defaultProps} {...overrides} />);

const openAddModal = () => fireEvent.click(screen.getByText('Add Monster'));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// --- Tests ----------------------------------------------------------------

describe('EncounterEditor', () => {
  it('shows the encounter name and aggregate stats in the header', () => {
    renderEditor();
    expect(screen.getByDisplayValue('Goblin Ambush')).toBeInTheDocument();
    expect(screen.getByText('3 creatures')).toBeInTheDocument();
    expect(screen.getByText(`${(150).toLocaleString()} XP`)).toBeInTheDocument();
  });

  it('renaming the encounter calls onUpdate with the new name', () => {
    renderEditor();
    fireEvent.change(screen.getByDisplayValue('Goblin Ambush'), {
      target: { value: 'Renamed Ambush' },
    });
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({
      ...baseEncounter,
      name: 'Renamed Ambush',
    });
  });

  it('Back button calls onClose', () => {
    renderEditor();
    fireEvent.click(screen.getByText('Back'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows an empty state when the encounter has no monsters', () => {
    renderEditor({ encounter: emptyEncounter });
    expect(
      screen.getByText('No monsters yet. Click "Add Monster" to get started.')
    ).toBeInTheDocument();
  });

  describe('monster rows', () => {
    it('shows template-derived info (CR, size/type, AC, HP, speed, XP)', () => {
      renderEditor();
      expect(screen.getByText('CR 1/4')).toBeInTheDocument();
      expect(screen.getByText('Goblin')).toBeInTheDocument();
      expect(screen.getByText('Small Humanoid (Goblinoid)')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // AC
      expect(screen.getByText('7')).toBeInTheDocument(); // HP
      expect(screen.getByText('(2d6)')).toBeInTheDocument();
      expect(screen.getByText('30 ft')).toBeInTheDocument();
      expect(screen.getByText('50 XP')).toBeInTheDocument();
    });

    it('shows CR ? when the templateId does not resolve', () => {
      renderEditor({
        encounter: {
          ...baseEncounter,
          monsters: [{ ...goblinMonster, templateId: 'missing' }],
        },
      });
      expect(screen.getByText('CR ?')).toBeInTheDocument();
    });

    it('quantity steppers call onUpdate with the changed monster', () => {
      renderEditor();
      fireEvent.click(screen.getByText('+'));
      expect(defaultProps.onUpdate).toHaveBeenLastCalledWith({
        ...baseEncounter,
        monsters: [{ ...goblinMonster, quantity: 4 }],
      });
      fireEvent.click(screen.getByText('−'));
      expect(defaultProps.onUpdate).toHaveBeenLastCalledWith({
        ...baseEncounter,
        monsters: [{ ...goblinMonster, quantity: 2 }],
      });
    });

    it('quantity is floored at 1', () => {
      renderEditor({
        encounter: { ...baseEncounter, monsters: [{ ...goblinMonster, quantity: 1 }] },
      });
      fireEvent.click(screen.getByText('−'));
      expect(defaultProps.onUpdate).toHaveBeenLastCalledWith({
        ...baseEncounter,
        monsters: [{ ...goblinMonster, quantity: 1 }],
      });
    });

    it('editing the custom name calls onUpdate', () => {
      renderEditor();
      fireEvent.change(screen.getByPlaceholderText('Custom name (optional)'), {
        target: { value: 'Sniv the Sneaky' },
      });
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        ...baseEncounter,
        monsters: [{ ...goblinMonster, customName: 'Sniv the Sneaky' }],
      });
    });

    it('the trash button removes the monster', () => {
      renderEditor();
      // The remove button is the last button in the row (no accessible name; icon only)
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        ...baseEncounter,
        monsters: [],
      });
    });

    it('expanding a row reveals the stat block (abilities, traits, actions)', () => {
      renderEditor();
      expect(screen.queryByText('Nimble Escape.')).not.toBeInTheDocument();
      // Chevron toggle is the first button inside the row; buttons before it: Back, Add Monster
      fireEvent.click(screen.getAllByRole('button')[2]);
      expect(screen.getByText('str')).toBeInTheDocument();
      expect(screen.getByText('cha')).toBeInTheDocument();
      expect(screen.getByText('Nimble Escape.')).toBeInTheDocument();
      expect(screen.getByText('Disengage or Hide as a bonus action.')).toBeInTheDocument();
      expect(screen.getByText('Scimitar.')).toBeInTheDocument();
      expect(screen.getByText('Darkvision 60 ft.')).toBeInTheDocument();
      // dex 14 -> +2 modifier
      expect(screen.getByText('+2')).toBeInTheDocument();
      // str 8 -> -1 modifier (goblin has wis 8 and cha 8 too)
      expect(screen.getAllByText('-1').length).toBeGreaterThan(0);
    });
  });

  describe('add-monster modal', () => {
    it('lists non-NPC templates only, with a results count', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      // "Add Monsters" appears as both the modal heading and the confirm button
      expect(screen.getByRole('heading', { name: 'Add Monsters' })).toBeInTheDocument();
      expect(screen.getByText('2 results')).toBeInTheDocument();
      expect(screen.getByText('Goblin')).toBeInTheDocument();
      expect(screen.getByText('Ogre')).toBeInTheDocument();
      expect(screen.queryByText('Friendly Bartender')).not.toBeInTheDocument();
    });

    it('search filters templates by name', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      fireEvent.change(screen.getByPlaceholderText('Search by name...'), {
        target: { value: 'ogr' },
      });
      expect(screen.getByText('1 result (filtered)')).toBeInTheDocument();
      expect(screen.getByText('Ogre')).toBeInTheDocument();
      expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
    });

    it('shows "No monsters found." when nothing matches', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      fireEvent.change(screen.getByPlaceholderText('Search by name...'), {
        target: { value: 'zzz' },
      });
      expect(screen.getByText('No monsters found.')).toBeInTheDocument();
    });

    it('CR filter dropdown narrows results and shows an active tag', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      fireEvent.click(screen.getByText('CR')); // open dropdown
      fireEvent.click(screen.getByText('¼')); // toggle CR 1/4
      expect(screen.getByText('1 result (filtered)')).toBeInTheDocument();
      expect(screen.getByText('Goblin')).toBeInTheDocument();
      expect(screen.queryByText('Ogre')).not.toBeInTheDocument();
      // "CR 1/4" appears on the goblin card badge AND as the active filter tag
      expect(screen.getAllByText('CR 1/4')).toHaveLength(2);
      // Clear All resets filters
      fireEvent.click(screen.getByText('Clear All'));
      expect(screen.getByText('2 results')).toBeInTheDocument();
    });

    it('Type filter only offers types present in the templates', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      fireEvent.click(screen.getByText('Type'));
      // goblin -> Humanoid, ogre -> Giant, NPC bartender contributes Humanoid (already present)
      expect(screen.getByText('Giant')).toBeInTheDocument();
      expect(screen.getByText('Humanoid')).toBeInTheDocument();
      expect(screen.queryByText('Dragon')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Giant'));
      expect(screen.getByText('1 result (filtered)')).toBeInTheDocument();
      expect(screen.getByText('Ogre')).toBeInTheDocument();
    });

    it('the confirm button is disabled until a template is selected', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      const confirm = screen.getByRole('button', { name: 'Add Monsters' });
      expect(confirm).toBeDisabled();
      fireEvent.click(screen.getByText('Goblin'));
      expect(screen.getByText('1 creature selected')).toBeInTheDocument();
      expect(screen.getByText('Add 1 Creature')).not.toBeDisabled();
    });

    it('selecting, adjusting quantity, and confirming calls onUpdate with new monsters', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      fireEvent.click(screen.getByText('Goblin'));
      // quantity stepper appears on the selected card
      fireEvent.click(screen.getByText('+'));
      expect(screen.getByText('2 creatures selected')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Add 2 Creatures'));

      expect(defaultProps.onUpdate).toHaveBeenCalledTimes(1);
      const updated = defaultProps.onUpdate.mock.calls[0][0];
      expect(updated.id).toBe('enc-empty');
      expect(updated.monsters).toHaveLength(1);
      expect(updated.monsters[0]).toMatchObject({
        templateId: 'tpl-goblin',
        name: 'Goblin',
        customName: '',
        quantity: 2,
      });
      expect(updated.monsters[0].id).toMatch(/^tpl-goblin-/);
      // modal closes after confirming
      expect(screen.queryByText('Add Monsters')).not.toBeInTheDocument();
    });

    it('selected quantity cannot drop below 1', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      fireEvent.click(screen.getByText('Goblin'));
      fireEvent.click(screen.getByText('−'));
      fireEvent.click(screen.getByText('−'));
      expect(screen.getByText('1 creature selected')).toBeInTheDocument();
    });

    it('can add multiple different templates at once, appending to existing monsters', () => {
      renderEditor(); // starts with one goblin monster
      openAddModal();
      const goblinCard = screen.getAllByText('Goblin').at(-1).closest('.relative');
      fireEvent.click(within(goblinCard).getByText('Goblin'));
      fireEvent.click(screen.getByText('Ogre'));
      fireEvent.click(within(goblinCard).getByText('+'));
      fireEvent.click(screen.getByText('Add 3 Creatures'));

      const updated = defaultProps.onUpdate.mock.calls[0][0];
      expect(updated.monsters).toHaveLength(3);
      expect(updated.monsters[0]).toEqual(goblinMonster); // existing monster kept
      const added = updated.monsters.slice(1);
      expect(added.map((m) => m.templateId).sort()).toEqual(['tpl-goblin', 'tpl-ogre']);
      const addedGoblin = added.find((m) => m.templateId === 'tpl-goblin');
      expect(addedGoblin.quantity).toBe(2);
    });

    it('clicking a selected template again deselects it', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      fireEvent.click(screen.getByText('Goblin'));
      expect(screen.getByText('1 creature selected')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Goblin'));
      expect(screen.queryByText('1 creature selected')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Monsters' })).toBeDisabled();
    });

    it('cancel closes the modal without updating and resets selection', () => {
      renderEditor({ encounter: emptyEncounter });
      openAddModal();
      fireEvent.click(screen.getByText('Goblin'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onUpdate).not.toHaveBeenCalled();
      expect(screen.queryByText('Add Monsters')).not.toBeInTheDocument();
      // reopening starts with a clean slate
      openAddModal();
      expect(screen.queryByText('1 creature selected')).not.toBeInTheDocument();
    });
  });
});
