// The Printer project page in the workshop manual's register, under the site shell.
// Geometry and the part model live in ./printer-drawing.mjs; the scroll scrub and the
// part, balloon and parts-list highlighting are /assets/printer.js. The book apparatus
// of the original manual design (chapters, folios, thumb tabs, section numbers) is gone.
import {
  Sheet, P, svgDefs, drawPrinter, chainLines, PRINTER_PARTS, PRINTER_D, PRINTER_ANCHORS, PRINTER_SCHED, PRINTER_VECS, useProjection
} from './printer-drawing.mjs';

const E0 = 0.4;
const r2 = n => (Math.round(n * 100) / 100).toString();
const pct = n => (Math.round(n * 10000) / 100).toString() + '%';
const esc = s => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (tag, name) => {
  const m = (' ' + tag).match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : '';
};

const easeW = (p, [a, b]) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const eAt = (p, k, sched) => E0 + (1 - E0) * easeW(p, sched[k]);

// the exploded sheet: parts, leader lines and balloons, with the data the scrub reads
function renderSheet({ id, build, balloons, gap = 22, partsTable = '', caption = '', label }) {
  useProjection(null);
  const sh = new Sheet();
  const { order, extra = '' } = build(sh);
  let b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const ee of [E0, 1]) {
    const bb = sh.bounds(order, ee);
    b = [Math.min(b[0], bb[0]), Math.min(b[1], bb[1]), Math.max(b[2], bb[2]), Math.max(b[3], bb[3])];
  }
  const vecs = key => PRINTER_VECS[key] || [];
  const placed = balloons.map(bl => {
    const d = bl.d || [0, 0, 0];
    const atE = ee => P(bl.a[0] + d[0] * ee, bl.a[1] + d[1] * ee, bl.a[2] + d[2] * ee);
    const atP = p => {
      const [x, y] = P(...bl.a);
      let [dx, dy] = [0, 0];
      for (const [v, k] of vecs(bl.n)) { const [sx, sy] = P(...v); const ee = eAt(p, k, PRINTER_SCHED); dx += sx * ee; dy += sy * ee; }
      return [x + dx, y + dy];
    };
    const mid = atP(0.5);
    return { ...bl, atE, atP, y: mid[1] + (bl.dy || 0) };
  });
  for (const side of ['l', 'r']) {
    const list = placed.filter(p => p.side === side).sort((a, c) => a.y - c.y);
    for (let i = 1; i < list.length; i++) if (list[i].y - list[i - 1].y < gap) list[i].y = list[i - 1].y + gap;
    for (const p of list) p.x = side === 'l' ? b[0] - 16 : b[2] + 16;
  }
  for (const p of placed) b = [Math.min(b[0], p.x - 8), Math.min(b[1], p.y - 8), Math.max(b[2], p.x + 8), Math.max(b[3], p.y + 8)];
  const pad = 6;
  const vb = [b[0] - pad, b[1] - pad, b[2] - b[0] + pad * 2, b[3] - b[1] + pad * 2];
  const sfx = '-' + id;
  const vAttr = key => vecs(key).map(([v, k]) => { const [x, y] = P(...v); return `${r2(x)},${r2(y)},${k}`; }).join(';');
  const groups = order.map(p => {
    const [dx, dy] = sh.dScreen(p, 1);
    const moving = dx || dy;
    const tr = moving ? ` transform="translate(${r2(dx)} ${r2(dy)})"` : '';
    const data = moving ? ` data-v="${vAttr(p.key)}"` : '';
    return `<g class="part" data-part="${p.key}"${data}${tr}>${p.out.join('')}</g>`;
  }).join('');
  const leaders = placed.map(p => {
    const [ax, ay] = p.atE(0);
    const [ex, ey] = p.atE(1);
    const data = vecs(p.n).length ? ` data-ax="${r2(ax)}" data-ay="${r2(ay)}" data-v="${vAttr(p.n)}"` : '';
    return `<line class="ldr" data-part="${p.n}" x1="${r2(p.x)}" y1="${r2(p.y)}" x2="${r2(ex)}" y2="${r2(ey)}"${data}/><circle class="ldr-dot" data-part="${p.n}" cx="${r2(ex)}" cy="${r2(ey)}" r="0.9"${data}/>`;
  }).join('');
  let svg = `<svg class="dwg-svg" viewBox="${vb.map(r2).join(' ')}" width="${r2(vb[2] * 3)}" height="${r2(vb[3] * 3)}" role="img" aria-label="${esc(label)}" focusable="false">${svgDefs(sfx)}${extra}${groups}<g class="ldrs">${leaders}</g></svg>`;
  svg = svg.replace(/url\(#ls-a\)/g, `url(#ls-a${sfx})`).replace(/url\(#ls-b\)/g, `url(#ls-b${sfx})`);
  const bals = placed.map(p => `<button type="button" class="bal" data-part="${p.n}" style="left:${pct((p.x - vb[0]) / vb[2])};top:${pct((p.y - vb[1]) / vb[3])}" aria-label="${esc(p.title)}">${p.n}</button>`).join('');
  const ar = vb[2] / vb[3];
  const sched = ` data-scrub data-e0="${E0}" data-sched="${Object.entries(PRINTER_SCHED).map(([k, [a, z]]) => `${k}:${a}:${z}`).join(';')}"`;
  return {
    ar,
    html: `<figure class="dwg-fig" id="${id}" data-dwg${sched}><div class="dwg" data-vb="${vb.map(r2).join(' ')}" style="aspect-ratio:${r2(vb[2])}/${r2(vb[3])};--ar:${r2(ar)}">${svg}<div class="bals">${bals}</div></div>${partsTable}<figcaption>${caption}</figcaption></figure>`
  };
}

// “See” points into the calm “Hello, Printer” post, by its own anchored headings
const SEE = { 2: 'a-simple-usable-thermal-printer', 3: 'a-simple-usable-thermal-printer', 5: 'bringing-graphics-to-the-printer', 6: 'moving-data-more-easily', 7: 'a-simple-usable-thermal-printer' };
const SHORT = { 1: 'Upper half', 2: 'Paper roll', 3: 'Mechanism', 4: 'Lower half', 5: 'Arduino', 6: 'Shield', 7: 'Lead' };
const SIDES = { 1: 'l', 2: 'r', 3: 'l', 4: 'l', 5: 'r', 6: 'r', 7: 'r' };
const CAPTIONS = { '/images/printer/printer.jpg': 'The Printer: thermal printer, Arduino and breadboard, with a printout of reminders, meetings and the weather' };
const ARROW = '<svg class="see-i" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10.5M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function printerSheet(hello, postHref) {
  const heads = Object.fromEntries([...hello.bodyHtml.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(m => [m[1], m[2].replace(/<[^>]+>/g, '')]));
  const balloons = PRINTER_PARTS.map(p => ({ n: p.n, a: PRINTER_ANCHORS[p.n], d: PRINTER_D[p.n], side: SIDES[p.n], dy: p.n === 2 ? 40 : 0, title: `Part ${p.n}, ${p.name}` }));
  const table = (sfx, cls) => {
    const rows = PRINTER_PARTS.map(p => {
      const id = SEE[p.n];
      const see = id && heads[id] ? `<a href="${postHref}#${id}" data-part="${p.n}" aria-label="Hello, Printer: ${esc(heads[id])}">${ARROW}</a>` : '<span aria-label="none">–</span>';
      return `<tr id="part-${sfx}${p.n}" data-part="${p.n}"><td class="pno">${p.n}</td><td><span class="pd">${p.name}</span>${p.note ? `<span class="pnote">${p.note}</span>` : ''}</td><td class="q">${p.qty}</td><td class="ref">${see}</td></tr>`;
    }).join('');
    return `<div class="parts ${cls}"><table class="spec parts-t"><caption>Parts list</caption><thead><tr><th scope="col">No.</th><th scope="col">Description</th><th scope="col">Qty</th><th scope="col">See</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };
  const pkey = `<ol class="pkey" aria-hidden="true">${PRINTER_PARTS.map(p => `<li data-part="${p.n}"><b>${p.n}</b> ${SHORT[p.n]}</li>`).join('')}</ol>`;
  const fig = renderSheet({
    id: 'printer-exploded',
    gap: 30,
    build: sh => {
      const order = drawPrinter(sh);
      return { order, extra: `<g class="chain">${chainLines(order)}</g>` };
    },
    balloons,
    partsTable: table('', 'parts-desk') + pkey,
    label: 'Exploded isometric drawing of the Printer: lid, paper roll, print mechanism and shell of the thermal printer, with the Arduino, its shield and the three-wire printer lead, each part numbered.',
    caption: '<b class="fno">Fig. 1</b> Printer, exploded view. Scroll to take it apart; point at a number to find the part. Not to scale. “See” opens the part’s section of “Hello, Printer”.'
  });
  fig.mobileTable = table('m', 'parts-mob');
  return fig;
}

function figureHtml({ src, alt = '', no, cap = '', dims }) {
  const [w, h] = dims[src] || dims[decodeURI(src)] || [640, 480];
  const words = alt || cap;
  return `<figure class="fig" id="fig-${no}" style="--w:${w}px;--ar:${r2(w / h)}"><img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" decoding="async"><figcaption><b class="fno">Fig. ${no}</b>${words ? ` ${words}` : ''}</figcaption></figure>`;
}

// the project body in manual dress: standfirst, numbered figures, an amendment on struck lines
function manualBody(html, { dims, rewriteLinks, figStart }) {
  let h = html;
  let fig = figStart - 1;
  h = h.replace(/^\s*((?:<h[23][^>]*>[\s\S]*?<\/h[23]>\s*)+)/, (m, hs) => {
    const lines = [...hs.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/g)].map(x => x[2]);
    return `<div class="standfirst">${lines.map((l, i) => `<p class="${i ? 'sf-2' : 'sf-1'}">${l}</p>`).join('')}</div>\n`;
  });
  h = h.replace(/<p>\s*(?:<a [^>]*>\s*)?(<img [^>]*>)\s*(?:<\/a>\s*)?<\/p>/g, (m, im) => {
    fig += 1;
    const src = attr(im, 'src');
    return figureHtml({ src, alt: attr(im, 'alt'), no: String(fig), cap: CAPTIONS[src], dims });
  });
  h = h.replace(/<p class="struck-note">/g, '<p class="struck-note"><b class="amend">Amendment</b> ');
  h = h.replace(/<p>\s*<\/p>/g, '');
  return { html: rewriteLinks(h), figs: fig - figStart + 1 };
}

export function renderManualPrinter(p, { posts, u, rewriteLinks, dims, tagline }) {
  const hello = posts.find(q => q.slug === 'hello-printer');
  const postHref = u(hello.url);
  const related = [...posts].filter(q => q.tags.includes('printer')).sort((a, b) => a.date.localeCompare(b.date));
  const first = related[0];
  const sheet = printerSheet(hello, postHref);
  const body = manualBody(p.bodyHtml, { dims, rewriteLinks, figStart: 2 });
  const purpose = p.title.split(' — ')[1];
  const source = p.links.find(l => /github\.com\/exciting-io\/[^/]+$/.test(l.href));
  const links = p.links.filter(l => !/twitter\.com/.test(l.href));
  const rows = [
    ['Purpose', purpose.charAt(0).toUpperCase() + purpose.slice(1)],
    p.updates && p.updates.length ? ['Bulletins', `<a href="#service-bulletin">${p.updates.length} service bulletin${p.updates.length > 1 ? 's' : ''}</a>`] : null,
    first ? ['Year', `<a href="${u(first.url)}">${first.date.slice(0, 4)}</a>, first described in “${first.title}”`] : null,
    source ? ['Source', `<a href="${source.href}">${source.href.replace('https://', '')}</a>`] : null,
    ['Links', `<ul class="links">${links.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}</ul>`],
    related.length ? ['Writing', `<ul class="links">${related.map(q => `<li><a href="${u(q.url)}">${q.title}</a></li>`).join('')}</ul>`] : null,
    ['Figures', `${body.figs + 1}`]
  ].filter(Boolean);
  const spec = `<table class="spec spec-side"><caption>Specification</caption><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;
  const bulletins = (p.updates || []).length ? `<div class="chap chap-project chap-bul">${p.updates.map((up, i) => `<section class="bulletin" id="${i ? `service-bulletin-${i + 1}` : 'service-bulletin'}" aria-labelledby="sb-h-${i}">
<h2 class="bul-h" id="sb-h-${i}"><span class="sn">SB ${i + 1}</span> <span>${up.title}</span></h2>
<div class="bul-b">
${rewriteLinks(up.html)}
<ul class="bul-l">${up.links.map(l => `<li><a href="${l.href}">${l.label}</a><span class="bul-s">${l.source}</span></li>`).join('')}</ul>
</div>
</section>`).join('\n')}</div>` : '';
  const main = `<div class="manual">
<section class="band">
<div class="band-in">
<div class="band-t">
<h1>${p.name}</h1>
<p class="band-sub">${tagline}</p>
</div>
</div>
</section>
<div class="home opener">
<section class="stage" aria-label="Exploded view">
<div class="stage-in">
<div class="sheet-frame" style="--ar:${r2(sheet.ar)}">
${sheet.html}
</div>
</div>
</section>
<aside class="front-side">
${spec}
${sheet.mobileTable}
</aside>
</div>
${bulletins}
<div class="chap chap-project chap-body">
<div class="prose">
${body.html}
</div>
</div>
</div>`;
  return { main, styles: [u('/assets/printer.css')], scripts: [u('/assets/printer.js')], cls: 'is-manual' };
}
