import { NextResponse } from 'next/server';
import { visionRequest, extractText } from '../../../lib/claudeVision';

// Upper bound on screenshots per request. Big creatures (beholder, dragons)
// rarely need more than 2-3; the cap keeps request size sane.
const MAX_IMAGES = 6;

const PARSE_PROMPT = `You are a D&D 5th Edition stat block parser. Analyze this image of a monster stat block and extract all information into a structured JSON format.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "name": "Monster Name",
  "size": "Medium",
  "creatureType": "Humanoid",
  "ac": 15,
  "maxHp": 52,
  "hitDice": "8d8+16",
  "speed": "30, fly 60",
  "cr": "3",
  "xp": 700,
  "profBonus": 2,
  "str": 16,
  "dex": 14,
  "con": 14,
  "int": 10,
  "wis": 12,
  "cha": 10,
  "savingThrows": "Dex +4, Con +4",
  "skills": "Perception +3, Stealth +4",
  "vulnerabilities": "",
  "resistances": "",
  "immunities": "",
  "senses": "Darkvision 60 ft., Passive Perception 13",
  "languages": "Common, Draconic",
  "traits": [
    { "name": "Trait Name", "description": "Full trait description..." }
  ],
  "actions": [
    { "name": "Action Name", "description": "Full action description with attack rolls and damage..." }
  ],
  "bonusActions": [
    { "name": "Bonus Action Name", "description": "Description..." }
  ],
  "reactions": [
    { "name": "Reaction Name", "description": "Description..." }
  ],
  "legendaryActions": [
    { "name": "Legendary Action Name", "description": "Description..." }
  ],
  "notes": "Any additional notes like armor type, spellcasting details, etc.",
  "lore": "Flavor text about the creature, if shown..."
}

Important parsing rules:
1. Size must be one of: Tiny, Small, Medium, Large, Huge, Gargantuan
2. CR should be a string: "0", "1/8", "1/4", "1/2", "1", "2", etc.
3. Speed should include all movement types: "30, fly 60, swim 30"
4. Include ALL traits, actions, reactions, bonus actions, and legendary actions
5. For Multiattack, include the full description of what attacks are made
6. For spellcasting, include the full spell list in the description
7. Parse ability scores as numbers (not strings)
8. If immunities include conditions, format as "Fire, Cold; Charmed, Frightened"
9. Leave empty arrays [] for sections that don't exist
10. Leave empty strings "" for text fields that don't exist
11. Extract XP value if shown, otherwise estimate from CR
12. Extract proficiency bonus if shown
13. "lore" is the descriptive flavor text that accompanies the stat block in the book — paragraphs about the creature's nature, behavior, habitat or history, often with their own headings or set beside or above the stat block. Copy it word for word; separate paragraphs with a blank line ("\\n\\n") and put a heading on its own line before its paragraph. Never put stat-block content (traits, actions, numbers) in "lore". Use "" if the screenshots show no flavor text.

Parse the image now and return only the JSON:`;

// When a stat block is split across several screenshots, tell the model the
// images are consecutive pieces of ONE creature, in order, so it merges them
// instead of describing only the first image.
const multiImagePreamble = (count) => `The following ${count} images are consecutive screenshots of a SINGLE monster stat block that was too large for one screenshot. They are in reading order (image 1 first). Treat them as one continuous stat block: merge every section into one monster, continue any section or description that is cut off at the end of one image and resumes at the top of the next, and do not duplicate entries that appear in an overlapping region of two images.

`;

const buildPrompt = (count) =>
  count > 1
    ? multiImagePreamble(count) + PARSE_PROMPT.replace('Analyze this image', 'Analyze these images').replace('Parse the image now', 'Parse the images now')
    : PARSE_PROMPT;

// Accepts { images: [{ data, mediaType }] } or the legacy single-image
// { image, mediaType } body. Returns a cleaned array (possibly empty).
const normalizeImages = (body) => {
  if (Array.isArray(body?.images)) {
    return body.images
      .filter(img => img && typeof img.data === 'string' && img.data.length > 0)
      .map(img => ({ data: img.data, mediaType: img.mediaType || 'image/png' }));
  }
  if (typeof body?.image === 'string' && body.image.length > 0) {
    return [{ data: body.image, mediaType: body.mediaType || 'image/png' }];
  }
  return [];
};

export async function POST(request) {
  try {
    const images = normalizeImages(await request.json());

    if (images.length === 0) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Too many images (max ${MAX_IMAGES})` },
        { status: 400 }
      );
    }

    // Dynamically import Anthropic SDK
    let Anthropic;
    try {
      const anthropicModule = await import('@anthropic-ai/sdk');
      Anthropic = anthropicModule.default;
    } catch (importError) {
      return NextResponse.json({ 
        error: 'Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk',
        details: 'The image import feature requires the Anthropic SDK and an API key.'
      }, { status: 500 });
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'ANTHROPIC_API_KEY not set',
        details: 'Add ANTHROPIC_API_KEY to your .env.local file'
      }, { status: 500 });
    }

    const client = new Anthropic();

    // Call Claude API with vision
    const response = await client.beta.messages.create(visionRequest({
      content: [
        ...images.flatMap((img, i) => [
          ...(images.length > 1 ? [{ type: 'text', text: `Image ${i + 1} of ${images.length}:` }] : []),
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mediaType,
              data: img.data,
            },
          },
        ]),
        {
          type: 'text',
          text: buildPrompt(images.length),
        },
      ],
    }));

    const { text: responseText, error: responseError } = extractText(response);
    if (responseError) {
      return NextResponse.json({ error: responseError }, { status: 502 });
    }

    // Parse the JSON response
    let monsterData;
    try {
      // Clean up potential markdown code blocks
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();
      
      monsterData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      return NextResponse.json({ 
        error: 'Failed to parse monster data', 
        raw: responseText 
      }, { status: 500 });
    }

    // Validate and clean up the data
    const cleanedData = {
      id: `imported-${Date.now()}`,
      name: monsterData.name || 'Unknown Monster',
      size: monsterData.size || 'Medium',
      creatureType: monsterData.creatureType || 'Monstrosity',
      ac: parseInt(monsterData.ac) || 10,
      maxHp: parseInt(monsterData.maxHp) || 10,
      hitDice: monsterData.hitDice || '1d8',
      speed: monsterData.speed || '30',
      cr: String(monsterData.cr || '1'),
      xp: parseInt(monsterData.xp) || 200,
      profBonus: parseInt(monsterData.profBonus) || 2,
      str: parseInt(monsterData.str) || 10,
      dex: parseInt(monsterData.dex) || 10,
      con: parseInt(monsterData.con) || 10,
      int: parseInt(monsterData.int) || 10,
      wis: parseInt(monsterData.wis) || 10,
      cha: parseInt(monsterData.cha) || 10,
      savingThrows: monsterData.savingThrows || '',
      skills: monsterData.skills || '',
      vulnerabilities: monsterData.vulnerabilities || '',
      resistances: monsterData.resistances || '',
      immunities: monsterData.immunities || '',
      senses: monsterData.senses || '',
      languages: monsterData.languages || '',
      traits: Array.isArray(monsterData.traits) ? monsterData.traits : [],
      actions: Array.isArray(monsterData.actions) ? monsterData.actions : [],
      bonusActions: Array.isArray(monsterData.bonusActions) ? monsterData.bonusActions : [],
      reactions: Array.isArray(monsterData.reactions) ? monsterData.reactions : [],
      legendaryActions: Array.isArray(monsterData.legendaryActions) ? monsterData.legendaryActions : [],
      notes: monsterData.notes || '',
      lore: typeof monsterData.lore === 'string' ? monsterData.lore.trim() : '',
      isNpc: false,
    };

    return NextResponse.json({ success: true, monster: cleanedData });
  } catch (error) {
    console.error('Parse monster error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}