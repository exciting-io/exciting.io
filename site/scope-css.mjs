// Scope a stylesheet under one selector, so a borrowed world cannot leak into the shell.
// :root, html and body become the scope itself; @media and @supports are scoped inside;
// @font-face urls are made absolute; @keyframes pass through untouched.
const splitTop = s => {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};

const scopeSel = (sel, scope) => {
  if (/^(:root|html|body)$/.test(sel)) return scope;
  const m = sel.match(/^(html[^\s]*|body[^\s]*)\s+(.*)$/);
  if (m) return m[1].startsWith('html') ? `${m[1]} ${scope} ${m[2]}` : `${scope} ${m[2]}`;
  return `${scope} ${sel}`;
};

export function scopeCss(css, scope, { fontBase }) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const walk = str => {
    let out = '';
    let i = 0;
    while (i < str.length) {
      const open = str.indexOf('{', i);
      if (open < 0) break;
      const prelude = str.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < str.length && depth) { if (str[j] === '{') depth += 1; else if (str[j] === '}') depth -= 1; j += 1; }
      const inner = str.slice(open + 1, j - 1);
      if (/^@(media|supports)/.test(prelude)) out += `${prelude} {\n${walk(inner)}}\n`;
      else if (/^@font-face/.test(prelude)) out += `${prelude} {${inner.replace(/url\("\.\.\/fonts\//g, `url("${fontBase}`)}}\n`;
      else if (/^@/.test(prelude)) out += `${prelude} {${inner}}\n`;
      else out += `${splitTop(prelude).map(s => scopeSel(s, scope)).join(',\n')} {${inner}}\n`;
      i = j;
    }
    return out;
  };
  return walk(src).split('\n').map(l => l.replace(/[ \t]+$/, '')).filter(l => l.trim()).join('\n') + '\n';
}
