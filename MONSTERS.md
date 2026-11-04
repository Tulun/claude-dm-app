# Monster templates — what's 2024 and what's missing

Quick reference for the built-in monster list (`mm-*` templates, defined in
[app/data/defaultEnemyTemplates.js](app/data/defaultEnemyTemplates.js)).
Last updated 2026-11-04.

## At a glance

| | Count | Stats |
|---|---|---|
| In SRD 5.2.1, updated to the 2024 stat block | 292 | 2024 (tagged **2024** in the template lists) |
| New in 2024, added | 37 | 2024 |
| 2014 name kept beside its renamed 2024 version | 21 | 2014 |
| **Not in SRD 5.2.1 — still on the older stats** | **128** | older (listed below) |

Your 8 custom templates (Topiary Golem Ornamental, the Gnoll Abyssal set,
Lizardfolk Bloodeye, etc.) were not touched.

## Missing: not in SRD 5.2.1 (still on older stats)

These are in the 2024 Monster Manual but not in the free SRD, so they keep the
app's older stat blocks. To update one, screenshot its stat block from your
Monster Manual on D&D Beyond and drop it into **Import Monster** (combat page →
templates). It detects the existing template by name and offers to update it.

- **CR 0:** Myconid Sprout · Octopus
- **CR 1/4:** Aarakocra Skirmisher · Animated Broom · Bullywug · Drow · Duodrone · Kenku · Kuo-toa · Mud Mephit · Needle Blight · Pixie · Smoke Mephit · Troglodyte · Twig Blight · Winged Kobold
- **CR 1/2:** Gas Spore · Jackalwere · Lizardfolk · Myconid Adult · Orc · Performer · Piercer · Tridrone · Vine Blight
- **CR 1:** Duergar · Faerie Dragon (Older) · Faerie Dragon (Youth) · Fire Snake · Half-Ogre · Kuo-toa Whip · Lacedon Ghoul · Myconid Spore Servant · Ogrillon · Psychic Gray Ooze · Quadrone · Scarecrow · Swarm of Larvae · Thri-kreen · Yuan-ti Pureblood
- **CR 2:** Bulette Pup · Carrion Crawler · Faerie Dragon (Adult) · Githzerai Monk · Gnoll Pack Lord · Guard Drake · Intellect Devourer · Lizardfolk Geomancer · Lizardfolk Shaman · Mage Apprentice · Myconid Sovereign · Nothic · Orog · Pentadrone · Peryton · Poltergeist · Quaggoth · Sahuagin Priestess · Spined Devil · Swarm of Stirges
- **CR 3:** Bugbear Chief · Displacer Beast · Flaming Skeleton · Githyanki Warrior · Goblin Hexer · Grell · Hook Horror · Kuo-toa Monitor · Quaggoth Thonot · Scout Captain · Spectator · Swarm of Lemures · Water Weird · Yeti · Yuan-ti Malison
- **CR 4:** Aarakocra Aeromancer · Banshee · Bone Naga · Bullywug Bog Sage · Flameskull · Girallon · Gnoll Fang of Yeenoghu · Helmed Horror · Juvenile Shadow Dragon · Lizardfolk King/Queen · Orc War Chief · Redcap · Shadow Demon · Swarm of Dretches · Yuan-ti Mind Whisperer
- **CR 5:** Barlgura · Cambion · Half-Red Dragon Veteran · Mezzoloth · Umber Hulk
- **CR 6:** Cyclops · Galeb Duhr · Hobgoblin Warlord · Kuo-toa Archpriest
- **CR 7:** Blue Slaad · Drow Mage · Grick Alpha · Mind Flayer
- **CR 8:** Green Slaad
- **CR 9:** Abominable Yeti · Gray Slaad · Nycaloth
- **CR 10:** Death Slaad
- **CR 11:** Dao · Marid
- **CR 12:** Arcanaloth · Gray Render · Ki-rin
- **CR 13:** Beholder · Ultroloth
- **CR 14:** Death Tyrant
- **CR 15:** Vampire Spellcaster
- **CR 16:** Githyanki Dracomancer · Gulthias Blight
- **CR 17:** Death Knight · Dracolich · Goristro
- **CR 18:** Demilich
- **CR 21:** Arch-hag
- **CR 22:** Elemental Cataclysm
- **CR 23:** Blob of Annihilation · Empyrean
- **CR 25:** Colossus

## Renamed in 2024: both versions are in the list

The 2014 template stays (old encounters may reference it). Use the 2024 one
for new encounters.

| 2014 (older stats) | 2024 (SRD 5.2.1) |
|---|---|
| Acolyte | Priest Acolyte |
| Azer | Azer Sentinel |
| Bugbear | Bugbear Warrior |
| Centaur | Centaur Trooper |
| Cult Fanatic | Cultist Fanatic |
| Flying Sword | Animated Flying Sword |
| Giant Poisonous Snake | Giant Venomous Snake |
| Gnoll | Gnoll Warrior |
| Goblin | Goblin Warrior |
| Gynosphinx | Sphinx of Lore |
| Hobgoblin | Hobgoblin Warrior |
| Kobold | Kobold Warrior |
| Minotaur | Minotaur of Baphomet |
| Quipper | Piranha |
| Rug of Smothering | Animated Rug of Smothering |
| Sahuagin | Sahuagin Warrior |
| Shrieker | Shrieker Fungus |
| Swarm of Poisonous Snakes | Swarm of Venomous Snakes |
| Swarm of Quippers | Swarm of Piranhas |
| Thug | Tough |
| Veteran | Warrior Veteran |

## New in 2024 (added)

Archmage, Bugbear Stalker, Goblin Minion, Half-Dragon, Merfolk Skirmisher,
Noble, Pirate Captain, Tough Boss, Warrior Infantry, Werebear; animals Blood
Hawk, Camel, Flying Snake, Giant Crab, Giant Weasel, Mastiff, Mule, Pony,
Venomous Snake — plus the 2024 halves of the renames above.

## How the update protects your edits

The templates migration (version 13, `app/api/templates/route.js`) replaces a
saved built-in **only if it is byte-for-byte the old default** — checked
against fingerprints of every previously shipped template
(`app/data/templateFingerprints.js`). A built-in you edited is kept exactly as
you saved it, without any 2024 fields mixed in. Custom templates are never
touched.

Enemies already in an active combat or saved in `data/encounter.json` are
copies, so they keep the stats they were added with. Reload the encounter from
the library to pick up the 2024 versions.

## Source and license

This work includes material from the System Reference Document 5.2.1
("SRD 5.2.1") by Wizards of the Coast LLC, available at
https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative
Commons Attribution 4.0 International License, available at
https://creativecommons.org/licenses/by/4.0/legalcode.

Converted from the official SRD 5.2.1 PDF text. Feature names were cross-indexed
with the [dnd-srd5.2-mdbook](https://codeberg.org/mailbun/dnd-srd5.2-mdbook)
transcription, and AC, HP, ability scores, CR, XP and initiative were checked
against the [Open5e](https://open5e.com) `srd-2024` dataset. All 329 matched
except where Open5e itself was wrong (CR 0 XP). Two typos in the PDF were
corrected: Archmage XP 8,000 → 8,400, and Young White Dragon's missing INT save
sign.
