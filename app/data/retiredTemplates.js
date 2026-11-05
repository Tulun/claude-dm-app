// Built-in templates that were removed from defaultEnemyTemplates.js, mapped to
// the built-in that replaces them. The templates-route migration drops a saved
// copy of a retired id only when it is an UNEDITED earlier default (fingerprint
// match in templateFingerprints.js); a copy the user edited is kept as-is.
//
// Version 14: 2014 monsters whose renamed 2024 version is also built in
// (see "Renamed in 2024" in MONSTERS.md).
export const RETIRED_DEFAULT_IDS = {
  'mm-acolyte': 'mm-priest-acolyte',
  'mm-azer': 'mm-azer-sentinel',
  'mm-bugbear': 'mm-bugbear-warrior',
  'mm-centaur': 'mm-centaur-trooper',
  'mm-cult-fanatic': 'mm-cultist-fanatic',
  'mm-flying-sword': 'mm-animated-flying-sword',
  'mm-giant-poisonous-snake': 'mm-giant-venomous-snake',
  'mm-gnoll': 'mm-gnoll-warrior',
  'mm-goblin': 'mm-goblin-warrior',
  'mm-gynosphinx': 'mm-sphinx-of-lore',
  'mm-hobgoblin': 'mm-hobgoblin-warrior',
  'mm-kobold': 'mm-kobold-warrior',
  'mm-minotaur': 'mm-minotaur-of-baphomet',
  'mm-quipper': 'mm-piranha',
  'mm-rug-of-smothering': 'mm-animated-rug-of-smothering',
  'mm-sahuagin': 'mm-sahuagin-warrior',
  'mm-shrieker': 'mm-shrieker-fungus',
  'mm-swarm-of-poisonous-snakes': 'mm-swarm-of-venomous-snakes',
  'mm-swarm-of-quippers': 'mm-swarm-of-piranhas',
  'mm-thug': 'mm-tough',
  'mm-veteran': 'mm-warrior-veteran',
  'mm-half-red-dragon-veteran': 'mm-half-dragon',
};
