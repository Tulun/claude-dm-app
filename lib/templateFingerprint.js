// Content fingerprint for a monster template, used by the templates-route
// migration to tell an untouched built-in template (safe to replace with a
// newer default) from one the user has edited (must be kept).
//
// Key order and the read-time `source` tag are ignored, so a template that
// round-tripped through the client (which POSTs `source` back) still matches.
import { createHash } from 'node:crypto';

const stable = (v) => {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v)
      .filter(k => v[k] !== undefined)
      .sort()
      .map(k => `${JSON.stringify(k)}:${stable(v[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
};

export const templateFingerprint = (template) => {
  const { source, ...rest } = template;
  return createHash('sha1').update(stable(rest)).digest('hex').slice(0, 16);
};
