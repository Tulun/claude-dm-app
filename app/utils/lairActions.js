import { generateId } from './generateId';

// Lair actions on the active combat (data/encounter.json) and on saved
// encounters (data/encounters.json): `lairActions: [{ id, initiative, notes }]`.
// Files written before multiple lair actions existed hold a single
// `lairAction` object (or null) instead. It reads back as a one-item list
// whose id is the old fixed initiative id, so a saved initiative order and
// turn pointer still find it. Writers only emit `lairActions`.
export const LEGACY_LAIR_ID = 'lair-action';

export const newLairAction = () => ({ id: generateId('lair'), initiative: 20, notes: '' });

const clean = (lair, id) => ({ id, initiative: lair.initiative ?? 20, notes: lair.notes || '' });

export const readLairActions = (source) => {
  if (!source) return [];
  if (Array.isArray(source.lairActions)) {
    return source.lairActions.filter(Boolean).map(l => clean(l, l.id || generateId('lair')));
  }
  return source.lairAction ? [clean(source.lairAction, LEGACY_LAIR_ID)] : [];
};

// Copy of `source` carrying `list` as its lair actions, legacy key dropped.
export const withLairActions = (source, list) => {
  const next = { ...source, lairActions: list };
  delete next.lairAction;
  return next;
};

// "Lair Action" alone; numbered once there are several.
export const lairActionName = (index, count) => (count > 1 ? `Lair Action ${index + 1}` : 'Lair Action');
