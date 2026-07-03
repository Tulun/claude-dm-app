// Keyword highlighting for spell descriptions.
//
// The output is rendered via dangerouslySetInnerHTML, so the input MUST be
// HTML-escaped first — descriptions can contain user-entered or imported text
// (e.g. from the image-parse pipeline), and unescaped markup would execute.

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function formatSpellText(text) {
  return escapeHtml(text)
    .replace(/\b(Sphere|Cube|Cone|Line|Cylinder|Emanation)\b/g, '<span class="text-purple-400 font-semibold">$1</span>')
    .replace(/\b(\d+d\d+)\b/g, '<span class="font-mono text-amber-300">$1</span>')
    .replace(/\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b/g, '<span class="font-semibold">$1</span>')
    .replace(/\b(saving throw|attack roll)\b/gi, '<span class="font-semibold">$1</span>');
}
