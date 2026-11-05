# Monster templates — what's 2024 and what's missing

Quick reference for the built-in monster list (`mm-*` templates, defined in
[app/data/defaultEnemyTemplates.js](app/data/defaultEnemyTemplates.js)).
Last updated 2026-11-05.

## At a glance

| | Count | Stats |
|---|---|---|
| In SRD 5.2.1, updated to the 2024 stat block | 292 | 2024 (tagged **2024** in the template lists) |
| New in 2024, added | 37 | 2024 |
| **Not in SRD 5.2.1 — still on the older stats** | **127** | older (92 + 18 have a 2024 version — see below) |
| 2014 version removed because its renamed 2024 version is in the list | 22 | — |

Your 8 custom templates (Topiary Golem Ornamental, the Gnoll Abyssal set,
Lizardfolk Bloodeye, etc.) were not touched.

## Missing: not in SRD 5.2.1 (still on older stats)

127 built-ins are not in the free SRD, so they keep the app's older stat
blocks. Checked against the full 2024 Monster Manual roster (503 stat blocks,
5etools `XMM` data) on 2026-11-05, they split three ways:

| | Count | What to do |
|---|---|---|
| In the 2024 Monster Manual, same name | 92 | Re-import to update |
| In the 2024 Monster Manual, renamed | 18 | Import the 2024 block (new name) |
| Not in the 2024 Monster Manual | 17 | Nothing newer exists — keep the older stats |

To update one, screenshot its stat block from your Monster Manual on D&D Beyond
and drop it into **Import from Image** (templates library). For a same-name
monster it detects the existing template and offers **Update Existing**; for a
renamed one, edit the name to the 2024 name first, then delete the 2014
template — once a renamed monster is in the list under its 2024 name, the 2014
version goes (see "Renamed in 2024: 2014 version removed" below). Set **Source book** to `MM 2024`
while you're there.

Already re-imported: Beholder.

### In the 2024 Monster Manual — same name (92)

- **CR 0:** Myconid Sprout · Octopus
- **CR 1/4:** Aarakocra Skirmisher · Animated Broom · Kenku · Kuo-toa · Mud Mephit · Needle Blight · Pixie · Smoke Mephit · Troglodyte · Twig Blight · Winged Kobold
- **CR 1/2:** Jackalwere · Myconid Adult · Performer · Piercer · Vine Blight
- **CR 1:** Kuo-toa Whip · Lacedon Ghoul · Myconid Spore Servant · Psychic Gray Ooze · Scarecrow · Swarm of Larvae
- **CR 2:** Bulette Pup · Carrion Crawler · Githzerai Monk · Gnoll Pack Lord · Intellect Devourer · Lizardfolk Geomancer · Mage Apprentice · Myconid Sovereign · Nothic · Peryton · Poltergeist · Quaggoth · Spined Devil · Swarm of Stirges
- **CR 3:** Displacer Beast · Flaming Skeleton · Githyanki Warrior · Goblin Hexer · Grell · Hook Horror · Kuo-toa Monitor · Quaggoth Thonot · Scout Captain · Spectator · Swarm of Lemures · Water Weird · Yeti
- **CR 4:** Aarakocra Aeromancer · Banshee · Bone Naga · Bullywug Bog Sage · Flameskull · Gnoll Fang of Yeenoghu · Helmed Horror · Juvenile Shadow Dragon · Shadow Demon · Swarm of Dretches
- **CR 5:** Barlgura · Cambion · Mezzoloth · Umber Hulk
- **CR 6:** Galeb Duhr · Hobgoblin Warlord · Kuo-toa Archpriest
- **CR 7:** Blue Slaad · Mind Flayer
- **CR 8:** Green Slaad
- **CR 9:** Abominable Yeti · Gray Slaad · Nycaloth
- **CR 10:** Death Slaad
- **CR 11:** Dao · Marid
- **CR 12:** Arcanaloth
- **CR 13:** Beholder · Ultroloth
- **CR 14:** Death Tyrant
- **CR 16:** Githyanki Dracomancer · Gulthias Blight
- **CR 17:** Death Knight · Dracolich · Goristro
- **CR 18:** Demilich
- **CR 21:** Arch-hag
- **CR 22:** Elemental Cataclysm
- **CR 23:** Blob of Annihilation · Empyrean
- **CR 25:** Colossus

### In the 2024 Monster Manual — renamed (18)

| Older name in the app | CR | 2024 name | Note |
|---|---|---|---|
| Bullywug | 1/4 | Bullywug Warrior |  |
| Duodrone | 1/4 | Modron Duodrone |  |
| Gas Spore | 1/2 | Gas Spore Fungus |  |
| Tridrone | 1/2 | Modron Tridrone |  |
| Faerie Dragon (Youth) | 1 | Faerie Dragon Youth |  |
| Fire Snake | 1 | Salamander Fire Snake |  |
| Half-Ogre | 1 | Ogrillon Ogre | same creature as Ogrillon — the 2014 block was "Half-Ogre (Ogrillon)" |
| Ogrillon | 1 | Ogrillon Ogre | duplicate of Half-Ogre |
| Quadrone | 1 | Modron Quadrone |  |
| Thri-kreen | 1 | Thri-kreen Marauder |  |
| Yuan-ti Pureblood | 1 | Yuan-ti Infiltrator |  |
| Faerie Dragon (Adult) | 2 | Faerie Dragon Adult |  |
| Pentadrone | 2 | Modron Pentadrone |  |
| Sahuagin Priestess | 2 | Sahuagin Priest |  |
| Yuan-ti Malison | 3 | Yuan-ti Malison (Type 1 / 2 / 3) | 2024 splits it into three type blocks |
| Lizardfolk King/Queen | 4 | Lizardfolk Sovereign |  |
| Cyclops | 6 | Cyclops Sentry | 2024 also adds a Cyclops Oracle (CR 10) |
| Grick Alpha | 7 | Grick Ancient |  |

### Not in the 2024 Monster Manual (17)

These only exist in older books, so the app's stats are as current as they
get. Tag them with their book (`MM 2014`, `MPMM`) via **Source book** if you
want the library's Book filter to reflect that — the automatic label calls
every untagged older built-in `MM 2014`.

| Monster | CR | Latest official stat block | Note |
|---|---|---|---|
| Drow | 1/4 | MM 2014 |  |
| Lizardfolk | 1/2 | MM 2014 |  |
| Orc | 1/2 | MM 2014 |  |
| Duergar | 1 | MM 2014 (variants in MPMM) |  |
| Faerie Dragon (Older) | 1 | MM 2014 | 2024 has only Youth and Adult |
| Guard Drake | 2 | MPMM (orig. Volo's) |  |
| Lizardfolk Shaman | 2 | MM 2014 | closest 2024: Lizardfolk Geomancer |
| Orog | 2 | MM 2014 |  |
| Bugbear Chief | 3 | MM 2014 | closest 2024: Bugbear Stalker |
| Girallon | 4 | MPMM (orig. Volo's) |  |
| Orc War Chief | 4 | MM 2014 |  |
| Redcap | 4 | MPMM (orig. Volo's) |  |
| Yuan-ti Mind Whisperer | 4 | MPMM (orig. Volo's) |  |
| Drow Mage | 7 | MM 2014 |  |
| Gray Render | 12 | MPMM (orig. Volo's) |  |
| Ki-rin | 12 | MPMM (orig. Volo's) |  |
| Vampire Spellcaster | 15 | MM 2014 (Vampire variant) | 2024 Vampire Umbral Lord is also CR 15 but a different block |

The "latest official stat block" column is from book knowledge, not checked
against a source; the in/not-in split above is checked.

## Renamed in 2024: 2014 version removed

Rule: when a monster was renamed in 2024 and the 2024 version is in the list
under its new name, the 2014 template is removed. These 22 were removed in
templates version 14 (ids in `app/data/retiredTemplates.js`); no saved
encounter used them. A 2014 copy you had edited would have been kept — none
were. Enemies already in a combat are copies and keep their stats.

| 2014 (removed) | 2024 (SRD 5.2.1) |
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
| Half-Red Dragon Veteran | Half-Dragon (folded into the generic Half-Dragon) |

## New in 2024 (added)

Archmage, Bugbear Stalker, Goblin Minion, Half-Dragon, Merfolk Skirmisher,
Noble, Pirate Captain, Tough Boss, Warrior Infantry, Werebear; animals Blood
Hawk, Camel, Flying Snake, Giant Crab, Giant Weasel, Mastiff, Mule, Pony,
Venomous Snake — plus the 2024 versions of the renames above.

## How the update protects your edits

The templates migration (`app/api/templates/route.js`; version 13 = 2024 stat
blocks, version 14 = renamed 2014 duplicates removed) replaces — or, for a
removed built-in, deletes — a saved built-in **only if it is byte-for-byte the
old default** — checked against fingerprints of every previously shipped
template (`app/data/templateFingerprints.js`). A built-in you edited is kept exactly as
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
