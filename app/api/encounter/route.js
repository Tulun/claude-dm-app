import { NextResponse } from 'next/server';
import { dataPath, readJsonFile, writeJsonFile, deleteJsonFile } from '../../../lib/jsonStore.js';

const ENCOUNTER_FILE = dataPath('encounter.json');
const EMPTY_ENCOUNTER = { enemies: [], round: 1, turnIndex: 0 };

export async function GET() {
  try {
    const data = readJsonFile(ENCOUNTER_FILE);
    return NextResponse.json(data === undefined ? EMPTY_ENCOUNTER : data);
  } catch (error) {
    // A corrupt file falls back to an empty encounter rather than erroring
    console.error('Error reading encounter:', error);
    return NextResponse.json(EMPTY_ENCOUNTER);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    writeJsonFile(ENCOUNTER_FILE, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving encounter:', error);
    return NextResponse.json({ error: 'Failed to save encounter' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    deleteJsonFile(ENCOUNTER_FILE);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing encounter:', error);
    return NextResponse.json({ error: 'Failed to clear encounter' }, { status: 500 });
  }
}
