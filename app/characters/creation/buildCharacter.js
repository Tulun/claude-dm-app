// Pure logic for the character-creation stepper: class-rule lookup, ability
// scores, HP, starting inventory, per-step validation, and turning the
// stepper's draft into a character record in the shape /api/party and
// /api/dm-npcs already store (see dm-app-map § Data-shape conventions).
// No React here — the component (app/characters/components/CharacterCreator.jsx)
// only edits the draft and renders what these functions compute.

import { getModNum } from '../../utils/rules';
import { getArmorData, getCalculatedAC } from '../../utils/acCalculation';
import { BASE_WEAPONS } from '../../utils/weaponStats';
import { generateId } from '../../utils/generateId';
import { CLASS_DATA } from '../../classes/classData';
import { CLASS_DETAILS } from '../../classes/classDetails';
import { SKILLS, STATS, BACKGROUNDS, SUBCLASSES, CLASS_FEATURES } from '../../character/components/constants';
import { getFeat } from '../../character/components/feats';
import {
  STANDARD_ARRAY, POINT_BUY_BUDGET, POINT_BUY_COSTS, POINT_BUY_MIN, POINT_BUY_MAX,
  EXTRA_CLASS_RULES, BONUS_LANGUAGE_COUNT, findSpecies,
} from './creationData';
import { getSpellcastingLimits, spellcastingAbilityFor, toCharacterSpell } from '../../utils/spellcasting';
import { getDefaultResources, applyResourceEdits } from './classResources';

// Every step the builder can show. `spells` only appears while one of the
// chosen classes casts (getSteps).
export const ALL_STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'class', label: 'Class' },
  { id: 'spells', label: 'Spells' },
  { id: 'background', label: 'Background' },
  { id: 'species', label: 'Species' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'resources', label: 'Resources' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
];

const ALL_SKILLS = SKILLS.map(s => s.name);
const STAT_BY_NAME = {
  strength: 'str', dexterity: 'dex', constitution: 'con',
  intelligence: 'int', wisdom: 'wis', charisma: 'cha',
};
// 2024 multiclassing: the skill a class grants when it isn't your first one
// (null = any skill; 'list' = one from that class's own skill list)
const MULTICLASS_SKILL = { Bard: null, Ranger: 'list', Rogue: 'list' };

export const emptyDraft = () => ({
  name: '',
  level: 1,
  className: 'Fighter',
  customRole: '',
  customHitDie: 8,
  subclass: '',
  classSkills: [],
  classFeatureChoices: {},
  background: '',
  customBackground: '',
  customBackgroundSkills: [],
  customBackgroundFeat: '',
  customBackgroundAbilities: [],
  bonusMode: '2-1', // '2-1' = +2 / +1, '1-1-1' = +1 to all three
  bonusPlus2: '',
  bonusPlus1: '',
  species: '',
  lineage: '',
  size: '',
  speciesSkill: '',
  speciesFeat: '',
  abilityMethod: 'standard',
  baseScores: { str: '', dex: '', con: '', int: '', wis: '', cha: '' },
  classEquipment: 'A',
  backgroundEquipment: 'A',
  alignment: '',
  languages: [],
  personality: '',
  ideals: '',
  bonds: '',
  flaws: '',
  notes: '',
  hpMethod: 'fixed',
  manualHp: '',
  multiclasses: [], // [{ id, name, level, subclass, skill }]
  spellPicks: {}, // { [className]: [spellbook entries] }
  resourceEdits: {}, // { [resource key]: { name?, max?, removed? } }
  customResources: [], // [{ key, name, max }]
});

// ─── Class rules ────────────────────────────────────────────────────

// "Choose 2: Arcana, History, or Religion" / "Choose any 3 skills"
export const parseSkillChoices = (text) => {
  if (!text) return { count: 0, options: [] };
  const any = text.match(/Choose any (\d+)/i);
  if (any) return { count: parseInt(any[1]), options: ALL_SKILLS };
  const m = text.match(/Choose (\d+):\s*(.+)$/i);
  if (!m) return { count: 0, options: [] };
  const options = m[2].split(/,\s*/).map(s => s.replace(/^or\s+/i, '').trim()).filter(Boolean);
  return { count: parseInt(m[1]), options };
};

// "A, B, and 15 GP" → { items: ['A', 'B'], gold: 15 }
export const parseItemList = (text) => {
  const parts = (text || '').split(/,\s*/).map(s => s.replace(/^(and|or)\s+/i, '').trim()).filter(Boolean);
  let gold = 0;
  const items = [];
  for (const part of parts) {
    const g = part.match(/^(\d+)\s*GP$/i);
    if (g) gold += parseInt(g[1]);
    else items.push(part);
  }
  return { items, gold };
};

// "Choose A or B: (A) Greataxe, 4 Handaxes, and 15 GP; or (B) 75 GP"
export const parseEquipmentOptions = (text) => {
  const options = [];
  const re = /\(([A-Z])\)\s*([^;]+)/g;
  let m;
  while ((m = re.exec(text || ''))) {
    options.push({ key: m[1], ...parseItemList(m[2].replace(/;?\s*or\s*$/i, '')) });
  }
  return options;
};

// Everything the stepper needs about one class, or null for a custom role.
export const getClassRules = (className) => {
  if (!className) return null;
  const extra = EXTRA_CLASS_RULES[className];
  const data = CLASS_DATA.find(c => c.name === className);
  if (!extra && !data) return null;
  const details = (data && CLASS_DETAILS[data.id]) || {};
  const hitDie = extra ? extra.hitDie : parseInt(String(data.hitDie).replace(/\D/g, '')) || 8;
  const saves = extra ? extra.saves : (data.savingThrows || []).map(s => STAT_BY_NAME[s.toLowerCase()]).filter(Boolean);
  return {
    name: className,
    hitDie,
    saves,
    armorProf: extra ? extra.armorProf : data.armorProf,
    weaponProf: extra ? extra.weaponProf : data.weaponProf,
    tagline: data?.tagline || extra?.tagline || '',
    emoji: data?.emoji || extra?.emoji || '',
    primaryAbility: data?.primaryAbility || extra?.primaryAbility || '',
    skills: parseSkillChoices(extra ? extra.skillChoices : details.skillChoices),
    equipment: parseEquipmentOptions(extra ? extra.startingEquipment : details.startingEquipment),
    subclasses: SUBCLASSES[className] || [],
    subclassLevel: Math.min(...(SUBCLASSES[className] || [{ level: 3 }]).map(s => s.level || 3)),
  };
};

// Single-choice class features unlocked at this level (Fighting Style, Divine
// Order, Primal Order…). Multi-select ones (Weapon Mastery, Invocations) are
// left to the sheet's Features tab.
export const getClassFeatureChoices = (className, level) => {
  const features = CLASS_FEATURES[className] || {};
  return Object.entries(features)
    .filter(([, f]) => f.level <= level && f.options?.length > 0 && !f.multiSelect)
    .map(([name, f]) => ({ key: `${className}:${name}`, name, note: f.note, options: f.options }));
};

// ─── Background & species ───────────────────────────────────────────

export const getBackground = (draft) => {
  if (!draft.background) return null;
  if (draft.background === 'custom') {
    return {
      name: draft.customBackground || 'Custom',
      skills: draft.customBackgroundSkills,
      feat: draft.customBackgroundFeat,
      abilities: draft.customBackgroundAbilities.map(s => s.toUpperCase()),
      tool: '',
      equipment: '',
      custom: true,
    };
  }
  return BACKGROUNDS.find(b => b.name === draft.background) || null;
};

// Ability-score increases from the background: { str: 2, con: 1 }
export const getBackgroundBonuses = (draft) => {
  const bg = getBackground(draft);
  if (!bg) return {};
  const allowed = bg.abilities.map(a => a.toLowerCase());
  if (draft.bonusMode === '1-1-1') return Object.fromEntries(allowed.map(s => [s, 1]));
  const out = {};
  if (allowed.includes(draft.bonusPlus2)) out[draft.bonusPlus2] = 2;
  if (allowed.includes(draft.bonusPlus1) && draft.bonusPlus1 !== draft.bonusPlus2) out[draft.bonusPlus1] = 1;
  return out;
};

export const getSpeciesInfo = (draft) => {
  const species = findSpecies(draft.species);
  if (!species) return null;
  const lineage = species.lineages?.find(l => l.name === draft.lineage) || null;
  return {
    species,
    lineage,
    speed: lineage?.speed || species.speed,
    darkvision: lineage?.darkvision ?? species.darkvision,
    size: species.size.includes(' or ') ? (draft.size || 'Medium') : species.size,
  };
};

// ─── Ability scores ─────────────────────────────────────────────────

export const pointBuySpent = (scores) =>
  STATS.reduce((sum, s) => sum + (POINT_BUY_COSTS[parseInt(scores[s])] ?? 0), 0);

export const roll4d6DropLowest = (rng = Math.random) => {
  const dice = Array.from({ length: 4 }, () => Math.floor(rng() * 6) + 1).sort((a, b) => a - b);
  return dice[1] + dice[2] + dice[3];
};

export const defaultScoresFor = (method) => {
  if (method === 'pointbuy') return Object.fromEntries(STATS.map(s => [s, POINT_BUY_MIN]));
  if (method === 'manual') return Object.fromEntries(STATS.map(s => [s, 10]));
  return Object.fromEntries(STATS.map(s => [s, '']));
};

// Base + background bonus, capped at 20. Unassigned scores count as 10.
export const getFinalScores = (draft) => {
  const bonuses = getBackgroundBonuses(draft);
  return Object.fromEntries(STATS.map(s => {
    const base = parseInt(draft.baseScores[s]);
    const value = (Number.isNaN(base) ? 10 : base) + (bonuses[s] || 0);
    return [s, Math.min(20, value)];
  }));
};

// ─── Derived numbers ────────────────────────────────────────────────

export const getFeatNames = (draft) => {
  const names = [];
  const bg = getBackground(draft);
  if (bg?.feat) names.push(bg.feat);
  if (findSpecies(draft.species)?.originFeat && draft.speciesFeat) names.push(draft.speciesFeat);
  return names;
};

export const getHitDie = (draft) => getClassRules(draft.className)?.hitDie || parseInt(draft.customHitDie) || 8;

// 2024 fixed HP: max die at level 1, then die/2 + 1 per level; CON mod each
// level (min 1 HP per level); Dwarven Toughness +1/level; Tough +2/level.
// Multiclass levels add their own die's average + CON per level.
export const getFixedHp = (draft) => {
  const level = clampLevel(draft.level);
  const die = getHitDie(draft);
  const con = getModNum(getFinalScores(draft).con);
  let hp = Math.max(1, die + con);
  for (let l = 2; l <= level; l++) hp += Math.max(1, die / 2 + 1 + con);
  for (const cls of getDraftClasses(draft).filter(c => !c.primary)) {
    const mcDie = getClassRules(cls.name).hitDie;
    hp += cls.level * Math.max(1, mcDie / 2 + 1 + con);
  }
  const total = getDraftTotalLevel(draft);
  hp += (findSpecies(draft.species)?.hpPerLevel || 0) * total;
  if (getFeatNames(draft).includes('Tough')) hp += 2 * total;
  return hp;
};

export const getMaxHp = (draft) => {
  if (draft.hpMethod === 'manual') {
    const manual = parseInt(draft.manualHp);
    if (manual > 0) return manual;
  }
  return getFixedHp(draft);
};

export const clampLevel = (level) => Math.min(20, Math.max(1, parseInt(level) || 1));

// ─── Classes (primary + multiclass) ────────────────────────────────

// [{ name, level, subclass, primary }] for every real class on the draft;
// empty for a custom role with no multiclass.
export const getDraftClasses = (draft) => {
  const out = [];
  const primaryRules = getClassRules(draft.className);
  if (primaryRules) {
    const level = clampLevel(draft.level);
    out.push({ name: primaryRules.name, level, subclass: level >= primaryRules.subclassLevel ? draft.subclass : '', primary: true });
  }
  for (const mc of draft.multiclasses || []) {
    const rules = getClassRules(mc.name);
    if (!rules) continue;
    const level = clampLevel(mc.level);
    out.push({ name: rules.name, level, subclass: level >= rules.subclassLevel ? mc.subclass : '', primary: false, id: mc.id });
  }
  return out;
};

// Total character level (primary/custom-role level + multiclass levels), max 20
export const getDraftTotalLevel = (draft) => {
  const extra = (draft.multiclasses || []).filter(mc => getClassRules(mc.name)).reduce((sum, mc) => sum + clampLevel(mc.level), 0);
  return Math.min(20, clampLevel(draft.level) + extra);
};

// Skill options a multiclass entry may pick, or null when it grants none
export const getMulticlassSkillOptions = (className) => {
  if (!(className in MULTICLASS_SKILL)) return null;
  return MULTICLASS_SKILL[className] === 'list' ? getClassRules(className).skills.options : ALL_SKILLS;
};

// "STR 13 and CHA 13" / "STR 13 or DEX 13" → met against the final scores?
export const getMulticlassRequirement = (className) => {
  const data = CLASS_DATA.find(c => c.name === className);
  const text = (data && CLASS_DETAILS[data.id]?.multiclass?.requirements) || (className === 'Artificer' ? 'INT 13' : '');
  return text;
};

export const meetsMulticlassRequirement = (className, scores) => {
  const text = getMulticlassRequirement(className);
  if (!text) return true;
  const test = (part) => {
    const m = part.match(/(STR|DEX|CON|INT|WIS|CHA)\s*(\d+)/i);
    return !m || scores[m[1].toLowerCase()] >= parseInt(m[2]);
  };
  if (/ or /i.test(text)) return text.split(/ or /i).some(test);
  return text.split(/ and /i).every(test);
};

export const getSteps = (draft) =>
  ALL_STEPS.filter(s => s.id !== 'spells' || getDraftClasses(draft).some(c => getSpellcastingLimits(c)));

export const getSkillProficiencies = (draft) => {
  const skills = new Set(getBackground(draft)?.skills || []);
  for (const s of draft.classSkills) skills.add(s);
  for (const mc of draft.multiclasses || []) if (mc.skill && getMulticlassSkillOptions(mc.name)) skills.add(mc.skill);
  if (draft.speciesSkill && findSpecies(draft.species)?.skillChoice) skills.add(draft.speciesSkill);
  return [...skills];
};

// ─── Equipment ──────────────────────────────────────────────────────

const ARMOR_NAME = /armor|mail|shield|breastplate|half plate|chain shirt/i;

const lookupWeapon = (name) => {
  const lower = name.toLowerCase();
  for (const candidate of [lower, lower.replace(/es$/, ''), lower.replace(/s$/, '')]) {
    if (BASE_WEAPONS[candidate]) return { key: candidate, data: BASE_WEAPONS[candidate] };
  }
  return null;
};

const titleCase = (s) => s.replace(/\b\w/g, c => c.toUpperCase());

// "4 Handaxes" → a weapon inventory item named "Handaxe" ×4; "Chain Mail" →
// equipped armor; anything else → a plain item.
export const toInventoryItem = (text) => {
  const m = text.match(/^(\d+)\s+(.+)$/);
  const quantity = m ? parseInt(m[1]) : 1;
  const rawName = m ? m[2] : text;
  const base = { id: generateId('item'), quantity, weight: '', description: '' };

  const weapon = lookupWeapon(rawName);
  if (weapon) {
    const props = weapon.data.props || [];
    return {
      ...base,
      name: titleCase(weapon.key),
      itemType: 'weapon',
      isWeapon: true,
      damage: weapon.data.damage,
      damageType: weapon.data.type,
      weaponProperties: props,
      properties: props.join(', '),
      equipped: true,
    };
  }
  if (ARMOR_NAME.test(rawName)) {
    const armor = getArmorData({ name: rawName });
    if (armor) {
      return { ...base, name: rawName, itemType: 'armor', baseAC: String(armor.baseAC), armorType: armor.armorType, equipped: true };
    }
  }
  return { ...base, name: rawName };
};

export const getEquipmentChoice = (draft) => {
  const rules = getClassRules(draft.className);
  const classOption = rules?.equipment.find(o => o.key === draft.classEquipment) || null;
  const bg = getBackground(draft);
  const bgOption = bg?.equipment
    ? (draft.backgroundEquipment === 'gold' ? { items: [], gold: 50 } : parseItemList(bg.equipment))
    : null;
  return { classOption, bgOption };
};

export const getStartingInventory = (draft) => {
  const { classOption, bgOption } = getEquipmentChoice(draft);
  const texts = [...(classOption?.items || []), ...(bgOption?.items || [])];
  const gold = (classOption?.gold || 0) + (bgOption?.gold || 0);
  const items = texts.map(toInventoryItem);
  // Only one body armor and one shield can be worn
  let bodyWorn = false;
  let shieldWorn = false;
  for (const item of items) {
    if (item.itemType !== 'armor') continue;
    if (item.armorType === 'Shield') { item.equipped = !shieldWorn; shieldWorn = true; }
    else { item.equipped = !bodyWorn; bodyWorn = true; }
  }
  if (gold > 0) items.push({ id: generateId('item'), name: 'Gold Pieces (GP)', quantity: gold, weight: '', description: 'Starting gold' });
  return items;
};

// ─── Validation ─────────────────────────────────────────────────────

// Per-step problems. `blocking` ones prevent Create; the rest are warnings
// (a DM can deliberately skip choices for a quick NPC).
export const getStepIssues = (draft) => {
  const issues = Object.fromEntries(ALL_STEPS.map(s => [s.id, []]));
  const add = (step, message, blocking = false) => issues[step].push({ message, blocking });

  if (!draft.name.trim()) add('basics', 'Name is required', true);

  const rules = getClassRules(draft.className);
  const bg = getBackground(draft);
  if (rules) {
    const level = clampLevel(draft.level);
    if (draft.classSkills.length !== rules.skills.count) add('class', `Choose ${rules.skills.count} class skills (${draft.classSkills.length} chosen)`);
    const fromBackground = draft.classSkills.filter(s => bg?.skills?.includes(s));
    if (fromBackground.length) add('class', `${fromBackground.join(', ')} already comes from your background — pick another class skill`);
    if (level >= rules.subclassLevel && rules.subclasses.length && !draft.subclass) add('class', 'Choose a subclass');
    for (const choice of getClassFeatureChoices(draft.className, level)) {
      if (!draft.classFeatureChoices[choice.key]) add('class', `Choose an option for ${choice.name}`);
    }
  } else if (!draft.customRole.trim()) {
    add('class', 'Enter a role for this custom character');
  }

  const rawTotal = clampLevel(draft.level) + (draft.multiclasses || []).reduce((sum, mc) => sum + clampLevel(mc.level), 0);
  if (rawTotal > 20) add('class', `Total level is ${rawTotal} — the maximum is 20`);
  const scores = getFinalScores(draft);
  const seen = new Set([draft.className]);
  for (const mc of draft.multiclasses || []) {
    const mcRules = getClassRules(mc.name);
    if (!mcRules) { add('class', 'Choose a class for each multiclass row'); continue; }
    if (seen.has(mc.name)) add('class', `${mc.name} is listed twice — raise its level instead`);
    seen.add(mc.name);
    const mcLevel = clampLevel(mc.level);
    if (mcLevel >= mcRules.subclassLevel && mcRules.subclasses.length && !mc.subclass) add('class', `Choose a ${mc.name} subclass`);
    if (getMulticlassSkillOptions(mc.name) && !mc.skill) add('class', `Choose the skill ${mc.name} grants`);
    for (const choice of getClassFeatureChoices(mc.name, mcLevel)) {
      if (!draft.classFeatureChoices[choice.key]) add('class', `Choose an option for ${choice.name} (${mc.name})`);
    }
    if (!meetsMulticlassRequirement(mc.name, scores)) add('class', `${mc.name} multiclass needs ${getMulticlassRequirement(mc.name)}`);
  }
  if ((draft.multiclasses || []).length && rules && !meetsMulticlassRequirement(rules.name, scores)) {
    add('class', `Multiclassing out of ${rules.name} needs ${getMulticlassRequirement(rules.name)}`);
  }

  for (const cls of getDraftClasses(draft)) {
    const limits = getSpellcastingLimits(cls);
    if (!limits) continue;
    const picks = draft.spellPicks[cls.name] || [];
    const cantrips = picks.filter(sp => sp.level === 0).length;
    const leveled = picks.length - cantrips;
    if (limits.cantrips && cantrips !== limits.cantrips) add('spells', `${cls.name}: choose ${limits.cantrips} cantrips (${cantrips} chosen)`);
    if (limits.prepared && leveled !== limits.prepared) add('spells', `${cls.name}: choose ${limits.prepared} spells (${leveled} chosen)`);
  }

  if (!bg) add('background', 'Choose a background');
  else {
    if (bg.custom && draft.customBackgroundSkills.length !== 2) add('background', 'Choose 2 background skills');
    if (bg.custom && !draft.customBackgroundFeat) add('background', 'Choose an Origin feat');
    if (bg.custom && draft.customBackgroundAbilities.length !== 3) add('background', 'Choose 3 abilities for the background');
    const bonuses = getBackgroundBonuses(draft);
    const total = Object.values(bonuses).reduce((a, b) => a + b, 0);
    if (total !== 3) add('background', 'Assign the background ability score increases');
  }

  const sp = findSpecies(draft.species);
  if (!sp) add('species', 'Choose a species');
  else {
    if (sp.lineages && !draft.lineage) add('species', `Choose a ${sp.lineageLabel || 'lineage'}`);
    if (sp.skillChoice && !draft.speciesSkill) add('species', `Choose a skill for ${sp.skillChoice.label}`);
    if (sp.originFeat && !draft.speciesFeat) add('species', 'Choose an Origin feat (Versatile)');
  }

  const base = draft.baseScores;
  if (draft.abilityMethod === 'standard') {
    const assigned = STATS.map(s => parseInt(base[s])).filter(n => !Number.isNaN(n)).sort((a, b) => b - a);
    if (assigned.length !== 6 || assigned.some((n, i) => n !== STANDARD_ARRAY[i])) add('abilities', 'Assign each Standard Array value once');
  } else if (draft.abilityMethod === 'pointbuy') {
    if (STATS.some(s => base[s] < POINT_BUY_MIN || base[s] > POINT_BUY_MAX)) add('abilities', `Point-buy scores must be ${POINT_BUY_MIN}–${POINT_BUY_MAX}`);
    if (pointBuySpent(base) > POINT_BUY_BUDGET) add('abilities', `Over budget: ${pointBuySpent(base)} / ${POINT_BUY_BUDGET} points`);
  }

  if (draft.languages.length < BONUS_LANGUAGE_COUNT) add('details', `Choose ${BONUS_LANGUAGE_COUNT} languages besides Common`);

  issues.review = ALL_STEPS.filter(s => s.id !== 'review').flatMap(s => issues[s.id].filter(i => i.blocking));
  return issues;
};

export const canCreate = (draft) => draft.name.trim().length > 0;

// ─── Resources & spells ─────────────────────────────────────────────

export const getResourceDefaults = (draft) => getDefaultResources({
  classes: getDraftClasses(draft),
  totalLevel: getDraftTotalLevel(draft),
  scores: getFinalScores(draft),
  species: findSpecies(draft.species)?.name || '',
  lineage: draft.lineage,
  feats: getFeatNames(draft),
});

// The rows the character will get: defaults + edits + custom, minus removed
export const getResourceRows = (draft) =>
  applyResourceEdits(getResourceDefaults(draft), draft.resourceEdits, draft.customResources);

export const getCharacterSpells = (draft) => {
  const seen = new Set();
  const out = [];
  for (const cls of getDraftClasses(draft)) {
    for (const spell of draft.spellPicks[cls.name] || []) {
      if (seen.has(spell.id)) continue;
      seen.add(spell.id);
      out.push(toCharacterSpell(spell, { prepared: true, alwaysPrepared: false, spellClass: cls.name }));
    }
  }
  return out;
};

// ─── Final character ────────────────────────────────────────────────

const speciesFeatures = (info, level) => {
  if (!info) return [];
  const source = `Species: ${info.species.name}`;
  const out = info.species.traits
    .filter(t => !t.level || t.level <= level)
    .map(t => ({ id: generateId('feature'), name: t.name, description: t.description, source, category: 'Species', custom: false }));
  if (info.lineage) {
    out.push({
      id: generateId('feature'),
      name: `${info.species.lineageLabel}: ${info.lineage.name}`,
      description: info.lineage.note || '',
      source, category: 'Species', custom: false,
    });
  }
  return out;
};

const featFeature = (name, source) => {
  const feat = getFeat(name);
  return {
    id: generateId('feature'),
    name,
    description: feat?.description || '',
    source,
    category: feat?.category || 'Origin',
    prerequisite: feat?.prerequisite,
    custom: false,
  };
};

// kind: 'party' | 'dm-npc'
export const buildCharacter = (draft, kind = 'party') => {
  const level = getDraftTotalLevel(draft);
  const rules = getClassRules(draft.className);
  const classes = getDraftClasses(draft);
  const scores = getFinalScores(draft);
  const bg = getBackground(draft);
  const info = getSpeciesInfo(draft);
  const maxHp = getMaxHp(draft);
  const inventory = getStartingInventory(draft);

  const className = rules ? rules.name : draft.customRole.trim();
  const subclass = classes.find(c => c.primary)?.subclass || '';
  const classNames = classes.map(c => c.name);

  const features = [];
  if (bg?.feat) features.push(featFeature(bg.feat, `Background: ${bg.name}`));
  if (info?.species.originFeat && draft.speciesFeat) features.push(featFeature(draft.speciesFeat, `Species: ${info.species.name}`));
  features.push(...speciesFeatures(info, level));

  const advantages = new Set([...(info?.species.advantages || []), ...(info?.lineage?.advantages || [])]);
  if (info?.darkvision) advantages.add(`Darkvision ${info.darkvision}ft`);

  const notesParts = [];
  if (bg?.tool) notesParts.push(`Tool proficiency: ${bg.tool}`);
  if (rules) notesParts.push(`Armor: ${rules.armorProf}. Weapons: ${rules.weaponProf}.`);
  if (info) notesParts.push(`Size: ${info.size}`);
  if (draft.notes.trim()) notesParts.push(draft.notes.trim());

  const hasBodyArmor = inventory.some(i => i.itemType === 'armor' && i.equipped && i.armorType !== 'Shield');
  const unarmored = classNames.some(n => ['Barbarian', 'Monk'].includes(n)) && !hasBodyArmor;
  const firstCaster = classes.find(c => spellcastingAbilityFor(c));

  const character = {
    id: generateId(kind === 'dm-npc' ? 'dm-npc' : 'party'),
    name: draft.name.trim(),
    class: className,
    level,
    ...(classes.length ? { classes: classes.map(c => ({ name: c.name, level: c.level, subclass: c.subclass })), subclass } : {}),
    race: info ? (info.lineage ? `${info.species.name} (${info.lineage.name})` : info.species.name) : '',
    background: bg?.name || '',
    alignment: draft.alignment,
    languages: ['Common', ...draft.languages].join(', '),
    personality: draft.personality,
    ideals: draft.ideals,
    bonds: draft.bonds,
    flaws: draft.flaws,
    notes: notesParts.join('\n'),
    ...scores,
    maxHp,
    currentHp: maxHp,
    tempHp: 0,
    initiative: 0,
    speed: info?.speed || 30,
    spellStat: firstCaster ? spellcastingAbilityFor(firstCaster) : null,
    skillProficiencies: Object.fromEntries(getSkillProficiencies(draft).map(s => [s, 1])),
    saveProficiencies: Object.fromEntries((rules?.saves || []).map(s => [s, 1])),
    classFeatures: Object.fromEntries(Object.entries(draft.classFeatureChoices)
      .filter(([k, v]) => v && classNames.some(n => k.startsWith(`${n}:`)))),
    advantages: [...advantages],
    features,
    resources: getResourceRows(draft)
      .filter(r => !r.removed && r.name.trim() && parseInt(r.max) > 0)
      .map(r => ({ id: generateId('resource'), name: r.name.trim(), current: parseInt(r.max), max: parseInt(r.max), ...(r.recharge ? { recharge: r.recharge } : {}) })),
    inventory,
    spells: getCharacterSpells(draft),
    acEffect: unarmored ? 'unarmoredDefense' : null,
  };
  character.ac = getCalculatedAC(character);
  if (kind === 'dm-npc') character.isDmNpc = true;
  return character;
};
