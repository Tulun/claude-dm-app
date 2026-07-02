import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { backupCorruptFile } from '../../../lib/jsonStore.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'dm.json');
const DATA_DIR = path.join(process.cwd(), 'data');

// Current version - increment when adding new default fields
const DM_VERSION = 1;

// Default empty structure
const DEFAULT_DM_DATA = {
  version: DM_VERSION,
  // NPCs, DMPCs, BBEGs
  characters: [],
  // World building - places, NPCs, lore, gods
  world: {
    places: [],
    npcs: [],
    lore: [],
    gods: [],
    factions: [],
    items: []
  },
  // Session notes
  sessionNotes: {
    current: '',
    sessions: []
  }
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDMData() {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
      // Corrupt file: preserve it for manual recovery and surface an error
      // instead of silently reseeding over the user's notes and world data.
      const backup = backupCorruptFile(DATA_FILE);
      console.error(`Corrupt dm.json backed up to ${backup}:`, error);
      throw new Error(`dm.json is corrupt and was backed up to ${path.basename(backup)}`);
    }

    // Version migration if needed
    if (!data.version || data.version < DM_VERSION) {
      const merged = {
        ...DEFAULT_DM_DATA,
        ...data,
        version: DM_VERSION
      };
      saveDMData(merged);
      return merged;
    }

    return data;
  }

  // First time - save defaults
  saveDMData(DEFAULT_DM_DATA);
  return { ...DEFAULT_DM_DATA };
}

function saveDMData(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ ...data, version: DM_VERSION }, null, 2));
}

// GET - retrieve all DM data
export async function GET() {
  try {
    const data = loadDMData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/dm error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - update DM data (partial or full)
export async function POST(request) {
  try {
    const updates = await request.json();
    const current = loadDMData();
    
    // Deep merge the updates
    const merged = {
      ...current,
      ...updates,
      // Deep merge world if provided
      world: updates.world ? { ...current.world, ...updates.world } : current.world,
      // Deep merge sessionNotes if provided
      sessionNotes: updates.sessionNotes ? { ...current.sessionNotes, ...updates.sessionNotes } : current.sessionNotes
    };
    
    saveDMData(merged);
    return NextResponse.json(merged);
  } catch (error) {
    console.error('Failed to save DM data:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE - remove a specific item
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'character', 'place', 'npc', 'lore', 'god', 'faction', 'item', 'session'
    const id = searchParams.get('id');
    
    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
    }
    
    const data = loadDMData();
    
    if (type === 'character') {
      data.characters = data.characters.filter(c => c.id !== id);
    } else if (type === 'session') {
      data.sessionNotes.sessions = data.sessionNotes.sessions.filter(s => s.id !== id);
    } else if (data.world[type + 's']) {
      data.world[type + 's'] = data.world[type + 's'].filter(item => item.id !== id);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    
    saveDMData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}