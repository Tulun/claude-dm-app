import { NextResponse } from 'next/server';
import { dataPath, readJsonFile, writeJsonFile } from '../../../lib/jsonStore.js';

const PARTY_FILE = dataPath('party.json');

export async function GET() {
  try {
    const data = readJsonFile(PARTY_FILE);
    return NextResponse.json(data === undefined ? null : data);
  } catch (error) {
    console.error('GET /api/party error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    writeJsonFile(PARTY_FILE, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/party error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
