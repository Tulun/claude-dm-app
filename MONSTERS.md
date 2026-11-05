# Monster templates — 2024 coverage and what's missing

Every stat block in the 2024 Monster Manual, checked against what's in the app
(built-ins in [app/data/defaultEnemyTemplates.js](app/data/defaultEnemyTemplates.js)
plus your saved and imported templates in `data/templates.json`). Roster: 503
stat blocks, 5etools `XMM` data. Matched by name, ignoring case and punctuation.
**Snapshot as of 2026-11-05** — you're importing as you go, so counts drift.

## At a glance — all 503 stat blocks in the 2024 Monster Manual

| | Count | What to do |
|---|---|---|
| In the app as a 2024 SRD 5.2.1 built-in | 328 | Nothing |
| In the app, imported by you from the 2024 MM (Source book `MM 2024`) | 42 | Nothing |
| **In the app, but still on older (2014-era) stats** | **68** | Re-import (same name → **Update Existing**) |
| **Not in the app under its 2024 name — renamed from a 2014 monster** | **10** | Import, then retire the 2014 template |
| **Not in the app at all — new in 2024** | **55** | Import |

So **65 to add** and **68 to update**. On top of that, 17 older built-ins have
no 2024 Monster Manual version at all (listed further down) and 8 of your
custom templates (Topiary Golem Ornamental, the Gnoll Abyssal set, Lizardfolk
Bloodeye, etc.) aren't from the Monster Manual.

## How to add or update one

Screenshot its stat block from your Monster Manual on D&D Beyond and drop it
into **Import from Image** (templates library). Set **Source book** to
`MM 2024`. For a same-name monster the import detects the existing template and
offers **Update Existing**. For a renamed one, import it under the 2024 name;
the 2014 template then goes — delete it in the library AND retire its id in
`app/data/retiredTemplates.js`, or a future update re-adds it (see "Renamed in
2024: 2014 version removed" below).

## To add: not in the app (65)

### Renamed from a 2014 monster that's still in the list (10)

| 2024 name to add | CR | Older built-in it replaces |
|---|---|---|
| Ogrillon Ogre | 1 | Half-Ogre, Ogrillon |
| Thri-kreen Marauder | 1 | Thri-kreen |
| Yuan-ti Infiltrator | 1 | Yuan-ti Pureblood |
| Sahuagin Priest | 2 | Sahuagin Priestess |
| Yuan-ti Malison (Type 1) | 3 | Yuan-ti Malison |
| Yuan-ti Malison (Type 2) | 3 | Yuan-ti Malison |
| Yuan-ti Malison (Type 3) | 3 | Yuan-ti Malison |
| Lizardfolk Sovereign | 4 | Lizardfolk King/Queen |
| Cyclops Sentry | 6 | Cyclops |
| Grick Ancient | 7 | Grick Alpha |

The three Yuan-ti Malison types are separate stat blocks in 2024. Half-Ogre and
Ogrillon are the same 2014 creature; both go once Ogrillon Ogre is in. Cyclops
Oracle (CR 10) below is a second 2024 cyclops, not a rename.

### New in 2024 — no older version in the app (55)

| Monster | CR | Size | Type |
|---|---|---|---|
| Crawling Claw | 0 | Tiny | Undead |
| Larva | 0 | Medium | Fiend |
| Flumph | 1/8 | Small | Aberration |
| Manes | 1/8 | Small | Fiend |
| Empyrean Iota | 1 | Medium | Celestial/Fiend |
| Manes Vaporspawn | 1 | Medium | Fiend |
| Beholder Zombie | 5 | Large | Undead |
| Giant Axe Beak | 5 | Huge | Monstrosity |
| Pixie Wonderbringer | 5 | Tiny | Fey |
| Revenant | 5 | Medium | Undead |
| Sahuagin Baron | 5 | Large | Fiend |
| Young Remorhaz | 5 | Large | Monstrosity |
| Azer Pyromancer | 6 | Medium | Elemental |
| Chasme | 6 | Large | Fiend |
| Ghast Gravecaller | 6 | Medium | Undead |
| Giant Squid | 6 | Huge | Beast |
| Merfolk Wavebender | 6 | Medium | Elemental |
| Performer Maestro | 6 | Small or Medium | Humanoid |
| Satyr Revelmaster | 6 | Medium | Fey |
| Bandit Deceiver | 7 | Small or Medium | Humanoid |
| Centaur Warden | 7 | Large | Fey |
| Graveyard Revenant | 7 | Huge | Undead |
| Primeval Owlbear | 7 | Huge | Monstrosity |
| Tree Blight | 7 | Huge | Plant |
| Yuan-ti Abomination | 7 | Large | Monstrosity |
| Aberrant Cultist | 8 | Small or Medium | Humanoid |
| Berserker Commander | 8 | Small or Medium | Humanoid |
| Cockatrice Regent | 8 | Large | Monstrosity |
| Death Cultist | 8 | Small or Medium | Humanoid |
| Elemental Cultist | 8 | Small or Medium | Humanoid |
| Fiend Cultist | 8 | Small or Medium | Humanoid |
| Fomorian | 8 | Huge | Giant |
| Gnoll Demoniac | 8 | Medium | Fiend |
| Sphinx of Secrets | 8 | Large | Celestial |
| Thri-kreen Psion | 8 | Medium | Monstrosity |
| Vampire Nightbringer | 8 | Small or Medium | Undead |
| Brazen Gorgon | 9 | Large | Construct |
| Cultist Hierophant | 10 | Small or Medium | Humanoid |
| Cyclops Oracle | 10 | Huge | Giant |
| Dire Worg | 10 | Huge | Fey |
| Haunting Revenant | 10 | Gargantuan | Undead |
| Noble Prodigy | 10 | Small or Medium | Humanoid |
| Performer Legend | 10 | Small or Medium | Humanoid |
| Spy Master | 10 | Small or Medium | Humanoid |
| Warrior Commander | 10 | Small or Medium | Humanoid |
| Yochlol | 10 | Medium | Fiend |
| Bandit Crime Lord | 11 | Small or Medium | Humanoid |
| Mind Flayer Arcanist | 11 | Medium | Aberration |
| Archpriest | 12 | Small or Medium | Humanoid |
| Pirate Admiral | 12 | Small or Medium | Humanoid |
| Questing Knight | 12 | Small or Medium | Humanoid |
| Shadow Dragon | 13 | Huge | Dragon |
| Salamander Inferno Master | 15 | Large | Elemental |
| Vampire Umbral Lord | 15 | Small or Medium | Undead |
| Animal Lord | 20 | Medium | Celestial |

## To update: in the app, still on older stats (68)

Same name in the 2024 Monster Manual; the app's stat block is the older one.
Beholder was re-imported but has no Source book set, so it can't be told apart
from the old stats — set it to `MM 2024` and it moves to "done".

- **CR 0:** Myconid Sprout
- **CR 1/8:** Twig Blight
- **CR 1/4:** Kenku · Kuo-toa · Mud Mephit · Needle Blight · Pixie · Smoke Mephit · Troglodyte · Winged Kobold
- **CR 1/2:** Jackalwere · Myconid Adult · Performer · Piercer · Vine Blight
- **CR 1:** Kuo-toa Whip · Lacedon Ghoul · Myconid Spore Servant · Psychic Gray Ooze · Scarecrow · Swarm of Larvae
- **CR 2:** Bulette Pup · Carrion Crawler · Gnoll Pack Lord · Intellect Devourer · Lizardfolk Geomancer · Mage Apprentice · Myconid Sovereign · Nothic · Peryton · Poltergeist · Quaggoth · Spined Devil · Swarm of Stirges
- **CR 3:** Displacer Beast · Flaming Skeleton · Goblin Hexer · Grell · Hook Horror · Kuo-toa Monitor · Quaggoth Thonot · Scout Captain · Spectator · Swarm of Lemures · Water Weird · Yeti
- **CR 4:** Aarakocra Aeromancer · Banshee · Bone Naga · Flameskull · Gnoll Fang of Yeenoghu · Helmed Horror · Juvenile Shadow Dragon · Shadow Demon · Swarm of Dretches
- **CR 5:** Barlgura · Cambion · Mezzoloth · Umber Hulk
- **CR 6:** Galeb Duhr · Hobgoblin Warlord · Kuo-toa Archpriest
- **CR 7:** Mind Flayer
- **CR 9:** Abominable Yeti · Nycaloth
- **CR 13:** Beholder
- **CR 16:** Gulthias Blight
- **CR 23:** Empyrean

## Done: imported from the 2024 Monster Manual (42)

- **CR 0:** Octopus
- **CR 1/8:** Modron Monodrone · Slaad Tadpole
- **CR 1/4:** Aarakocra Skirmisher · Animated Broom · Bullywug Warrior · Modron Duodrone
- **CR 1/2:** Gas Spore Fungus · Modron Tridrone
- **CR 1:** Faerie Dragon Youth · Modron Quadrone · Salamander Fire Snake
- **CR 2:** Faerie Dragon Adult · Githzerai Monk · Modron Pentadrone
- **CR 3:** Githyanki Warrior
- **CR 4:** Bullywug Bog Sage
- **CR 5:** Red Slaad · Salamander
- **CR 6:** Githzerai Zerth
- **CR 7:** Blue Slaad · Violet Fungus Necrohulk
- **CR 8:** Githyanki Knight · Green Slaad
- **CR 9:** Gray Slaad
- **CR 10:** Death Slaad
- **CR 11:** Dao · Death Knight Aspirant · Marid
- **CR 12:** Arcanaloth · Githzerai Psion
- **CR 13:** Ultroloth
- **CR 14:** Death Tyrant
- **CR 16:** Githyanki Dracomancer
- **CR 17:** Death Knight · Dracolich · Goristro
- **CR 18:** Demilich
- **CR 21:** Arch-hag
- **CR 22:** Elemental Cataclysm
- **CR 23:** Blob of Annihilation
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
under its new name, the 2014 template is removed. The 31 below are retired —
gone from the built-in list and listed in `app/data/retiredTemplates.js`, so an
update can never bring them back. The templates route removes a retired
template from `data/templates.json` on every load and save, but only if you
never edited it; an edited copy is kept. No saved encounter used them. Enemies
already in a combat are copies and keep their stats.

When you import another renamed monster under its 2024 name, add its 2014 id
to `retiredTemplates.js` (or just delete the 2014 template in the library — but
then a future update would re-add it).

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
