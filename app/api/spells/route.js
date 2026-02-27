import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { defaultSpells } from '../../data/defaultSpells.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'spells.json');
const DATA_DIR = path.join(process.cwd(), 'data');

// Current version - increment when adding new default spells
const SPELLS_VERSION = 2;

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load spells from file or return defaults
function loadSpells() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      
      // Check version and merge new defaults if needed
      if (!data.version || data.version < SPELLS_VERSION) {
        // Find which default spell IDs already exist in saved data
        const existingIds = new Set(data.spells?.map(s => s.id) || []);
        // Only add NEW default spells that don't exist yet
        const newDefaults = defaultSpells.filter(s => !existingIds.has(s.id));
        const mergedSpells = [...(data.spells || []), ...newDefaults];
        saveSpells(mergedSpells);
        return mergedSpells;
      }
      
      return data.spells || [];
    }
  } catch (error) {
    console.error('Error loading spells:', error);
  }
  
  // First time only - save defaults
  saveSpells(defaultSpells);
  return [...defaultSpells];
}

// Save spells to file
function saveSpells(spells) {
  ensureDataDir();
  const data = {
    version: SPELLS_VERSION,
    spells: spells
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - retrieve all spells
export async function GET() {
  const spells = loadSpells();
  // Sort by level then name
  spells.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });
  return NextResponse.json(spells);
}

// POST - add or update a spell
export async function POST(request) {
  try {
    const spell = await request.json();
    const spells = loadSpells();
    
    // Generate ID if new spell
    if (!spell.id) {
      spell.id = `custom-${spell.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    }
    
    // Check if updating existing
    const existingIndex = spells.findIndex(s => s.id === spell.id);
    if (existingIndex >= 0) {
      spells[existingIndex] = spell;
    } else {
      spells.push(spell);
    }
    
    saveSpells(spells);
    return NextResponse.json(spell);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save spell' }, { status: 500 });
  }
}

// DELETE - remove a spell
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Spell ID required' }, { status: 400 });
    }
    
    const spells = loadSpells();
    const filtered = spells.filter(s => s.id !== id);
    
    if (filtered.length === spells.length) {
      return NextResponse.json({ error: 'Spell not found' }, { status: 404 });
    }
    
    saveSpells(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete spell' }, { status: 500 });
  }
}