// Magic item constants — kept separate from the item database so UI components
// can import these without pulling the full defaultMagicItems list into their bundle.

export const ITEM_CATEGORIES = ['Armor', 'Potion', 'Ring', 'Rod', 'Scroll', 'Staff', 'Wand', 'Weapon', 'Wondrous'];
export const RARITIES = ['Mundane', 'Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact', 'Varies'];
export const CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
export const RARITY_VALUES = { 'Common': 100, 'Uncommon': 400, 'Rare': 4000, 'Very Rare': 40000, 'Legendary': 200000, 'Artifact': null, 'Varies': null };
export const RARITY_COLORS = {
  'Mundane': { bg: 'bg-stone-800', text: 'text-stone-400', border: 'border-stone-600' },
  'Common': { bg: 'bg-stone-700', text: 'text-stone-300', border: 'border-stone-600' },
  'Uncommon': { bg: 'bg-green-900/50', text: 'text-green-400', border: 'border-green-700' },
  'Rare': { bg: 'bg-blue-900/50', text: 'text-blue-400', border: 'border-blue-700' },
  'Very Rare': { bg: 'bg-purple-900/50', text: 'text-purple-400', border: 'border-purple-700' },
  'Legendary': { bg: 'bg-amber-900/50', text: 'text-amber-400', border: 'border-amber-700' },
  'Artifact': { bg: 'bg-red-900/50', text: 'text-red-400', border: 'border-red-700' },
  'Varies': { bg: 'bg-gradient-to-r from-green-900/50 via-blue-900/50 to-purple-900/50', text: 'text-cyan-400', border: 'border-cyan-700' }
};
