'use client';

import { useState, useCallback } from 'react';
import Icons from '../../components/Icons';

// ─── Random Tables ───────────────────────────────────────────────

const FIRST_NAMES = {
  human: {
    male: ['Aldric', 'Brant', 'Cedric', 'Dorian', 'Edmund', 'Finn', 'Gareth', 'Hugo', 'Ivan', 'Jasper', 'Kellan', 'Lucian', 'Magnus', 'Nolan', 'Osric', 'Percy', 'Quinn', 'Roland', 'Silas', 'Tobias', 'Ulric', 'Victor', 'Weston', 'Yorick', 'Zane'],
    female: ['Adeline', 'Briar', 'Celeste', 'Diana', 'Elara', 'Freya', 'Gwen', 'Helena', 'Iris', 'Juliet', 'Kira', 'Lydia', 'Maren', 'Nessa', 'Ophelia', 'Petra', 'Rosalind', 'Seraphina', 'Thea', 'Una', 'Vivienne', 'Wren', 'Yvette', 'Zara'],
  },
  elf: {
    male: ['Aelar', 'Berrian', 'Caelum', 'Daeron', 'Eryn', 'Faelar', 'Galinndan', 'Hadarai', 'Ivellios', 'Laucian', 'Mindartis', 'Naeris', 'Paelias', 'Quarion', 'Riardon', 'Soveliss', 'Thamior', 'Varis', 'Zelphar'],
    female: ['Adrie', 'Birel', 'Caelynn', 'Drusilia', 'Enna', 'Faelynn', 'Galadria', 'Ielenia', 'Keyleth', 'Lia', 'Meriel', 'Naivara', 'Quelenna', 'Sariel', 'Shanairra', 'Thia', 'Valanthe', 'Xanaphia'],
  },
  dwarf: {
    male: ['Adrik', 'Barendd', 'Bruenor', 'Dain', 'Eberk', 'Flint', 'Gardain', 'Harbek', 'Kildrak', 'Morgran', 'Orsik', 'Rurik', 'Taklinn', 'Thoradin', 'Tordek', 'Ulfgar', 'Vondal'],
    female: ['Amber', 'Bardryn', 'Dagnal', 'Diesa', 'Eldeth', 'Gunnloda', 'Helja', 'Kathra', 'Kristryd', 'Mardred', 'Riswynn', 'Sannl', 'Torbera', 'Vistra'],
  },
  halfling: {
    male: ['Alton', 'Cade', 'Corrin', 'Eldon', 'Finnan', 'Garret', 'Lyle', 'Milo', 'Osborn', 'Perrin', 'Reed', 'Roscoe', 'Wellby', 'Wendel'],
    female: ['Andry', 'Bree', 'Callie', 'Cora', 'Euphemia', 'Jillian', 'Kithri', 'Lavinia', 'Lidda', 'Merla', 'Nedda', 'Paela', 'Portia', 'Seraphina', 'Shaena', 'Vani'],
  },
  gnome: {
    male: ['Alston', 'Boddynock', 'Brocc', 'Dimble', 'Eldon', 'Fonkin', 'Gimble', 'Glim', 'Jebeddo', 'Namfoodle', 'Orryn', 'Roondar', 'Seebo', 'Warryn', 'Zook'],
    female: ['Bimpnottin', 'Breena', 'Caramip', 'Carlin', 'Donella', 'Duvamil', 'Ellyjobell', 'Lilli', 'Loopmottin', 'Nissa', 'Nyx', 'Oda', 'Orla', 'Roywyn', 'Shamil', 'Waywocket'],
  },
  halforc: {
    male: ['Dench', 'Feng', 'Gell', 'Henk', 'Holg', 'Imsh', 'Keth', 'Krusk', 'Mhurren', 'Ront', 'Shump', 'Thokk', 'Urzul'],
    female: ['Baggi', 'Emen', 'Engong', 'Kansif', 'Myev', 'Neega', 'Ovak', 'Ownka', 'Shautha', 'Sutha', 'Vola', 'Volen', 'Yevelda'],
  },
  tiefling: {
    male: ['Akmenos', 'Amnon', 'Barakas', 'Damakos', 'Ekemon', 'Iados', 'Kairon', 'Leucis', 'Melech', 'Mordai', 'Morthos', 'Pelaios', 'Skamos', 'Therai'],
    female: ['Akta', 'Bryseis', 'Criella', 'Damaia', 'Ea', 'Kallista', 'Lerissa', 'Makaria', 'Nemeia', 'Orianna', 'Phelaia', 'Rieta'],
  },
  dragonborn: {
    male: ['Arjhan', 'Balasar', 'Bharash', 'Donaar', 'Ghesh', 'Heskan', 'Kriv', 'Medrash', 'Nadarr', 'Pandjed', 'Patrin', 'Rhogar', 'Shamash', 'Shedinn', 'Torinn'],
    female: ['Akra', 'Biri', 'Daar', 'Farideh', 'Harann', 'Havilar', 'Jheri', 'Kava', 'Korinn', 'Mishann', 'Nala', 'Perra', 'Raiann', 'Sora', 'Surina', 'Thava'],
  },
};

const LAST_NAMES = {
  human: ['Ashford', 'Blackwood', 'Crane', 'Dunbar', 'Everett', 'Fairbanks', 'Greystone', 'Holloway', 'Ironside', 'Kettleburn', 'Lark', 'Merriweather', 'Northwind', 'Oakheart', 'Pennywhistle', 'Ravenswood', 'Stonebridge', 'Thornton', 'Underhill', 'Whitmore', 'Yarrow'],
  elf: ['Amakiir', 'Galanodel', 'Holimion', 'Ilphelkiir', 'Liadon', 'Meliamne', 'Naïlo', 'Siannodel', 'Xiloscient'],
  dwarf: ['Battlehammer', 'Brawnanvil', 'Dankil', 'Fireforge', 'Frostbeard', 'Gorunn', 'Holderhek', 'Ironfist', 'Loderr', 'Rumnaheim', 'Strakeln', 'Torunn', 'Ungart'],
  halfling: ['Brushgather', 'Goodbarrel', 'Greenbottle', 'Highhill', 'Hilltopple', 'Leagallow', 'Tealeaf', 'Thorngage', 'Tosscobble', 'Underbough'],
  gnome: ['Beren', 'Daergel', 'Folkor', 'Garrick', 'Nackle', 'Murnig', 'Ningel', 'Raulnor', 'Scheppen', 'Turen'],
  halforc: ['', '', '', ''], // Half-orcs often use single names
  tiefling: ['', '', '', ''], // Tieflings often use single names or virtue names
  dragonborn: ['Clethtinthiallor', 'Daardendrian', 'Delmirev', 'Drachedandion', 'Fenkenkabradon', 'Kepeshkmolik', 'Kerrhylon', 'Kimbatuul', 'Linxakasendalor', 'Myastan', 'Nemmonis', 'Norixius', 'Ophinshtalajiir', 'Prexijandilin', 'Shestendeliath', 'Turnuroth', 'Verthisathurgiesh', 'Yarjerit'],
};

const RACES = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'halforc', 'tiefling', 'dragonborn'];
const RACE_LABELS = {
  human: 'Human', elf: 'Elf', dwarf: 'Dwarf', halfling: 'Halfling',
  gnome: 'Gnome', halforc: 'Half-Orc', tiefling: 'Tiefling', dragonborn: 'Dragonborn',
};

const GENDERS = ['male', 'female'];

const OCCUPATIONS = [
  'Blacksmith', 'Innkeeper', 'Merchant', 'Farmer', 'Guard', 'Scholar', 'Priest', 'Herbalist',
  'Baker', 'Fisherman', 'Hunter', 'Bard', 'Sailor', 'Carpenter', 'Tailor', 'Jeweler',
  'Alchemist', 'Stable Master', 'Librarian', 'Brewer', 'Fletcher', 'Cobbler', 'Mason',
  'Scribe', 'Cook', 'Miner', 'Tanner', 'Healer', 'Street Performer', 'Bounty Hunter',
  'Smuggler', 'Spy', 'Fence', 'Beggar', 'Noble', 'Courtier', 'Diplomat', 'Tax Collector',
  'Town Crier', 'Gravedigger', 'Lamplighter', 'Rat Catcher', 'Fortune Teller', 'Apothecary',
  'Cartographer', 'Astronomer', 'Hermit', 'Retired Adventurer', 'Dockworker', 'Barber',
];

const PERSONALITY_TRAITS = [
  'Friendly and talkative — never met a stranger',
  'Suspicious of outsiders, slow to trust',
  'Cheerful and optimistic, always sees the bright side',
  'Grumpy and cynical, expects the worst',
  'Nervous and easily startled',
  'Calm and collected, hard to rattle',
  'Boastful and loves telling exaggerated stories',
  'Quiet and observant, speaks only when necessary',
  'Generous to a fault, gives away too much',
  'Greedy and always looking for a deal',
  'Deeply superstitious, carries lucky charms',
  'Scholarly and pedantic, corrects everyone',
  'Fiercely loyal to friends and family',
  'A shameless flirt',
  'Blunt and tactless, says what they think',
  'Polite to the point of being obsequious',
  'Lazy and always looking for shortcuts',
  'Obsessively organized and neat',
  'Reckless thrill-seeker, loves danger',
  'Cautious and methodical, plans everything',
  'Melancholy and nostalgic for better times',
  'Hot-tempered with a quick fuse',
  'Patient and wise beyond their years',
  'Gossipy and loves spreading rumors',
  'Earnest and sincere, terrible at lying',
  'Sly and manipulative, always has an angle',
  'Absentminded and easily distracted',
  'Fanatically devoted to their faith or cause',
  'Jaded by experience, hard to impress',
  'Warm and maternal/paternal toward everyone',
];

const QUIRKS = [
  'Constantly fidgets with a coin or trinket',
  'Hums or whistles an unrecognizable tune',
  'Refers to themselves in the third person',
  'Always eating or snacking on something',
  'Speaks in overly formal or archaic language',
  'Laughs at inappropriate moments',
  'Has an unusual pet (toad, raven, ferret)',
  'Collects something strange (buttons, teeth, feathers)',
  'Never makes eye contact',
  'Stares intensely without blinking',
  'Uses wildly incorrect idioms with confidence',
  'Always seems to be slightly out of breath',
  'Compulsively counts things',
  'Insists on shaking hands with everyone',
  'Whispers important words for emphasis',
  'Tells the same joke every time they meet someone',
  'Twitches their nose when thinking',
  'Carries a plant they talk to',
  'Won\'t eat food they didn\'t prepare themselves',
  'Always stands with their back to a wall',
  'Speaks about weather omens constantly',
  'Gives unsolicited life advice',
  'Has a noticeable limp from an old injury',
  'Constantly adjusting their hat or clothing',
  'Refuses to go near water',
  'Names every animal they see',
  'Sneezes at the most dramatic moments',
  'Always carries a book but never reads it',
  'Apologizes for everything, even things that aren\'t their fault',
  'Ends every sentence as if it\'s a question',
];

const MOTIVATIONS = [
  'Wants to pay off a large debt',
  'Searching for a missing family member',
  'Saving money to open their own business',
  'Seeking revenge for a past wrong',
  'Trying to earn respect in their community',
  'Hiding from someone or something',
  'Wants to leave this town and see the world',
  'Devoted to protecting their neighborhood',
  'Trying to cure a sick loved one',
  'Accumulating power and influence',
  'Looking for a worthy apprentice',
  'Wants to uncover the truth about their parents',
  'Atoning for a past mistake',
  'Pursuing forbidden knowledge',
  'Building a legacy to be remembered by',
  'Simply surviving day to day',
  'Proving themselves worthy of an inheritance',
  'Completing a promise made to the dead',
  'Collecting ingredients for a special ritual/recipe',
  'Trying to break a family curse',
];

const SECRETS = [
  'Is actually a minor noble in disguise',
  'Witnessed a crime and is afraid to speak up',
  'Owes a favor to a dangerous criminal',
  'Has a hidden talent for magic',
  'Is a former member of a thieves\' guild',
  'Secretly worships a forbidden deity',
  'Is slowly being blackmailed',
  'Knows the location of a hidden treasure',
  'Is in a secret relationship',
  'Has a second identity in another town',
  'Accidentally killed someone years ago',
  'Is a spy for a rival faction',
  'Can see or hear something others can\'t',
  'Stole something valuable and hid it',
  'Has a terminal illness they haven\'t told anyone about',
  'Is an escaped prisoner',
  'Made a deal with a fiend/fey/entity',
  'Knows an important political secret',
  'Is related to someone powerful (and doesn\'t want it known)',
  'Has been replaced by a doppelganger (the real one is imprisoned)',
];

const APPEARANCES = [
  'Tall and gaunt with sharp features',
  'Short and stocky with a warm smile',
  'Weather-beaten face, sun-darkened skin',
  'Pale and thin with dark circles under their eyes',
  'Broad-shouldered with calloused hands',
  'Well-dressed and immaculately groomed',
  'Covered in old scars, one prominent one across the cheek',
  'Wild, unkempt hair and mismatched clothing',
  'Round-faced and ruddy-cheeked',
  'Wiry and quick-moving, always in motion',
  'Has a prominent tattoo or birthmark',
  'Missing a finger or ear',
  'Strikingly beautiful/handsome in an unsettling way',
  'Plain and forgettable, blends into crowds',
  'Muscular and intimidating',
  'Hunched posture, appears older than they are',
  'Always wears a distinctive hat or accessory',
  'Has unusual eye color (one of each, violet, etc.)',
  'Heavyset with a booming laugh',
  'Lean and wiry with sharp, watchful eyes',
];

// ─── Helpers ─────────────────────────────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateNPC(options = {}) {
  const race = options.race || pick(RACES);
  const gender = options.gender || pick(GENDERS);
  const raceNames = FIRST_NAMES[race] || FIRST_NAMES.human;
  const firstName = pick(raceNames[gender] || raceNames.male);
  const lastNames = LAST_NAMES[race] || LAST_NAMES.human;
  const lastName = pick(lastNames);
  const name = lastName ? `${firstName} ${lastName}` : firstName;

  return {
    id: `npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    race: RACE_LABELS[race],
    gender: gender.charAt(0).toUpperCase() + gender.slice(1),
    occupation: pick(OCCUPATIONS),
    personality: pick(PERSONALITY_TRAITS),
    quirk: pick(QUIRKS),
    appearance: pick(APPEARANCES),
    motivation: pick(MOTIVATIONS),
    secret: pick(SECRETS),
  };
}

// ─── Component ───────────────────────────────────────────────────

export default function NPCGeneratorTab({ data, onSave }) {
  const [npc, setNpc] = useState(() => generateNPC());
  const [raceFilter, setRaceFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [lockedFields, setLockedFields] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saveFlash, setSaveFlash] = useState('');

  const reroll = useCallback(() => {
    const options = {};
    if (raceFilter) options.race = raceFilter;
    if (genderFilter) options.gender = genderFilter;

    const newNpc = generateNPC(options);
    // Keep locked fields from current NPC
    Object.keys(lockedFields).forEach(field => {
      if (lockedFields[field]) {
        newNpc[field] = npc[field];
      }
    });

    setHistory(prev => [npc, ...prev].slice(0, 20));
    setNpc(newNpc);
  }, [raceFilter, genderFilter, lockedFields, npc]);

  const rerollField = (field) => {
    if (lockedFields[field]) return;
    const options = {};
    if (raceFilter) options.race = raceFilter;
    if (genderFilter) options.gender = genderFilter;
    const fresh = generateNPC(options);
    setNpc(prev => ({ ...prev, [field]: fresh[field] }));
  };

  const toggleLock = (field) => {
    setLockedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const saveToDM = () => {
    const characters = data?.characters || [];
    const newChar = {
      id: `char-${Date.now()}`,
      name: npc.name,
      type: 'npc',
      role: npc.occupation,
      appearance: npc.appearance,
      personality: `${npc.personality}\n\nQuirk: ${npc.quirk}`,
      motivation: npc.motivation,
      secrets: npc.secret,
      stats: '',
      abilities: '',
      notes: `Race: ${npc.race} | Gender: ${npc.gender}\nOccupation: ${npc.occupation}`,
    };
    onSave({ characters: [...characters, newChar] });
    setSaveFlash(npc.name);
    setTimeout(() => setSaveFlash(''), 2000);
  };

  const loadFromHistory = (historicNpc) => {
    setNpc(historicNpc);
    setShowHistory(false);
  };

  const editField = (field, value) => {
    setNpc(prev => ({ ...prev, [field]: value }));
  };

  const FIELDS = [
    { key: 'name', label: 'Name', icon: '👤' },
    { key: 'race', label: 'Race', icon: '🧬' },
    { key: 'gender', label: 'Gender', icon: '⚧' },
    { key: 'occupation', label: 'Occupation', icon: '🔨' },
    { key: 'appearance', label: 'Appearance', icon: '👁️' },
    { key: 'personality', label: 'Personality', icon: '💬' },
    { key: 'quirk', label: 'Quirk', icon: '✨' },
    { key: 'motivation', label: 'Motivation', icon: '🎯' },
    { key: 'secret', label: 'Secret', icon: '🤫' },
  ];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Race filter */}
          <select
            value={raceFilter}
            onChange={(e) => setRaceFilter(e.target.value)}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="">Any Race</option>
            {RACES.map(r => (
              <option key={r} value={r}>{RACE_LABELS[r]}</option>
            ))}
          </select>

          {/* Gender filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="">Any Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showHistory ? 'bg-stone-700 text-amber-400' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
            title={`${history.length} previous NPCs`}
          >
            <Icons.Refresh />
            History ({history.length})
          </button>

          <button
            onClick={reroll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Icons.Dice />
            Generate NPC
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="bg-stone-800/50 border border-stone-700/50 rounded-lg p-3">
          <div className="text-xs text-stone-500 mb-2">Recent NPCs (click to load)</div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <button
                key={h.id || i}
                onClick={() => loadFromHistory(h)}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm text-stone-200 transition-colors"
              >
                {h.name} <span className="text-stone-400">— {h.race} {h.occupation}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NPC Card */}
      <div className="bg-stone-800/50 border border-amber-900/30 rounded-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-amber-900/40 to-stone-800/40 px-6 py-4 border-b border-amber-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-amber-400">{npc.name}</h3>
              <p className="text-stone-400 text-sm">{npc.race} {npc.gender} — {npc.occupation}</p>
            </div>
            <button
              onClick={saveToDM}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                saveFlash
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-emerald-700/80 hover:bg-emerald-600 text-white'
              }`}
            >
              {saveFlash ? (
                <>
                  <Icons.Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Icons.Download />
                  Save to Characters
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="divide-y divide-stone-700/30">
          {FIELDS.map(({ key, label, icon }) => (
            <div key={key} className="flex items-start gap-3 px-6 py-3 group hover:bg-stone-700/20 transition-colors">
              <span className="text-lg mt-0.5 select-none">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-0.5">{label}</div>
                <input
                  type="text"
                  value={npc[key]}
                  onChange={(e) => editField(key, e.target.value)}
                  className="w-full bg-transparent text-stone-200 text-sm focus:outline-none focus:bg-stone-800/50 rounded px-1 -mx-1 py-0.5 border border-transparent focus:border-amber-700/50 transition-colors"
                />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                <button
                  onClick={() => toggleLock(key)}
                  className={`p-1.5 rounded transition-colors ${
                    lockedFields[key]
                      ? 'text-amber-400 bg-amber-900/30'
                      : 'text-stone-500 hover:text-stone-300 hover:bg-stone-700'
                  }`}
                  title={lockedFields[key] ? 'Unlock (will reroll)' : 'Lock (keep on reroll)'}
                >
                  {lockedFields[key] ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/></svg>
                  )}
                </button>
                <button
                  onClick={() => rerollField(key)}
                  className={`p-1.5 rounded transition-colors ${
                    lockedFields[key]
                      ? 'text-stone-600 cursor-not-allowed'
                      : 'text-stone-500 hover:text-stone-300 hover:bg-stone-700'
                  }`}
                  title="Reroll this field"
                  disabled={lockedFields[key]}
                >
                  <Icons.Dice />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="text-xs text-stone-500 flex items-center gap-4 justify-center flex-wrap">
        <span>🎲 Click fields to edit directly</span>
        <span>🔒 Lock fields to keep them on reroll</span>
        <span>💾 Save sends NPC to DM Characters tab</span>
      </div>
    </div>
  );
}
