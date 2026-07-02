import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import EncounterList from '../../app/encounters/EncounterList';

// --- Fixtures -------------------------------------------------------------

const templates = [
  { id: 'tpl-goblin', name: 'Goblin', cr: '1/4', xp: 50 },
  { id: 'tpl-ogre', name: 'Ogre', cr: '2', xp: 450 },
];

// Same shape as the page's calculateEncounterStats
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

const goblinAmbush = {
  id: 'enc-1',
  name: 'Goblin Ambush',
  monsters: [
    { id: 'm1', templateId: 'tpl-goblin', name: 'Goblin', customName: '', quantity: 4 },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const ogreFight = {
  id: 'enc-2',
  name: 'Ogre Fight',
  monsters: [
    { id: 'm2', templateId: 'tpl-ogre', name: 'Ogre', customName: 'Grug', quantity: 8 },
  ],
  createdAt: '2026-01-02T00:00:00.000Z',
};

const defaultProps = {
  encounters: [],
  partySize: 4,
  partyLevel: 5, // 2024 thresholds x4: low 2000, moderate 3000, high 4400
  calcMode: '2024',
  calculateEncounterStats: calcStats,
  onEdit: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onAddToDaily: vi.fn(),
  onCreate: vi.fn(),
};

const renderList = (overrides = {}) =>
  render(<EncounterList {...defaultProps} {...overrides} />);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// --- Tests ----------------------------------------------------------------

describe('EncounterList', () => {
  it('shows the empty state when there are no encounters', () => {
    renderList();
    expect(screen.getByText('No saved encounters yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Create an encounter to pre-plan your combats!')
    ).toBeInTheDocument();
  });

  it('renders encounter name, creature count and total XP', () => {
    renderList({ encounters: [goblinAmbush] });
    expect(screen.getByText('Goblin Ambush')).toBeInTheDocument();
    expect(screen.getByText('4 creatures')).toBeInTheDocument();
    expect(screen.getByText(`${(200).toLocaleString()} XP`)).toBeInTheDocument();
  });

  it('shows quantity-prefixed monster chips, preferring customName', () => {
    renderList({ encounters: [goblinAmbush, ogreFight] });
    expect(screen.getByText('4x Goblin')).toBeInTheDocument();
    // customName "Grug" wins over template name
    expect(screen.getByText('8x Grug')).toBeInTheDocument();
    expect(screen.queryByText('8x Ogre')).not.toBeInTheDocument();
  });

  it('caps monster chips at 5 and shows a "+N more" indicator', () => {
    const many = {
      id: 'enc-many',
      name: 'Horde',
      monsters: Array.from({ length: 7 }, (_, i) => ({
        id: `mm-${i}`,
        templateId: 'tpl-goblin',
        name: `Goblin ${i}`,
        customName: '',
        quantity: 1,
      })),
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    renderList({ encounters: [many] });
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    expect(screen.queryByText('Goblin 5')).not.toBeInTheDocument();
  });

  describe('difficulty badges', () => {
    it('labels encounters low/moderate/high in 2024 mode', () => {
      // level 5, size 4 => low 2000, moderate 3000, high 4400
      renderList({
        encounters: [
          goblinAmbush, // 200 XP -> low
          { ...ogreFight, id: 'e-mod', name: 'Mod' }, // 3600 XP -> moderate
          {
            id: 'e-high',
            name: 'High',
            monsters: [{ id: 'mh', templateId: 'tpl-ogre', name: 'Ogre', customName: '', quantity: 10 }],
            createdAt: '2026-01-01T00:00:00.000Z',
          }, // 4500 XP -> high
        ],
      });
      expect(screen.getByText('low')).toBeInTheDocument();
      expect(screen.getByText('moderate')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('labels encounters easy/medium/hard/deadly in 2014 mode', () => {
      renderList({
        calcMode: '2014',
        encounters: [
          goblinAmbush, // 200 XP -> easy (< 2000)
          {
            id: 'e-med',
            name: 'Med',
            monsters: [{ id: 'mm', templateId: 'tpl-ogre', name: 'Ogre', customName: '', quantity: 5 }],
            createdAt: '',
          }, // 2250 -> medium (>= 2000)
          { ...ogreFight, id: 'e-hard', name: 'Hard enc' }, // 3600 -> hard (>= 3000)
          {
            id: 'e-dead',
            name: 'Dead',
            monsters: [{ id: 'md', templateId: 'tpl-ogre', name: 'Ogre', customName: '', quantity: 10 }],
            createdAt: '',
          }, // 4500 -> deadly (>= 4400)
        ],
      });
      expect(screen.getByText('easy')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('hard')).toBeInTheDocument();
      expect(screen.getByText('deadly')).toBeInTheDocument();
    });
  });

  describe('new encounter modal', () => {
    it('creates with the typed name', () => {
      renderList();
      fireEvent.click(screen.getByText('New Encounter'));
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
      fireEvent.change(
        screen.getByPlaceholderText("e.g., Goblin Ambush, Dragon's Lair..."),
        { target: { value: '  Dragon Lair  ' } }
      );
      fireEvent.click(screen.getByText('Create'));
      expect(defaultProps.onCreate).toHaveBeenCalledWith('Dragon Lair'); // trimmed
      expect(screen.queryByText('Create New Encounter')).not.toBeInTheDocument();
    });

    it('falls back to "New Encounter" when the name is blank', () => {
      renderList();
      fireEvent.click(screen.getByText('New Encounter'));
      fireEvent.click(screen.getByText('Create'));
      expect(defaultProps.onCreate).toHaveBeenCalledWith('New Encounter');
    });

    it('confirms on Enter and closes on Escape', () => {
      renderList();
      fireEvent.click(screen.getByText('New Encounter'));
      const input = screen.getByPlaceholderText("e.g., Goblin Ambush, Dragon's Lair...");
      fireEvent.change(input, { target: { value: 'Bandit Camp' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(defaultProps.onCreate).toHaveBeenCalledWith('Bandit Camp');

      fireEvent.click(screen.getByText('New Encounter'));
      fireEvent.keyDown(
        screen.getByPlaceholderText("e.g., Goblin Ambush, Dragon's Lair..."),
        { key: 'Escape' }
      );
      expect(screen.queryByText('Create New Encounter')).not.toBeInTheDocument();
      expect(defaultProps.onCreate).toHaveBeenCalledTimes(1);
    });

    it('cancel closes the modal without creating', () => {
      renderList();
      fireEvent.click(screen.getByText('New Encounter'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Create New Encounter')).not.toBeInTheDocument();
      expect(defaultProps.onCreate).not.toHaveBeenCalled();
    });
  });

  describe('row actions', () => {
    it('calls onEdit with the encounter object', () => {
      renderList({ encounters: [goblinAmbush] });
      fireEvent.click(screen.getByTitle('Edit'));
      expect(defaultProps.onEdit).toHaveBeenCalledWith(goblinAmbush);
    });

    it('calls onDuplicate with the encounter object', () => {
      renderList({ encounters: [goblinAmbush] });
      fireEvent.click(screen.getByTitle('Duplicate'));
      expect(defaultProps.onDuplicate).toHaveBeenCalledWith(goblinAmbush);
    });

    it('calls onAddToDaily with the encounter id', () => {
      renderList({ encounters: [goblinAmbush] });
      fireEvent.click(screen.getByTitle('Add to daily tracker'));
      expect(defaultProps.onAddToDaily).toHaveBeenCalledWith('enc-1');
    });

    it('delete requires confirmation, then calls onDelete with the id', () => {
      renderList({ encounters: [goblinAmbush] });
      fireEvent.click(screen.getByTitle('Delete'));
      expect(defaultProps.onDelete).not.toHaveBeenCalled();
      expect(screen.getByText('Delete Encounter')).toBeInTheDocument();
      expect(screen.getByText(/"Goblin Ambush"/)).toBeInTheDocument();

      // The confirm button contains the text "Delete"
      const modal = screen.getByText('This action cannot be undone.').closest('div').parentElement;
      fireEvent.click(within(modal.parentElement).getByRole('button', { name: /Delete$/ }));
      expect(defaultProps.onDelete).toHaveBeenCalledWith('enc-1');
      expect(screen.queryByText('Delete Encounter')).not.toBeInTheDocument();
    });

    it('cancelling the delete confirmation does not delete', () => {
      renderList({ encounters: [goblinAmbush] });
      fireEvent.click(screen.getByTitle('Delete'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onDelete).not.toHaveBeenCalled();
      expect(screen.queryByText('Delete Encounter')).not.toBeInTheDocument();
    });
  });
});
