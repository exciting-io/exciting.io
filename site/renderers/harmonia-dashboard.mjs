// Harmonia's page as a Harmonia dashboard. The tasks are this page's own sections,
// framed as tasks for the reader; nothing here is invented team data.
// The dashboard sits in a browser window at harmonia.io, so it reads as Harmonia itself.

import { browserWindow } from './browser-window.mjs';

const esc = s => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BACK = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M16 10H4.5M9 5.5 4.5 10 9 14.5"/></svg>';
const TICK = '<svg class="hm-tick" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m4.5 10.5 3.5 3.5 7.5-8"/></svg>';

export function renderHarmoniaDashboard(p, { u }) {
  const h = p.bodyHtml;
  const h2 = (h.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '';
  const h3 = (h.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || '';
  const paras = [...h.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => m[1]).filter(t => !/<img/.test(t));
  const visit = p.links.find(l => /^Visit/.test(l.label));
  const blog = p.links.find(l => /blog/i.test(l.label));
  const note = (p.statusNote || '').replace('harmonia.io', `<a href="${visit.href}">harmonia.io</a>`);

  const you = { av: '<span class="hm-av hm-av-you" aria-hidden="true">You</span>', name: 'You' };
  const exciting = { av: '<span class="hm-av hm-av-ex" aria-hidden="true">EX</span>', name: 'Exciting' };
  const tasks = [
    { id: 'read', who: you, title: `Read: ${h2}`, due: 'your own time', body: `<p class="hm-quote">“${h3}”</p>` },
    { id: 'problem', who: you, title: 'Understand the problem', due: 'a minute or two', body: `<p class="hm-quote">“${paras[0]}”</p>` },
    { id: 'visit', who: you, title: 'Visit harmonia.io', due: 'no particular hurry', body: `<p class="hm-quote">“${p.statusNote}”</p><p class="hm-go"><a href="${visit.href}">harmonia.io</a>${blog ? ` · <a href="${blog.href}">the Harmonia blog</a>` : ''}</p>` }
  ];
  const theirs = [
    { id: 'answer', who: exciting, title: 'See how Harmonia helps', due: 'good time', body: `<p class="hm-quote">“${paras[1]}”</p>` }
  ];
  // a current Harmonia card: assignee and due date in a grey strip, a light blue title, Done! bottom right
  const card = t => `<li class="hm-task" id="task-${t.id}" data-slug="${t.id}">
<article class="hm-card" aria-labelledby="task-${t.id}-t">
<header class="hm-strip">
<p class="hm-who">${t.who.av}<b><span class="hm-vh">Assigned to </span>${t.who.name}</b></p>
<p class="hm-due">Due in <b>${t.due}</b></p>
</header>
<div class="hm-in-card">
<h3 class="hm-t">${TICK}<span id="task-${t.id}-t">${t.title}</span></h3>
<div class="hm-body">${t.body}</div>
<p class="hm-act"><span class="hm-done-note" aria-hidden="true">Done</span><button type="button" class="hm-btn" hidden aria-describedby="task-${t.id}-t">Done!</button></p>
</div>
</article>
</li>`;

  const main = `<div class="hm">
<div class="hm-in">
<p class="hm-crumb"><a href="${u('/projects/')}">${BACK}Work</a></p>
${browserWindow('harmonia.io', `<header class="hm-bar">
<h1 class="hm-brand"><img src="/images/harmonia/logo.png" alt="" width="100" height="100">Harmonia</h1>
<nav class="hm-nav" aria-label="Harmonia"><a href="${visit.href}">harmonia.io</a>${blog ? `<a href="${blog.href}">Blog</a>` : ''}</nav>
</header>
<p class="hm-live"><span class="hm-dot" aria-hidden="true"></span><span>${note}</span></p>
<section class="hm-sec" aria-labelledby="hm-mine-h">
<h2 id="hm-mine-h">Your tasks</h2>
<ul class="hm-grid" data-list="mine">
${tasks.map(card).join('\n')}
</ul>
</section>
<section class="hm-sec" aria-labelledby="hm-else-h">
<h2 id="hm-else-h">Everyone else</h2>
<ul class="hm-grid" data-list="else">
${theirs.map(card).join('\n')}
</ul>
</section>
<p class="hm-status" role="status" aria-live="polite"></p>`)}
</div>
</div>`;
  return { main, styles: [u('/assets/harmonia-dashboard.css')], scripts: [u('/assets/harmonia-dashboard.js')], cls: 'is-bespoke harmonia' };
}
