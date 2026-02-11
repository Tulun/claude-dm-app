import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ENCOUNTER_FILE = path.join(DATA_DIR, 'encounter.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET() {
  try {
    if (fs.existsSync(ENCOUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(ENCOUNTER_FILE, 'utf-8'));
      return NextResponse.json(data);
    }
    // Return empty encounter state if no file exists
    return NextResponse.json({ enemies: [], round: 1, turnIndex: 0 });
  } catch (error) {
    console.error('Error reading encounter:', error);
    return NextResponse.json({ enemies: [], round: 1, turnIndex: 0 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    fs.writeFileSync(ENCOUNTER_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving encounter:', error);
    return NextResponse.json({ error: 'Failed to save encounter' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(ENCOUNTER_FILE)) {
      fs.unlinkSync(ENCOUNTER_FILE);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing encounter:', error);
    return NextResponse.json({ error: 'Failed to clear encounter' }, { status: 500 });
  }
}