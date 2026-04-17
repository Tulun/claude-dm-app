export { default as StatsBar } from './StatsBar';
export { default as SavingThrows } from './SavingThrows';
export { default as SavingThrowsModal } from './SavingThrowsModal';
export { default as Senses } from './Senses';
export { default as SkillsList } from './SkillsList';
export { default as ProficiencyModal } from './ProficiencyModal';
export { default as ClassEditor } from './ClassEditor';
export { default as ResourceRow } from './ResourceRow';

export {
  ResourcesTab,
  InventoryTab,
  SpellsTab,
  FeaturesTab,
  FeatsTab,
  BackgroundTab,
  NotesTab,
  CompanionsTab,
  WildShapeTab,
} from './tabs';

export function formatClasses(character) {
  if (character.classes?.length > 0) {
    return character.classes.map(c => `${c.name} ${c.level}`).join(' / ');
  }
  return character.class ? `${character.class} ${character.level || 1}` : '';
}