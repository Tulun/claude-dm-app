// DM Page constants

export const CHARACTER_TYPES = [
  { value: 'npc', label: 'NPC', color: 'teal', description: 'Non-player characters' },
  { value: 'dmnpc', label: 'DMNPC', color: 'blue', description: 'DM-controlled party helpers' },
  { value: 'bbeg', label: 'BBEG', color: 'red', description: 'Big Bad Evil Guys' },
  { value: 'villain', label: 'Villain', color: 'purple', description: 'Antagonists and enemies' },
];

export const WORLD_CATEGORIES = [
  { key: 'places', label: 'Places', icon: 'Map', color: 'emerald' },
  { key: 'npcs', label: 'NPCs', icon: 'Users', color: 'teal' },
  { key: 'lore', label: 'Lore', icon: 'BookOpen', color: 'amber' },
  { key: 'gods', label: 'Gods', icon: 'Star', color: 'purple' },
  { key: 'factions', label: 'Factions', icon: 'Swords', color: 'red' },
  { key: 'items', label: 'Items', icon: 'Sparkles', color: 'blue' },
];

export const EMPTY_CHARACTER = {
  name: '',
  type: 'npc',
  role: '',
  appearance: '',
  personality: '',
  motivation: '',
  secrets: '',
  stats: '',
  abilities: '',
  notes: ''
};

export const EMPTY_WORLD_ITEM = {
  name: '',
  description: '',
  details: '',
  connections: '',
  secrets: '',
  tags: ''
};

export const WORLD_PLACEHOLDERS = {
  places: { description: 'Location description...', details: 'History, inhabitants, landmarks...' },
  npcs: { description: 'Who are they?', details: 'Background, relationships...' },
  lore: { description: 'What is this about?', details: 'History, significance...' },
  gods: { description: 'Domain, alignment...', details: 'Worship, symbols, tenets...' },
  factions: { description: 'What is this group?', details: 'Goals, members, resources...' },
  items: { description: 'What does it do?', details: 'History, properties, attunement...' }
};