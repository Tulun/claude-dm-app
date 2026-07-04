// @vitest-environment node
//
// Tests for /api/vault (app/api/vault/route.js) — the read-only Obsidian
// vault bridge. A temp directory stands in for the vault via the
// OBSIDIAN_VAULT_PATH env var; nothing outside it is ever touched, and the
// route must never write anything at all.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let vaultDir;
let route;
const ORIGINAL_ENV = process.env.OBSIDIAN_VAULT_PATH;

const getRequest = (query = '') =>
  new Request(`http://localhost/api/vault${query}`);

const writeNote = (relPath, content) => {
  const abs = path.join(vaultDir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
};

beforeAll(async () => {
  vaultDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-app-vault-test-'));
  route = await import('../../app/api/vault/route.js');
});

afterAll(() => {
  fs.rmSync(vaultDir, { recursive: true, force: true });
  if (ORIGINAL_ENV === undefined) {
    delete process.env.OBSIDIAN_VAULT_PATH;
  } else {
    process.env.OBSIDIAN_VAULT_PATH = ORIGINAL_ENV;
  }
});

beforeEach(() => {
  fs.rmSync(vaultDir, { recursive: true, force: true });
  fs.mkdirSync(vaultDir, { recursive: true });
  process.env.OBSIDIAN_VAULT_PATH = vaultDir;
});

describe('GET /api/vault configuration', () => {
  it('returns configured: false with guidance when OBSIDIAN_VAULT_PATH is unset', async () => {
    delete process.env.OBSIDIAN_VAULT_PATH;
    const res = await route.GET(getRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configured).toBe(false);
    expect(body.error).toContain('OBSIDIAN_VAULT_PATH');
  });

  it('returns configured: false when the vault folder does not exist', async () => {
    process.env.OBSIDIAN_VAULT_PATH = path.join(vaultDir, 'nope');
    const res = await route.GET(getRequest());
    const body = await res.json();
    expect(body.configured).toBe(false);
    expect(body.error).toContain('not found');
  });
});

describe('GET /api/vault index', () => {
  it('lists every .md note with vault-relative path, top-level folder, and excerpt', async () => {
    writeNote('Overview.md', '# Title\n\nThe world of Gaia.\n');
    writeNote('NPCs/Delos/Marcus Voss.md', 'A grim harbormaster.\n');
    const res = await route.GET(getRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configured).toBe(true);
    expect(body.notes).toHaveLength(2);

    const marcus = body.notes.find(n => n.name === 'Marcus Voss');
    expect(marcus.path).toBe('NPCs/Delos/Marcus Voss.md');
    expect(marcus.folder).toBe('NPCs');
    expect(marcus.dir).toBe('NPCs/Delos');
    expect(marcus.excerpt).toBe('A grim harbormaster.');
    expect(typeof marcus.mtime).toBe('number');

    const overview = body.notes.find(n => n.name === 'Overview');
    expect(overview.folder).toBe('');
    expect(overview.excerpt).toBe('The world of Gaia.');
  });

  it('skips .obsidian, .trash, and non-markdown files', async () => {
    writeNote('Lore/Gods.md', 'Pantheon.\n');
    writeNote('.obsidian/workspace.md', 'obsidian internals');
    writeNote('.trash/Deleted.md', 'gone');
    fs.writeFileSync(path.join(vaultDir, 'map.png'), 'not markdown');
    const res = await route.GET(getRequest());
    const body = await res.json();
    expect(body.notes.map(n => n.path)).toEqual(['Lore/Gods.md']);
  });

  it('strips frontmatter and markdown syntax from excerpts', async () => {
    writeNote('NPCs/Delina.md', '---\ntags: npc\n---\n# Delina\n\nShe knows the **Six Truths** and [[Gaia]].\n');
    const res = await route.GET(getRequest());
    const body = await res.json();
    expect(body.notes[0].excerpt).toBe('She knows the Six Truths and Gaia.');
  });

  it('never creates or modifies files in the vault', async () => {
    writeNote('Lore/Gods.md', 'Pantheon.\n');
    await route.GET(getRequest());
    await route.GET(getRequest('?path=Lore%2FGods.md'));
    const all = fs.readdirSync(vaultDir, { recursive: true });
    expect(all.sort()).toEqual(['Lore', path.join('Lore', 'Gods.md')].sort());
    expect(fs.readFileSync(path.join(vaultDir, 'Lore/Gods.md'), 'utf8')).toBe('Pantheon.\n');
  });
});

describe('GET /api/vault?path=', () => {
  it('returns the full content of one note', async () => {
    writeNote('Lore/Gods.md', '# Gods\n\nGaia made the world.\n');
    const res = await route.GET(getRequest('?path=Lore%2FGods.md'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Gods');
    expect(body.dir).toBe('Lore');
    expect(body.content).toBe('# Gods\n\nGaia made the world.\n');
  });

  it('returns 404 for a note that does not exist', async () => {
    const res = await route.GET(getRequest('?path=Missing.md'));
    expect(res.status).toBe(404);
  });

  it('rejects path traversal outside the vault with 400', async () => {
    fs.writeFileSync(path.join(os.tmpdir(), 'dm-app-vault-outside.md'), 'secret');
    const res = await route.GET(getRequest('?path=..%2Fdm-app-vault-outside.md'));
    expect(res.status).toBe(400);
    fs.rmSync(path.join(os.tmpdir(), 'dm-app-vault-outside.md'), { force: true });
  });

  it('rejects non-markdown paths with 400', async () => {
    const res = await route.GET(getRequest('?path=map.png'));
    expect(res.status).toBe(400);
  });
});

describe('route surface', () => {
  it('is read-only: exports no POST, PUT, or DELETE handler', () => {
    expect(route.POST).toBeUndefined();
    expect(route.PUT).toBeUndefined();
    expect(route.DELETE).toBeUndefined();
  });
});
