'use client';

// Minimal markdown → React renderer for Obsidian notes. Builds React nodes
// directly — no dangerouslySetInnerHTML (the app's single sanctioned sink is
// the spellbook; see frontend-patterns). Covers what the vault actually uses:
// headings, bold/italic, inline code, lists, blockquotes, rules, wikilinks.

const HEADING_STYLES = {
  1: 'text-2xl font-bold text-amber-400 mt-6 mb-3',
  2: 'text-xl font-bold text-amber-400 mt-5 mb-2',
  3: 'text-lg font-semibold text-amber-300 mt-4 mb-2',
  4: 'text-base font-semibold text-amber-300 mt-3 mb-1',
  5: 'text-sm font-semibold text-amber-200 mt-3 mb-1',
  6: 'text-sm font-semibold text-stone-300 mt-3 mb-1',
};

const INLINE_RE = /(!\[\[[^\]]+\]\])|(\[\[[^\]]+\]\])|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))/g;

function renderInline(text, { notesByName, onOpenNote }, keyPrefix) {
  const nodes = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(INLINE_RE)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;

    if (token.startsWith('![[')) {
      // Embedded file (image/note transclusion) — show a placeholder, don't fetch.
      nodes.push(
        <span key={key} className="text-stone-500 italic">[embed: {token.slice(3, -2)}]</span>
      );
    } else if (token.startsWith('[[')) {
      const inner = token.slice(2, -2);
      const [targetRaw, alias] = inner.split('|');
      const target = targetRaw.split('#')[0].trim();
      const label = (alias || targetRaw).trim();
      const notePath = notesByName?.get(target.toLowerCase());
      if (notePath && onOpenNote) {
        nodes.push(
          <button
            key={key}
            onClick={() => onOpenNote(notePath)}
            className="text-purple-400 hover:text-purple-300 underline decoration-purple-700 underline-offset-2"
          >
            {label}
          </button>
        );
      } else {
        nodes.push(<span key={key} className="text-purple-400/60">{label}</span>);
      }
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={key} className="font-semibold text-stone-50">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key} className="bg-stone-800 px-1 rounded text-amber-200 text-sm">{token.slice(1, -1)}</code>);
    } else {
      // [text](url) — only link out to http(s); anything else renders as text.
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const [, label, href] = linkMatch;
      if (/^https?:\/\//i.test(href)) {
        nodes.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
            {label}
          </a>
        );
      } else {
        nodes.push(label);
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function stripFrontmatter(content) {
  if (!content.startsWith('---')) return content;
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return content;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return lines.slice(i + 1).join('\n');
  }
  return content;
}

export default function VaultMarkdown({ content, notesByName, onOpenNote }) {
  const ctx = { notesByName, onOpenNote };
  const lines = stripFrontmatter(content || '').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null; // { ordered, items: [] }

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const key = `p-${blocks.length}`;
    blocks.push(
      <p key={key} className="text-stone-300 leading-relaxed mb-3">
        {paragraph.map((line, idx) => (
          <span key={idx}>
            {idx > 0 && ' '}
            {renderInline(line, ctx, `${key}-${idx}`)}
          </span>
        ))}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const key = `l-${blocks.length}`;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={key} className={`${list.ordered ? 'list-decimal' : 'list-disc'} pl-6 mb-3 text-stone-300 space-y-1`}>
        {list.items.map((item, idx) => (
          <li key={idx}>{renderInline(item, ctx, `${key}-${idx}`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((rawLine, lineNo) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const HeadingTag = `h${level}`;
      blocks.push(
        <HeadingTag key={`h-${lineNo}`} className={HEADING_STYLES[level]}>
          {renderInline(heading[2], ctx, `h-${lineNo}`)}
        </HeadingTag>
      );
      return;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(<hr key={`hr-${lineNo}`} className="border-stone-700 my-4" />);
      return;
    }

    if (line.startsWith('>')) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote key={`q-${lineNo}`} className="border-l-2 border-amber-700 pl-3 text-stone-400 italic mb-3">
          {renderInline(line.replace(/^>\s?/, ''), ctx, `q-${lineNo}`)}
        </blockquote>
      );
      return;
    }

    const unordered = /^[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push((unordered || ordered)[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return <div>{blocks}</div>;
}
