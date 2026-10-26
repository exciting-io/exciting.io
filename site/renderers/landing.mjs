// The home page: the studio, what it is making now, and everything else it has made.
// "What we're making now" is the ordered list in content.json home.features: the first entry
// leads (Jelly, today), any others sit beside each other underneath at equal weight. A feature
// may point at a project by slug, borrowing its name, page, screenshot and logo, or stand alone
// with its own. Projects that aren't featured fall through to "Other things we've made".
// Styles are scoped under body.home in assets/home.css.

// Phosphor icons (regular weight), drawn on their 256 grid
const ph = (d, cls = '') => `<svg class="lp-i${cls ? ' ' + cls : ''}" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const ICON = {
  arrow: ph('M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z'),
  check: ph('M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z')
};

const amp = h => h.replace(/&(?!amp;)/g, '&amp;');
const btn = (cta, cls = '') => `<a class="lp-btn${cls ? ' ' + cls : ''}" href="${amp(cta.href)}">${cta.label}${ICON.arrow}</a>`;
const more = (link, u) => `<a class="lp-more" href="${amp(/^https?:/.test(link.href) ? link.href : u(link.href))}">${link.label}${ICON.arrow}</a>`;
const lineSpans = lines => lines.map(l => `<span class="lp-line">${l}</span>`).join(' ');
const words = lines => lines.map(l => `<span class="lp-line">${l.split(' ').map(w => `<span class="lp-word">${w}</span>`).join(' ')}</span>`).join(' ');
const pic = (im, { eager = false, cls = '' } = {}) => `<img${cls ? ` class="${cls}"` : ''} src="${im.src}" alt="${(im.alt || '').replace(/"/g, '&quot;')}" width="${im.width}" height="${im.height}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;

export function renderLanding({ C, projects, posts, u, liveNote, laterNote, nameHtml, projImg, minutes, dims }) {
  const H = C.home;

  // a feature, filled out from its project where it has one
  const features = H.features.items.map(f => {
    const p = f.project ? projects.find(x => x.slug === f.project) : null;
    const [w, h] = p && p.bannerImage && dims[p.bannerImage] ? dims[p.bannerImage] : [];
    const image = f.image || (p && p.images && p.images[0]) || (p && w ? { src: p.bannerImage, width: w, height: h, alt: '' } : null);
    return {
      ...f,
      slug: p ? p.slug : '',
      name: f.name || (p ? p.name : ''),
      logo: f.logo || (p && p.logo) || null,
      image,
      more: f.more || (p ? { label: `More about ${p.name}`, href: p.url } : null)
    };
  });
  const featured = new Set(features.map(f => f.slug).filter(Boolean));
  const [lead, ...rest] = features;

  const hero = `<section class="lp-hero lp-wrap" aria-labelledby="lp-hero-h">
<h1 class="lp-h1" id="lp-hero-h">${lineSpans(H.hero.lines)}</h1>
<p class="lp-standfirst">${H.hero.standfirst}</p>
</section>`;

  const label = f => f.label ? `<p class="lp-label">${f.label}</p>` : '';
  const points = f => f.points && f.points.length ? `<ul class="lp-points">
${f.points.map(p => `<li>${ICON.check}${p}</li>`).join('\n')}
</ul>` : '';
  const actions = f => {
    const links = [f.cta ? btn(f.cta) : '', f.more ? more(f.more, u) : ''].filter(Boolean).join('');
    return links ? `<p class="lp-actions">${links}</p>${f.ctaNote ? `<p class="lp-cta-note">${f.ctaNote}</p>` : ''}` : '';
  };
  const quote = f => f.quote ? `<figure class="lp-quote">
<blockquote><p>${f.quote.text}</p></blockquote>
<figcaption><span class="lp-q-name">${f.quote.name}</span>, ${f.quote.org}</figcaption>
</figure>` : '';
  const theme = f => f.theme ? ` lp-theme-${f.theme}` : '';

  // the lead: words on one side, the thing itself on the other
  const leadHtml = lead ? `<article class="lp-lead${theme(lead)}${lead.image ? ' has-image' : ''}" aria-labelledby="lp-f-${lead.slug || 0}">
<div class="lp-lead-text">
${label(lead)}
<h3 class="lp-lead-name" id="lp-f-${lead.slug || 0}">${lead.logo ? pic({ ...lead.logo, alt: '' }, { cls: 'lp-logo', eager: true }) : ''}${lead.name}</h3>
<p class="lp-lead-line">${lead.line}</p>
${points(lead)}
${actions(lead)}
${quote(lead)}
</div>
${lead.image ? `<div class="lp-lead-shot"><div class="lp-frame">${pic(lead.image, { eager: true })}</div></div>` : ''}
</article>` : '';

  // the rest of what's current, side by side at equal weight, however many there are
  const restHtml = rest.length ? `<div class="lp-also" data-count="${rest.length}">
${rest.map((f, i) => `<article class="lp-feat${theme(f)}" aria-labelledby="lp-f-${f.slug || i + 1}">
${f.image ? `<div class="lp-feat-shot">${pic(f.image)}</div>` : ''}
<div class="lp-feat-text">
${label(f)}
<h3 class="lp-h3" id="lp-f-${f.slug || i + 1}">${f.name}</h3>
<p>${f.line}</p>
${actions(f)}
</div>
</article>`).join('\n')}
</div>` : '';

  const now = `<section class="lp-section lp-wrap lp-now" aria-labelledby="lp-now-h">
<h2 class="lp-h2 lp-quiet-h" id="lp-now-h">${H.features.heading}</h2>
${leadHtml}
${restHtml}
</section>`;

  const tagline = `<section class="lp-section lp-wrap lp-tagline" aria-label="What we care about">
<p class="lp-big" data-reveal-words>${words(H.tagline.lines)}</p>
<p class="lp-tag-more"><a href="${u(H.tagline.link.href)}">${H.tagline.link.label}${ICON.arrow}</a></p>
</section>`;

  const others = projects.filter(p => !featured.has(p.slug));
  const work = others.length ? `<section class="lp-section lp-wrap" aria-labelledby="lp-work-h">
<div class="lp-row-head lp-reveal">
<div>
<h2 class="lp-h2" id="lp-work-h">${H.work.heading}</h2>
<p class="lp-lede">${H.work.standfirst}</p>
</div>
<a class="lp-more" href="${u('/projects/')}">All the work${ICON.arrow}</a>
</div>
<div class="lp-work">
${others.map(p => `<article class="lp-proj lp-reveal">
<a class="lp-proj-shot" href="${u(p.url)}" tabindex="-1" aria-hidden="true">${projImg(p)}</a>
<h3 class="lp-h3"><a href="${u(p.url)}">${nameHtml(p)}</a></h3>
<p>${H.workTaglines[p.slug]}</p>
${liveNote(p, 'lp-proj-note')}${laterNote(p).replace('proj-later', 'lp-proj-note')}
</article>`).join('\n')}
</div>
</section>` : '';

  const writing = `<section class="lp-section lp-wrap lp-reveal" aria-labelledby="lp-writing-h">
<div class="lp-row-head">
<h2 class="lp-h2" id="lp-writing-h">${H.writing.heading}</h2>
<a class="lp-more" href="${u('/blog/')}">${H.writing.more}${ICON.arrow}</a>
</div>
<ul class="lp-posts">
${posts.map(p => `<li><a href="${u(p.url)}">${p.title}</a><span>${minutes(p.wordCount)} min</span></li>`).join('\n')}
</ul>
</section>`;

  return {
    main: [hero, now, tagline, work, writing].join('\n'),
    preloads: [],
    styles: [u('/assets/home.css')],
    scripts: [u('/assets/home.js')],
    cls: 'home'
  };
}
