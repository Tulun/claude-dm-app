import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { defaultEnemyTemplates } from '../../components/defaultData';
import { confluxCreatures } from '../../data/confluxCreatures.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');
const TEMPLATES_VERSION = 12; // Added Conflux source support

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function GET(request) {
  ensureDataDir();
  try {
    // Check for source filter
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // 'mm', 'conflux', 'custom', or null (all)

    // Load user-customized MM templates
    let mmTemplates = defaultEnemyTemplates;
    if (fs.existsSync(TEMPLATES_FILE)) {
      const data = fs.readFileSync(TEMPLATES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      const existingTemplates = parsed.templates || parsed;
      const needsUpgrade = !parsed._version || parsed._version < TEMPLATES_VERSION ||
        (existingTemplates.length > 0 && !existingTemplates[0].size);

      if (needsUpgrade) {
        const customTemplates = existingTemplates.filter(t => !t.id?.startsWith('mm-'));
        const mergedTemplates = [...defaultEnemyTemplates, ...customTemplates];
        const dataWithVersion = { _version: TEMPLATES_VERSION, templates: mergedTemplates };
        fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(dataWithVersion, null, 2), 'utf8');
        mmTemplates = mergedTemplates;
      } else {
        mmTemplates = existingTemplates;
      }
    } else {
      const dataWithVersion = { _version: TEMPLATES_VERSION, templates: defaultEnemyTemplates };
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(dataWithVersion, null, 2), 'utf8');
    }

    // Tag MM templates with source if not already tagged
    mmTemplates = mmTemplates.map(t => ({
      ...t,
      source: t.source || (t.id?.startsWith('mm-') ? 'mm' : 'custom')
    }));

    // Filter by source
    if (source === 'mm') {
      return NextResponse.json(mmTemplates.filter(t => t.source === 'mm'));
    }
    if (source === 'custom') {
      return NextResponse.json(mmTemplates.filter(t => t.source === 'custom'));
    }
    if (source === 'conflux') {
      return NextResponse.json(confluxCreatures);
    }

    // Default: return MM + custom (not Conflux, to avoid overwhelming the default view)
    // Conflux is loaded separately when the user filters for it
    return NextResponse.json(mmTemplates);
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}