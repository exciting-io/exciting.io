// Jelly's page told as a Jelly conversation: the opening email, the backstory as
// internal comments out of sight of customers, and a Reply that is the call to action.
// Every word is Jelly's own copy from content.json; the only dates are sourced ones.

const SOURCED = {
  launch: { iso: '2024-07-10', label: 'Jul 10, 2024', title: 'Say hello to Jelly', href: 'https://goodenough.us/posts/say-hello-to-jelly-the-simplest-way-to-jam-on-email-as-a-team' },
  reorg: { iso: '2025-11-24', label: 'Nov 24, 2025', title: 'Good Enough Is Reorganizing', href: 'https://goodenough.us/posts/good-enough-is-reorganizing' }
};

const esc = s => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// drawn, one stroke weight, all decorative
const I = {
  inbox: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 11.5V15a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 17 15v-3.5M3 11.5 5.2 4.6A1.5 1.5 0 0 1 6.6 3.5h6.8a1.5 1.5 0 0 1 1.4 1.1L17 11.5M3 11.5h4l1 2h4l1-2h4"/></svg>',
  hand: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7 10V4.5a1.2 1.2 0 0 1 2.4 0V9m0-.5V3.3a1.2 1.2 0 0 1 2.4 0V9m0-4.2a1.2 1.2 0 0 1 2.4 0V10m0-3a1.2 1.2 0 0 1 2.4 0v4.5A6 6 0 0 1 10.6 17.5h-.4a5.6 5.6 0 0 1-4.3-2L3.4 12.4a1.2 1.2 0 0 1 1.8-1.6L7 12.5"/></svg>',
  caret: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5.5 8 4.5 4.5L14.5 8"/></svg>',
  archive: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 4.5h14v3H3zM4.5 7.5v8h11v-8M8 10.5h4"/></svg>',
  label: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3.5 3.5h6.2l7 7-6.2 6.2-7-7zM7 7h.01"/></svg>',
  more: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 10h.01M10 10h.01M15.5 10h.01" stroke-width="2.6"/></svg>',
  reply: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M8 5 3.5 9.5 8 14M3.5 9.5h7.5a5 5 0 0 1 5 5v1"/></svg>',
  collapse: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m6 3.5 4 4 4-4M6 16.5l4-4 4 4"/></svg>',
  note: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 4.5h12v8.5H9l-4 3v-3H4z"/></svg>',
  back: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M16 10H4.5M9 5.5 4.5 10 9 14.5"/></svg>'
};

// split the body into its sections: intro, then one per h2
function sections(html) {
  const out = [{ heading: '', paras: [] }];
  for (const m of html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>|<p>([\s\S]*?)<\/p>/g)) {
    if (m[1] !== undefined) out.push({ heading: m[1], paras: [] });
    else out[out.length - 1].paras.push(m[2]);
  }
  return out;
}

// a linked Good Enough becomes a mention chip, as teammates appear in Jelly
const mentions = h => h.replace(/<a href="(https:\/\/goodenough\.us)">Good Enough<\/a>/g, '<a class="jt-mention" href="$1">Good Enough</a>');

export function renderJellyThread(p, { u }) {
  const [intro, ...rest] = sections(p.bodyHtml);
  const shots = p.images || [];
  const author = '<span class="jt-av jt-av-ja" aria-hidden="true">JA</span>';
  const comment = (body, i, date) => `<li class="jt-item jt-comment">
${author}
<details class="jt-bubble" open>
<summary><span class="jt-who">James Adam</span>${date ? `<a class="jt-date" href="${date.href}" title="${esc(date.title)}"><time datetime="${date.iso}">${date.label}</time></a>` : ''}<span class="jt-peek" aria-hidden="true">${body.replace(/<[^>]+>/g, '').slice(0, 72)}…</span></summary>
<div class="jt-text"><p>${mentions(body)}</p></div>
</details>
</li>`;
  const event = (heading, id) => `<li class="jt-item jt-event"><span class="jt-ev-i">${I.note}</span><h2 id="${id}">${heading}</h2></li>`;
  const slug = h => h.replace(/<[^>]+>/g, '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const attachments = shots.length ? `<div class="jt-attach">
<p class="jt-attach-h">${shots.length} attachments</p>
<ul class="jt-files">
${shots.map(im => `<li><a href="${im.src}"><img src="${im.src}" alt="${esc(im.alt)}" width="${im.width}" height="${im.height}" loading="lazy" decoding="async"><span class="jt-cap">${im.alt}</span></a></li>`).join('\n')}
</ul>
</div>` : '';

  const thread = [];
  thread.push(`<li class="jt-item jt-email">
<article class="jt-card" aria-label="Email from Exciting">
<header class="jt-card-h">
<span class="jt-av jt-av-ex" aria-hidden="true">EX</span>
<div class="jt-from"><p><b>Exciting</b> <span class="jt-addr">&lt;hello@exciting.io&gt;</span></p><p class="jt-to">to: you</p></div>
<p class="jt-meta"><a class="jt-date" href="${SOURCED.launch.href}" title="${esc(SOURCED.launch.title)}"><time datetime="${SOURCED.launch.iso}">${SOURCED.launch.label}</time></a><span class="jt-icons" aria-hidden="true">${I.reply}${I.more}</span></p>
</header>
<div class="jt-card-b">
${intro.paras.map(t => `<p>${t}</p>`).join('\n')}
${attachments}
</div>
</article>
</li>`);
  for (const s of rest) {
    const id = slug(s.heading);
    thread.push(event(s.heading, id));
    s.paras.forEach((t, i) => thread.push(comment(t, i, /restructured/.test(t) ? SOURCED.reorg : null)));
  }

  const main = `<div class="jt">
<div class="jt-col">
<p class="jt-crumb"><a href="${u('/projects/')}">${I.back}Work</a></p>
<header class="jt-head">
<img class="jt-berry" src="${p.logo.src}" alt="Jelly’s mascot, a hand-drawn strawberry" width="${p.logo.width}" height="${p.logo.height}">
<h1>${p.tagline}</h1>
<p class="jt-chips"><span class="jt-chip">${I.inbox}Jelly</span><span class="jt-chip">${I.inbox}Shared inbox</span><span class="jt-chip jt-chip-green">Current</span></p>
<div class="jt-actions" aria-hidden="true"><span class="jt-assign">${I.hand}<span class="jt-av jt-av-ja jt-av-s">JA</span>James A.${I.caret}</span><span class="jt-sep"></span><span class="jt-act">${I.archive}Archive<kbd>E</kbd></span><span class="jt-act">${I.label}Label${I.caret}</span><span class="jt-act">${I.more}</span></div>
</header>
<p class="jt-tools"><button type="button" class="jt-collapse" hidden>${I.collapse}<span>Collapse all</span></button></p>
<ol class="jt-thread">
${thread.join('\n')}
</ol>
<div class="jt-foot">
<a class="jt-reply" href="${esc(p.primaryLink.href)}">${I.reply}${p.primaryLink.label}</a>
<a class="jt-mail" href="mailto:hello@exciting.io">Reply to hello@exciting.io</a>
</div>
</div>
</div>`;
  return { main, styles: [u('/assets/jelly-thread.css')], scripts: [u('/assets/jelly-thread.js')], cls: 'is-bespoke jelly' };
}
