// @vitest-environment node
//
// Characterization tests for /api/templates (app/api/templates/route.js).
//
// process.cwd() is mocked to a temp dir before importing; the real data/ and
// public/ directories are never touched. The route caches conflux data in a
// module-level variable, so the conflux tests use vi.resetModules() + a fresh
// dynamic import to control cache state per test.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defaultEnemyTemplates } from '../../app/components/defaultData.js';
import { RETIRED_DEFAULT_IDS } from '../../app/data/retiredTemplates.js';
import { PRIOR_DEFAULT_FINGERPRINTS } from '../../app/data/templateFingerprints.js';

let tmpDir;
let dataDir;
let publicDataDir;
let cwdSpy;
let route; // shared instance for non-conflux tests

const TEMPLATES_FILE = () => path.join(dataDir, 'templates.json');
const CONFLUX_FILE = () => path.join(publicDataDir, 'conflux-creatures.json');

const getRequest = (query = '') =>
  new Request(`http://localhost/api/templates${query}`);

const postRequest = (body) =>
  new Request('http://localhost/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// Fresh module instance (fresh confluxCache)
async function freshRoute() {
  vi.resetModules();
  return import('../../app/api/templates/route.js');
}

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-app-templates-test-'));
  dataDir = path.join(tmpDir, 'data');
  publicDataDir = path.join(tmpDir, 'public', 'data');
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  route = await import('../../app/api/templates/route.js');
});

afterAll(() => {
  cwdSpy.mockRestore();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });
  fs.rmSync(path.join(tmpDir, 'public'), { recursive: true, force: true });
});

// A template shaped so the "needsUpgrade" heuristic (first template must have
// a size field) does NOT fire.
const customTemplate = {
  id: 'custom-test-ogre', name: 'Test Ogre', size: 'Large', creatureType: 'Giant',
  ac: 11, maxHp: 59, cr: '2',
};

describe('GET /api/templates', () => {
  it('seeds data/templates.json with the defaults (version 14) when no file exists and tags mm- ids with source', async () => {
    const res = await route.GET(getRequest());
    expect(res.status).toBe(200);
    const templates = await res.json();
    expect(templates).toHaveLength(defaultEnemyTemplates.length);
    // All default ids start with mm- so they are tagged source 'mm'
    expect(templates.every(t => t.source === 'mm')).toBe(true);

    const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
    expect(onDisk._version).toBe(14);
    expect(onDisk.templates).toHaveLength(defaultEnemyTemplates.length);
    // NOTE: the source tag is applied on read, not persisted to disk
    expect(onDisk.templates[0].source).toBeUndefined();
  });

  it('returns saved templates as-is when the file is at the current version', async () => {
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({
      _version: 14,
      templates: [customTemplate],
    }));
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toEqual([{ ...customTemplate, source: 'custom' }]);
  });

  it('migrates an old-version file: custom templates kept and user edits to mm- templates preserved', async () => {
    const editedMm = { ...defaultEnemyTemplates[0], name: 'USER RENAMED', maxHp: 999 };
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({
      _version: 3,
      templates: [editedMm, customTemplate],
    }));

    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toHaveLength(defaultEnemyTemplates.length + 1);

    // The edited mm- template keeps the user's changes (same merge strategy
    // as the spells/magic-items migrations)
    const migrated = templates.find(t => t.id === defaultEnemyTemplates[0].id);
    expect(migrated.name).toBe('USER RENAMED');
    expect(migrated.maxHp).toBe(999);

    // The custom template survived
    expect(templates.find(t => t.id === 'custom-test-ogre')).toMatchObject(customTemplate);

    const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
    expect(onDisk._version).toBe(14);
  });

  describe('v12 → v13: SRD 5.2.1 (2024) built-ins', () => {
    // Exactly as mm-hobgoblin-captain shipped in version 12 (2014 stats).
    const v12HobgoblinCaptain = {"id":"mm-hobgoblin-captain","name":"Hobgoblin Captain","size":"Medium","creatureType":"Humanoid","ac":17,"maxHp":39,"hitDice":"6d8+12","speed":30,"cr":"3","xp":700,"profBonus":2,"str":15,"dex":14,"con":14,"int":12,"wis":10,"cha":13,"savingThrows":"Con +4, Int +3","senses":"Darkvision 60 ft., Passive Perception 10","languages":"Common, Goblin","isNpc":false,"traits":[{"name":"Martial Advantage","description":"Once per turn, +10 (3d6) damage if ally within 5 ft of target."}],"actions":[{"name":"Multiattack","description":"Two Greatsword attacks."},{"name":"Greatsword","description":"Melee Attack Roll: +4, reach 5 ft. Hit: 9 (2d6+2) Slashing damage."},{"name":"Javelin","description":"Melee or Ranged Attack Roll: +4, reach 5 ft. or range 30/120 ft. Hit: 5 (1d6+2) Piercing damage."}],"notes":"Half Plate"};
    const new2024 = () => defaultEnemyTemplates.find(t => t.id === 'mm-hobgoblin-captain');

    const migrate = async (templates) => {
      fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({ _version: 12, templates }));
      return (await route.GET(getRequest())).json();
    };

    it('an untouched v12 built-in is replaced by its 2024 version', async () => {
      const templates = await migrate([v12HobgoblinCaptain]);
      const hc = templates.find(t => t.id === 'mm-hobgoblin-captain');
      expect(hc).toEqual({ ...new2024(), source: 'mm' });
      expect(hc.edition).toBe('2024');
      expect(hc.maxHp).toBe(58);
      expect(hc.actions.map(a => a.name)).toEqual(['Multiattack', 'Greatsword', 'Longbow']);
    });

    it('still counts as untouched after a client round-trip added source and reordered keys', async () => {
      const { id, ...rest } = v12HobgoblinCaptain;
      const roundTripped = { source: 'mm', ...Object.fromEntries(Object.entries(rest).reverse()), id };
      const templates = await migrate([roundTripped]);
      expect(templates.find(t => t.id === 'mm-hobgoblin-captain').edition).toBe('2024');
    });

    it('a user-edited v12 built-in is kept exactly as saved — no 2024 fields grafted on', async () => {
      const edited = { ...v12HobgoblinCaptain, maxHp: 45, notes: 'Our campaign version' };
      const templates = await migrate([edited]);
      const hc = templates.find(t => t.id === 'mm-hobgoblin-captain');
      expect(hc).toEqual({ ...edited, source: 'mm' });
      expect(hc.edition).toBeUndefined();
      expect(hc.initiativeBonus).toBeUndefined();

      const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
      expect(onDisk.templates.find(t => t.id === 'mm-hobgoblin-captain')).toEqual(edited);
    });

    it('adds the new 2024-only built-ins and keeps older built-ins that are not in the SRD', async () => {
      const templates = await migrate([v12HobgoblinCaptain, customTemplate]);
      const ids = new Set(templates.map(t => t.id));
      expect(ids.has('mm-goblin-warrior')).toBe(true);   // new 2024 name
      expect(ids.has('mm-goblin')).toBe(false);          // 2014 Goblin retired in v14 (renamed 2024 version is built in)
      expect(ids.has('mm-beholder')).toBe(true);         // not in SRD 5.2.1, unchanged
      expect(templates.find(t => t.id === 'custom-test-ogre')).toMatchObject(customTemplate);
      expect(templates).toHaveLength(defaultEnemyTemplates.length + 1);
    });
  });

  describe('v13 → v14: retired 2014 built-ins whose renamed 2024 version is built in', () => {
    // Exactly as mm-goblin shipped in versions 12 and 13 (2014 stats).
    const v13Goblin = {"id":"mm-goblin","name":"Goblin","size":"Small","creatureType":"Humanoid","ac":15,"maxHp":7,"hitDice":"2d6","speed":30,"cr":"1/4","xp":50,"profBonus":2,"str":8,"dex":14,"con":10,"int":10,"wis":8,"cha":8,"skills":"Stealth +6","senses":"Darkvision 60 ft., Passive Perception 9","languages":"Common, Goblin","isNpc":false,"traits":[{"name":"Nimble Escape","description":"Can Disengage or Hide as a Bonus Action."}],"actions":[{"name":"Scimitar","description":"Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6+2) Slashing damage."},{"name":"Shortbow","description":"Ranged Attack Roll: +4, range 80/320 ft. Hit: 5 (1d6+2) Piercing damage."}]};
    const migrate = async (templates) => {
      fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({ _version: 13, templates }));
      return (await route.GET(getRequest())).json();
    };

    it('every retired id is gone from the defaults, names its 2024 replacement, and has a fingerprint', () => {
      const defaultIds = new Set(defaultEnemyTemplates.map(t => t.id));
      for (const [oldId, newName] of Object.entries(RETIRED_DEFAULT_IDS)) {
        expect(defaultIds.has(oldId), oldId).toBe(false);
        expect(newName, oldId).toMatch(/\w/);
        expect(PRIOR_DEFAULT_FINGERPRINTS[oldId]?.length, oldId).toBeGreaterThan(0);
      }
    });

    it('a current-version file still holding a retired built-in is cleaned on load (stale-tab POST stamped the version)', async () => {
      fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({ _version: 14, templates: [v13Goblin, customTemplate] }));
      const templates = await (await route.GET(getRequest())).json();
      expect(templates.map(t => t.id)).toEqual(['custom-test-ogre']);
      const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
      expect(onDisk).toEqual({ _version: 14, templates: [customTemplate] });
    });

    it('POST drops an unedited retired built-in but keeps an edited one', async () => {
      const edited = { ...v13Goblin, id: 'mm-kobold', notes: 'edited' };
      await route.POST(postRequest([v13Goblin, edited, customTemplate]));
      const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
      expect(onDisk.templates.map(t => t.id)).toEqual(['mm-kobold', 'custom-test-ogre']);
    });

    it('an untouched retired built-in is removed from the saved file', async () => {
      const templates = await migrate([v13Goblin, { ...v13Goblin, id: 'tpl-my-goblin' }]);
      expect(templates.find(t => t.id === 'mm-goblin')).toBeUndefined();
      expect(templates.find(t => t.id === 'mm-goblin-warrior')).toBeDefined();
      expect(templates.find(t => t.id === 'tpl-my-goblin')).toBeDefined(); // custom copy untouched
      const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
      expect(onDisk.templates.some(t => t.id === 'mm-goblin')).toBe(false);
    });

    it('a user-edited retired built-in is kept exactly as saved', async () => {
      const edited = { ...v13Goblin, maxHp: 12, notes: 'Our goblins are tougher' };
      const templates = await migrate([edited]);
      expect(templates.find(t => t.id === 'mm-goblin')).toEqual({ ...edited, source: 'mm' });
    });
  });

  it('migrates a legacy bare-array file (no _version wrapper)', async () => {
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify([customTemplate]));
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toHaveLength(defaultEnemyTemplates.length + 1);
    const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
    expect(onDisk._version).toBe(14);
  });

  it('a current-version file is left alone even when templates lack a size field', async () => {
    const sizeless = { id: 'custom-no-size', name: 'No Size', ac: 10, maxHp: 5 };
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({
      _version: 14,
      templates: [sizeless],
    }));
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toEqual([{ ...sizeless, source: 'custom' }]);
  });

  it('filters by source=mm and source=custom', async () => {
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({
      _version: 14,
      templates: [
        { ...defaultEnemyTemplates[0] }, // mm- id, size present so no upgrade
        customTemplate,
      ],
    }));

    const mm = await (await route.GET(getRequest('?source=mm'))).json();
    expect(mm.map(t => t.id)).toEqual([defaultEnemyTemplates[0].id]);

    const custom = await (await route.GET(getRequest('?source=custom'))).json();
    expect(custom.map(t => t.id)).toEqual(['custom-test-ogre']);
  });

  it('returns 500 with an error message when templates.json is corrupt (file NOT overwritten)', async () => {
    fs.writeFileSync(TEMPLATES_FILE(), '{corrupt');
    const res = await route.GET(getRequest());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeTruthy();
    // Unlike the spells/magic-items/dm routes, corrupt data is left in place
    expect(fs.readFileSync(TEMPLATES_FILE(), 'utf8')).toBe('{corrupt');
  });
});

describe('GET /api/templates?source=conflux', () => {
  const fakeCreatures = [
    { id: 'conflux-1', name: 'Conflux Wisp', cr: '1' },
    { id: 'conflux-2', name: 'Conflux Beast', cr: '3' },
  ];

  it('returns [] when public/data/conflux-creatures.json is missing, and recovers once the file appears (failure is not cached)', async () => {
    const r = await freshRoute();

    const missing = await (await r.GET(getRequest('?source=conflux'))).json();
    expect(missing).toEqual([]);

    // Failure did not poison the cache: once the file exists, data is served
    fs.mkdirSync(publicDataDir, { recursive: true });
    fs.writeFileSync(CONFLUX_FILE(), JSON.stringify(fakeCreatures));
    const found = await (await r.GET(getRequest('?source=conflux'))).json();
    expect(found).toEqual(fakeCreatures);
  });

  it('caches conflux data in module memory: later file changes are not picked up', async () => {
    const r = await freshRoute();
    fs.mkdirSync(publicDataDir, { recursive: true });
    fs.writeFileSync(CONFLUX_FILE(), JSON.stringify(fakeCreatures));

    const first = await (await r.GET(getRequest('?source=conflux'))).json();
    expect(first).toEqual(fakeCreatures);

    fs.writeFileSync(CONFLUX_FILE(), JSON.stringify([{ id: 'changed', name: 'Changed' }]));
    const second = await (await r.GET(getRequest('?source=conflux'))).json();
    expect(second).toEqual(fakeCreatures); // still the cached copy

    // Deleting the file doesn't matter either
    fs.rmSync(CONFLUX_FILE());
    const third = await (await r.GET(getRequest('?source=conflux'))).json();
    expect(third).toEqual(fakeCreatures);
  });

  it('conflux creatures are excluded from the default (unfiltered) listing', async () => {
    const r = await freshRoute();
    fs.mkdirSync(publicDataDir, { recursive: true });
    fs.writeFileSync(CONFLUX_FILE(), JSON.stringify(fakeCreatures));

    const all = await (await r.GET(getRequest())).json();
    expect(all.find(t => t.id === 'conflux-1')).toBeUndefined();
    expect(all).toHaveLength(defaultEnemyTemplates.length); // seeded defaults only
  });
});

describe('POST /api/templates', () => {
  it('replaces the whole template list and stamps the current version', async () => {
    const body = [customTemplate];
    const res = await route.POST(postRequest(body));
    expect(await res.json()).toEqual({ success: true });

    const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
    expect(onDisk).toEqual({ _version: 14, templates: body });

    // Round-trip: GET returns the posted list (source-tagged)
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toEqual([{ ...customTemplate, source: 'custom' }]);
  });

  it('a POSTed list without size fields round-trips unchanged (no forced default merge)', async () => {
    await route.POST(postRequest([{ id: 'custom-no-size', name: 'No Size', ac: 10 }]));
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toEqual([{ id: 'custom-no-size', name: 'No Size', ac: 10, source: 'custom' }]);
  });

  it('returns 500 on a malformed body', async () => {
    const res = await route.POST(new Request('http://localhost/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'nope{',
    }));
    expect(res.status).toBe(500);
  });
});
