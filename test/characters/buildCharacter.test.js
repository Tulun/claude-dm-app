import { describe, it, expect } from 'vitest';
import {
  emptyDraft, parseSkillChoices, parseEquipmentOptions, parseItemList, getClassRules,
  getClassFeatureChoices, getBackgroundBonuses, getFinalScores, pointBuySpent, roll4d6DropLowest,
  getFixedHp, getMaxHp, toInventoryItem, getStartingInventory, getStepIssues, buildCharacter, canCreate,
} from '../../app/characters/creation/buildCharacter.js';
import { CLASSES, BACKGROUNDS } from '../../app/character/components/constants.js';
import { SPECIES } from '../../app/characters/creation/creationData.js';
import { getFeat } from '../../app/character/components/feats.js';

const draftWith = (patch) => ({ ...emptyDraft(), ...patch });

// A fully-specified level-1 Soldier Fighter dwarf
const fighter = () => draftWith({
  name: 'Brom',
  className: 'Fighter',
  classSkills: ['Perception', 'Survival'],
  classFeatureChoices: { 'Fighter:Fighting Style': 'Defense' },
  background: 'Soldier', bonusMode: '2-1', bonusPlus2: 'str', bonusPlus1: 'con',
  species: 'Dwarf',
  abilityMethod: 'standard',
  baseScores: { str: 15, dex: 10, con: 14, int: 8, wis: 13, cha: 12 },
  languages: ['Dwarvish', 'Giant'],
});

describe('class rules parsing', () => {
  it('parses a fixed skill list and the "any N" form', () => {
    expect(parseSkillChoices('Choose 2: Arcana, History, or Religion')).toEqual({ count: 2, options: ['Arcana', 'History', 'Religion'] });
    const any = parseSkillChoices('Choose any 3 skills');
    expect(any.count).toBe(3);
    expect(any.options).toHaveLength(18);
  });

  it('parses lettered equipment packages with quantities and gold', () => {
    const opts = parseEquipmentOptions("Choose A or B: (A) Greataxe, 4 Handaxes, Explorer's Pack, and 15 GP; or (B) 75 GP");
    expect(opts).toEqual([
      { key: 'A', items: ['Greataxe', '4 Handaxes', "Explorer's Pack"], gold: 15 },
      { key: 'B', items: [], gold: 75 },
    ]);
    expect(parseItemList('Gaming Set, Fine Clothes, Perfume, and 29 GP')).toEqual({ items: ['Gaming Set', 'Fine Clothes', 'Perfume'], gold: 29 });
  });

  it('every class in the class list has creation rules with parseable skills and equipment', () => {
    for (const name of CLASSES) {
      const rules = getClassRules(name);
      expect(rules, name).toBeTruthy();
      expect(rules.saves, name).toHaveLength(2);
      expect(rules.skills.count, name).toBeGreaterThan(0);
      expect(rules.skills.options.length, name).toBeGreaterThanOrEqual(rules.skills.count);
      expect(rules.equipment.length, name).toBeGreaterThanOrEqual(2);
      expect(rules.equipment.every(o => o.items.length || o.gold), name).toBe(true);
    }
  });

  it('the Fighter has the three 2024 equipment options', () => {
    expect(getClassRules('Fighter').equipment.map(o => o.key)).toEqual(['A', 'B', 'C']);
  });

  it('custom roles have no rules', () => {
    expect(getClassRules('')).toBeNull();
    expect(getClassRules('Commoner')).toBeNull();
  });

  it('lists single-choice class features unlocked by level, skipping multi-selects', () => {
    const choices = getClassFeatureChoices('Fighter', 1).map(c => c.name);
    expect(choices).toContain('Fighting Style');
    expect(getClassFeatureChoices('Fighter', 1).every(c => c.key.startsWith('Fighter:'))).toBe(true);
  });
});

describe('reference data integrity', () => {
  it('every background names a real origin feat, three abilities, a tool, and equipment', () => {
    for (const bg of BACKGROUNDS) {
      expect(getFeat(bg.feat)?.category, bg.name).toBe('Origin');
      expect(bg.abilities, bg.name).toHaveLength(3);
      expect(bg.tool, bg.name).toBeTruthy();
      expect(parseItemList(bg.equipment).gold, bg.name).toBeGreaterThan(0);
    }
  });

  it('species lineages and skill choices are well formed', () => {
    for (const sp of SPECIES) {
      expect(sp.speed, sp.name).toBeGreaterThan(0);
      if (sp.lineages) expect(sp.lineageLabel, sp.name).toBeTruthy();
    }
  });
});

describe('ability scores', () => {
  it('applies +2/+1 background bonuses only to the background abilities', () => {
    expect(getBackgroundBonuses(fighter())).toEqual({ str: 2, con: 1 });
    expect(getBackgroundBonuses({ ...fighter(), bonusPlus2: 'cha' })).toEqual({ con: 1 }); // CHA not a Soldier ability
  });

  it('applies +1/+1/+1 to all three abilities', () => {
    expect(getBackgroundBonuses({ ...fighter(), bonusMode: '1-1-1' })).toEqual({ str: 1, dex: 1, con: 1 });
  });

  it('caps final scores at 20 and treats unassigned scores as 10', () => {
    const d = { ...fighter(), baseScores: { str: 19, dex: '', con: 14, int: 8, wis: 13, cha: 12 } };
    const f = getFinalScores(d);
    expect(f.str).toBe(20);
    expect(f.dex).toBe(10);
    expect(f.con).toBe(15);
  });

  it('counts point-buy cost', () => {
    expect(pointBuySpent({ str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 })).toBe(27);
    expect(pointBuySpent({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })).toBe(0);
  });

  it('rolls 4d6 and drops the lowest die', () => {
    const seq = [0, 0.99, 0.5, 0.2]; // dice 1, 6, 4, 2 → 6+4+2
    let i = 0;
    expect(roll4d6DropLowest(() => seq[i++])).toBe(12);
  });
});

describe('hit points', () => {
  it('level 1 = max hit die + CON mod (+1 Dwarven Toughness)', () => {
    // CON 14 + 1 = 15 → +2; d10 → 12, dwarf +1
    expect(getFixedHp(fighter())).toBe(13);
  });

  it('adds die/2 + 1 + CON per level after the first', () => {
    const d = { ...fighter(), species: 'Human', level: 5 };
    // 12 + 4 × (6 + 2)
    expect(getFixedHp(d)).toBe(44);
  });

  it('adds 2 per level for the Tough feat', () => {
    const d = { ...fighter(), species: 'Human', speciesFeat: 'Tough', level: 3 };
    // 12 + 2 × 8 + 6
    expect(getFixedHp(d)).toBe(34);
  });

  it('never gains less than 1 HP per level', () => {
    const d = draftWith({ className: 'Wizard', level: 2, baseScores: { str: 10, dex: 10, con: 1, int: 10, wis: 10, cha: 10 }, abilityMethod: 'manual' });
    expect(getFixedHp(d)).toBe(2);
  });

  it('manual HP overrides the fixed value', () => {
    expect(getMaxHp({ ...fighter(), hpMethod: 'manual', manualHp: '50' })).toBe(50);
    expect(getMaxHp({ ...fighter(), hpMethod: 'manual', manualHp: '' })).toBe(13);
  });
});

describe('starting equipment', () => {
  it('turns weapons, armor, and gear into inventory items', () => {
    expect(toInventoryItem('4 Handaxes')).toMatchObject({ name: 'Handaxe', quantity: 4, itemType: 'weapon', damage: '1d6', damageType: 'Slashing' });
    expect(toInventoryItem('Chain Mail')).toMatchObject({ itemType: 'armor', baseAC: '16', armorType: 'Heavy', equipped: true });
    expect(toInventoryItem('Shield')).toMatchObject({ itemType: 'armor', armorType: 'Shield', baseAC: '2' });
    expect(toInventoryItem('20 Arrows')).toMatchObject({ name: 'Arrows', quantity: 20 });
    expect(toInventoryItem("Explorer's Pack").itemType).toBeUndefined();
  });

  it('merges class and background packages and their gold', () => {
    const inv = getStartingInventory(fighter());
    const names = inv.map(i => i.name);
    expect(names).toEqual(expect.arrayContaining(['Chain Mail', 'Greatsword', 'Spear', 'Healer\'s Kit']));
    expect(inv.find(i => i.name === 'Gold Pieces (GP)').quantity).toBe(4 + 14);
  });

  it('wears only one body armor', () => {
    const inv = getStartingInventory({ ...fighter(), background: 'custom' }).filter(i => i.itemType === 'armor');
    expect(inv.filter(i => i.equipped && i.armorType !== 'Shield')).toHaveLength(1);
  });

  it('takes 50 GP instead of the background package', () => {
    const inv = getStartingInventory({ ...fighter(), classEquipment: 'C', backgroundEquipment: 'gold' });
    expect(inv).toHaveLength(1);
    expect(inv[0].quantity).toBe(155 + 50);
  });
});

describe('step validation', () => {
  it('only the name blocks creation', () => {
    const d = emptyDraft();
    expect(canCreate(d)).toBe(false);
    const issues = getStepIssues(d);
    expect(issues.basics[0]).toMatchObject({ blocking: true });
    expect(issues.review).toHaveLength(1);
    expect(canCreate({ ...d, name: 'X' })).toBe(true);
  });

  it('a complete draft has no issues', () => {
    const issues = getStepIssues(fighter());
    expect(Object.values(issues).flat()).toEqual([]);
  });

  it('flags a class skill that duplicates a background skill', () => {
    const issues = getStepIssues({ ...fighter(), classSkills: ['Athletics', 'Survival'] });
    expect(issues.class.map(i => i.message).join()).toMatch(/Athletics already comes from your background/);
  });

  it('flags missing lineage, subclass, and broken standard array', () => {
    const issues = getStepIssues({ ...fighter(), species: 'Elf', level: 3, baseScores: { str: 15, dex: 15, con: 13, int: 12, wis: 10, cha: 8 } });
    expect(issues.species.map(i => i.message)).toEqual(['Choose a Elven Lineage', 'Choose a skill for Keen Senses']);
    expect(issues.class.map(i => i.message)).toContain('Choose a subclass');
    expect(issues.abilities).toHaveLength(1);
  });

  it('flags point buy over budget', () => {
    const issues = getStepIssues({ ...fighter(), abilityMethod: 'pointbuy', baseScores: { str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 } });
    expect(issues.abilities[0].message).toMatch(/Over budget/);
  });
});

describe('buildCharacter', () => {
  it('produces a character in the stored party shape', () => {
    const c = buildCharacter(fighter(), 'party');
    expect(c.id).toMatch(/^party-/);
    expect(c).toMatchObject({
      name: 'Brom', class: 'Fighter', level: 1,
      classes: [{ name: 'Fighter', level: 1, subclass: '' }],
      race: 'Dwarf', background: 'Soldier',
      str: 17, dex: 10, con: 15,
      maxHp: 13, currentHp: 13, speed: 30, spellStat: null,
      saveProficiencies: { str: 1, con: 1 },
      skillProficiencies: { Athletics: 1, Intimidation: 1, Perception: 1, Survival: 1 },
      classFeatures: { 'Fighter:Fighting Style': 'Defense' },
      languages: 'Common, Dwarvish, Giant',
      ac: 16, // chain mail, heavy → no DEX
    });
    expect(c.isDmNpc).toBeUndefined();
    expect(c.advantages).toEqual(expect.arrayContaining(['Resist Poison', 'Darkvision 120ft']));
    expect(c.features.map(f => f.name)).toEqual(expect.arrayContaining(['Savage Attacker', 'Dwarven Resilience']));
  });

  it('marks DM NPCs', () => {
    const c = buildCharacter(fighter(), 'dm-npc');
    expect(c.id).toMatch(/^dm-npc-/);
    expect(c.isDmNpc).toBe(true);
  });

  it('gives an unarmored Barbarian Unarmored Defense', () => {
    const c = buildCharacter({ ...fighter(), className: 'Barbarian', classSkills: ['Nature', 'Survival'], baseScores: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 } }, 'party');
    expect(c.acEffect).toBe('unarmoredDefense');
    expect(c.ac).toBe(10 + 2 + 2); // DEX 14, CON 13+1
  });

  it('applies lineage speed and spellcasting ability', () => {
    const c = buildCharacter({ ...fighter(), className: 'Wizard', species: 'Elf', lineage: 'Wood Elf', speciesSkill: 'Perception' }, 'party');
    expect(c.speed).toBe(35);
    expect(c.race).toBe('Elf (Wood Elf)');
    expect(c.spellStat).toBe('int');
    expect(c.skillProficiencies.Perception).toBe(1);
  });

  it('only adds species traits unlocked at the character level', () => {
    const names = (lvl) => buildCharacter({ ...fighter(), species: 'Goliath', lineage: "Fire's Burn", level: lvl }, 'party').features.map(f => f.name);
    expect(names(1)).not.toContain('Large Form');
    expect(names(5)).toContain('Large Form');
  });

  it('keeps a custom role as the class with no classes array', () => {
    const c = buildCharacter(draftWith({ name: 'Olm', className: '', customRole: 'Commoner', customHitDie: 8 }), 'dm-npc');
    expect(c.class).toBe('Commoner');
    expect(c.classes).toBeUndefined();
    expect(c.maxHp).toBe(8);
    expect(c.saveProficiencies).toEqual({});
  });

  it('a name-only quick NPC still builds', () => {
    const c = buildCharacter(draftWith({ name: 'Quick' }), 'dm-npc');
    expect(c).toMatchObject({ name: 'Quick', class: 'Fighter', maxHp: 10, ac: 16 }); // default Fighter kit A: chain mail
  });
});

describe('multiclassing', () => {
  const mc = (name, level, extra = {}) => ({ id: `mc-${name}`, name, level, subclass: '', skill: '', ...extra });

  it('adds classes, total level, and steps', async () => {
    const { getDraftClasses, getDraftTotalLevel, getSteps } = await import('../../app/characters/creation/buildCharacter.js');
    const d = { ...fighter(), level: 3, subclass: 'Champion', multiclasses: [mc('Wizard', 2)] };
    expect(getDraftClasses(d).map(c => [c.name, c.level, c.primary])).toEqual([['Fighter', 3, true], ['Wizard', 2, false]]);
    expect(getDraftTotalLevel(d)).toBe(5);
    expect(getSteps(d).map(s => s.id)).toContain('spells');
    expect(getSteps(fighter()).map(s => s.id)).not.toContain('spells');
  });

  it('caps total level at 20 and flags the overflow', () => {
    const d = { ...fighter(), level: 15, multiclasses: [mc('Rogue', 8, { skill: 'Stealth' })] };
    const c = buildCharacter(d, 'party');
    expect(c.level).toBe(20);
    expect(getStepIssues(d).class.map(i => i.message)).toContain('Total level is 23 — the maximum is 20');
  });

  it('HP: multiclass levels add their own die average', () => {
    // Fighter 1 (d10): 10 + 2 + dwarf 1; Wizard 2 (d6): 2 × (4 + 2) + dwarf 2
    const d = { ...fighter(), multiclasses: [mc('Wizard', 2)] };
    expect(getFixedHp(d)).toBe(12 + 12 + 3);
  });

  it('saves come from the first class only; the multiclass skill is added', () => {
    const d = { ...fighter(), multiclasses: [mc('Rogue', 1, { skill: 'Stealth' })] };
    const c = buildCharacter(d, 'party');
    expect(c.saveProficiencies).toEqual({ str: 1, con: 1 });
    expect(c.skillProficiencies.Stealth).toBe(1);
    expect(c.classes).toEqual([{ name: 'Fighter', level: 1, subclass: '' }, { name: 'Rogue', level: 1, subclass: '' }]);
    expect(c.class).toBe('Fighter');
  });

  it('flags unmet multiclass prerequisites and missing multiclass choices', () => {
    // INT 8 → Wizard needs INT 13; Ranger grants a skill
    const issues = getStepIssues({ ...fighter(), multiclasses: [mc('Wizard', 1), mc('Ranger', 1)] }).class.map(i => i.message);
    expect(issues).toContain('Wizard multiclass needs INT 13');
    expect(issues).toContain('Choose the skill Ranger grants');
  });

  it('spell stat comes from the first casting class and spells carry their class', () => {
    const d = {
      ...fighter(),
      multiclasses: [mc('Wizard', 1)],
      spellPicks: { Wizard: [{ id: 'spell-fire-bolt', name: 'Fire Bolt', level: 0, castingTime: 'Action', classes: ['Wizard'] }] },
    };
    const c = buildCharacter(d, 'party');
    expect(c.spellStat).toBe('int');
    expect(c.spells).toHaveLength(1);
    expect(c.spells[0]).toMatchObject({ name: 'Fire Bolt', spellClass: 'Wizard', prepared: true, castTime: 'Action' });
  });

  it('drops spell picks of a class that is no longer on the draft', () => {
    const d = { ...fighter(), spellPicks: { Wizard: [{ id: 'spell-fire-bolt', name: 'Fire Bolt', level: 0 }] } };
    expect(buildCharacter(d, 'party').spells).toEqual([]);
  });

  it('resources merge both classes and honour edits', () => {
    const d = {
      ...fighter(), level: 2,
      multiclasses: [mc('Wizard', 1)],
      resourceEdits: { 'Fighter:Action Surge': { max: 2 }, 'Dwarf:Stonecunning': { removed: true } },
      customResources: [{ key: 'c1', name: 'Rune Charges', max: 3 }, { key: 'c2', name: '', max: 1 }],
    };
    const res = buildCharacter(d, 'party').resources;
    expect(res.map(r => [r.name, r.max, r.current])).toEqual([
      ['Second Wind', 2, 2],
      ['Action Surge', 2, 2],
      ['Arcane Recovery', 1, 1],
      ['1st Level Spell Slots', 2, 2],
      ['Rune Charges', 3, 3],
    ]);
    expect(res[0].recharge).toMatch(/Long Rest/);
    expect(res[0].id).toMatch(/^resource-/);
  });
});
