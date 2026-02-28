import { NextResponse } from 'next/server';

const PARSE_PROMPT = `You are a D&D 5th Edition spell parser. Analyze this image of a spell description and extract all information into a structured JSON format.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "name": "Spell Name",
  "level": 0,
  "school": "Evocation",
  "castingTime": "1 action",
  "range": "60 feet",
  "components": "V, S, M (a bit of fleece)",
  "duration": "Concentration, up to 1 minute",
  "classes": ["Wizard", "Sorcerer"],
  "description": "Full spell description text...",
  "higherLevels": "When you cast this spell using a spell slot of 2nd level or higher...",
  "concentration": true,
  "ritual": false
}

Important parsing rules:
1. Level should be a number: 0 for cantrips, 1-9 for leveled spells
2. School must be one of: Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation
3. Classes should be an array of class names that can cast this spell
4. If the spell has "At Higher Levels" or "Cantrip Upgrade" text, include it in higherLevels
5. Set concentration to true if the duration mentions "Concentration"
6. Set ritual to true if the spell is marked as a ritual
7. Parse the full description text, preserving paragraph breaks as \\n\\n
8. If higherLevels doesn't exist, set it to null
9. Common classes: Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, Wizard
10. Include any material components in parentheses in the components field

Parse the image now and return only the JSON:`;

export async function POST(request) {
  try {
    const { image, mediaType } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'ANTHROPIC_API_KEY not configured',
        details: 'Add ANTHROPIC_API_KEY to your .env.local file'
      }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/png',
                data: image,
              },
            },
            {
              type: 'text',
              text: PARSE_PROMPT,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    // Try to parse the JSON response
    let spellData;
    try {
      // Clean up the response - remove any markdown code blocks if present
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();
      
      spellData = JSON.parse(jsonText);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Failed to parse spell data from image',
        raw: content.text
      }, { status: 500 });
    }

    // Generate a unique ID for the spell
    spellData.id = `spell-${spellData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    
    // Ensure all required fields exist
    spellData.level = spellData.level ?? 0;
    spellData.school = spellData.school || 'Evocation';
    spellData.classes = spellData.classes || [];
    spellData.concentration = spellData.concentration ?? false;
    spellData.ritual = spellData.ritual ?? false;
    spellData.higherLevels = spellData.higherLevels || null;

    return NextResponse.json({ spell: spellData });
    
  } catch (error) {
    console.error('Parse spell error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to parse spell'
    }, { status: 500 });
  }
}