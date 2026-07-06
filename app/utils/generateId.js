// Collision-safe entity ids: `${prefix}-<timestamp>-<random>`.
// A bare Date.now() id collides when entities are created in the same
// millisecond (e.g. in a loop) — always include the random suffix.
export const generateId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
