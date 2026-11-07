'use client';

// Step panels for CharacterCreator. Each step gets { draft, update, accent }
// and edits the draft only through `update(patch)`. All rules math lives in
// app/characters/creation/buildCharacter.js.

import { useState } from 'react';
import { SKILLS, STATS, BACKGROUNDS, CLASSES, CLASS_FEATURES } from '../../character/components/constants';
import { FEATS, ABILITY_LABELS, getFeat } from '../../character/components/feats';
import { getModNum, formatMod } from '../../utils/rules';
import {
  STANDARD_ARRAY, POINT_BUY_BUDGET, POINT_BUY_COSTS, POINT_BUY_MIN, POINT_BUY_MAX,
  SPECIES, ALIGNMENTS, STANDARD_LANGUAGES, RARE_LANGUAGES, BONUS_LANGUAGE_COUNT,
} from '../creation/creationData';
import {
  getClassRules, getClassFeatureChoices, getBackground, getBackgroundBonuses, getSpeciesInfo,
  getFinalScores, pointBuySpent, roll4d6DropLowest, defaultScoresFor, clampLevel, getFixedHp,
  getHitDie, getEquipmentChoice, getSkillProficiencies, getDraftClasses, getDraftTotalLevel,
  getMulticlassSkillOptions, getMulticlassRequirement, meetsMulticlassRequirement,
  getResourceDefaults, getResourceRows,
} from '../creation/buildCharacter';
import { getSpellcastingLimits } from '../../utils/spellcasting';
import { getLevelLabel } from '../../utils/spellFormat';
import { generateId } from '../../utils/generateId';

const ORIGIN_FEATS = FEATS.filter(f => f.category === 'Origin');
const ALL_SKILLS = SKILLS.map(s => s.name);

// ─── Small shared pieces ────────────────────────────────────────────

export const inputClass = (accent) =>
  `w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none ${accent.focus}`;

const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-xs text-stone-400 mb-1">{children}</label>
);

const SectionTitle = ({ children, hint }) => (
  <div className="flex items-baseline justify-between mb-2">
    <h3 className="text-sm font-semibold text-stone-200">{children}</h3>
    {hint && <span className="text-xs text-stone-500">{hint}</span>}
  </div>
);

const ChoiceCard = ({ selected, onClick, accent, title, subtitle, icon }) => (
  <button type="button" onClick={onClick} aria-pressed={selected}
    className={`text-left p-3 rounded-lg border transition-colors ${selected ? accent.cardOn : 'border-stone-700 bg-stone-800/60 hover:border-stone-500'}`}>
    <div className="flex items-center gap-2">
      {icon && <span className="text-lg" aria-hidden="true">{icon}</span>}
      <span className="font-medium text-sm">{title}</span>
    </div>
    {subtitle && <div className="text-xs text-stone-400 mt-0.5">{subtitle}</div>}
  </button>
);

const Chip = ({ selected, disabled, onClick, children, accent, note }) => (
  <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected}
    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
      selected ? accent.chipOn : disabled ? 'border-stone-800 text-stone-600 cursor-not-allowed' : 'border-stone-700 text-stone-300 hover:border-stone-500'}`}>
    {children}{note && <span className="ml-1 text-[10px] opacity-70">({note})</span>}
  </button>
);

const InfoRow = ({ label, children }) => (
  <div className="flex gap-2 text-xs"><span className="text-stone-500 w-24 shrink-0">{label}</span><span className="text-stone-300">{children}</span></div>
);

const toggleIn = (list, value, max) =>
  list.includes(value) ? list.filter(v => v !== value) : (list.length < max ? [...list, value] : list);

// ─── Basics ─────────────────────────────────────────────────────────

export function BasicsStep({ draft, update, accent, kind }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cc-name">Name *</Label>
        <input id="cc-name" name="characterName" autoFocus value={draft.name} onChange={e => update({ name: e.target.value })}
          className={inputClass(accent)} placeholder={kind === 'dm-npc' ? 'Captain Reva' : 'Character name'} />
      </div>
      <p className="text-xs text-stone-500 leading-relaxed">
        Walk through Class (with levels and multiclassing) → Spells → Background → Species → Abilities →
        Equipment → Resources like a full character build. The Spells step appears once a class casts.
        Only the name is required: <span className="text-stone-300">Create now</span> works from any step, and
        anything you skip can be filled in later on the character sheet.
      </p>
    </div>
  );
}

// ─── Class ──────────────────────────────────────────────────────────

export function ClassStep({ draft, update, accent }) {
  const rules = getClassRules(draft.className);
  const level = clampLevel(draft.level);
  const bgSkills = getBackground(draft)?.skills || [];
  const featureChoices = getClassFeatureChoices(draft.className, level);
  const features = Object.entries(CLASS_FEATURES[draft.className] || {}).filter(([, f]) => f.level <= level);

  const pickClass = (name) => update({
    className: name, subclass: '', classSkills: [], classEquipment: 'A',
    classFeatureChoices: withoutClassKeys(draft.classFeatureChoices, draft.className),
    spellPicks: { ...draft.spellPicks, [draft.className]: undefined },
  });
  const totalLevel = getDraftTotalLevel(draft);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CLASSES.map(name => {
          const r = getClassRules(name);
          return <ChoiceCard key={name} accent={accent} selected={draft.className === name} onClick={() => pickClass(name)}
            icon={r?.emoji} title={name} subtitle={r ? `d${r.hitDie} · ${r.primaryAbility}` : ''} />;
        })}
        <ChoiceCard accent={accent} selected={!draft.className} onClick={() => pickClass('')}
          icon="🎭" title="Custom role" subtitle="Commoner, guard, noble…" />
      </div>

      <div className="flex items-end gap-4">
        <div className="w-32">
          <Label htmlFor="cc-level">{rules ? `${rules.name} level` : 'Level'}</Label>
          <input id="cc-level" type="number" min="1" max="20" value={draft.level}
            onChange={e => update({ level: e.target.value })} onBlur={() => update({ level: clampLevel(draft.level) })}
            className={inputClass(accent)} />
        </div>
        {draft.multiclasses.length > 0 && <p className="text-xs text-stone-400 pb-2">Character level {totalLevel}</p>}
      </div>

      {!rules && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cc-role">Role</Label>
            <input id="cc-role" value={draft.customRole} onChange={e => update({ customRole: e.target.value })}
              className={inputClass(accent)} placeholder="Commoner" />
          </div>
          <div>
            <Label htmlFor="cc-hitdie">Hit Die</Label>
            <select id="cc-hitdie" value={draft.customHitDie} onChange={e => update({ customHitDie: parseInt(e.target.value) })} className={inputClass(accent)}>
              {[6, 8, 10, 12].map(d => <option key={d} value={d}>d{d}</option>)}
            </select>
          </div>
        </div>
      )}

      {rules && (
        <>
          <div className="bg-stone-800/50 rounded-lg p-3 space-y-1">
            {rules.tagline && <p className="text-sm text-stone-300 italic mb-2">{rules.tagline}</p>}
            <InfoRow label="Hit Die">d{rules.hitDie}</InfoRow>
            <InfoRow label="Saving Throws">{rules.saves.map(s => ABILITY_LABELS[s]).join(', ')}</InfoRow>
            <InfoRow label="Armor">{rules.armorProf}</InfoRow>
            <InfoRow label="Weapons">{rules.weaponProf}</InfoRow>
          </div>

          {rules.subclasses.length > 0 && (
            <div>
              <SectionTitle hint={level < rules.subclassLevel ? `Unlocks at level ${rules.subclassLevel}` : null}>Subclass</SectionTitle>
              <select aria-label="Subclass" value={draft.subclass} disabled={level < rules.subclassLevel}
                onChange={e => update({ subclass: e.target.value })} className={`${inputClass(accent)} disabled:opacity-50`}>
                <option value="">— Choose —</option>
                {rules.subclasses.map(s => <option key={s.name} value={s.name}>{s.name} — {s.description}</option>)}
              </select>
            </div>
          )}

          <div>
            <SectionTitle hint={`${draft.classSkills.length} / ${rules.skills.count}`}>Skill Proficiencies</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {rules.skills.options.map(skill => {
                const selected = draft.classSkills.includes(skill);
                const fromBg = bgSkills.includes(skill);
                return (
                  <Chip key={skill} accent={accent} selected={selected} note={fromBg ? 'background' : null}
                    disabled={!selected && (fromBg || draft.classSkills.length >= rules.skills.count)}
                    onClick={() => update({ classSkills: toggleIn(draft.classSkills, skill, rules.skills.count) })}>
                    {skill}
                  </Chip>
                );
              })}
            </div>
          </div>

          {featureChoices.map(choice => (
            <div key={choice.key}>
              <SectionTitle>{choice.name}</SectionTitle>
              {choice.note && <p className="text-xs text-stone-500 mb-1">{choice.note}</p>}
              <select aria-label={choice.name} value={draft.classFeatureChoices[choice.key] || ''}
                onChange={e => update({ classFeatureChoices: { ...draft.classFeatureChoices, [choice.key]: e.target.value } })}
                className={inputClass(accent)}>
                <option value="">— Choose —</option>
                {choice.options.map(o => <option key={o.name} value={o.name}>{o.name}{o.description ? ` — ${o.description}` : ''}</option>)}
              </select>
            </div>
          ))}

          {features.length > 0 && (
            <div>
              <SectionTitle>Class features through level {level}</SectionTitle>
              <ul className="text-xs text-stone-400 space-y-0.5">
                {features.map(([name, f]) => (
                  <li key={name}><span className="text-stone-300">{name}</span> <span className="text-stone-600">Lv {f.level}</span>{f.multiSelect ? <span className="text-stone-500"> · choose on the sheet</span> : null}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {rules && <MulticlassSection draft={draft} update={update} accent={accent} />}
    </div>
  );
}

const withoutClassKeys = (choices, className) =>
  Object.fromEntries(Object.entries(choices || {}).filter(([k]) => !k.startsWith(`${className}:`)));

function MulticlassSection({ draft, update, accent }) {
  const scores = getFinalScores(draft);
  const taken = new Set([draft.className, ...draft.multiclasses.map(m => m.name)]);
  const totalLevel = getDraftTotalLevel(draft);
  const owned = new Set(getSkillProficiencies(draft));

  const setRow = (id, patch) => update({ multiclasses: draft.multiclasses.map(m => (m.id === id ? { ...m, ...patch } : m)) });
  const addRow = () => {
    const name = CLASSES.find(c => !taken.has(c)) || '';
    update({ multiclasses: [...draft.multiclasses, { id: generateId('mc'), name, level: 1, subclass: '', skill: '' }] });
  };
  const removeRow = (row) => update({
    multiclasses: draft.multiclasses.filter(m => m.id !== row.id),
    classFeatureChoices: withoutClassKeys(draft.classFeatureChoices, row.name),
    spellPicks: { ...draft.spellPicks, [row.name]: undefined },
  });
  const changeClass = (row, name) => {
    update({
      multiclasses: draft.multiclasses.map(m => (m.id === row.id ? { ...m, name, subclass: '', skill: '' } : m)),
      classFeatureChoices: withoutClassKeys(draft.classFeatureChoices, row.name),
      spellPicks: { ...draft.spellPicks, [row.name]: undefined },
    });
  };

  return (
    <div className="border-t border-stone-800 pt-4">
      <SectionTitle hint={`Character level ${totalLevel} / 20`}>Multiclass</SectionTitle>
      <p className="text-xs text-stone-500 mb-3">
        Extra classes add their hit die, spell slots, and resources. Saving throws and starting equipment come from your first class only.
      </p>
      <div className="space-y-3">
        {draft.multiclasses.map((row, i) => {
          const rules = getClassRules(row.name);
          const level = clampLevel(row.level);
          const skillOptions = getMulticlassSkillOptions(row.name);
          const met = meetsMulticlassRequirement(row.name, scores);
          return (
            <div key={row.id} className="bg-stone-800/40 border border-stone-700/60 rounded-lg p-3 space-y-2" data-testid={`multiclass-${i}`}>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[10rem]">
                  <Label htmlFor={`cc-mc-class-${i}`}>Class</Label>
                  <select id={`cc-mc-class-${i}`} value={row.name} onChange={e => changeClass(row, e.target.value)} className={inputClass(accent)}>
                    {CLASSES.map(c => <option key={c} value={c} disabled={c !== row.name && taken.has(c)}>{c}</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <Label htmlFor={`cc-mc-level-${i}`}>Level</Label>
                  <input id={`cc-mc-level-${i}`} type="number" min="1" max="19" value={row.level}
                    onChange={e => setRow(row.id, { level: e.target.value })} onBlur={() => setRow(row.id, { level: clampLevel(row.level) })}
                    className={inputClass(accent)} />
                </div>
                <button type="button" onClick={() => removeRow(row)} aria-label={`Remove ${row.name} multiclass`}
                  className="px-3 py-2 rounded text-xs bg-red-900/30 hover:bg-red-800/30 text-red-400">Remove</button>
              </div>
              {rules && (
                <p className={`text-xs ${met ? 'text-stone-500' : 'text-amber-400'}`}>
                  d{rules.hitDie} hit die · requires {getMulticlassRequirement(row.name)}{met ? '' : ' (not met)'}
                </p>
              )}
              {rules?.subclasses.length > 0 && level >= rules.subclassLevel && (
                <select aria-label={`${row.name} subclass`} value={row.subclass} onChange={e => setRow(row.id, { subclass: e.target.value })} className={inputClass(accent)}>
                  <option value="">— Choose subclass —</option>
                  {rules.subclasses.map(sc => <option key={sc.name} value={sc.name}>{sc.name} — {sc.description}</option>)}
                </select>
              )}
              {skillOptions && (
                <div>
                  <div className="text-xs text-stone-400 mb-1">{row.name} grants one skill</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillOptions.map(skill => (
                      <Chip key={skill} accent={accent} selected={row.skill === skill}
                        disabled={owned.has(skill) && row.skill !== skill}
                        onClick={() => setRow(row.id, { skill: row.skill === skill ? '' : skill })}>{skill}</Chip>
                    ))}
                  </div>
                </div>
              )}
              {getClassFeatureChoices(row.name, level).map(choice => (
                <select key={choice.key} aria-label={`${choice.name} (${row.name})`} value={draft.classFeatureChoices[choice.key] || ''}
                  onChange={e => update({ classFeatureChoices: { ...draft.classFeatureChoices, [choice.key]: e.target.value } })}
                  className={inputClass(accent)}>
                  <option value="">— {choice.name} —</option>
                  {choice.options.map(o => <option key={o.name} value={o.name}>{o.name}{o.description ? ` — ${o.description}` : ''}</option>)}
                </select>
              ))}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addRow} disabled={totalLevel >= 20 || taken.size >= CLASSES.length}
        className="mt-3 px-3 py-1.5 rounded text-xs bg-stone-700 hover:bg-stone-600 disabled:opacity-40">+ Add a class</button>
    </div>
  );
}

// ─── Background ─────────────────────────────────────────────────────

export function BackgroundStep({ draft, update, accent }) {
  const bg = getBackground(draft);
  const feat = bg?.feat ? getFeat(bg.feat) : null;
  const allowed = (bg?.abilities || []).map(a => a.toLowerCase());
  const pickBackground = (name) => update({ background: name, bonusPlus2: '', bonusPlus1: '', backgroundEquipment: 'A' });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BACKGROUNDS.map(b => (
          <ChoiceCard key={b.name} accent={accent} selected={draft.background === b.name} onClick={() => pickBackground(b.name)}
            title={b.name} subtitle={b.feat} />
        ))}
        <ChoiceCard accent={accent} selected={draft.background === 'custom'} onClick={() => pickBackground('custom')}
          title="Custom" subtitle="Build your own" />
      </div>

      {bg?.custom && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="cc-bgname">Background name</Label>
            <input id="cc-bgname" value={draft.customBackground} onChange={e => update({ customBackground: e.target.value })} className={inputClass(accent)} />
          </div>
          <div>
            <SectionTitle hint={`${draft.customBackgroundSkills.length} / 2`}>Skills</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SKILLS.map(skill => (
                <Chip key={skill} accent={accent} selected={draft.customBackgroundSkills.includes(skill)}
                  disabled={!draft.customBackgroundSkills.includes(skill) && draft.customBackgroundSkills.length >= 2}
                  onClick={() => update({ customBackgroundSkills: toggleIn(draft.customBackgroundSkills, skill, 2) })}>{skill}</Chip>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Origin feat</SectionTitle>
            <select aria-label="Origin feat" value={draft.customBackgroundFeat} onChange={e => update({ customBackgroundFeat: e.target.value })} className={inputClass(accent)}>
              <option value="">— Choose —</option>
              {ORIGIN_FEATS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <SectionTitle hint={`${draft.customBackgroundAbilities.length} / 3`}>Abilities it can raise</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {STATS.map(s => (
                <Chip key={s} accent={accent} selected={draft.customBackgroundAbilities.includes(s)}
                  disabled={!draft.customBackgroundAbilities.includes(s) && draft.customBackgroundAbilities.length >= 3}
                  onClick={() => update({ customBackgroundAbilities: toggleIn(draft.customBackgroundAbilities, s, 3), bonusPlus2: '', bonusPlus1: '' })}>{ABILITY_LABELS[s]}</Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {bg && !bg.custom && (
        <div className="bg-stone-800/50 rounded-lg p-3 space-y-1">
          <InfoRow label="Skills">{bg.skills.join(', ')}</InfoRow>
          <InfoRow label="Tool">{bg.tool}</InfoRow>
          <InfoRow label="Origin Feat">{bg.feat}</InfoRow>
          {feat && <p className="text-xs text-stone-400 pl-[6.5rem]">{feat.description}</p>}
          <InfoRow label="Equipment">{bg.equipment} — or 50 GP</InfoRow>
        </div>
      )}

      {bg && allowed.length === 3 && (
        <div>
          <SectionTitle>Ability Score Increases</SectionTitle>
          <div className="flex gap-2 mb-2">
            {[['2-1', '+2 / +1'], ['1-1-1', '+1 / +1 / +1']].map(([mode, label]) => (
              <Chip key={mode} accent={accent} selected={draft.bonusMode === mode} onClick={() => update({ bonusMode: mode })}>{label}</Chip>
            ))}
          </div>
          {draft.bonusMode === '2-1' ? (
            <div className="grid grid-cols-2 gap-3">
              {[['bonusPlus2', '+2 to'], ['bonusPlus1', '+1 to']].map(([field, label]) => (
                <div key={field}>
                  <Label htmlFor={`cc-${field}`}>{label}</Label>
                  <select id={`cc-${field}`} value={draft[field]} onChange={e => update({ [field]: e.target.value })} className={inputClass(accent)}>
                    <option value="">— Choose —</option>
                    {allowed.map(s => (
                      <option key={s} value={s} disabled={(field === 'bonusPlus2' ? draft.bonusPlus1 : draft.bonusPlus2) === s}>{ABILITY_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400">+1 to {allowed.map(s => ABILITY_LABELS[s]).join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Species ────────────────────────────────────────────────────────

export function SpeciesStep({ draft, update, accent }) {
  const info = getSpeciesInfo(draft);
  const sp = info?.species;
  const owned = new Set([...(getBackground(draft)?.skills || []), ...draft.classSkills]);
  const level = getDraftTotalLevel(draft);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {SPECIES.map(s => (
          <ChoiceCard key={s.name} accent={accent} selected={draft.species === s.name}
            onClick={() => update({ species: s.name, lineage: '', size: '', speciesSkill: '', speciesFeat: '' })}
            title={s.name} subtitle={`${s.size.replace('Medium or Small', 'Med/Small')} · ${s.speed} ft`} />
        ))}
      </div>

      {sp && (
        <>
          <div className="bg-stone-800/50 rounded-lg p-3 space-y-1">
            <InfoRow label="Size">{sp.size}</InfoRow>
            <InfoRow label="Speed">{info.speed} ft</InfoRow>
            <InfoRow label="Darkvision">{info.darkvision ? `${info.darkvision} ft` : '—'}</InfoRow>
          </div>

          {sp.size.includes(' or ') && (
            <div className="w-48">
              <Label htmlFor="cc-size">Size</Label>
              <select id="cc-size" value={draft.size || 'Medium'} onChange={e => update({ size: e.target.value })} className={inputClass(accent)}>
                <option>Medium</option><option>Small</option>
              </select>
            </div>
          )}

          {sp.lineages && (
            <div>
              <SectionTitle>{sp.lineageLabel}</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sp.lineages.map(l => (
                  <ChoiceCard key={l.name} accent={accent} selected={draft.lineage === l.name} onClick={() => update({ lineage: l.name })}
                    title={l.name} subtitle={l.note} />
                ))}
              </div>
            </div>
          )}

          {sp.skillChoice && (
            <div>
              <SectionTitle>{sp.skillChoice.label}: one skill</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {(sp.skillChoice.options || ALL_SKILLS).map(skill => (
                  <Chip key={skill} accent={accent} selected={draft.speciesSkill === skill}
                    disabled={owned.has(skill) && draft.speciesSkill !== skill} note={owned.has(skill) ? 'have' : null}
                    onClick={() => update({ speciesSkill: draft.speciesSkill === skill ? '' : skill })}>{skill}</Chip>
                ))}
              </div>
            </div>
          )}

          {sp.originFeat && (
            <div>
              <SectionTitle>Versatile: Origin feat</SectionTitle>
              <select aria-label="Species origin feat" value={draft.speciesFeat} onChange={e => update({ speciesFeat: e.target.value })} className={inputClass(accent)}>
                <option value="">— Choose —</option>
                {ORIGIN_FEATS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>
              {draft.speciesFeat && <p className="text-xs text-stone-400 mt-1">{getFeat(draft.speciesFeat)?.description}</p>}
            </div>
          )}

          <div>
            <SectionTitle>Traits</SectionTitle>
            <ul className="space-y-1.5">
              {sp.traits.map(t => (
                <li key={t.name} className={`text-xs ${t.level > level ? 'opacity-50' : ''}`}>
                  <span className="text-stone-200 font-medium">{t.name}</span>
                  {t.level && <span className="text-stone-500"> (level {t.level})</span>}
                  <span className="text-stone-400"> — {t.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Abilities ──────────────────────────────────────────────────────

export function AbilitiesStep({ draft, update, accent }) {
  const bonuses = getBackgroundBonuses(draft);
  const finals = getFinalScores(draft);
  const scores = draft.baseScores;
  const rules = getClassRules(draft.className);
  const setScore = (stat, value) => update({ baseScores: { ...scores, [stat]: value } });
  const setMethod = (method) => update({ abilityMethod: method, baseScores: defaultScoresFor(method) });
  const spent = pointBuySpent(scores);

  const usedStandard = (stat) => STATS.filter(s => s !== stat).map(s => parseInt(scores[s]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[['standard', 'Standard Array'], ['pointbuy', 'Point Buy'], ['manual', 'Manual / Rolled']].map(([m, label]) => (
          <Chip key={m} accent={accent} selected={draft.abilityMethod === m} onClick={() => setMethod(m)}>{label}</Chip>
        ))}
      </div>
      {rules?.primaryAbility && <p className="text-xs text-stone-400">{rules.name} primary ability: <span className="text-stone-200">{rules.primaryAbility}</span></p>}
      {draft.abilityMethod === 'pointbuy' && (
        <p className={`text-xs ${spent > POINT_BUY_BUDGET ? 'text-red-400' : 'text-stone-400'}`}>Points spent: {spent} / {POINT_BUY_BUDGET}</p>
      )}
      {draft.abilityMethod === 'manual' && (
        <button type="button" onClick={() => update({ baseScores: Object.fromEntries(STATS.map(s => [s, roll4d6DropLowest()])) })}
          className="text-xs px-3 py-1.5 rounded bg-stone-700 hover:bg-stone-600">🎲 Roll 4d6 (drop lowest) for all</button>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-stone-500 text-left">
            <th className="font-normal py-1">Ability</th><th className="font-normal">Base</th>
            <th className="font-normal text-center">Bonus</th><th className="font-normal text-center">Total</th><th className="font-normal text-center">Mod</th>
          </tr>
        </thead>
        <tbody>
          {STATS.map(stat => (
            <tr key={stat} className="border-t border-stone-800">
              <td className="py-1.5 text-stone-300">{ABILITY_LABELS[stat]}</td>
              <td className="py-1.5 w-36">
                {draft.abilityMethod === 'standard' && (
                  <select aria-label={`${ABILITY_LABELS[stat]} score`} value={scores[stat]} onChange={e => setScore(stat, e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm w-24">
                    <option value="">—</option>
                    {STANDARD_ARRAY.map((v, i) => (
                      <option key={i} value={v} disabled={usedStandard(stat).includes(v)}>{v}</option>
                    ))}
                  </select>
                )}
                {draft.abilityMethod === 'pointbuy' && (
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={`Decrease ${ABILITY_LABELS[stat]}`} disabled={scores[stat] <= POINT_BUY_MIN}
                      onClick={() => setScore(stat, scores[stat] - 1)} className="w-6 h-6 rounded bg-stone-700 disabled:opacity-30">−</button>
                    <span className="w-6 text-center">{scores[stat]}</span>
                    <button type="button" aria-label={`Increase ${ABILITY_LABELS[stat]}`}
                      disabled={scores[stat] >= POINT_BUY_MAX || spent + POINT_BUY_COSTS[scores[stat] + 1] - POINT_BUY_COSTS[scores[stat]] > POINT_BUY_BUDGET}
                      onClick={() => setScore(stat, scores[stat] + 1)} className="w-6 h-6 rounded bg-stone-700 disabled:opacity-30">+</button>
                  </div>
                )}
                {draft.abilityMethod === 'manual' && (
                  <input aria-label={`${ABILITY_LABELS[stat]} score`} type="number" min="1" max="30" value={scores[stat]}
                    onChange={e => setScore(stat, e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm w-20" />
                )}
              </td>
              <td className="text-center text-stone-400">{bonuses[stat] ? `+${bonuses[stat]}` : '—'}</td>
              <td className="text-center font-semibold">{finals[stat]}</td>
              <td className="text-center text-stone-300">{formatMod(getModNum(finals[stat]))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {Object.keys(bonuses).length === 0 && <p className="text-xs text-stone-500">Background ability increases appear here once chosen on the Background step.</p>}
    </div>
  );
}

// ─── Equipment ──────────────────────────────────────────────────────

const ItemsLine = ({ items, gold }) => (
  <span>{[...items, ...(gold ? [`${gold} GP`] : [])].join(', ') || '—'}</span>
);

export function EquipmentStep({ draft, update, accent, preview }) {
  const rules = getClassRules(draft.className);
  const bg = getBackground(draft);
  const { classOption, bgOption } = getEquipmentChoice(draft);

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>{rules ? `${rules.name} starting equipment` : 'Class equipment'}</SectionTitle>
        {rules ? (
          <div className="space-y-2">
            {rules.equipment.map(opt => (
              <button key={opt.key} type="button" aria-pressed={draft.classEquipment === opt.key} onClick={() => update({ classEquipment: opt.key })}
                className={`w-full text-left p-3 rounded-lg border text-xs ${draft.classEquipment === opt.key ? accent.cardOn : 'border-stone-700 bg-stone-800/60 hover:border-stone-500'}`}>
                <span className="font-semibold mr-2">Option {opt.key}</span><ItemsLine {...opt} />
              </button>
            ))}
          </div>
        ) : <p className="text-xs text-stone-500">Custom roles have no class package — add gear on the sheet&apos;s Inventory tab.</p>}
      </div>

      <div>
        <SectionTitle>{bg ? `${bg.name} background equipment` : 'Background equipment'}</SectionTitle>
        {bg?.equipment ? (
          <div className="space-y-2">
            {[['A', bg.equipment], ['gold', '50 GP']].map(([key, label]) => (
              <button key={key} type="button" aria-pressed={draft.backgroundEquipment === key} onClick={() => update({ backgroundEquipment: key })}
                className={`w-full text-left p-3 rounded-lg border text-xs ${draft.backgroundEquipment === key ? accent.cardOn : 'border-stone-700 bg-stone-800/60 hover:border-stone-500'}`}>
                <span className="font-semibold mr-2">{key === 'gold' ? 'Option B' : 'Option A'}</span>{label}
              </button>
            ))}
          </div>
        ) : <p className="text-xs text-stone-500">{bg ? 'Custom backgrounds have no package.' : 'Choose a background first.'}</p>}
      </div>

      <div className="bg-stone-800/50 rounded-lg p-3">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-stone-400">Starting inventory ({preview.inventory.length} items)</span>
          <span className="text-stone-300">AC <span className="font-bold text-stone-100">{preview.ac}</span>{preview.acEffect === 'unarmoredDefense' ? ' (Unarmored Defense)' : ''}</span>
        </div>
        <ul className="text-xs text-stone-300 grid grid-cols-2 gap-x-4 gap-y-0.5">
          {preview.inventory.map(i => (
            <li key={i.id}>{i.quantity > 1 ? `${i.quantity}× ` : ''}{i.name}{i.itemType === 'armor' && i.equipped ? ' (worn)' : ''}</li>
          ))}
        </ul>
        {!classOption && !bgOption && <p className="text-xs text-stone-500">Nothing yet.</p>}
      </div>
    </div>
  );
}

// ─── Spells ─────────────────────────────────────────────────────────

export function SpellsStep({ draft, update, accent, spellLibrary }) {
  const casters = getDraftClasses(draft)
    .map(cls => ({ cls, limits: getSpellcastingLimits(cls) }))
    .filter(c => c.limits);
  const [activeName, setActiveName] = useState(casters[0]?.cls.name || '');
  const [levelFilter, setLevelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const active = casters.find(c => c.cls.name === activeName) || casters[0];

  if (!active) return <p className="text-sm text-stone-400">None of your classes cast spells.</p>;
  const { cls, limits } = active;
  const picks = draft.spellPicks[cls.name] || [];
  const pickedIds = new Set(picks.map(sp => sp.id));
  const cantripCount = picks.filter(sp => sp.level === 0).length;
  const spellCount = picks.length - cantripCount;

  const available = (spellLibrary.spells || [])
    .filter(sp => sp.classes?.includes(limits.list) && sp.level <= limits.maxSpellLevel && (limits.cantrips > 0 || sp.level > 0))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const shown = available.filter(sp =>
    (levelFilter === 'all' || sp.level === levelFilter) &&
    (!search || sp.name.toLowerCase().includes(search.toLowerCase())));
  const levels = [...new Set(available.map(sp => sp.level))];

  const toggle = (spell) => update({
    spellPicks: { ...draft.spellPicks, [cls.name]: pickedIds.has(spell.id) ? picks.filter(sp => sp.id !== spell.id) : [...picks, spell] },
  });
  const countClass = (n, max) => (n === max ? 'text-emerald-400' : n > max ? 'text-red-400' : 'text-amber-400');

  return (
    <div className="space-y-4">
      {casters.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Spellcasting classes">
          {casters.map(c => (
            <Chip key={c.cls.name} accent={accent} selected={c.cls.name === cls.name}
              onClick={() => { setActiveName(c.cls.name); setLevelFilter('all'); }}>{c.cls.name} {c.cls.level}</Chip>
          ))}
        </div>
      )}

      <div className="bg-stone-800/50 rounded-lg p-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span className="text-stone-300 font-medium">{cls.name} {cls.level}{cls.subclass ? ` (${cls.subclass})` : ''}</span>
        {limits.list !== cls.name && <span className="text-stone-400">{limits.list} spell list</span>}
        {limits.cantrips > 0 && <span>Cantrips <span className={countClass(cantripCount, limits.cantrips)}>{cantripCount} / {limits.cantrips}</span></span>}
        {limits.prepared > 0 && <span>Prepared spells <span className={countClass(spellCount, limits.prepared)}>{spellCount} / {limits.prepared}</span></span>}
        <span className="text-stone-400">Up to {getLevelLabel(limits.maxSpellLevel)} level</span>
      </div>

      {picks.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Chosen spells">
          {picks.map(sp => (
            <Chip key={sp.id} accent={accent} selected onClick={() => toggle(sp)} note={sp.level === 0 ? 'cantrip' : getLevelLabel(sp.level)}>{sp.name} ×</Chip>
          ))}
        </div>
      )}

      {spellLibrary.status === 'loading' && <p className="text-xs text-stone-500 animate-pulse">Loading the spellbook…</p>}
      {spellLibrary.status === 'error' && <p className="text-xs text-red-400">Couldn&apos;t load the spellbook — add spells later on the sheet&apos;s Spells tab.</p>}
      {spellLibrary.status === 'ready' && available.length === 0 && (
        <p className="text-xs text-stone-400">The spellbook has no {limits.list} spells yet — add them on the Spellbook page or the sheet&apos;s Spells tab.</p>
      )}

      {available.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label="Search spells" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spells…"
              className={`${inputClass(accent)} max-w-xs`} />
            <Chip accent={accent} selected={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>All</Chip>
            {levels.map(l => (
              <Chip key={l} accent={accent} selected={levelFilter === l} onClick={() => setLevelFilter(l)}>{l === 0 ? 'Cantrips' : getLevelLabel(l)}</Chip>
            ))}
          </div>
          <ul className="grid sm:grid-cols-2 gap-1.5 max-h-[24rem] overflow-y-auto pr-1">
            {shown.map(sp => {
              const on = pickedIds.has(sp.id);
              return (
                <li key={sp.id}>
                  <button type="button" onClick={() => toggle(sp)} aria-pressed={on} title={sp.description}
                    className={`w-full text-left px-3 py-2 rounded border text-xs ${on ? accent.cardOn : 'border-stone-700 bg-stone-800/60 hover:border-stone-500'}`}>
                    <span className="font-medium text-sm text-stone-100">{sp.name}</span>
                    <span className="block text-stone-400">
                      {sp.level === 0 ? 'Cantrip' : `${getLevelLabel(sp.level)} level`} · {sp.school}
                      {sp.concentration ? ' · Conc.' : ''}{sp.ritual ? ' · Ritual' : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="text-xs text-stone-500">Chosen spells are added prepared. Spells from feats (Magic Initiate) and a wizard&apos;s extra spellbook spells can be added on the sheet.</p>
    </div>
  );
}

// ─── Resources ──────────────────────────────────────────────────────

export function ResourcesStep({ draft, update, accent }) {
  const rows = getResourceRows(draft);
  const defaultKeys = new Set(getResourceDefaults(draft).map(r => r.key));
  const edited = Object.keys(draft.resourceEdits).length > 0 || draft.customResources.length > 0;

  const edit = (row, patch) => {
    if (defaultKeys.has(row.key)) {
      update({ resourceEdits: { ...draft.resourceEdits, [row.key]: { ...(draft.resourceEdits[row.key] || {}), ...patch } } });
    } else {
      update({ customResources: draft.customResources.map(r => (r.key === row.key ? { ...r, ...patch } : r)) });
    }
  };
  const remove = (row) => {
    if (defaultKeys.has(row.key)) edit(row, { removed: !row.removed });
    else update({ customResources: draft.customResources.filter(r => r.key !== row.key) });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400">
        Limited-use features and spell slots from your classes, species, and feats. Defaults follow your class levels and
        ability scores; anything you edit here sticks, and everything stays editable on the sheet&apos;s Resources tab.
      </p>
      {rows.length === 0 && <p className="text-sm text-stone-500">No limited-use resources for these choices yet.</p>}
      <table className="w-full text-sm">
        {rows.length > 0 && (
          <thead>
            <tr className="text-xs text-stone-500 text-left">
              <th className="font-normal py-1">Resource</th><th className="font-normal w-20">Uses</th>
              <th className="font-normal hidden sm:table-cell">Recharge</th><th className="font-normal">Source</th><th />
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className={`border-t border-stone-800 ${row.removed ? 'opacity-40' : ''}`}>
              <td className="py-1.5 pr-2">
                <input aria-label="Resource name" value={row.name} disabled={row.removed} onChange={e => edit(row, { name: e.target.value })}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm" placeholder="Resource name" />
              </td>
              <td className="py-1.5 pr-2">
                <input aria-label={`${row.name || 'Resource'} uses`} type="number" min="0" value={row.max} disabled={row.removed}
                  onChange={e => edit(row, { max: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="w-16 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm" />
              </td>
              <td className="py-1.5 pr-2 text-xs text-stone-400 hidden sm:table-cell">{row.recharge || '—'}</td>
              <td className="py-1.5 pr-2 text-xs text-stone-500">{row.source}</td>
              <td className="py-1.5 text-right">
                <button type="button" onClick={() => remove(row)} className="text-xs text-stone-400 hover:text-stone-200"
                  aria-label={`${row.removed ? 'Restore' : 'Remove'} ${row.name || 'resource'}`}>{row.removed ? 'Restore' : 'Remove'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <button type="button" onClick={() => update({ customResources: [...draft.customResources, { key: generateId('custom-resource'), name: '', max: 1 }] })}
          className="px-3 py-1.5 rounded text-xs bg-stone-700 hover:bg-stone-600">+ Add resource</button>
        {edited && (
          <button type="button" onClick={() => update({ resourceEdits: {}, customResources: [] })}
            className="px-3 py-1.5 rounded text-xs bg-stone-800 hover:bg-stone-700 text-stone-300">Reset to defaults</button>
        )}
      </div>
    </div>
  );
}

// ─── Details ────────────────────────────────────────────────────────

export function DetailsStep({ draft, update, accent }) {
  const textField = (field, label, placeholder) => (
    <div>
      <Label htmlFor={`cc-${field}`}>{label}</Label>
      <textarea id={`cc-${field}`} rows={2} value={draft[field]} onChange={e => update({ [field]: e.target.value })}
        className={`${inputClass(accent)} resize-none`} placeholder={placeholder} />
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="w-56">
        <Label htmlFor="cc-alignment">Alignment</Label>
        <select id="cc-alignment" value={draft.alignment} onChange={e => update({ alignment: e.target.value })} className={inputClass(accent)}>
          <option value="">—</option>
          {ALIGNMENTS.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <SectionTitle hint={`Common + ${draft.languages.length} / ${BONUS_LANGUAGE_COUNT}`}>Languages</SectionTitle>
        {[['Standard', STANDARD_LANGUAGES], ['Rare (DM approval)', RARE_LANGUAGES]].map(([group, langs]) => (
          <div key={group} className="mb-2">
            <div className="text-[10px] uppercase tracking-wide text-stone-500 mb-1">{group}</div>
            <div className="flex flex-wrap gap-1.5">
              {langs.map(l => (
                <Chip key={l} accent={accent} selected={draft.languages.includes(l)}
                  disabled={!draft.languages.includes(l) && draft.languages.length >= BONUS_LANGUAGE_COUNT}
                  onClick={() => update({ languages: toggleIn(draft.languages, l, BONUS_LANGUAGE_COUNT) })}>{l}</Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {textField('personality', 'Personality Traits', 'Speaks in proverbs…')}
        {textField('ideals', 'Ideals', 'Honor above all…')}
        {textField('bonds', 'Bonds', 'Owes a debt to…')}
        {textField('flaws', 'Flaws', 'Can\'t resist a wager…')}
      </div>
      {textField('notes', 'Notes', 'Appearance, role, connections…')}
    </div>
  );
}

// ─── Review ─────────────────────────────────────────────────────────

export function ReviewStep({ draft, update, accent, preview, issues, goTo }) {
  const fixedHp = getFixedHp(draft);
  const outstanding = Object.entries(issues).filter(([id]) => id !== 'review').flatMap(([id, list]) => list.map(i => ({ ...i, step: id })));
  const skills = getSkillProficiencies(draft);
  const sub = preview.classes?.[0]?.subclass;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold">{preview.name || 'Unnamed'}</h3>
        <p className="text-sm text-stone-400">
          Level {preview.level} {preview.race} {preview.classes?.length > 1 ? preview.classes.map(c => `${c.name} ${c.level}`).join(' / ') : preview.class}{sub ? ` (${sub})` : ''}{preview.background ? ` · ${preview.background}` : ''}{preview.alignment ? ` · ${preview.alignment}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[['AC', preview.ac], ['HP', preview.maxHp], ['Speed', `${preview.speed} ft`], ['Initiative', formatMod(getModNum(preview.dex))]].map(([label, v]) => (
          <div key={label} className="bg-stone-800 rounded-lg py-2"><div className="text-[10px] uppercase text-stone-500">{label}</div><div className="text-lg font-bold">{v}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-2 text-center">
        {STATS.map(s => (
          <div key={s} className="bg-stone-800/60 rounded py-1.5">
            <div className="text-[10px] uppercase text-stone-500">{s}</div>
            <div className="font-semibold">{preview[s]}</div>
            <div className="text-xs text-stone-400">{formatMod(getModNum(preview[s]))}</div>
          </div>
        ))}
      </div>

      <div className="bg-stone-800/50 rounded-lg p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-stone-400">Hit points:</span>
          {[['fixed', `Fixed average (${fixedHp}, d${getHitDie(draft)})`], ['manual', 'Manual']].map(([m, label]) => (
            <Chip key={m} accent={accent} selected={draft.hpMethod === m} onClick={() => update({ hpMethod: m })}>{label}</Chip>
          ))}
          {draft.hpMethod === 'manual' && (
            <input aria-label="Manual max HP" type="number" min="1" value={draft.manualHp} onChange={e => update({ manualHp: e.target.value })}
              className="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm w-20" />
          )}
        </div>
        <InfoRow label="Saves">{Object.keys(preview.saveProficiencies).map(s => ABILITY_LABELS[s]).join(', ') || '—'}</InfoRow>
        <InfoRow label="Skills">{skills.join(', ') || '—'}</InfoRow>
        <InfoRow label="Languages">{preview.languages}</InfoRow>
        <InfoRow label="Senses / traits">{preview.advantages.join(', ') || '—'}</InfoRow>
        <InfoRow label="Feats & traits">{preview.features.map(f => f.name).join(', ') || '—'}</InfoRow>
        <InfoRow label="Spellcasting">{preview.spellStat ? ABILITY_LABELS[preview.spellStat] : '—'}</InfoRow>
        <InfoRow label="Spells">{preview.spells.map(sp => sp.name).join(', ') || '—'}</InfoRow>
        <InfoRow label="Resources">{preview.resources.map(r => `${r.name} ×${r.max}`).join(', ') || '—'}</InfoRow>
        <InfoRow label="Inventory">{preview.inventory.map(i => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name)).join(', ') || '—'}</InfoRow>
      </div>

      {outstanding.length > 0 ? (
        <div className="border border-amber-800/50 bg-amber-950/20 rounded-lg p-3">
          <div className="text-xs font-semibold text-amber-300 mb-1">Still open ({outstanding.length}) — you can create anyway and finish on the sheet</div>
          <ul className="space-y-0.5">
            {outstanding.map((i, n) => (
              <li key={n} className="text-xs text-stone-300 flex justify-between gap-2">
                <span className={i.blocking ? 'text-red-400' : ''}>{i.message}</span>
                <button type="button" onClick={() => goTo(i.step)} className="text-amber-400 hover:underline shrink-0">Go to {i.step}</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-emerald-400">Every step is complete.</p>
      )}
    </div>
  );
}

export const STEP_COMPONENTS = {
  basics: BasicsStep,
  class: ClassStep,
  spells: SpellsStep,
  resources: ResourcesStep,
  background: BackgroundStep,
  species: SpeciesStep,
  abilities: AbilitiesStep,
  equipment: EquipmentStep,
  details: DetailsStep,
  review: ReviewStep,
};
