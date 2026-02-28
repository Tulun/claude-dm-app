import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { defaultSpells } from '../../data/defaultSpells.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'spells.json');
const DATA_DIR = path.join(process.cwd(), 'data');

// Current version - increment when adding new default spells or fields
const SPELLS_VERSION = 4;

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
        // Create a map of default spells by ID for quick lookup
        const defaultSpellMap = new Map(defaultSpells.map(s => [s.id, s]));
        
        // Update existing spells with new fields from defaults (but preserve user edits)
        const updatedSpells = (data.spells || []).map(spell => {
          const defaultSpell = defaultSpellMap.get(spell.id);
          if (defaultSpell) {
            // Merge: add new fields from default that don't exist in saved spell
            // This preserves user edits while adding new fields like source, sourceShort, sourceUrl
            return {
              ...defaultSpell,  // Start with all default fields
              ...spell,         // Override with user's saved values
              // Explicitly add new fields if they don't exist in user's spell
              source: spell.source || defaultSpell.source,
              sourceShort: spell.sourceShort || defaultSpell.sourceShort,
              sourceUrl: spell.sourceUrl || defaultSpell.sourceUrl,
            };
          }
          return spell; // Custom spell, keep as-is
        });
        
        // Add any completely new default spells that don't exist
        const existingIds = new Set(updatedSpells.map(s => s.id));
        const newDefaults = defaultSpells.filter(s => !existingIds.has(s.id));
        const mergedSpells = [...updatedSpells, ...newDefaults];
        
        saveSpells(mergedSpells);
        console.log(`Migrated spells to version ${SPELLS_VERSION}: updated ${updatedSpells.length} spells, added ${newDefaults.length} new spells`);
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
      
      // Sync this spell to any characters that have it
      syncSpellToCharacters(spell);
    } else {
      spells.push(spell);
    }
    
    saveSpells(spells);
    return NextResponse.json(spell);
  } catch (error) {
    console.error('Failed to save spell:', error);
    return NextResponse.json({ error: 'Failed to save spell' }, { status: 500 });
  }
}

// Sync updated spell to all characters that have it
function syncSpellToCharacters(updatedSpell) {
  const PARTY_FILE = path.join(process.cwd(), 'data', 'party.json');
  
  try {
    if (!fs.existsSync(PARTY_FILE)) return;
    
    const partyData = JSON.parse(fs.readFileSync(PARTY_FILE, 'utf8'));
    if (!Array.isArray(partyData)) return;
    
    let changed = false;
    
    partyData.forEach(character => {
      if (!character.spells || !Array.isArray(character.spells)) return;
      
      character.spells = character.spells.map(charSpell => {
        // Match by sourceId (spellbook reference) or by spell id
        if (charSpell.sourceId === updatedSpell.id || charSpell.id === updatedSpell.id) {
          changed = true;
          // Preserve the character's unique spell instance id, update everything else
          return {
            ...charSpell,
            name: updatedSpell.name,
            level: updatedSpell.level,
            school: updatedSpell.school,
            castTime: updatedSpell.castingTime,
            castingTime: updatedSpell.castingTime,
            range: updatedSpell.range,
            components: updatedSpell.components,
            duration: updatedSpell.duration,
            description: updatedSpell.description,
            higherLevels: updatedSpell.higherLevels,
            concentration: updatedSpell.concentration,
            ritual: updatedSpell.ritual
          };
        }
        return charSpell;
      });
    });
    
    if (changed) {
      fs.writeFileSync(PARTY_FILE, JSON.stringify(partyData, null, 2));
      console.log('Synced spell to characters:', updatedSpell.name);
    }
  } catch (error) {
    console.error('Failed to sync spell to characters:', error);
    // Don't throw - spell save should still succeed even if sync fails
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