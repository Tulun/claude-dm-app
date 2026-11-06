// Built-in templates removed from defaultEnemyTemplates.js, mapped to the name
// of the 2024 monster that replaces them. Rule: when a monster was renamed in
// 2024 and the app has it under the 2024 name (built in OR imported), the 2014
// built-in is retired. See "Renamed in 2024: 2014 version removed" in MONSTERS.md.
//
// app/api/templates/route.js drops a saved copy of a retired id on every read
// and write, but only when it is an UNEDITED earlier default (fingerprint match
// in templateFingerprints.js); a copy the user edited is kept as-is.
export const RETIRED_DEFAULT_IDS = {
  // Replaced by a built-in 2024 (SRD 5.2.1) template
  'mm-acolyte': 'Priest Acolyte',
  'mm-azer': 'Azer Sentinel',
  'mm-bugbear': 'Bugbear Warrior',
  'mm-centaur': 'Centaur Trooper',
  'mm-cult-fanatic': 'Cultist Fanatic',
  'mm-flying-sword': 'Animated Flying Sword',
  'mm-giant-poisonous-snake': 'Giant Venomous Snake',
  'mm-gnoll': 'Gnoll Warrior',
  'mm-goblin': 'Goblin Warrior',
  'mm-gynosphinx': 'Sphinx of Lore',
  'mm-hobgoblin': 'Hobgoblin Warrior',
  'mm-kobold': 'Kobold Warrior',
  'mm-minotaur': 'Minotaur of Baphomet',
  'mm-quipper': 'Piranha',
  'mm-rug-of-smothering': 'Animated Rug of Smothering',
  'mm-sahuagin': 'Sahuagin Warrior',
  'mm-shrieker': 'Shrieker Fungus',
  'mm-swarm-of-poisonous-snakes': 'Swarm of Venomous Snakes',
  'mm-swarm-of-quippers': 'Swarm of Piranhas',
  'mm-thug': 'Tough',
  'mm-veteran': 'Warrior Veteran',
  'mm-half-red-dragon-veteran': 'Half-Dragon',
  // Replaced by the user's own import of the 2024 Monster Manual block
  'mm-bullywug': 'Bullywug Warrior',
  'mm-modron-duodrone': 'Modron Duodrone',
  'mm-modron-tridrone': 'Modron Tridrone',
  'mm-modron-quadrone': 'Modron Quadrone',
  'mm-modron-pentadrone': 'Modron Pentadrone',
  'mm-gas-spore': 'Gas Spore Fungus',
  'mm-faerie-dragon-youth': 'Faerie Dragon Youth',
  'mm-faerie-dragon-adult': 'Faerie Dragon Adult',
  'mm-faerie-dragon-older': 'Faerie Dragon Adult', // green/blue/indigo/violet → Adult (D&D Beyond conversions table)
  'mm-fire-snake': 'Salamander Fire Snake',
  'mm-half-ogre': 'Ogrillon Ogre',
  'mm-ogrillon': 'Ogrillon Ogre',
  'mm-thri-kreen': 'Thri-kreen Marauder',
  'mm-yuan-ti-pureblood': 'Yuan-ti Infiltrator',
  'mm-sahuagin-priestess': 'Sahuagin Priest',
  'mm-yuan-ti-malison': 'Yuan-ti Malison (Type 1 / 2 / 3)',
  'mm-lizard-king': 'Lizardfolk Sovereign',
  'mm-cyclops': 'Cyclops Sentry',
  'mm-grick-alpha': 'Grick Ancient',
};
