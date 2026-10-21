import { describe, it, expect } from 'vitest';
import { readLairActions, withLairActions, newLairAction, lairActionName, LEGACY_LAIR_ID } from '../../app/utils/lairActions';

describe('lair actions', () => {
  it('reads the list shape, filling defaults', () => {
    expect(readLairActions({ lairActions: [{ id: 'a', notes: 'x' }, null, { id: 'b', initiative: 10 }] }))
      .toEqual([{ id: 'a', initiative: 20, notes: 'x' }, { id: 'b', initiative: 10, notes: '' }]);
  });

  it('reads a legacy single lairAction under the old fixed initiative id', () => {
    expect(readLairActions({ lairAction: { initiative: 15, notes: 'Rumble' } }))
      .toEqual([{ id: LEGACY_LAIR_ID, initiative: 15, notes: 'Rumble' }]);
    expect(readLairActions({ lairAction: null })).toEqual([]);
    expect(readLairActions(null)).toEqual([]);
  });

  it('writes only lairActions', () => {
    expect(withLairActions({ name: 'E', lairAction: { initiative: 20 } }, [])).toEqual({ name: 'E', lairActions: [] });
  });

  it('new lair actions get a lair- id at count 20', () => {
    expect(newLairAction()).toEqual({ id: expect.stringMatching(/^lair-/), initiative: 20, notes: '' });
  });

  it('numbers names only when there are several', () => {
    expect(lairActionName(0, 1)).toBe('Lair Action');
    expect(lairActionName(1, 3)).toBe('Lair Action 2');
  });
});
