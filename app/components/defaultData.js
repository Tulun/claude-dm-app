export const defaultPartyData = [
  { id: 'party-1', name: 'Thorin Ironforge', class: 'Fighter', level: 5, ac: 18, maxHp: 52, currentHp: 52, initiative: 0, speed: 30, notes: 'Battlemaster. Shield Bearer.', resources: [{ name: 'Second Wind', current: 1, max: 1 }, { name: 'Action Surge', current: 1, max: 1 }, { name: 'Superiority Dice', current: 4, max: 4 }], str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 8, spellStat: null },
  { id: 'party-2', name: 'Elara Moonwhisper', class: 'Wizard', level: 5, ac: 13, maxHp: 28, currentHp: 28, initiative: 0, speed: 30, notes: 'Evocation specialist. Low HP!', resources: [{ name: '1st Level Slots', current: 4, max: 4 }, { name: '2nd Level Slots', current: 3, max: 3 }, { name: '3rd Level Slots', current: 2, max: 2 }], str: 8, dex: 14, con: 12, int: 18, wis: 13, cha: 10, spellStat: 'int' },
  { id: 'party-3', name: 'Bramble Thornfoot', class: 'Rogue', level: 5, ac: 15, maxHp: 38, currentHp: 38, initiative: 0, speed: 35, notes: 'Arcane Trickster. Sneak attack 3d6.', resources: [{ name: '1st Level Slots', current: 3, max: 3 }], str: 10, dex: 18, con: 14, int: 14, wis: 12, cha: 10, spellStat: 'int' },
];

// Built-in monster templates live in app/data/defaultEnemyTemplates.js (2024
// SRD 5.2.1 stat blocks plus older templates for monsters not in the SRD).
export { defaultEnemyTemplates } from '../data/defaultEnemyTemplates';
