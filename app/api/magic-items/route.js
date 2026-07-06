import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'path';
import { defaultMagicItems } from '../../magic-items/magicItems.js';
import { backupCorruptFile } from '../../../lib/jsonStore.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'magic-items.json');
const DATA_DIR = path.join(process.cwd(), 'data');

// Increment when adding new default items or fields
const ITEMS_VERSION = 3;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadItems() {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
      // Corrupt file: preserve it for manual recovery and surface an error
      // instead of silently reseeding over the user's items.
      const backup = backupCorruptFile(DATA_FILE);
      console.error(`Corrupt magic-items.json backed up to ${backup}:`, error);
      throw new Error(`magic-items.json is corrupt and was backed up to ${path.basename(backup)}`);
    }

    if (!data.version || data.version < ITEMS_VERSION) {
      const defaultMap = new Map(defaultMagicItems.map(i => [i.id, i]));

      // Update existing items with new fields from defaults, preserve user edits
      const updated = (data.items || []).map(item => {
        const def = defaultMap.get(item.id);
        if (def) {
          return { ...def, ...item };
        }
        return item;
      });

      // Add completely new default items
      const existingIds = new Set(updated.map(i => i.id));
      const newDefaults = defaultMagicItems.filter(i => !existingIds.has(i.id));
      const merged = [...updated, ...newDefaults];

      saveItems(merged);
      console.log(`Migrated magic items to v${ITEMS_VERSION}: updated ${updated.length}, added ${newDefaults.length} new`);
      return merged;
    }

    return data.items || [];
  }

  // First time — seed with defaults
  saveItems([...defaultMagicItems]);
  return [...defaultMagicItems];
}

function saveItems(items) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ version: ITEMS_VERSION, items }, null, 2));
}

// GET — all items
export async function GET() {
  try {
    const items = loadItems();
    items.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/magic-items error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — add or update an item
export async function POST(request) {
  try {
    const item = await request.json();
    const items = loadItems();

    if (!item.id) {
      item.id = `custom-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    }

    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }

    saveItems(items);
    return NextResponse.json(item);
  } catch (error) {
    console.error('POST /api/magic-items error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE — remove an item
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const items = loadItems();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    saveItems(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/magic-items error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}