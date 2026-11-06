# Monster templates — 2024 coverage and what's left

Every stat block in the 2024 Monster Manual, checked against what's in the app
(built-ins in [app/data/defaultEnemyTemplates.js](app/data/defaultEnemyTemplates.js)
plus your saved and imported templates in `data/templates.json`). Roster: 503
stat blocks, 5etools `XMM` data. Matched by name, ignoring case and punctuation.
**Snapshot as of 2026-11-05 (second pass)** — counts drift as you import.

## At a glance — all 503 stat blocks in the 2024 Monster Manual

| | Count | What to do |
|---|---|---|
| In the app as a 2024 SRD 5.2.1 built-in | 326 | Nothing |
| In the app, imported by you from the 2024 MM (Source book `MM 2024`) | 124 | Nothing |
| Not in the app at all | **0** | — every 2024 monster is now in |
| **In the app, but still on older (2014-era) stats** | **53** | Re-import (same name → **Update Existing**) |

All 65 monsters that were missing on the first pass are in (55 new in 2024 +
10 renames). The 124 imports are 82 new templates plus 42 built-ins you updated
in place. Two of those were already SRD 5.2.1 built-ins (Ogre, Sahuagin
Warrior) — re-importing them was harmless. On top of the 503, 17 older
built-ins have no 2024 Monster Manual version at all (listed further down) and
8 of your custom templates (Topiary Golem Ornamental, the Gnoll Abyssal set,
Lizardfolk Bloodeye, etc.) aren't from the Monster Manual.

## How to update one

Screenshot its stat block from your Monster Manual on D&D Beyond and drop it
into **Import from Image** (templates library). Set **Source book** to
`MM 2024`. For a same-name monster the import detects the existing template and
offers **Update Existing**. If a future book renames a monster you already
have, import it under the new name; the old template then goes — delete it in
the library AND retire its id in `app/data/retiredTemplates.js`, or a future
update re-adds it (see "Renamed in 2024: 2014 version removed" below).

## What's left: in the app, still on older stats (53)

Same name in the 2024 Monster Manual; the app's stat block is the older one.
Beholder was re-imported but has no Source book set, so it can't be told apart
from the old stats — set it to `MM 2024` and it moves to "done".

- **CR 1/4:** Kenku · Kuo-toa · Mud Mephit · Smoke Mephit · Troglodyte · Winged Kobold
- **CR 1/2:** Jackalwere · Myconid Adult · Piercer
- **CR 1:** Kuo-toa Whip · Lacedon Ghoul · Myconid Spore Servant · Psychic Gray Ooze · Scarecrow
- **CR 2:** Bulette Pup · Carrion Crawler · Intellect Devourer · Mage Apprentice · Myconid Sovereign · Nothic · Peryton · Poltergeist · Quaggoth · Spined Devil · Swarm of Stirges
- **CR 3:** Displacer Beast · Flaming Skeleton · Goblin Hexer · Grell · Hook Horror · Kuo-toa Monitor · Quaggoth Thonot · Scout Captain · Spectator · Swarm of Lemures · Water Weird · Yeti
- **CR 4:** Aarakocra Aeromancer · Banshee · Bone Naga · Flameskull · Helmed Horror · Swarm of Dretches
- **CR 5:** Barlgura · Cambion · Mezzoloth · Umber Hulk
- **CR 6:** Galeb Duhr · Hobgoblin Warlord · Kuo-toa Archpriest
- **CR 9:** Abominable Yeti · Nycaloth
- **CR 13:** Beholder

## Done: imported from the 2024 Monster Manual (124)

- **CR 0:** Crawling Claw · Larva · Myconid Sprout · Octopus
- **CR 1/8:** Flumph · Manes · Modron Monodrone · Slaad Tadpole · Twig Blight
- **CR 1/4:** Aarakocra Skirmisher · Animated Broom · Bullywug Warrior · Modron Duodrone · Needle Blight · Pixie
- **CR 1/2:** Gas Spore Fungus · Modron Tridrone · Performer · Sahuagin Warrior · Vine Blight
- **CR 1:** Empyrean Iota · Faerie Dragon Youth · Manes Vaporspawn · Modron Quadrone · Ogrillon Ogre · Salamander Fire Snake · Swarm of Larvae · Thri-kreen Marauder · Yuan-ti Infiltrator
- **CR 2:** Faerie Dragon Adult · Githzerai Monk · Gnoll Pack Lord · Lizardfolk Geomancer · Modron Pentadrone · Ogre · Sahuagin Priest
- **CR 3:** Githyanki Warrior · Yuan-ti Malison (Type 1) · Yuan-ti Malison (Type 2) · Yuan-ti Malison (Type 3)
- **CR 4:** Bullywug Bog Sage · Gnoll Fang of Yeenoghu · Juvenile Shadow Dragon · Lizardfolk Sovereign · Shadow Demon
- **CR 5:** Beholder Zombie · Giant Axe Beak · Pixie Wonderbringer · Red Slaad · Revenant · Sahuagin Baron · Salamander · Young Remorhaz
- **CR 6:** Azer Pyromancer · Chasme · Cyclops Sentry · Ghast Gravecaller · Giant Squid · Githzerai Zerth · Merfolk Wavebender · Performer Maestro · Satyr Revelmaster
- **CR 7:** Bandit Deceiver · Blue Slaad · Centaur Warden · Graveyard Revenant · Grick Ancient · Mind Flayer · Primeval Owlbear · Tree Blight · Violet Fungus Necrohulk · Yuan-ti Abomination
- **CR 8:** Aberrant Cultist · Berserker Commander · Cockatrice Regent · Death Cultist · Elemental Cultist · Fiend Cultist · Fomorian · Githyanki Knight · Gnoll Demoniac · Green Slaad · Sphinx of Secrets · Thri-kreen Psion · Vampire Nightbringer
- **CR 9:** Brazen Gorgon · Gray Slaad
- **CR 10:** Cultist Hierophant · Cyclops Oracle · Death Slaad · Dire Worg · Haunting Revenant · Noble Prodigy · Performer Legend · Spy Master · Warrior Commander · Yochlol
- **CR 11:** Bandit Crime Lord · Dao · Death Knight Aspirant · Marid · Mind Flayer Arcanist
- **CR 12:** Arcanaloth · Archpriest · Githzerai Psion · Pirate Admiral · Questing Knight
- **CR 13:** Shadow Dragon · Ultroloth
- **CR 14:** Death Tyrant
- **CR 15:** Salamander Inferno Master · Vampire Umbral Lord
- **CR 16:** Githyanki Dracomancer · Gulthias Blight
- **CR 17:** Death Knight · Dracolich · Goristro
- **CR 18:** Demilich
- **CR 20:** Animal Lord
- **CR 21:** Arch-hag
- **CR 22:** Elemental Cataclysm
- **CR 23:** Blob of Annihilation · Empyrean
- **CR 25:** Colossus


## Not in the 2024 Monster Manual (17)

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
against a source; that none of these are in the 2024 Monster Manual is checked.

## Renamed in 2024: 2014 version removed

Rule: when a monster was renamed in 2024 and the 2024 version is in the list
under its new name, the 2014 template is removed. The 40 below are retired —
gone from the built-in list and listed in `app/data/retiredTemplates.js`, so an
update can never bring them back. The templates route removes a retired
template from `data/templates.json` on every load and save, but only if you
never edited it; an edited copy is kept. No saved encounter used them. Enemies
already in a combat are copies and keep their stats.

Every 2024 rename is now covered — no renamed 2014 template is left.

| 2014 (removed) | 2024 version |
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
| Bullywug | Bullywug Warrior (your import) |
| Duodrone | Modron Duodrone (your import) |
| Tridrone | Modron Tridrone (your import) |
| Quadrone | Modron Quadrone (your import) |
| Pentadrone | Modron Pentadrone (your import) |
| Gas Spore | Gas Spore Fungus (your import) |
| Faerie Dragon (Youth) | Faerie Dragon Youth (your import) |
| Faerie Dragon (Adult) | Faerie Dragon Adult (your import) |
| Fire Snake | Salamander Fire Snake (your import) |
| Half-Ogre | Ogrillon Ogre (your import) |
| Ogrillon | Ogrillon Ogre (your import) |
| Thri-kreen | Thri-kreen Marauder (your import) |
| Yuan-ti Pureblood | Yuan-ti Infiltrator (your import) |
| Sahuagin Priestess | Sahuagin Priest (your import) |
| Yuan-ti Malison | Yuan-ti Malison (Type 1 / 2 / 3) (your imports) |
| Lizardfolk King/Queen | Lizardfolk Sovereign (your import) |
| Cyclops | Cyclops Sentry (your import) |
| Grick Alpha | Grick Ancient (your import) |

Rows without "(your import)" are SRD 5.2.1 built-ins.

## New in 2024, built in from SRD 5.2.1

Archmage, Bugbear Stalker, Goblin Minion, Half-Dragon, Merfolk Skirmisher,
Noble, Pirate Captain, Tough Boss, Warrior Infantry, Werebear; animals Blood
Hawk, Camel, Flying Snake, Giant Crab, Giant Weasel, Mastiff, Mule, Pony,
Venomous Snake — plus the 2024 versions of the renames above.

## How the update protects your edits

The templates migration (`app/api/templates/route.js`; version 13 = 2024 stat
blocks; version 14 = retired built-ins introduced) replaces — or, for a
retired built-in, deletes — a saved built-in **only if it is byte-for-byte the
old default**, checked against fingerprints of every previously shipped
template (`app/data/templateFingerprints.js`). A built-in you edited is kept
exactly as you saved it, without any 2024 fields mixed in. Custom templates are
never touched.

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
