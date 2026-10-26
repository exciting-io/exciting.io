# How the site is built

`node site/build.mjs` builds the whole site. It has no dependencies.

## What a build does

1. **Empties `_site/`.** It then copies in, from the repo root, `CHECKS`, `Rakefile`, `favicon.ico`, `keybase.txt` and the Google verification file. It also copies `images/` to `_site/images/`, `site/fonts/` to `_site/fonts/` and `site/assets/` to `_site/assets/`.
2. **Writes every page:**
   - home, `/about/`, `/projects/`, `/blog/`, `/logos/` and `/404.html`;
   - a page for each project;
   - each post at `/YYYY/MM/DD/slug/`.
3. **Writes the feeds and indexes:**
   - `/feed.xml` (RSS 2.0, with full post content and absolute links; guids are kept as the old `http://exciting.io/...` permalinks so feed readers don’t show old posts again);
   - `/sitemap.xml`;
   - `/robots.txt`.
4. **Generates `/assets/printer.css`.** It scopes `site/vendor/manual.css` under `.manual` (see `scope-css.mjs`) and adds a few overrides.

## Content

`site/content.json` holds the site info, the about text, the projects and the posts. Projects appear in the order they are listed. Each post’s `published` field is its original timestamp, used for the feed and the sitemap. Post and project bodies are HTML. Internal links like `/printer` or `/2012/04/12/hello-printer/` are normalised to their trailing-slash URLs.

`site/image-dims.json` records the natural sizes of the images (taken with `sips`), so figures carry width and height. Re-run `sips` for any new image, or add its size to the project’s `images` entry in `content.json`.

## Page designs

- **The home page** is built by `renderers/landing.mjs` from the `home` block in `content.json`, styled by `assets/home.css` (scoped under `body.home`) and moved by `assets/home.js` (the phone menu, sections that rise in once, the tagline’s words lighting up). It follows the `landing-page-design` skill’s visual rules: Geist only, Tailwind type steps, a fixed spacing scale.
  - **“What we’re making now”** is `home.features.items`, in order of prominence: the first leads as a broad panel, any others sit side by side underneath at equal weight. A feature can name a project by `slug` in `project` (it then borrows the name, page, first screenshot and logo) or stand alone with its own `name`, `image` and links. Optional fields: `label` (e.g. “Main focus”), `theme` (`berry` tints it pink; otherwise neutral), `points`, `cta`, `more`, `quote`. Featured projects drop out of “Other things we’ve made” on their own.
  - Jelly’s price and trial terms and Brad Frost’s quote come from letsjelly.com; check them there when they change.
- **The default is calm:** `assets/shell.css` sets fonts, tokens, browser surfaces, the floating header bar with the tilted EXCITING block, the footer and the one moving part. `assets/nav.js` runs the bar’s phone menu on every page. `assets/calm.css` styles the pages themselves: headings in Geist, reading text in Literata.
- **`projectRenderers` in `build.mjs`** gives a project its own page design. Anything not listed gets the calm project page. Each bespoke renderer returns its main markup, stylesheets and scripts, and always sits inside the shared header and footer. Its CSS is scoped under its own root class:
  - **Printer:** `renderers/manual-printer.mjs`, scoped under `.manual`. It is the workshop-manual register: the exploded drawing comes apart as you scroll. The drawing geometry lives in `renderers/printer-drawing.mjs`, and the scroll and highlight script is `assets/printer.js`.
  - **Jelly:** `renderers/jelly-thread.mjs`, scoped under `.jt`. The story is told as a Jelly conversation, and `assets/jelly-thread.js` adds “Collapse all”.
  - **Harmonia:** `renderers/harmonia-dashboard.mjs`, scoped under `.hm`. The page is a Harmonia dashboard; `assets/harmonia-dashboard.js` marks tasks done in place.

## Fonts

All fonts are in `site/fonts/`:

- **Literata:** SIL OFL 1.1, `OFL-literata.txt`. The site’s reading face.
- **Geist:** SIL OFL 1.1, `OFL-geist.txt`. The header bar and footer everywhere, headings on the calm pages, and all of the home page.
- **Brandon Grotesque Regular:** licensed. The EXCITING logotype only.
- **Archivo:** SIL OFL 1.1, `OFL-archivo.txt`. The Printer page only.
- **Figtree:** SIL OFL 1.1, `OFL-figtree.txt`. The Jelly page only.
- **Public Sans:** SIL OFL 1.1, `LICENSE-public-sans.md`. The Harmonia page only.
