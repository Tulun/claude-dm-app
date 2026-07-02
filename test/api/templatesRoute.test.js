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
  it('seeds data/templates.json with the defaults (version 12) when no file exists and tags mm- ids with source', async () => {
    const res = await route.GET(getRequest());
    expect(res.status).toBe(200);
    const templates = await res.json();
    expect(templates).toHaveLength(defaultEnemyTemplates.length);
    // All default ids start with mm- so they are tagged source 'mm'
    expect(templates.every(t => t.source === 'mm')).toBe(true);

    const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
    expect(onDisk._version).toBe(12);
    expect(onDisk.templates).toHaveLength(defaultEnemyTemplates.length);
    // NOTE: the source tag is applied on read, not persisted to disk
    expect(onDisk.templates[0].source).toBeUndefined();
  });

  it('returns saved templates as-is when the file is at the current version', async () => {
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({
      _version: 12,
      templates: [customTemplate],
    }));
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toEqual([{ ...customTemplate, source: 'custom' }]);
  });

  it('migrates an old-version file: custom templates kept, but QUIRK — user edits to mm- templates are discarded and replaced by defaults', async () => {
    const editedMm = { ...defaultEnemyTemplates[0], name: 'USER RENAMED', maxHp: 999 };
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({
      _version: 3,
      templates: [editedMm, customTemplate],
    }));

    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toHaveLength(defaultEnemyTemplates.length + 1);

    // The edited mm- template was replaced by the pristine default
    const migrated = templates.find(t => t.id === defaultEnemyTemplates[0].id);
    expect(migrated.name).toBe(defaultEnemyTemplates[0].name);
    expect(migrated.maxHp).toBe(defaultEnemyTemplates[0].maxHp);

    // The custom template survived
    expect(templates.find(t => t.id === 'custom-test-ogre')).toMatchObject(customTemplate);

    const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
    expect(onDisk._version).toBe(12);
  });

  it('migrates a legacy bare-array file (no _version wrapper)', async () => {
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify([customTemplate]));
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toHaveLength(defaultEnemyTemplates.length + 1);
    const onDisk = JSON.parse(fs.readFileSync(TEMPLATES_FILE(), 'utf8'));
    expect(onDisk._version).toBe(12);
  });

  it('QUIRK: a current-version file whose first template lacks a size field is force-migrated (defaults merged back in)', async () => {
    const sizeless = { id: 'custom-no-size', name: 'No Size', ac: 10, maxHp: 5 };
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({
      _version: 12,
      templates: [sizeless],
    }));
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toHaveLength(defaultEnemyTemplates.length + 1);
  });

  it('filters by source=mm and source=custom', async () => {
    fs.writeFileSync(TEMPLATES_FILE(), JSON.stringify({
      _version: 12,
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
    expect(onDisk).toEqual({ _version: 12, templates: body });

    // Round-trip: GET returns the posted list (source-tagged)
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toEqual([{ ...customTemplate, source: 'custom' }]);
  });

  it('QUIRK: POSTing a list whose first template lacks size triggers the upgrade heuristic — the next GET merges the defaults back in', async () => {
    await route.POST(postRequest([{ id: 'custom-no-size', name: 'No Size', ac: 10 }]));
    const templates = await (await route.GET(getRequest())).json();
    expect(templates).toHaveLength(defaultEnemyTemplates.length + 1);
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
