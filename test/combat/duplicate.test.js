import { describe, it, expect } from 'vitest';
import { duplicateEnemy } from '../../app/combat/duplicate';

const ogre = {
  id: 'enemy-1', name: 'Ogre', maxHp: 59, currentHp: 12, tempHp: 5, initiative: 9, ac: 11, cr: '2',
  conditions: [{ name: 'Prone' }], combatNotes: 'hit by Mira', tempAC: 2, acEffect: { name: 'Shield' },
  legendaryActionsUsed: 2, abilityUses: { roar: 1 }, perDay1Used: 1, spellSlots3Used: 2,
  actions: [{ name: 'Greatclub' }],
};

describe('duplicateEnemy', () => {
  it('copies the stat block, name and initiative but resets every per-fight field', () => {
    expect(duplicateEnemy(ogre, 'enemy-new')).toEqual({
      id: 'enemy-new', name: 'Ogre', maxHp: 59, currentHp: 59, initiative: 9, ac: 11, cr: '2',
      actions: [{ name: 'Greatclub' }],
    });
  });

  it('mints an enemy id when none is given', () => {
    expect(duplicateEnemy(ogre).id).toMatch(/^enemy-/);
  });
});
