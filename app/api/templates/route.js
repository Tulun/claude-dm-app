import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { defaultEnemyTemplates } from '../../components/defaultData';

const DATA_DIR = path.join(process.cwd(), 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');
const TEMPLATES_VERSION = 6; // Bumped to force refresh after deduplication

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function GET() {
  ensureDataDir();
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const data = fs.readFileSync(TEMPLATES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      // Check if we need to upgrade - look for version or new size/creatureType format
      const templates = parsed.templates || parsed;
      const needsUpgrade = !parsed._version || parsed._version < TEMPLATES_VERSION || 
        (templates.length > 0 && !templates[0].size);
      if (needsUpgrade) {
        const dataWithVersion = { _version: TEMPLATES_VERSION, templates: defaultEnemyTemplates };
        fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(dataWithVersion, null, 2), 'utf8');
        return NextResponse.json(defaultEnemyTemplates);
      }
      return NextResponse.json(templates);
    }
    // No file exists, create with defaults
    const dataWithVersion = { _version: TEMPLATES_VERSION, templates: defaultEnemyTemplates };
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(dataWithVersion, null, 2), 'utf8');
    return NextResponse.json(defaultEnemyTemplates);
  } catch (error) {
    console.error('GET /api/templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  ensureDataDir();
  try {
    const body = await request.json();
    const dataWithVersion = { _version: TEMPLATES_VERSION, templates: body };
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(dataWithVersion, null, 2), 'utf8');
    console.log('Saved templates data to:', TEMPLATES_FILE);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}