// @vitest-environment node
//
// Characterization tests for /api/magic-items (app/api/magic-items/route.js).
//
// process.cwd() is mocked to a temp dir before the route module is imported;
// the real data/ directory is never touched.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defaultMagicItems } from '../../app/magic-items/magicItems.js';

let tmpDir;
let dataDir;
let cwdSpy;
let route;

const ITEMS_FILE = () => path.join(dataDir, 'magic-items.json');

const postRequest = (body) =>
  new Request('http://localhost/api/magic-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const deleteRequest = (query = '') =>
  new Request(`http://localhost/api/magic-items${query}`, { method: 'DELETE' });

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-app-items-test-'));
  dataDir = path.join(tmpDir, 'data');
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  route = await import('../../app/api/magic-items/route.js');
});

afterAll(() => {
  cwdSpy.mockRestore();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });
});

describe('GET /api/magic-items', () => {
  it('seeds data/magic-items.json with all defaults (version 3) when no file exists', async () => {
    const res = await route.GET();
    expect(res.status).toBe(200);
    const items = await res.json();
    expect(items).toHaveLength(defaultMagicItems.length);

    const onDisk = JSON.parse(fs.readFileSync(ITEMS_FILE(), 'utf8'));
    expect(onDisk.version).toBe(3);
    expect(onDisk.items).toHaveLength(defaultMagicItems.length);
  });

  it('returns items sorted by name', async () => {
    fs.writeFileSync(ITEMS_FILE(), JSON.stringify({
      version: 3,
      items: [
        { id: 'i2', name: 'Zulu Blade' },
        { id: 'i1', name: 'Alpha Ring' },
        { id: 'i3', name: 'Mid Cloak' },
      ],
    }));
    const items = await (await route.GET()).json();
    expect(items.map(i => i.id)).toEqual(['i1', 'i3', 'i2']);
  });

  it('migrates an old-version file: user edits win over defaults, missing fields backfilled, new defaults added', async () => {
    const def = defaultMagicItems.find(i => i.id === 'potion-healing');
    // User renamed the item and has no description field saved
    const edited = { id: 'potion-healing', name: 'RENAMED Potion', category: 'Potion' };
    const custom = { id: 'custom-blade-1', name: 'Blade of Testing', rarity: 'Artifact' };
    fs.writeFileSync(ITEMS_FILE(), JSON.stringify({ version: 2, items: [edited, custom] }));

    const items = await (await route.GET()).json();
    expect(items).toHaveLength(defaultMagicItems.length + 1);

    const migrated = items.find(i => i.id === 'potion-healing');
    expect(migrated.name).toBe('RENAMED Potion');       // user edit preserved
    expect(migrated.description).toBe(def.description); // missing field backfilled from default
    expect(migrated.rarity).toBe(def.rarity);

    expect(items.find(i => i.id === 'custom-blade-1')).toEqual(custom);

    const onDisk = JSON.parse(fs.readFileSync(ITEMS_FILE(), 'utf8'));
    expect(onDisk.version).toBe(3);
  });

  it('a file with no version field is migrated the same way', async () => {
    fs.writeFileSync(ITEMS_FILE(), JSON.stringify({ items: [{ id: 'custom-x', name: 'X' }] }));
    const items = await (await route.GET()).json();
    expect(items).toHaveLength(defaultMagicItems.length + 1);
  });

  it('QUIRK: a corrupt magic-items.json is silently overwritten with the defaults (user data lost)', async () => {
    fs.writeFileSync(ITEMS_FILE(), 'garbage[[');
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(defaultMagicItems.length);
    const onDisk = JSON.parse(fs.readFileSync(ITEMS_FILE(), 'utf8'));
    expect(onDisk.version).toBe(3);
  });
});

describe('POST /api/magic-items', () => {
  it('adds a new item, generating a custom- id, and round-trips via GET', async () => {
    fs.writeFileSync(ITEMS_FILE(), JSON.stringify({ version: 3, items: [] }));
    const res = await route.POST(postRequest({ name: 'Orb of Testing', rarity: 'Rare' }));
    const saved = await res.json();
    expect(saved.id).toMatch(/^custom-orb-of-testing-\d+$/);

    const items = await (await route.GET()).json();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(saved);
  });

  it('updates an existing item in place by id', async () => {
    fs.writeFileSync(ITEMS_FILE(), JSON.stringify({
      version: 3,
      items: [{ id: 'custom-a', name: 'Amulet', rarity: 'Common' }],
    }));
    await route.POST(postRequest({ id: 'custom-a', name: 'Amulet', rarity: 'Legendary' }));
    const onDisk = JSON.parse(fs.readFileSync(ITEMS_FILE(), 'utf8'));
    expect(onDisk.items).toHaveLength(1);
    expect(onDisk.items[0].rarity).toBe('Legendary');
  });

  it('returns 500 on a malformed body', async () => {
    const res = await route.POST(new Request('http://localhost/api/magic-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{{{',
    }));
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/magic-items', () => {
  it('requires an id (400)', async () => {
    const res = await route.DELETE(deleteRequest());
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown id', async () => {
    fs.writeFileSync(ITEMS_FILE(), JSON.stringify({ version: 3, items: [] }));
    const res = await route.DELETE(deleteRequest('?id=missing'));
    expect(res.status).toBe(404);
  });

  it('deletes an item and persists the removal', async () => {
    fs.writeFileSync(ITEMS_FILE(), JSON.stringify({
      version: 3,
      items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
    }));
    const res = await route.DELETE(deleteRequest('?id=a'));
    expect(await res.json()).toEqual({ success: true });
    const items = await (await route.GET()).json();
    expect(items.map(i => i.id)).toEqual(['b']);
  });
});
