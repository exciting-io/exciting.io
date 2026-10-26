// exciting.io: the static site generator.
// Zero dependencies. Run with: node site/build.mjs (or rake build). Writes into ../_site.
// Posts and projects live in site/content.json. Every page is calm by default; a project
// may bring its own design through projectRenderers (Printer, Jelly and Harmonia do).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderManualPrinter } from './renderers/manual-printer.mjs';
import { renderJellyThread } from './renderers/jelly-thread.mjs';
import { renderHarmoniaDashboard } from './renderers/harmonia-dashboard.mjs';
import { scopeCss } from './scope-css.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, '_site');
const ORIGIN = 'https://exciting.io';
const C = JSON.parse(readFileSync(join(HERE, 'content.json'), 'utf8'));
const DIMS = JSON.parse(readFileSync(join(HERE, 'image-dims.json'), 'utf8'));
for (const p of C.projects) for (const im of p.images || []) DIMS[im.src] = [im.width, im.height];
const u = p => p;

// ------------------------------------------------------------ helpers
const text = h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const attrEsc = s => s.replace(/&(?![a-z]+;|#\d+;)/gi, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const attr = (tag, name) => {
  const m = (' ' + tag).match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : '';
};
const fmtInt = n => n.toLocaleString('en-GB');
const minutes = words => Math.max(1, Math.ceil(words / 230));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

function rw(h) {
  const m = h.match(/^https?:\/\/(?:www\.)?exciting\.io(\/.*)?$/);
  if (m) h = m[1] || '/';
  if (h.startsWith('//')) return 'https:' + h;
  if (!h.startsWith('/') || h.startsWith('/images/') || h.startsWith('/feed.xml')) return h;
  const [p, hash = ''] = h.split('#');
  let q = p;
  if (!/\.[a-z0-9]+$/i.test(q) && !q.endsWith('/')) q += '/';
  return q + (hash ? '#' + hash : '');
}
const rewriteLinks = html => html.replace(/href="([^"]*)"/g, (m, h) => `href="${rw(h)}"`);

// drawn icons, one stroke weight
const ICON = {
  arrow: '<svg class="i i-r" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 4l4 4-4 4"/></svg>',
  back: '<svg class="i i-l" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M13.5 8H3M7 4 3 8l4 4"/></svg>',
  out: '<svg class="i i-r" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 11 11.5 4.5M6 4.5h5.5V10"/></svg>',
  up: '<svg class="i" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 13V3.5M4 7.5l4-4 4 4"/></svg>',
  play: '<svg class="i i-play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10.25"/><path d="M10 8.25v7.5L15.75 12z"/></svg>'
};

// ------------------------------------------------------------ data
// order is the order of content.projects: Jelly, Harmonia, Printer, HeyLi.st
const projects = C.projects;
const jelly = projects.find(p => p.flagship);
const retired = p => p.status === 'retired';
const nameHtml = p => retired(p) ? `${p.name} <span class="status">(retired)</span>` : p.name;
const nameText = p => retired(p) ? `${p.name} (retired)` : p.name;
const live = p => p.status === 'live';
// a live project says where it still runs, linking the address its note names
const liveNote = (p, cls = 'proj-status') => {
  if (!live(p) || !p.statusNote) return '';
  const m = p.statusNote.match(/at ([a-z0-9.-]+\.[a-z]{2,})\.?$/i);
  if (!m) return `<p class="${cls}">${p.statusNote}</p>`;
  const short = cls === 'proj-status' ? `Still running at <a href="https://${m[1]}/">${m[1]}</a>` : p.statusNote.replace(m[1], `<a href="https://${m[1]}/">${m[1]}</a>`);
  return `<p class="${cls}">${short}</p>`;
};
// Printer's later life, findable from wherever Printer is listed
const laterNote = p => p.updates && p.updates.length ? `<p class="proj-later">Later, <a href="${u(p.url)}#guestbook">the engine of Good Enough’s guestbook</a>.</p>` : '';
const posts = C.posts; // newest first
const lines = C.home.workTaglines;
const isExternal = h => /^https?:/.test(h);

// ------------------------------------------------------------ figures
const dimsOf = src => DIMS[src] || DIMS[decodeURI(src)] || [640, 480];
let eagerLeft = 0;

function img(src, alt, { sizes = '' } = {}) {
  const [w, h] = dimsOf(src);
  const eager = eagerLeft > 0;
  if (eager) eagerLeft -= 1;
  return `<img src="${src}" alt="${attrEsc(alt)}" width="${w}" height="${h}"${eager ? '' : ' loading="lazy"'} decoding="async"${sizes}>`;
}

function figure({ src, alt = '', cap = '', href = '' }) {
  const [w, h] = dimsOf(src);
  const pic = img(src, alt);
  const inner = href ? `<a class="fig-link" href="${href}">${pic}</a>` : pic;
  return `<figure class="fig" style="--w:${w};--h:${h}">${inner}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
}

// alt text becomes a caption when it says more than a single word
const captionFor = alt => (alt && /\s/.test(alt.trim()) ? alt : '');

function embed(src) {
  const full = src.startsWith('//') ? 'https:' + src : src;
  const host = new URL(full).hostname.replace(/^(www|embed)\./, '');
  let link = full;
  let kind = 'A video';
  const ted = full.match(/embed\.ted\.com\/talks\/(.+)\.html/);
  if (ted) { link = `https://www.ted.com/talks/${ted[1]}`; kind = 'A talk'; }
  const ks = full.match(/^(https:\/\/www\.kickstarter\.com\/projects\/[^/]+\/[^/]+)/);
  if (ks) link = ks[1];
  if (host.includes('instagram')) { link = full.replace(/embed\/?$/, ''); kind = 'A photograph'; }
  return `<figure class="embed"><a href="${link}">${ICON.play}<span><span class="embed-t">${kind} on ${host}</span><span class="embed-s">Embedded in the original post. Open it there.</span></span></a></figure>`;
}

function printoutDate(src) {
  const m = src.match(/(\d{4})-(\d{2})-(\d{2})\.png$/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : '';
}

// group runs of figures into rows that share a height and never upscale
function row(figs) {
  const meta = figs.map(f => {
    const w = Number(f.match(/--w:(\d+)/)[1]);
    const h = Number(f.match(/--h:(\d+)/)[1]);
    return { w, h };
  });
  const H = Math.min(...meta.map(m => m.h));
  const natural = Math.round(meta.reduce((s, m) => s + m.w * H / m.h, 0));
  const anyLandscape = meta.some(m => m.w / m.h > 1.05);
  const items = figs.map((f, i) => f.replace(/style="([^"]*)"/, (m, s) => `style="${s};--ar:${(meta[i].w / meta[i].h).toFixed(4)}"`));
  return `<div class="figs${anyLandscape ? ' figs-stack' : ''}" style="--row:${natural + (figs.length - 1) * 24}px">${items.join('')}</div>`;
}

function processBody(html, { eager = 2, projectStandfirst = false } = {}) {
  let h = html;
  eagerLeft = eager;
  h = h.replace(/<style[\s\S]*?<\/style>\s*/g, '');
  h = h.replace(/<script[\s\S]*?<\/script>\s*/g, '');
  h = h.replace(/<(\/?)tt>/g, '<$1code>').replace(/<(\/?)strike>/g, '<$1s>');
  h = h.replace(/<blockquote class="twitter-tweet"[^>]*>/g, '<blockquote class="tweet">');
  // keep the outline whole: no h3 may follow the page's h1 without an h2
  if (!/<h2[\s>]/.test(h)) h = h.replace(/<(\/?)h3([\s>])/g, '<$1h2$2');
  else {
    const first = h.search(/<h2[\s>]/);
    h = h.slice(0, first).replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/g, '<h2 class="minor"$1>$2</h2>') + h.slice(first);
  }

  // standfirst: leading headings on a project page echo its title
  let standfirst = '';
  if (projectStandfirst) {
    h = h.replace(/^\s*((?:<h[23][^>]*>[\s\S]*?<\/h[23]>\s*)+)/, (m, hs) => {
      standfirst = [...hs.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/g)].map(x => x[2]).join(' ');
      return '';
    });
  }

  // footnotes
  const notes = {};
  h = h.replace(/<div class="footnotes"[\s\S]*?<\/ol>\s*<\/div>/, block => {
    for (const m of block.matchAll(/<li id="fn:([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)) {
      notes[m[1]] = m[2].replace(/\s*<a href="#fnref:[^"]*"[^>]*>[\s\S]*?<\/a>/g, '').replace(/<\/?p>/g, '').trim();
    }
    return '<!--NOTES-->';
  });
  const order = [];
  h = h.replace(/<sup id="fnref:([^"]+)"[^>]*>\s*<a href="#fn:[^"]+"[^>]*>(\d+)<\/a>\s*<\/sup>/g, (m, id, n) => {
    order.push([id, n]);
    return `<sup class="fn" id="fnref:${id}"><a href="#fn:${id}" aria-label="Note ${n}">${n}</a></sup>`;
  });

  // headings carrying images (Printer questions), printouts, images in paragraphs, embeds
  const tokens = /<(h[23])([^>]*)>([\s\S]*?)<\/\1>|<div class="printouts">([\s\S]*?)<\/div>|<p>\s*(?:<a ([^>]*)>\s*)?(<img [^>]*>)\s*(?:<\/a>\s*)?<\/p>|<iframe ([^>]*)>[\s\S]*?<\/iframe>/g;
  h = h.replace(tokens, (m, tag, attrs, inner, printouts, aAttrs, im, ifr) => {
    if (tag) {
      const imgs = [...inner.matchAll(/<img [^>]*>/g)].map(x => x[0]);
      if (!imgs.length) return m;
      const label = inner.replace(/<img [^>]*>/g, t => `“${attr(t, 'alt')}”`);
      const figs = imgs.map(t => figure({ src: attr(t, 'src'), alt: 'The question as printed: ' + attr(t, 'alt') }));
      return `<${tag}${attrs}>${label}</${tag}>\n${figs.join('')}`;
    }
    if (printouts !== undefined) {
      const list = [...printouts.matchAll(/<img [^>]*>/g)].map(x => {
        const src = attr(x[0], 'src');
        const d = printoutDate(src);
        const pic = img(src, d ? `Little Printer printout, ${d} 2014` : 'Little Printer printout');
        return `<li><a href="${src}">${pic}<span class="po-d">${d}</span></a></li>`;
      });
      return `<ul class="printouts" aria-label="Printouts">${list.join('')}</ul>`;
    }
    if (im) {
      const href = aAttrs ? attr(aAttrs, 'href') : '';
      const alt = attr(im, 'alt');
      return figure({ src: attr(im, 'src'), alt, cap: captionFor(alt), href });
    }
    if (ifr !== undefined) return embed(attr(ifr, 'src'));
    return m;
  });

  // rows of consecutive figures
  const FIG = /<figure class="fig"[^>]*>(?:(?!<\/figure>)[\s\S])*<\/figure>/g;
  h = h.replace(/(?:<figure class="fig"[^>]*>(?:(?!<\/figure>)[\s\S])*<\/figure>\s*){2,}/g, run => {
    const figs = run.match(FIG);
    const out = [];
    const n = figs.length;
    const sizes = n <= 3 ? [n] : n === 4 ? [2, 2] : [];
    if (!sizes.length) {
      let left = n;
      while (left > 0) {
        const take = left === 4 ? 2 : Math.min(3, left);
        sizes.push(take);
        left -= take;
      }
    }
    let at = 0;
    for (const s of sizes) {
      const chunk = figs.slice(at, at + s);
      at += s;
      out.push(chunk.length > 1 ? row(chunk) : chunk[0]);
    }
    return out.join('\n') + '\n';
  });

  h = h.replace(/<p>\s*<\/p>/g, '');
  if (order.length) {
    const list = order.map(([id, n]) => `<li id="fn:${id}"><p>${notes[id] || ''} <a class="fn-back" href="#fnref:${id}" aria-label="Back to note ${n} in the text">${ICON.up}</a></p></li>`).join('\n');
    h = h.replace('<!--NOTES-->', `<section class="notes" aria-labelledby="notes-h">\n<h2 id="notes-h">Notes</h2>\n<ol>\n${list}\n</ol>\n</section>`);
  }
  h = h.replace('<!--NOTES-->', '');
  h = rewriteLinks(h);
  // remove blank lines that only held whitespace, collapse runs of blank lines
  h = h.replace(/\n[ \t]+\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim();
  return { html: h, standfirst };
}

// ------------------------------------------------------------ shell
const NAV = [
  { key: 'work', label: 'Work', href: u('/projects/') },
  { key: 'writing', label: 'Writing', href: u('/blog/') },
  { key: 'about', label: 'About', href: u('/about/') }
];

function page({ title, desc, active = '', main, cls = '', styles = [u('/assets/calm.css')], scripts = [] }) {
  const nav = NAV.map(n => `<li><a href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('');
  const fullTitle = title ? `${title} · Exciting` : 'Exciting';
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${attrEsc(desc)}">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#fcfdfe">
<link rel="preload" href="${u('/fonts/literata-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/BrandonGrotesque-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${u('/assets/shell.css')}">
${styles.map(h => `<link rel="stylesheet" href="${h}">`).join('\n')}
<link rel="alternate" type="application/rss+xml" title="Exciting" href="/feed.xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="${u('/assets/mark.svg')}" type="image/svg+xml">
<link rel="canonical" href="__CANONICAL__">
</head>
<body${cls ? ` class="${cls}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head wrap">
<a class="mark" href="${u('/')}" aria-label="Exciting, home"><span aria-hidden="true">E<span class="kx">x</span>citing</span></a>
<nav aria-label="Site"><ul>${nav}</ul></nav>
</header>
<main id="main">
${main}
</main>
<footer class="site-foot wrap cols">
<p class="rail foot-place">Exciting, London</p>
<div class="main">
<p class="foot-hello">Write to <a href="mailto:${C.site.email}">${C.site.email}</a></p>
<ul class="foot-links">
<li><a href="${u('/projects/')}">Work</a></li>
<li><a href="${u('/blog/')}">Writing</a></li>
<li><a href="${u('/about/')}">About</a></li>
<li><a href="/feed.xml">RSS feed</a></li>
</ul>
</div>
</footer>
${scripts.map(h => `<script src="${h}" defer></script>`).join('\n')}
</body>
</html>
`;
}

function write(rel, html) {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  const path = '/' + rel.replace(/index\.html$/, '');
  const out = html.replace('__CANONICAL__', ORIGIN + path).replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');
  writeFileSync(file, out);
}

// ------------------------------------------------------------ output folder
// _site is rebuilt from scratch: generated pages, plus the static files the server needs.
const KEEP_FROM_ROOT = ['CHECKS', 'Rakefile', 'favicon.ico', 'keybase.txt', 'google2bf4185517912aa8.html'];
const notJunk = src => !/(^|\/)\.DS_Store$/.test(src);

function prepareOut() {
  mkdirSync(OUT, { recursive: true });
  for (const name of readdirSync(OUT)) rmSync(join(OUT, name), { recursive: true, force: true });
  for (const f of KEEP_FROM_ROOT) if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(OUT, f));
  cpSync(join(ROOT, 'images'), join(OUT, 'images'), { recursive: true, filter: notJunk });
  cpSync(join(HERE, 'fonts'), join(OUT, 'fonts'), { recursive: true, filter: notJunk });
  cpSync(join(HERE, 'assets'), join(OUT, 'assets'), { recursive: true, filter: notJunk });
}

// ------------------------------------------------------------ components
const firstPara = html => {
  const m = html.match(/<p>((?:(?!<\/p>)[\s\S])*?)<\/p>/g) || [];
  const p = m.find(x => !/<img/.test(x)) || '';
  return p.replace(/<\/?p>/g, '');
};
const unlink = h => h.replace(/<a [^>]*>([\s\S]*?)<\/a>/g, '$1');

const strawberry = (size = 180, eager = true) => `<img class="berry" src="${jelly.logo.src}" alt="Jelly’s mascot, a hand-drawn strawberry" width="${jelly.logo.width}" height="${jelly.logo.height}"${eager ? '' : ' loading="lazy"'} decoding="async" style="--size:${size}px">`;

function jellyFeature(level = 'h2') {
  const desc = unlink(firstPara(jelly.bodyHtml));
  const shot = (jelly.images || [])[0];
  const page = u('/jelly/');
  const shotHtml = shot ? `\n<figure class="jb-shot"><a href="${page}" tabindex="-1" aria-hidden="true"><img src="${shot.src}" alt="" width="${shot.width}" height="${shot.height}" decoding="async"></a></figure>` : '';
  return `<section class="jelly-band${shot ? ' has-shot' : ''}" aria-labelledby="jelly-h">
<div class="cols">
<div class="rail jb-mark"><a href="${page}" tabindex="-1" aria-hidden="true">${strawberry()}</a></div>
<div class="main jb-text">
<${level} class="jb-name" id="jelly-h"><a href="${page}">${jelly.name}</a></${level}>
<p class="jb-tag">${lines.jelly}</p>
<p class="jb-desc">${desc}</p>
<p class="actions"><a class="btn" href="${attrEsc(jelly.primaryLink.href)}">${jelly.primaryLink.label}${ICON.arrow}</a><a class="quiet" href="${page}">More about Jelly</a></p>
</div>${shotHtml}
</div>
</section>`;
}

const projImg = (p, eager = false) => {
  const [w, h] = dimsOf(p.bannerImage);
  return `<img src="${p.bannerImage}" alt="" width="${w}" height="${h}"${eager ? '' : ' loading="lazy"'} decoding="async">`;
};

function earlierWork(pageLevel = false) {
  const [lead, ...rest] = projects.filter(p => !p.flagship);
  const H = pageLevel ? 'h2' : 'h3';
  const item = (p, cls, eager) => `<article class="proj ${cls}">
<a class="proj-img" href="${u(p.url)}" tabindex="-1" aria-hidden="true">${projImg(p, eager)}</a>
<div class="proj-text">
<${H} class="proj-name"><a href="${u(p.url)}">${nameHtml(p)}</a></${H}>
<p class="proj-line">${lines[p.slug]}</p>
${liveNote(p)}${laterNote(p)}<p class="proj-more"><a href="${u(p.url)}">Read about ${p.name}${ICON.arrow}</a></p>
</div>
</article>`;
  return `${item(lead, 'proj-lead', true)}
<div class="proj-pair">
${rest.map(p => item(p, 'proj-small')).join('\n')}
</div>`;
}

const byYear = () => {
  const groups = [];
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    if (!groups.length || groups[groups.length - 1].y !== y) groups.push({ y, items: [] });
    groups[groups.length - 1].items.push(p);
  }
  return groups;
};

function writingList() {
  return `<div class="yearlist">
${byYear().map(g => `<div class="yr-group">
<h3 class="yr">${g.y}</h3>
<ul>
${g.items.map(p => `<li><a href="${u(p.url)}">${p.title}</a><span class="rt">${minutes(p.wordCount)} min</span></li>`).join('\n')}
</ul>
</div>`).join('\n')}
</div>`;
}

// ------------------------------------------------------------ pages
function home() {
  const main = `<div class="wrap">
<h1 class="studio">${C.site.strapline}</h1>
${jellyFeature('h2')}
<section class="cols section work-home" aria-labelledby="work-h">
<h2 class="rail section-h" id="work-h">Other projects</h2>
<div class="main">
${earlierWork()}
</div>
</section>
<section class="cols section" aria-labelledby="writing-h">
<h2 class="rail section-h" id="writing-h"><a href="${u('/blog/')}">Writing</a></h2>
<div class="main">
${writingList()}
</div>
</section>
</div>`;
  write('index.html', page({ title: '', desc: C.site.strapline, main, cls: 'home' }));
}

function about() {
  const main = `<div class="wrap">
<div class="cols page-head">
<div class="main">
<h1 class="title">About</h1>
</div>
</div>
<div class="cols">
<div class="main prose about">
${C.about.bodyHtml}
<h2>Now</h2>
<p>${unlink(firstPara(jelly.bodyHtml))} <a href="${u('/jelly/')}">More about Jelly</a>.</p>
</div>
</div>
</div>`;
  write('about/index.html', page({ title: 'About', desc: text(C.about.bodyHtml), active: 'about', main }));
}

// a paragraph that stops on a colon promises a list it cannot show here
function workDesc(p) {
  const { html, standfirst } = processBody(p.bodyHtml, { projectStandfirst: true, eager: 0 });
  const para = unlink(firstPara(html));
  return /:\s*$/.test(text(para)) && standfirst ? unlink(standfirst) : para;
}

function projectsIndex() {
  const rows = projects.slice(1).map((p, i) => `<article class="cols work-row">
<div class="main work-row-inner">
<a class="proj-img" href="${u(p.url)}" tabindex="-1" aria-hidden="true">${projImg(p, i === 0)}</a>
<div class="proj-text">
<h2 class="proj-name"><a href="${u(p.url)}">${nameHtml(p)}</a></h2>
<p class="proj-line">${lines[p.slug]}</p>
${liveNote(p)}${laterNote(p)}
<p class="proj-desc">${workDesc(p)}</p>
<p class="proj-more"><a href="${u(p.url)}">Read about ${p.name}${ICON.arrow}</a></p>
</div>
</div>
</article>`).join('\n');
  const main = `<div class="wrap">
<div class="cols page-head page-head-band">
<div class="main">
<h1 class="title">Work</h1>
</div>
</div>
${jellyFeature('h2')}
<section class="section" aria-labelledby="earlier-h">
<div class="cols"><h2 class="rail section-h" id="earlier-h">Other projects</h2></div>
${rows}
</section>
</div>`;
  write('projects/index.html', page({ title: 'Work', desc: 'Jelly, and Exciting’s other projects: Harmonia, Printer and HeyLi.st.', active: 'work', main }));
}

// image sequences drawn from the writing about each project
const SEQUENCES = {
  printer: { post: 'hello-printer', pick: ['4-simple-graphics.jpg', '6-longer-graphics.jpg', '8-graphics-test.jpg', '11-sudoku.jpg', '17-simple-publication.jpg', '21-simple-messages.jpg'] },
  heylist: { post: 'introducing-heylist', pick: ['heylist.png', 'heylist-lists.png'] }
};

function sequence(slug) {
  const s = SEQUENCES[slug];
  if (!s) return '';
  const post = posts.find(p => p.slug === s.post);
  const all = [...post.bodyHtml.matchAll(/<img [^>]*>/g)].map(m => ({ src: attr(m[0], 'src'), alt: attr(m[0], 'alt') }));
  const chosen = s.pick.map(f => all.find(a => a.src.endsWith('/' + f))).filter(Boolean);
  const items = chosen.map(a => {
    const [w, h] = dimsOf(a.src);
    return `<li><figure>${img(a.src, a.alt)}<figcaption>${a.alt}</figcaption></figure></li>`;
  }).join('\n');
  return `<section class="seq" aria-labelledby="seq-h">
<h2 id="seq-h">From “<a href="${u(post.url)}">${post.title}</a>”</h2>
<ul class="seq-list${chosen.length < 4 ? ' seq-few' : ''}">
${items}
</ul>
</section>`;
}

function project(p, i) {
  const isJelly = p.slug === 'jelly';
  let { html, standfirst } = processBody(p.bodyHtml, { projectStandfirst: !isJelly, eager: 1 });
  // Jelly: the app at work, captioned from its own alt text, after the paragraph that names what it does
  let jellyLead = '';
  if (isJelly && p.images && p.images.length) {
    const shotFig = (im, cls, eager) => `<figure class="${cls}"><a class="fig-link" href="${im.src}"><img src="${im.src}" alt="${attrEsc(im.alt)}" width="${im.width}" height="${im.height}"${eager ? '' : ' loading="lazy"'} decoding="async"></a><figcaption>${im.alt}</figcaption></figure>`;
    const [first, ...others] = p.images;
    jellyLead = `<div class="cols">\n${shotFig(first, 'main lead-fig shot', true).replace('<figure class="main lead-fig shot">', `<figure class="main lead-fig shot" style="--w:${first.width}">`)}\n</div>`;
    if (others.length) {
      const at = html.search(/<h2[\s>]/);
      const block = `<ul class="shots">\n${others.map(im => `<li>${shotFig(im, 'shot', false)}</li>`).join('\n')}\n</ul>\n`;
      html = at > -1 ? html.slice(0, at) + block + html.slice(at) : html + '\n' + block;
    }
  }
  // the Printer body opens with a smaller photograph of the lead image's scene
  if (p.slug === 'printer') html = html.replace(/^<figure class="fig"[^>]*><img src="\/images\/printer\/printer\.jpg"[\s\S]*?<\/figure>\s*/, '');
  const next = projects[(i + 1) % projects.length];
  const related = posts.filter(q => q.tags.includes(p.slug));
  const links = p.links.filter(l => !/twitter\.com/.test(l.href) && !(isJelly && l.label === jelly.primaryLink.label));
  const linksHtml = links.length ? `<section class="links-block" aria-labelledby="links-h">
<h2 id="links-h">Links</h2>
<ul class="links">
${links.map(l => `<li><a href="${isExternal(l.href) ? attrEsc(l.href) : u(l.href)}">${l.label}${retired(p) ? ' <span class="status">(retired)</span>' : ''}${ICON.out}</a></li>`).join('\n')}
</ul>
</section>` : '';
  const relatedHtml = related.length ? `<section class="related" aria-labelledby="rel-h">
<h2 id="rel-h">Writing about ${p.name}</h2>
<ul class="rel-list">
${related.map(q => `<li><a href="${u(q.url)}">${q.title}</a><span class="rt">${q.date.slice(0, 4)}</span></li>`).join('\n')}
</ul>
</section>` : '';

  const updatesHtml = (p.updates || []).map((up, k) => `<section class="update" id="${k ? `guestbook-${k + 1}` : 'guestbook'}" aria-labelledby="up-h-${k}">
<h2 id="up-h-${k}">${up.title}</h2>
${rewriteLinks(up.html)}
<ul class="update-links">
${up.links.map(l => `<li><a href="${attrEsc(l.href)}">${l.label}${ICON.out}</a><span class="update-src">${l.source}</span></li>`).join('\n')}
</ul>
</section>
`).join('');
  let head;
  if (isJelly) {
    head = `<section class="jelly-band jelly-head" aria-labelledby="jelly-h">
<div class="cols">
<div class="rail jb-mark">${strawberry()}</div>
<div class="main jb-text">
<p class="crumb"><a href="${u('/projects/')}">${ICON.back}Work</a></p>
<h1 class="title jb-name" id="jelly-h">${p.name}</h1>
<p class="standfirst">${p.tagline}</p>
<p class="actions"><a class="btn" href="${attrEsc(p.primaryLink.href)}">${p.primaryLink.label}${ICON.arrow}</a><a class="quiet" href="${attrEsc(p.links[1].href)}">${p.links[1].label}</a></p>
</div>
</div>
</section>
${jellyLead}`;
  } else {
    const [w, h] = dimsOf(p.bannerImage);
    head = `<div class="cols page-head">
<div class="main">
<p class="crumb"><a href="${u('/projects/')}">${ICON.back}Work</a></p>
<h1 class="title">${p.name}</h1>
<p class="standfirst">${unlink(standfirst) || lines[p.slug]}</p>
${retired(p) ? `<p class="status-note">${p.statusNote}</p>` : liveNote(p, 'status-note')}
</div>
</div>
<div class="cols">
<figure class="main lead-fig" style="--w:${w}">${projImg(p, true).replace('alt=""', `alt="${attrEsc(p.name)}, photographed"`)}</figure>
</div>`;
  }
  const main = `<div class="wrap${isJelly ? ' is-jelly' : ''}">
<article>
${head}
<div class="cols body-cols">
<div class="main prose">
${updatesHtml}${html}
${sequence(p.slug)}
${linksHtml}
${relatedHtml}
</div>
</div>
</article>
<nav class="cols pager" aria-label="Next project">
<div class="main"><a class="pager-next" href="${u(next.url)}"><span class="pager-k">Next project</span><span class="pager-t">${nameText(next)}${ICON.arrow}</span></a></div>
</nav>
</div>`;
  write(`${p.slug}/index.html`, page({ title: nameText(p), desc: `${nameText(p)}: ${lines[p.slug]}`, active: 'work', main, cls: isJelly ? 'jelly' : '' }));
}

// printouts are white paper on white: they say nothing at thumbnail size
const NO_THUMB = ['a-little-printer-mystery'];

function blogIndex() {
  const groups = byYear();
  const entry = p => {
    const lead = NO_THUMB.includes(p.slug) ? '' : p.images[0] || p.bannerImage;
    const ex = text(firstPara(p.excerptHtml));
    const short = ex.length > 220 ? ex.slice(0, ex.lastIndexOf(' ', 210)).replace(/[,;:.]$/, '') + '…' : ex;
    eagerLeft = 0;
    return `<li class="entry">
<div class="entry-text">
<h3 class="entry-t"><a href="${u(p.url)}">${p.title}</a></h3>
<p class="entry-meta"><time datetime="${p.date}">${longDate(p.date)}</time><span>${minutes(p.wordCount)} min read</span></p>
<p class="entry-ex">${short}</p>
</div>
${lead ? `<a class="entry-img" href="${u(p.url)}" tabindex="-1" aria-hidden="true">${img(lead, '')}</a>` : ''}
</li>`;
  };
  const main = `<div class="wrap">
<div class="cols page-head">
<div class="main">
<h1 class="title">Writing</h1>
</div>
</div>
${groups.map(g => `<section class="cols yr-section" aria-labelledby="y${g.y}">
<h2 class="rail yr-big" id="y${g.y}">${g.y}</h2>
<ul class="main entries">
${g.items.map(entry).join('\n')}
</ul>
</section>`).join('\n')}
</div>`;
  write('blog/index.html', page({ title: 'Writing', desc: 'Writing from Exciting.', active: 'writing', main }));
}

function post(p, i) {
  const { html } = processBody(p.bodyHtml, { eager: 2 });
  const older = posts[i + 1];
  const newer = posts[i - 1];
  const proj = projects.find(q => p.tags.includes(q.slug));
  const pager = `<nav class="cols pager pager-2" aria-label="More writing">
<div class="main pager-row">
${older ? `<a class="pager-prev" href="${u(older.url)}"><span class="pager-k">${ICON.back}Older</span><span class="pager-t">${older.title}</span></a>` : '<span></span>'}
${newer ? `<a class="pager-next" href="${u(newer.url)}"><span class="pager-k">Newer${ICON.arrow}</span><span class="pager-t">${newer.title}</span></a>` : '<span></span>'}
</div>
</nav>`;
  const main = `<div class="wrap">
<article class="post">
<header class="cols page-head post-head">
<div class="main">
<p class="crumb"><a href="${u('/blog/')}">${ICON.back}Writing</a></p>
<h1 class="title">${p.title}</h1>
<p class="post-meta"><time datetime="${p.date}">${longDate(p.date)}</time><span>${minutes(p.wordCount)} minute read</span><span>${fmtInt(p.wordCount)} words</span>${proj ? `<span>Part of <a href="${u(proj.url)}">${nameText(proj)}</a></span>` : ''}</p>
</div>
</header>
<div class="cols body-cols">
<div class="main prose">
${html}
</div>
</div>
</article>
${pager}
</div>`;
  write(p.url.replace(/^\//, '') + 'index.html', page({ title: text(p.title.replace(/&mdash;/g, '—')), desc: text(p.excerptHtml).slice(0, 200), active: 'writing', main, cls: 'is-post' }));
}

prepareOut();
home();
about();
projectsIndex();
// Each project page may bring its own design; anything without one is calm.
// A bespoke renderer returns its main markup plus the stylesheets and scripts it needs;
// it always sits inside the shared header and footer.
const bespoke = render => p => {
  const r = render(p, { posts, u, rewriteLinks, dims: DIMS, tagline: lines[p.slug] });
  write(`${p.slug}/index.html`, page({ title: nameText(p), desc: `${nameText(p)}: ${lines[p.slug]}`, active: 'work', main: r.main, cls: r.cls, styles: r.styles, scripts: r.scripts }));
};
const projectRenderers = {
  jelly: bespoke(renderJellyThread),
  harmonia: bespoke(renderHarmoniaDashboard),
  printer: bespoke(renderManualPrinter)
};
projects.forEach((p, i) => (projectRenderers[p.slug] || project)(p, i));

// the manual's stylesheet, scoped under .manual, with the book apparatus folded away
const MANUAL_OVERRIDES = `
/* no thumb tabs, so no gutter for them; the manual sits on the shell's measure */
.manual.manual { --tabw: 0px; background: var(--paper); }
.manual .band { margin-right: 0; padding-inline: var(--pad); margin-top: clamp(1.5rem, 1rem + 1.5vw, 2.5rem); }
.manual .band-in { grid-template-columns: minmax(0, 1fr); max-width: var(--max); margin-inline: auto; padding-inline: 0; }
.manual .home { max-width: calc(var(--max) + 2 * var(--pad)); margin-inline: auto; padding-inline: var(--pad); }
.manual .chap { padding-inline: var(--pad); }
.manual .see-i { width: 1em; height: 1em; vertical-align: -0.15em; }
/* the parts list sits under the drawing, beside the caption, so no balloon or leader can meet it at any p */
@media (min-width: 1001px) {
  .manual .stage .dwg-fig {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(15rem, 17rem);
    column-gap: 28px;
    align-items: start;
    width: min(100%, calc((100vh - 360px) * var(--ar)));
    min-width: min(100%, 44rem);
  }
  .manual .stage .dwg-fig > .dwg { grid-column: 1 / -1; }
  .manual .stage .dwg-fig > .parts-desk { position: static; grid-column: 2; grid-row: 2; width: auto; min-width: 0; margin-top: 14px; }
  .manual .stage .dwg-fig > figcaption { grid-column: 1; grid-row: 2; margin-top: 14px; }
}
`;
write('assets/printer.css', scopeCss(readFileSync(join(HERE, 'vendor/manual.css'), 'utf8'), '.manual', { fontBase: '/fonts/' }) + MANUAL_OVERRIDES);
blogIndex();
posts.forEach(post);

// ------------------------------------------------------------ logos, 404, feed, sitemap
function logos() {
  const main = `<div class="wrap">
<div class="cols page-head">
<div class="main">
<h1 class="title">Logos</h1>
<p class="standfirst">The EXCITING block, set in Brandon Grotesque on a black block turned four degrees.</p>
</div>
</div>
<div class="logos">
<figure class="logo-fig"><span class="logo logo-e"><span>E</span></span><figcaption>The single E</figcaption></figure>
<figure class="logo-fig"><span class="logo logo-big"><span>Exciting</span></span><figcaption>The full block</figcaption></figure>
<figure class="logo-fig logo-fig-inverse"><span class="logo logo-big logo-inverse"><span>Exciting</span></span><figcaption>Inverse, white on black</figcaption></figure>
</div>
</div>`;
  write('logos/index.html', page({ title: 'Logos', desc: 'The Exciting logo: the single E, the full EXCITING block and the inverse version.', main }));
}

function notFound() {
  const main = `<div class="wrap">
<div class="cols page-head">
<div class="main">
<h1 class="title">Page not found</h1>
<p class="standfirst">There’s nothing at this address. It may have moved when the site was rebuilt.</p>
</div>
</div>
<div class="cols body-cols">
<div class="main prose">
<ul>
<li><a href="/">The home page</a></li>
<li><a href="/projects/">Work</a>, including <a href="/jelly/">Jelly</a></li>
<li><a href="/blog/">Writing</a></li>
</ul>
<p>Or write to <a href="mailto:${C.site.email}">${C.site.email}</a>.</p>
</div>
</div>
</div>`;
  write('404.html', page({ title: 'Page not found', desc: 'There’s nothing at this address on exciting.io.', main }).replace(/<link rel="canonical"[^>]*>\n/, ''));
}

const xmlEsc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plainTitle = t => t.replace(/&mdash;/g, '—').replace(/&amp;/g, '&');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON3 = MONTHS.map(m => m.slice(0, 3));
function rfc822(iso) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})([+-]\d{2}):?(\d{2})$/);
  const [, y, mo, d, time, oh, om] = m;
  const day = DAYS[new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay()];
  return `${day}, ${d} ${MON3[+mo - 1]} ${y} ${time} ${oh}${om}`;
}
// full post content for the feed, with every site-relative link and image made absolute
function feedBody(html) {
  let h = html.replace(/<style[\s\S]*?<\/style>\s*/g, '').replace(/<script[\s\S]*?<\/script>\s*/g, '');
  h = h.replace(/(href|src)="([^"]*)"/g, (m, a, v) => {
    let x = a === 'href' ? rw(v) : v;
    if (x.startsWith('//')) x = 'https:' + x;
    if (x.startsWith('/')) x = ORIGIN + x;
    return `${a}="${x}"`;
  });
  return h.trim();
}

function feed() {
  const items = posts.map(p => `<item><title>${xmlEsc(plainTitle(p.title))}</title><description>${xmlEsc(feedBody(p.bodyHtml))}</description><pubDate>${rfc822(p.published)}</pubDate><link>${ORIGIN}${p.url}</link><guid isPermaLink="true">http://exciting.io${p.url}</guid></item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Exciting</title><description>${xmlEsc(C.site.strapline)}</description><link>${ORIGIN}/</link><atom:link href="${ORIGIN}/feed.xml" rel="self" type="application/rss+xml" />
${items}
</channel></rss>
`;
  writeFileSync(join(OUT, 'feed.xml'), xml.replace(/[ \t]+$/gm, ''));
}

function sitemap() {
  const pages = ['/', '/about/', '/projects/', ...projects.map(p => p.url), '/blog/', '/logos/'];
  const urls = [
    ...posts.map(p => `<url>\n<loc>${ORIGIN}${p.url}</loc>\n<lastmod>${p.published}</lastmod>\n</url>`),
    ...pages.map(p => `<url>\n<loc>${ORIGIN}${p}</loc>\n</url>`)
  ];
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  writeFileSync(join(OUT, 'robots.txt'), `Sitemap: ${ORIGIN}/sitemap.xml\n`);
}

logos();
notFound();
feed();
sitemap();
console.log(`built ${8 + posts.length + 2} pages, feed.xml, sitemap.xml and robots.txt into _site/`);
